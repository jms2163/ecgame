import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import gameState from "../src/app/GameState.js";
import Library from "../src/app/OrganelleExperimentLibrary.js";
import Panel from "../src/app/OrganelleExperimentPanel.js";
import ResearchManager from "../src/app/ResearchManager.js";
import Submissions from "../src/app/OrganelleExperimentSubmissionManager.js";
import { V_PARTS } from "../src/app/VATPaseAssemblyView.js";

const snapshot = structuredClone(gameState);
try {
    const v = Library.v_atpase_assembly;
    const f = Library.photosynthetic_atp_synthase;
    assert.equal(v.title, "Assemble V-ATPase in testing");
    assert.deepEqual(V_PARTS.map(part => part.id), ["c-ring", "a", "d-e", "d-f", "a-b", "e-g", "c", "h"]);
    assert.equal(f.title, "Assemble F-ATPase");
    for (const organelle of ["contractile_vacuole", "lysosomes", "endosome"])
        assert.equal(Panel.getExperimentsForOrganelle(organelle).filter(item => item.id === v.id).length, 1);
    for (const organelle of ["symbiosomes", "mitochondria"])
        assert.equal(Panel.getExperimentsForOrganelle(organelle).filter(item => item.id === f.id).length, 1);
    assert.equal(ResearchManager.getExperimentStatus(v.id).available, false);
    assert.equal(ResearchManager.getExperimentStatus(f.id, "symbiosomes").available, false);
    assert.equal(ResearchManager.getExperimentStatus(f.id, "mitochondria").available, false);
    assert.deepEqual(ResearchManager.getExperimentStatus(f.id, "mitochondria").missingDiscoveries,
        ["glycolysis", "pyruvate_oxidation", "citric_acid_cycle"]);
    assert.equal(ResearchManager.getExperimentStatus(f.id, "symbiosomes").incompleteExperiments.length, 5);
    gameState.registry ??= {};
    gameState.registry.discoveries = ["glycolysis", "pyruvate_oxidation", "citric_acid_cycle"];
    gameState.registry.research ??= {};
    gameState.registry.research.bestExperimentScores ??= {};
    gameState.registry.research.completedExperiments ??= {};
    assert.equal(ResearchManager.getExperimentStatus(f.id, "mitochondria").available, true,
        "the mitochondrial discovery route is independent of symbiosome quiz scores");
    assert.equal(ResearchManager.getExperimentStatus(f.id, "symbiosomes").available, false);
    for (const id of f.requirementsByOrganelle.symbiosomes.perfectScoreExperiments)
        gameState.registry.research.bestExperimentScores[id] = { scorePoints: 5, scoreMaximum: 5, scorePercent: 100 };
    assert.deepEqual(ResearchManager.getExperimentStatus(f.id, "symbiosomes").incompleteExperiments, []);
    assert.deepEqual(ResearchManager.getExperimentStatus(f.id, "mitochondria").missingDiscoveries, []);
    assert.equal(ResearchManager.getExperimentStatus(f.id, "mitochondria").available, true);
    assert.equal(ResearchManager.getExperimentStatus(f.id, "symbiosomes").available, true);
    gameState.registry.research.completedExperiments[f.id] = { completedAtMs: Date.now() };
    assert.equal(ResearchManager.getExperimentStatus(f.id, "mitochondria").completed, true);
    assert.equal(ResearchManager.getExperimentStatus(f.id, "symbiosomes").completed, true);
    delete gameState.registry.research.completedExperiments[f.id];
    gameState.registry.research.bestExperimentScores[v.id] = { scorePoints: 5, scoreMaximum: 5, scorePercent: 100 };
    assert.equal(Submissions.getBestScore(Panel.getExperimentsForOrganelle("endosome").find(item => item.id === v.id).id).scorePercent, 100);
    assert.equal(Submissions.getBestScore(Panel.getExperimentsForOrganelle("lysosomes").find(item => item.id === v.id).id).scorePercent, 100);
    assert.ok(existsSync(new URL("../public/assets/organelles/f-atpase-reference.png", import.meta.url)));
    assert.match(f.summary, /intermembrane space to the matrix/);
    assert.match(f.summary, /lumen to the stroma/);
    const completion = ResearchManager.completeExperiment(f.id, "mitochondria");
    assert.equal(completion.completed, true, "a mitochondrial submission uses its own prerequisite route");
    assert.equal(ResearchManager.getExperimentStatus(f.id, "symbiosomes").completed, true);
} finally {
    for (const key of Object.keys(gameState)) delete gameState[key];
    Object.assign(gameState, snapshot);
}
console.log("PASS: locked V assembly, playable shared F synthesis, location-specific gates, and shared completion.");
