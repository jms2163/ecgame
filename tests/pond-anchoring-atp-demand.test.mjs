// Run with: node tests/pond-anchoring-atp-demand.test.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import gameState from "../src/app/GameState.js";
import ATPManager from "../src/app/ATPManager.js";
import GameStateObserver
    from "../src/app/GameStateObserver.js";
import PondAnchoringManager
    from "../src/app/PondAnchoringManager.js";
import PondMicrobiomeSensorPane
    from "../src/app/PondMicrobiomeSensorPane.js";
import ResourceManager
    from "../src/app/ResourceManager.js";

const backup = structuredClone(gameState);
const storage = new Map();
let failSaves = false;

globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => {
        if (failSaves) {
            throw new Error("test save failure");
        }

        storage.set(key, String(value));
    },
    removeItem: key => storage.delete(key)
};

try {
    gameState.zones.polymerizer.state
        .productInventory = {};
    gameState.zones.metabolism.state = {
        pathwayPlacements: {},
        completedModules: {}
    };
    gameState.zones.pond.state.player.anchored =
        true;
    ResourceManager.setATPStatus(
        { current: 100, maximum: 100 },
        "anchor-demand-test-setup"
    );
    PondAnchoringManager.resetAccumulator();

    const deficitBalance =
        ATPManager.getBalanceStatus();

    assert.equal(
        deficitBalance
            .totalProductionATPPerMinute,
        1
    );
    assert.equal(
        deficitBalance
            .totalDemandATPPerMinute,
        2
    );
    assert.equal(
        deficitBalance.netATPPerMinute,
        -1
    );
    assert.equal(
        deficitBalance.demands[0].active,
        true
    );

    assert.equal(
        PondAnchoringManager.handleGameTick({
            deltaSec: 29
        }).charged,
        0
    );
    assert.equal(
        PondAnchoringManager.handleGameTick({
            deltaSec: 1
        }).charged,
        1
    );
    assert.equal(
        ResourceManager.getATPStatus().current,
        99,
        "anchoring must charge one ATP every 30 seconds"
    );
    assert.equal(
        PondAnchoringManager.handleGameTick({
            deltaSec: 30
        }).charged,
        1
    );
    assert.equal(
        ResourceManager.getATPStatus().current,
        98
    );

    let releaseEvents = 0;
    let anchoringEvents = 0;

    GameStateObserver.on(
        "pond-anchor-auto-released",
        () => {
            releaseEvents += 1;
        }
    );
    GameStateObserver.on(
        "pond-anchoring-changed",
        () => {
            anchoringEvents += 1;
        }
    );

    ResourceManager.setATPStatus(
        { current: 11, maximum: 100 },
        "anchor-reserve-test-setup"
    );
    PondAnchoringManager.resetAccumulator();

    const releaseResult =
        PondAnchoringManager.handleGameTick({
            deltaSec: 30
        });

    assert.equal(releaseResult.charged, 1);
    assert.equal(releaseResult.released, true);
    assert.equal(releaseResult.reason, "atp-reserve");
    assert.equal(
        gameState.zones.pond.state
            .player.anchored,
        false
    );
    assert.equal(
        ResourceManager.getATPStatus().current,
        10
    );
    assert.equal(releaseEvents, 1);
    assert.equal(anchoringEvents, 1);

    // A positive net rate does not force release at the reserve.
    gameState.zones.polymerizer.state
        .productInventory.EnergyKinase = {
            count: 1,
            firstCompletedAtMs: 1,
            lastCompletedAtMs: 1
        };
    gameState.zones.pond.state.player.anchored =
        true;
    ResourceManager.setATPStatus(
        { current: 10, maximum: 100 },
        "positive-net-anchor-test-setup"
    );
    PondAnchoringManager.resetAccumulator();

    assert.equal(
        ATPManager.getBalanceStatus()
            .netATPPerMinute,
        1
    );
    assert.equal(
        PondAnchoringManager.handleGameTick({
            deltaSec: 1
        }).released,
        false
    );
    assert.equal(
        gameState.zones.pond.state
            .player.anchored,
        true
    );

    // A failed release save restores ATP and anchoring atomically.
    delete gameState.zones.polymerizer.state
        .productInventory.EnergyKinase;
    ResourceManager.setATPStatus(
        { current: 11, maximum: 100 },
        "anchor-release-rollback-setup"
    );
    PondAnchoringManager.resetAccumulator();
    failSaves = true;

    const failedRelease =
        PondAnchoringManager.handleGameTick({
            deltaSec: 30
        });

    failSaves = false;
    assert.equal(failedRelease.released, false);
    assert.equal(failedRelease.charged, 0);
    assert.equal(failedRelease.reason, "save-failed");
    assert.equal(
        gameState.zones.pond.state
            .player.anchored,
        true
    );
    assert.deepEqual(
        ResourceManager.getATPStatus(),
        { current: 11, maximum: 100 }
    );

    const toggledClasses = new Map();
    PondMicrobiomeSensorPane.anchoringElement = {
        textContent: "",
        classList: {
            toggle: (name, enabled) => {
                toggledClasses.set(name, enabled);
            }
        }
    };
    PondMicrobiomeSensorPane.systemAnchoringElement = {
        textContent: ""
    };

    PondMicrobiomeSensorPane
        .renderAnchoringState(true);

    assert.equal(
        PondMicrobiomeSensorPane
            .anchoringElement.textContent,
        "ANCHORED (-2 ATP/MIN)"
    );
    assert.equal(
        PondMicrobiomeSensorPane
            .systemAnchoringElement.textContent,
        "Anchored (-2 ATP/min)"
    );
    assert.equal(
        toggledClasses.get(
            "ec-status--available"
        ),
        true
    );

    PondMicrobiomeSensorPane
        .renderAnchoringState(false);

    assert.equal(
        PondMicrobiomeSensorPane
            .anchoringElement.textContent,
        "UNANCHORED"
    );
    assert.equal(
        PondMicrobiomeSensorPane
            .systemAnchoringElement.textContent,
        "Drifting"
    );

    const bootstrapSource = fs.readFileSync(
        new URL(
            "../src/app/Bootstrap.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.ok(
        bootstrapSource.indexOf(
            "ATPManager.initialize()"
        ) < bootstrapSource.indexOf(
            "PondAnchoringManager.initialize()"
        )
    );
    assert.ok(
        bootstrapSource.indexOf(
            "PondAnchoringManager.initialize()"
        ) < bootstrapSource.indexOf(
            "TimeManager.start()"
        )
    );
} finally {
    for (const key of Object.keys(gameState)) {
        delete gameState[key];
    }
    Object.assign(gameState, backup);
    PondAnchoringManager.resetAccumulator();
}

console.log(
    "PASS: Pond anchoring costs 2 ATP/min, enters the ATP ledger, releases at a 10% reserve only during net deficit, rolls back failed saves, and updates anchoring UI state."
);
