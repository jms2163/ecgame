import {CALVIN_OVERVIEW_NODES as NODES} from './CalvinOverviewModel.js';
import {GuidedTransferAnimation} from './GuidedTransferAnimation.js';
import {createRegenerationSession,REGENERATION_STEPS,dockRegenerationInput,runRegenerationReaction,storeRegenerationProducts,SUGARS} from './CalvinRegenerationModel.js';
import {activityElement as el,activityButton as button} from './GuidedReactionView.js';
const NS='http://www.w3.org/2000/svg';
function svg(tag,attrs={},text){const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;}
const DEMO_SUGARS={...SUGARS,'3-PGA':{c:3,p:1},'1,3-BPG':{c:3,p:2}};
const point=i=>{const a=(-140+i*360/NODES.length)*Math.PI/180;return{x:260+205*Math.cos(a),y:280+205*Math.sin(a)};};
const View={
    host:null,snapshot:null,running:false,repeat:true,batches:0,animator:null,stationToken:null,reactants:[],reserved:[],version:0,demoComplete:false,onExplore:null,onModeChange:null,
    mount(host){
        if(this.host===host&&this.board)return;this.stop();this.host=host;host.className='calvin-persistent-overview';
        const heading=el('div','');heading.append(el('p','metabolism-panel-kicker','Calvin Cycle · Overview'),el('h3','','Follow the cycle'));
        const board=el('div','calvin-overview-board'),drawing=svg('svg',{viewBox:'0 0 560 570',role:'group','aria-label':'Calvin cycle: fixation, reduction, and regeneration. Thirteen reaction dots use eleven unique enzymes.'});this.board=drawing;
        const defs=svg('defs'),marker=svg('marker',{id:'calvin-overview-arrow',viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:6,markerHeight:6,orient:'auto-start-reverse'});marker.append(svg('path',{d:'M0 0L10 5L0 10Z',fill:'#82c8a1'}));defs.append(marker);drawing.append(defs);
        drawing.append(svg('circle',{cx:260,cy:280,r:205,class:'calvin-overview-ring'}));
        for(let i=0;i<NODES.length;i++){const a=point(i),b=point((i+1)%NODES.length);drawing.append(svg('path',{d:`M${a.x} ${a.y} A205 205 0 0 1 ${b.x} ${b.y}`,class:`calvin-overview-arc${i===12?' is-return-link':''}`,'marker-end':'url(#calvin-overview-arrow)'}));}
        drawing.append(svg('text',{x:115,y:98,'text-anchor':'middle',class:'calvin-phase-name'},'FIXATION'),svg('text',{x:290,y:37,'text-anchor':'middle',class:'calvin-phase-name'},'REDUCTION'),svg('text',{x:260,y:552,'text-anchor':'middle',class:'calvin-phase-name'},'REGENERATION'));
        const net=svg('g',{class:'calvin-net-bin'});net.append(svg('rect',{x:431,y:17,width:116,height:71,rx:10}),svg('text',{x:489,y:39,'text-anchor':'middle'},'PRODUCT BIN'),svg('text',{x:489,y:65,'text-anchor':'middle',class:'calvin-net-count'},'1 net G3P'));drawing.append(net);this.netBin=net;
        const from=point(2);this.netArrow=svg('path',{d:`M${from.x+12} ${from.y-6} Q420 80 449 84`,class:'calvin-overview-branch','marker-end':'url(#calvin-overview-arrow)'});drawing.append(this.netArrow);
        const light=svg('g',{class:'calvin-light-bin'});light.append(svg('rect',{x:9,y:12,width:145,height:61,rx:8}),svg('text',{x:81,y:35,'text-anchor':'middle'},'LIGHT REACTIONS'),svg('text',{x:81,y:56,'text-anchor':'middle'},'ATP / NADPH ↔'));drawing.append(light);
        this.dots=[];
        for(const node of NODES){const p=point(node.index),g=svg('g',{class:'calvin-overview-dot','data-node':node.index,role:'button',tabindex:0,'aria-label':`${node.label} · ${node.phase} practice`});
            g.append(svg('circle',{cx:p.x,cy:p.y,r:20}),svg('text',{x:p.x,y:p.y+6,'text-anchor':'middle',class:'calvin-dot-number'},node.index+1),svg('text',{x:p.x,y:p.y+39,'text-anchor':'middle',class:'calvin-dot-abbr'},node.abbreviation),svg('text',{x:p.x+18,y:p.y-17,class:'calvin-dot-p'},'P'));
            const activate=()=>{if(this.running)return;const entry=[0,1,3].includes(node.index);if(node.index===this.snapshot?.index||(!this.snapshot?.phase&&entry))this.onExplore?.(node.phase,node.index);};
            g.addEventListener('click',activate);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});drawing.append(g);this.dots.push(g);
        }
        this.scene=svg('g',{class:'calvin-overview-scene','aria-hidden':'true'});drawing.append(this.scene);
        this.autoButton=button('Automate',()=>this.running?this.stop():this.start());this.autoButton.classList.add('calvin-overview-automate');
        const center=el('div','calvin-overview-center');this.mastery=el('small','');center.append(this.autoButton,this.mastery);board.append(drawing,center);
        this.current=el('strong','calvin-overview-current');this.caption=el('p','calvin-overview-caption');this.caption.setAttribute('role','status');
        const summary=el('div','calvin-overview-budget');summary.append(el('span','','3 CO₂ enter'),el('span','','9 ATP + 6 NADPH used'),el('span','','1 net G3P leaves · 3 RuBP recycled'));
        const controls=el('div','calvin-overview-controls');for(const[phase,label]of[['fixation','Explore fixation'],['reduction','Explore reduction'],['regeneration','Explore regeneration']])controls.append(button(label,()=>{if(this.running)this.stop();this.onExplore?.(phase);}));
        const loop=el('label','calvin-overview-loop'),check=el('input','');check.type='checkbox';check.checked=this.repeat;check.addEventListener('change',()=>this.repeat=check.checked);loop.append(check,document.createTextNode(' Repeat automatic batches'));
        host.replaceChildren(heading,board,this.current,this.caption,summary,controls,loop,el('p','calvin-overview-note','Three-CO₂ batch overview. Moving sugars represent molecule groups. Regeneration branches and reuses reserved sugars; the circle follows representative transformations.'));
    },
    update(snapshot){this.snapshot=snapshot;if(!this.board)return;
        this.mastery.textContent=`${snapshot.mastered.length}/${snapshot.totalEnzymes} enzymes practiced`;
        this.autoButton.disabled=!snapshot.canAutomate&&!this.running;this.autoButton.title=snapshot.canAutomate?'Animate the complete three-CO₂ batch':'Earn green P on all eleven Calvin enzymes to automate';
        if(!this.running&&(!this.demoComplete||snapshot.phase)){this.demoComplete=false;this.present(snapshot.index,snapshot.caption,snapshot.showNet,snapshot.showReturn);this.netBin.querySelector('.calvin-net-count').textContent='1 net G3P';}
        for(const [i,g]of this.dots.entries()){g.classList.toggle('is-practiced',snapshot.mastered.includes(NODES[i].enzymeId));const enabled=!this.running&&(i===snapshot.index||(!snapshot.phase&&[0,1,3].includes(i)));g.setAttribute('aria-disabled',String(!enabled));g.setAttribute('tabindex',enabled?'0':'-1');}
    },
    present(index,caption,showNet=false,showReturn=false){
        for(const[i,g]of this.dots.entries())g.classList.toggle('is-current',i===index);
        const node=NODES[index];this.current.textContent=`${node.label} · ${node.phase==='fixation'?'Fixation':node.phase==='reduction'?'Reduction':'Regeneration'}`;
        this.caption.textContent=caption;this.netArrow.classList.toggle('is-active',showNet);this.netBin.classList.toggle('is-active',showNet);this.board.classList.toggle('is-returning',showReturn);
    },
    clearStation(){this.stationToken?.remove();this.stationToken=null;for(const t of this.reactants)t.remove();this.reactants=[];},
    clearReserved(index=null){this.reserved=this.reserved.filter(item=>{if(index===null||item.index===index){item.token.remove();return false;}return true;});},
    async reserve(kind,count,from,to){const t=this.token(kind,count),a=point(from),b=point(to),held=this.reserved.filter(item=>item.index===to).length;this.reserved.push({token:t,index:to});return this.move(t,{x:a.x-25,y:a.y-25},{x:b.x-25,y:b.y-55-held*30},1000);},
    setStation(kind,count,index){this.clearStation();const t=this.token(kind,count);const p=point(index);t.style.transform=`translate(${p.x-25}px,${p.y-25}px)`;this.stationToken=t;},
    stop(){this.clearReserved();this.clearStation();this.demoComplete=false;this.version++;this.running=false;this.animator?.cancel();this.animator=null;this.scene?.replaceChildren();if(this.autoButton)this.autoButton.textContent='Automate';this.onModeChange?.(false);if(this.snapshot)this.update(this.snapshot);},
    start(){if(this.running||!this.snapshot?.canAutomate)return false;this.demoComplete=false;this.running=true;this.batches=0;this.netBin.querySelector('.calvin-net-count').textContent='0 net G3P';this.autoButton.textContent='Stop animation';this.onModeChange?.(true);const version=++this.version;this.run(version);return true;},
    token(kind,count=1){
        const g=svg('g',{class:`calvin-demo-token calvin-demo-${kind}`});
        if(DEMO_SUGARS[kind]){const c=DEMO_SUGARS[kind].c,p=DEMO_SUGARS[kind].p;for(let i=0;i<c;i++){if(i)g.append(svg('line',{x1:(i-1)*15,y1:0,x2:i*15,y2:0,class:'calvin-token-bond'}));g.append(svg('circle',{cx:i*15,cy:0,r:7,class:'calvin-token-carbon'}),svg('text',{x:i*15,y:3,'text-anchor':'middle',class:'calvin-token-label'},'C'));}if(p===2)g.append(svg('text',{x:-15,y:4,class:'calvin-token-p'},'P'));if(p)g.append(svg('text',{x:c*15,y:4,class:'calvin-token-p'},'P'));g.append(svg('text',{x:0,y:23,class:'calvin-demo-label'},`${count>1?count+' × ':''}${kind}`));}
        else if(kind==='CO2'){for(const[i,label]of['O','C','O'].entries())g.append(svg('circle',{cx:i*18,cy:0,r:8,class:label==='O'?'calvin-token-oxygen':'calvin-token-carbon'}),svg('text',{x:i*18,y:4,'text-anchor':'middle',class:'calvin-token-label'},label));g.append(svg('text',{x:0,y:24,class:'calvin-demo-label'},'3 CO₂'));}
        else if(kind==='ATP'||kind==='ADP'){g.append(svg('rect',{x:-5,y:-16,width:80,height:42,rx:8,class:'calvin-energy-card'}),svg('text',{x:5,y:-2,class:'calvin-demo-label'},`${count} ${kind}`));for(let i=0;i<(kind==='ATP'?3:2);i++)g.append(svg('circle',{cx:8+i*20,cy:15,r:6,class:i===2?'calvin-terminal-p':'calvin-token-phosphate'}),svg('text',{x:8+i*20,y:18,'text-anchor':'middle',class:'calvin-token-label'},'P'));}
        else if(kind==='NADPH'||kind==='NADP⁺'){g.append(svg('path',{d:'M0 -18H26Q36 0 46 -18H85V26H0Z',class:'calvin-nadp-card'}),svg('text',{x:8,y:16,class:'calvin-demo-label'},`${count} ${kind}`));if(kind==='NADPH')g.append(svg('circle',{cx:36,cy:-15,r:8,fill:'white'}),svg('text',{x:36,y:-12,'text-anchor':'middle',class:'calvin-token-label'},'H'));}
        else g.append(svg('text',{x:0,y:8,class:'calvin-demo-label'},`${count>1?count+' ':''}${kind}`));
        this.scene.append(g);this.animator.tokens.push(g);return g;
    },
    async move(token,from,to,duration=1000){return this.animator.play(token,[{transform:`translate(${from.x}px,${from.y}px)`},{transform:`translate(${to.x}px,${to.y}px)`}],duration);},
    async dwell(node=0,duration=900){return this.animator.play(this.dots[node],[{opacity:1},{opacity:.55},{opacity:1}],duration);},
    async arrive(kind,count,index){const t=this.token(kind,count);t.dataset.kind=kind;this.reactants.push(t);const p=point(index);return this.move(t,{x:35,y:90},{x:p.x-45,y:Math.max(30,p.y+(kind==='H₂O'||kind==='H⁺'?45:kind==='CO2'?10:-65))},1000);},
    async depart(kind,count,index){const consumed={ADP:'ATP','NADP⁺':'NADPH'}[kind];for(const input of this.reactants)if(input.dataset.kind===consumed)input.remove();const t=this.token(kind,count);const ok=await this.move(t,point(index),{x:35,y:60},900);t.remove();return ok;},
    async sugar(kind,count,from,to){this.clearStation();const t=this.token(kind,count);this.stationToken=t;const a=point(from),b=point(to);return this.animator.play(t,[{transform:`translate(${a.x-25}px,${a.y-25}px)`},{transform:`translate(${(a.x+b.x)/2-25}px,${(a.y+b.y)/2-37}px)`,offset:.5},{transform:`translate(${b.x-25}px,${b.y-25}px)`}],1200);},
    async run(version){
        try{do{
            if(!this.running||version!==this.version)break;this.animator=new GuidedTransferAnimation();this.scene.replaceChildren();this.present(0,'Three RuBP accept three CO₂. RuBisCO fixes carbon and cleaves the hydrated intermediate into six 3-PGA.');
            if(!await this.sugar('RuBP',3,12,0)||!await this.arrive('CO2',3,0)||!await this.arrive('H₂O',3,0)||!await this.dwell(0))break;
            this.present(1,'Reduction: PGK uses 6 ATP for the six 3-PGA.');if(!await this.sugar('3-PGA',6,0,1))break;
            if(!await this.arrive('ATP',6,1)||!await this.dwell(1))break;this.setStation('1,3-BPG',6,1);if(!await this.depart('ADP',6,1))break;
            this.present(2,'GAPDH uses 6 NADPH (+ 6 H⁺) to form 6 G3P.');if(!await this.sugar('1,3-BPG',6,1,2))break;
            if(!await this.arrive('NADPH',6,2)||!await this.arrive('H⁺',6,2)||!await this.dwell(2))break;this.setStation('G3P',6,2);if(!await this.depart('NADP⁺',6,2)||!await this.depart('Pᵢ',6,2))break;
            const net=this.token('G3P',1);this.present(2,'One net G3P leaves; the remaining five stay for regeneration.',true);if(!await this.move(net,point(2),{x:455,y:89},1300))break;net.remove();
            this.netBin.querySelector('.calvin-net-count').textContent=`${this.batches+1} net G3P`;
            if(!await this.sugar('G3P',5,2,3))break;
            const batch=createRegenerationSession();
            for(let step=0;step<REGENERATION_STEPS.length;step++){
                if(step>=10)continue;const spec=REGENERATION_STEPS[step],index=step+3;
                this.clearStation();this.clearReserved(index);this.present(index,spec.atp?'PRK uses 3 ATP to turn 3 Ru5P into 3 RuBP. Three ADP return to the light reactions.':spec.note,true);if(spec.inputs.H2O&&!await this.arrive('H₂O',1,index))break;
                const inputs=Object.entries(spec.inputs).filter(([k])=>SUGARS[k]);const pieces=inputs.map(([k,n])=>this.token(k,spec.atp?3:n));
                for(let i=0;i<pieces.length;i++){pieces[i].style.transform=`translate(${point(index).x-45+i*65}px,${point(index).y-40}px)`;}
                if(spec.atp){if(!await this.arrive('ATP',3,index))break;}
                if(!await this.dwell(index,1200))break;for(const p of pieces)p.remove();
                for(let run=0;run<(spec.atp?3:1);run++){
                    for(const[k,n]of Object.entries(spec.inputs))for(let i=0;i<n;i++)dockRegenerationInput(batch,k);dockRegenerationInput(batch,'enzyme');runRegenerationReaction(batch);storeRegenerationProducts(batch);
                }
                for(const input of this.reactants)input.remove();this.reactants=[];
                if(spec.atp&&!await this.depart('ADP',3,index))break;
                if(spec.pi&&!await this.depart('Pᵢ',spec.pi,index))break;
                // Show every product before following a representative sugar.
                // Other regeneration products stay in the transient bench for later use.
                const products=Object.entries(spec.outputs).map(([k,n],i)=>{const t=this.token(k,spec.atp?3:n);t.style.transform=`translate(${point(index).x-35+i*75}px,${point(index).y-38}px)`;return t;});
                if(!await this.dwell(index,700))break;for(const t of products)t.remove();
                const outputs=Object.entries(spec.outputs);
                // These branches keep a sugar from appearing to pass through an enzyme
                // that does not act on it: DHAP waits for aldolase, Xu5P for RPE,
                // and the first Ru5P waits at PRK while RPE forms the other two.
                if(step===0&&!await this.reserve('DHAP',1,index,7))break;
                if(outputs.length>1&&!await this.reserve(outputs[1][0],outputs[1][1],index,11))break;
                if(step===7){if(!await this.reserve('Ru5P',1,index,12))break;continue;}
                const out=outputs[0];if(!await this.sugar(out[0],spec.atp?3:step===0?1:out[1],index,index===12?0:index+1))break;
            }
            if(!this.running||version!==this.version||batch.storedRuBP!==3)break;
            this.batches++;this.demoComplete=true;this.present(0,`Batch ${this.batches} complete: 3 CO₂, 9 ATP, and 6 NADPH used; 1 net G3P produced and 3 RuBP recycled.`,true,true);if(!await this.dwell(0,1800))break;
            this.animator.dispose();this.animator=null;
        }while(this.repeat&&this.running&&version===this.version);}finally{
            if(version===this.version){this.clearReserved();this.clearStation();this.animator?.dispose();this.running=false;this.animator=null;this.scene.replaceChildren();this.autoButton.textContent='Automate';this.autoButton.disabled=!this.snapshot?.canAutomate;this.onModeChange?.(false);}
        }
    }
};
export default View;
