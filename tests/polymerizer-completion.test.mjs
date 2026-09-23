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
    const firstCompletedAtMs =
        started.activeAssembly
            .completesAtMs;

    // Calling completion early cannot award output or discovery.
    const early =
        PolymerizerManager.finishAssembly(
            started.activeAssembly.jobId,
            firstCompletedAtMs - 1
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
            firstCompletedAtMs
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
            firstCompletedAtMs
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
            firstCompletedAtMs,
            lastCompletedAtMs:
                firstCompletedAtMs
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
            firstCompletedAtMs + 1
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

    // Stored completion blocks a second synthesis without spending ATP.
    const atpAfterCompletion = ResourceManager.getATPStatus().current;
    const duplicateStart = PolymerizerManager.startAssembly(
        "Aquaporin", firstCompletedAtMs + 1_000
    );
    assert.equal(duplicateStart.success, false);
    assert.equal(duplicateStart.reason, "product-already-synthesized");
    assert.equal(ResourceManager.getATPStatus().current, atpAfterCompletion);

    // Older saves with multiple copies remain readable and normalize to one.
    state.productInventory.Aquaporin.count = 3;
    assert.equal(PolymerizerManager.getProductRecord("Aquaporin").count, 1);
    assert.equal(SaveManager.load(), true);
    assert.equal(gameState.zones.polymerizer.state.activeAssembly, null);
    assert.equal(
        gameState.zones.polymerizer.state.productInventory.Aquaporin.count,
        1
    );
    assert.equal(
        gameState.registry.discoveries.filter(id => id === "aquaporin").length,
        1
    );
    assert.deepEqual(motifInventory, motifsBefore);
    assert.deepEqual(gameState.player.xp, xpBefore);
    assert.deepEqual(
        ResourceManager.getATPStatus(),
        { current: 35, maximum: 50 }
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
