import assert from "node:assert/strict";
import fs from "node:fs";

import gameState from "../src/app/GameState.js";
import ExperimentPlacementEvaluator
    from "../src/app/ExperimentPlacementEvaluator.js";
import OrganelleExperimentLibrary
    from "../src/app/OrganelleExperimentLibrary.js";
import OrganelleExperimentSubmissionManager
    from "../src/app/OrganelleExperimentSubmissionManager.js";
import ResearchManager
    from "../src/app/ResearchManager.js";

const backup = structuredClone(gameState);

try {
    gameState.registry ??= {};
    gameState.registry.discoveries = [];
    gameState.registry.journal = [];
    gameState.registry.research = {
        completedExperiments: {},
        experimentSubmissions: {},
        bestExperimentScores: {},
        stars: {}
    };
    gameState.discoveries ??= {};
    gameState.discoveries.molecules ??= {};
    gameState.discoveries.molecules.H2O = {
        discoveredAt: 1,
        count: 1
    };

    const experiment =
        OrganelleExperimentLibrary.dynamic_movement;

    assert.equal(
        experiment.assessment.completionThresholdPercent,
        80,
        "Dynamic Movement should explicitly use the shared 80% mastery gate"
    );

    const placementSnapshot = {
        components: [
            { id: "water", zoneId: "solution" },
            { id: "sodium_ion", zoneId: "solution" },
            { id: "sodium_ion", zoneId: "solution" },
            { id: "chloride_ion", zoneId: "solution" },
            { id: "chloride_ion", zoneId: "solution" }
        ],
        labels: []
    };
    const attemptSnapshot = {
        reflectionResponses: {
            dynamic_movement_description:
                "Particles remain in continuous random motion and spread evenly throughout the solution."
        }
    };
    const report = ExperimentPlacementEvaluator.evaluate({
        assessment: experiment.assessment,
        snapshot: placementSnapshot,
        reflectionResponses:
            attemptSnapshot.reflectionResponses
    });

    assert.equal(report.scorePoints, 25);
    assert.equal(report.scorePercent, 100);
    assert.equal(
        ResearchManager.meetsCompletionThreshold(
            experiment,
            report
        ),
        true
    );

    const completion =
        ResearchManager.completeExperiment(
            experiment.id
        );

    const submission =
        OrganelleExperimentSubmissionManager
            .recordSubmission({
                experiment,
                report,
                placementSnapshot,
                attemptSnapshot,
                completion
            });

    assert.equal(completion.completed, true);
    assert.equal(submission.scorePercent, 100);
    assert.equal(
        gameState.registry.research
            .stars
            .dynamic_movement
            .reason,
        "perfect-score",
        "a 100% Dynamic Movement submission should award its activity star"
    );

    delete gameState.registry.research
        .stars.dynamic_movement;

    assert.equal(
        OrganelleExperimentSubmissionManager
            .ensurePerfectScoreStar(
                "dynamic_movement"
            ),
        true,
        "a legacy 25/25 score should receive its star without another attempt"
    );
    assert.equal(
        gameState.registry.research
            .stars
            .dynamic_movement
            .reason,
        "retroactive-perfect-score"
    );
    assert.deepEqual(
        ResearchManager.getBestScorePercent(
            experiment.id
        ),
        100,
        "the submitted Dynamic Movement score should be persisted"
    );
    assert.equal(
        ResearchManager.getExperimentStatus(
            "passive_diffusion"
        ).available,
        true,
        "a passing Dynamic Movement score should unlock Passive Diffusion"
    );

    const panelSource = fs.readFileSync(
        new URL(
            "../src/app/OrganelleExperimentPanel.js",
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

    assert.match(
        panelSource,
        /state === "available" \|\|\s*state === "completed"/,
        "completed experiment cards should display their saved best score"
    );
    assert.match(
        panelSource,
        /Improve Score/,
        "completed scored labs below 100% should allow a new graded attempt"
    );
    assert.match(
        stageSource,
        /OrganelleExperimentPanel\.refresh\(\)/,
        "the experiment panel should refresh after a scored submission"
    );
    assert.match(
        stageSource,
        /organelle-experiment-control--submit-ready/,
        "saving a draft should mark Submit for gentle visual attention"
    );

    console.log(
        "PASS: Dynamic Movement saves and displays its score, awards a star at 100%, cues Submit after draft save, and immediately unlocks Passive Diffusion at 80% mastery."
    );
} finally {
    for (const key of Object.keys(gameState)) {
        delete gameState[key];
    }
    Object.assign(gameState, backup);
}
