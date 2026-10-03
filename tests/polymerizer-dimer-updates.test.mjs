import assert from 'node:assert/strict';
import fs from 'node:fs';
import Recipes from '../src/data/PolymerizerRecipeCatalog.js';
import Visuals from '../src/data/PolymerizerVisualCatalog.js';
import {ProteinAssemblyPractice} from '../src/app/ProteinAssemblyPractice.js';
import {componentPlan} from '../src/app/ProteinComponentPlan.js';
import gameState from '../src/app/GameState.js';
import Resources from '../src/app/ResourceManager.js';
import Manager from '../src/app/PolymerizerManager.js';
import Components from '../src/app/PolymerizerComponentManager.js';
const store=new Map();let failSave=false;
globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>{if(failSave)throw new Error('test quota');store.set(k,String(v));},removeItem:k=>store.delete(k)};
for(const [id,pdb,count,last] of [['Hexokinase','1bg3',250,131],['FattyAcidSynthase','2vz9',642,322]]) {
 const d=Recipes.get(id),v=Visuals.get(id);
 const rows=fs.readFileSync(new URL(`../docs/data/${pdb}-motifs.csv`,import.meta.url),'utf8').trim().split(/\r?\n/).slice(1).map(x=>x.split(','));
 assert.equal(d.valid,true);assert.equal(d.implemented,true);assert.equal(d.simplifiedStructure,rows.map(r=>r[5]).join(''));
 assert.equal(d.motifCount,count);assert.equal(d.components.length,2);assert.equal(v.lastFrameNumber,last);
 for(const c of d.components){const own=rows.filter(r=>r[3]===c.sourceChain),frames=own.filter(r=>r[9]).map(r=>+r[9]);for(const k of ['H','B','L'])assert.equal(c.recipe[k],own.filter(r=>r[5]===k).length);assert.equal(c.firstFrame,Math.min(...frames));assert.equal(c.lastFrame,Math.max(...frames));}
 const before=structuredClone(gameState),practice=new ProteinAssemblyPractice(id);
 assert.match(practice.imageUrl(),new RegExp(`${pdb}-0\\.webp$`));practice.start(1,100);practice.tick(8100);assert.equal(practice.full,false);
 assert.match(practice.imageUrl(),new RegExp(`${pdb}-${d.components[0].lastFrame}\\.webp$`));practice.start(null,8200);practice.tick(16200);assert.equal(practice.full,true);assert.equal(practice.imageUrl(),v.finalImageUrl);assert.deepEqual(gameState,before);
 gameState.zones.polymerizer.state={productInventory:{},activeAssembly:null};
 gameState.zones.macromolecularizer.state.motifInventory={H_helix:1000,B_sheet:1000,L_loop:1000};
 Resources.setATPStatus({current:1000,maximum:2000},'test');delete gameState.registry.achievements.megasynthase;
 let r=Components.start(id,1,1000);assert.equal(r.success,true);assert.equal(Manager.finishAssembly(r.activeAssembly.jobId,r.activeAssembly.completesAtMs).success,true);
 assert.equal(Manager.ensureState().productInventory[id],undefined);assert.equal(gameState.registry.achievements.megasynthase,undefined);
 gameState.zones.polymerizer.state=JSON.parse(store.get('ECGame_Save')).zones.polymerizer.state;
 assert.equal(Components.getStatus(id).progress.completedCount,1);assert.equal(Components.getStatus(id).plan.atpCost,componentPlan(d,[2]).atpCost);
 r=Manager.startAssembly(id,100000);assert.equal(r.success,true);
 if(id==='FattyAcidSynthase') {failSave=true;assert.equal(Manager.finishAssembly(r.activeAssembly.jobId,r.activeAssembly.completesAtMs).success,false);failSave=false;assert.equal(gameState.registry.achievements.megasynthase,undefined);assert.equal(Components.getStatus(id).progress.completedCount,1);}
 assert.equal(Manager.finishAssembly(r.activeAssembly.jobId,r.activeAssembly.completesAtMs).success,true);
 assert.equal(Resources.getATPStatus().current,1000-count);assert.equal(Manager.ensureState().productInventory[id].count,1);
 const earned=gameState.registry.achievements.megasynthase;
 assert.equal(Boolean(earned),id==='FattyAcidSynthase');if(earned){assert.equal(earned.title,'Megasynthase');assert.equal(JSON.parse(store.get('ECGame_Save')).registry.achievements.megasynthase.title,'Megasynthase');}
}
const legacy={jobId:'old-hexokinase',productId:'Hexokinase',startedAtMs:1000,completesAtMs:39750,durationMs:38750,atpCost:95,motifRequirements:[{productId:'H_helix',quantity:22},{productId:'B_sheet',quantity:25},{productId:'L_loop',quantity:48}]};
gameState.zones.polymerizer.state={productInventory:{},activeAssembly:legacy};
assert.equal(Manager.getActiveAssemblyProgress(1001).atpCost,95);assert.equal(Manager.finishAssembly(legacy.jobId,legacy.completesAtMs).success,true);
for(const v of Visuals.getAll())assert.equal(v.firstFrameNumber,0,`${v.productId} begins fully white at frame 0`);
console.log('PASS: exact dimer recipes and frames, component practice isolation, partial reloads, remaining-only ATP, full-only Megasynthase, failed-save rollback, legacy hexokinase jobs, and universal frame-zero previews.');
