// Run with: node tests/rough-er-protein-targeting.test.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import gameState from "../src/app/GameState.js";
import RoughCatalog from "../src/app/RoughERProteinTargetingCatalog.js";
import RibosomeCatalog from "../src/app/RibosomeTranslationCatalog.js";
import RoughView, {
    ROUGH_ER_TARGETING_STEPS,
    ROUGH_ER_STARTING_ORDER
} from "../src/app/RoughERProteinTargetingView.js";
import {
    RIBOSOME_TRANSLATION_QUESTIONS,
    RIBOSOME_CHAIN_COLORS
} from "../src/app/RibosomeTranslationView.js";
import RibosomeView
    from "../src/app/RibosomeTranslationView.js";
import OrganelleExperimentLibrary
    from "../src/app/OrganelleExperimentLibrary.js";
import OrganelleProgressionManager
    from "../src/app/OrganelleProgressionManager.js";
import ResearchManager
    from "../src/app/ResearchManager.js";
import SynthesisPointManager
    from "../src/app/SynthesisPointManager.js";

const backup = structuredClone(gameState);
const originalRender = RoughView.render;
const originalRibosomeRender =
    RibosomeView.render;

try {
    assert.equal(
        OrganelleExperimentLibrary
            .ribosome_translation_level_1,
        RibosomeCatalog
    );
    assert.equal(
        RibosomeCatalog.assessment
            .completionThresholdPercent,
        100
    );
    assert.equal(RibosomeCatalog.grants.xp, 250);
    assert.equal(
        RibosomeCatalog.grants.synthesisPoints,
        undefined
    );
    assert.equal(
        OrganelleExperimentLibrary
            .rough_er_protein_targeting,
        RoughCatalog
    );
    assert.deepEqual(
        RoughCatalog.requirements.completedExperiments,
        ["ribosome_translation_level_1"]
    );
    assert.equal(ROUGH_ER_TARGETING_STEPS.length, 6);
    assert.deepEqual(
        ROUGH_ER_TARGETING_STEPS.map(step => step.id),
        [
            "free_ribosome",
            "srp_binds",
            "dock_translocon",
            "resume_translocation",
            "signal_cleaved",
            "release_and_fold"
        ]
    );
    assert.notDeepEqual(
        ROUGH_ER_STARTING_ORDER,
        [0, 1, 2, 3, 4, 5],
        "the assessment must begin with shuffled images"
    );
    assert.equal(
        RIBOSOME_TRANSLATION_QUESTIONS.length,
        2
    );
    assert.deepEqual(
        RIBOSOME_TRANSLATION_QUESTIONS
            .map(question => question.correct),
        [
            "condensation",
            "amino_acids"
        ]
    );
    assert.equal(RIBOSOME_CHAIN_COLORS.length, 9);

    RibosomeView.render = () => {};
    RibosomeView.state =
        RibosomeView.initialState();
    assert.equal(
        RibosomeView.placeMaterial(
            "mrna",
            "mrna"
        ),
        false,
        "mRNA cannot be loaded before the ribosome"
    );
    assert.equal(
        RibosomeView.placeMaterial(
            "small_subunit",
            "ribosome_assembly"
        ),
        false,
        "the small subunit cannot be placed before the large subunit"
    );
    assert.equal(
        RibosomeView.placeMaterial(
            "large_subunit",
            "ribosome_assembly"
        ),
        true
    );
    assert.equal(
        RibosomeView.placeMaterial(
            "small_subunit",
            "ribosome_assembly"
        ),
        true
    );
    assert.equal(
        RibosomeView.placeMaterial(
            "mrna",
            "mrna"
        ),
        true
    );
    assert.equal(
        RibosomeView.state.largeSubunitPlaced,
        true
    );
    assert.equal(
        RibosomeView.state.smallSubunitPlaced,
        true
    );
    assert.equal(RibosomeView.state.mRNAPlaced, true);

    RoughView.render = () => {};
    RoughView.status = { textContent: "" };
    RoughView.state = RoughView.initialState();
    RoughView.state.order = [0, 1, 2, 3, 4, 5];
    RoughView.state.matches = Object.fromEntries(
        ROUGH_ER_TARGETING_STEPS.map(
            (step, index) => [index, step.id]
        )
    );
    assert.equal(RoughView.checkAssessment(), true);

    gameState.registry ??= {};
    gameState.registry.discoveries = [];
    gameState.registry.research ??= {};
    gameState.registry.research.completedExperiments = {};
    gameState.zones.polymerizer.unlocked = true;
    gameState.zones.polymerizer.state.productInventory = {
        GlucoseTransporter: {
            count: 1,
            firstCompletedAtMs: 10,
            lastCompletedAtMs: 10
        }
    };

    assert.equal(
        OrganelleProgressionManager
            .getStatus("ribosomes")
            .available,
        true
    );
    assert.equal(
        OrganelleProgressionManager
            .getStatus("rough_endoplasmic_reticulum")
            .available,
        true
    );
    assert.equal(
        ResearchManager
            .getExperimentStatus(
                "rough_er_protein_targeting"
            )
            .available,
        false,
        "Rough ER targeting stays locked until Ribosome Translation is complete"
    );

    const pointsBefore =
        SynthesisPointManager.getPoints();

    const ribosomeCompletion =
        ResearchManager.completeExperiment(
            "ribosome_translation_level_1"
        );

    assert.equal(ribosomeCompletion.completed, true);
    assert.equal(
        ribosomeCompletion.xpAwarded,
        250
    );
    assert.equal(
        SynthesisPointManager.getPoints(),
        pointsBefore,
        "Level 1 awards XP, not a Synthesis Point"
    );

    const duplicateCompletion =
        ResearchManager.completeExperiment(
            "ribosome_translation_level_1"
        );

    assert.equal(
        duplicateCompletion.reason,
        "already-completed"
    );
    assert.equal(
        SynthesisPointManager.getPoints(),
        pointsBefore,
        "repeated completion must not add unrelated resources"
    );

    assert.equal(
        ResearchManager
            .getExperimentStatus(
                "rough_er_protein_targeting"
            )
            .available,
        true
    );

    gameState.registry.research.completedExperiments
        .rough_er_protein_targeting = {
            completedAtMs: 20
        };

    assert.equal(
        OrganelleProgressionManager
            .getStatus("golgi_apparatus")
            .progressionState,
        "coming-soon"
    );

    const stageSource = fs.readFileSync(
        new URL(
            "../src/app/OrganelleExperimentStage.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        stageSource,
        /template === "ribosome_translation_basics"/
    );
    assert.match(
        stageSource,
        /template === "rough_er_protein_targeting"/
    );
} finally {
    RoughView.render = originalRender;
    RibosomeView.render =
        originalRibosomeRender;
    for (const key of Object.keys(gameState)) {
        delete gameState[key];
    }
    Object.assign(gameState, backup);
}

console.log(
    "PASS: Ribosome Translation is a prerequisite for a six-step Rough ER animation and sequence-matching assessment; completion previews Golgi routing."
);
