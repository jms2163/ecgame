import Catalog from '../data/MetabolismPathwayCatalog.js';
const slots=Catalog.get('calvinCycle').coreSlots;
export const CALVIN_OVERVIEW_ENZYMES=slots.map(s=>s.enzymeId);
// Reused enzymes occupy a second reaction dot, while mastery counts unique proteins.
export const CALVIN_OVERVIEW_NODES=[1,2,3,4,5,6,7,5,8,7,9,10,11].map((slot,index)=>({...slots[slot-1],index,phase:index===0?'fixation':index<3?'reduction':'regeneration'}));
export function calvinOverviewSnapshot({fixation=null,reduction=null,regeneration=null,hasPractice=()=>false}={}){
    let phase=null,index=0,caption='Click the flashing RuBisCO dot to explore carbon fixation.';
    if(fixation){phase='fixation';caption=`Fixation · ${fixation.reactions}/3 CO₂ fixed. RuBisCO turns RuBP + CO₂ into two 3-PGA.`;}
    else if(reduction){phase='reduction';index=['phosphorylation','phosphorylated'].includes(reduction.phase)?1:2;caption=index===1?'Reduction · PGK uses ATP to phosphorylate 3-PGA.':'Reduction · GAPDH uses NADPH to make G3P. One net G3P can leave the complete batch.';}
    else if(regeneration){phase='regeneration';index=[3,4,5,6,7,8,9,10,11,12,12,12][regeneration.step]??12;caption=regeneration.phase==='return'||regeneration.phase==='quiz'||regeneration.phase==='complete'?'Three RuBP return to fixation. The CO₂ acceptor has been regenerated.':'Regeneration · reuse the reserved G3P to rebuild RuBP.';}
    const mastered=CALVIN_OVERVIEW_ENZYMES.filter(hasPractice);
    return {phase,index,caption,mastered,canAutomate:mastered.length===CALVIN_OVERVIEW_ENZYMES.length,totalEnzymes:CALVIN_OVERVIEW_ENZYMES.length,showNet:!!reduction&&(reduction.stored===6||['allocation','quiz','complete'].includes(reduction.phase)),showReturn:!!regeneration&&['return','quiz','complete'].includes(regeneration.phase)};
}
