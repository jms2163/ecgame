import assert from 'node:assert/strict';
import gameState from '../src/app/GameState.js';
import SaveManager from '../src/app/SaveManager.js';
import Observer from '../src/app/GameStateObserver.js';
import MetabolismManager from '../src/app/MetabolismManager.js';
import Manager from '../src/app/CalvinReductionManager.js';
import Progress from '../src/app/MetabolismPracticeProgress.js';
import {REDUCTION_ACTIVITY_ID,REDUCTION_ENZYMES,REDUCTION_QUESTIONS,createReductionSession,
 dockReductionInput,phosphorylatePGA,moveToReduction,reduceBPG,storeReductionProducts,
 advanceReduction,answerReduction,reductionScore,reductionLedger,allocateReductionG3P,finishReductionAllocation} from '../src/app/CalvinReductionModel.js';

const storage=new Map();let writes=0,markerEvents=0,productEvents=0;
globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>{writes++;storage.set(k,String(v));},removeItem:k=>storage.delete(k)};
Observer.on('metabolism-state-changed',e=>{if(e.reason==='practice-marker')markerEvents++;});
Observer.on('polymerizer-product-completed',()=>productEvents++);
gameState.zones.metabolism.state={unrelated:{keep:true},guidedActivities:{other:{completed:true}},practiceMastery:{Other:{scorePercent:100}}};
MetabolismManager.initialize();
const before=structuredClone(gameState);
assert.equal(Manager.start(),false,'normal C2 requires C1 and activated enzymes');
assert.equal(Manager.start(true),true,'practice needs no protein ownership or saved C1');
assert.deepEqual(gameState,before,'opening practice writes nothing');
assert.equal(Manager.complete().reason,'activity-incomplete');

function runReactions(s){
 assert.equal(moveToReduction(s),false);assert.equal(reduceBPG(s),false);
 assert.equal(storeReductionProducts(s),false);assert.equal(answerReduction(s,'phosphate'),false);
 assert.equal(dockReductionInput(s,'NADPH'),false,'NADPH cannot replace ATP');
 for(let i=0;i<6;i++){
  if(i===0){assert.equal(phosphorylatePGA(s),false);assert.equal(dockReductionInput(s,'PGK'),true);}
  assert.equal(dockReductionInput(s,'PGA'),true);assert.equal(phosphorylatePGA(s),false,'ATP is required');
  assert.equal(dockReductionInput(s,'ATP'),true);assert.equal(dockReductionInput(s,'ATP'),false);
  assert.equal(phosphorylatePGA(s),true);assert.equal(phosphorylatePGA(s),false);
  let l=reductionLedger(s);
  assert.equal(l.carbonIn,l.carbonInProducts+l.carbonInIntermediate);
  assert.equal(l.phosphorusIn,l.phosphorusOut);
  assert.equal(l.atpUsed,i+1);assert.equal(l.nadphUsed,i);
  assert.equal(dockReductionInput(s,'NADPH'),false,'intermediate must be transferred first');
  assert.equal(moveToReduction(s),true);assert.equal(moveToReduction(s),false);
  if(i===0)assert.equal(dockReductionInput(s,'GAPDH'),true);
  assert.equal(reduceBPG(s),false,'NADPH is required');
  assert.equal(dockReductionInput(s,'ATP'),false,'ATP cannot replace NADPH');
  assert.equal(dockReductionInput(s,'NADPH'),true);assert.equal(reduceBPG(s),true);assert.equal(reduceBPG(s),false);
  l=reductionLedger(s);assert.equal(l.carbonIn,l.carbonInProducts);assert.equal(l.phosphorusIn,l.phosphorusOut);
  assert.equal(advanceReduction(s),false,'collection is required');
  assert.equal(storeReductionProducts(s),true);assert.equal(storeReductionProducts(s),false);
  assert.equal(advanceReduction(s),true);
 }
 assert.equal(s.phase,'allocation');
 assert.equal(answerReduction(s,'phosphate'),false,'allocation must be completed before questions');
 assert.equal(finishReductionAllocation(s),false);
 for(let i=0;i<5;i++)assert.equal(allocateReductionG3P(s,'regeneration',i),true);
 assert.equal(allocateReductionG3P(s,'regeneration',5),false,'cannot reserve all six');
 assert.equal(allocateReductionG3P(s,'net',0),false,'a reserved G3P cannot also be net');
 assert.equal(allocateReductionG3P(s,'net',5),true);
 assert.equal(finishReductionAllocation(s),true);
 assert.equal(s.phase,'quiz');
 assert.deepEqual(reductionLedger(s),{pgaUsed:6,atpUsed:6,adpFormed:6,nadphUsed:6,nadpFormed:6,piFormed:6,g3pFormed:6,stored:6,
  carbonIn:18,carbonInProducts:18,carbonInIntermediate:0,phosphorusIn:24,phosphorusOut:24});
}
function answerQuiz(s,wrong=false){
 for(let i=0;i<REDUCTION_QUESTIONS.length;i++){
  if(wrong && i===0)assert.equal(answerReduction(s,'carbon'),false);
  assert.equal(answerReduction(s,REDUCTION_QUESTIONS[i].answer),true);
 }
 assert.equal(s.phase,'complete');
}
runReactions(Manager.session);assert.equal(Manager.complete().reason,'activity-incomplete');
answerQuiz(Manager.session,true);assert.equal(reductionScore(Manager.session),75);
assert.equal(Manager.complete().success,true);assert.equal(Progress.hasPerfectPractice(REDUCTION_ENZYMES[0]),false);
assert.equal(writes,0);assert.deepEqual(gameState,before,'imperfect practice awards no marker or gameplay changes');
Manager.reset();Manager.start(true);runReactions(Manager.session);answerQuiz(Manager.session);
const save=SaveManager.save;SaveManager.save=()=>false;
assert.equal(Manager.complete(100).reason,'save-failed');assert.equal(Manager.getStatus().completed,false);
assert.deepEqual(gameState,before,'both markers are rolled back atomically');
SaveManager.save=save;
assert.equal(Manager.complete(100).scorePercent,100);assert.equal(Manager.getStatus().completed,true);
assert.equal(markerEvents,1);assert.equal(productEvents,0);
const expected=structuredClone(before);expected.saveMetadata=structuredClone(gameState.saveMetadata);
for(const enzymeId of REDUCTION_ENZYMES)expected.zones.metabolism.state.practiceMastery[enzymeId]={activityId:REDUCTION_ACTIVITY_ID,scorePercent:100,completedAtMs:100};
assert.deepEqual(gameState,expected,'only the two educational P markers and normal save metadata change');
const beforeReplayWrites=writes;assert.equal(Manager.complete(200).reason,'already-practiced');assert.equal(writes,beforeReplayWrites);
Manager.reset();gameState.zones.metabolism.state=JSON.parse(storage.get('ECGame_Save')).zones.metabolism.state;
for(const id of REDUCTION_ENZYMES)assert.equal(Progress.hasPerfectPractice(id),true,'markers survive reload');

// Normal guided C2 is independent of perfect-practice markers and grants no gameplay reward.
assert.equal(Manager.start(),false);
gameState.zones.metabolism.state.guidedActivities['calvin-carbon-fixation']={completed:true,completedAtMs:50};
for(const id of REDUCTION_ENZYMES)gameState.zones.polymerizer.state.productInventory[id]={count:1};
assert.equal(Manager.start(),false,'synthesis alone does not activate enzymes');
assert.equal(MetabolismManager.placeEnzyme('calvinCycle',2,REDUCTION_ENZYMES[0]).success,true);
assert.equal(Manager.start(),false,'GAPDH slot is also required');
assert.equal(MetabolismManager.placeEnzyme('calvinCycle',3,REDUCTION_ENZYMES[1]).success,true);
const beforeGuided=structuredClone(gameState);
assert.equal(Manager.start(),true);runReactions(Manager.session);answerQuiz(Manager.session);
SaveManager.save=()=>false;assert.equal(Manager.complete(400).reason,'save-failed');assert.deepEqual(gameState,beforeGuided);
SaveManager.save=save;assert.equal(Manager.complete(400).success,true);
const expectedGuided=structuredClone(beforeGuided);expectedGuided.saveMetadata=structuredClone(gameState.saveMetadata);
expectedGuided.zones.metabolism.state.guidedActivities[REDUCTION_ACTIVITY_ID]={completed:true,completedAtMs:400,definitionVersion:1};
assert.deepEqual(gameState,expectedGuided);
assert.equal(Manager.complete(500).reason,'replay-complete');
assert.equal(productEvents,0);Manager.reset();
// A marker previously earned for one shared enzyme must survive a batch save.
delete gameState.zones.metabolism.state.practiceMastery[REDUCTION_ENZYMES[1]];
const previousMarkers=structuredClone(gameState.zones.metabolism.state.practiceMastery);
Manager.start(true);runReactions(Manager.session);answerQuiz(Manager.session);
SaveManager.save=()=>false;assert.equal(Manager.complete(600).reason,'save-failed');
assert.deepEqual(gameState.zones.metabolism.state.practiceMastery,previousMarkers);
SaveManager.save=save;assert.equal(Manager.complete(600).success,true);
assert.deepEqual(gameState.zones.metabolism.state.practiceMastery[REDUCTION_ENZYMES[0]],previousMarkers[REDUCTION_ENZYMES[0]]);
assert.equal(gameState.zones.metabolism.state.practiceMastery[REDUCTION_ENZYMES[1]].completedAtMs,600);
Manager.reset();
const early=createReductionSession();assert.equal(advanceReduction(early),false);
console.log('PASS: C2 conserves carbon/phosphorus; requires PGK/ATP then GAPDH/NADPH; collects six products; four questions gate completion; perfect markers save atomically; normal mastery gates and save isolation hold.');
