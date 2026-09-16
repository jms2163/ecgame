// Run with: node tests/polymerizer-completion.test.mjs
// Uses an in-memory save store; never opens or modifies browser/player saves.

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import gameState from "../src/app/GameState.js";
import SaveManager from "../src/app/SaveManager.js";
import ResourceManager from "../src/app/ResourceManager.js";
import GameStateManager from "../src/app/GameStateManager.js";
import PolymerizerManager
    from "../src/app/PolymerizerManager.js";
import ResearchManager from "../src/app/ResearchManager.js";
import OrganelleExperimentLibrary
    from "../src/app/OrganelleExperimentLibrary.js";

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
    ResearchManager.ensureRegistryStructures();

    const state =
        gameState.zones.polymerizer.state;
    const motifInventory =
        gameState.zones.macromolecularizer
            .state.motifInventory;

    state.activeAssembly = null;
    state.productInventory = {};
    motifInventory.H_helix = 8;
    motifInventory.L_loop = 7;
    GameStateManager.removeDiscovery(
        "aquaporin"
    );
    ResourceManager.setATPStatus(
        { current: 50, maximum: 50 },
        "polymerizer-completion-test-setup"
    );

    const motifsBefore =
        structuredClone(motifInventory);
    const xpBefore =
        structuredClone(gameState.player.xp);

    const started =
        PolymerizerManager.startAssembly(
            "Aquaporin",
            1_000
        );

    assert.equal(started.success, true);

    // Calling completion early cannot award output or discovery.
    const early =
        PolymerizerManager.finishAssembly(
            started.activeAssembly.jobId,
            15_999
        );
    assert.equal(early.success, false);
    assert.equal(
        early.reason,
        "assembly-not-complete"
    );
    assert.deepEqual(state.productInventory, {});
    assert.equal(
        GameStateManager.hasDiscovery(
            "aquaporin"
        ),
        false
    );

    // Completion is one transaction. A failed save restores the active job,
    // output inventory, and newly granted discovery for a later retry.
    rejectWrites = true;
    const failed =
        PolymerizerManager.finishAssembly(
            started.activeAssembly.jobId,
            16_000
        );
    rejectWrites = false;

    assert.equal(failed.success, false);
    assert.equal(failed.reason, "save-failed");
    assert.equal(
        state.activeAssembly.jobId,
        started.activeAssembly.jobId
    );
    assert.deepEqual(state.productInventory, {});
    assert.equal(
        GameStateManager.hasDiscovery(
            "aquaporin"
        ),
        false
    );

    const completed =
        PolymerizerManager.finishAssembly(
            started.activeAssembly.jobId,
            16_000
        );

    assert.equal(completed.success, true);
    assert.equal(completed.saved, true);
    assert.equal(completed.quantity, 1);
    assert.equal(
        completed.discoveryGranted,
        true
    );
    assert.equal(state.activeAssembly, null);
    assert.deepEqual(
        state.productInventory.Aquaporin,
        {
            count: 1,
            firstCompletedAtMs: 16_000,
            lastCompletedAtMs: 16_000
        }
    );
    assert.equal(
        gameState.registry.discoveries
            .filter(id => id === "aquaporin")
            .length,
        1
    );

    // The same job cannot complete twice.
    const duplicate =
        PolymerizerManager.finishAssembly(
            started.activeAssembly.jobId,
            16_001
        );
    assert.equal(duplicate.success, false);
    assert.equal(
        duplicate.reason,
        "active-job-mismatch"
    );
    assert.equal(
        state.productInventory.Aquaporin
            .count,
        1
    );

    // Later assemblies add products without duplicating the discovery.
    const second =
        PolymerizerManager.startAssembly(
            "Aquaporin",
            17_000
        );
    assert.equal(second.success, true);

    rejectWrites = true;
    const failedReconciliation =
        PolymerizerManager.reconcileAssembly(
            32_000
        );
    rejectWrites = false;

    assert.equal(
        failedReconciliation.reason,
        "save-failed"
    );
    assert.equal(
        state.productInventory.Aquaporin
            .count,
        1
    );
    assert.equal(
        gameState.registry.discoveries
            .filter(id => id === "aquaporin")
            .length,
        1
    );

    // Repeated animation frames do not hammer storage after a failed save.
    const throttledRetry =
        PolymerizerManager.reconcileAssembly(
            32_500
        );
    assert.equal(throttledRetry.complete, true);
    assert.equal(
        state.productInventory.Aquaporin
            .count,
        1
    );

    const reconciled =
        PolymerizerManager.reconcileAssembly(
            33_000
        );
    assert.equal(reconciled.success, true);
    assert.equal(reconciled.quantity, 2);
    assert.equal(
        reconciled.discoveryGranted,
        false
    );
    assert.deepEqual(
        state.productInventory.Aquaporin,
        {
            count: 2,
            firstCompletedAtMs: 16_000,
            lastCompletedAtMs: 32_000
        }
    );
    assert.equal(
        gameState.registry.discoveries
            .filter(id => id === "aquaporin")
            .length,
        1
    );
    assert.deepEqual(motifInventory, motifsBefore);
    assert.deepEqual(gameState.player.xp, xpBefore);
    assert.deepEqual(
        ResourceManager.getATPStatus(),
        { current: 20, maximum: 50 }
    );

    // A reload preserves completed output and does not resurrect the job.
    state.productInventory.Aquaporin.count =
        99;
    assert.equal(SaveManager.load(), true);
    PolymerizerManager.ensureState();

    assert.equal(
        gameState.zones.polymerizer.state
            .activeAssembly,
        null
    );
    assert.equal(
        gameState.zones.polymerizer.state
            .productInventory.Aquaporin
            .count,
        2
    );
    assert.equal(
        gameState.registry.discoveries
            .filter(id => id === "aquaporin")
            .length,
        1
    );

    // Loading an expired persisted job triggers the subscribed global
    // reconciliation path; visiting Polymerizer is not required.
    const third =
        PolymerizerManager.startAssembly(
            "Aquaporin",
            40_000
        );
    assert.equal(third.success, true);
    assert.equal(SaveManager.load(), true);
    assert.equal(
        gameState.zones.polymerizer.state
            .activeAssembly,
        null
    );
    assert.equal(
        gameState.zones.polymerizer.state
            .productInventory.Aquaporin
            .count,
        3
    );
    assert.equal(
        gameState.registry.discoveries
            .filter(id => id === "aquaporin")
            .length,
        1
    );

    // Polymerizer grants the prerequisite through the existing discovery
    // path; it does not alter or bypass the Organelle Lab requirements.
    const aquaporinExperiment =
        OrganelleExperimentLibrary
            .aquaporin_facilitated_diffusion;
    assert.deepEqual(
        aquaporinExperiment
            .requirements.discoveries,
        ["aquaporin"]
    );
    assert.deepEqual(
        aquaporinExperiment
            .requirements
            .completedExperiments,
        ["water_passive_diffusion"]
    );

    gameState.registry.research
        .completedExperiments
        .water_passive_diffusion = {
            completedAtMs: 1
        };

    assert.equal(
        ResearchManager.getExperimentStatus(
            "aquaporin_facilitated_diffusion"
        ).available,
        true
    );

    // Bootstrap must initialize Polymerizer globally so elapsed jobs finish
    // after reload even when the player opens a different zone.
    const bootstrapSource = await readFile(
        new URL(
            "../src/app/Bootstrap.js",
            import.meta.url
        ),
        "utf8"
    );
    assert.match(
        bootstrapSource,
        /PolymerizerManager\.initialize\(\)/
    );
} finally {
    console.log = originalLog;
    console.error = originalError;
}

console.log(
    "PASS: Polymerizer completion atomically stores Aquaporin, grants its existing discovery once, prevents duplicate completion, survives reload, preserves motif levels and XP, and unlocks the unchanged Organelle Lab prerequisite."
);
