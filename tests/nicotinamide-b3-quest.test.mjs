// Run with: node tests/nicotinamide-b3-quest.test.mjs

import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import ObjectiveRegistry
    from "../src/app/ObjectiveRegistry.js";
import QuestCatalog
    from "../src/app/QuestCatalog.js";
import QuestManager
    from "../src/app/QuestManager.js";
import { VitaminQuestCatalog }
    from "../src/app/VitaminQuestCatalog.js";

const storage = new Map();
globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) =>
        storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
};

const quest =
    VitaminQuestCatalog.synthesize_b3;

assert.equal(QuestCatalog[quest.id], quest);
assert.equal(quest.title, "Synthesize B3");
assert.equal(quest.rewards.xp, 100);
assert.deepEqual(
    quest.objectives[0].moleculeIds,
    ["Nicotinamide"]
);

gameState.registry.quests ??= {};
gameState.registry.quests.unlock_molecule_lab = {
    status: "claimed",
    readyAtMs: 1,
    claimedAtMs: 2,
    viewedAtMs: 2,
    activatedAtMs: 1,
    objectiveBaselines: {}
};
gameState.zones.moleculeLab.state.synthesized = {};
gameState.player.xp = 0;

QuestManager.initialize();
assert.equal(
    QuestManager.getQuestStatus(quest.id)
        .claimable,
    false
);

gameState.zones.moleculeLab.state
    .synthesized.Nicotinamide = {
        count: 1,
        firstSynthesizedAtMs: 10,
        lastSynthesizedAtMs: 10
    };

const progress = ObjectiveRegistry.evaluate({
    objective: quest.objectives[0]
});
assert.equal(progress.complete, true);

QuestManager.reconcileAll();
assert.equal(
    QuestManager.getQuestStatus(quest.id)
        .claimable,
    true
);

const historyBeforeClaim = structuredClone(
    gameState.zones.moleculeLab.state
        .synthesized
);
const claim =
    QuestManager.claimQuest(quest.id);

assert.equal(claim.claimed, true);
assert.equal(gameState.player.xp, 100);
assert.deepEqual(
    gameState.zones.moleculeLab.state
        .synthesized,
    historyBeforeClaim
);
assert.equal(
    QuestManager.claimQuest(quest.id)
        .reason,
    "already-claimed"
);

console.log(
    "PASS: Synthesize B3 recognizes prior Nicotinamide synthesis, awards 100 XP once, and does not consume the molecule record."
);
