import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import Catalog from "../src/app/PhotosystemIIExcitationCatalog.js";
import View, { excitationPath, scoreAnswers } from "../src/app/PhotosystemIIExcitationView.js";
import Panel from "../src/app/OrganelleExperimentPanel.js";
import ResearchManager from "../src/app/ResearchManager.js";
import SubmissionManager from "../src/app/OrganelleExperimentSubmissionManager.js";

assert.deepEqual([0, .25, .5, .75].map(value => excitationPath(() => value)), [
    [0, 1, 2], [1, 2], [3, 4, 5], [4, 5]
]);
assert.equal(Catalog.requirements.perfectScoreExperiments[0], "photosystem_ii_assembly");
assert.equal(Catalog.stage.preview, undefined);
assert.equal(scoreAnswers({
    green_absorption: "false",
    light_target: "any",
    energy_destination: "p680",
    acceptor_role: "accept_electron"
}).scorePoints, 4);

const backup = structuredClone(gameState);
const oldRefresh = Panel.refresh;
const oldMove = View.move;
const oldPause = View.pause;
const storage = new Map();
globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
};

try {
    Panel.refresh = () => true;
    const greenPhoton = { style: {} };
    View.move = async (_node, dx, dy) => {
        assert.ok(Math.abs(dx) > 400, "Green photon should travel across the board");
        assert.ok(Math.abs(dy) > 300, "Green photon should exit diagonally");
        return true;
    };
    View.root = {
        innerHTML: "",
        querySelector: selector => selector === "[data-photon]" ? greenPhoton : null
    };
    View.assembled = true;
    View.photon = { x: 140, y: 105, color: "green" };
    View.observed = false;
    View.greenMissed = false;
    await View.excite();
    assert.equal(View.greenMissed, true);
    assert.equal(View.observed, false);
    assert.match(View.root.innerHTML, /chlorophyll doesn't absorb green light/);
    assert.doesNotMatch(View.root.innerHTML, /data-submit-quiz/);
    View.reset();
    assert.equal(View.photon, null);
    assert.equal(View.greenMissed, false);

    const mockNode = () => ({ style: {}, classList: { add() {}, remove() {} }, textContent: "" });
    const movingElectron = mockNode();
    const p680Label = mockNode();
    const nodes = new Map([
        ["[data-photon]", mockNode()],
        ["[data-electron]", movingElectron],
        ["[data-captured-electron]", mockNode()],
        ["[data-p680]", mockNode()],
        ["[data-p680-label]", p680Label],
        ["[data-excitation-status]", mockNode()]
    ]);
    View.root = { innerHTML: "", querySelector: selector => nodes.get(selector) ?? mockNode() };
    View.assembled = true;
    View.photon = { x: 140, y: 105, color: "red" };
    View.pause = async () => true;
    View.move = async node => {
        if (node === movingElectron) assert.equal(p680Label.textContent, "P680+");
        return true;
    };
    await View.excite();
    assert.equal(View.observed, true);
    assert.equal(View.p680Oxidized, true);
    assert.match(View.root.innerHTML, /data-p680-label[^>]*>P680\+/);
    assert.match(View.root.innerHTML, /data-electron[^>]*>.*?psii-electron-label[^>]*>e</s);
    assert.match(View.root.innerHTML, /data-captured-electron[^>]*>.*?psii-electron-label[^>]*>e</s);
    View.reset();
    assert.equal(View.p680Oxidized, false);
    View.move = oldMove;
    View.pause = oldPause;

    View.root = { innerHTML: "", querySelector: () => null };
    View.assembled = true;
    View.photon = { x: 140, y: 100 };
    View.observed = true;
    View.sandbox = false;
    View.result = null;
    // A completed assembly and its saved perfect score are the actual entry gate.
    ResearchManager.ensureRegistryStructures();
    gameState.registry.research.completedExperiments.photosystem_ii_assembly = { completedAtMs: 1 };
    gameState.registry.research.bestExperimentScores.photosystem_ii_assembly = {
        scorePoints: 3, scoreMaximum: 3, scorePercent: 100
    };
    assert.equal(ResearchManager.getExperimentStatus(Catalog.id).available, true);
    const xp = gameState.player.xp;
    View.answers = {
        green_absorption: "true",
        light_target: "any",
        energy_destination: "upward",
        acceptor_role: "accept_electron"
    };
    View.submit();
    assert.equal(SubmissionManager.getSubmissions(Catalog.id).length, 1);
    assert.equal(ResearchManager.isExperimentCompleted(Catalog.id), false);
    assert.equal(gameState.player.xp, xp);

    View.result = null;
    View.answers = {
        green_absorption: "false",
        light_target: "any",
        energy_destination: "p680",
        acceptor_role: "accept_electron"
    };
    View.submit();
    assert.equal(SubmissionManager.getSubmissions(Catalog.id).length, 2);
    assert.equal(ResearchManager.isExperimentCompleted(Catalog.id), true);
    assert.equal(gameState.player.xp, xp + 150);
    assert.ok(storage.has("ECGame_Save"));
} finally {
    Panel.refresh = oldRefresh;
    View.move = oldMove;
    View.pause = oldPause;
    View.root = null;
    for (const key of Object.keys(gameState)) delete gameState[key];
    Object.assign(gameState, backup);
}

console.log("PASS: photon branches, four-question scoring, saved attempts, and excitation completion.");
