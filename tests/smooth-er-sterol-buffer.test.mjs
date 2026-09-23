// Run with: node tests/smooth-er-sterol-buffer.test.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import gameState from "../src/app/GameState.js";
import ResearchManager from "../src/app/ResearchManager.js";
import SterolCatalog
    from "../src/app/SmoothERSterolBufferCatalog.js";
import CurvatureCatalog
    from "../src/app/SmoothERMembraneCurvatureCatalog.js";
import {
    CHOLESTEROL_SITE_COUNT,
    TRIALS,
    calculateSterolStability,
    getSterolStabilityBand
} from "../src/app/SmoothERSterolBufferView.js";

const backup = structuredClone(gameState);

try {
    assert.equal(SterolCatalog.releaseStatus, "active");
    assert.deepEqual(
        SterolCatalog.requirements.completedExperiments,
        ["smooth_er_lipid_composition"]
    );
    assert.equal(SterolCatalog.grants.xp, 250);
    assert.deepEqual(
        SterolCatalog.grants.metricEffects,
        [],
        "the SER teaching lab must not alter cell-wide metrics"
    );
    assert.deepEqual(
        SterolCatalog.grants.achievements,
        ["ser_membrane_buffer"]
    );
    assert.deepEqual(
        SterolCatalog.grants.discoveries,
        [
            "smooth_er_sterol_regulation",
            "erg1_squalene_epoxidase_recipe",
            "erg7_lanosterol_synthase_recipe"
        ]
    );

    assert.equal(CHOLESTEROL_SITE_COUNT, 6);
    assert.deepEqual(
        TRIALS.map(trial => trial.id),
        ["cold_snap", "warm_surge"]
    );
    assert.equal(getSterolStabilityBand(
        calculateSterolStability(0)
    ), "unstable");
    assert.equal(getSterolStabilityBand(
        calculateSterolStability(2)
    ), "buffered");
    assert.equal(getSterolStabilityBand(
        calculateSterolStability(3)
    ), "buffered");
    assert.equal(getSterolStabilityBand(
        calculateSterolStability(4)
    ), "constrained");

    gameState.registry ??= {};
    gameState.registry.discoveries = [];
    gameState.registry.achievements = {};
    gameState.registry.research ??= {};
    gameState.registry.research.completedExperiments = {};
    gameState.registry.research.bestExperimentScores = {};
    gameState.registry.research.experimentSubmissions = {};

    const beforeLab1 = ResearchManager.getExperimentStatus(
        SterolCatalog.id
    );
    assert.equal(beforeLab1.available, false);
    assert.deepEqual(
        beforeLab1.incompleteExperiments,
        ["smooth_er_lipid_composition"]
    );

    const lab1Completion = ResearchManager.completeExperiment(
        "smooth_er_lipid_composition"
    );
    assert.equal(lab1Completion.completed, true);

    const afterLab1 = ResearchManager.getExperimentStatus(
        SterolCatalog.id
    );
    assert.equal(afterLab1.available, true);

    const lab2Completion = ResearchManager.completeExperiment(
        SterolCatalog.id
    );
    assert.equal(lab2Completion.completed, true);
    assert.equal(lab2Completion.xpAwarded, 250);
    assert.deepEqual(lab2Completion.appliedMetricEffects, []);
    assert.ok(gameState.registry.achievements.ser_membrane_buffer);
    assert.ok(gameState.registry.discoveries.includes(
        "smooth_er_sterol_regulation"
    ));
    assert.ok(gameState.registry.discoveries.includes(
        "erg1_squalene_epoxidase_recipe"
    ));
    assert.ok(gameState.registry.discoveries.includes(
        "erg7_lanosterol_synthase_recipe"
    ));

    assert.equal(CurvatureCatalog.releaseStatus, "coming-soon");
    const curvatureStatus = ResearchManager.getExperimentStatus(
        CurvatureCatalog.id
    );
    assert.equal(curvatureStatus.comingSoon, true);
    assert.equal(curvatureStatus.incompleteExperiments.length, 0);
    assert.equal(
        curvatureStatus.available,
        false,
        "Lab 2 satisfies progression without bypassing Lab 3's release lock"
    );

    const viewSource = fs.readFileSync(
        new URL(
            "../src/app/SmoothERSterolBufferView.js",
            import.meta.url
        ),
        "utf8"
    );
    const stageSource = fs.readFileSync(
        new URL(
            "../src/app/OrganelleExperimentStage.js",
            import.meta.url
        ),
        "utf8"
    );
    const styles = fs.readFileSync(
        new URL(
            "../public/css/organelle-lab/smooth-er.css",
            import.meta.url
        ),
        "utf8"
    );
    assert.match(viewSource, /One variable: cholesterol amount/);
    assert.match(viewSource, /Membrane Stability/);
    assert.match(viewSource, /draggable="true"/);
    assert.match(viewSource, /dragstart/);
    assert.match(viewSource, /Cold Snap/);
    assert.match(viewSource, /Warm Surge/);
    assert.match(
        viewSource,
        /ERG1 converts squalene to 2,3-oxidosqualene/
    );
    assert.match(
        viewSource,
        /ERG7 then cyclizes 2,3-oxidosqualene into lanosterol/
    );
    assert.doesNotMatch(viewSource, /type="range"/);
    assert.match(stageSource, /smooth_er_sterol_buffer/);
    assert.match(styles, /ser-cholesterol-site/);
    assert.match(styles, /ser-sterol-movement/);
} finally {
    for (const key of Object.keys(gameState)) delete gameState[key];
    Object.assign(gameState, backup);
}

console.log(
    "PASS: Smooth ER Lab 2 varies only cholesterol across cold and warm trials, grants 250 XP, Membrane Buffer, and ERG1/ERG7 recipe discoveries, and opens the release-locked curvature lab without cell-wide metric effects."
);
