// Run with: node tests/polymerizer-unlock-quest.test.mjs
// Uses only an in-memory save store; never opens browser/player saves.

import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import GameStateManager
    from "../src/app/GameStateManager.js";
import ObjectiveRegistry
    from "../src/app/ObjectiveRegistry.js";
import QuestManager
    from "../src/app/QuestManager.js";
import SaveManager
    from "../src/app/SaveManager.js";
import ZoneCatalog
    from "../src/app/ZoneCatalog.js";
import { MacromolecularQuestCatalog }
    from "../src/app/MacromolecularQuestCatalog.js";

const backup = structuredClone(gameState);
const storage = new Map();

globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) =>
        storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
};

try {
    const quest =
        MacromolecularQuestCatalog
            .unlock_polymerizer;

    assert.equal(
        ZoneCatalog.get("polymerizer")
            .releaseState,
        ZoneCatalog.RELEASE_STATE.PLAYABLE
    );
    assert.deepEqual(
        quest.prerequisites,
        ["unlock_macromolecularizer"]
    );
    assert.deepEqual(
        quest.rewards.zoneUnlocks,
        ["polymerizer"]
    );
    assert.equal(quest.objectives.length, 6);

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

    GameStateManager.setZoneUnlocked(
        "polymerizer",
        false
    );

    const inventory =
        gameState.zones.macromolecularizer
            .state.motifInventory;

    Object.keys(inventory).forEach(id => {
        inventory[id] = 0;
    });

    Object.assign(inventory, {
        H_helix: 1,
        B_sheet: 1,
        L_loop: 1,
        Maltose: 1,
        PC: 1,
        GMP: 1,
        // These should never be needed to satisfy the two narrowed groups.
        ErgosterolOleate: 3,
        NADPlus: 2
    });

    const inventoryBefore =
        structuredClone(inventory);

    quest.objectives.forEach(objective => {
        const progress =
            ObjectiveRegistry.evaluate({
                objective
            });

        assert.equal(progress.complete, true);
        assert.equal(progress.consumed, false);
    });

    QuestManager.initialize();

    assert.equal(
        QuestManager.getQuestStatus(quest.id)
            .claimable,
        true
    );
    assert.equal(
        GameStateManager.isZoneUnlocked(
            "polymerizer"
        ),
        false,
        "meeting objectives alone must not unlock the zone"
    );

    const claim =
        QuestManager.claimQuest(quest.id);

    assert.equal(claim.claimed, true);
    assert.equal(
        GameStateManager.isZoneUnlocked(
            "polymerizer"
        ),
        true,
        "claiming the quest must unlock Polymerizer"
    );
    assert.deepEqual(
        inventory,
        inventoryBefore,
        "unlock requirements must not consume products"
    );

    assert.equal(SaveManager.load(), true);
    assert.equal(
        GameStateManager.isZoneUnlocked(
            "polymerizer"
        ),
        true,
        "the claimed zone unlock must survive save/load"
    );
} finally {
    for (const key of Object.keys(gameState)) {
        delete gameState[key];
    }
    Object.assign(gameState, backup);
}

console.log(
    "PASS: the six-part Macromolecularizer breadth quest recognizes earlier products, consumes nothing, and unlocks Polymerizer only when claimed."
);
