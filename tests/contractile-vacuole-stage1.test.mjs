import assert from 'node:assert/strict';
import fs from 'node:fs';
import Engine from '../src/app/ParticleSimulationEngine.js';
import Catalog from '../src/app/ContractileVacuoleExperimentCatalog.js';
import Manager from '../src/app/GuidedExperimentManager.js';
import Research from '../src/app/ResearchManager.js';
import Save from '../src/app/SaveManager.js';
import gameState from '../src/app/GameState.js';
import Resolver from '../src/app/ExperimentStageDefinitionResolver.js';

const stage = Catalog.sequence.stages[0];
const snapshot = { components: [
    { id: 'hydrogen_ion_sample', zoneId: 'side_a', position: { x: .7, y: .5 } },
    { id: 'lab_atp_supply', zoneId: 'side_a' },
    { id: 'v_atpase', zoneId: 'membrane', rotationDeg: 270, position: { x: .5, y: .5 } }
] };
const create = (components = snapshot.components) => Engine.createInitialState({ simulation: stage.simulation, snapshot: { components } });
const run = initial => { let state = initial; for (let i = 0; i < 1500; i++) state = Engine.step(state, 100); return state; };
const initial = create();
assert.equal(initial.particles.filter(p => p.materialId === 'hydrogen_ion').length, 6);
assert.equal(initial.particles.filter(p => p.materialId === 'lab_atp_supply').length, 6);
assert.ok(initial.particles.filter(p => p.materialId === 'lab_atp_supply').every(p => p.visualId === 'atp_symbol'));

const atpContact = structuredClone(initial);
atpContact.particles = [atpContact.particles.find(p => p.materialId === 'lab_atp_supply')];
atpContact.particles[0].position = { x: stage.simulation.membraneGeometry.start - .02, y: atpContact.pore.y };
atpContact.particles[0].velocity = { x: .2, y: 0 };
const energized = Engine.step(atpContact, 100);
assert.equal(energized.particles.length, 0, 'ATP disappears only when it contacts the pump');
assert.equal(energized.atpConsumed, 1);
assert.equal(energized.pumpActivated, true);

const protonContact = structuredClone(initial);
protonContact.particles = [protonContact.particles.find(p => p.materialId === 'hydrogen_ion')];
protonContact.particles[0].position = { x: stage.simulation.membraneGeometry.start - .02, y: protonContact.pore.y };
protonContact.particles[0].velocity = { x: .2, y: 0 };
const bouncedProton = Engine.step(protonContact, 100);
assert.equal(bouncedProton.particles[0].zoneId, 'side_a');
assert.ok(bouncedProton.particles[0].velocity.x < 0, 'H+ bounces from an unenergized pump');
protonContact.atpRemaining = 1;
protonContact.pumpActivated = true;
const transportedProton = Engine.step(protonContact, 100);
assert.equal(transportedProton.particles[0].zoneId, 'membrane');
assert.equal(transportedProton.pumpActivated, false, 'H+ transport uses the stored pump activation');

const complete = run(create());
assert.equal(complete.totalMembraneTransfers, 6);
assert.equal(complete.atpConsumed, 6);
assert.equal(complete.atpRemaining, 0);
assert.equal(complete.totalWaterTransfers, 0);
assert.ok(complete.particles.every(p => p.zoneId === 'side_b'));
assert.deepEqual(run(create()), complete, 'pump simulation is deterministic');
assert.equal(run(create(snapshot.components.filter(c => c.id !== 'lab_atp_supply'))).totalMembraneTransfers, 0);
assert.equal(run(create(snapshot.components.map(c => c.id === 'lab_atp_supply' ? { ...c, zoneId: 'side_b' } : c))).totalMembraneTransfers, 0);
for (const rotationDeg of [0, 90, 180]) {
    assert.equal(run(create(snapshot.components.map(c => c.id === 'v_atpase' ? { ...c, rotationDeg } : c))).totalMembraneTransfers, 0);
}
assert.equal(run(create(snapshot.components.filter(c => c.id !== 'v_atpase'))).totalMembraneTransfers, 0);
assert.equal(Resolver.resolveStage(stage.stage).materials.length, 3);
assert.ok(!stage.stage.controls.includes('submit'));
assert.equal(Catalog.grants.xp, 1200);
assert.match(Catalog.catalogReward, /1200 XP/);

const passiveRendererSource = fs.readFileSync(new URL('../src/app/PassiveDiffusionRenderer.js', import.meta.url), 'utf8');
const particleRendererSource = fs.readFileSync(new URL('../src/app/ParticleSimulationRenderer.js', import.meta.url), 'utf8');
const guidedViewSource = fs.readFileSync(new URL('../src/app/GuidedExperimentView.js', import.meta.url), 'utf8');
const stageSource = fs.readFileSync(new URL('../src/app/OrganelleExperimentStage.js', import.meta.url), 'utf8');
assert.match(passiveRendererSource, /ExperimentMaterialCanvasRenderer/);
assert.match(particleRendererSource, /ExperimentMaterialCanvasRenderer/);
assert.ok(stage.guidedUi.predictionChoices.some(choice => choice.id === 'lumen_head_cytosol'));
assert.match(guidedViewSource, /textContent = 'Hint'/);
assert.match(guidedViewSource, /textContent = 'Save'/);
assert.match(guidedViewSource, /textContent = 'Next'/);
assert.match(stageSource, /organelle-particle-simulation-structure--energized/);

const before = structuredClone(gameState);
const save = Save.save;
try {
    gameState.registry ??= {};
    gameState.registry.research ??= {};
    delete gameState.registry.research.guidedExperiments;
    const unchanged = JSON.stringify(gameState);
    assert.equal(Manager.checkpoint(Catalog, stage, create()).reason, 'goal-not-met');
    assert.equal(Manager.checkpoint(Catalog, stage, complete, { sandbox: true }).reason, 'sandbox');
    assert.equal(JSON.stringify(gameState), unchanged);
    Save.save = () => false;
    assert.equal(Manager.checkpoint(Catalog, stage, complete).reason, 'save-failed');
    assert.equal(JSON.stringify(gameState), unchanged, 'failed checkpoint rolls back state');
    Save.save = () => true;
    const xp = gameState.player.xp;
    assert.equal(Manager.checkpoint(Catalog, stage, complete, { predictionId: 'lumen_head_cytosol' }).ok, true);
    assert.equal(Manager.checkpoint(Catalog, stage, complete).duplicate, true);
    assert.equal(gameState.player.xp, xp, 'checkpoint does not award XP');
    const serialized = JSON.parse(JSON.stringify(gameState));
    Object.assign(gameState, serialized);
    assert.equal(Manager.read(Catalog.id).checkpoints.proton_gradient.transfers, 6);
    assert.equal(Manager.read(Catalog.id).checkpoints.proton_gradient.predictionId, 'lumen_head_cytosol');
    assert.equal(Manager.resolve(Catalog).guidedStageId, 'sodium_exchange');
    assert.equal(Manager.resolve(Catalog, 'sodium_exchange').guidedStageId, 'sodium_exchange');
    assert.equal(Research.completeExperiment(Catalog.id).reason, 'experiment-in-development');
    assert.equal(gameState.player.xp, xp);
} finally {
    for (const key of Object.keys(gameState)) delete gameState[key];
    Object.assign(gameState, before);
    Save.save = save;
}
console.log('PASS: CV Stage 1 uses visible ATP collisions, one-cycle pump activation, H+ bounce/transport, prediction persistence, compact controls, shared ATP art, 1200-XP final sequencing, deterministic replay, and no premature rewards.');
