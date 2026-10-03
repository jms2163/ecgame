import assert from 'node:assert/strict';
import fs from 'node:fs';
import Recipes from '../src/data/PolymerizerRecipeCatalog.js';
import Visuals from '../src/data/PolymerizerVisualCatalog.js';
import {proteinLibrary} from '../src/data/proteinLibrary.js';
import {ProteinAssemblyPractice} from '../src/app/ProteinAssemblyPractice.js';
import {componentPlan} from '../src/app/ProteinComponentPlan.js';
import gameState from '../src/app/GameState.js';
import Resources from '../src/app/ResourceManager.js';
import Polymerizer from '../src/app/PolymerizerManager.js';
import Components from '../src/app/PolymerizerComponentManager.js';
import Metabolism from '../src/app/MetabolismManager.js';
import ProductView from '../src/app/PolymerizerProductView.js';

const store = new Map();
globalThis.localStorage = {
    getItem: k => store.get(k) ?? null,
    setItem: (k, value) => store.set(k, String(value)),
    removeItem: k => store.delete(k)
};

for (const [id, pdb, lastFrame, chains] of [
    ['CitrateSynthase', '1ixe', 45, 2],
    ['Aconitase', '1l5j', 59, 1],
    ['IsocitrateDehydrogenase', '2d4v', 57, 2],
    ['SuccinylCoASynthetase', '1scu', 84, 4],
    ['Fumarase', '6mso', 74, 2],
    ['MalateDehydrogenase', '7nrz', 45, 2]
]) {
    const rows = fs.readFileSync(new URL(`../docs/data/${pdb}-motifs.csv`, import.meta.url), 'utf8')
        .trim().split(/\r?\n/).slice(1).map(line => line.split(','));
    const d = Recipes.get(id), v = Visuals.get(id);
    const extension = id === 'CitrateSynthase' ? 'webp' : 'png';
    assert.equal(d.valid, true);
    assert.equal(d.implemented, true);
    assert.equal(d.purpose, 'Krebs Cycle');
    assert.equal(d.discoveryId, null);
    assert.equal(d.source, pdb.toUpperCase());
    assert.equal(d.simplifiedStructure, rows.map(row => row[5]).join(''));
    assert.equal(d.atpCost, rows.length, 'include short motifs in the recipe');
    assert.equal(d.components.length, chains === 1 ? 0 : chains);
    assert.equal(v.lastFrameNumber, lastFrame);
    assert.equal(v.frameCount, lastFrame + 1);
    assert.match(v.idleImageUrl, new RegExp(`${pdb}-0\\.${extension}$`));
    assert.match(v.finalImageUrl, new RegExp(`${pdb}-${lastFrame}\\.${extension}$`));
    for (const symbol of 'HBL') {
        assert.equal(proteinLibrary[id].Recipe[symbol], rows.filter(row => row[5] === symbol).length);
        if (d.components.length) assert.equal(d.components.reduce((sum, c) => sum + c.recipe[symbol], 0), proteinLibrary[id].Recipe[symbol]);
    }
    for (const c of d.components) {
        const own = rows.filter(row => row[1] === c.sourceModel && row[3] === c.sourceChain);
        for (const symbol of 'HBL') assert.equal(c.recipe[symbol], own.filter(row => row[5] === symbol).length);
    }
    const before = structuredClone(gameState);
    const practice = new ProteinAssemblyPractice(id);
    assert.equal(practice.start(null, 100), true);
    practice.tick(8100);
    assert.equal(practice.full, true);
    assert.equal(practice.imageUrl(), v.finalImageUrl);
    assert.deepEqual(gameState, before, 'assembly practice must not mutate any saved state');
}

assert.equal(componentPlan(Recipes.get('CitrateSynthase'), [1]).atpCost, 45);
assert.equal(componentPlan(Recipes.get('CitrateSynthase'), [2]).atpCost, 44);
assert.equal(componentPlan(Recipes.get('IsocitrateDehydrogenase'), [1]).atpCost, 65);
assert.equal(componentPlan(Recipes.get('IsocitrateDehydrogenase'), [2]).atpCost, 63);
assert.deepEqual([1,2,3,4].map(n => componentPlan(Recipes.get('SuccinylCoASynthetase'), [n]).atpCost), [50,77,51,75]);
assert.equal(componentPlan(Recipes.get('Fumarase'), [1]).atpCost, 80);
assert.equal(componentPlan(Recipes.get('MalateDehydrogenase'), [2]).atpCost, 45);
assert.match(proteinLibrary.MalateDehydrogenase.Location, /Glycosome/);
assert.match(proteinLibrary.MalateDehydrogenase.Info, /not a mitochondrial isoform/);

// The issue being repaired: all six cards must render even when the player has
// no synthesis prerequisites, and their selection buttons must still work.
function element(tag) {
    return {tag, children: [], events: {}, classList: {add() {}},
        append(...nodes) { this.children.push(...nodes); },
        replaceChildren(...nodes) { this.children = nodes; },
        setAttribute() {},
        addEventListener(name, callback) { this.events[name] = callback; }};
}
const documentBefore = globalThis.document;
try {
    globalThis.document = {createElement: element};
    gameState.zones.polymerizer.state = {productInventory:{}, activeAssembly:null};
    gameState.zones.macromolecularizer.state.motifInventory = {};
    const products = Polymerizer.getStatus().products;
    const container = element('div');
    let selected;
    ProductView.renderCatalog(container, products, null, null, id => { selected = id; });
    const cards = container.children.filter(child => child.tag === 'button');
    assert.equal(cards.length, 39);
    for (const id of ['CitrateSynthase','Aconitase','IsocitrateDehydrogenase','SuccinylCoASynthetase','Fumarase','MalateDehydrogenase']) {
        const product = products.find(product => product.id === id);
        assert.equal(product.locked, false);
        assert.equal(product.canStart, false);
        const card = cards.find(card => card.children[0].children[0].textContent === Recipes.get(id).name);
        assert(card, `${id} must be visible when synthesis requirements are incomplete`);
        assert.equal(card.disabled, false);
        assert.equal(card.children[0].children[1].textContent, 'Requirements incomplete');
        assert.equal(card.children[1].textContent, 'Krebs Cycle');
        card.events.click();
        assert.equal(selected, id);
    }
} finally { globalThis.document = documentBefore; }

gameState.zones.polymerizer.state = {productInventory: {}, activeAssembly: null};
gameState.zones.macromolecularizer.state.motifInventory = {H_helix:200, B_sheet:200, L_loop:200};
gameState.zones.metabolism.state = {};
Metabolism.initialize();
Resources.setATPStatus({current:1000, maximum:1000}, 'test');
const motifs = structuredClone(gameState.zones.macromolecularizer.state.motifInventory);
const discoveries = structuredClone(gameState.registry.discoveries);
const achievements = structuredClone(gameState.registry.achievements);
const metabolismBefore = structuredClone(gameState.zones.metabolism.state);
assert.equal(Components.start('CitrateSynthase', 2, 1000).success, false);
let started = Components.start('CitrateSynthase', 1, 1000);
assert.equal(started.success, true);
assert.equal(Polymerizer.finishAssembly(started.activeAssembly.jobId, started.activeAssembly.completesAtMs).success, true);
assert.equal(Metabolism.getProductCount('CitrateSynthase'), 0, 'a partial dimer is not an available enzyme');
assert.equal(Components.getStatus('CitrateSynthase').plan.atpCost, 44);
started = Components.start('CitrateSynthase', null, 100000);
assert.equal(started.success, true);
assert.equal(Polymerizer.finishAssembly(started.activeAssembly.jobId, started.activeAssembly.completesAtMs).success, true);
assert.equal(Metabolism.getProductCount('CitrateSynthase'), 1);
for (const id of ['Aconitase', 'IsocitrateDehydrogenase', 'SuccinylCoASynthetase', 'Fumarase', 'MalateDehydrogenase']) {
    started = Polymerizer.startAssembly(id, 200000);
    assert.equal(started.success, true);
    assert.equal(Polymerizer.finishAssembly(started.activeAssembly.jobId, started.activeAssembly.completesAtMs).success, true);
    assert.equal(Metabolism.getProductCount(id), 1);
}
assert.equal(Resources.getATPStatus().current, 155, 'six syntheses spend 89 + 125 + 128 + 253 + 160 + 90 ATP');
assert.deepEqual(gameState.zones.macromolecularizer.state.motifInventory, motifs);
assert.deepEqual(gameState.registry.discoveries, discoveries);
assert.deepEqual(gameState.registry.achievements, achievements);
assert.deepEqual(gameState.zones.metabolism.state, metabolismBefore, 'synthesis must not activate the pathway or award practice Ps');
assert.equal(Polymerizer.startAssembly('Aconitase', 300000).success, false, 'one-time synthesis');
console.log('PASS: six exact CSV recipes, all six selectable cards without prerequisites, frame-zero/final images, numbered components, isolated practice, partial/full inventory gating, and synthesis without automatic pathway activation.');
