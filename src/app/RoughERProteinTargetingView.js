import Catalog from "./RoughERProteinTargetingCatalog.js";
import ResearchManager from "./ResearchManager.js";
import SubmissionManager from "./OrganelleExperimentSubmissionManager.js";
import OrganelleExperimentPanel from "./OrganelleExperimentPanel.js";
import SaveManager from "./SaveManager.js";
import gameState from "./GameState.js";

const STEPS = Object.freeze([
    { id: "free_ribosome", short: "Translation begins", description: "Polypeptide synthesis begins on a free ribosome in the cytosol. An N-terminal signal peptide emerges from the ribosome." },
    { id: "srp_binds", short: "SRP recognizes the signal", description: "A signal-recognition particle (SRP) binds the signal peptide and ribosome, briefly pausing translation." },
    { id: "dock_translocon", short: "The complex docks", description: "SRP binds its receptor in the ER membrane and positions the ribosome at a translocation complex containing a pore and signal peptidase." },
    { id: "resume_translocation", short: "Translation and translocation resume", description: "SRP leaves. Translation resumes while the growing polypeptide passes through the translocation pore; the signal peptide remains associated with the membrane." },
    { id: "signal_cleaved", short: "Signal peptide is removed", description: "Signal peptidase cuts the signal peptide away from the growing polypeptide." },
    { id: "release_and_fold", short: "Polypeptide is released", description: "Translation finishes. The completed polypeptide leaves the ribosome, enters the ER lumen, and begins folding into its functional conformation." }
]);

const STARTING_ORDER = Object.freeze([2, 0, 4, 1, 5, 3]);

const RoughERProteinTargetingView = {
    clear() {
        this.events?.abort();
        clearInterval(this.timer);
        this.events = null;
        this.timer = null;
        this.root = null;
    },

    initialState() {
        return { mode: "lesson", lessonStep: 0, viewedThroughEnd: false, order: [...STARTING_ORDER], matches: {}, checkedCorrect: false, saved: false };
    },

    stylesheet() {
        if (document.getElementById("rough-er-targeting-styles")) return;
        const style = document.createElement("style");
        style.id = "rough-er-targeting-styles";
        style.textContent = `
            .rer-lab{max-width:1000px;color:#eaf3fb;line-height:1.45}.rer-heading{display:flex;align-items:center;justify-content:space-between;gap:1rem}.rer-badge{color:#ffbd66;font-weight:800;letter-spacing:.05em;text-transform:uppercase}
            .rer-model{display:block;width:100%;height:auto;min-height:390px;background:#111b28;border:1px solid #5e7485;border-radius:10px}.rer-step-copy{min-height:5.4rem;margin:.8rem 0;padding:.8rem 1rem;background:#162838;border-left:4px solid #71d7cf}.rer-step-copy h4{margin:.05rem 0 .3rem}
            .rer-controls{display:flex;flex-wrap:wrap;gap:.6rem;margin:1rem 0}.rer-controls button,.rer-start-quiz,.rer-check,.rer-submit,.rer-order-button{font:inherit;padding:.5rem .8rem;color:#eef8ff;background:#17364c;border:1px solid #6db7bc;border-radius:7px;cursor:pointer}.rer-controls button:disabled,.rer-start-quiz:disabled,.rer-submit:disabled{opacity:.5;cursor:not-allowed}
            .rer-note{padding:.75rem;border-left:4px solid #c38bf0;background:#261c35;color:#ded0eb}.rer-status{min-height:2.7rem;color:#a2ebc8;font-weight:650}
            .rer-sequence-list{display:grid;gap:.8rem;margin:1rem 0}.rer-sequence-card{display:grid;grid-template-columns:3.2rem minmax(230px,320px) 1fr;gap:.8rem;align-items:center;padding:.75rem;background:#132535;border:1px solid #587589;border-radius:9px}.rer-order-controls{display:grid;gap:.35rem}.rer-order-button{padding:.3rem .5rem}.rer-mini-model{display:block;width:100%;height:auto;background:#0f1b27;border-radius:7px}.rer-match label{display:block;font-weight:700;margin-bottom:.35rem}.rer-match select{width:100%;font:inherit;padding:.45rem;color:#eaf3fb;background:#102130;border:1px solid #6d8799;border-radius:5px}
            .rer-success{border-color:#5bd49c;box-shadow:0 0 0 2px #5bd49c44}.rer-reflection{display:block;margin:1rem 0}.rer-reflection textarea{display:block;width:min(100%,760px);min-height:5rem;margin-top:.4rem;padding:.55rem;color:#fff;background:#0d1b29;border:1px solid #7890a2;border-radius:6px}
            @media(max-width:720px){.rer-heading{align-items:flex-start;flex-direction:column}.rer-sequence-card{grid-template-columns:2.8rem 1fr}.rer-match{grid-column:1/-1}.rer-model{min-height:300px}}
        `;
        document.head.appendChild(style);
    },

    mount(container, { sandbox = false, review = false } = {}) {
        this.clear();
        this.stylesheet();
        this.sandbox = sandbox;
        this.root = document.createElement("section");
        this.root.className = "rer-lab";
        container.replaceChildren(this.root);
        if (review) this.renderReview();
        else { this.state = this.initialState(); this.render(); }
    },

    render() {
        this.events?.abort();
        this.events = new AbortController();
        if (this.state.mode === "lesson") this.renderLesson();
        else this.renderAssessment();
    },

    renderLesson() {
        const step = STEPS[this.state.lessonStep];
        this.root.innerHTML = `
            <div class="rer-heading"><h3>Guided Animation: Cotranslational ER Targeting</h3><span class="rer-badge">Step ${this.state.lessonStep + 1} of ${STEPS.length}</span></div>
            <p>Watch one coordinated process unfold. Translation, targeting, membrane docking, translocation, cleavage, and folding are related events—not one simple movement.</p>
            <svg class="rer-model" viewBox="0 0 940 430" role="img" aria-label="${step.short}"></svg>
            <article class="rer-step-copy"><h4>${this.state.lessonStep + 1}. ${step.short}</h4><p>${step.description}</p></article>
            <div class="rer-controls"><button type="button" data-action="back" ${this.state.lessonStep === 0 ? "disabled" : ""}>Previous step</button><button type="button" data-action="next">${this.state.lessonStep === STEPS.length - 1 ? "View complete process" : "Next step"}</button><button type="button" data-action="auto">Play animation</button><button type="button" data-action="replay">Restart</button></div>
            <button type="button" class="rer-start-quiz" ${this.state.viewedThroughEnd ? "" : "disabled"}>Reconstruct the Sequence</button>
            <p class="rer-note"><strong>This first Rough ER model follows a soluble ER/secretory-pathway protein with a cleaved N-terminal signal peptide.</strong> Single-pass receptors, multipass GPCRs, and ion channels use additional signal-anchor and start/stop-transfer rules in a later activity.</p>
            <p class="rer-status" role="status" aria-live="polite"></p>`;
        this.svg = this.root.querySelector(".rer-model");
        this.status = this.root.querySelector(".rer-status");
        this.drawFrame(this.svg, this.state.lessonStep, false);
        this.bindLesson();
    },

    bindLesson() {
        const signal = this.events.signal;
        const on = (node, type, callback) => node?.addEventListener(type, callback, { signal });
        on(this.root.querySelector('[data-action="back"]'), "click", () => { clearInterval(this.timer); this.state.lessonStep = Math.max(0, this.state.lessonStep - 1); this.render(); });
        on(this.root.querySelector('[data-action="next"]'), "click", () => { clearInterval(this.timer); if (this.state.lessonStep < STEPS.length - 1) this.state.lessonStep += 1; else this.state.viewedThroughEnd = true; this.render(); });
        on(this.root.querySelector('[data-action="replay"]'), "click", () => { clearInterval(this.timer); this.state.lessonStep = 0; this.render(); });
        on(this.root.querySelector('[data-action="auto"]'), "click", () => this.play());
        on(this.root.querySelector(".rer-start-quiz"), "click", () => { this.state.mode = "assessment"; this.render(); });
    },

    play() {
        clearInterval(this.timer);
        if (this.state.lessonStep === STEPS.length - 1) this.state.lessonStep = 0;
        this.timer = setInterval(() => {
            if (this.state.lessonStep >= STEPS.length - 1) { clearInterval(this.timer); this.state.viewedThroughEnd = true; this.render(); return; }
            this.state.lessonStep += 1;
            this.render();
        }, 1500);
    },

    renderAssessment() {
        this.root.innerHTML = `
            <div class="rer-heading"><h3>Reconstruct Cotranslational ER Targeting</h3><span class="rer-badge">Sequence + Match</span></div>
            <p>First arrange the six images from earliest to latest. Then match each image to the event it represents.</p>
            <div class="rer-sequence-list"></div>
            <div class="rer-controls"><button type="button" data-action="return">Review animation</button><button type="button" class="rer-check">Check sequence and matches</button></div>
            <p class="rer-status" role="status" aria-live="polite"></p>
            <section class="rer-save-area" ${this.state.checkedCorrect ? "" : "hidden"}>${this.sandbox ? "<p>Sequence complete. Re-examine mode does not save or award rewards.</p>" : `<label class="rer-reflection">Explain how SRP connects protein synthesis on a ribosome to movement of the growing polypeptide across the ER membrane.<textarea maxlength="1500" rows="4"></textarea></label><button type="button" class="rer-submit">Save Investigation</button>`}</section>`;
        this.status = this.root.querySelector(".rer-status");
        const list = this.root.querySelector(".rer-sequence-list");
        this.state.order.forEach((stepIndex, position) => list.appendChild(this.createSequenceCard(stepIndex, position)));
        this.bindAssessment();
        if (this.state.checkedCorrect) this.status.textContent = "Correct: all six images and descriptions form one continuous targeting and translocation process.";
    },

    createSequenceCard(stepIndex, position) {
        const card = document.createElement("article");
        card.className = `rer-sequence-card${this.state.checkedCorrect ? " rer-success" : ""}`;
        card.dataset.stepIndex = stepIndex;
        const controls = document.createElement("div");
        controls.className = "rer-order-controls";
        controls.innerHTML = `<strong>${position + 1}</strong><button type="button" class="rer-order-button" data-move="up" aria-label="Move image earlier" ${position === 0 ? "disabled" : ""}>↑</button><button type="button" class="rer-order-button" data-move="down" aria-label="Move image later" ${position === this.state.order.length - 1 ? "disabled" : ""}>↓</button>`;
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "rer-mini-model");
        svg.setAttribute("viewBox", "0 0 940 430");
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", `Unnumbered process image: ${STEPS[stepIndex].short}`);
        this.drawFrame(svg, stepIndex, true);
        const match = document.createElement("div");
        match.className = "rer-match";
        const selectId = `rer-match-${stepIndex}`;
        match.innerHTML = `<label for="${selectId}">Description for this image</label><select id="${selectId}" data-match-step="${stepIndex}"><option value="">Choose a description…</option>${STEPS.map(candidate => `<option value="${candidate.id}" ${this.state.matches[stepIndex] === candidate.id ? "selected" : ""}>${candidate.description}</option>`).join("")}</select>`;
        card.append(controls, svg, match);
        return card;
    },

    bindAssessment() {
        const signal = this.events.signal;
        const on = (node, type, callback) => node?.addEventListener(type, callback, { signal });
        for (const button of this.root.querySelectorAll("[data-move]")) {
            on(button, "click", () => {
                const card = button.closest(".rer-sequence-card");
                const index = this.state.order.indexOf(Number(card.dataset.stepIndex));
                const destination = button.dataset.move === "up" ? index - 1 : index + 1;
                [this.state.order[index], this.state.order[destination]] = [this.state.order[destination], this.state.order[index]];
                this.state.checkedCorrect = false;
                this.render();
            });
        }
        for (const select of this.root.querySelectorAll("[data-match-step]")) on(select, "change", () => { this.state.matches[select.dataset.matchStep] = select.value; this.state.checkedCorrect = false; });
        on(this.root.querySelector('[data-action="return"]'), "click", () => { this.state.mode = "lesson"; this.render(); });
        on(this.root.querySelector(".rer-check"), "click", () => this.checkAssessment());
        on(this.root.querySelector(".rer-submit"), "click", () => this.submit());
    },

    checkAssessment() {
        const orderCorrect = this.state.order.every((stepIndex, position) => stepIndex === position);
        const matchCount = STEPS.filter((step, index) => this.state.matches[index] === step.id).length;
        this.state.checkedCorrect = orderCorrect && matchCount === STEPS.length;
        this.render();
        if (!this.state.checkedCorrect) this.status.textContent = `${orderCorrect ? "Image order is correct." : "Some images are out of sequence."} ${matchCount} of ${STEPS.length} descriptions are matched correctly.`;
        return this.state.checkedCorrect;
    },

    element(svg, name, attrs = {}, parent = svg) {
        const node = document.createElementNS("http://www.w3.org/2000/svg", name);
        for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
        parent.appendChild(node);
        return node;
    },

    text(svg, x, y, value, size = 16, parent = svg) {
        const node = this.element(svg, "text", { x, y, fill: "#eff7ff", "font-size": size, "font-weight": 650, "text-anchor": "middle" }, parent);
        node.textContent = value;
    },

    drawFrame(svg, stepIndex, compact) {
        svg.replaceChildren();
        const labelSize = compact ? 21 : 17;
        this.text(svg, 470, 26, "CYTOSOL", labelSize);
        this.element(svg, "rect", { x: 25, y: 278, width: 890, height: 42, rx: 18, fill: "#70a9df", stroke: "#c5e7ff", "stroke-width": 4 });
        this.text(svg, 470, 356, "ER LUMEN", labelSize);
        this.drawMRNA(svg, stepIndex);
        this.drawRibosome(svg, stepIndex);
        this.drawPeptide(svg, stepIndex);
        if (stepIndex >= 1 && stepIndex <= 2) this.drawSRP(svg, stepIndex);
        if (stepIndex >= 2) this.drawTranslocon(svg, stepIndex);
        if (stepIndex >= 4) this.drawCleavage(svg, stepIndex);
        if (!compact) this.drawLabels(svg, stepIndex);
    },

    drawMRNA(svg, stepIndex) {
        const y = stepIndex < 2 ? 155 : 208;
        this.element(svg, "path", { d: `M95 ${y} C260 ${y - 25} 590 ${y + 28} 845 ${y - 5}`, fill: "none", stroke: "#e96767", "stroke-width": 11, "stroke-linecap": "round" });
    },

    drawRibosome(svg, stepIndex) {
        const docked = stepIndex >= 2;
        const x = docked ? 470 : 390;
        const y = docked ? 205 : 137;
        this.element(svg, "ellipse", { cx: x, cy: y, rx: 104, ry: 54, fill: "#9270b8", stroke: "#e1cefa", "stroke-width": 4 });
        this.element(svg, "ellipse", { cx: x, cy: y - 43, rx: 76, ry: 38, fill: "#b793dc", stroke: "#e1cefa", "stroke-width": 4 });
    },

    drawPeptide(svg, stepIndex) {
        if (stepIndex === 5) {
            this.element(svg, "path", { d: "M350 355 C315 382 350 410 395 385 C435 363 465 410 505 382 C545 354 575 400 620 374", fill: "none", stroke: "#718fe8", "stroke-width": 12, "stroke-linecap": "round" });
            return;
        }
        const beads = stepIndex === 0 ? 5 : stepIndex === 1 ? 6 : stepIndex === 2 ? 7 : stepIndex === 3 ? 10 : stepIndex === 4 ? 11 : 13;
        const docked = stepIndex >= 2;
        for (let index = 0; index < beads; index += 1) {
            let x;
            let y;
            if (!docked) { x = 388 + index * 3; y = 184 + index * 13; }
            else if (stepIndex < 3) { x = 470; y = 250 + index * 9; }
            else { x = 470 + Math.sin(index * 0.8) * 22; y = 248 + index * 11; }
            const signal = index >= beads - 3 && stepIndex <= 2;
            this.element(svg, "circle", { cx: x, cy: y, r: 8, fill: signal ? "#50d36c" : "#718fe8", stroke: "#eef8ff", "stroke-width": 2 });
        }
        if (stepIndex === 3 || stepIndex === 4) {
            this.element(svg, "line", { x1: 515, y1: 299, x2: 550, y2: 299, stroke: "#50d36c", "stroke-width": 13, "stroke-linecap": "round" });
        }
    },

    drawSRP(svg, stepIndex) {
        const x = stepIndex === 1 ? 425 : 555;
        const y = stepIndex === 1 ? 240 : 245;
        this.element(svg, "path", { d: `M${x - 35} ${y} Q${x} ${y - 45} ${x + 35} ${y} Q${x} ${y + 28} ${x - 35} ${y}`, fill: "#f1a44c", stroke: "#ffe0a0", "stroke-width": 3 });
    },

    drawTranslocon(svg, stepIndex) {
        this.element(svg, "rect", { x: 425, y: 270, width: 90, height: 60, rx: 12, fill: "#ef9990", stroke: "#ffd3cd", "stroke-width": 4 });
        this.element(svg, "rect", { x: 458, y: 270, width: 24, height: 60, fill: "#10202f" });
        this.element(svg, "ellipse", { cx: 560, cy: 284, rx: 26, ry: 19, fill: "#f3b06c", stroke: "#ffe5b5", "stroke-width": 3 });
        if (stepIndex === 2) this.element(svg, "ellipse", { cx: 565, cy: 248, rx: 22, ry: 17, fill: "#e8837a", stroke: "#ffd0ca", "stroke-width": 3 });
    },

    drawCleavage(svg, stepIndex) {
        if (stepIndex === 4) {
            this.element(svg, "path", { d: "M548 279 L573 304 M573 279 L548 304", fill: "none", stroke: "#fff06a", "stroke-width": 6, "stroke-linecap": "round" });
        }
        if (stepIndex === 5) {
            this.element(svg, "line", { x1: 515, y1: 299, x2: 540, y2: 299, stroke: "#50d36c", "stroke-width": 10, "stroke-linecap": "round", opacity: .55 });
        }
    },

    drawLabels(svg, stepIndex) {
        if (stepIndex <= 1) { this.text(svg, 265, 77, "free ribosome", 16); this.text(svg, 270, 245, "signal peptide", 16); }
        if (stepIndex === 1) this.text(svg, 545, 236, "SRP", 18);
        if (stepIndex >= 2) { this.text(svg, 630, 281, "SRP receptor", 15); this.text(svg, 355, 310, "translocation pore", 15); this.text(svg, 665, 320, "signal peptidase", 15); }
        if (stepIndex === 5) this.text(svg, 665, 390, "folding polypeptide", 16);
    },

    submit() {
        if (this.sandbox || this.state.saved || !this.state.checkedCorrect) return;
        const reflection = this.root.querySelector("textarea")?.value.trim() ?? "";
        if (reflection.length < 20) { this.status.textContent = "Record a short explanation before saving (at least 20 characters)."; return; }
        const backup = structuredClone(gameState);
        try {
            const completion = ResearchManager.completeExperiment(Catalog.id);
            if (!completion.completed) throw new Error(completion.reason);
            const report = { scorePoints: 100, scoreMaximum: 100, scorePercent: 100, isPerfect: true, checks: [
                { id: "six_images_ordered", passed: true, awardedPoints: 40, maximumPoints: 40 },
                { id: "six_descriptions_matched", passed: true, awardedPoints: 40, maximumPoints: 40 },
                { id: "srp_translocation_reflection", passed: true, awardedPoints: 20, maximumPoints: 20 }
            ] };
            const submission = SubmissionManager.recordSubmission({ experiment: Catalog, report, completion, placementSnapshot: { sequence: [...this.state.order], matches: structuredClone(this.state.matches) }, attemptSnapshot: { reflectionResponses: { rough_er_targeting_reflection: reflection }, observations: { translationStartsOnFreeRibosome: true, srpPausesAndTargets: true, ribosomeDocksAtTranslocon: true, translationAndTranslocationAreCoupled: true, signalPeptideCleaved: true, polypeptideReleasedIntoERLumen: true } } });
            if (!submission || !SaveManager.save({ reason: "rough-er-protein-targeting" })) throw new Error("save-failed");
            this.state.saved = true;
            this.root.querySelector(".rer-submit").disabled = true;
            this.status.textContent = `Investigation saved: 100 / 100. ${completion.xpAwarded} XP awarded. Golgi routing is now revealed as the next Coming Soon milestone.`;
            OrganelleExperimentPanel.refresh();
        } catch (error) {
            for (const key of Object.keys(gameState)) delete gameState[key];
            Object.assign(gameState, backup);
            this.status.textContent = "Saving failed. Your completed sequence and explanation remain here; retry Save Investigation.";
        }
    },

    renderReview() {
        const record = SubmissionManager.getSubmissions(Catalog.id).at(-1);
        const reflection = record?.attemptSnapshot?.reflectionResponses?.rough_er_targeting_reflection ?? "No response saved.";
        this.root.innerHTML = record ? `<h3>Targeting Proteins to the Rough ER — ${record.scorePoints} / ${record.scoreMaximum}</h3><ol>${STEPS.map(step => `<li><strong>${step.short}:</strong> ${step.description}</li>`).join("")}</ol><p><strong>Your explanation:</strong> ${this.escape(reflection)}</p>` : "No Rough ER protein-targeting submission is available.";
    },

    escape(value) {
        return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
    }
};

export { STEPS as ROUGH_ER_TARGETING_STEPS, STARTING_ORDER as ROUGH_ER_STARTING_ORDER };
export default RoughERProteinTargetingView;
