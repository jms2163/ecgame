// Run with: node tests/atomizer-hydrogen.test.mjs
// Regression coverage for Hydrogen production and the Molecular Lab gate.

import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import AtomizerManager
    from "../src/app/AtomizerManager.js";
import ObjectiveRegistry
    from "../src/app/ObjectiveRegistry.js";
import QuestCatalog
    from "../src/app/QuestCatalog.js";

globalThis.localStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {}
};

const atomizerState =
    gameState.zones.atomizer.state;
const hydrogen = atomizerState.atoms.H;
const objective =
    QuestCatalog.unlock_molecule_lab
        .objectives[0];

// A legacy baseline must not turn the requirement into "two more atoms."
const legacyRecord = {
    objectiveBaselines: {
        "atom-harvest:H:0": 100
    }
};

hydrogen.count = 100;
let progress = ObjectiveRegistry.evaluate({
    questId: "unlock_molecule_lab",
    objective,
    objectiveIndex: 0,
    record: legacyRecord
});
assert.equal(progress.current, 2);
assert.equal(progress.currentCount, 100);
assert.equal(progress.complete, true);
assert.equal(progress.baseline, null);

hydrogen.count = 2;
progress = ObjectiveRegistry.evaluate({
    questId: "unlock_molecule_lab",
    objective,
    objectiveIndex: 0,
    record: legacyRecord
});
assert.equal(progress.complete, true);

hydrogen.count = 1;
progress = ObjectiveRegistry.evaluate({
    questId: "unlock_molecule_lab",
    objective,
    objectiveIndex: 0,
    record: legacyRecord
});
assert.equal(progress.current, 1);
assert.equal(progress.complete, false);

// Closed-browser production is reconciled once from the saved timestamp.
AtomizerManager.state = atomizerState;
hydrogen.count = 0;
hydrogen.progress = 0;
hydrogen.unlocked = true;
hydrogen.baseRate = 30;
hydrogen.cap = 100;
atomizerState.spAllocated.H = 0;
atomizerState.lastActiveTimestamp = 1_000;

AtomizerManager.processOfflineGeneration(
    61_000
);
assert.equal(hydrogen.count, 2);
assert.equal(
    atomizerState.lastActiveTimestamp,
    61_000
);

// Reconciliation at the same timestamp cannot award the same minute again.
AtomizerManager.processOfflineGeneration(
    61_000
);
assert.equal(hydrogen.count, 2);

// A live global tick advances production and refreshes the offline boundary.
const beforeTick = Date.now();
AtomizerManager.tick(1);
assert(
    atomizerState.lastActiveTimestamp >=
        beforeTick
);
const afterLiveTick = hydrogen.count;
AtomizerManager.processOfflineGeneration(
    atomizerState.lastActiveTimestamp
);
assert.equal(hydrogen.count, afterLiveTick);

assert.match(
    QuestCatalog.unlock_molecule_lab
        .description,
    /at least 2 Hydrogen atoms available/
);

console.log(
    "PASS: Atomizer offline generation reconciles once without double-counting live zone time, and Molecular Foundations completes from current Hydrogen inventory >= 2 even when a legacy baseline exists."
);
