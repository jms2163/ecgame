import assert from 'node:assert/strict';
import test from 'node:test';
import gameState from '../src/app/GameState.js';
import SaveManager from '../src/app/SaveManager.js';
import Observer from '../src/app/GameStateObserver.js';
import Catalog from '../src/data/MetabolismPathwayCatalog.js';
import Manager from '../src/app/KrebsPracticeManager.js';
import Progress from '../src/app/MetabolismPracticeProgress.js';
import { KREBS_STEPS, createKrebsSession, krebsStage, dockKrebsInput, runKrebsReaction,
    continueKrebsReaction, storeKrebsProducts, answerKrebsQuestion, krebsScore,
    krebsCarbonLedger, krebsOverviewSnapshot, createKrebsBatch, recordKrebsBatchStep } from '../src/app/KrebsPracticeModel.js';

const storage = new Map();
globalThis.localStorage = { getItem: k => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, String(v)), removeItem: k => storage.delete(k) };
let benefits = 0;
for (const event of ['polymerizer-product-completed', 'metabolism-enzyme-placed', 'discovery-unlocked', 'achievement-unlocked']) Observer.on(event, () => benefits++);
function carbonCheck(s) {
    const c = krebsCarbonLedger(s); assert.equal(c.incoming, c.main + c.co2 + c.waiting);
}
function run(index) {
    const s = createKrebsSession(index); carbonCheck(s);
    assert.equal(storeKrebsProducts(s), false);
    assert.equal(answerKrebsQuestion(s, 0).accepted, false);
    assert.equal(runKrebsReaction(s), false);
    assert.equal(dockKrebsInput(s, 'NADPH'), false);
    assert.equal(dockKrebsInput(s, 'enzyme'), true);
    assert.equal(dockKrebsInput(s, 'enzyme'), false);
    for (let i = 0; i < KREBS_STEPS[index].stages.length; i++) {
        const spec = krebsStage(s);
        for (const input of spec.inputs) {
            assert.equal(runKrebsReaction(s), false, 'every input must be docked');
            assert.equal(dockKrebsInput(s, input), true);
            assert.equal(dockKrebsInput(s, input), false);
        }
        assert.equal(runKrebsReaction(s), true); carbonCheck(s);
        assert.equal(runKrebsReaction(s), false, 'cannot duplicate reaction products');
        if (i < KREBS_STEPS[index].stages.length - 1) {
            assert.equal(storeKrebsProducts(s), false, 'finish both parts before storing');
            assert.equal(continueKrebsReaction(s), true);
            assert.equal(continueKrebsReaction(s), false);
        }
    }
    assert.equal(storeKrebsProducts(s), true);
    assert.equal(storeKrebsProducts(s), false);
    return s;
}
function quiz(s, mistake = false) {
    for (const [i, q] of KREBS_STEPS[s.index].questions.entries()) {
        assert.equal(answerKrebsQuestion(s, 999).accepted, false);
        const result = answerKrebsQuestion(s, mistake && i === 0 ? (q.answer + 1) % 3 : q.answer);
        assert.equal(result.accepted, true);
        assert.equal(result.correct, !(mistake && i === 0));
    }
    assert.equal(answerKrebsQuestion(s, 0).accepted, false);
}
test('all eight enzyme sessions conserve substrate carbon and gate reactions, collection, and quizzes', () => {
    assert.deepEqual(KREBS_STEPS.map(s => s.enzymeId), Catalog.get('tcaCycle').coreSlots.map(s => s.enzymeId));
    for (let i = 0; i < 8; i++) { const s = run(i); quiz(s); assert.equal(krebsScore(s), 100); }
    assert.equal(createKrebsSession(-1), null); assert.equal(createKrebsSession(8), null);
    const a = run(1); assert.equal(a.local.includes('Water'), false); assert.equal(a.used.Water, 1, 'aconitase recycles its released water');
    assert.deepEqual(run(2).local, ['NADH', 'H', 'CO2']);
    assert.deepEqual(run(3).local, ['CO2', 'NADH', 'H']);
    assert.deepEqual(run(4).local, ['CoA', 'ATP']);
    assert.deepEqual(run(5).local, ['QH2'], 'bound FADH2 is never a free output');
    assert.equal(dockKrebsInput(createKrebsSession(5), 'FAD'), false, 'FAD is enzyme-bound');
    assert.deepEqual(run(6).local, []); assert.deepEqual(run(7).local, ['NADH', 'H']);
});
test('automatic presentation derives exact one- and two-turn yields with no persisted state', () => {
    const before = structuredClone(gameState), batch = createKrebsBatch();
    assert.equal(recordKrebsBatchStep(batch, run(1)), false, 'must run in cycle order');
    for (let turn = 1; turn <= 2; turn++) {
        for (let i = 0; i < 8; i++) {
            const s = run(i); assert.equal(recordKrebsBatchStep(batch, s), true);
            assert.equal(recordKrebsBatchStep(batch, s), false, 'cannot count the same step twice');
        }
        assert.equal(batch.turns, turn); assert.equal(batch.co2, 2 * turn);
        assert.equal(batch.nadh, 3 * turn); assert.equal(batch.fadPairs, turn);
        assert.equal(batch.qh2, turn); assert.equal(batch.atp, turn);
        assert.equal(batch.acetylUsed, turn); assert.equal(batch.oxaloacetate, 1);
    }
    assert.deepEqual(gameState, before);
});
test('perfect practice saves only P markers; errors, failed saves, and replay cannot grant benefits', () => {
    gameState.zones.metabolism.state = { unrelated: { keep: true }, practiceMastery: { Existing: { scorePercent: 100 } } };
    const original = structuredClone(gameState);
    assert.equal(Manager.start(0), true);
    assert.deepEqual(gameState, original, 'opening practice writes nothing');
    assert.equal(Manager.complete().reason, 'activity-incomplete');
    const wrong = run(0); quiz(wrong, true); Manager.session = wrong;
    assert.equal(Manager.complete().scorePercent, 67);
    assert.deepEqual(gameState, original, 'nonperfect result grants no P');
    const good = run(0); quiz(good); Manager.session = good;
    const save = SaveManager.save; SaveManager.save = () => false;
    assert.equal(Manager.complete().reason, 'save-failed');
    assert.deepEqual(gameState, original, 'failed save rolls back the marker');
    SaveManager.save = save;
    assert.equal(Manager.complete().success, true);
    assert.equal(Progress.hasPerfectPractice('CitrateSynthase'), true);
    const saved = structuredClone(gameState); assert.equal(Manager.complete().reason, 'already-practiced'); assert.deepEqual(gameState, saved);
    for (let i = 1; i < 8; i++) { const s = run(i); quiz(s); Manager.session = s; assert.equal(Manager.complete().success, true); }
    const expected = structuredClone(original);
    expected.zones.metabolism.state.practiceMastery = structuredClone(gameState.zones.metabolism.state.practiceMastery);
    expected.saveMetadata = structuredClone(gameState.saveMetadata);
    assert.deepEqual(gameState, expected, 'all other resources, placements, achievements, discoveries, and saved activities unchanged');
    assert.equal(benefits, 0);
    assert.equal(krebsOverviewSnapshot(id => Progress.hasPerfectPractice(id)).canAutomate, true);
    for (const missing of KREBS_STEPS) assert.equal(krebsOverviewSnapshot(id => id !== missing.enzymeId).canAutomate, false);
    const replay = run(0); quiz(replay, true); Manager.session = replay; Manager.complete();
    assert.equal(Progress.hasPerfectPractice('CitrateSynthase'), true, 'an imperfect replay never removes P');
    Manager.reset();
});
