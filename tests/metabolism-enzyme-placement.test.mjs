// Run with: node tests/metabolism-enzyme-placement.test.mjs

import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import ATPManager from "../src/app/ATPManager.js";
import MetabolismManager
    from "../src/app/MetabolismManager.js";

const storage = new Map();
globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) =>
        storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
};

gameState.zones.metabolism.state = {};
gameState.zones.polymerizer.state = {
    productInventory: {},
    activeAssembly: null
};
MetabolismManager.initialize();

assert.deepEqual(
    gameState.zones.metabolism.state,
    {
        pathwayPlacements: {},
        completedModules: {}
    }
);

let result = MetabolismManager.placeEnzyme(
    "glycolysis", 1, "Hexokinase"
);
assert.equal(result.reason, "pathway-locked");

const inventory =
    gameState.zones.polymerizer.state
        .productInventory;
inventory.GlucoseTransporter = { count: 1 };
inventory.Hexokinase = { count: 1 };
inventory.LactateDehydrogenase = { count: 1 };

result = MetabolismManager.placeEnzyme(
    "glycolysis", 2, "Hexokinase"
);
assert.equal(
    result.reason,
    "incorrect-enzyme-for-slot"
);

result = MetabolismManager.placeEnzyme(
    "glycolysis", 1, "Hexokinase"
);
assert.equal(result.success, true);
assert.equal(result.reconstruction.atpPerMinute, 1);
assert.equal(
    ATPManager.getProductionStatus()
        .totalATPPerMinute,
    2
);

const duplicate = MetabolismManager.placeEnzyme(
    "glycolysis", 1, "Hexokinase"
);
assert.equal(
    duplicate.reason,
    "enzyme-already-placed"
);

const ldh = MetabolismManager.placeEnzyme(
    "glycolysis", 11, "LactateDehydrogenase"
);
assert.equal(ldh.success, true);
assert.equal(ldh.regenerationComplete, true);
assert.equal(
    ATPManager.getProductionStatus()
        .totalATPPerMinute,
    2,
    "LDH regeneration must not directly create ATP"
);

const status =
    MetabolismManager.getPathwayStatus("glycolysis");
assert.deepEqual(
    status.placements,
    {
        1: "Hexokinase",
        11: "LactateDehydrogenase"
    }
);
assert.equal(status.reconstruction.percent, 10);

console.log(
    "PASS: synthesized enzymes lock into only their correct saved Glycolysis slots, core placements add one ATP/min independently, and LDH regenerates NAD+ without a direct ATP bonus."
);
