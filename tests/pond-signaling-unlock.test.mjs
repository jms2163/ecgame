// Run with: node tests/pond-signaling-unlock.test.mjs
// Uses only an in-memory save store; never opens browser/player saves.

import assert from "node:assert/strict";
import fs from "node:fs";
import gameState from "../src/app/GameState.js";
import GameStateManager
    from "../src/app/GameStateManager.js";
import GameStateObserver
    from "../src/app/GameStateObserver.js";
import ObjectiveRegistry
    from "../src/app/ObjectiveRegistry.js";
import PondDiscoveryManager
    from "../src/app/PondDiscoveryManager.js";
import { PondQuestCatalog }
    from "../src/app/PondQuestCatalog.js";
import QuestManager
    from "../src/app/QuestManager.js";

const backup = structuredClone(gameState);
const storage = new Map();
let saveWrites = 0;

globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => {
        saveWrites += 1;
        storage.set(key, String(value));
    },
    removeItem: key => storage.delete(key)
};

try {
    delete gameState.zones.pond.state
        .discoveredMicrobiomes;

    PondDiscoveryManager.initialize();

    assert.deepEqual(
        gameState.zones.pond.state
            .discoveredMicrobiomes,
        {},
        "legacy saves must gain an empty discovery ledger"
    );
    assert.equal(
        saveWrites,
        0,
        "normalizing a legacy save must not write immediately"
    );

    const ignoredAnchor =
        PondDiscoveryManager.recordArrival(
            { biome: "bacterial_bloom" },
            { x: 3, y: 4 },
            "anchoring"
        );
    const ignoredDrift =
        PondDiscoveryManager.recordArrival(
            { biome: "bacterial_bloom" },
            { x: 3, y: 4 },
            "current-drift"
        );

    assert.equal(
        ignoredAnchor.reason,
        "non-manual-arrival"
    );
    assert.equal(
        ignoredDrift.reason,
        "non-manual-arrival"
    );
    assert.deepEqual(
        PondDiscoveryManager.getDiscoveries(),
        {}
    );

    let discoveryEvent = null;
    GameStateObserver.on(
        "microbiome-discovered",
        payload => {
            discoveryEvent = payload;
        }
    );

    const firstArrival =
        PondDiscoveryManager.recordArrival(
            { biome: "bacterial_bloom" },
            { x: 3, y: 4 }
        );

    assert.equal(firstArrival.discovered, true);
    assert.equal(
        firstArrival.biomeId,
        "bacterial_bloom"
    );
    assert.deepEqual(
        firstArrival.record.firstPosition,
        { x: 3, y: 4 }
    );
    assert.equal(
        firstArrival.record.discoveryMethod,
        "manual-movement"
    );
    assert.ok(
        Number.isFinite(
            firstArrival.record
                .firstDiscoveredAtMs
        )
    );
    assert.equal(
        discoveryEvent.biomeId,
        "bacterial_bloom"
    );

    const writesAfterFirst = saveWrites;
    const duplicate =
        PondDiscoveryManager.recordArrival(
            { biome: "bacterial_bloom" },
            { x: 8, y: 9 }
        );

    assert.equal(
        duplicate.reason,
        "already-discovered"
    );
    assert.equal(
        saveWrites,
        writesAfterFirst,
        "repeat arrivals must not rewrite first-discovery data"
    );
    assert.deepEqual(
        PondDiscoveryManager
            .getDiscoveries()
            .bacterial_bloom
            .firstPosition,
        { x: 3, y: 4 }
    );

    const quest =
        PondQuestCatalog.unlock_signaling;

    assert.deepEqual(
        quest.prerequisites,
        ["unlock_macromolecularizer"]
    );
    assert.deepEqual(
        quest.rewards.zoneUnlocks,
        ["signaling"]
    );

    const objectiveProgress =
        ObjectiveRegistry.evaluate({
            objective: quest.objectives[0]
        });

    assert.equal(objectiveProgress.complete, true);
    assert.deepEqual(
        objectiveProgress.completedIds,
        ["bacterial_bloom"]
    );
    assert.equal(objectiveProgress.consumed, false);

    gameState.registry.quests = {};
    GameStateManager.setZoneUnlocked(
        "signaling",
        false
    );
    QuestManager.initialize();

    assert.equal(
        QuestManager.getQuestStatus(
            "unlock_signaling"
        ).active,
        false,
        "a saved encounter must wait for Macromolecular Foundations"
    );

    const macroRecord =
        QuestManager.getRecord(
            "unlock_macromolecularizer"
        );
    Object.assign(macroRecord, {
        status: "claimed",
        readyAtMs: 1,
        claimedAtMs: 2,
        viewedAtMs: 2,
        activatedAtMs: 1,
        objectiveBaselines: {}
    });

    QuestManager.reconcileAll();

    assert.equal(
        QuestManager.getQuestStatus(
            "unlock_signaling"
        ).claimable,
        true,
        "an earlier encounter must become claimable once its prerequisite is claimed"
    );
    assert.equal(
        GameStateManager.isZoneUnlocked(
            "signaling"
        ),
        false,
        "the encounter alone must not unlock Signaling"
    );

    const claim =
        QuestManager.claimQuest(
            "unlock_signaling"
        );

    assert.equal(claim.claimed, true);
    assert.equal(
        GameStateManager.isZoneUnlocked(
            "signaling"
        ),
        true
    );
    assert.equal(
        PondDiscoveryManager.hasDiscovered(
            "bacterial_bloom"
        ),
        true,
        "claiming must not consume the discovery"
    );

    const pondControllerSource =
        fs.readFileSync(
            new URL(
                "../src/app/PondController.js",
                import.meta.url
            ),
            "utf8"
        );
    const movementHookIndex =
        pondControllerSource.indexOf(
            "PondDiscoveryManager.recordArrival"
        );

    assert.ok(movementHookIndex >= 0);
    assert.ok(
        movementHookIndex >
            pondControllerSource.indexOf(
                "GameStateManager.movePondPlayer"
            ),
        "discovery must run only after successful player movement"
    );
    assert.match(
        pondControllerSource,
        /PondDiscoveryManager\.recordArrival\([\s\S]*?"manual-movement"[\s\S]*?\)/
    );
} finally {
    for (const key of Object.keys(gameState)) {
        delete gameState[key];
    }
    Object.assign(gameState, backup);
}

console.log(
    "PASS: intentional Pond arrivals record first-time microbiomes, bank early Bacterial Bloom encounters, and unlock Signaling only through the claimed quest."
);
