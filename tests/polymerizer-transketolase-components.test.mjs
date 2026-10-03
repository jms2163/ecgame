import assert from 'node:assert/strict';
import fs from 'node:fs';
import Recipes from '../src/data/PolymerizerRecipeCatalog.js';
import Visuals from '../src/data/PolymerizerVisualCatalog.js';
import {ProteinAssemblyPractice} from '../src/app/ProteinAssemblyPractice.js';
import {componentProgress,componentPlan} from '../src/app/ProteinComponentPlan.js';
import gameState from '../src/app/GameState.js';
import ResourceManager from '../src/app/ResourceManager.js';
import Manager from '../src/app/PolymerizerManager.js';
import Components from '../src/app/PolymerizerComponentManager.js';
import Observer from '../src/app/GameStateObserver.js';
const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const definition=Recipes.get('Transketolase'),visual=Visuals.get('Transketolase');
const rows=fs.readFileSync(new URL('../docs/data/5nd5-motifs.csv',import.meta.url),'utf8').trim().split(/\r?\n/).slice(1).map(line=>line.split(','));
assert.equal(definition.simplifiedStructure,rows.map(r=>r[5]).join(''));assert.equal(definition.valid,true);assert.equal(definition.motifCount,188);assert.equal(definition.atpCost,188);
assert.equal(definition.components.length,2);assert.equal(visual.frameCount,88);assert.equal(visual.displayZoomPercent,270);
assert.match(visual.idleImageUrl,/5nd5-0\.webp$/);assert.match(visual.finalImageUrl,/5nd5-87\.webp$/);
for(const c of definition.components){const own=rows.filter(r=>r[3]===c.sourceChain);for(const key of ['H','B','L'])assert.equal(c.recipe[key],own.filter(r=>r[5]===key).length);const frames=own.filter(r=>r[9]).map(r=>Number(r[9]));assert.equal(c.firstFrame,Math.min(...frames));assert.equal(c.lastFrame,Math.max(...frames));}
assert.equal(componentPlan(definition,[1]).atpCost,96);assert.equal(componentPlan(definition,[2]).atpCost,92);
assert.equal(componentProgress(definition,{completedIds:[1]}).frame,43);
const before=structuredClone(gameState),practice=new ProteinAssemblyPractice('Transketolase');
assert.equal(practice.start(2,100),false);assert.equal(practice.start(1,100),true);practice.tick(8100);assert.match(practice.imageUrl(),/5nd5-43\.webp$/);
assert.equal(practice.full,false);assert.equal(practice.start(null,8200),true);practice.tick(16200);assert.equal(practice.full,true);assert.match(practice.imageUrl(),/5nd5-87\.webp$/);assert.deepEqual(gameState,before,'practice uses local components only');
gameState.zones.polymerizer.state={productInventory:{},activeAssembly:null};
gameState.zones.macromolecularizer.state.motifInventory={H_helix:32,B_sheet:19,L_loop:45};
ResourceManager.setATPStatus({current:500,maximum:1000},'test');let completions=0;Observer.on('polymerizer-product-completed',p=>{if(p.productId==='Transketolase')completions++;});
assert.equal(Components.start('Transketolase',2,1000).success,false);
let result=Components.start('Transketolase',1,1000);assert.equal(result.success,true);assert.equal(ResourceManager.getATPStatus().current,404);
assert.equal(Manager.finishAssembly(result.activeAssembly.jobId,result.activeAssembly.completesAtMs).success,true);
assert.equal(completions,0);assert.equal(Manager.ensureState().productInventory.Transketolase,undefined);
gameState.zones.polymerizer.state=JSON.parse(store.get('ECGame_Save')).zones.polymerizer.state;
assert.equal(Components.getStatus('Transketolase').progress.completedCount,1);assert.equal(Components.getStatus('Transketolase').plan.atpCost,92);
result=Components.start('Transketolase',null,100000);assert.equal(result.success,true);assert.equal(ResourceManager.getATPStatus().current,312);
assert.equal(Manager.finishAssembly(result.activeAssembly.jobId,result.activeAssembly.completesAtMs).success,true);assert.equal(completions,1);assert.equal(Manager.ensureState().productInventory.Transketolase.count,1);
assert.equal(Components.getStatus('Transketolase').progress.completedCount,2);assert.equal(Components.start('Transketolase',null,200000).success,false);
// Earlier full-protein completion remains valid without a component record.
gameState.zones.polymerizer.state={productInventory:{Transketolase:{count:1,firstCompletedAtMs:100,lastCompletedAtMs:100}},activeAssembly:null};
assert.equal(Manager.getProductEligibility('Transketolase').completion.completed,true);assert.equal(Components.getStatus('Transketolase').progress.completedCount,2);
// A previously paid 176-ATP whole-dimer job survives the catalog correction.
const legacyJob={jobId:'legacy-transketolase',productId:'Transketolase',startedAtMs:1000,
 completesAtMs:60000,durationMs:59000,atpCost:176,motifRequirements:[
 {productId:'H_helix',quantity:54},{productId:'B_sheet',quantity:34},{productId:'L_loop',quantity:88}]};
gameState.zones.polymerizer.state={productInventory:{},activeAssembly:legacyJob};
const legacyATP=ResourceManager.getATPStatus().current;
assert.equal(Manager.getActiveAssemblyProgress(1001).jobId,legacyJob.jobId);
assert.equal(Manager.getActiveAssemblyProgress(1001).atpCost,176);
assert.equal(Manager.finishAssembly(legacyJob.jobId,legacyJob.completesAtMs).success,true);
assert.equal(Manager.ensureState().productInventory.Transketolase.count,1);
assert.equal(ResourceManager.getATPStatus().current,legacyATP,'old paid jobs are not charged again');
console.log('PASS: exact two-chain CSV recipes and reveal boundaries, 88 frames, 270% zoom, numbered practice, partial-save reload, remaining-only ATP, full-only completion, legacy completed inventory, and previously paid whole-dimer jobs.');
