import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import GameStateManager from "../src/app/GameStateManager.js";
import GameStateObserver from "../src/app/GameStateObserver.js";
import MetabolismUnlockManager from "../src/app/MetabolismUnlockManager.js";
import PondDiscoveryManager from "../src/app/PondDiscoveryManager.js";
import OrganelleProgressionManager from "../src/app/OrganelleProgressionManager.js";
import QuestManager from "../src/app/QuestManager.js";
import ZoneStatusResolver from "../src/app/ZoneStatusResolver.js";

const store = new Map();
globalThis.localStorage = {
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key)
};

gameState.zones.metabolism.unlocked = false;
gameState.zones.polymerizer.state.productInventory = {};
gameState.zones.pond.state.discoveredMicrobiomes = {};

PondDiscoveryManager.initialize();
QuestManager.initialize();
MetabolismUnlockManager.initialize();

assert.equal(ZoneStatusResolver.getStatus("metabolism").interactive, false);
assert.equal(QuestManager.getQuestStatus("photosynthetic_partner").active, false);
assert.equal(OrganelleProgressionManager.getStatus("symbiosomes").available, false);

const drift = PondDiscoveryManager.recordArrival(
    { biome: "algae_patch" }, { x: 2, y: 4 }, "current-drift"
);
assert.equal(drift.discovered, false);
assert.equal(OrganelleProgressionManager.getStatus("symbiosomes").available, false);

const arrival = PondDiscoveryManager.recordArrival(
    { biome: "algae_patch" }, { x: 2, y: 4 }
);
assert.equal(arrival.discovered, true);
assert.equal(OrganelleProgressionManager.getStatus("symbiosomes").available, true);
assert.equal(QuestManager.getQuestStatus("photosynthetic_partner").active, true);
assert.equal(QuestManager.getQuestStatus("photosynthetic_partner").claimable, true);

gameState.zones.polymerizer.state.productInventory.GlucoseTransporter = {
    count: 1
};
GameStateObserver.notify("polymerizer-product-completed", {
    productId: "GlucoseTransporter"
});
assert.equal(GameStateManager.isZoneUnlocked("metabolism"), true);
assert.equal(ZoneStatusResolver.getStatus("metabolism").interactive, true);

gameState.zones.metabolism.unlocked = false;
GameStateObserver.notify("game-state-loaded", {});
assert.equal(GameStateManager.isZoneUnlocked("metabolism"), true,
    "older saves with completed transporter must reconcile");

console.log("PASS: active algae discovery opens symbiosomes and quest; Glucose Transporter opens Metabolism and reconciles old saves.");
