// Run with: node tests/smooth-er-lipid-composition.test.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import gameState from "../src/app/GameState.js";
import ResearchManager
    from "../src/app/ResearchManager.js";
import OrganelleExperimentLibrary
    from "../src/app/OrganelleExperimentLibrary.js";
import LipidCatalog
    from "../src/app/SmoothERLipidCompositionCatalog.js";
import PolymerizerManager
    from "../src/app/PolymerizerManager.js";
import PolymerizerRecipeCatalog
    from "../src/data/PolymerizerRecipeCatalog.js";
import {
    calculateFluidity,
    getFluidityBand
} from "../src/app/SmoothERLipidCompositionView.js";

const backup = structuredClone(gameState);

try {
    assert.equal(
        LipidCatalog.releaseStatus,
        "active"
    );
    assert.equal(
        LipidCatalog.assessment
            .completionThresholdPercent,
        80
    );
    assert.deepEqual(
        LipidCatalog.grants.metricEffects,
        [],
        "the SER learning platform must not grant cell-wide metric effects"
    );

    assert.equal(
        calculateFluidity(
            Array(12).fill("saturated")
        ),
        0,
        "a fully saturated teaching patch reaches the stiff end of the meter"
    );
    assert.equal(
        calculateFluidity([
            ...Array(6).fill("saturated"),
            ...Array(6).fill("unsaturated")
        ]),
        50,
        "a balanced teaching patch reaches the center of the live meter"
    );
    assert.equal(
        calculateFluidity(
            Array(12).fill("unsaturated")
        ),
        100,
        "a fully unsaturated teaching patch reaches the loose end of the meter"
    );
    assert.equal(getFluidityBand(20), "stiff");
    assert.equal(
        getFluidityBand(50),
        "functional"
    );
    assert.equal(getFluidityBand(80), "loose");

    assert.equal(
        OrganelleExperimentLibrary
            .smooth_er_detox_routing
            .releaseStatus,
        "coming-soon"
    );
    assert.equal(
        OrganelleExperimentLibrary
            .smooth_er_calcium_pulses
            .releaseStatus,
        "coming-soon"
    );
    assert.equal(
        OrganelleExperimentLibrary
            .smooth_er_membrane_supply
            .releaseStatus,
        "coming-soon"
    );

    gameState.registry ??= {};
    gameState.registry.discoveries = [];
    gameState.registry.achievements = {};
    gameState.registry.research ??= {};
    gameState.registry.research
        .completedExperiments = {};
    gameState.registry.research
        .bestExperimentScores = {};
    gameState.registry.research
        .experimentSubmissions = {};

    const lipidBeforeCompletion =
        ResearchManager.getExperimentStatus(
            LipidCatalog.id
        );
    assert.equal(lipidBeforeCompletion.comingSoon, false);
    assert.equal(lipidBeforeCompletion.available, true);

    const sterolBeforeLipid =
        ResearchManager.getExperimentStatus(
            "smooth_er_sterol_buffer"
        );
    assert.equal(sterolBeforeLipid.available, false);
    assert.deepEqual(
        sterolBeforeLipid.incompleteExperiments,
        [LipidCatalog.id]
    );

    const detoxBeforeRelease =
        ResearchManager.getExperimentStatus(
            "smooth_er_detox_routing"
        );
    assert.equal(
        detoxBeforeRelease.comingSoon,
        true
    );
    assert.equal(
        detoxBeforeRelease.available,
        false,
        "coming-soon experiments remain non-playable even when visible"
    );

    const acyltransferaseRecipe =
        PolymerizerRecipeCatalog.get(
            "Glycerol3PhosphateAcyltransferase"
        );
    assert.equal(
        acyltransferaseRecipe
            .unlockDiscoveryId,
        "glycerol_3_phosphate_acyltransferase_recipe"
    );
    assert.equal(
        acyltransferaseRecipe.valid,
        true
    );
    assert.equal(
        acyltransferaseRecipe.source,
        "5XJ6"
    );
    assert.equal(
        acyltransferaseRecipe.structureOrderKnown,
        false
    );
    assert.equal(
        acyltransferaseRecipe.motifCount,
        21
    );
    assert.equal(
        acyltransferaseRecipe.atpCost,
        21
    );
    assert.deepEqual(
        acyltransferaseRecipe
            .motifRequirements
            .map(requirement => ({
                productId:
                    requirement.productId,
                quantity:
                    requirement.quantity
            })),
        [
            {
                productId: "H_helix",
                quantity: 10
            },
            {
                productId: "B_sheet",
                quantity: 0
            },
            {
                productId: "L_loop",
                quantity: 11
            }
        ]
    );
    assert.equal(
        PolymerizerManager
            .getProductEligibility(
                "Glycerol3PhosphateAcyltransferase"
            ).implementationStatus,
        "research-locked"
    );

    const completion =
        ResearchManager.completeExperiment(
            LipidCatalog.id
        );
    assert.equal(completion.completed, true);
    assert.equal(completion.xpAwarded, 250);
    assert.deepEqual(completion.appliedMetricEffects, []);
    assert.equal(LipidCatalog.grants.xp, 250);
    assert.ok(
        gameState.registry.discoveries.includes(
            "glycerol_3_phosphate_acyltransferase_recipe"
        ),
        "Lab 1 reveals the Polymerizer recipe"
    );

    const unlockedAcyltransferase =
        PolymerizerManager
            .getProductEligibility(
                "Glycerol3PhosphateAcyltransferase"
            );
    assert.equal(
        unlockedAcyltransferase.locked,
        false,
        "the completed SER lab reveals the Polymerizer recipe"
    );
    assert.equal(
        unlockedAcyltransferase.canStart,
        false,
        "the recipe still requires its permanent motif levels and ATP"
    );

    const sterolAfterLipid =
        ResearchManager.getExperimentStatus(
            "smooth_er_sterol_buffer"
        );
    assert.equal(sterolAfterLipid.available, true);
    assert.equal(
        sterolAfterLipid.incompleteExperiments.length,
        0
    );

    const detoxAfterPrerequisite =
        ResearchManager.getExperimentStatus(
            "smooth_er_detox_routing"
        );
    assert.equal(
        detoxAfterPrerequisite
            .incompleteExperiments.length,
        1
    );
    assert.equal(
        detoxAfterPrerequisite.available,
        false,
        "detox remains behind the future curvature lab and its release lock"
    );

    assert.equal(
        ResearchManager.completeExperiment(
            "smooth_er_detox_routing"
        ).reason,
        "requirements-not-met"
    );

    const stageSource = fs.readFileSync(
        new URL(
            "../src/app/OrganelleExperimentStage.js",
            import.meta.url
        ),
        "utf8"
    );
    const panelSource = fs.readFileSync(
        new URL(
            "../src/app/OrganelleExperimentPanel.js",
            import.meta.url
        ),
        "utf8"
    );
    const workshopSource = fs.readFileSync(
        new URL(
            "../src/app/SmoothERLipidCompositionView.js",
            import.meta.url
        ),
        "utf8"
    );
    const workshopStyles = fs.readFileSync(
        new URL(
            "../public/css/organelle-lab/smooth-er.css",
            import.meta.url
        ),
        "utf8"
    );
    assert.match(
        stageSource,
        /smooth_er_lipid_composition/
    );
    assert.match(
        panelSource,
        /Coming Soon/
    );
    assert.match(workshopSource, /Saturated Lipid/);
    assert.match(workshopSource, /Unsaturated Lipid/);
    assert.match(workshopSource, /One live measurement/);
    assert.match(workshopSource, /ser-fluidity-meter/);
    assert.match(workshopSource, /Save Investigation/);
    assert.doesNotMatch(
        workshopSource,
        /Test This Membrane|Run Membrane Analyzer|type="range"/
    );
    assert.match(workshopStyles, /ser-fluidity-wave/);
    assert.match(workshopStyles, /prefers-reduced-motion/);
} finally {
    for (const key of Object.keys(gameState)) {
        delete gameState[key];
    }
    Object.assign(gameState, backup);
}

console.log(
    "PASS: Smooth ER Lab 1 changes one variable with one live meter, grants 250 XP and the acyltransferase recipe, and unlocks Lab 2 without cell-wide metric effects."
);
