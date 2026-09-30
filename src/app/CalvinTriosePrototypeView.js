// Functional-group prototype for C3's G3P → DHAP reaction only.
// Before/after groups are shown; proton transfers and intermediates are omitted.
import {activityElement as el} from './GuidedReactionView.js';
const NS='http://www.w3.org/2000/svg';
function svgElement(tag,attributes,text){const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attributes))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;}
export function triosePrototype(key){
    const carbonyl=key==='G3P'?1:2,m=el('div','guided-reaction-molecule guided-triose-prototype');m.dataset.molecule=key;
    const svg=svgElement('svg',{viewBox:'0 0 280 118',role:'img','aria-label':`${key}: carbon ${carbonyl} has a double-bonded oxygen; carbon ${carbonyl===1?2:1} has OH; phosphate remains at carbon 3.`});
    for(const [x1,x2] of [[61,109],[141,189],[221,246]])svg.append(svgElement('line',{x1,x2,y1:74,y2:74,class:'triose-backbone-bond'}));
    for(const [i,x] of [45,125,205].entries()){
        svg.append(svgElement('circle',{cx:x,cy:74,r:16,class:'triose-carbon'}),svgElement('text',{x,y:79,'text-anchor':'middle',class:'triose-carbon-label'},'C'),svgElement('text',{x,y:108,'text-anchor':'middle',class:'triose-position-label'},`C${i+1}`));
        if(i<2){
            const double=i+1===carbonyl,g=svgElement('g',{'data-carbon':i+1,class:'triose-function-group'});
            const main=svgElement('line',{x1:x-3,x2:x-3,y1:34,y2:57,class:'triose-group-bond triose-main-bond'});main.style.transform=`translateX(${double?0:3}px)`;
            const extra=svgElement('line',{x1:x+3,x2:x+3,y1:34,y2:57,class:'triose-group-bond triose-extra-bond'});extra.style.opacity=double?'1':'0';
            const oxygen=svgElement('text',{x,y:25,'text-anchor':'middle',class:'triose-oxygen-label'},'O');
            const h=svgElement('text',{x:x+11,y:25,class:'triose-hydrogen-label'},'H');h.style.opacity=double?'0':'1';
            g.append(main,extra,oxygen,h);svg.append(g);
        }
    }
    svg.append(svgElement('rect',{x:247,y:60,width:27,height:27,rx:5,class:'triose-phosphate'}),svgElement('text',{x:260.5,y:79,'text-anchor':'middle',class:'triose-phosphate-label'},'P'));
    m.append(svg,el('strong','guided-reaction-molecule-label',key),el('small','triose-group-summary',key==='G3P'?'C1: =O · C2: –OH':'C1: –OH · C2: =O'));
    return m;
}
export async function morphTrioseGroups(container,animator){
    const molecules=[...container.querySelectorAll('.guided-reaction-dock[data-input="G3P"] .guided-triose-prototype')];
    if(molecules.length!==2)return false;
    const jobs=[];
    for(const m of molecules){
        m.querySelector('.guided-reaction-molecule-label').textContent='G3P → DHAP';
        m.querySelector('.triose-group-summary').textContent='Changing functional groups';
        for(const g of m.querySelectorAll('.triose-function-group')){
            const becomesDouble=g.dataset.carbon==='2';
            jobs.push(animator.play(g.querySelector('.triose-main-bond'),[{transform:`translateX(${becomesDouble?3:0}px)`},{transform:`translateX(${becomesDouble?0:3}px)`}],2200));
            jobs.push(animator.play(g.querySelector('.triose-extra-bond'),[{opacity:becomesDouble?0:1},{opacity:becomesDouble?1:0}],2200));
            jobs.push(animator.play(g.querySelector('.triose-hydrogen-label'),[{opacity:becomesDouble?1:0},{opacity:becomesDouble?0:1}],2200));
        }
    }
    if(!(await Promise.all(jobs)).every(Boolean))return false;
    for(const m of molecules){m.dataset.molecule='DHAP';m.querySelector('.guided-reaction-molecule-label').textContent='DHAP';m.querySelector('.triose-group-summary').textContent='C1: –OH · C2: =O';m.querySelector('svg').setAttribute('aria-label','DHAP: carbon 1 has OH; carbon 2 has a double-bonded oxygen; phosphate remains at carbon 3.');}
    return animator.play(molecules[0],[{opacity:1},{opacity:1}],1000);
}
