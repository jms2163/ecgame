import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import SaveManager from "../src/app/SaveManager.js";
import MetabolismManager from "../src/app/MetabolismManager.js";
import CalvinActivityManager from "../src/app/CalvinActivityManager.js";
import { FIXATION_ACTIVITY_ID, createFixationSession, dockFixationInput,
    beginFixation, finishFixation, storeFixationProducts, advanceFixation, answerFixation,
    fixationLedger } from "../src/app/CalvinFixationModel.js";

const storage = new Map();
globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
};
gameState.zones.metabolism.state = { unrelatedProgress: { preserved: true } };
gameState.zones.polymerizer.state.productInventory = {};
MetabolismManager.initialize();
assert.equal(CalvinActivityManager.start(), false, "RuBisCO placement is required");
gameState.zones.polymerizer.state.productInventory.RuBisCO = { count: 1 };
assert.equal(CalvinActivityManager.start(), false, "synthesis alone does not activate the reaction");
assert.equal(MetabolismManager.placeEnzyme("calvinCycle", 1, "RuBisCO").success, true);
const resourcesBefore = structuredClone(gameState.registry.resources);
const inventoryBefore = structuredClone(gameState.zones.polymerizer.state.productInventory);
const stateBefore = structuredClone(gameState.zones.metabolism.state);
assert.equal(CalvinActivityManager.start(), true);
assert.deepEqual(gameState.zones.metabolism.state, stateBefore, "opening a lesson creates no persistent state");
assert.equal(CalvinActivityManager.complete().reason, "activity-incomplete");

const session = CalvinActivityManager.session;
assert.equal(beginFixation(session), false);
assert.equal(dockFixationInput(session, "ATP"), false);
assert.equal(dockFixationInput(session, "RuBisCO"), true);
assert.equal(dockFixationInput(session, "RuBisCO"), false);
for (let round = 1; round <= 3; round += 1) {
    assert.equal(dockFixationInput(session, "RuBP"), true);
    assert.equal(beginFixation(session), false, "CO2 is also needed");
    assert.equal(dockFixationInput(session, "CO2"), true);
    assert.equal(beginFixation(session), true);
    assert.equal(beginFixation(session), false, "double click cannot run two reactions");
    assert.equal(dockFixationInput(session, "CO2"), false, "input is locked during the reaction");
    assert.equal(finishFixation(session), false, "cleavage requires water first");
    assert.equal(dockFixationInput(session, "H2O"), true);
    assert.equal(dockFixationInput(session, "H2O"), false, "water is used once");
    assert.equal(finishFixation(session), true);
    assert.equal(finishFixation(session), false);
    assert.equal(session.enzymeDocked, true, "enzyme is reused");
    assert.equal(session.reactions, round);
    assert.deepEqual(fixationLedger(session), {
        co2Used: round, ruBPUsed: round, pgaProduced: round * 2,
        carbonIn: round * 6, carbonOut: round * 6, newlyFixedCarbon: round,
        waterUsed: round, atpSpent: 0, atpMade: 0
    });
    assert.equal(advanceFixation(session), false, "products must be collected before the next round");
    assert.equal(storeFixationProducts(session), true);
    assert.equal(storeFixationProducts(session), false, "products cannot be stored twice");
    assert.equal(advanceFixation(session), true);
}
assert.equal(session.phase, "quiz");
assert.equal(CalvinActivityManager.complete().reason, "activity-incomplete");
assert.equal(answerFixation(session, "ATP"), false);
assert.equal(session.phase, "quiz");
assert.equal(answerFixation(session, "CO2"), true);

const save = SaveManager.save;
SaveManager.save = () => false;
assert.equal(CalvinActivityManager.complete(123).reason, "save-failed");
assert.deepEqual(gameState.zones.metabolism.state, stateBefore, "save failure rolls back the new field");
SaveManager.save = save;
assert.equal(CalvinActivityManager.complete(123).success, true);
assert.equal(CalvinActivityManager.getStatus().completed, true);
assert.equal(CalvinActivityManager.getStatus().completedAtMs, 123);
assert.deepEqual(gameState.zones.metabolism.state.unrelatedProgress, { preserved: true });
assert.deepEqual(gameState.zones.metabolism.state.pathwayPlacements, stateBefore.pathwayPlacements);
assert.deepEqual(gameState.zones.metabolism.state.completedModules, stateBefore.completedModules);
assert.deepEqual(gameState.registry.resources, resourcesBefore, "lesson does not spend or award player resources");
assert.deepEqual(gameState.zones.polymerizer.state.productInventory, inventoryBefore);
assert.equal(JSON.parse(storage.get("ECGame_Save")).zones.metabolism.state
    .guidedActivities[FIXATION_ACTIVITY_ID].completed, true, "normal saves include activity progress");
assert.equal(CalvinActivityManager.complete(456).reason, "replay-complete");
assert.equal(CalvinActivityManager.getStatus().completedAtMs, 123);
CalvinActivityManager.start();
assert.equal(CalvinActivityManager.session.reactions, 0);
assert.equal(CalvinActivityManager.getStatus().completed, true, "replay preserves mastery");
CalvinActivityManager.reset();
assert.equal(CalvinActivityManager.session, null);

// Existing guided activities survive writes and rollbacks.
delete gameState.zones.metabolism.state.guidedActivities[FIXATION_ACTIVITY_ID];
gameState.zones.metabolism.state.guidedActivities.otherLesson = { completed: true };
CalvinActivityManager.session = { ...createFixationSession(), phase: "complete",
    reactions: 3, carbonSource: "CO2" };
SaveManager.save = () => false;
assert.equal(CalvinActivityManager.complete().reason, "save-failed");
assert.deepEqual(gameState.zones.metabolism.state.guidedActivities, { otherLesson: { completed: true } });
SaveManager.save = save;
assert.equal(CalvinActivityManager.complete().success, true);
assert.equal(gameState.zones.metabolism.state.guidedActivities.otherLesson.completed, true);
console.log("PASS: Calvin fixation conserves carbon, gates completion, persists mastery, supports replay, and preserves existing resources and saves.");
