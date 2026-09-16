// Run with: node tests/polymerizer-assembly-start.test.mjs
// Uses an in-memory save store; never opens or modifies browser/player saves.

import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import SaveManager from "../src/app/SaveManager.js";
import ResourceManager from "../src/app/ResourceManager.js";
import PolymerizerManager
    from "../src/app/PolymerizerManager.js";

const storage = new Map();
let rejectWrites = false;
globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem(key, value) {
        if (rejectWrites) {
            throw new Error(
                "Test: storage write rejected"
            );
        }
        storage.set(key, String(value));
    },
    removeItem: key => storage.delete(key)
};

const originalLog = console.log;
const originalError = console.error;
console.log = () => {};
console.error = () => {};

try {
    SaveManager.initialize();
    ResourceManager.initialize();
    PolymerizerManager.initialize();

    const state =
        gameState.zones.polymerizer.state;
    const macroInventory =
        gameState.zones.macromolecularizer
            .state.motifInventory;

    state.activeAssembly = null;
    state.productInventory = {};
    macroInventory.H_helix = 8;
    macroInventory.L_loop = 7;
    ResourceManager.setATPStatus(
        { current: 50, maximum: 50 },
        "polymerizer-test-setup"
    );

    const motifsBefore =
        structuredClone(macroInventory);
    const discoveriesBefore =
        structuredClone(
            gameState.registry.discoveries
        );
    const startedAtMs = Date.now();

    const started =
        PolymerizerManager.startAssembly(
            "Aquaporin",
            startedAtMs
        );

    assert.equal(started.success, true);
    assert.equal(started.saved, true);
    assert.equal(started.activeAssembly.productId, "Aquaporin");
    assert.equal(
        started.activeAssembly.startedAtMs,
        startedAtMs
    );
    assert.equal(
        started.activeAssembly.completesAtMs,
        startedAtMs + 15_000
    );
    assert.equal(started.activeAssembly.durationMs, 15_000);
    assert.equal(started.activeAssembly.atpCost, 15);
    assert.equal(started.activeAssembly.progress, 0);
    assert.equal(started.activeAssembly.complete, false);
    assert.deepEqual(
        ResourceManager.getATPStatus(),
        { current: 35, maximum: 50 }
    );
    assert.deepEqual(macroInventory, motifsBefore);
    assert.deepEqual(
        state.productInventory,
        {}
    );
    assert.deepEqual(
        gameState.registry.discoveries,
        discoveriesBefore
    );

    const duplicate =
        PolymerizerManager.startAssembly(
            "Aquaporin",
            startedAtMs + 1_000
        );
    assert.equal(duplicate.success, false);
    assert.equal(
        duplicate.reason,
        "assembly-already-active"
    );
    assert.equal(
        ResourceManager.getATPStatus().current,
        35
    );

    const halfway =
        PolymerizerManager
            .getActiveAssemblyProgress(
                startedAtMs + 7_500
            );
    assert.equal(halfway.progress, 0.5);
    assert.equal(halfway.remainingMs, 7_500);
    assert.equal(halfway.complete, false);

    const elapsed =
        PolymerizerManager
            .getActiveAssemblyProgress(
                startedAtMs + 15_000
            );
    assert.equal(elapsed.progress, 1);
    assert.equal(elapsed.remainingMs, 0);
    assert.equal(elapsed.complete, true);

    // Reload preserves the exact job and derives elapsed progress from time.
    assert.equal(SaveManager.load(), true);
    PolymerizerManager.ensureState();
    const reloaded =
        PolymerizerManager
            .getActiveAssemblyProgress(
                startedAtMs + 7_500
            );
    assert.equal(reloaded.jobId, started.activeAssembly.jobId);
    assert.equal(reloaded.progress, 0.5);
    assert.equal(
        ResourceManager.getATPStatus().current,
        35
    );

    const reloadedMacroInventory =
        gameState.zones.macromolecularizer
            .state.motifInventory;

    // A failed start must restore ATP and clear the unsaved job.
    gameState.zones.polymerizer
        .state.activeAssembly = null;
    ResourceManager.setATPStatus(
        { current: 50, maximum: 50 },
        "polymerizer-test-reset"
    );
    rejectWrites = true;
    const failed =
        PolymerizerManager.startAssembly(
            "Aquaporin",
            30_000
        );
    rejectWrites = false;

    assert.equal(failed.success, false);
    assert.equal(failed.reason, "save-failed");
    assert.equal(
        gameState.zones.polymerizer
            .state.activeAssembly,
        null
    );
    assert.deepEqual(
        ResourceManager.getATPStatus(),
        { current: 50, maximum: 50 }
    );
    assert.deepEqual(
        reloadedMacroInventory,
        motifsBefore
    );

    // Missing motif levels and insufficient ATP block before any spend.
    reloadedMacroInventory.L_loop = 6;
    const missingMotif =
        PolymerizerManager.startAssembly(
            "Aquaporin",
            40_000
        );
    assert.equal(
        missingMotif.reason,
        "insufficient-motif-levels"
    );
    assert.equal(
        ResourceManager.getATPStatus().current,
        50
    );

    reloadedMacroInventory.L_loop = 7;
    ResourceManager.setATPStatus(
        { current: 14, maximum: 50 },
        "polymerizer-test-low-atp"
    );
    const lowATP =
        PolymerizerManager.startAssembly(
            "Aquaporin",
            50_000
        );
    assert.equal(lowATP.reason, "insufficient-atp");
    assert.equal(
        ResourceManager.getATPStatus().current,
        14
    );
} finally {
    console.log = originalLog;
    console.error = originalError;
}

console.log(
    "PASS: Polymerizer starts one reload-safe 15-second Aquaporin job, spends 15 ATP atomically, preserves permanent motif levels, blocks duplicates, rolls back failed starts, and grants no reward before completion."
);
