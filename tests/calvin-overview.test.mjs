import assert from 'node:assert/strict';
import {CALVIN_OVERVIEW_ENZYMES as enzymes,CALVIN_OVERVIEW_NODES as nodes,calvinOverviewSnapshot as snapshot} from '../src/app/CalvinOverviewModel.js';
import {createRegenerationSession,REGENERATION_STEPS,dockRegenerationInput,runRegenerationReaction,storeRegenerationProducts,regenerationLedger} from '../src/app/CalvinRegenerationModel.js';
assert.equal(enzymes.length,11);
assert.equal(new Set(enzymes).size,11);
assert.equal(nodes.length,13);
assert.equal(nodes.filter(n=>n.enzymeId==='Aldolase').length,2);
assert.equal(nodes.filter(n=>n.enzymeId==='Transketolase').length,2);
assert.equal(snapshot().canAutomate,false);
for(const missing of enzymes){const progress=Object.fromEntries(enzymes.map(id=>[id,{scorePercent:id===missing?99:100}]));const before=structuredClone(progress);const state=snapshot({hasPractice:id=>progress[id]?.scorePercent===100});assert.equal(state.canAutomate,false,'every unique enzyme requires perfect practice');assert.equal(state.mastered.length,10);assert.deepEqual(progress,before);}
assert.equal(snapshot({hasPractice:()=>true}).canAutomate,true);
assert.equal(snapshot({fixation:{reactions:1}}).index,0);
for(const phase of ['phosphorylation','phosphorylated'])assert.equal(snapshot({reduction:{phase}}).index,1);
for(const phase of ['reduction','products','stored','allocation','quiz','complete'])assert.equal(snapshot({reduction:{phase}}).index,2);
assert.equal(snapshot({reduction:{phase:'allocation'}}).showNet,true);
assert.equal(snapshot({reduction:{phase:'stored',stored:1}}).showNet,false);
const batch=createRegenerationSession();
while(batch.phase==='reaction'){
 const before=structuredClone(batch);const state=snapshot({regeneration:batch});assert.deepEqual(batch,before,'presentation does not change reactions or grant mastery');assert.equal(state.index,Math.min(batch.step+3,12));assert.equal(state.canAutomate,false);
 const spec=REGENERATION_STEPS[batch.step];for(const[k,n]of Object.entries(spec.inputs))for(let i=0;i<n;i++)assert.equal(dockRegenerationInput(batch,k),true);dockRegenerationInput(batch,'enzyme');assert.equal(runRegenerationReaction(batch),true);assert.equal(storeRegenerationProducts(batch),true);
 assert.equal(regenerationLedger(batch).carbons,15);
}
assert.equal(snapshot({regeneration:batch}).showReturn,true);
assert.equal(batch.storedRuBP,3);assert.equal(batch.atp,3);
console.log('PASS: thirteen reaction dots, eleven unique perfect-practice gates, phase tracking, pure snapshots, and conserved regeneration batch.');
