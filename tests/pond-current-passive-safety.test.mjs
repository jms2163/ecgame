// Run with: node tests/pond-current-passive-safety.test.mjs

import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import GameStateObserver
    from "../src/app/GameStateObserver.js";
import PondCurrentManager, {
    SHIFT_INTERVAL_MS
} from "../src/app/PondCurrentManager.js";
import PondEnvironmentClassifier
    from "../src/app/PondEnvironmentClassifier.js";
import PondPerception
    from "../src/app/PondPerception.js";

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

function setApproachingHazard(nowMs) {
    const pondState = gameState.zones.pond.state;

    pondState.worldSeed = 123456789;
    pondState.player = {
        x: 0,
        y: 0,
        anchored: false
    };
    pondState.current = {
        // Moving east adds one to X. The proposed offset
        // (-87, 123) samples deterministic point (87, -123),
        // an Anaerobic Pocket for this seed. The current point
        // (88, -123) is safe open water.
        fieldOffsetX: -88,
        fieldOffsetY: 123,
        directionIndex: 2,
        directionChangeCount: 0,
        lastShiftAtMs:
            nowMs - SHIFT_INTERVAL_MS,
        lastDirectionChangedAtMs: nowMs,
        safetyHoldCount: 0,
        lastSafetyHoldAtMs: null,
        lastBlockedBiome: null,
        lastBlockedClassification: null
    };
    pondState.world.tiles = {
        "0,0": {
            biome: "open_water",
            marker: "preserve-on-safety-hold"
        }
    };
    pondState.discoveredMicrobiomes = {
        algae_patch: {
            firstDiscoveredAtMs: 10,
            firstPosition: { x: 1, y: 1 },
            discoveryMethod: "manual-movement"
        }
    };
}

try {
    const nowMs = 90_000_000;
    let shiftEvents = 0;
    let safetyEvents = 0;
    let discoveryEvents = 0;

    GameStateObserver.on(
        "pond-current-shifted",
        () => {
            shiftEvents += 1;
        }
    );
    GameStateObserver.on(
        "pond-current-safety-blocked",
        () => {
            safetyEvents += 1;
        }
    );
    GameStateObserver.on(
        "microbiome-discovered",
        () => {
            discoveryEvents += 1;
        }
    );

    setApproachingHazard(nowMs);
    PondCurrentManager.wasAnchored = false;

    const currentDestination =
        PondCurrentManager
            .evaluatePassiveDestination(
                -88,
                123
            );
    const proposedDestination =
        PondCurrentManager
            .evaluatePassiveDestination(
                -87,
                123
            );

    assert.equal(currentDestination.safe, true);
    assert.equal(
        proposedDestination.safe,
        false
    );
    assert.equal(
        proposedDestination.biome,
        "anaerobic_pocket"
    );
    assert.equal(
        proposedDestination.classification.code,
        "ABIOTIC_HAZARD"
    );

    const classifierProbe = {
        physics: { oxygen: 0, ph: 6.3 },
        chemistry: {
            signals: {
                folate: 0,
                n_formyl_peptides: 0,
                scfa: 0,
                cyanotoxins: 0
            }
        }
    };

    assert.deepEqual(
        PondEnvironmentClassifier
            .classifyTile(classifierProbe),
        PondPerception.classifyTile(
            classifierProbe
        ),
        "the signal probe and passive safety must share one classifier"
    );

    const discoveriesBefore = structuredClone(
        gameState.zones.pond.state
            .discoveredMicrobiomes
    );
    const onlineResult =
        PondCurrentManager.processTime(nowMs);
    const pondState = gameState.zones.pond.state;

    assert.equal(onlineResult.changed, true);
    assert.equal(
        onlineResult.reason,
        "safety-hold"
    );
    assert.equal(onlineResult.shifted, false);
    assert.equal(
        onlineResult.safetyBlocked,
        true
    );
    assert.deepEqual(
        {
            x: pondState.current.fieldOffsetX,
            y: pondState.current.fieldOffsetY
        },
        { x: -88, y: 123 },
        "a hazardous passive destination must not alter field offsets"
    );
    assert.deepEqual(
        pondState.world.tiles,
        {
            "0,0": {
                biome: "open_water",
                marker:
                    "preserve-on-safety-hold"
            }
        },
        "a blocked step must preserve the safe rendered cache"
    );
    assert.equal(
        pondState.current.safetyHoldCount,
        1
    );
    assert.equal(
        pondState.current.lastSafetyHoldAtMs,
        nowMs
    );
    assert.equal(
        pondState.current.lastBlockedBiome,
        "anaerobic_pocket"
    );
    assert.equal(
        pondState.current
            .lastBlockedClassification,
        "ABIOTIC_HAZARD"
    );
    assert.equal(
        pondState.current.lastShiftAtMs,
        nowMs,
        "a safety hold must start a fresh five-minute interval"
    );
    assert.deepEqual(
        pondState.discoveredMicrobiomes,
        discoveriesBefore
    );
    assert.equal(shiftEvents, 0);
    assert.equal(safetyEvents, 1);
    assert.equal(discoveryEvents, 0);
    assert.equal(saveWrites, 1);

    setApproachingHazard(nowMs + 1_000);

    const offlineResult =
        PondCurrentManager.beginSession(
            nowMs + 1_000
        );

    assert.equal(
        offlineResult.offlineReconciled,
        true
    );
    assert.equal(
        offlineResult.reason,
        "safety-hold"
    );
    assert.equal(offlineResult.shifted, false);
    assert.equal(
        offlineResult.safetyBlocked,
        true
    );
    assert.deepEqual(
        {
            x: pondState.current.fieldOffsetX,
            y: pondState.current.fieldOffsetY
        },
        { x: -88, y: 123 },
        "offline reconciliation must also refuse the hazardous destination"
    );
    assert.equal(shiftEvents, 0);
    assert.equal(safetyEvents, 2);
    assert.equal(discoveryEvents, 0);
    assert.equal(saveWrites, 2);
} finally {
    for (const key of Object.keys(gameState)) {
        delete gameState[key];
    }
    Object.assign(gameState, backup);
}

console.log(
    "PASS: online and offline currents hold position before passive hazards, preserve the safe cache, restart timing, share Pond risk classification, and record no discovery."
);
