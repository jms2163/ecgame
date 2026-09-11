import assert from 'node:assert/strict';
import fs from 'node:fs';
import Engine from '../src/app/ParticleSimulationEngine.js';
import Catalog from '../src/app/ContractileVacuoleExperimentCatalog.js';
import Manager from '../src/app/GuidedExperimentManager.js';
import Research from '../src/app/ResearchManager.js';
import Save from '../src/app/SaveManager.js';
import gameState from '../src/app/GameState.js';
import Materials from '../src/app/ExperimentMaterialLibrary.js';
import Visuals from '../src/app/ExperimentMaterialVisualLibrary.js';

const [stage1, stage2, stage3, stage4] = Catalog.sequence.stages;
assert.equal(stage3.id, 'chloride_entry');
assert.equal(stage3.playable, true);
assert.equal(stage4.playable, true);
assert.equal(Catalog.grants.xp, 1200);
assert.equal(Materials.chloride_ion_sample.particleComposition.chloride_ion, 6);
assert.equal(Materials.chloride_channel.rotatable, true);
assert.deepEqual(Materials.chloride_channel.placementSize, { widthRem: 4.5, heightRem: 3.1 });
assert.ok(Visuals.definitions.chloride_channel.assetPath.endsWith('chloride-channel.svg'));

const channelAssetUrl = new URL('../public/assets/experiments/proteins/chloride-channel.svg', import.meta.url);
assert.ok(fs.existsSync(channelAssetUrl));
const channelSvg = fs.readFileSync(channelAssetUrl, 'utf8');
assert.match(channelSvg, /viewBox="0 0 110 72"/);
assert.match(channelSvg, /M13 36 H91/, 'the channel and transport arrow should be horizontal');

const placementComponents = [
    { id: 'chloride_ion_sample', zoneId: 'side_a', position: { x: .6, y: .5 } },
    { id: 'chloride_channel', zoneId: 'membrane', rotationDeg: 0, position: { x: .5, y: .5 } }
];
const sodiumComponents = Array.from({ length: 6 }, (_, index) => ({
    id: 'sodium_ion', zoneId: 'side_b', position: { x: .45 + (index % 3) * .08, y: .42 + Math.floor(index / 3) * .14 }
}));
const directComponents = [...placementComponents, ...sodiumComponents];
const create = (components = directComponents) =>
    Engine.createInitialState({ simulation: stage3.simulation, snapshot: { components } });
const run = initial => {
    let state = initial;
    for (let index = 0; index < 1200 && state.totalMembraneTransfers < 6; index += 1) {
        state = Engine.step(state, 100);
    }
    return state;
};
const count = (state, materialId, zoneId) => state.particles.filter(particle =>
    particle.materialId === materialId && (!zoneId || particle.zoneId === zoneId)
).length;

const complete = run(create());
assert.equal(complete.totalMembraneTransfers, 6);
assert.equal(count(complete, 'chloride_ion', 'side_b'), 6);
assert.equal(count(complete, 'sodium_ion', 'side_b'), 6);
assert.deepEqual(run(create()), complete, 'chloride transport is deterministic');
assert.equal(run(create(directComponents.filter(component => component.id !== 'chloride_ion_sample'))).totalMembraneTransfers, 0);
assert.equal(run(create(directComponents.filter(component => component.id !== 'chloride_channel'))).totalMembraneTransfers, 0);
assert.equal(run(create(directComponents.map(component =>
    component.id === 'chloride_channel' ? { ...component, rotationDeg: 180 } : component
))).totalMembraneTransfers, 0);

const guidedViewSource = fs.readFileSync(new URL('../src/app/GuidedExperimentView.js', import.meta.url), 'utf8');
assert.match(guidedViewSource, /ExperimentMaterialLibrary\[component\.id\]\?\.visualId/,
    'carried Na+ should resolve through the shared material visual catalog');
assert.match(guidedViewSource, /transportedLabel/);

const before = structuredClone(gameState);
const originalSave = Save.save;
try {
    gameState.registry ??= {};
    gameState.registry.research ??= {};
    delete gameState.registry.research.guidedExperiments;
    assert.throws(() => Manager.resolve(Catalog, stage3.id));
    assert.equal(Manager.checkpoint(Catalog, stage3, complete).reason, 'prior-stage-incomplete');

    gameState.registry.research.guidedExperiments = {
        [Catalog.id]: {
            checkpoints: {
                [stage1.id]: {
                    completedAtMs: 1,
                    transfers: 6,
                    atpConsumed: 6,
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
                }
            }
        }
    };

    const resolvedStage3 = Manager.resolve(Catalog);
    assert.equal(resolvedStage3.guidedStageId, stage3.id);
    const prepared = Manager.prepareSimulationSnapshot(resolvedStage3, { components: placementComponents });
    const carried = prepared.components.filter(component => component.carriedFromStageId === stage2.id);
    assert.equal(carried.length, 6);
    assert.ok(carried.every(component => component.id === 'sodium_ion' && component.zoneId === 'side_b'));
    const preparedComplete = run(Engine.createInitialState({ simulation: stage3.simulation, snapshot: prepared }));
    assert.equal(preparedComplete.totalMembraneTransfers, 6);

    Save.save = () => false;
    const unchanged = JSON.stringify(gameState);
    assert.equal(Manager.checkpoint(Catalog, stage3, preparedComplete, {
        predictionId: 'chloride_enters_lumen'
    }).reason, 'save-failed');
    assert.equal(JSON.stringify(gameState), unchanged);

    Save.save = () => true;
    const xpBefore = gameState.player.xp;
    assert.equal(Manager.checkpoint(Catalog, stage3, preparedComplete, {
        predictionId: 'chloride_enters_lumen'
    }).ok, true);
    const saved = Manager.read(Catalog.id).checkpoints[stage3.id];
    assert.equal(saved.transfers, 6);
    assert.equal(saved.predictionId, 'chloride_enters_lumen');
    assert.equal(saved.particles.filter(particle =>
        particle.materialId === 'chloride_ion' && particle.zoneId === 'side_b'
    ).length, 6);
    assert.equal(Manager.checkpoint(Catalog, stage3, preparedComplete).duplicate, true);
    assert.equal(gameState.player.xp, xpBefore, 'Stage 3 checkpoint does not award final sequence XP');
    assert.equal(Manager.resolve(Catalog).guidedStageId, stage4.id, 'the final water-entry stage becomes current');
    assert.equal(Research.completeExperiment(Catalog.id).reason, 'requirements-not-met');
    assert.equal(gameState.player.xp, xpBefore);
} finally {
    for (const key of Object.keys(gameState)) delete gameState[key];
    Object.assign(gameState, before);
    Save.save = originalSave;
}

console.log('PASS: CV Stage 3 carries lumen Na+, requires a correctly oriented selective chloride channel, moves six Cl− into the lumen, persists its prediction/checkpoint, and grants no premature XP.');
