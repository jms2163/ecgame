import assert from "node:assert/strict";

import ExperimentMaterialLibrary
    from "../src/app/ExperimentMaterialLibrary.js";
import ExperimentMaterialVisualLibrary
    from "../src/app/ExperimentMaterialVisualLibrary.js";
import ExperimentPlacementEvaluator
    from "../src/app/ExperimentPlacementEvaluator.js";
import gameState
    from "../src/app/GameState.js";
import OrganelleExperimentLibrary
    from "../src/app/OrganelleExperimentLibrary.js";
import ParticleSimulationEngine
    from "../src/app/ParticleSimulationEngine.js";
import ResearchManager
    from "../src/app/ResearchManager.js";

const experiment =
    OrganelleExperimentLibrary
        .potassium_channel_selectivity;

assert.ok(
    experiment,
    "K+ Channel Selectivity should be registered"
);

assert.equal(
    experiment.grants.xp,
    100
);

assert.deepEqual(
    experiment.grants.discoveries,
    ["ion_channels"]
);

assert.deepEqual(
    experiment.stage.materials.map(material =>
        material.id),
    [
        "sodium_chloride",
        "calcium_chloride",
        "potassium_chloride",
        "potassium_channel"
    ]
);

assert.equal(
    ExperimentMaterialLibrary
        .potassium_channel
        .rotatable,
    true
);

assert.deepEqual(
    ExperimentMaterialLibrary
        .calcium_chloride
        .particleComposition,
    {
        calcium_ion: 4,
        chloride_ion: 8
    },
    "CaCl2 should dissociate at a 1:2 ratio"
);

for (const materialId of [
    "sodium_ion",
    "calcium_ion",
    "potassium_ion",
    "chloride_ion"
]) {
    const visualId =
        ExperimentMaterialLibrary[
            materialId
        ].visualId;

    assert.ok(
        ExperimentMaterialVisualLibrary
            .definitions[visualId]
            .simulationColor,
        `${materialId} should use the shared ion palette`
    );
}

for (const candidate of
    Object.values(OrganelleExperimentLibrary)) {
    assert.ok(
        candidate.grants?.xp > 0,
        `${candidate.id} should grant XP`
    );
    assert.ok(
        candidate.grants?.discoveries?.length > 0,
        `${candidate.id} should grant at least one discovery`
    );
}

const components = [
    {
        id: "sodium_chloride",
        zoneId: "side_a",
        position: { x: 0.25, y: 0.22 }
    },
    {
        id: "calcium_chloride",
        zoneId: "side_a",
        position: { x: 0.25, y: 0.50 }
    },
    {
        id: "potassium_chloride",
        zoneId: "side_a",
        position: { x: 0.25, y: 0.78 }
    },
    {
        id: "potassium_channel",
        zoneId: "membrane",
        position: { x: 0.5, y: 0.5 },
        rotationDeg: 90
    }
];

const snapshot = {
    components,
    labels: []
};

const count = (state, materialId, zoneId) =>
    state.particles.filter(particle =>
        particle.materialId === materialId &&
        (!zoneId || particle.zoneId === zoneId)
    ).length;

let state =
    ParticleSimulationEngine.createInitialState({
        simulation:
            experiment.simulation,
        snapshot
    });

assert.equal(state.particles.length, 36);
assert.equal(count(state, "sodium_ion"), 6);
assert.equal(count(state, "calcium_ion"), 4);
assert.equal(count(state, "potassium_ion"), 6);
assert.equal(count(state, "chloride_ion"), 20);
assert.ok(state.pore, "a 90-degree channel should form a pore");

for (let step = 0; step < 1200; step += 1) {
    state = ParticleSimulationEngine.step(
        state,
        100
    );
}

assert.ok(
    count(state, "potassium_ion", "side_b") > 0,
    "K+ should move through the channel from side A to side B"
);

for (const blockedMaterialId of [
    "sodium_ion",
    "calcium_ion",
    "chloride_ion"
]) {
    assert.equal(
        count(state, blockedMaterialId, "side_b"),
        0,
        `${blockedMaterialId} should not cross`
    );
}

const transportedK =
    count(state, "potassium_ion", "side_b");

for (let step = 0; step < 600; step += 1) {
    state = ParticleSimulationEngine.step(
        state,
        100
    );
}

assert.ok(
    count(state, "potassium_ion", "side_b") >=
        transportedK,
    "transported K+ should not return through the one-direction channel"
);
assert.equal(state.totalWaterTransfers, 0);
assert.ok(state.totalMembraneTransfers > 0);

let blockedState =
    ParticleSimulationEngine.createInitialState({
        simulation:
            experiment.simulation,
        snapshot: {
            components: components.map(component =>
                component.id === "potassium_channel"
                    ? {
                        ...component,
                        rotationDeg: 0
                    }
                    : component),
            labels: []
        }
    });

assert.equal(blockedState.pore, null);

for (let step = 0; step < 1200; step += 1) {
    blockedState =
        ParticleSimulationEngine.step(
            blockedState,
            100
        );
}

assert.equal(
    count(blockedState, "potassium_ion", "side_b"),
    0,
    "K+ should remain blocked until the channel spans the membrane"
);

const perfectReport =
    ExperimentPlacementEvaluator.evaluate({
        assessment:
            experiment.assessment,
        snapshot,
        reflectionResponses: {
            potassium_channel_observation:
                "Potassium moves from side A to side B. Sodium is blocked, calcium is blocked, and chloride is blocked. This is a selective channel specific for potassium."
        }
    });

assert.equal(perfectReport.scorePoints, 40);
assert.equal(perfectReport.isPerfect, true);

const originalState =
    structuredClone(gameState);

try {
    gameState.registry ??= {};
    gameState.registry.discoveries ??= [];
    gameState.registry.research ??= {};
    gameState.registry.research.completedExperiments ??= {};
    gameState.registry.research
        .completedExperiments
        .aquaporin_facilitated_diffusion = {
            completedAtMs: 1
        };

    const startingXP =
        gameState.player.xp;

    const completion =
        ResearchManager.completeExperiment(
            experiment.id
        );

    assert.equal(completion.completed, true);
    assert.equal(completion.xpAwarded, 100);
    assert.deepEqual(
        completion.grantedDiscoveries,
        ["ion_channels"]
    );
    assert.equal(
        gameState.player.xp,
        startingXP + 100
    );
    assert.equal(
        ResearchManager.completeExperiment(
            experiment.id
        ).reason,
        "already-completed"
    );
    assert.equal(
        gameState.player.xp,
        startingXP + 100,
        "the K+ channel reward should be granted only once"
    );
} finally {
    for (const key of Object.keys(gameState)) {
        delete gameState[key];
    }
    Object.assign(gameState, originalState);
}

console.log(
    "PASS: K+ channel salts dissociate, only K+ crosses one way through a correctly rotated pore, scoring is data-driven, and XP/discoveries are one-time rewards."
);
