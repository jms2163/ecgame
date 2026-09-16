// Run with: node tests/polymerizer-state.test.mjs
// Uses in-memory state only and never opens or writes a browser save.

import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import PolymerizerManager
    from "../src/app/PolymerizerManager.js";

let saveWrites = 0;
globalThis.localStorage = {
    getItem() { return null; },
    setItem() { saveWrites += 1; },
    removeItem() {}
};

const originalPlayer =
    structuredClone(gameState.player);
const originalATP =
    structuredClone(
        gameState.registry.resources.atp
    );
const originalDiscoveries =
    structuredClone(gameState.discoveries);
const originalLegacyDiscoveries =
    structuredClone(
        gameState.registry.discoveries
    );

gameState.zones.macromolecularizer
    .state.motifInventory = {
        H_helix: 12,
        L_loop: 9
    };
const originalMotifs =
    structuredClone(
        gameState.zones.macromolecularizer
            .state.motifInventory
    );

// Missing future-zone state receives only the defined output inventory.
delete gameState.zones.polymerizer;
let state =
    PolymerizerManager.ensureState();
assert.deepEqual(state, {
    productInventory: {},
    activeAssembly: null
});
assert.equal(
    gameState.zones.polymerizer.unlocked,
    false
);
assert.equal(
    gameState.zones.polymerizer.completed,
    false
);

// Malformed containers normalize to an empty map.
state.productInventory = [];
assert.deepEqual(
    PolymerizerManager.ensureState()
        .productInventory,
    {}
);

// Malformed or tampered active jobs are rejected rather than resumed.
state.activeAssembly = {
    jobId: "broken-job",
    productId: "Aquaporin",
    startedAtMs: 100,
    completesAtMs: 200,
    durationMs: 100,
    atpCost: 15,
    motifRequirements: []
};
PolymerizerManager.ensureState();
assert.equal(state.activeAssembly, null);

// Numeric legacy values become records, timestamps are repaired, and
// zero/invalid entries are removed without rejecting future product IDs.
state.productInventory = {
    Aquaporin: {
        count: 2.9,
        firstCompletedAtMs: 500,
        lastCompletedAtMs: 100
    },
    FutureProtein: 3,
    ZeroProtein: {
        count: 0,
        firstCompletedAtMs: 20,
        lastCompletedAtMs: 30
    },
    BrokenProtein: "many"
};

PolymerizerManager.ensureState();

assert.deepEqual(
    state.productInventory,
    {
        Aquaporin: {
            count: 2,
            firstCompletedAtMs: 100,
            lastCompletedAtMs: 500
        },
        FutureProtein: {
            count: 3,
            firstCompletedAtMs: null,
            lastCompletedAtMs: null
        }
    }
);

// Repeated initialization is idempotent.
const normalizedOnce =
    structuredClone(
        state.productInventory
    );
PolymerizerManager.ensureState();
assert.deepEqual(
    state.productInventory,
    normalizedOnce
);

// Public reads are defensive snapshots.
const aquaporin =
    PolymerizerManager.getProductRecord(
        "Aquaporin"
    );
aquaporin.count = 99;
assert.equal(
    PolymerizerManager
        .getProductRecord("Aquaporin")
        .count,
    2
);
assert.deepEqual(
    PolymerizerManager.getProductRecord(
        "MissingProtein"
    ),
    {
        count: 0,
        firstCompletedAtMs: null,
        lastCompletedAtMs: null
    }
);
assert.equal(
    PolymerizerManager.getProductRecord(""),
    null
);

const inventoryStatus =
    PolymerizerManager
        .getProductInventoryStatus();
assert.equal(inventoryStatus.storedTypes, 2);
assert.equal(inventoryStatus.totalQuantity, 5);
assert.deepEqual(
    inventoryStatus.items.map(
        item => [
            item.id,
            item.count,
            item.knownProduct
        ]
    ),
    [
        ["Aquaporin", 2, true],
        ["FutureProtein", 3, false]
    ]
);

const eligibility =
    PolymerizerManager
        .getProductEligibility(
            "Aquaporin"
        );
assert.equal(
    eligibility.output.quantity,
    2
);
assert.equal(eligibility.atp.cost, 15);
assert(eligibility.motifs.every(
    motif => motif.consumed === false
));

// Normalization and preflight must not touch any upstream/global domain.
assert.deepEqual(gameState.player, originalPlayer);
assert.deepEqual(
    gameState.registry.resources.atp,
    originalATP
);
assert.deepEqual(
    gameState.discoveries,
    originalDiscoveries
);
assert.deepEqual(
    gameState.registry.discoveries,
    originalLegacyDiscoveries
);
assert.deepEqual(
    gameState.zones.macromolecularizer
        .state.motifInventory,
    originalMotifs
);
assert.equal(saveWrites, 0);

console.log(
    "PASS: Polymerizer Milestone 2 owns and normalizes productInventory, preserves compatible output records, exposes defensive inventory status, keeps motif levels non-consuming, and leaves ATP, discoveries, and unrelated save data unchanged."
);
