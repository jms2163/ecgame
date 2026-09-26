import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import Catalog from "../src/app/PhotosystemIIWaterSplittingCatalog.js";
import Library from "../src/app/OrganelleExperimentLibrary.js";
import View, { excitationPath, stepForSplit, scoreAnswers } from "../src/app/PhotosystemIIWaterSplittingView.js";
import Panel from "../src/app/OrganelleExperimentPanel.js";
import ResearchManager from "../src/app/ResearchManager.js";
import SubmissionManager from "../src/app/OrganelleExperimentSubmissionManager.js";
import ProgressReportExporter from "../src/app/ProgressReportExporter.js";

assert.equal(Library.photosystem_ii_water_splitting, Catalog);
assert.deepEqual(Catalog.requirements.perfectScoreExperiments, ["photosystem_ii_excitation"]);
assert.equal(Catalog.assessment.scoreMaximum, 4);
assert.equal(scoreAnswers({
    electron_source: "bonds",
    electron_attractor: "p680_plus",
    electron_count: "four",
    byproduct: "o2"
}).scorePoints, 4);
assert.deepEqual([0, 1, 2, 3].map(stepForSplit), [
    { waterIndex: 0, side: "left" },
    { waterIndex: 0, side: "right" },
    { waterIndex: 1, side: "left" },
    { waterIndex: 1, side: "right" }
]);
assert.deepEqual([0, .25, .5, .75].map(n => excitationPath(() => n)), [
    [0, 1, 2], [1, 2], [3, 4, 5], [4, 5]
]);

const backup = structuredClone(gameState);
const oldRefresh = Panel.refresh;
const oldMove = View.move;
const oldPause = View.pause;
const oldDocument = globalThis.document;
const oldWindow = globalThis.window;
const storage = new Map();
globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
};

try {
    Panel.refresh = () => true;
    ResearchManager.ensureRegistryStructures();
    gameState.registry.research.bestExperimentScores.photosystem_ii_excitation = {
        scorePoints: 3, scoreMaximum: 4, scorePercent: 75
    };
    assert.equal(ResearchManager.getExperimentStatus(Catalog.id).available, false);
    gameState.registry.research.bestExperimentScores.photosystem_ii_excitation = {
        scorePoints: 4, scoreMaximum: 4, scorePercent: 100
    };
    assert.equal(ResearchManager.getExperimentStatus(Catalog.id).available, true);

    const mockNode = () => ({
        innerHTML: "", textContent: "", style: {},
        classList: { add() {}, remove() {} },
        animate: () => ({ finished: Promise.resolve(), cancel() {} })
    });
    const nodes = new Map();
    View.root = {
        innerHTML: "",
        querySelector: selector => {
            if (selector === "[data-water-board]") return null;
            if (!nodes.has(selector)) nodes.set(selector, mockNode());
            return nodes.get(selector);
        }
    };
    View.controls = { innerHTML: "" };
    View.sandbox = false;
    View.psii = false;
    View.waters = 0;
    View.etc = false;
    View.splits = 0;
    View.phase = "setup";
    View.generation = 0;
    View.move = async () => true;
    View.pause = async () => true;
    const xp = gameState.player.xp;

    View.place("psii");
    View.place("water");
    View.place("water");
    View.place("etc");
    assert.equal(View.phase, "ready-split");
    assert.equal(View.waters, 2);
    assert.match(View.root.innerHTML, /P680\+/);
    assert.match(View.root.innerHTML, /data-bond-electron="1-right"/);
    assert.match(View.root.innerHTML, /class="water-oxygen"/);
    assert.match(View.root.innerHTML, /class="water-hydrogen"/);
    assert.match(View.root.innerHTML, /x="624" y="230" width="430"/);
    assert.match(View.controls.innerHTML, /Split H₂O/);

    for (let step = 0; step < 4; step++) {
        await View.splitWater();
        assert.equal(View.splits, step + 1);
        assert.equal(View.phase, step === 3 ? "ready-o2" : "needs-photon");
        assert.equal((View.root.innerHTML.match(/class="water-proton"/g) ?? []).length, step + 1);
        if (step === 0) assert.match(View.root.innerHTML, /cx="261" cy="545" r="9" class="water-bond-electron"/);
        if (step < 3) {
            View.place("photon");
            assert.equal(View.phase, "ready-excite");
            await View.excite();
            assert.equal(View.phase, "ready-split");
            assert.match(View.root.innerHTML, /P680\+/);
        }
    }
    assert.equal(ResearchManager.isExperimentCompleted(Catalog.id), false);
    const bondFrames = [];
    let flightFrame = "";
    View.pause = async () => {
        if (View.phase === "oxygen-bonding") bondFrames.push(View.root.innerHTML);
        return true;
    };
    View.move = async node => {
        if (node === nodes.get("[data-o2]")) flightFrame = View.root.innerHTML;
        return true;
    };
    await View.createO2();
    assert.equal(bondFrames.length, 2);
    assert.match(bondFrames[0], /data-upper-o-bond/);
    assert.doesNotMatch(bondFrames[0], /data-lower-o-bond/);
    assert.match(bondFrames[1], /data-lower-o-bond/);
    assert.match(flightFrame, /data-o2/);
    assert.match(flightFrame, /class="water-o2-spin"/);
    assert.equal(View.phase, "quiz");
    assert.match(View.root.innerHTML, /protons/);
    assert.match(View.root.innerHTML, /H⁺/);
    assert.match(View.root.innerHTML, /O₂/);
    assert.match(View.root.innerHTML, /data-water-submit/);
    assert.equal((View.root.innerHTML.match(/class="water-proton"/g) ?? []).length, 4);
    assert.equal(ResearchManager.isExperimentCompleted(Catalog.id), false);
    assert.equal(gameState.player.xp, xp);
    View.answers = {
        electron_source: "bonds",
        electron_attractor: "photons",
        electron_count: "two",
        byproduct: "o2"
    };
    View.submit();
    assert.equal(SubmissionManager.getSubmissions(Catalog.id).length, 1);
    assert.equal(ResearchManager.isExperimentCompleted(Catalog.id), false);
    assert.equal(gameState.player.xp, xp);
    View.result = null;
    View.answers = {
        electron_source: "bonds",
        electron_attractor: "p680_plus",
        electron_count: "four",
        byproduct: "o2"
    };
    View.submit();
    assert.equal(SubmissionManager.getSubmissions(Catalog.id).length, 2);
    assert.equal(ResearchManager.isExperimentCompleted(Catalog.id), true);
    assert.equal(gameState.player.xp, xp + 150);
    const bestSavedScore = SubmissionManager.getBestScore(Catalog.id);
    const star = SubmissionManager.getStar(Catalog.id);
    assert.deepEqual(
        [bestSavedScore.scorePoints, bestSavedScore.scoreMaximum, bestSavedScore.scorePercent],
        [4, 4, 100]
    );
    assert.equal(star.sourceSubmissionId, SubmissionManager.getSubmissions(Catalog.id)[1].id);
    assert.match(View.root.innerHTML, /Score: 4\/4 \(100%\).*★ Perfect-score star earned/);

    class FakeElement {
        constructor() { this.children = []; this.dataset = {}; this.value = ""; this._text = ""; }
        set textContent(value) { this._text = String(value); this.children = []; }
        get textContent() { return this._text + this.children.map(child => child.textContent).join(""); }
        append(...children) { this.children.push(...children); }
        appendChild(child) { this.children.push(child); return child; }
        addEventListener(type, handler) { this[`on${type}`] = handler; }
        querySelector() { return null; }
        setAttribute() {}
    }
    globalThis.document = { createElement: () => new FakeElement() };
    const card = Panel.createExperimentCard(Catalog, ResearchManager.getExperimentStatus(Catalog.id));
    assert.match(card.textContent, /Completed/);
    assert.match(card.textContent, /Highest score: 4\/4 \(100%\)/);
    assert.match(card.textContent, /★ Perfect-score star earned/);
    const reexamine = card.children.find(child => child.textContent === "Re-examine");
    assert.ok(reexamine);
    assert.equal(card.children.some(child => child.textContent === "Score Quiz"), false);
    let reexaminedExperiment = null;
    Panel.onReexamineExperiment = experiment => {
        assert.equal(experiment.id, Catalog.id);
        reexaminedExperiment = experiment;
    };
    reexamine.onclick();
    assert.equal(reexaminedExperiment, Catalog);
    View.result = null;
    View.sandbox = true;
    View.submit();
    assert.equal(SubmissionManager.getSubmissions(Catalog.id).length, 2);
    assert.equal(SubmissionManager.getBestScore(Catalog.id).scorePercent, 100);
    assert.equal(gameState.player.xp, xp + 150);
    assert.match(View.root.innerHTML, /Perfect re-examination; saved progress is unchanged/);
    View.sandbox = false;
    assert.ok(storage.has("ECGame_Save"));
    gameState.player.id = "water-report-test-player";
    gameState.player.name = "Report Test";
    gameState.player.displayName = "ReportTester";
    gameState.player.profileCreatedAtMs = Date.now();
    gameState.player.nameLockedAtMs = Date.now();
    const reportFile = await ProgressReportExporter.createReportFile({
        generatedAtMs: Date.UTC(2026, 8, 26),
        reportId: "water-splitting-report-test"
    });
    const report = reportFile.payload;
    const best = report.progress.research.bestScores.find(
        entry => entry.activityId === Catalog.id
    );
    assert.deepEqual(
        [best.scorePoints, best.scoreMaximum, best.scorePercent, best.isPerfect],
        [4, 4, 100, true]
    );
    const latest = report.progress.research.submissions.find(
        entry => entry.activityId === Catalog.id
    );
    assert.deepEqual(
        [latest.submissionCount, latest.scorePoints, latest.scoreMaximum, latest.scorePercent],
        [2, 4, 4, 100]
    );
    const journal = report.progress.journal.experimentEntries.filter(
        entry => entry.experimentId === Catalog.id
    );
    assert.deepEqual(journal.map(entry => entry.scorePoints), [2, 4]);
    assert.equal(journal[1].assessmentReport.checks.length, 4);
    assert.equal((await ProgressReportExporter.verifyReportText(reportFile.text)).ok, true);
    await View.createO2();
    assert.equal(gameState.player.xp, xp + 150);
    // An older save may mark the lab complete without a scored quiz submission.
    delete gameState.registry.research.bestExperimentScores[Catalog.id];
    delete gameState.registry.research.stars[Catalog.id];
    delete gameState.registry.research.experimentSubmissions[Catalog.id];
    const legacyCard = Panel.createExperimentCard(
        Catalog, ResearchManager.getExperimentStatus(Catalog.id)
    );
    assert.match(legacyCard.textContent, /Completed.*Quiz score not saved yet/);
    assert.doesNotMatch(legacyCard.textContent, /Review submission/);
    assert.match(legacyCard.textContent, /Score Quiz/);
    let scoreOptions = null;
    Panel.onOpenExperiment = (_experiment, options) => { scoreOptions = options; };
    legacyCard.children.find(child => child.textContent === "Score Quiz").onclick();
    assert.deepEqual(scoreOptions, { mode: "improve" });
    globalThis.window = { addEventListener() {} };
    View.mount({ replaceChildren() {} }, { quizOnly: true });
    assert.match(View.root.innerHTML, /Take the quiz to save a score/);
    assert.match(View.root.innerHTML, /Submit for Score/);
    assert.doesNotMatch(View.root.innerHTML, /data-water-board/);
    View.answers = {
        electron_source: "bonds",
        electron_attractor: "p680_plus",
        electron_count: "four",
        byproduct: "o2"
    };
    View.submit();
    assert.equal(SubmissionManager.getSubmissions(Catalog.id).length, 1);
    assert.equal(SubmissionManager.getBestScore(Catalog.id).scorePercent, 100);
    assert.ok(SubmissionManager.getStar(Catalog.id));
    assert.equal(gameState.player.xp, xp + 150);
    assert.match(View.root.innerHTML, /Score: 4\/4 \(100%\).*★ Perfect-score star earned/);
    const oldMount = View.mount;
    try {
        let resetOptions = null;
        View.container = {};
        View.controlContainer = {};
        View.mount = (_container, options) => { resetOptions = options; };
        View.reset();
        assert.equal(resetOptions.sandbox, false);
        assert.equal(resetOptions.quizOnly, true);
    } finally {
        View.mount = oldMount;
    }
} finally {
    Panel.refresh = oldRefresh;
    Panel.onOpenExperiment = null;
    Panel.onReexamineExperiment = null;
    View.move = oldMove;
    View.pause = oldPause;
    View.root = null;
    View.controls = null;
    if (oldDocument === undefined) delete globalThis.document;
    else globalThis.document = oldDocument;
    if (oldWindow === undefined) delete globalThis.window;
    else globalThis.window = oldWindow;
    for (const key of Object.keys(gameState)) delete gameState[key];
    Object.assign(gameState, backup);
}

console.log("PASS: perfect excitation gate, four splits, oxygen and protons, scored attempts, reward once.");
