import assert from "node:assert/strict";
import fs from "node:fs";
import Catalog from "../src/app/PhotosystemIIAssemblyCatalog.js";
import View, { scoreAnswers } from "../src/app/PhotosystemIIAssemblyView.js";
import OrganelleExperimentLibrary from "../src/app/OrganelleExperimentLibrary.js";
import ResearchManager from "../src/app/ResearchManager.js";
import gameState from "../src/app/GameState.js";

assert.equal(OrganelleExperimentLibrary.photosystem_ii_assembly, Catalog);
assert.equal(Catalog.organelleId, "symbiosomes");
assert.equal(Catalog.stage.template, "photosystem_ii_assembly");
assert.equal(Catalog.grants.xp, 150);
assert.equal(Catalog.assessment.questions.length, 3);
assert.equal(Catalog.assessment.completionThresholdPercent, 100);
assert.deepEqual(
    OrganelleExperimentLibrary.photosystem_ii_excitation
        .requirements.perfectScoreExperiments,
    [Catalog.id]
);

View.root = { innerHTML: "" };
View.placed = new Set();
View.selected = null;
View.place("chlorophyll", "chl0");
assert.equal(View.placed.size, 0, "protein scaffold is required first");
View.place("psii", "psii");
View.place("acceptor", "chl0");
assert.equal(View.placed.size, 1, "pieces cannot occupy mismatched targets");
for (let i = 0; i < 6; i++) View.place("chlorophyll", `chl${i}`);
View.place("p680", "p680");
View.place("acceptor", "acceptor");
assert.equal(View.placed.size, 9);
assert.match(View.root.innerHTML, /Assembly complete/);
assert.match(View.root.innerHTML, /Answer the questions below/);
assert.match(View.root.innerHTML, /Submit for Score/);
assert.match(View.root.innerHTML, /psii-material-card/);
assert.match(View.root.innerHTML, /data-material="psii"[\s\S]*?<svg/);
assert.match(View.root.innerHTML, /Chlorophyll a \(6\/6\)/);
assert.match(View.root.innerHTML, /organelle-experiment-material-name/);

const wrong = scoreAnswers({
    chlorophyll_identity: "pigment",
    psii_identity: "protein",
    stroma_location: "lumen"
});
assert.equal(wrong.scorePoints, 2);
assert.equal(wrong.isPerfect, false);
const correct = scoreAnswers({
    chlorophyll_identity: "pigment",
    psii_identity: "protein",
    stroma_location: "chloroplast"
});
assert.equal(correct.scorePoints, 3);
assert.equal(correct.isPerfect, true);

const oldBest = gameState.registry.research.bestExperimentScores?.[Catalog.id];
gameState.registry.research.bestExperimentScores ??= {};
try {
    gameState.registry.research.bestExperimentScores[Catalog.id] = {
        scorePoints: 2, scoreMaximum: 3, scorePercent: wrong.scorePercent
    };
    assert.equal(ResearchManager.getExperimentStatus("photosystem_ii_excitation").available, false);
    gameState.registry.research.bestExperimentScores[Catalog.id] = {
        scorePoints: 3, scoreMaximum: 3, scorePercent: 100
    };
    assert.equal(ResearchManager.getExperimentStatus("photosystem_ii_excitation").available, true);
} finally {
    if (oldBest === undefined) delete gameState.registry.research.bestExperimentScores[Catalog.id];
    else gameState.registry.research.bestExperimentScores[Catalog.id] = oldBest;
}

const stage = fs.readFileSync(
    new URL("../src/app/OrganelleExperimentStage.js", import.meta.url),
    "utf8"
);
assert.match(stage, /PhotosystemIIAssemblyView\.mount\(this\.contentElement,/);

console.log("PASS: PSII assembly, three-question scoring, and perfect-score excitation gate.");
