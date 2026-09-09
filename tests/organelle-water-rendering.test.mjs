import assert from "node:assert/strict";

import ExperimentMaterialLibrary
    from "../src/app/ExperimentMaterialLibrary.js";
import OrganelleExperimentLibrary
    from "../src/app/OrganelleExperimentLibrary.js";
import ExperimentStageDefinitionResolver
    from "../src/app/ExperimentStageDefinitionResolver.js";
import ParticleSimulationEngine
    from "../src/app/ParticleSimulationEngine.js";

const passiveSimulation =
    OrganelleExperimentLibrary
        .water_passive_diffusion
        .simulation;

const aquaporinSimulation =
    OrganelleExperimentLibrary
        .aquaporin_facilitated_diffusion
        .simulation;

const snapshot = {
    components: [
        {
            id: "water",
            zoneId: "side_a",
            position: {
                x: 0.5,
                y: 0.5
            }
        },
        {
            id: "sodium_ion",
            zoneId: "side_b",
            position: {
                x: 0.5,
                y: 0.5
            }
        }
    ]
};

function createState(simulation) {
    return ParticleSimulationEngine.createInitialState({
        simulation,
        snapshot
    });
}

function getParticles(state, materialId) {
    return state.particles.filter(
        particle =>
            particle.materialId === materialId
    );
}

function positionKey(particle) {
    return `${particle.position.x}:${particle.position.y}`;
}

const expectedWaterCount =
    ExperimentMaterialLibrary
        .water
        .particlesPerPlacement;

const resolvedPassiveStage =
    ExperimentStageDefinitionResolver.resolveStage(
        OrganelleExperimentLibrary
            .water_passive_diffusion
            .stage
    );

assert.equal(
    resolvedPassiveStage.materials.find(
        material => material.id === "water"
    )?.particlesPerPlacement,
    expectedWaterCount,
    "the placement controller should receive the shared water count"
);

const passiveState =
    createState(passiveSimulation);

const aquaporinState =
    createState(aquaporinSimulation);

for (
    const [name, state] of [
        ["passive", passiveState],
        ["aquaporin", aquaporinState]
    ]
) {
    const waterParticles =
        getParticles(state, "water");

    assert.equal(
        waterParticles.length,
        expectedWaterCount,
        `${name} simulation should use the shared water count`
    );

    assert.equal(
        new Set(
            waterParticles.map(positionKey)
        ).size,
        expectedWaterCount,
        `${name} water particles should have unique 2D positions`
    );

    assert.equal(
        getParticles(state, "sodium_ion").length,
        1,
        `${name} ions should remain one particle per placement`
    );
}

const repeatedPassiveState =
    createState(passiveSimulation);

assert.deepEqual(
    getParticles(
        repeatedPassiveState,
        "water"
    ).map(particle => particle.position),
    getParticles(
        passiveState,
        "water"
    ).map(particle => particle.position),
    "water cluster positions should be deterministic"
);

const overrideState =
    createState({
        ...passiveSimulation,
        particlesPerPlacement: {
            water: 5
        }
    });

assert.equal(
    getParticles(
        overrideState,
        "water"
    ).length,
    5,
    "an experiment may override the shared material count"
);

console.log(
    "PASS: passive and aquaporin simulations share the water cluster count, use unique deterministic 2D positions, and retain generic overrides."
);
