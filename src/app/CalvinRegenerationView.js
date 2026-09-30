import Manager from "./CalvinRegenerationManager.js";
import {triosePrototype,morphTrioseGroups} from "./CalvinTriosePrototypeView.js";
import Visuals from "../data/PolymerizerVisualCatalog.js";
import {REGENERATION_ENZYMES,REGENERATION_QUESTIONS,SUGARS,regenerationStep,dockRegenerationInput,regenerationReady,runRegenerationReaction,storeRegenerationProducts,repeatRemainingPRK,returnRegeneratedRuBP,answerRegeneration,regenerationScore,regenerationLedger} from "./CalvinRegenerationModel.js";
import {GuidedTransferAnimation} from "./GuidedTransferAnimation.js";
import {activityElement as el,activityButton as button,carbonMolecule,reactionDock,draggableInput} from "./GuidedReactionView.js";

const CalvinRegenerationView = {
    container:null,message:"",busy:false,animator:null,version:0,onSessionChange:null,onProgress:null,onContinue:null,
    close(){this.version++;this.animator?.cancel();this.animator=null;this.busy=false;Manager.reset();this.message="";this.onSessionChange?.();},
    start(practice=false){this.close();if(!Manager.start(practice))return false;this.render(this.container);this.onSessionChange?.();return true;},
    molecule(key){
        if(Manager.session?.step===0&&["G3P","DHAP"].includes(key))return triosePrototype(key);
        const sugar=SUGARS[key],m=carbonMolecule(key,sugar.c,{phosphates:sugar.p});
        m.title=sugar.name;
        if(key==="FBP"||key==="SBP"){
            const carbons=[...m.querySelectorAll(".guided-reaction-carbon")];
            for(const [i,c] of carbons.entries())c.classList.add(i<3?"is-dhap-fragment":"is-aldose-fragment");
            const bond=el("span","guided-aldolase-new-bond");bond.title="New carbon–carbon bond made by aldolase";bond.setAttribute("aria-label",bond.title);carbons[3].before(bond);
        }
        if(key==="RuBP")m.querySelector(".guided-reaction-phosphate-group").classList.add("is-atp-phosphate");
        for(const [i,dot] of [...m.querySelectorAll(".guided-reaction-carbon")].entries())dot.title=`Carbon ${i+1} · schematic backbone`;
        return m;
    },
    carrier(key){
        const item=el("div","guided-reduction-carrier");item.append(el("strong","",key==="H2O"?"H₂O":key));
        if(key==="ATP"||key==="ADP"){
            const row=el("div","guided-reduction-phosphate-chain");
            for(let i=0;i<(key==="ATP"?3:2);i++)row.append(el("span",`guided-reaction-phosphate-group${i===2?" is-atp-phosphate":""}`,"P"));item.append(row);
        }else if(key==="H2O")item.append(el("span","guided-reaction-water","H–OH"));
        return item;
    },
    enzyme(step){
        const image=el("img","guided-reaction-enzyme-image"),visual=Visuals.get(REGENERATION_ENZYMES[step.enzyme]);
        image.src=visual?.finalImageUrl??"";image.alt=`${step.abbr} structural representative`;image.onerror=()=>{image.hidden=true;};return image;
    },
    render(container){
        if(!container)return;this.container=container;
        if(Manager.session&&!Manager.getStatus().available)this.close();
        this.onProgress?.();
        if(this.busy&&Manager.session)return;
        const s=Manager.session,status=Manager.getStatus(),heading=el("div","guided-reaction-heading"),title=el("div","");
        title.append(el("p","metabolism-panel-kicker","Calvin Cycle · Guided Activity 3"),el("h3","","Regeneration: five G3P to three RuBP"));heading.append(title,
            el("strong","guided-reaction-status",Manager.practice?"Practice · earn P with 100% correct answers":status.completed?"Completed · replay available":"Recycle the CO₂ acceptor"));
        const exit=()=>{this.close();this.render(container);};
        if(s)heading.append(button(Manager.practice?"Exit practice":"Return to reconstruction",exit));container.replaceChildren(heading);
        if(!s){container.append(el("p","guided-reaction-intro","C2 made six G3P. One is net output; the other five supply 15 carbons to regenerate three five-carbon RuBP. Follow the actual enzyme reactions, keeping the net G3P separate. Identical TPI/RPE reactions are grouped; after one PRK round you may repeat the remaining two together."),
            button(status.completed?"Re-examine regeneration":"Start regeneration",()=>this.start(),!status.available),button("Practice regeneration",()=>this.start(true)),
            el("p","guided-reaction-note","Practice is always available. Guided regeneration requires saved C2 completion and the enzymes activated in Calvin slots 4–11."));return;}
        const l=regenerationLedger(s),ledger=el("div","guided-reaction-ledger");
        for(const [label,value] of [["Regeneration sugar carbons",`${l.carbons}/15`],["ATP used · ADP formed",`${l.atp}/3`],["RuBP collected",`${l.ruBP}/3`],["Net G3P kept separate","1 · 3 carbons"]]){const cell=el("div","");cell.append(el("span","",label),el("strong","",value));ledger.append(cell);}container.append(ledger);
        if(s.phase==="quiz")this.renderQuiz(container,s);
        else if(s.phase==="complete")this.renderComplete(container,s,status);
        else if(s.phase==="return")this.renderReturn(container,s);
        else this.renderReaction(container,s);
        const feedback=el("p","guided-reaction-feedback",this.message);feedback.setAttribute("role","status");container.append(feedback,button(Manager.practice?"Exit practice":"Return to reconstruction",exit));
    },
    renderReaction(container,s){
        const step=regenerationStep(s),workspace=el("div","guided-reaction-workspace guided-regeneration-workspace"),tray=el("section","guided-reaction-tray"),chamber=el("section","guided-reaction-chamber"),waiting=el("section","guided-reaction-output-tray");
        tray.append(el("h4","","Input tray"),el("p","","Drag or click each input. For a grouped reaction, add each molecule to its dock."));
        const dock=input=>{if(!this.busy&&dockRegenerationInput(s,input)){this.message="";this.render(container);}};
        const enzyme=button("",()=>dock("enzyme"),s.phase!=="reaction"||!!s.docked.enzyme);enzyme.setAttribute("aria-label",`Add ${step.abbr}`);enzyme.append(this.enzyme(step),el("span","",step.abbr));tray.append(draggableInput(enzyme,"enzyme"));
        for(const [key,n] of Object.entries(step.inputs)){
            const b=button("",()=>dock(key),s.phase!=="reaction"||(s.docked[key]??0)>=n);b.dataset.input=key;b.setAttribute("aria-label",`Add ${key}`);
            b.append(SUGARS[key]?this.molecule(key):this.carrier(key),el("span","",`${key==="H2O"?"Water":key} · ${(s.docked[key]??0)}/${n} docked`));tray.append(draggableInput(b,key));
        }
        const part=s.step<7?"1. Join and transfer carbon fragments":s.step<9?"2. Form ribulose-5-phosphate":"3. Add ATP phosphate";
        chamber.append(el("p","metabolism-panel-kicker",part),el("h4","",`${s.step+1}/12 · ${step.title}`),el("p","",step.note));
        const ed=reactionDock(`${step.abbr} · reusable enzyme`,"enzyme",!!s.docked.enzyme,dock);if(s.docked.enzyme)ed.append(this.enzyme(step));chamber.append(ed);
        const inputs=el("div","guided-reaction-input-docks guided-regeneration-inputs");
        for(const [key,n] of Object.entries(step.inputs)){
            const target=reactionDock(`${key==="H2O"?"Water":key} · ${s.docked[key]??0}/${n}`,key,s.docked[key]===n,dock);
            if(key==="Ru5P")target.classList.add("guided-regeneration-acceptor");
            for(let i=0;i<(s.docked[key]??0);i++)target.append(SUGARS[key]?this.molecule(key):this.carrier(key));inputs.append(target);
        }
        if(step.enzyme===0)inputs.classList.add("guided-triose-inputs");
        chamber.append(inputs);
        if(step.enzyme===0)chamber.append(el("p","guided-triose-note","Watch C1: =O → –OH and C2: –OH → =O. The oxygens stay at their carbons; the bonds and H labels change together. The three-carbon backbone and P stay unchanged. This view shows only the initial and final groups."));
        if(s.phase==="reaction"){
            chamber.append(button(step.enzyme===1?"Join carbon chains":step.atp?"Transfer ATP phosphate":step.transfer?"Transfer two-carbon fragment":step.pi?"Hydrolyze phosphate":"Run enzyme reaction",()=>this.runAnimated(s),!regenerationReady(s)));
            if(s.step>=10&&!Object.keys(s.docked).length)chamber.append(button("Repeat this whole process",()=>{if(repeatRemainingPRK(s)){this.message="The remaining PRK rounds used fresh ATP. Three RuBP and three ADP are now collected.";this.render(container);}}),el("p","guided-reaction-note",`${12-s.step} identical PRK rounds remain. You can repeat them together or explore each manually.`));
        }else{
            const products=el("section","guided-fixation-local-products");products.append(el("h4","","Products ready to collect"));const row=el("div","guided-reaction-products guided-regeneration-products");
            if(step.enzyme===0)row.classList.add("guided-triose-products");
            for(const [key,n] of Object.entries(s.pending))for(let i=0;i<n;i++)row.append(this.molecule(key));
            if(step.pi)row.append(this.carrier("Pᵢ"));if(step.atp)row.append(this.carrier("ADP"));
            if(step.enzyme===1)products.append(el("strong","",`${SUGARS[Object.keys(step.outputs)[0]].name} · ${SUGARS[Object.keys(step.outputs)[0]].c} carbons`),el("p","guided-aldolase-explanation",`3 + ${SUGARS[Object.keys(step.inputs)[1]].c} = ${SUGARS[Object.keys(step.outputs)[0]].c} carbons. Blue carbons came from DHAP; green carbons came from the other sugar. The gold line marks the new C–C bond. Both phosphates stay attached. No NADPH is used or regenerated.`));
            products.append(row,button("Store regeneration products",()=>{if(storeRegenerationProducts(s)){this.message="Products moved to the regeneration bench. Collection is bookkeeping, not another reaction.";this.render(container);}}));chamber.append(products);
        }
        const equation=Object.entries(step.inputs).map(([k,n])=>`${n>1?n+" ":""}${k==="H2O"?"H₂O":k}`).join(" + ")+" → "+Object.entries(step.outputs).map(([k,n])=>`${n>1?n+" ":""}${k}`).join(" + ")+(step.pi?" + Pᵢ":"")+(step.atp?" + ADP":"");
        chamber.append(el("p","guided-reaction-note",equation),el("p","guided-reaction-note","Carbon circles show backbone size, not complete structures. Isomers differ in chemical groups or their orientation even when these circles look alike. Phosphate attaches through oxygen. Proton balancing, cofactors, and enzyme-bound intermediates are omitted."));
        waiting.append(el("h4","","Regeneration bench"),el("p","","Sugars waiting for later reactions or already collected as RuBP. Docked inputs are shown in the chamber."));
        for(const [key,n] of Object.entries(s.bench))for(let i=0;i<n-(s.phase==="reaction"?(s.docked[key]??0):0);i++)waiting.append(this.molecule(key));
        waiting.append(el("p","",`${s.pi} Pᵢ released · ${s.water} H₂O used · ${s.adp} ADP formed`));
        const net=el("div","guided-regeneration-net");net.append(el("h4","","Net output · kept separate"),this.molecule("G3P"),el("p","","This G3P is not used in regeneration."));waiting.append(net);workspace.append(tray,chamber,waiting);container.append(workspace);
    },
    async runAnimated(s){
        if(this.busy||Manager.session!==s||!regenerationReady(s))return;
        this.busy=true;const version=++this.version,animator=new GuidedTransferAnimation();this.animator=animator;const step=regenerationStep(s),container=this.container;
        for(const b of container.querySelectorAll("button"))if(!["Exit practice","Return to reconstruction"].includes(b.textContent))b.disabled=true;
        for(const n of container.querySelectorAll('[draggable="true"]'))n.draggable=false;
        try{
            let finished;
            if(step.enzyme===0)finished=await morphTrioseGroups(container,animator);
            else if(step.enzyme===1)finished=await this.joinSugars(container,step,animator);
            else if(step.atp)finished=await animator.phosphorylate(container,{targetSelector:".guided-regeneration-acceptor .guided-reaction-carbon",productLabel:"RuBP"});
            else if(step.transfer){
                const donor=container.querySelector(`.guided-reaction-dock[data-input="${step.transfer[0]}"] .guided-reaction-carbon-chain`),acceptor=container.querySelector(`.guided-reaction-dock[data-input="${step.transfer[1]}"] .guided-reaction-carbon`);
                const fragment=el("div","guided-regeneration-fragment");for(const c of [...donor.querySelectorAll(".guided-reaction-carbon")].slice(0,2)){fragment.append(c.cloneNode(true));c.style.visibility="hidden";}
                const bounds=donor.getBoundingClientRect();Object.assign(fragment.style,{position:"fixed",left:`${bounds.left}px`,top:`${bounds.top}px`,zIndex:"1100"});document.body.append(fragment);animator.tokens.push(fragment);
                finished=await animator.travel(fragment,acceptor,1400);
            }else if(step.pi){
                const sugar=Object.keys(step.inputs).find(k=>SUGARS[k]);
                const phosphate=container.querySelector(`.guided-reaction-dock[data-input="${sugar}"] .guided-reaction-phosphate-group`);
                const waterSource=container.querySelector('.guided-reaction-dock[data-input="H2O"] .guided-reaction-water');
                const water=animator.token(waterSource);waterSource.style.visibility="hidden";
                finished=await animator.travel(water,phosphate,1100);
                if(finished){
                    water.remove();const pi=animator.token(phosphate);phosphate.style.visibility="hidden";
                    finished=await animator.play(pi,[{transform:"translate(0,0)",opacity:1},{transform:"translate(0,45px)",opacity:0}],650);
                }
            }else{
                const area=container.querySelector(".guided-regeneration-inputs");finished=await animator.play(area,[{opacity:1},{opacity:.35},{opacity:1}],900);
            }
            if(finished&&version===this.version&&Manager.session===s){runRegenerationReaction(s);this.message="Inspect the products below, then collect them for the next reaction.";}
        }finally{
            animator.dispose();if(version===this.version){this.busy=false;this.animator=null;this.render(container);}
        }
    },
    async joinSugars(container,step,animator){
        const [leftKey,rightKey]=Object.keys(step.inputs),productKey=Object.keys(step.outputs)[0];
        const left=container.querySelector(`.guided-reaction-dock[data-input="${leftKey}"] .guided-reaction-carbon-chain`),right=container.querySelector(`.guided-reaction-dock[data-input="${rightKey}"] .guided-reaction-carbon-chain`);
        const preview=el("section","guided-aldolase-preview");animator.tokens.push(preview);
        preview.append(el("h4","",`Joining ${SUGARS[leftKey].c} + ${SUGARS[rightKey].c} carbons`));
        const chain=el("div","guided-aldolase-joined-chain"),a=left.cloneNode(true),b=right.cloneNode(true),bond=el("span","guided-aldolase-new-bond");
        a.classList.add("guided-aldolase-fragment");b.classList.add("guided-aldolase-fragment");
        a.prepend(a.querySelector(".guided-reaction-phosphate-group"));
        for(const c of a.querySelectorAll(".guided-reaction-carbon"))c.classList.add("is-dhap-fragment");
        for(const c of b.querySelectorAll(".guided-reaction-carbon"))c.classList.add("is-aldose-fragment");
        a.style.visibility=b.style.visibility="hidden";bond.style.opacity="0";
        chain.append(a,bond,b);const name=el("strong","",`${productKey} · ${SUGARS[productKey].name} · ${SUGARS[productKey].c} carbons`);name.style.opacity="0";
        preview.append(chain,name,el("p","","Both phosphates remain attached. No NADPH is used or regenerated."));
        container.querySelector(".guided-regeneration-inputs").after(preview);
        const movingA=animator.token(left),movingB=animator.token(right);movingA.classList.add("guided-aldolase-moving");movingB.classList.add("guided-aldolase-moving");
        movingA.prepend(movingA.querySelector(".guided-reaction-phosphate-group"));
        for(const c of movingA.querySelectorAll(".guided-reaction-carbon"))c.classList.add("is-dhap-fragment");
        for(const c of movingB.querySelectorAll(".guided-reaction-carbon"))c.classList.add("is-aldose-fragment");
        left.style.visibility=right.style.visibility="hidden";
        const arrived=await Promise.all([animator.travel(movingA,a,1800),animator.travel(movingB,b,1800)]);
        if(!arrived.every(Boolean))return false;
        movingA.remove();movingB.remove();a.style.visibility=b.style.visibility="visible";
        if(!await animator.play(bond,[{opacity:0,transform:"scaleX(0)"},{opacity:1,transform:"scaleX(1)"}],450))return false;
        if(!await animator.play(name,[{opacity:0},{opacity:1}],450))return false;
        return animator.play(chain,[{opacity:1},{opacity:1}],1000);
    },
    renderReturn(container,s){
        const area=el("section","guided-regeneration-return");area.append(el("h4","","Three RuBP are ready for RuBisCO"));
        const row=el("div","guided-reaction-products");for(let i=0;i<3;i++)row.append(this.molecule("RuBP"));area.append(row,
            el("p","","The same 15 sugar carbons are now in three RuBP. Regeneration used 3 ATP and 2 H₂O and formed 3 ADP and 2 Pᵢ. One G3P remains net output."),
            button("Return three RuBP to the fixation tray",()=>{if(returnRegeneratedRuBP(s)){this.message="RuBP is back at the start, ready to accept CO₂ through RuBisCO. This activity models a complete three-CO₂ batch; it does not run another fixation yet.";this.render(container);}}));container.append(area);
    },
    renderQuiz(container,s){
        const q=REGENERATION_QUESTIONS[s.quizIndex],quiz=el("section","guided-reaction-quiz");quiz.append(el("p","",`Question ${s.quizIndex+1} of ${REGENERATION_QUESTIONS.length}`),el("h4","",q.prompt));
        for(const [answer,label] of q.options)quiz.append(button(label,()=>{if(answerRegeneration(s,answer)){this.message="";if(s.phase==="complete")this.saveCompletion();}else this.message=q.feedback;this.render(container);}));container.append(quiz);
    },
    saveCompletion(){const result=Manager.complete();this.message=!result.success?"Completion could not be saved. Retry before leaving.":Manager.practice?result.scorePercent===100?"Practice complete · 100%. Green P saved for all eight regeneration enzymes.":`Practice complete · ${result.scorePercent}%. Re-examine and answer all five questions correctly on first attempts to earn P.`:"Calvin regeneration complete.";},
    renderComplete(container,s,status){
        container.append(el("h4","",!status.completed?"Regeneration complete · save pending":Manager.practice?"Practice regeneration complete":"Calvin regeneration mastered"),el("p","",`Checkpoint: ${regenerationScore(s)}% correct on first attempts.`),
            el("p","","Complete three-CO₂ batch: 6 ATP and 6 NADPH for reduction + 3 ATP for regeneration = 9 ATP and 6 NADPH per net G3P. Three RuBP are recycled; one G3P is net output."));
        if(!status.completed)container.append(button("Retry saving regeneration",()=>{this.saveCompletion();this.render(container);}));
        container.append(button("Re-examine regeneration",()=>this.start(Manager.practice)));
        if(Manager.practice&&status.completed)container.append(button("Return to carbon fixation practice",()=>this.onContinue?.()));
    }
};
export default CalvinRegenerationView;
