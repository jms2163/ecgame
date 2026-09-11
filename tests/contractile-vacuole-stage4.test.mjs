import assert from 'node:assert/strict';
import fs from 'node:fs';
import Engine from '../src/app/ParticleSimulationEngine.js';
import Catalog from '../src/app/ContractileVacuoleExperimentCatalog.js';
import Manager from '../src/app/GuidedExperimentManager.js';
import Research from '../src/app/ResearchManager.js';
import Save from '../src/app/SaveManager.js';
import gameState from '../src/app/GameState.js';
import Materials from '../src/app/ExperimentMaterialLibrary.js';

const [stage1, stage2, stage3, stage4] = Catalog.sequence.stages;
assert.equal(stage4.id, 'water_entry');
assert.equal(stage4.playable, true);
assert.equal(Catalog.grants.xp, 1200);
assert.deepEqual(Catalog.grants.discoveries, ['contractile_vacuole_filling']);
assert.equal(Materials.water.particlesPerPlacement, 12);
assert.equal(Materials.aquaporin.rotatable, true);
assert.deepEqual(stage4.simulation.carryForward.materialIds, ['sodium_ion', 'chloride_ion']);
assert.deepEqual(stage4.simulation.poreRule.allowedRotationDeg, [90, 270]);
assert.equal(stage4.goal.waterTransfers, 6);

const placementComponents = [
    { id: 'water', zoneId: 'side_a', position: { x: .55, y: .5 } },
    { id: 'aquaporin', zoneId: 'membrane', rotationDeg: 90, position: { x: .5, y: .5 } }
];
const lumenSalt = [
    ...Array.from({ length: 6 }, (_, index) => ({
        id: 'sodium_ion', zoneId: 'side_b', position: { x: .45 + (index % 3) * .08, y: .35 + Math.floor(index / 3) * .12 }
    })),
    ...Array.from({ length: 6 }, (_, index) => ({
        id: 'chloride_ion', zoneId: 'side_b', position: { x: .45 + (index % 3) * .08, y: .60 + Math.floor(index / 3) * .12 }
    }))
];
const directComponents = [...placementComponents, ...lumenSalt];
const create = (components = directComponents) =>
    Engine.createInitialState({ simulation: stage4.simulation, snapshot: { components } });
const run = initial => {
    let state = initial;
    for (let index = 0; index < 1500 && state.totalWaterTransfers < 6; index += 1) {
        state = Engine.step(state, 100);
    }
    return state;
};
const count = (state, materialId, zoneId) => state.particles.filter(particle =>
    particle.materialId === materialId && (!zoneId || particle.zoneId === zoneId)
).length;

const complete = run(create());
assert.equal(complete.totalWaterTransfers, 6);
assert.equal(complete.totalMembraneTransfers, 6);
assert.equal(count(complete, 'water', 'side_b'), 6);
assert.equal(count(complete, 'sodium_ion', 'side_b'), 6);
assert.equal(count(complete, 'chloride_ion', 'side_b'), 6);
assert.deepEqual(run(create()), complete, 'final-stage osmosis is deterministic');
assert.equal(run(create(directComponents.filter(component => component.id !== 'aquaporin'))).totalWaterTransfers, 0);
assert.equal(run(create(directComponents.map(component =>
    component.id === 'aquaporin' ? { ...component, rotationDeg: 0 } : component
))).totalWaterTransfers, 0);
assert.equal(run(create(directComponents.filter(component => component.id !== 'chloride_ion'))).totalWaterTransfers, 0,
    'water should not move without the balanced lumen salt gradient');
assert.equal(run(create(directComponents.filter(component => component.id !== 'water'))).totalWaterTransfers, 0);

const guidedViewSource = fs.readFileSync(new URL('../src/app/GuidedExperimentView.js', import.meta.url), 'utf8');
assert.match(guidedViewSource, /stage\.goal\.waterTransfers/);
assert.match(guidedViewSource, /Investigation complete/);

const priorStageCheckpoints = {
    [stage1.id]: {
        completedAtMs: 1,
        transfers: 6,
        atpConsumed: 6,
        predictionId: 'lumen_head_cytosol',
        particles: Array.from({ length: 6 }, () => ({ materialId: 'hydrogen_ion', zoneId: 'side_b' }))
    },
    [stage2.id]: {
        completedAtMs: 2,
        transfers: 12,
        exchangeCycles: 6,
        predictionId: 'sodium_in_proton_out',
        particles: [
            ...Array.from({ length: 6 }, () => ({ materialId: 'sodium_ion', zoneId: 'side_b' })),
            ...Array.from({ length: 6 }, () => ({ materialId: 'hydrogen_ion', zoneId: 'side_a' }))
        ]
    },
    [stage3.id]: {
        completedAtMs: 3,
        transfers: 6,
        predictionId: 'chloride_enters_lumen',
        particles: [
            ...Array.from({ length: 6 }, () => ({ materialId: 'sodium_ion', zoneId: 'side_b' })),
            ...Array.from({ length: 6 }, () => ({ materialId: 'chloride_ion', zoneId: 'side_b' }))
        ]
    }
};

const before = structuredClone(gameState);
const originalSave = Save.save;
try {
    gameState.registry ??= {};
    gameState.registry.research ??= {};
    gameState.registry.research.completedExperiments ??= {};
    gameState.registry.research.completedExperiments.aquaporin_facilitated_diffusion = { completedAtMs: 1 };
    gameState.registry.research.guidedExperiments = {
        [Catalog.id]: { checkpoints: structuredClone(priorStageCheckpoints) }
    };

    assert.equal(Research.completeExperiment(Catalog.id).reason, 'guided-stages-incomplete');
    const resolvedStage4 = Manager.resolve(Catalog);
    assert.equal(resolvedStage4.guidedStageId, stage4.id);
    const prepared = Manager.prepareSimulationSnapshot(resolvedStage4, { components: placementComponents });
    const carried = prepared.components.filter(component => component.carriedFromStageId === stage3.id);
    assert.equal(carried.length, 12);
    assert.equal(carried.filter(component => component.id === 'sodium_ion').length, 6);
    assert.equal(carried.filter(component => component.id === 'chloride_ion').length, 6);
    assert.ok(carried.every(component => component.zoneId === 'side_b'));
    const preparedComplete = run(Engine.createInitialState({ simulation: stage4.simulation, snapshot: prepared }));
    assert.equal(preparedComplete.totalWaterTransfers, 6);

    Save.save = () => false;
    const unchanged = JSON.stringify(gameState);
    assert.equal(Manager.checkpoint(Catalog, stage4, preparedComplete, {
        predictionId: 'water_enters_lumen'
    }).reason, 'save-failed');
    assert.equal(JSON.stringify(gameState), unchanged,
        'a failed final save rolls back its checkpoint, XP, discovery, and completion record');

    Save.save = () => true;
    const xpBefore = gameState.player.xp;
    const result = Manager.checkpoint(Catalog, stage4, preparedComplete, {
        predictionId: 'water_enters_lumen'
    });
    assert.equal(result.ok, true);
    assert.equal(result.completion.completed, true);
    assert.equal(result.completion.xpAwarded, 1200);
    const saved = Manager.read(Catalog.id).checkpoints[stage4.id];
    assert.equal(saved.waterTransfers, 6);
    assert.equal(saved.predictionId, 'water_enters_lumen');
    assert.equal(gameState.player.xp, xpBefore + 1200);
    assert.ok(gameState.registry.discoveries.includes('contractile_vacuole_filling'));
    assert.ok(gameState.registry.research.completedExperiments[Catalog.id]);

    const xpAfter = gameState.player.xp;
    assert.equal(Manager.checkpoint(Catalog, stage4, preparedComplete).duplicate, true);
    assert.equal(Research.completeExperiment(Catalog.id).reason, 'already-completed');
    assert.equal(gameState.player.xp, xpAfter, 'replay and duplicate completion cannot award XP twice');
    assert.equal(Manager.resolve(Catalog).guidedStageId, stage4.id, 'the completed final stage remains available for replay');
} finally {
    for (const key of Object.keys(gameState)) delete gameState[key];
    Object.assign(gameState, before);
    Save.save = originalSave;
}

console.log('PASS: CV Stage 4 carries balanced lumen NaCl, requires a correctly oriented aquaporin, moves water inward by osmosis, saves the final checkpoint atomically, and awards the 1,200 XP/discovery exactly once.');
