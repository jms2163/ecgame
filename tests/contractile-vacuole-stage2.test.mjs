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

const stage1 = Catalog.sequence.stages[0];
const stage2 = Catalog.sequence.stages[1];
assert.equal(stage2.playable, true);
assert.equal(Catalog.sequence.stages[2].playable, false);
assert.equal(Catalog.sequence.stages[3].playable, false);
assert.equal(Catalog.grants.xp, 1200);
assert.equal(Materials.sodium_ion_sample.particleComposition.sodium_ion, 6);
assert.equal(Materials.sodium_hydrogen_exchanger.rotatable, true);
assert.deepEqual(Materials.sodium_hydrogen_exchanger.placementSize, { widthRem: 4.5, heightRem: 3.1 });
assert.ok(Visuals.definitions.sodium_hydrogen_exchanger.assetPath.endsWith('sodium-hydrogen-exchanger.svg'));
const exchangerAssetUrl = new URL('../public/assets/experiments/proteins/sodium-hydrogen-exchanger.svg', import.meta.url);
assert.ok(fs.existsSync(exchangerAssetUrl));
const exchangerSvg = fs.readFileSync(exchangerAssetUrl, 'utf8');
assert.match(exchangerSvg, /viewBox="0 0 110 72"/);
assert.match(exchangerSvg, /matrix\(0 1 -1 0 110 0\)/);

const priorParticles = Array.from({ length: 6 }, () => ({ materialId: 'hydrogen_ion', zoneId: 'side_b' }));
const placementComponents = [
    { id: 'sodium_ion_sample', zoneId: 'side_a', position: { x: .6, y: .5 } },
    { id: 'sodium_hydrogen_exchanger', zoneId: 'membrane', rotationDeg: 0, position: { x: .5, y: .5 } }
];
const directComponents = [
    ...placementComponents,
    ...Array.from({ length: 6 }, (_, index) => ({
        id: 'hydrogen_ion', zoneId: 'side_b', position: { x: .5, y: .3 + index * .08 }
    }))
];
const create = (components = directComponents) =>
    Engine.createInitialState({ simulation: stage2.simulation, snapshot: { components } });
const run = initial => {
    let state = initial;
    for (let index = 0; index < 1200 && state.exchangeCycles < 6; index += 1) {
        state = Engine.step(state, 100);
    }
    return state;
};

const complete = run(create());
assert.equal(complete.exchangeCycles, 6);
assert.equal(complete.totalMembraneTransfers, 12);
assert.ok(complete.particles.filter(p => p.materialId === 'sodium_ion').every(p => p.zoneId === 'side_b'));
assert.ok(complete.particles.filter(p => p.materialId === 'hydrogen_ion').every(p => p.zoneId === 'side_a'));
assert.deepEqual(run(create()), complete, 'coupled exchange is deterministic');
assert.equal(run(create(directComponents.filter(c => c.id !== 'hydrogen_ion'))).exchangeCycles, 0);
assert.equal(run(create(directComponents.filter(c => c.id !== 'sodium_ion_sample'))).exchangeCycles, 0);
assert.equal(run(create(directComponents.filter(c => c.id !== 'sodium_hydrogen_exchanger'))).exchangeCycles, 0);
assert.equal(run(create(directComponents.map(c => c.id === 'sodium_hydrogen_exchanger' ? { ...c, rotationDeg: 180 } : c))).exchangeCycles, 0);

const before = structuredClone(gameState);
const originalSave = Save.save;
try {
    gameState.registry ??= {};
    gameState.registry.research ??= {};
    delete gameState.registry.research.guidedExperiments;
    assert.throws(() => Manager.resolve(Catalog, stage2.id));
    assert.equal(Manager.checkpoint(Catalog, stage2, complete).reason, 'prior-stage-incomplete');
    gameState.registry.research.guidedExperiments = {
        [Catalog.id]: {
            checkpoints: {
                [stage1.id]: {
                    completedAtMs: 1,
                    transfers: 6,
                    atpConsumed: 6,
                    predictionId: 'lumen_head_cytosol',
                    particles: priorParticles
                }
            }
        }
    };

    const resolvedStage2 = Manager.resolve(Catalog);
    const prepared = Manager.prepareSimulationSnapshot(resolvedStage2, { components: placementComponents });
    assert.equal(prepared.components.filter(c => c.carriedFromStageId === stage1.id).length, 6);
    assert.ok(prepared.components.filter(c => c.carriedFromStageId).every(c => c.zoneId === 'side_b'));
    assert.equal(run(Engine.createInitialState({ simulation: stage2.simulation, snapshot: prepared })).exchangeCycles, 6);
    assert.equal(Manager.resolve(Catalog).guidedStageId, stage2.id);

    Save.save = () => false;
    const unchanged = JSON.stringify(gameState);
    assert.equal(Manager.checkpoint(Catalog, stage2, complete, { predictionId: 'sodium_in_proton_out' }).reason, 'save-failed');
    assert.equal(JSON.stringify(gameState), unchanged);

    Save.save = () => true;
    const xpBefore = gameState.player.xp;
    assert.equal(Manager.checkpoint(Catalog, stage2, complete, { predictionId: 'sodium_in_proton_out' }).ok, true);
    const saved = Manager.read(Catalog.id).checkpoints[stage2.id];
    assert.equal(saved.exchangeCycles, 6);
    assert.equal(saved.predictionId, 'sodium_in_proton_out');
    assert.equal(Manager.checkpoint(Catalog, stage2, complete).duplicate, true);
    assert.equal(gameState.player.xp, xpBefore, 'Stage 2 checkpoint does not award the final sequence XP');
    assert.equal(Manager.resolve(Catalog).guidedStageId, stage2.id, 'latest playable stage remains available for replay');
    assert.equal(Research.completeExperiment(Catalog.id).reason, 'experiment-in-development');
    assert.equal(gameState.player.xp, xpBefore);
} finally {
    for (const key of Object.keys(gameState)) delete gameState[key];
    Object.assign(gameState, before);
    Save.save = originalSave;
}

console.log('PASS: CV Stage 2 carries forward six lumen H+, requires a correctly oriented antiporter and cytosolic Na+, exchanges ions in coupled one-for-one cycles, persists prediction/checkpoint data, and grants no premature XP.');
