import {activityElement as el} from './GuidedReactionView.js';
const NS='http://www.w3.org/2000/svg';
function svgNode(tag,attrs,text){const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;}
export function reductionMolecule(label,bpg,fixedCarbon=false){
    const m=el('div','guided-reaction-molecule guided-c2-functional-molecule');m.dataset.chemical=bpg?'BPG':'G3P';
    const svg=svgNode('svg',{viewBox:'0 0 345 132',role:'img','aria-label':bpg?'1,3-bisphosphoglycerate: carbon 1 has =O and O–P; carbon 2 has OH; carbon 3 keeps P.':'G3P: carbon 1 has =O and H; carbon 2 has OH; carbon 3 keeps P.'});
    const line=(x1,y1,x2,y2,cls='c2-chemical-bond')=>svgNode('line',{x1,y1,x2,y2,class:cls});
    svg.append(line(106,78,159,78),line(191,78,244,78),line(276,78,306,78));
    for(const [i,x]of [90,175,260].entries())svg.append(svgNode('circle',{cx:x,cy:78,r:16,class:`c2-carbon guided-reaction-carbon${fixedCarbon&&i===0?' is-fixed':''}`}),svgNode('text',{x,y:83,'text-anchor':'middle',class:'c2-carbon-label'},'C'),svgNode('text',{x,y:112,'text-anchor':'middle',class:'c2-carbon-number'},`C${i+1}`));
    svg.append(line(87,35,87,60,'c2-chemical-bond c2-carbonyl-bond'),line(93,35,93,60,'c2-chemical-bond c2-carbonyl-bond'),svgNode('text',{x:90,y:25,'text-anchor':'middle',class:'c2-oxygen'},'O'),line(175,35,175,60),svgNode('text',{x:175,y:25,'text-anchor':'middle',class:'c2-oxygen'},'O'),svgNode('text',{x:186,y:25,class:'c2-hydrogen'},'H'));
    const leaving=svgNode('g',{class:'c2-acyl-leaving'});leaving.style.opacity=bpg?'1':'0';
    leaving.append(line(74,78,62,78),svgNode('text',{x:50,y:84,'text-anchor':'middle',class:'c2-oxygen'},'O'),line(40,78,27,78),svgNode('rect',{x:1,y:64,width:26,height:26,rx:4,class:'c2-phosphate is-atp-phosphate guided-reaction-phosphate-group'}),svgNode('text',{x:14,y:83,'text-anchor':'middle',class:'c2-phosphate-label'},'P'));
    const h=svgNode('g',{class:'c2-aldehyde-h'});h.style.opacity=bpg?'0':'1';h.append(line(74,78,62,78),svgNode('text',{x:50,y:84,'text-anchor':'middle',class:'c2-hydrogen'},'H'));
    svg.append(leaving,h,svgNode('rect',{x:306,y:64,width:26,height:26,rx:4,class:'c2-phosphate guided-reaction-phosphate-group'}),svgNode('text',{x:319,y:83,'text-anchor':'middle',class:'c2-phosphate-label'},'P'));
    if(!bpg)leaving.remove();
    m.append(svg,el('strong','guided-reaction-molecule-label',label),el('small','c2-functional-summary',bpg?'C1: C(=O)–O–P':'C1: C(=O)–H'));return m;
}
export function photosynthesisCarrier(label){
    const item=el('div','guided-reduction-carrier guided-photosynthesis-carrier');item.setAttribute('aria-label',label);
    const svg=svgNode('svg',{viewBox:'0 0 150 110',role:'img','aria-label':`${label} carrier, using the photosynthesis icon`});
    svg.append(svgNode('path',{d:'M20 22 H58 Q75 54 92 22 H130 Q143 22 143 36 V88 Q143 102 130 102 H20 Q7 102 7 88 V36 Q7 22 20 22 Z',class:'c2-nadp-shape'}),svgNode('text',{x:75,y:77,'text-anchor':'middle',class:'c2-nadp-label'},label));item.append(svg);
    if(label==='NADPH'){
        const bundle=el('div','guided-hydride-bundle c2-bound-hydride');bundle.setAttribute('aria-label','Hydride: a hydrogen nucleus with two electrons transferred together');
        bundle.append(el('span','guided-hydride-electron','e⁻'),el('span','guided-hydride-h','H'),el('span','guided-hydride-electron','e⁻'));item.append(bundle);
        item.append(el('small','','H⁺ + 2e⁻ carried together as H⁻'));
    }
    return item;
}
export function reactionProton(){const p=el('span','guided-c2-proton','H⁺');p.setAttribute('aria-label','Hydrogen ion from solution');return p;}
export async function animateCarbonOneReduction(container,animator){
    const carrier=container.querySelector('.guided-reaction-dock[data-input="NADPH"] .guided-photosynthesis-carrier'),molecule=container.querySelector('.guided-reduction-bpg-target');
    const source=carrier?.querySelector('.guided-hydride-bundle'),protonSource=container.querySelector('.guided-reaction-dock[data-input="HPLUS"] .guided-c2-proton'),enzyme=container.querySelector('.guided-reaction-dock[data-input="GAPDH"]');
    const h=molecule?.querySelector('.c2-aldehyde-h'),leaving=molecule?.querySelector('.c2-acyl-leaving');
    if(!source||!protonSource||!h||!leaving||!enzyme)return false;
    const hydride=animator.token(source),proton=animator.token(protonSource);source.style.visibility=protonSource.style.visibility='hidden';
    const results=await Promise.all([animator.travel(hydride,h.querySelector(".c2-hydrogen"),1600),(async()=>{if(!await animator.travel(proton,enzyme,1000))return false;return animator.play(proton,[{opacity:1},{opacity:0}],400);})()]);
    if(!results.every(Boolean))return false;
    carrier.querySelector('.c2-nadp-label').textContent='NADP⁺';carrier.setAttribute('aria-label','NADP⁺');carrier.querySelector('svg').setAttribute('aria-label','NADP⁺ carrier');carrier.querySelector('small').textContent='Hydride transferred';
    const changed=await Promise.all([
        animator.play(hydride,[{opacity:1},{opacity:0}],700),
        animator.play(leaving,[{transform:'translate(0,0)',opacity:1},{transform:'translate(-25px,40px)',opacity:0}],1100),
        animator.play(h,[{opacity:0},{opacity:1}],1100)
    ]);
    if(!changed.every(Boolean))return false;
    molecule.querySelector('.guided-reaction-molecule-label').textContent='G3P';molecule.querySelector('.c2-functional-summary').textContent='C1: C(=O)–H · the =O remains';
    return animator.play(molecule,[{opacity:1},{opacity:1}],900);
}
