// Run with: node tests/smooth-er-membrane-curvature.test.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import gameState from "../src/app/GameState.js";
import ResearchManager from "../src/app/ResearchManager.js";
import CurvatureCatalog
    from "../src/app/SmoothERMembraneCurvatureCatalog.js";
import DetoxCatalog
    from "../src/app/SmoothERDetoxRoutingCatalog.js";
import CurvatureView, {
    CURVATURE_MISSIONS,
    LIPID_POSITION_COUNT,
    calculateCurvatureDepth,
    calculateCurvatureMatchPosition,
    calculateCurvatureMatchScore,
    getCurvatureMatchBand
} from "../src/app/SmoothERMembraneCurvatureView.js";

const backup = structuredClone(gameState);

try {
    assert.equal(CurvatureCatalog.releaseStatus, "active");
    assert.deepEqual(
        CurvatureCatalog.requirements.completedExperiments,
        ["smooth_er_sterol_buffer"]
    );
    assert.equal(CurvatureCatalog.grants.xp, 250);
    assert.deepEqual(
        CurvatureCatalog.grants.metricEffects,
        [],
        "the SER teaching lab must not alter cell-wide metrics"
    );
    assert.deepEqual(
        CurvatureCatalog.grants.achievements,
        ["ser_membrane_sculptor"]
    );
    assert.deepEqual(
        CurvatureCatalog.grants.discoveries,
        ["smooth_er_membrane_curvature"]
    );

    assert.equal(LIPID_POSITION_COUNT, 16);
    assert.deepEqual(
        CurvatureView.initialState().cytosolicLeaflet,
        Array(16).fill(null),
        "the editable leaflet begins empty so either lipid card can build the next position"
    );
    assert.deepEqual(
        CURVATURE_MISSIONS.map(mission => ({
            id: mission.id,
            targetCount: mission.targetCount
        })),
        [
            { id: "pinocytosis_pit", targetCount: 6 },
            { id: "waste_export_bulge", targetCount: 11 }
        ]
    );
    assert.ok(
        CURVATURE_MISSIONS[0].targetDepth > 0 &&
        CURVATURE_MISSIONS[1].targetDepth < 0,
        "the waste-export target must bend opposite the pinocytosis target"
    );
    assert.equal(getCurvatureMatchBand(3, 6), "flat");
    assert.equal(getCurvatureMatchBand(4, 6), "matched");
    assert.equal(getCurvatureMatchBand(5, 6), "matched");
    assert.equal(getCurvatureMatchBand(6, 6), "matched");
    assert.equal(getCurvatureMatchBand(7, 6), "matched");
    assert.equal(getCurvatureMatchBand(8, 6), "matched");
    assert.equal(getCurvatureMatchBand(9, 6), "curved");
    assert.equal(calculateCurvatureMatchScore(3, 6), 0);
    assert.equal(calculateCurvatureMatchScore(4, 6), 80);
    assert.equal(calculateCurvatureMatchScore(5, 6), 90);
    assert.equal(calculateCurvatureMatchScore(6, 6), 100);
    assert.equal(calculateCurvatureMatchScore(7, 6), 90);
    assert.equal(calculateCurvatureMatchScore(8, 6), 80);
    assert.equal(calculateCurvatureMatchScore(9, 6), 0);
    assert.ok(calculateCurvatureMatchPosition(5, 6) < 50);
    assert.equal(calculateCurvatureMatchPosition(6, 6), 50);
    assert.ok(calculateCurvatureMatchPosition(7, 6) > 50);

    gameState.registry ??= {};
    gameState.registry.discoveries = [];
    gameState.registry.achievements = {};
    gameState.registry.research ??= {};
    gameState.registry.research.completedExperiments = {};
    gameState.registry.research.bestExperimentScores = {};
    gameState.registry.research.experimentSubmissions = {};

    const beforeLab2 = ResearchManager.getExperimentStatus(
        CurvatureCatalog.id
    );
    assert.equal(beforeLab2.available, false);
    assert.deepEqual(
        beforeLab2.incompleteExperiments,
        ["smooth_er_sterol_buffer"]
    );

    assert.equal(
        ResearchManager.completeExperiment(
            "smooth_er_lipid_composition"
        ).completed,
        true
    );
    assert.equal(
        ResearchManager.completeExperiment(
            "smooth_er_sterol_buffer"
        ).completed,
        true
    );

    const afterLab2 = ResearchManager.getExperimentStatus(
        CurvatureCatalog.id
    );
    assert.equal(afterLab2.available, true);

    const completion = ResearchManager.completeExperiment(
        CurvatureCatalog.id
    );
    assert.equal(completion.completed, true);
    assert.equal(completion.xpAwarded, 250);
    assert.deepEqual(completion.appliedMetricEffects, []);
    assert.ok(
        gameState.registry.achievements.ser_membrane_sculptor
    );
    assert.ok(gameState.registry.discoveries.includes(
        "smooth_er_membrane_curvature"
    ));

    assert.equal(DetoxCatalog.releaseStatus, "coming-soon");
    const detoxStatus = ResearchManager.getExperimentStatus(
        DetoxCatalog.id
    );
    assert.equal(detoxStatus.comingSoon, true);
    assert.equal(detoxStatus.incompleteExperiments.length, 0);
    assert.equal(
        detoxStatus.available,
        false,
        "Lab 3 satisfies progression without bypassing the detox release lock"
    );

    const viewSource = fs.readFileSync(
        new URL(
            "../src/app/SmoothERMembraneCurvatureView.js",
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
    assert.match(viewSource, /Target membrane: Plasma membrane/);
    assert.match(viewSource, /not the SER membrane/);
    assert.match(viewSource, /One variable: curvature-lipid amount/);
    assert.match(viewSource, /extracellular leaflet and every other component are held constant/i);
    assert.match(viewSource, /Pinocytosis Pit/);
    assert.match(viewSource, /Waste Export Bulge/);
    assert.match(viewSource, /waste particle in cytosol/);
    assert.match(viewSource, /bulges outward, up and away from the waste/i);
    assert.match(viewSource, /DOTTED TARGET/);
    assert.match(viewSource, /Curvature Match/);
    assert.match(viewSource, /A center match earns 100%/);
    assert.match(viewSource, /ser-nutrient-dot/);
    assert.match(viewSource, /ser-nutrient-triangle/);
    assert.match(viewSource, /next empty position from left to right/i);
    assert.match(viewSource, /Blue:<\/strong> fixed extracellular leaflet/);
    assert.match(viewSource, /Inverted-cone shape/);
    assert.match(
        viewSource,
        /large headgroup relative to a narrower tail region favors positive curvature/i
    );
    assert.match(viewSource, /ser-curvature-tail--narrow/);
    assert.match(viewSource, /ser-curvature-tail--spread/);
    assert.match(viewSource, /smaller headgroup and wider tail region/i);
    assert.doesNotMatch(viewSource, /smaller head and wider tails/i);
    assert.match(viewSource, /indexOf\(null\)/);
    assert.match(viewSource, /Too flat/);
    assert.match(viewSource, /Too curved/);
    assert.doesNotMatch(viewSource, /type="range"/);
    assert.match(viewSource, /exocytosis/i);
    assert.match(stageSource, /smooth_er_membrane_curvature/);
    assert.match(styles, /ser-curvature-target/);
    assert.match(styles, /ser-curvature-meter/);
} finally {
    for (const key of Object.keys(gameState)) delete gameState[key];
    Object.assign(gameState, backup);
}

console.log(
    "PASS: Smooth ER Lab 3 models destination plasma-membrane curvature with a fixed extracellular leaflet, one editable lipid variable, visible dotted targets, a live match meter, 250 XP, and no cell-wide metric effects."
);
