import Manager from "./CalvinReductionManager.js";
import {reductionMolecule,photosynthesisCarrier,reactionProton,animateCarbonOneReduction} from "./CalvinReductionVisuals.js";
import RegenerationManager from "./CalvinRegenerationManager.js";
import Visuals from "../data/PolymerizerVisualCatalog.js";
import { REDUCTION_ENZYMES, REDUCTION_QUESTIONS, dockReductionInput, phosphorylatePGA,
    moveToReduction, reduceBPG, storeReductionProducts, advanceReduction, answerReduction,
    reductionLedger, reductionScore, repeatRemainingReduction, allocateReductionG3P, finishReductionAllocation } from "./CalvinReductionModel.js";
import {GuidedTransferAnimation} from "./GuidedTransferAnimation.js";
import {activityElement as el,activityButton as button,carbonMolecule,reactionDock,draggableInput} from "./GuidedReactionView.js";

const CalvinReductionView = {
    container:null, message:"", onSessionChange:null,onProgress:null, onContinuePractice:null, busy:false, animator:null, animationVersion:0,
    close() { this.animationVersion++;this.animator?.cancel();this.animator=null;this.busy=false;Manager.reset();this.message="";this.onSessionChange?.(); },
    start(practice=false) {
        this.close();if(!Manager.start(practice))return false;
        this.render(this.container);this.onSessionChange?.();return true;
    },
    render(container) {
        if(!container)return;this.container=container;
        if(Manager.session && !Manager.getStatus().available)this.close();
        this.onProgress?.();
        if(this.busy && Manager.session)return;
        const s=Manager.session,status=Manager.getStatus();
        const heading=el("div","guided-reaction-heading"), title=el("div","");
        title.append(el("p","metabolism-panel-kicker","Calvin Cycle · Guided Activity 2"),el("h3","","Reduction: 3-PGA to G3P"));
        heading.append(title,el("strong","guided-reaction-status",Manager.practice?"Practice · earn P with 100% correct answers":status.completed?"Completed · replay available":"Follow six 3-PGA"));
        if(s)heading.append(button(Manager.practice?"Exit practice":"Return to reconstruction",()=>{this.close();this.render(container);}));
        container.replaceChildren(heading);
        if(!s) {
            container.append(el("p","guided-reaction-intro","C1's three fixations each made two 3-PGA: six molecules in total. Each needs ATP and NADPH to become G3P. Explore one complete reduction, then repeat the remaining five together if you wish. Practice supplies local molecules and carriers."),
                button(status.completed?"Re-examine reduction":"Start reduction",()=>this.start(),!status.available),
                button("Practice reduction",()=>this.start(true)),
                el("p","guided-reaction-note","The guided activity requires saved C1 completion and PGK/GAPDH activated in Calvin slots 2 and 3. Practice is always available."));
            return;
        }
        const l=reductionLedger(s),ledger=el("div","guided-reaction-ledger");
        for(const [label,value] of [["3-PGA used",`${l.pgaUsed}/6`],["ATP used · ADP formed",`${l.atpUsed}/6`],
            ["NADPH + H⁺ used · NADP⁺ formed",`${l.nadphUsed}/6`],["G3P collected",`${s.stored}/6`]]) {
            const item=el("div","");item.append(el("span","",label),el("strong","",value));ledger.append(item);
        }
        container.append(ledger);
        if(s.phase==="allocation")this.renderAllocation(container,s);
        else if(s.phase==="quiz")this.renderQuiz(container,s);
        else if(s.phase==="complete")this.renderCompletion(container,s,status);
        else this.renderReaction(container,s);
        const feedback=el("p","guided-reaction-feedback",this.message);feedback.setAttribute("role","status");container.append(feedback);
        container.append(button(Manager.practice?"Exit practice":"Return to reconstruction",()=>{this.close();this.render(container);}));
    },
    molecule(label,phosphates,s,round=s.stored) {
        if(phosphates===2||label.startsWith("G3P"))return reductionMolecule(label,phosphates===2,round%2===1);
        const molecule=carbonMolecule(label,3,{phosphates,fixedCarbon:round%2===1});
        if(phosphates===2) {
            const first=molecule.querySelector(".guided-reaction-phosphate-group");
            first.classList.add("is-atp-phosphate");first.title="Temporary phosphate transferred from ATP to carbon 1";
        }
        return molecule;
    },
    carrier(label,count=0) {
        if(["NADPH","NADP⁺"].includes(label))return photosynthesisCarrier(label);
        const item=el("div","guided-reduction-carrier");item.append(el("strong","",label));
        if(count) {
            const row=el("div","guided-reduction-phosphate-chain");
            for(let i=0;i<count;i++)row.append(el("span",`guided-reaction-phosphate-group${i===2||label==="Pᵢ"?" is-atp-phosphate":""}`,"P"));
            item.append(row);
        }
        return item;
    },
    enzyme(enzymeId) {
        const image=el("img","guided-reaction-enzyme-image");
        image.src=Visuals.get(enzymeId).finalImageUrl;image.alt= enzymeId===REDUCTION_ENZYMES[0]?"Phosphoglycerate kinase structure":"GAPDH structural representative";
        image.onerror=()=>{image.hidden=true;};return image;
    },
    renderReaction(container,s) {
        const stage2=["reduction","products","stored"].includes(s.phase),
            stage=stage2?"GAPDH":"PGK",enzymeId=stage2?REDUCTION_ENZYMES[1]:REDUCTION_ENZYMES[0];
        const workspace=el("div","guided-reaction-workspace"),tray=el("section","guided-reaction-tray"),
            chamber=el("section","guided-reaction-chamber"),outputs=el("section","guided-reaction-output-tray");
        tray.append(el("h4","","Input tray"),el("p","","Drag to a matching dock, or click to add. All resources are activity-local."));
        const dock=input=>{if(!this.busy && dockReductionInput(s,input)){this.message="";this.render(container);}};
        const addInput=(input,label,visual,disabled)=>{
            const b=button("",()=>dock(input),disabled);b.dataset.input=input;b.setAttribute("aria-label",`Add ${label}`);
            b.append(visual,el("span","",label));tray.append(draggableInput(b,input));
        };
        const editable=s.phase==="phosphorylation"||s.phase==="reduction";
        addInput(stage,stage,this.enzyme(enzymeId),!editable||s[stage2?"gapdh":"pgk"]);
        if(!stage2) {
            addInput("PGA","3-PGA",this.molecule("3-PGA · 3 carbons",1,s),s.phase!=="phosphorylation"||s.pga);
            addInput("ATP","ATP",this.carrier("ATP",3),s.phase!=="phosphorylation"||s.atp);
        } else {
            addInput("NADPH","NADPH",this.carrier("NADPH"),s.phase!=="reduction"||s.nadph);
            addInput("HPLUS","H⁺",reactionProton(),s.phase!=="reduction"||s.hplus);
        }
        chamber.append(el("h4","",`Molecule ${Math.min(s.stored+1,6)} of 6 · ${stage2?"2. Reduction":"1. Phosphorylation"}`));
        const enzymeDock=reactionDock(`${stage} · reusable enzyme`,stage,s[stage2?"gapdh":"pgk"],dock);
        if(s[stage2?"gapdh":"pgk"])enzymeDock.append(this.enzyme(enzymeId));chamber.append(enzymeDock);
        if(s.phase==="phosphorylation") {
            const inputs=el("div","guided-reaction-input-docks"),pgaDock=reactionDock("3-PGA", "PGA",s.pga,dock),atpDock=reactionDock("ATP · phosphate donor","ATP",s.atp,dock);
            if(s.pga)pgaDock.append(this.molecule("3-PGA",1,s));if(s.atp)atpDock.append(this.carrier("ATP",3));
            inputs.classList.add("guided-transfer-docks");inputs.append(atpDock,pgaDock);chamber.append(inputs,
                button("Transfer ATP phosphate",()=>this.runAnimated(s,"phosphorylation"),!(s.pgk&&s.pga&&s.atp)));
        } else if(s.phase==="phosphorylated") {
            const products=el("div","guided-reaction-products guided-reduction-intermediate");
            products.append(this.molecule("1,3-bisphosphoglycerate",2,s),this.carrier("ADP",2));
            chamber.append(products,el("p","","Two attached phosphates: blue is the original; gold came from ATP. The three-carbon backbone is unchanged."),
                button("Move intermediate to GAPDH",()=>{if(moveToReduction(s)){this.message="The same 1,3-bisphosphoglycerate now enters the reduction step. ADP awaits collection.";this.render(container);}}));
        } else if(s.phase==="reduction") {
            const inputs=el("div","guided-reaction-input-docks guided-transfer-docks");
            const bpg=this.molecule("1,3-bisphosphoglycerate",2,s);bpg.classList.add("guided-reduction-bpg-target");
            const nadphDock=reactionDock("NADPH · electron donor","NADPH",s.nadph,dock);
            if(s.nadph)nadphDock.append(this.carrier("NADPH"));
            inputs.append(nadphDock,bpg);
            const protonDock=reactionDock("H⁺ · from solution","HPLUS",s.hplus,dock);if(s.hplus)protonDock.append(reactionProton());
            chamber.append(inputs,protonDock,el("p","","NADPH transfers H⁻ (a hydrogen nucleus with two electrons) to carbon 1; a separate H⁺ from solution is used in the net reaction. C1 keeps =O while –O–P is replaced by H. This is reduction to an aldehyde, not formation of an –OH group. H⁺ enters the enzyme area; detailed proton transfers and intermediates are omitted."),
                button("Use NADPH to reduce",()=>this.runAnimated(s,"reduction"),!(s.gapdh&&s.nadph&&s.hplus)));
        } else if(s.phase==="products") {
            const products=el("section","guided-fixation-local-products");products.append(el("h4","","Products ready to collect"));
            const row=el("div","guided-reduction-product-row guided-reaction-products");
            row.append(this.molecule("G3P",1,s),this.carrier("ADP",2),this.carrier("NADP⁺"),this.carrier("Pᵢ",1));
            products.append(row,el("p","","G3P keeps its carbon 3 phosphate. Carbon 1 now has =O and H: an aldehyde. The =O did not become –OH. ADP shown here came from PGK; GAPDH used NADPH and H⁺ and released Pᵢ. No carbon was added."),
                button("Store reduction products",()=>{if(storeReductionProducts(s)){this.message="Products collected. Moving to the tray is bookkeeping, not another reaction.";this.render(container);}}));
            chamber.append(products);
        } else {
            chamber.append(el("p","","Products collected in the output tray."),button(s.stored===6?"Explore gross and net G3P":"Reduce the next 3-PGA",()=>{advanceReduction(s);this.message="";this.render(container);}));
            if(s.stored<6)chamber.append(button("Repeat this whole process",()=>{
                if(!repeatRemainingReduction(s))return;
                this.message="Repeated phosphorylation, reduction, and collection for the remaining molecules. Total: six ATP, six NADPH, and six solution H⁺ used; six G3P, six ADP, six NADP⁺, and six Pᵢ formed.";
                this.render(container);
            }),el("p","guided-reaction-note",`${6-s.stored} more 3-PGA complete the six-molecule batch from C1. You can repeat them together or explore another round manually.`));
        }
        chamber.append(el("p","guided-reaction-note","PGK: 3-PGA + ATP → 1,3-bisphosphoglycerate + ADP. GAPDH: intermediate + NADPH + H⁺ → G3P + NADP⁺ + Pᵢ."));
        outputs.append(el("h4","","Output tray"),el("p","",`${s.stored} G3P · ${s.stored} ADP · ${s.stored} NADP⁺ · ${s.stored} Pᵢ collected`));
        const g3ps=el("div","guided-reduction-g3p-grid");
        for(let i=0;i<s.stored;i++)g3ps.append(this.molecule("G3P",1,s,i));outputs.append(g3ps);
        if(s.stored) {
            const carriers=el("div","guided-reduction-product-row");
            for(const [label,count] of [["ADP",2],["NADP⁺",0],["Pᵢ",1]]) {
                const item=this.carrier(label,count);item.append(el("small","",`× ${s.stored} collected`));carriers.append(item);
            }
            outputs.append(carriers);
        }
        if(!s.stored)outputs.append(el("p","","Collect released products here for the next stage."));
        workspace.append(tray,chamber,outputs);container.append(workspace,
            el("p","guided-reaction-carbon-key","Green C: carbon originally in RuBP. Gold C: fixed from CO₂ in C1. Blue P on the carbon backbone stays on G3P; gold P comes from ATP and leaves as Pᵢ. Other atoms and carrier structures are simplified."),
            el("p","guided-reaction-note","The GAPDH image is the existing structural representative. Calvin reduction uses the NADPH-dependent chloroplast form; glycolysis uses NAD⁺/NADH."));
    },
    async runAnimated(s,kind) {
        if(this.busy || Manager.session!==s)return;
        const ready=kind==="phosphorylation"?s.phase==="phosphorylation"&&s.pgk&&s.pga&&s.atp:s.phase==="reduction"&&s.gapdh&&s.nadph&&s.hplus;
        if(!ready)return;
        this.busy=true;const version=++this.animationVersion, animator=new GuidedTransferAnimation();this.animator=animator;
        for(const b of this.container.querySelectorAll("button"))if(!["Exit practice","Return to reconstruction"].includes(b.textContent.trim()))b.disabled=true;
        for(const b of this.container.querySelectorAll("[draggable]"))b.draggable=false;
        const feedback=this.container.querySelector('.guided-reaction-feedback');
        if(feedback)feedback.textContent=kind==="phosphorylation"?"Watch ATP's terminal phosphate glide onto carbon 1; ADP leaves to the left.":"Watch H and its electron pair move together to carbon 1. H⁺ is used separately; =O stays while –O–P leaves and C–H appears.";
        const ok=await (kind==="phosphorylation"?animator.phosphorylate(this.container):animateCarbonOneReduction(this.container,animator));
        animator.dispose();
        if(version!==this.animationVersion || Manager.session!==s)return;
        this.busy=false;this.animator=null;
        if(ok) {
            if(kind==="phosphorylation") {phosphorylatePGA(s);this.message="ATP became ADP. Its phosphate is now on carbon 1; the original phosphate remains on carbon 3.";}
            else {reduceBPG(s);this.message="Carbon 1 was reduced: its =O remains, –O–P left as Pᵢ, and C–H formed. NADPH became NADP⁺; one solution H⁺ was used. ADP was formed in the earlier PGK step.";}
        } else this.message="The animation could not finish. Retry the reaction.";
        this.render(this.container);
    },
    renderAllocation(container,s) {
        const area=el("section","guided-reduction-allocation");
        area.append(el("h4","","Six G3P formed. How many can be net output?"),
            el("p","","The cycle must rebuild three RuBP, each with five carbons. Reserve 15 carbons for that job; only the remaining three carbons can be net output. Allocate the six G3P below."));
        const choices=el("div","guided-reduction-g3p-grid");
        const place=(pool,index)=>{
            if(!allocateReductionG3P(s,pool,index)){this.message="Regeneration needs five G3P (15 carbons); only one G3P (3 carbons) can be net output.";this.render(container);return;}
            this.message="";this.render(container);
        };
        for(let i=0;i<6;i++) {
            if(s.allocation.regeneration.includes(i)||s.allocation.net.includes(i))continue;
            const card=el("div","guided-allocation-g3p");card.append(this.molecule(`G3P ${i+1}`,1,s,i));
            card.draggable=true;card.setAttribute("aria-label",`G3P ${i+1} available for allocation`);
            card.addEventListener("dragstart",e=>e.dataTransfer?.setData("application/x-ecgame-g3p",String(i)));
            card.append(button("Reserve for regeneration",()=>place("regeneration",i)),button("Choose as net output",()=>place("net",i)));
            choices.append(card);
        }
        const pools=el("div","guided-reaction-input-docks");
        for(const [pool,label,limit] of [["regeneration","Reserved for regeneration",5],["net","Net G3P output",1]]) {
            const target=el("div","guided-allocation-pool");target.dataset.pool=pool;
            const count=s.allocation[pool].length;
            target.append(el("h4","",`${label} · ${count}/${limit}`),el("p","",`${count*3} carbons${pool==="regeneration"?" / 15 needed for three RuBP":" / 3 available as net output"}`));
            target.addEventListener("dragover",e=>e.preventDefault());
            target.addEventListener("drop",e=>{e.preventDefault();const raw=e.dataTransfer?.getData("application/x-ecgame-g3p");if(raw!==undefined&&raw!=="")place(pool,Number(raw));});
            for(const i of s.allocation[pool])target.append(this.molecule(`G3P ${i+1}`,1,s,i));
            pools.append(target);
        }
        area.append(choices,pools,el("p","guided-reaction-note","Any G3P can be allocated; gold carbon marks its origin, not a special sugar. Reserving molecules is not yet regeneration—the next activity will rearrange those 15 carbons into three RuBP."),
            button("Continue to reduction questions",()=>{if(finishReductionAllocation(s)){this.message="Five G3P reserved; one net G3P. You can now answer the gross-versus-net question from the carbon budget.";this.render(container);}},s.allocation.regeneration.length!==5||s.allocation.net.length!==1));
        container.append(area);
    },
    renderQuiz(container,s) {
        const q=REDUCTION_QUESTIONS[s.quizIndex],quiz=el("section","guided-reaction-quiz");
        quiz.append(el("p","",`Question ${s.quizIndex+1} of ${REDUCTION_QUESTIONS.length}`),el("h4","",q.prompt));
        for(const [answer,label] of q.options)quiz.append(button(label,()=>{
            if(answerReduction(s,answer)){this.message="";if(s.phase==="complete")this.saveCompletion();}
            else this.message=q.feedback;
            this.render(container);
        }));container.append(quiz);
    },
    saveCompletion() {
        const result=Manager.complete();
        this.message=!result.success?"Completion could not be saved. Retry before leaving.":Manager.practice?
            result.scorePercent===100?"Practice complete · 100%. Green P saved for PGK and GAPDH.":`Practice complete · ${result.scorePercent}%. Re-examine and answer all four questions without mistakes to earn P.`:
            "Calvin reduction complete.";
    },
    renderCompletion(container,s,status) {
        container.append(el("h4","",!status.completed?"Reduction complete · save pending":Manager.practice?"Practice reduction complete":"Calvin reduction mastered"),
            el("p","",`Checkpoint: ${reductionScore(s)}% correct on first attempts.`),
            el("p","","6 3-PGA + 6 ATP + 6 NADPH (+ 6 H⁺) → 6 G3P + 6 ADP + 6 NADP⁺ + 6 Pᵢ."),
            el("p","","These six G3P are gross production. Five are needed to regenerate three RuBP, leaving one net G3P. Regeneration will use three more ATP in the next milestone."));
        if(!status.completed)container.append(button("Retry saving reduction",()=>{this.saveCompletion();this.render(container);}));
        container.append(button("Re-examine reduction",()=>this.start(Manager.practice)));
        if(status.completed)container.append(button(Manager.practice?"Continue to regeneration practice":"Continue to regeneration",()=>this.onContinuePractice?.(),!Manager.practice&&!RegenerationManager.getStatus().available));
    }
};
export default CalvinReductionView;
