import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import View from "../src/app/PhotosystemIIAssemblyView.js";
import Panel from "../src/app/OrganelleExperimentPanel.js";
import ResearchManager from "../src/app/ResearchManager.js";
import SubmissionManager from "../src/app/OrganelleExperimentSubmissionManager.js";

const backup = structuredClone(gameState);
const oldRefresh = Panel.refresh;
const storage = new Map();
globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
};

try {
    Panel.refresh = () => true;
    View.root = { innerHTML: "" };
    View.placed = new Set([
        "psii", "acceptor", "p680",
        ...Array.from({ length: 6 }, (_, i) => `chl${i}`)
    ]);
    View.sandbox = false;
    View.result = null;
    const originalXP = gameState.player.xp;

    View.answers = {
        chlorophyll_identity: "pigment",
        psii_identity: "protein",
        stroma_location: "lumen"
    };
    View.submit();
    assert.equal(SubmissionManager.getSubmissions("photosystem_ii_assembly").length, 1);
    assert.equal(ResearchManager.getExperimentStatus("photosystem_ii_excitation").available, false);
    assert.equal(gameState.player.xp, originalXP);

    View.result = null;
    View.answers = {
        chlorophyll_identity: "pigment",
        psii_identity: "protein",
        stroma_location: "chloroplast"
    };
    View.submit();
    assert.equal(SubmissionManager.getSubmissions("photosystem_ii_assembly").length, 2);
    assert.equal(ResearchManager.isExperimentCompleted("photosystem_ii_assembly"), true);
    assert.equal(ResearchManager.getExperimentStatus("photosystem_ii_excitation").available, true);
    assert.equal(gameState.player.xp, originalXP + 150);
    assert.ok(storage.has("ECGame_Save"));
} finally {
    Panel.refresh = oldRefresh;
    View.root = null;
    for (const key of Object.keys(gameState)) delete gameState[key];
    Object.assign(gameState, backup);
}

console.log("PASS: wrong PSII score saves without unlocking; perfect retry saves, rewards once, and unlocks excitation.");
