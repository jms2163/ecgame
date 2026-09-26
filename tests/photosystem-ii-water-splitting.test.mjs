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
} finally {
    Panel.refresh = oldRefresh;
    View.move = oldMove;
    View.pause = oldPause;
    View.root = null;
    View.controls = null;
    for (const key of Object.keys(gameState)) delete gameState[key];
    Object.assign(gameState, backup);
}

console.log("PASS: perfect excitation gate, four splits, oxygen and protons, scored attempts, reward once.");
