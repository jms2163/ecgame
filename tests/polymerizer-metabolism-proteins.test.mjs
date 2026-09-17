// Run with: node tests/polymerizer-metabolism-proteins.test.mjs
// Confirms that metabolic enzymes complete into Polymerizer inventory without
// inventing discovery IDs or consuming Macromolecularizer motif levels.

import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import SaveManager from "../src/app/SaveManager.js";
import ResourceManager
    from "../src/app/ResourceManager.js";
import PolymerizerManager
    from "../src/app/PolymerizerManager.js";

const storage = new Map();
globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) =>
        storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
};

const originalLog = console.log;
console.log = () => {};

try {
    SaveManager.initialize();
    ResourceManager.initialize();
    PolymerizerManager.initialize();

    const polymerizerState =
        gameState.zones.polymerizer.state;
    const motifInventory =
        gameState.zones.macromolecularizer
            .state.motifInventory;

    polymerizerState.activeAssembly = null;
    polymerizerState.productInventory = {};
    motifInventory.H_helix = 14;
    motifInventory.B_sheet = 10;
    motifInventory.L_loop = 25;
    ResourceManager.setATPStatus(
        { current: 100, maximum: 100 },
        "polymerizer-metabolism-test-setup"
    );

    const motifsBefore =
        structuredClone(motifInventory);
    const discoveriesBefore =
        structuredClone(
            gameState.registry.discoveries
        );

    const eligibility =
        PolymerizerManager
            .getProductEligibility(
                "PhosphoglucoseIsomerase"
            );
    assert.equal(eligibility.eligible, true);
    assert.equal(eligibility.atp.cost, 49);
    assert.equal(eligibility.motifs.length, 3);
    assert(eligibility.motifs.every(
        motif =>
            motif.complete &&
            motif.consumed === false
    ));

    const started =
        PolymerizerManager.startAssembly(
            "PhosphoglucoseIsomerase",
            1_000
        );
    assert.equal(started.success, true);
    assert.match(started.message, /49 ATP spent/);
    assert.equal(
        ResourceManager.getATPStatus()
            .current,
        51
    );

    const completed =
        PolymerizerManager.finishAssembly(
            started.activeAssembly.jobId,
            16_000
        );
    assert.equal(completed.success, true);
    assert.equal(completed.discoveryId, null);
    assert.equal(
        completed.discoveryGranted,
        false
    );
    assert.deepEqual(
        polymerizerState.productInventory
            .PhosphoglucoseIsomerase,
        {
            count: 1,
            firstCompletedAtMs: 16_000,
            lastCompletedAtMs: 16_000
        }
    );
    assert.deepEqual(
        motifInventory,
        motifsBefore
    );
    assert.deepEqual(
        gameState.registry.discoveries,
        discoveriesBefore
    );

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
        polymerizerState.productInventory
            .PhosphoglucoseIsomerase
            .count,
        1
    );
} finally {
    console.log = originalLog;
}

console.log(
    "PASS: PDB-derived metabolic proteins use counts-only H/B/L recipes, spend one ATP per motif, preserve motif levels, complete once into Polymerizer inventory, and require no invented discovery ID."
);
