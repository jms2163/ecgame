// Run with: node tests/pseudopodia-phagocytosis-progression.test.mjs

import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import CellMapLayout from "../src/app/CellMapLayout.js";
import OrganelleExperimentLibrary
    from "../src/app/OrganelleExperimentLibrary.js";
import OrganelleProgressionManager
    from "../src/app/OrganelleProgressionManager.js";
import ResearchManager from "../src/app/ResearchManager.js";
import organelleLibrary from "../src/data/organelleLibrary.js";

const backup = structuredClone(gameState);

try {
    gameState.registry ??= {};
    gameState.registry.discoveries = [];
    gameState.registry.research ??= {};
    gameState.registry.research.completedExperiments = {};
    gameState.registry.research.bestExperimentScores = {};
    gameState.registry.research.experimentSubmissions = {};
    gameState.registry.discoveries.push("cytoskeleton");

    const pseudopodiaFeature = CellMapLayout.features.find(
        feature => feature.id === "pseudopodia"
    );
    assert.equal(pseudopodiaFeature.labFocusId, "cytoskeleton");
    assert.equal(
        OrganelleProgressionManager.getStatus("cytoskeleton")
            .progressionState,
        "available"
    );

    const extension = OrganelleExperimentLibrary
        .pseudopodia_membrane_extension;
    assert.equal(extension.organelleId, "cytoskeleton");
    assert.equal(extension.releaseStatus, "active");
    assert.match(extension.title, /Pseudopod Extension/);
    assert.match(extension.objective, /28 small colored lipids/);
    assert.deepEqual(
        extension.grants.discoveries,
        ["phagocytosis_ready"]
    );
    assert.deepEqual(extension.grants.metricEffects, []);
    assert.deepEqual(
        extension.requirements.perfectScoreExperiments,
        ["cytoskeleton_transport"]
    );
    assert.equal(
        ResearchManager.getExperimentStatus(extension.id).available,
        false
    );

    gameState.registry.research.completedExperiments
        .cytoskeleton_transport = { completedAtMs: 5 };
    gameState.registry.research.bestExperimentScores
        .cytoskeleton_transport = { scorePercent: 99 };
    assert.equal(
        ResearchManager.getExperimentStatus(extension.id).available,
        false,
        "completion plus 99% must not bypass the perfect-score prerequisite"
    );

    gameState.registry.research.bestExperimentScores
        .cytoskeleton_transport.scorePercent = 100;
    assert.equal(
        ResearchManager.getExperimentStatus(extension.id).available,
        true
    );

    assert.deepEqual(
        organelleLibrary.food_vacuole.unlock.requirements,
        [
            {
                type: "experiment_completed",
                id: "pseudopodia_membrane_extension",
                label: "complete Pseudopod Extension: Curve, Push, Stabilize"
            }
        ]
    );
    assert.equal(
        OrganelleProgressionManager.getStatus("food_vacuole")
            .progressionState,
        "locked"
    );

    gameState.registry.research.completedExperiments
        .pseudopodia_membrane_extension = {
            completedAtMs: 10
        };

    assert.equal(
        OrganelleProgressionManager.getStatus("food_vacuole")
            .progressionState,
        "coming-soon"
    );

    const phagocytosis = OrganelleExperimentLibrary
        .food_vacuole_phagocytosis;
    assert.equal(phagocytosis.organelleId, "food_vacuole");
    assert.equal(phagocytosis.releaseStatus, "coming-soon");
    assert.deepEqual(
        phagocytosis.requirements.completedExperiments,
        ["pseudopodia_membrane_extension"]
    );
    assert.deepEqual(
        phagocytosis.plannedMissions.map(mission => mission.id),
        ["surround_food_particle", "pinch_and_seal"]
    );
    assert.deepEqual(
        phagocytosis.plannedGrants.discoveries,
        ["successful_phagocytosis", "food_vacuole"]
    );
    assert.equal(
        ResearchManager.getExperimentStatus(phagocytosis.id).comingSoon,
        true
    );
} finally {
    for (const key of Object.keys(gameState)) delete gameState[key];
    Object.assign(gameState, backup);
}

console.log(
    "PASS: the Cytoskeleton Lab requires a perfect transport result before releasing the two-mission pseudopod activity, whose completion reveals Food Vacuole phagocytosis without premature rewards."
);
