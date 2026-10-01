import assert from 'node:assert/strict';
import gameState from '../src/app/GameState.js';
import SaveManager from '../src/app/SaveManager.js';
import Observer from '../src/app/GameStateObserver.js';
import MetabolismManager from '../src/app/MetabolismManager.js';
import Progress from '../src/app/MetabolismPracticeProgress.js';
import Manager from '../src/app/CalvinRegenerationManager.js';
import {REGENERATION_ACTIVITY_ID,REGENERATION_ENZYMES,REGENERATION_STEPS,REGENERATION_QUESTIONS,createRegenerationSession,regenerationStep,dockRegenerationInput,runRegenerationReaction,storeRegenerationProducts,repeatRemainingPRK,returnRegeneratedRuBP,answerRegeneration,regenerationScore,regenerationLedger} from '../src/app/CalvinRegenerationModel.js';
const storage=new Map();let writes=0,productEvents=0;
globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>{writes++;storage.set(k,String(v));},removeItem:k=>storage.delete(k)};
Observer.on('polymerizer-product-completed',()=>productEvents++);
gameState.zones.metabolism.state={unrelated:{keep:true},guidedActivities:{other:{completed:true}},practiceMastery:{TriosePhosphateIsomerase:{activityId:'prior',scorePercent:100,completedAtMs:1}}};
MetabolismManager.initialize();const before=structuredClone(gameState);
assert.equal(Manager.start(),false);assert.equal(Manager.start(true),true);assert.deepEqual(gameState,before);
assert.equal(Manager.complete().reason,'activity-incomplete');
function conservation(s){const l=regenerationLedger(s);assert.equal(l.carbons,15);assert.equal(l.phosphorusIn,l.phosphorusOut);assert.equal(l.netG3P,1);}
function step(s){
 const current=regenerationStep(s);assert.equal(runRegenerationReaction(s),false,'enzyme and all inputs required');
 assert.equal(storeRegenerationProducts(s),false);assert.equal(returnRegeneratedRuBP(s),false);assert.equal(answerRegeneration(s,'five'),false);
 assert.equal(dockRegenerationInput(s,'CO2'),false,'no new CO2 enters regeneration');
 assert.equal(dockRegenerationInput(s,'enzyme'),true);assert.equal(dockRegenerationInput(s,'enzyme'),false);
 for(const [k,n] of Object.entries(current.inputs)){
  for(let i=0;i<n;i++)assert.equal(dockRegenerationInput(s,k),true);
  assert.equal(dockRegenerationInput(s,k),false,'cannot duplicate input');
 }
 assert.equal(runRegenerationReaction(s),true);assert.equal(runRegenerationReaction(s),false);conservation(s);
 assert.equal(repeatRemainingPRK(s),false,'must inspect and collect first');
 assert.equal(storeRegenerationProducts(s),true);assert.equal(storeRegenerationProducts(s),false);conservation(s);
}
function reactions(s,batch=false){
 assert.equal(repeatRemainingPRK(s),false,'first PRK cannot be bypassed');
 while(s.phase==='reaction'){
  if(batch&&s.step===10){assert.equal(repeatRemainingPRK(s),true);conservation(s);break;}
  step(s);
 }
 assert.equal(s.phase,'return');assert.equal(repeatRemainingPRK(s),false);assert.equal(s.storedRuBP,3);
 assert.deepEqual(regenerationLedger(s),{carbons:15,phosphorusIn:14,phosphorusOut:14,pi:2,water:2,atp:3,adp:3,ruBP:3,netG3P:1});
 assert.equal(answerRegeneration(s,'five'),false,'return recycled RuBP before quiz');assert.equal(returnRegeneratedRuBP(s),true);assert.equal(returnRegeneratedRuBP(s),false);
}
function quiz(s,wrong=false){for(const [i,q] of REGENERATION_QUESTIONS.entries()){if(wrong&&i===0)assert.equal(answerRegeneration(s,'atp'),false);assert.equal(answerRegeneration(s,q.answer),true);}assert.equal(s.phase,'complete');}
reactions(Manager.session);quiz(Manager.session,true);assert.equal(regenerationScore(Manager.session),80);assert.equal(Manager.complete().success,true);assert.deepEqual(gameState,before);assert.equal(writes,0);
Manager.reset();Manager.start(true);reactions(Manager.session,true);quiz(Manager.session);
const save=SaveManager.save;SaveManager.save=()=>false;
assert.equal(Manager.complete(100).reason,'save-failed');assert.equal(Manager.getStatus().completed,false);assert.deepEqual(gameState,before,'failed eight-marker batch rolls back');
SaveManager.save=save;assert.equal(Manager.complete(100).scorePercent,100);assert.equal(Manager.getStatus().completed,true);
const expected=structuredClone(before);expected.saveMetadata=structuredClone(gameState.saveMetadata);
for(const id of REGENERATION_ENZYMES)if(id!=='TriosePhosphateIsomerase')expected.zones.metabolism.state.practiceMastery[id]={activityId:REGENERATION_ACTIVITY_ID,scorePercent:100,completedAtMs:100};
assert.deepEqual(gameState,expected,'only new practice markers and save metadata change; prior shared marker preserved');
const count=writes;assert.equal(Manager.complete(200).reason,'already-practiced');assert.equal(writes,count);assert.equal(productEvents,0);
Manager.reset();gameState.zones.metabolism.state=JSON.parse(storage.get('ECGame_Save')).zones.metabolism.state;
for(const id of REGENERATION_ENZYMES)assert.equal(Progress.hasPerfectPractice(id),true);
assert.equal(Manager.start(),false);
gameState.zones.metabolism.state.guidedActivities['calvin-reduction']={completed:true};
for(const [i,id] of REGENERATION_ENZYMES.entries()){
 gameState.zones.polymerizer.state.productInventory[id]={count:1};
 assert.equal(Manager.start(),false,'all eight activated slots required');
 assert.equal(MetabolismManager.placeEnzyme('calvinCycle',i+4,id).success,true);
}
const guidedBefore=structuredClone(gameState);assert.equal(Manager.start(),true);reactions(Manager.session,true);quiz(Manager.session);
SaveManager.save=()=>false;assert.equal(Manager.complete(400).reason,'save-failed');assert.deepEqual(gameState,guidedBefore);
SaveManager.save=save;assert.equal(Manager.complete(400).success,true);
const expectedGuided=structuredClone(guidedBefore);expectedGuided.saveMetadata=structuredClone(gameState.saveMetadata);
expectedGuided.zones.metabolism.state.guidedActivities[REGENERATION_ACTIVITY_ID]={completed:true,completedAtMs:400,definitionVersion:1};assert.deepEqual(gameState,expectedGuided);
assert.equal(Manager.complete(500).reason,'replay-complete');assert.equal(productEvents,0);Manager.reset();
// PRK repeat is atomic if the remaining substrates are absent/corrupt.
const corrupt=createRegenerationSession();while(corrupt.step<10)step(corrupt);
corrupt.bench.Ru5P=1;const snapshot=structuredClone(corrupt);assert.equal(repeatRemainingPRK(corrupt),false);assert.deepEqual(corrupt,snapshot);
const missing=createRegenerationSession();missing.bench.G3P=1;assert.equal(dockRegenerationInput(missing,'G3P'),true);assert.equal(dockRegenerationInput(missing,'G3P'),false,'cannot dock nonexistent second sugar');
assert.equal(REGENERATION_STEPS.length,12);
console.log('PASS: regeneration conserves 15 carbons and phosphate at every reaction; exact water/ATP/ADP/Pi totals; first PRK manual gate; atomic repeats, saves, permanent practice, and normal C2/eight-slot gates.');
