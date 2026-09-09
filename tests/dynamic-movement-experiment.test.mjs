import assert from "node:assert/strict";

import ExperimentPlacementEvaluator
    from "../src/app/ExperimentPlacementEvaluator.js";
import OrganelleExperimentLibrary
    from "../src/app/OrganelleExperimentLibrary.js";
import OrganelleExperimentStage
    from "../src/app/OrganelleExperimentStage.js";
import ParticleSimulationEngine
    from "../src/app/ParticleSimulationEngine.js";

const experiment =
    OrganelleExperimentLibrary
        .dynamic_movement;

assert.ok(
    experiment,
    "Dynamic Movement should be registered"
);

assert.equal(
    experiment.stage.template,
    "solution_mixing",
    "Dynamic Movement should use a membrane-free chamber"
);

assert.equal(
    OrganelleExperimentStage.hasControl(
        experiment.stage.controls,
        "rotate"
    ),
    false,
    "Dynamic Movement should not display protein-rotation guidance"
);

assert.equal(
    OrganelleExperimentStage.hasControl(
        OrganelleExperimentLibrary
            .aquaporin_facilitated_diffusion
            .stage
            .controls,
        "rotate"
    ),
    true,
    "Aquaporin should retain protein-rotation guidance"
);

assert.deepEqual(
    experiment.stage.materials.map(material => ({
        id: material.id,
        maxPlacements: material.maxPlacements
    })),
    [
        {
            id: "water",
            maxPlacements: 1
        },
        {
            id: "sodium_ion",
            maxPlacements: 2
        },
        {
            id: "chloride_ion",
            maxPlacements: 2
        }
    ],
    "the material limits should represent one water sample and two salt pairs"
);

const components = [
    {
        id: "water",
        zoneId: "solution",
        position: {
            x: 0.5,
            y: 0.5
        }
    },
    ...Array.from(
        {
            length: 2
        },
        (_, index) => ({
            id: "sodium_ion",
            zoneId: "solution",
            position: {
                x: 0.45 + index * 0.1,
                y: 0.5
            }
        })
    ),
    ...Array.from(
        {
            length: 2
        },
        (_, index) => ({
            id: "chloride_ion",
            zoneId: "solution",
            position: {
                x: 0.5,
                y: 0.45 + index * 0.1
            }
        })
    )
];

const snapshot = {
    components,
    labels: []
};

const state =
    ParticleSimulationEngine.createInitialState({
        simulation:
            experiment.simulation,
        snapshot
    });

assert.equal(
    state.particles.length,
    16,
    "one water sample and four ions should create sixteen moving particles"
);

assert.ok(
    state.particles.every(
        particle =>
            particle.zoneId === "solution"
    ),
    "every particle should remain in the single solution chamber"
);

assert.equal(
    new Set(
        state.particles.map(particle =>
            `${particle.velocity.x}:${particle.velocity.y}`
        )
    ).size,
    state.particles.length,
    "solution particles should begin in varied deterministic directions"
);

let advancedState = state;

for (let step = 0; step < 50; step += 1) {
    advancedState =
        ParticleSimulationEngine.step(
            advancedState,
            100
        );
}

assert.ok(
    advancedState.particles.every(particle =>
        particle.position.x >= 0.02 &&
        particle.position.x <= 0.98 &&
        particle.position.y >= 0.02 &&
        particle.position.y <= 0.98
    ),
    "mixing particles should bounce within the chamber"
);

assert.ok(
    advancedState.particles.some(
        (particle, index) =>
            particle.position.x !==
                state.particles[index].position.x ||
            particle.position.y !==
                state.particles[index].position.y
    ),
    "particles should remain in motion"
);

const perfectReport =
    ExperimentPlacementEvaluator.evaluate({
        assessment:
            experiment.assessment,
        snapshot,
        reflectionResponses: {
            dynamic_movement_description:
                "The particles move continuously in random directions and spread evenly throughout the solution, forming a homogeneous mixture."
        }
    });

assert.equal(
    perfectReport.scorePoints,
    25,
    "the correct setup and both observations should earn 25 points"
);

assert.equal(
    perfectReport.isPerfect,
    true,
    "the complete Dynamic Movement response should be perfect"
);

const incompleteReport =
    ExperimentPlacementEvaluator.evaluate({
        assessment:
            experiment.assessment,
        snapshot: {
            components:
                components.slice(0, -1),
            labels: []
        },
        reflectionResponses: {
            dynamic_movement_description:
                "The particles move continuously in random directions and spread evenly throughout the solution."
        }
    });

assert.equal(
    incompleteReport.isPerfect,
    false,
    "a missing chloride ion should prevent completion"
);

assert.equal(
    experiment.grants.xp,
    100,
    "Dynamic Movement should award the customary introductory 100 XP"
);

console.log(
    "PASS: Dynamic Movement provides a membrane-free saltwater chamber, varied constant particle motion, exact setup scoring, reflection scoring, and a 100 XP reward."
);
