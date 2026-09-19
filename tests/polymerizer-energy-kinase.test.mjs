// Run with: node tests/polymerizer-energy-kinase.test.mjs

import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import ResourceManager
    from "../src/app/ResourceManager.js";
import PolymerizerManager
    from "../src/app/PolymerizerManager.js";
import PolymerizerRecipeCatalog
    from "../src/data/PolymerizerRecipeCatalog.js";
import PolymerizerVisualCatalog
    from "../src/data/PolymerizerVisualCatalog.js";

const storage = new Map();
globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) =>
        storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
};

const recipe =
    PolymerizerRecipeCatalog.get("EnergyKinase");
assert.equal(recipe.simplifiedStructure, "HLH");
assert.deepEqual(
    recipe.motifRequirements.map(
        ({ productId, quantity }) => ({
            productId,
            quantity
        })
    ),
    [
        { productId: "H_helix", quantity: 2 },
        { productId: "L_loop", quantity: 1 }
    ]
);
assert.equal(recipe.motifCount, 3);
assert.equal(recipe.atpCost, 3);
assert.equal(recipe.discoveryId, null);
assert.equal(recipe.functionDisplay.id, "atpProduction");

const visual =
    PolymerizerVisualCatalog.get("EnergyKinase");
assert.equal(visual.source, "1EI0");
assert.equal(visual.frameCount, 2);
assert.equal(visual.finalFrameOnlyOnCompletion, true);
assert(visual.idleImageUrl.endsWith(
    "/public/assets/polymerizer/proteins/1ei0_motifs/1EI0-1.png"
));
assert(visual.finalImageUrl.endsWith(
    "/public/assets/polymerizer/proteins/1ei0_motifs/1EI0-2.png"
));
assert.equal(
    PolymerizerVisualCatalog.resolveImageUrl(
        "EnergyKinase",
        { progress: 0.9 }
    ),
    visual.idleImageUrl
);
assert.equal(
    PolymerizerVisualCatalog.resolveImageUrl(
        "EnergyKinase",
        { completed: true }
    ),
    visual.finalImageUrl
);

gameState.zones.polymerizer.state = {
    productInventory: {},
    activeAssembly: null
};
gameState.zones.macromolecularizer
    .state.motifInventory = {
        H_helix: 2,
        L_loop: 1
    };
ResourceManager.setATPStatus(
    { current: 10, maximum: 50 },
    "energy-kinase-test-setup"
);
PolymerizerManager.initialize();

const started =
    PolymerizerManager.startAssembly(
        "EnergyKinase",
        1_000
    );
assert.equal(started.success, true);
assert.equal(
    ResourceManager.getATPStatus().current,
    7
);

const finished =
    PolymerizerManager.finishAssembly(
        started.activeAssembly.jobId,
        16_000
    );
assert.equal(finished.success, true);
assert.equal(finished.discoveryGranted, false);
assert.equal(
    gameState.zones.polymerizer.state
        .productInventory.EnergyKinase.count,
    1
);
assert.deepEqual(
    gameState.zones.macromolecularizer
        .state.motifInventory,
    { H_helix: 2, L_loop: 1 }
);

console.log(
    "PASS: Energy Kinase uses the 1EI0 H-L-H teaching scaffold, costs three ATP, preserves motif levels, reveals frame 2 only after completion, and stores no duplicate discovery state."
);
