// A transient five-G3P batch. No inventory, rewards, or discoveries are changed.
export const REGENERATION_ACTIVITY_ID = "calvin-regeneration";
export const REGENERATION_ENZYMES = ["TriosePhosphateIsomerase", "Aldolase", "FructoseBisphosphatase", "Transketolase", "SedoheptuloseBisphosphatase", "Ribose5PhosphateIsomerase", "Ribulose5PhosphateEpimerase", "Phosphoribulokinase"];
export const SUGARS = {
    G3P:{name:"Glyceraldehyde-3-phosphate",c:3,p:1}, DHAP:{name:"Dihydroxyacetone phosphate",c:3,p:1},
    FBP:{name:"Fructose-1,6-bisphosphate",c:6,p:2}, F6P:{name:"Fructose-6-phosphate",c:6,p:1},
    E4P:{name:"Erythrose-4-phosphate",c:4,p:1}, Xu5P:{name:"Xylulose-5-phosphate",c:5,p:1},
    SBP:{name:"Sedoheptulose-1,7-bisphosphate",c:7,p:2}, S7P:{name:"Sedoheptulose-7-phosphate",c:7,p:1},
    R5P:{name:"Ribose-5-phosphate",c:5,p:1}, Ru5P:{name:"Ribulose-5-phosphate",c:5,p:1},
    RuBP:{name:"Ribulose-1,5-bisphosphate",c:5,p:2}
};
// A valid sequential route through the regeneration network. Independent reactions
// are grouped, rather than implying that every molecule follows one linear path.
export const REGENERATION_STEPS = [
    {enzyme:0,abbr:"TPI",title:"Rearrange two three-carbon sugars",inputs:{G3P:2},outputs:{DHAP:2},note:"TPI changes the position of the carbonyl group: two G3P become two DHAP. No carbon or phosphate is added."},
    {enzyme:1,abbr:"Aldolase",title:"Join two three-carbon sugars",inputs:{DHAP:1,G3P:1},outputs:{FBP:1},note:"Aldolase joins a three-carbon DHAP and a three-carbon G3P: 3 + 3 = 6. Both phosphates remain attached. Joining here does not release water."},
    {enzyme:2,abbr:"FBPase",title:"Remove one phosphate with water",inputs:{FBP:1,H2O:1},outputs:{F6P:1},pi:1,note:"FBPase uses water to hydrolyze one phosphate ester: FBP becomes F6P plus free inorganic phosphate (Pi). It does not make ATP or split the carbon chain."},
    {enzyme:3,abbr:"Transketolase",title:"Transfer a two-carbon fragment",inputs:{F6P:1,G3P:1},outputs:{E4P:1,Xu5P:1},transfer:["F6P","G3P"],note:"Transketolase transfers two carbons from F6P to G3P: 6 + 3 becomes 4 + 5. No CO₂ enters. Its bound cofactor TPP is omitted from this schematic."},
    {enzyme:1,abbr:"Aldolase",title:"Join four and three carbons",inputs:{DHAP:1,E4P:1},outputs:{SBP:1},note:"Aldolase acts again: three-carbon DHAP joins four-carbon E4P to make seven-carbon SBP. Both phosphates remain attached."},
    {enzyme:4,abbr:"SBPase",title:"Remove another phosphate with water",inputs:{SBP:1,H2O:1},outputs:{S7P:1},pi:1,note:"SBPase uses water to hydrolyze one phosphate ester. Seven carbons remain in S7P; one phosphate is released as Pi."},
    {enzyme:3,abbr:"Transketolase",title:"Transfer two carbons again",inputs:{S7P:1,G3P:1},outputs:{R5P:1,Xu5P:1},transfer:["S7P","G3P"],note:"Transketolase transfers two carbons from S7P to the remaining G3P: 7 + 3 becomes 5 + 5. With the earlier Xu5P, there are now three five-carbon sugars."},
    {enzyme:5,abbr:"RPI",title:"Rearrange ribose-5-phosphate",inputs:{R5P:1},outputs:{Ru5P:1},note:"RPI moves the carbonyl group. Ribose-5-phosphate becomes ribulose-5-phosphate; its five carbons and one phosphate are conserved."},
    {enzyme:6,abbr:"RPE",title:"Rearrange both xylulose-5-phosphates",inputs:{Xu5P:2},outputs:{Ru5P:2},note:"RPE changes the configuration at carbon 3 in each Xu5P. The two sugars become two Ru5P; no carbon or phosphate is added."},
    ...Array.from({length:3},(_,i)=>({enzyme:7,abbr:"PRK",title:`Regenerate RuBP · molecule ${i+1} of 3`,inputs:{ATP:1,Ru5P:1},outputs:{RuBP:1},atp:1,note:"PRK transfers ATP's terminal phosphate onto carbon 1 of Ru5P. RuBP has phosphates at carbons 1 and 5 and can accept CO₂ through RuBisCO again. ATP becomes ADP; no carbon is added."}))
];
export const REGENERATION_QUESTIONS = [
    {prompt:"Where do regeneration's 15 sugar carbons come from?",answer:"five",options:[["five","Five G3P reserved from reduction"],["atp","The three ATP molecules"],["co2","New CO₂ added during regeneration"]],feedback:"Five G3P contain 5 × 3 = 15 carbons. Regeneration rearranges these carbons; carbon fixation was the CO₂ entry step."},
    {prompt:"What does transketolase move between sugars?",answer:"two",options:[["two","A two-carbon fragment"],["p","A phosphate from ATP"],["whole","An entire five-carbon RuBP"]],feedback:"Transketolase transfers a two-carbon fragment from one sugar to another."},
    {prompt:"What do the three ATP do in regeneration?",answer:"phosphate",options:[["carbon","Build the five-carbon backbones"],["phosphate","Supply phosphate and energy to turn three Ru5P into three RuBP"],["net","Turn all six G3P into net output"]],feedback:"PRK uses one ATP per Ru5P to add its second phosphate. Three ATP regenerate three RuBP."},
    {prompt:"What can the regenerated RuBP do next?",answer:"accept",options:[["leave","All three RuBP leave as net sugar output"],["accept","Accept CO₂ again through RuBisCO"],["glycogen","Become glycogen directly through RuBisCO"]],feedback:"RuBP is the recycled CO₂ acceptor. One G3P, rather than the regenerated RuBP, is the net output of the three-CO₂ batch."},
    {prompt:"For one net G3P, how much ATP and NADPH does the complete Calvin batch use?",answer:"nine",options:[["six","6 ATP and 6 NADPH"],["nine","9 ATP and 6 NADPH"],["three","3 ATP and 3 NADPH"]],feedback:"Reduction used 6 ATP and 6 NADPH. Regeneration adds 3 ATP, for 9 ATP and 6 NADPH total."}
];
export function createRegenerationSession(){return {phase:"reaction",step:0,bench:{G3P:5},docked:{},pending:{},history:[],pi:0,water:0,atp:0,adp:0,storedRuBP:0,quizIndex:0,firstAnswers:[],mistakes:0,saved:false};}
export function regenerationStep(s){return REGENERATION_STEPS[s.step];}
export function dockRegenerationInput(s,input){
    const step=regenerationStep(s);if(s.phase!=="reaction"||!step)return false;
    const limit=input==="enzyme"?1:step.inputs[input];
    if(!limit||(s.docked[input]??0)>=limit)return false;
    if(SUGARS[input]&&(s.bench[input]??0)<(s.docked[input]??0)+1)return false;
    s.docked[input]=(s.docked[input]??0)+1;return true;
}
export function regenerationReady(s){const step=regenerationStep(s);return s.phase==="reaction"&&!!step&&s.docked.enzyme===1&&Object.entries(step.inputs).every(([k,n])=>s.docked[k]===n&&(!SUGARS[k]||(s.bench[k]??0)>=n));}
export function runRegenerationReaction(s){
    if(!regenerationReady(s))return false;const step=regenerationStep(s);
    for(const [k,n] of Object.entries(step.inputs))if(SUGARS[k])s.bench[k]-=n;
    s.pending={...step.outputs};s.pi+=step.pi??0;s.water+=step.inputs.H2O??0;s.atp+=step.atp??0;s.adp+=step.atp??0;
    s.phase="products";return true;
}
export function storeRegenerationProducts(s){
    if(s.phase!=="products")return false;
    for(const [k,n] of Object.entries(s.pending))s.bench[k]=(s.bench[k]??0)+n;
    s.storedRuBP=s.bench.RuBP??0;s.pending={};s.history.push(s.step);s.docked={};s.step++;
    s.phase=s.step===REGENERATION_STEPS.length?"return":"reaction";return true;
}
export function repeatRemainingPRK(s){
    if(s.phase!=="reaction"||s.step<10||s.step>11||Object.keys(s.docked).length)return false;
    const next=structuredClone(s);
    while(next.phase==="reaction"){
        for(const input of ["enzyme","ATP","Ru5P"])if(!dockRegenerationInput(next,input))return false;
        if(!runRegenerationReaction(next)||!storeRegenerationProducts(next))return false;
    }
    Object.assign(s,next);return true;
}
export function returnRegeneratedRuBP(s){if(s.phase!=="return"||s.storedRuBP!==3)return false;s.phase="quiz";return true;}
export function answerRegeneration(s,answer){
    if(s.phase!=="quiz")return false;const correct=REGENERATION_QUESTIONS[s.quizIndex].answer===answer;
    if(s.firstAnswers[s.quizIndex]===undefined)s.firstAnswers[s.quizIndex]=correct;
    if(!correct){s.mistakes++;return false;}s.quizIndex++;if(s.quizIndex===REGENERATION_QUESTIONS.length)s.phase="complete";return true;
}
export function regenerationScore(s){return Math.round(100*s.firstAnswers.filter(Boolean).length/REGENERATION_QUESTIONS.length);}
export function regenerationLedger(s){
    let carbons=0,phosphates=0;
    for(const pool of [s.bench,s.pending])for(const [k,n] of Object.entries(pool)){carbons+=SUGARS[k].c*n;phosphates+=SUGARS[k].p*n;}
    return {carbons,phosphorusIn:5+3*s.atp,phosphorusOut:phosphates+s.pi+2*s.adp,pi:s.pi,water:s.water,atp:s.atp,adp:s.adp,ruBP:s.storedRuBP,netG3P:1};
}
