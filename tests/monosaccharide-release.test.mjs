// Run with: node tests/monosaccharide-release.test.mjs
// Uses only an in-memory save store; never opens browser/player saves.
import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import GameStateObserver from "../src/app/GameStateObserver.js";
import QuestManager from "../src/app/QuestManager.js";
import QuestCatalog from "../src/app/QuestCatalog.js";
import ObjectiveRegistry from "../src/app/ObjectiveRegistry.js";
import RewardRegistry from "../src/app/RewardRegistry.js";
import ResourceManager from "../src/app/ResourceManager.js";
import SaveManager from "../src/app/SaveManager.js";
import VersionManager from "../src/app/VersionManager.js";
import MoleculeRecipeCatalog from "../src/data/MoleculeRecipeCatalog.js";
import { monosaccharideLibrary } from "../src/data/monosaccharideLibrary.js";
import { MonosaccharideQuestCatalog } from "../src/app/MonosaccharideQuestCatalog.js";

const storage = new Map();
let rejectWrites = false;
globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem(key, value) {
        if (rejectWrites) throw new Error("Test: storage write rejected");
        storage.set(key, String(value));
    },
    removeItem: key => storage.delete(key)
};
const originalLog = console.log;
const originalError = console.error;
console.log = () => {};
console.error = () => {};

try {
    const awards = Object.values(MonosaccharideQuestCatalog);
    assert.deepEqual(awards.map(q => q.rewards.xp), [500, 750, 1000, 500]);
    assert.deepEqual(awards.map(q => q.objectives[0].target), [4, 7, 12, 3]);
    assert.equal(Object.keys(monosaccharideLibrary).length, 26);
    const listedIds = awards.flatMap(q => q.objectives[0].moleculeIds);
    assert.equal(new Set(listedIds).size, 26);
    const nominalAtomicMass = { H: 1, C: 12, N: 14, O: 16, P: 31, S: 32 };
    for (const [tier, award] of awards.entries()) {
        for (const id of award.objectives[0].moleculeIds) {
            const definition = MoleculeRecipeCatalog.get(id);
            const model = monosaccharideLibrary[id];
            assert(definition?.implemented, id);
            assert.equal(definition.tier, tier, id);
            assert.deepEqual(definition.parents, tier === 3 ? ["CO2", "H2O", "NH3"] : ["CO2", "H2O"]);
            const expectedDurationSeconds = Object.entries(nominalAtomicMass)
                .reduce((total, [symbol, mass]) => total + (model[symbol] ?? 0) * mass, 0);
            assert.equal(definition.durationMs, expectedDurationSeconds * 1000, `${id}: synthesis duration`);
            const atomCounts = {};
            model.atoms.forEach(atom => {
                atomCounts[atom.type] = (atomCounts[atom.type] ?? 0) + 1;
                assert.equal(atom.position.length, 3, id);
                assert(atom.position.every(Number.isFinite), id);
            });
            for (const symbol of ["C", "H", "O", "N", "P", "S"]) {
                assert.equal(atomCounts[symbol] ?? 0, model[symbol] ?? 0, `${id}: ${symbol}`);
            }
            const seen = new Set([0]);
            const queue = [0];
            const edges = new Set();
            for (const bond of model.bonds) {
                assert(Number.isInteger(bond.a) && Number.isInteger(bond.b), id);
                assert(bond.a >= 0 && bond.b >= 0 && bond.a < model.atoms.length && bond.b < model.atoms.length, id);
                assert.notEqual(bond.a, bond.b, id);
                const key = [bond.a, bond.b].sort((a, b) => a - b).join(":");
                assert(!edges.has(key), `${id}: duplicate bond`);
                edges.add(key);
            }
            while (queue.length) {
                const node = queue.pop();
                for (const bond of model.bonds) {
                    const other = bond.a === node ? bond.b : bond.b === node ? bond.a : null;
                    if (other !== null && !seen.has(other)) { seen.add(other); queue.push(other); }
                }
            }
            assert.equal(seen.size, model.atoms.length, `${id}: disconnected atom`);
        }
    }

    // A pre-update save: no sugar quest records, an existing Glucose synthesis,
    // existing identity/progression and already claimed early quests.
    const legacy = structuredClone(gameState);
    legacy.saveVersion = VersionManager.getCurrentVersion();
    legacy.player.id = "legacy-player";
    legacy.player.name = "Legacy Test";
    legacy.player.xp = 1700;
    legacy.registry.resources.atp = { current: 23, maximum: 50 };
    legacy.zones.moleculeLab.state.synthesized = {
        Glucose: { count: 1, firstCompletedAtMs: 100, lastCompletedAtMs: 100 }
    };
    for (const id of ["q1_particles", "q2_hydrogen", "unlock_molecule_lab"]) {
        legacy.registry.quests[id] = { status: "claimed", claimedAtMs: 100, activatedAtMs: 50 };
    }
    const originalIdentity = structuredClone(legacy.player);
    const originalHistory = structuredClone(legacy.zones.moleculeLab.state.synthesized);
    storage.set("ECGame_Save", JSON.stringify(legacy));
    assert.equal(SaveManager.load(), true);
    QuestManager.initialize();
    assert.deepEqual(gameState.player, originalIdentity);
    assert.deepEqual(gameState.zones.moleculeLab.state.synthesized, originalHistory);
    assert.deepEqual(ResourceManager.getATPStatus(), { current: 23, maximum: 50 });
    assert.equal(ObjectiveRegistry.evaluate({objective: awards[2].objectives[0]}).current, 1);
    assert.equal(QuestManager.claimQuest(awards[0].id).claimed, false);

    const history = () => gameState.zones.moleculeLab.state.synthesized;
    // Discovery alone and repeated copies must not complete the set.
    gameState.discoveries.molecules.G3P = { count: 100 };
    history().G3P = { count: 100 };
    assert.equal(ObjectiveRegistry.evaluate({objective: awards[0].objectives[0]}).current, 1);
    history().DHAP = { count: NaN };
    assert.equal(ObjectiveRegistry.evaluate({objective: awards[0].objectives[0]}).current, 1);

    // Later tiers can already be synthesized, but rewards stay sequential.
    for (const award of awards.slice(1)) {
        for (const id of award.objectives[0].moleculeIds) history()[id] = { count: 1 };
    }
    assert.equal(QuestManager.claimQuest(awards[1].id).reason, "quest-inactive");

    let expectedXP = 1700;
    for (const [tier, award] of awards.entries()) {
        // Historical completions before activation must count once unlocked.
        for (const id of award.objectives[0].moleculeIds) history()[id] = { count: 1 };
        GameStateObserver.notify("molecule-synthesized", { moleculeId: award.objectives[0].moleculeIds.at(-1) });
        assert.equal(QuestManager.getQuestStatus(award.id).claimable, true);
        if (tier === 0) {
            const xpBefore = gameState.player.xp;
            const atpBefore = ResourceManager.getATPStatus();
            rejectWrites = true;
            assert.equal(QuestManager.claimQuest(award.id).claimed, false);
            rejectWrites = false;
            assert.equal(gameState.player.xp, xpBefore);
            assert.deepEqual(ResourceManager.getATPStatus(), atpBefore);
            assert.equal(QuestManager.getQuestStatus(award.id).claimable, true);
        }
        assert.equal(QuestManager.claimQuest(award.id).claimed, true);
        expectedXP += award.rewards.xp;
        assert.equal(gameState.player.xp, expectedXP);
        assert.deepEqual(ResourceManager.getATPStatus(), { current: 23, maximum: 50 + (tier + 1) * 5 });
        assert.equal(QuestManager.claimQuest(award.id).reason, "already-claimed");
        assert.equal(SaveManager.load(), true);
        assert.equal(QuestManager.claimQuest(award.id).reason, "already-claimed");
        assert.equal(gameState.player.xp, expectedXP);
    }
    assert.equal(gameState.player.xp, 4450);
    assert.equal(ResourceManager.getATPStatus().maximum, 70);
    assert.equal(gameState.player.id, "legacy-player");

    // Malformed reward or a later failed handler must leave no capacity/XP gain.
    const before = ResourceManager.getATPStatus();
    assert.throws(() => RewardRegistry.applyAll({ atpCapacity: -1 }));
    assert.throws(() => RewardRegistry.applyAll({ atpCapacity: 5, unknownTestReward: 1 }));
    assert.deepEqual(ResourceManager.getATPStatus(), before);
    for (const award of awards) {
        assert.equal(QuestCatalog[award.id], award);
        assert.equal(QuestManager.getRecord(award.id).status, "claimed");
    }
} finally {
    console.log = originalLog;
    console.error = originalError;
}
console.log("PASS: 26 recipes, molecular-mass timing, tier/parent mapping, graph/formula checks, legacy save, distinct synthesis sets, four rewards, save-failure rollback, and reload/duplicate-claim protection.");
