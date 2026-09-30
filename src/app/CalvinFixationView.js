import CalvinActivityManager from "./CalvinActivityManager.js";
import CalvinPracticeManager from "./CalvinPracticeManager.js";
import PolymerizerVisualCatalog from "../data/PolymerizerVisualCatalog.js";
import { dockFixationInput, canRunFixation, beginFixation, finishFixation,
    storeFixationProducts, advanceFixation, repeatRemainingFixation, answerFixation, fixationLedger } from "./CalvinFixationModel.js";
import { activityElement as el, activityButton as button, carbonMolecule,
    reactionDock, draggableInput } from "./GuidedReactionView.js";

const CalvinFixationView = {
    container: null,
    manager: CalvinActivityManager,
    practice: false,
    timer: null,
    message: "",
    onSessionChange: null,
    onProgress: null,
    onContinuePractice: null,

    close() {
        this.container?.closest("#metabolism-zone")?.classList.remove("metabolism-practice-open");
        clearTimeout(this.timer);
        this.timer = null;
        CalvinActivityManager.reset();
        CalvinPracticeManager.reset();
        this.manager = CalvinActivityManager;
        this.practice = false;
        this.message = "";
        this.onSessionChange?.();
    },

    start(practice = false) {
        this.close();
        this.practice = practice;
        this.manager = practice ? CalvinPracticeManager : CalvinActivityManager;
        this.manager.start();
        this.render(this.container);
        this.onSessionChange?.();
    },

    render(container) {
        if (!container) return;
        this.container = container;
        const status = this.manager.getStatus();
        if (!status.available && this.manager.session) this.close();
        const session = this.manager.session;
        container.closest("#metabolism-zone")?.classList.toggle("metabolism-practice-open", Boolean(session && this.practice));
        this.onProgress?.();
        const header = el("div", "guided-reaction-heading");
        const title = el("div", "");
        title.append(el("p", "metabolism-panel-kicker", "Calvin Cycle · Guided Activity 1"),
            el("h3", "", "Carbon Fixation"));
        header.append(title, el("strong", "guided-reaction-status", this.practice ? "Practice · earn P with 100% correct answers" : status.completed ? "Completed · replay available" : "Fix three CO₂"));
        if (session && this.practice) header.append(button("Exit practice", () => { this.close(); this.render(container); }));
        container.replaceChildren(header);
        if (!session) {
            container.append(el("p", "guided-reaction-intro",
                "Operate RuBisCO: each CO₂ added to RuBP yields two 3-PGA. Three fixations produce the six 3-PGA needed for the next stage."),
                button(status.completed ? "Re-examine carbon fixation" : "Start carbon fixation", () => this.start(), !status.available));
            container.append(button("Practice carbon fixation", () => this.start(true)));
            if (!status.available) container.append(el("p", "guided-reaction-feedback",
                "Synthesize RuBisCO in the Polymerizer, then activate it in Calvin slot 1 to begin."));
            return;
        }
        const ledger = fixationLedger(session);
        const progress = el("div", "guided-reaction-ledger");
        for (const [label, value] of [["CO₂ fixed", `${ledger.co2Used} / 3`],
            ["RuBP used", `${ledger.ruBPUsed} / 3`], ["3-PGA formed", `${ledger.pgaProduced} / 6`],
            ["Carbon accounted for", `${ledger.carbonOut} / ${ledger.carbonIn}`]]) {
            const item = el("div", "");
            item.append(el("span", "", label), el("strong", "", value));
            progress.append(item);
        }
        container.append(progress);
        if (session.phase === "quiz") this.renderQuiz(container);
        else if (session.phase === "complete") this.renderCompletion(container);
        else this.renderReaction(container, session);
        const feedback = el("p", "guided-reaction-feedback", this.message);
        feedback.setAttribute("role", "status");
        container.append(feedback);
        container.append(button(this.practice ? "Exit practice" : "Return to reconstruction", () => { this.close(); this.render(container); }));
    },

    renderReaction(container, session) {
        const workspace = el("div", "guided-reaction-workspace");
        const tray = el("section", "guided-reaction-tray");
        tray.append(el("h4", "", "Input tray"), el("p", "", "Drag to a matching dock, or click to add."));
        const dock = input => {
            if (dockFixationInput(session, input)) {
                this.message = "";
                this.render(container);
            }
        };
        for (const [input, field, count] of [["RuBisCO", "enzymeDocked", null],
            ["RuBP", "ruBP", 3 - session.reactions], ["CO2", "co2", 3 - session.reactions]]) {
            const disabled = session.phase !== "loading" || session[field];
            const inputButton = button("", () => dock(input), disabled);
            inputButton.dataset.input = input;
            inputButton.setAttribute("aria-label", `Add ${input === "CO2" ? "CO₂" : input}`);
            if (input === "RuBP") inputButton.append(carbonMolecule("RuBP · 5 carbons", 5, { phosphates: 2 }));
            else if (input === "CO2") inputButton.append(carbonMolecule("CO₂ · 1 carbon", 1, { fixedCarbon: true }));
            else {
                const image = el("img", "guided-reaction-rubisco-image");
                image.src = PolymerizerVisualCatalog.get("RuBisCO").finalImageUrl;
                image.alt = "Colored full RuBisCO assembly";
                inputButton.append(image, el("span", "guided-reaction-enzyme-icon", "RuBisCO"));
            }
            inputButton.append(el("span", "", input === "RuBisCO" ? "Reusable enzyme" :
                `${count - (session[field] ? 1 : 0)} in tray${session[field] ? " · 1 docked" : ""}`));
            tray.append(draggableInput(inputButton, input));
        }
        const waterButton = button("H₂O · water", () => dock("H2O"), session.phase !== "intermediate");
        waterButton.dataset.input = "H2O";
        waterButton.setAttribute("aria-label", "Add water to the cleavage site");
        waterButton.append(el("span", "", `${3 - session.reactions - (session.water ? 1 : 0)} in tray · hydrate before splitting`));
        tray.append(draggableInput(waterButton, "H2O"));
        const chamber = el("section", "guided-reaction-chamber");
        chamber.append(el("h4", "", "RuBisCO reaction chamber"));
        const enzymeDock = reactionDock(session.enzymeDocked ? "RuBisCO ready · reusable enzyme" : "Dock RuBisCO", "RuBisCO", session.enzymeDocked, dock);
        if (session.enzymeDocked) {
            const image = el("img", "guided-reaction-rubisco-image");
            image.src = PolymerizerVisualCatalog.get("RuBisCO").finalImageUrl;
            image.alt = "Colored full RuBisCO assembly";
            enzymeDock.append(image);
        }
        chamber.append(enzymeDock);
        if (session.phase === "loading") {
            const inputs = el("div", "guided-reaction-input-docks");
            const ruBP = reactionDock("RuBP · five carbons", "RuBP", session.ruBP, dock);
            const co2 = reactionDock("CO₂ · one new carbon", "CO2", session.co2, dock);
            if (session.ruBP) ruBP.append(carbonMolecule("RuBP", 5, { phosphates: 2 }));
            if (session.co2) co2.append(carbonMolecule("CO₂", 1, { fixedCarbon: true }));
            inputs.append(ruBP, co2);
            chamber.append(inputs, button("Run fixation", () => {
                if (!beginFixation(session)) return;
                this.message = "Five carbons from RuBP + one carbon from CO₂ = six carbons.";
                this.render(container);
            }, !canRunFixation(session)));
        } else if (session.phase === "intermediate" || session.phase === "hydrated") {
            chamber.append(this.intermediateDiagram(session, dock),
                el("p", "guided-reaction-intermediate-name", session.water ?
                    "Hydrated six-carbon intermediate" : "Six-carbon intermediate · CO₂ carbon attached"),
                el("p", "", session.water ?
                    "Water has hydrated the intermediate. Now let RuBisCO cleave the marked carbon–carbon bond." :
                    "Pause and follow the gold carbon. Drag H₂O to the marked cleavage site, or click H₂O in the tray."));
            if (session.water) chamber.append(button("Split into two 3-PGA", () => {
                if (!finishFixation(session)) return;
                this.message = "Two three-carbon products, each with one attached phosphate. No phosphate was removed.";
                this.render(container);
            }));
        } else if (session.phase === "products") {
            const products = el("section", "guided-fixation-local-products");
            products.append(el("h4", "", "Products released by RuBisCO"), this.productPair(),
                el("p", "", "Two 3-PGA are ready for the next Calvin-cycle stage. Store them in the output tray to keep track of the products."),
                button("Store in output tray", () => {
                    if (!storeFixationProducts(session)) return;
                    this.message = "The same two 3-PGA are now in the output tray. Storing them is bookkeeping in this model, not another chemical reaction.";
                    this.render(container);
                }));
            chamber.append(products);
        } else {
            chamber.append(el("p", "", "The two 3-PGA are collected in the output tray for the reduction stage."),
                button(session.reactions === 3 ? "Check the carbon source" : "Fix the next CO₂", () => {
                advanceFixation(session);
                this.message = "";
                this.render(container);
            }));
            if (session.reactions < 3) chamber.append(button("Repeat this whole process", () => {
                if (!repeatRemainingFixation(session)) return;
                this.message = "Repeated the same fixation and collection for the remaining CO₂. Total: 3 RuBP + 3 CO₂ + 3 H₂O → 6 3-PGA. Three rounds account for three CO₂; the chemistry is unchanged.";
                this.render(container);
            }),el("p", "guided-reaction-note", `${3-session.reactions} more identical fixations are needed for the three-CO₂ batch. You can repeat them together or work through another round.`));
        }
        chamber.append(el("p", "guided-reaction-note", "One H₂O hydrates each intermediate before cleavage. RuBisCO catalyzes CO₂ addition, hydration, and cleavage; no ATP or NADPH is used here."));
        const outputs = el("section", "guided-reaction-output-tray");
        outputs.append(el("h4", "", "Output tray"));
        const storedRounds = session.reactions - (session.phase === "products" ? 1 : 0);
        for (let i = 0; i < storedRounds; i += 1) {
            const pair = this.productPair();
            if (session.phase !== "stored" || i !== storedRounds - 1) pair.classList.remove("guided-reaction-products");
            outputs.append(pair);
        }
        if (!storedRounds) outputs.append(el("p", "", "Store released 3-PGA here to collect it for the next stage."));
        workspace.append(tray, chamber, outputs);
        container.append(el("p", "guided-reaction-carbon-key", "Green C: carbon from RuBP. Gold C: carbon from CO₂. P: attached phosphate group. RuBP has two P groups; each 3-PGA keeps one. Other atoms are omitted."), workspace,
            el("p", "guided-reaction-note", "RuBP is ribulose-1,5-bisphosphate: phosphate groups on carbons 1 and 5. 3-PGA is 3-phosphoglycerate: one phosphate on carbon 3. The 3 indicates its position, not three phosphate groups."));
    },

    productPair() {
        const pair = el("div", "guided-reaction-output-pair guided-reaction-products");
        pair.append(carbonMolecule("3-PGA", 3, { phosphates: 1 }),
            carbonMolecule("3-PGA", 3, { fixedCarbon: true, phosphates: 1 }));
        return pair;
    },

    intermediateDiagram(session, dock) {
        const wrap = el("div", `guided-fixation-intermediate${session.water ? " is-hydrated" : ""}`);
        const ns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(ns, "svg");
        svg.setAttribute("viewBox", "0 0 420 170");
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", "Five RuBP carbons with the CO2 carbon branching from carbon 2. The cleavage site lies between original carbons 2 and 3. Phosphates remain attached at each end.");
        const add = (tag, attrs, text, parent = svg) => {
            const node = document.createElementNS(ns, tag);
            for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
            if (text) node.textContent = text;
            parent.append(node); return node;
        };
        for (const [a,b] of [[20,70],[70,140],[140,230],[230,290],[290,350],[350,400]])
            add("line", {x1:a,y1:100,x2:b,y2:100,stroke:a===140?"#ffc65e":"#8cbea5","stroke-width":4});
        for (const x of [70,140,230,290,350]) {
            add("circle", {cx:x,cy:100,r:18,fill:"#184732",stroke:"#92e0ad","stroke-width":2});
            add("text", {x,y:106,"text-anchor":"middle",fill:"#edfff2"}, "C");
        }
        for (const x of [20,400]) {
            add("circle", {cx:x,cy:100,r:15,fill:"#384377",stroke:"#bcc7ff","stroke-width":2});
            add("text", {x,y:106,"text-anchor":"middle",fill:"white"}, "P");
        }
        const incoming = add("g", {class:"guided-fixation-incoming-carbon"});
        add("line", {x1:140,y1:58,x2:140,y2:82,stroke:"#ffc65e","stroke-width":4}, null, incoming);
        add("circle", {cx:140,cy:40,r:18,fill:"#76541b",stroke:"#ffc65e","stroke-width":2}, null, incoming);
        add("text", {x:140,y:46,"text-anchor":"middle",fill:"#fff1cb"}, "C", incoming);
        add("text", {x:140,y:14,"text-anchor":"middle",fill:"#ffc65e"}, "from CO₂", incoming);
        wrap.append(svg);
        const target = reactionDock(session.water ? "H₂O added" : "H₂O here", "H2O", session.water, dock);
        target.classList.add("guided-fixation-water-target");
        target.title = "Water hydrates the intermediate before the marked C–C bond is cleaved";
        wrap.append(target);
        return wrap;
    },

    renderQuiz(container) {
        const quiz = el("section", "guided-reaction-quiz");
        quiz.append(el("h4", "", "Where did the newly added carbon come from?"));
        for (const [answer, label] of [["CO2", "Carbon dioxide (CO₂)"], ["ATP", "ATP"], ["RuBisCO", "RuBisCO"]]) {
            quiz.append(button(label, () => {
                if (answerFixation(this.manager.session, answer)) this.saveCompletion();
                else this.message = "Follow the gold carbon: it entered the reaction in CO₂. RuBisCO is the enzyme.";
                this.render(container);
            }));
        }
        container.append(quiz);
    },

    saveCompletion() {
        const result = this.manager.complete();
        this.message = result.success ? (this.practice ? result.scorePercent === 100 ?
            "Practice complete · 100%. Green P saved on the RuBisCO enzyme card." :
            `Practice complete · ${result.scorePercent}%. Re-examine and answer without mistakes to earn the green P.`
            : "Carbon fixation complete.") : "Completion could not be saved. Retry saving before leaving.";
        return result;
    },

    renderCompletion(container) {
        const completed = this.manager.getStatus().completed;
        container.append(el("h4", "", !completed ? "Reaction complete · save pending" : this.practice ? "Practice carbon fixation complete" : "Carbon fixation mastered"),
            el("p", "", "3 RuBP + 3 CO₂ + 3 H₂O → 6 3-PGA. The enzyme remains available to catalyze more reactions."),
            el("p", "", "3-PGA is not yet sugar. Next, ATP and NADPH will help convert it to G3P in the reduction stage."));
        if (!completed) container.append(button("Retry saving completion", () => { this.saveCompletion(); this.render(container); }));
        container.append(button("Re-examine carbon fixation", () => this.start(this.practice)));
        if (this.practice && completed && this.onContinuePractice) container.append(button("Continue to reduction practice", () => this.onContinuePractice()));
    }
};

export default CalvinFixationView;
