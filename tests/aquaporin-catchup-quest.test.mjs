// Run with: node tests/aquaporin-catchup-quest.test.mjs
// Uses only an in-memory save store; never opens browser/player saves.

import assert from "node:assert/strict";
import fs from "node:fs";
import gameState from "../src/app/GameState.js";
import GameStateManager from "../src/app/GameStateManager.js";
import ObjectiveRegistry from "../src/app/ObjectiveRegistry.js";
import QuestCatalog from "../src/app/QuestCatalog.js";
import QuestManager from "../src/app/QuestManager.js";
import RewardRegistry from "../src/app/RewardRegistry.js";
import SaveManager from "../src/app/SaveManager.js";
import { MacromolecularQuestCatalog }
    from "../src/app/MacromolecularQuestCatalog.js";

const backup = structuredClone(gameState);
const storage = new Map();

globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
};

try {
    const quest =
        MacromolecularQuestCatalog
            .protein_building_blocks;

    assert.equal(
        QuestCatalog[quest.id],
        quest
    );
    assert.deepEqual(
        quest.prerequisites,
        ["unlock_macromolecularizer"]
    );
    assert.equal(quest.rewards.xp, 1000);
    assert.deepEqual(
        quest.rewards.discoveries,
        ["aquaporin"]
    );
    assert.deepEqual(
        quest.objectives.map(objective =>
            objective.productId
        ),
        ["H_helix", "B_sheet", "L_loop"]
    );

    gameState.registry.discoveries = [];
    gameState.player.xp = 250;
    gameState.registry.quests ??= {};
    gameState.registry.quests
        .unlock_macromolecularizer = {
            status: "claimed",
            readyAtMs: 1,
            claimedAtMs: 2,
            viewedAtMs: 2,
            activatedAtMs: 1,
            objectiveBaselines: {}
        };

    const inventory =
        gameState.zones.macromolecularizer
            .state.motifInventory;
    inventory.H_helix = 1;
    inventory.B_sheet = 1;
    inventory.L_loop = 0;

    const inventoryBefore =
        structuredClone(inventory);
    const firstTwo = quest.objectives.slice(0, 2)
        .map(objective =>
            ObjectiveRegistry.evaluate({ objective })
        );
    assert(firstTwo.every(progress =>
        progress.complete &&
        progress.consumed === false
    ));
    assert.equal(
        ObjectiveRegistry.evaluate({
            objective: quest.objectives[2]
        }).complete,
        false
    );
    assert.deepEqual(inventory, inventoryBefore);

    // A later reward failure must roll back a newly granted discovery.
    assert.throws(() =>
        RewardRegistry.applyAll({
            discoveries: ["aquaporin"],
            unknownTestReward: 1
        })
    );
    assert.equal(
        GameStateManager.hasDiscovery("aquaporin"),
        false
    );

    QuestManager.initialize();
    assert.equal(
        QuestManager.getQuestStatus(quest.id)
            .claimable,
        false
    );

    inventory.L_loop = 1;
    QuestManager.reconcileAll();
    assert.equal(
        QuestManager.getQuestStatus(quest.id)
            .claimable,
        true
    );

    const motifsAtClaim =
        structuredClone(inventory);
    const claim = QuestManager.claimQuest(quest.id);
    assert.equal(claim.claimed, true);
    assert.equal(gameState.player.xp, 1250);
    assert.equal(
        GameStateManager.hasDiscovery("aquaporin"),
        true
    );
    assert.deepEqual(inventory, motifsAtClaim);
    assert.equal(
        gameState.registry.discoveries
            .filter(id => id === "aquaporin")
            .length,
        1
    );
    assert.equal(
        QuestManager.claimQuest(quest.id).reason,
        "already-claimed"
    );

    assert.equal(SaveManager.load(), true);
    assert.equal(gameState.player.xp, 1250);
    assert.equal(
        GameStateManager.hasDiscovery("aquaporin"),
        true
    );
    assert.equal(
        QuestManager.getRecord(quest.id).status,
        "claimed"
    );

    // Claiming would also be safe if another system granted Aquaporin first.
    const repeat = RewardRegistry.applyAll({
        discoveries: ["aquaporin"]
    });
    assert.deepEqual(
        RewardRegistry.resultsByKey(repeat)
            .discoveries,
        {
            granted: [],
            alreadyKnown: ["aquaporin"]
        }
    );
    RewardRegistry.revertAll(repeat);
    assert.equal(
        GameStateManager.hasDiscovery("aquaporin"),
        true
    );

    const drawerSource = fs.readFileSync(
        new URL(
            "../src/app/QuestDrawerUI.js",
            import.meta.url
        ),
        "utf8"
    );
    assert.match(drawerSource, /Discovery:/);
} finally {
    for (const key of Object.keys(gameState)) {
        delete gameState[key];
    }
    Object.assign(gameState, backup);
}

console.log(
    "PASS: Protein Building Blocks requires one permanent H/B/L motif, awards 1,000 XP and Aquaporin once, survives reload, accepts a pre-existing discovery, and rolls back failed reward transactions."
);
