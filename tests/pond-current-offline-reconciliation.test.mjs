// Run with: node tests/pond-current-offline-reconciliation.test.mjs

import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import GameStateObserver
    from "../src/app/GameStateObserver.js";
import PondCurrentManager, {
    DIRECTION_INTERVAL_MS
} from "../src/app/PondCurrentManager.js";

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

function resetPersistentCurrent({
    anchored,
    nowMs,
    directionAgeMs = 1
}) {
    const pondState = gameState.zones.pond.state;

    pondState.worldSeed = 42;
    pondState.player.x = 7;
    pondState.player.y = -3;
    pondState.player.anchored = anchored;
    pondState.current = {
        fieldOffsetX: 2,
        fieldOffsetY: -4,
        directionIndex: 2,
        directionChangeCount: 3,
        lastShiftAtMs: nowMs - 50_000_000,
        lastDirectionChangedAtMs:
            nowMs - directionAgeMs
    };
    pondState.world.tiles = {
        "7,-3": {
            biome: "cached-before-reload"
        }
    };
    pondState.discoveredMicrobiomes = {
        bacterial_biofilm: {
            firstDiscoveredAtMs: 123,
            firstPosition: { x: 5, y: -3 },
            discoveryMethod: "manual-movement"
        }
    };
}

try {
    const nowMs = 80_000_000;
    let shiftEvents = 0;
    let directionEvents = 0;
    let discoveryEvents = 0;
    let offlineEvents = 0;

    GameStateObserver.on(
        "pond-current-shifted",
        () => {
            shiftEvents += 1;
        }
    );
    GameStateObserver.on(
        "pond-current-direction-changed",
        () => {
            directionEvents += 1;
        }
    );
    GameStateObserver.on(
        "microbiome-discovered",
        () => {
            discoveryEvents += 1;
        }
    );
    GameStateObserver.on(
        "pond-current-offline-reconciled",
        () => {
            offlineEvents += 1;
        }
    );

    resetPersistentCurrent({
        anchored: false,
        nowMs,
        directionAgeMs:
            DIRECTION_INTERVAL_MS * 12
    });

    const discoveriesBefore = structuredClone(
        gameState.zones.pond.state
            .discoveredMicrobiomes
    );
    const unanchoredResult =
        PondCurrentManager.beginSession(nowMs);
    const pondState = gameState.zones.pond.state;

    assert.equal(
        unanchoredResult.offlineReconciled,
        true
    );
    assert.equal(unanchoredResult.shifted, true);
    assert.equal(
        unanchoredResult.directionChanged,
        true
    );
    assert.equal(
        pondState.current.directionChangeCount,
        4,
        "many missed hours must produce only one direction update"
    );
    assert.notEqual(
        pondState.current.directionIndex,
        2
    );
    assert.ok(
        Math.abs(
            Math.hypot(
                pondState.current.fieldOffsetX - 2,
                pondState.current.fieldOffsetY + 4
            ) - 1
        ) < 1e-6,
        "many missed shifts must produce exactly one field step"
    );
    assert.deepEqual(
        { x: pondState.player.x, y: pondState.player.y },
        { x: 7, y: -3 },
        "offline current must not move player coordinates"
    );
    assert.deepEqual(pondState.world.tiles, {});
    assert.deepEqual(
        pondState.discoveredMicrobiomes,
        discoveriesBefore,
        "passive offline reconciliation must not record a discovery"
    );
    assert.equal(shiftEvents, 1);
    assert.equal(directionEvents, 1);
    assert.equal(offlineEvents, 1);
    assert.equal(discoveryEvents, 0);
    assert.equal(saveWrites, 1);

    resetPersistentCurrent({
        anchored: true,
        nowMs: nowMs + 1_000,
        directionAgeMs: 1_000
    });

    const anchoredBefore = structuredClone(
        pondState.current
    );
    const anchoredTilesBefore = structuredClone(
        pondState.world.tiles
    );
    const anchoredResult =
        PondCurrentManager.beginSession(
            nowMs + 1_000
        );

    assert.equal(anchoredResult.changed, false);
    assert.equal(
        anchoredResult.reason,
        "anchored-offline"
    );
    assert.equal(
        pondState.current.fieldOffsetX,
        anchoredBefore.fieldOffsetX
    );
    assert.equal(
        pondState.current.fieldOffsetY,
        anchoredBefore.fieldOffsetY
    );
    assert.deepEqual(
        pondState.world.tiles,
        anchoredTilesBefore,
        "anchored reload must preserve relative surroundings"
    );
    assert.equal(saveWrites, 1);

    delete pondState.current;
    const legacyResult =
        PondCurrentManager.beginSession(
            nowMs + 2_000
        );

    assert.equal(
        legacyResult.reason,
        "new-current-clock"
    );
    assert.equal(legacyResult.changed, false);
    assert.equal(saveWrites, 1);
} finally {
    for (const key of Object.keys(gameState)) {
        delete gameState[key];
    }
    Object.assign(gameState, backup);
}

console.log(
    "PASS: an unanchored reload applies one saved current step and at most one hourly direction change; anchored and legacy saves do not drift; no passive discovery is recorded."
);
