import Catalog from "./PhotosyntheticATPSynthaseCatalog.js";
import ResearchManager from "./ResearchManager.js";
import SubmissionManager from "./OrganelleExperimentSubmissionManager.js";
import OrganelleExperimentPanel from "./OrganelleExperimentPanel.js";
import SaveManager from "./SaveManager.js";
import gameState from "./GameState.js";
import { randomizedOptions } from "./PhotosystemIIQuizOptions.js";

export const TOTAL_PROTONS = 10;
export const PROTONS_PER_ATP = 5; // Rounded classroom model: chloroplast c14 ring makes 3 ATP per 14 H+.
export function protonPosition(index) {
    return { x: 125 + index % 5 * 145, y: 467 + Math.floor(index / 5) * 75 };
}
export function flightAngle(random = Math.random) { return (random() * 2 - 1) * 20; }
export function scoreAnswers(answers) {
    const checks = Catalog.assessment.questions.map(question => {
        const passed = answers[question.id] === question.correctOptionId;
        return { id: question.id, selectedOptionId: answers[question.id] ?? null,
            correctOptionId: question.correctOptionId, passed, awardedPoints: passed ? 1 : 0, maximumPoints: 1 };
    });
    const scorePoints = checks.filter(check => check.passed).length;
    return { checks, scorePoints, scoreMaximum: checks.length,
        scorePercent: scorePoints / checks.length * 100, isPerfect: scorePoints === checks.length };
}
const towerArt = `<svg viewBox="0 0 100 110" aria-hidden="true"><rect x="39" y="52" width="22" height="53" rx="4" fill="#df792f" stroke="#5f2a0f" stroke-width="3"/><ellipse cx="50" cy="47" rx="38" ry="36" fill="#f4a354" stroke="#71350f" stroke-width="4"/><path d="M29 42 Q50 61 71 42" fill="none" stroke="#803a14" stroke-width="3"/></svg>`;
const membrane = () => `<g class="psii-heads">${Array.from({ length: 18 }, (_, i) => 25 + i * 50).map(x => `<ellipse cx="${x}" cy="245" rx="18" ry="14"/><ellipse cx="${x}" cy="382" rx="18" ry="14"/>`).join("")}</g><g class="psii-tails">${Array.from({ length: 36 }, (_, i) => 13 + i * 25).map(x => `<path d="M${x} 265 q-9 22 0 44 t0 49 M${x} 363 q9-24 0-49 t0-49"/>`).join("")}</g>`;
const proton = (x, y, id, flight = false) => `<g data-atp-proton="${id}" class="${flight ? "atp-proton-flight" : ""}" ${flight ? `style="--atp-dx:${450 - x}px;--atp-dy:${205 - y}px"` : ""}><circle cx="${x}" cy="${y}" r="20" class="water-proton"/><text x="${x}" y="${y + 6}" text-anchor="middle" class="water-proton-label">H⁺</text></g>`;
const bolt = (x, y, scale = 1) => `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M-10 -25 H7 L0 -5 H16 L-12 29 L-4 3 H-18 Z" fill="#ffe453" stroke="#8c5811" stroke-width="3"/><text x="25" y="8" class="atp-bolt-label">ATP</text></g>`;

const View = {
    root: null, controls: null, events: null, dragging: null, generation: 0,
    clear() {
        this.generation++;
        this.events?.abort(); this.events = null;
        this.dragging?.ghost.remove(); this.dragging = null;
        this.root = null; this.controls = null; this.selected = false;
    },
    mount(container, { controlsElement = null, sandbox = false, review = false } = {}) {
        this.clear(); this.container = container; this.controlContainer = controlsElement;
        this.sandbox = sandbox; this.placed = false; this.selected = false;
        this.used = 0; this.produced = 0; this.currentProton = null;
        this.motion = ""; this.phase = "setup"; this.flightDegrees = 0;
        this.answers = {}; this.optionOrder = randomizedOptions(Catalog.assessment.questions);
        this.result = null;
        this.root = document.createElement("section"); this.root.className = "psii-lab atp-lab";
        container.replaceChildren(this.root); this.controls = controlsElement;
        if (review) {
            const latest = SubmissionManager.getSubmissions(Catalog.id).at(-1);
            const best = SubmissionManager.getBestScore(Catalog.id) ?? latest;
            this.root.innerHTML = latest
                ? `<div class="psii-intro"><h3>Generate ATP submission</h3><p>Latest score: ${latest.scorePoints}/${latest.scoreMaximum} (${latest.scorePercent}%).</p><p>Highest score: ${best.scorePoints}/${best.scoreMaximum} (${best.scorePercent}%).</p></div>`
                : '<div class="psii-intro">No saved submission is available.</div>';
            return;
        }
        this.events = new AbortController(); const { signal } = this.events;
        this.controls?.addEventListener("click", event => {
            if (event.target.closest("[data-atp-operate]")) void this.operate();
            if (event.target.closest("[data-atp-reset]")) this.mount(this.container, { controlsElement: this.controlContainer, sandbox: this.sandbox });
        }, { signal });
        this.root.addEventListener("pointerdown", event => {
            const source = event.target.closest("[data-atp-source]");
            if (!source || source.disabled) return;
            event.preventDefault(); this.selected = true;
            const ghost = document.createElement("div"); ghost.className = "psii-drag-ghost";
            ghost.setAttribute("aria-hidden", "true"); ghost.innerHTML = towerArt;
            document.body.appendChild(ghost); this.dragging = { ghost };
            this.moveGhost(event);
        }, { signal });
        window.addEventListener("pointermove", event => this.moveGhost(event), { signal });
        window.addEventListener("pointerup", event => {
            if (!this.dragging) return;
            this.dragging.ghost.remove(); this.dragging = null;
            const target = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-atp-target]");
            if (target && this.root.contains(target)) this.place(); else this.render();
        }, { signal });
        this.root.addEventListener("click", event => {
            if (event.target.closest("[data-atp-submit]")) return void this.submit();
            if (event.target.closest("[data-atp-retry]")) {
                this.answers = {}; this.result = null;
                this.optionOrder = randomizedOptions(Catalog.assessment.questions); this.render(); return;
            }
            const source = event.target.closest("[data-atp-source]");
            if (source && !source.disabled) { this.selected = true; this.render(); return; }
            if (event.target.closest("[data-atp-target]") && this.selected) this.place();
        }, { signal });
        this.root.addEventListener("change", event => {
            const input = event.target.closest("input[data-atp-question]"); if (!input) return;
            this.answers[input.dataset.atpQuestion] = input.value;
            const submit = this.root.querySelector("[data-atp-submit]");
            if (submit) submit.disabled = Catalog.assessment.questions.some(q => !this.answers[q.id]);
        }, { signal });
        this.render();
    },
    moveGhost(event) {
        if (this.dragging) { this.dragging.ghost.style.left = `${event.clientX}px`; this.dragging.ghost.style.top = `${event.clientY}px`; }
    },
    place() {
        if (this.phase !== "setup" || this.placed) return;
        this.placed = true; this.selected = false; this.phase = "ready"; this.render();
    },
    async pause(ms, token) {
        await new Promise(resolve => setTimeout(resolve, ms));
        return token === this.generation && Boolean(this.root);
    },
    async step(motion, ms, token) {
        if (token !== this.generation || !this.root) return false;
        this.motion = motion; this.render();
        return this.pause(ms, token);
    },
    async operate() {
        if (this.phase !== "ready" || !this.placed || this.used !== 0) return;
        const token = this.generation; this.phase = "running";
        for (let turn = 0; turn < 2; turn++) {
            if (!await this.step("binding", 1200, token)) return;
            for (let count = 0; count < PROTONS_PER_ATP; count++) {
                this.currentProton = this.used;
                if (!await this.step("proton", 750, token)) return;
                this.used++; this.currentProton = null;
            }
            this.flightDegrees = flightAngle();
            if (!await this.step("product", 1350, token)) return;
            this.produced++;
        }
        this.motion = ""; this.phase = "done"; this.render();
    },
    submit() {
        if (this.phase !== "done" || this.result || Catalog.assessment.questions.some(q => !this.answers[q.id])) return;
        const report = scoreAnswers(this.answers);
        if (this.sandbox) { this.result = report; this.render(); return; }
        const backup = structuredClone(gameState);
        try {
            const passes = ResearchManager.meetsCompletionThreshold(Catalog, report);
            const alreadyCompleted = ResearchManager.isExperimentCompleted(Catalog.id);
            const completion = passes && !alreadyCompleted ? ResearchManager.completeExperiment(Catalog.id) : null;
            if (passes && !alreadyCompleted && !completion?.completed)
                throw new Error(completion?.reason ?? "completion-failed");
            const submission = SubmissionManager.recordSubmission({ experiment: Catalog, report, completion,
                placementSnapshot: { atpSynthase: this.placed },
                attemptSnapshot: { answers: { ...this.answers }, protonsUsed: this.used, atpProduced: this.produced } });
            if (!submission || !SaveManager.save({ reason: "photosynthetic-atp-synthase-submission" })) throw new Error("save-failed");
            this.result = report; OrganelleExperimentPanel.refresh(); this.render();
        } catch {
            for (const key of Object.keys(gameState)) delete gameState[key];
            Object.assign(gameState, backup);
            this.render("Score could not be saved. Please try Submit for Score again.");
        }
    },
    render(message = "") {
        if (!this.root) return;
        const status = message || ({
            setup: "Drag ATP synthase onto the dotted membrane target, or select its card and then the target.",
            ready: "Ten H⁺ are in the lumen. Press Operate to bring in ADP and Pi.",
            running: this.motion === "binding" ? "ADP and Pi are binding on the stromal side." :
                this.motion === "proton" ? `H⁺ ${this.used + 1} of 10 is passing from lumen to stroma.` :
                    `ATP ${this.produced + 1} is released into the stroma.`,
            done: "All ten H⁺ passed through. ATP synthase stopped after producing two ATP. Answer the questions below."
        }[this.phase]);
        const protons = Array.from({ length: TOTAL_PROTONS }, (_, index) => {
            if (index < this.used) return "";
            const { x, y } = protonPosition(index);
            return proton(x, y, index, this.motion === "proton" && this.currentProton === index);
        }).join("");
        const quiz = this.phase === "done" ? `<section class="psii-quiz"><h3>Check your ATP model</h3><p>Answer all five questions and submit for a saved score.</p>${Catalog.assessment.questions.map((q, i) => `<fieldset><legend>${i + 1}. ${q.prompt}</legend>${(this.optionOrder?.get(q.id) ?? q.options).map(o => `<label><input type="radio" name="${q.id}" data-atp-question="${q.id}" value="${o.id}" ${this.answers[q.id] === o.id ? "checked" : ""} ${this.result ? "disabled" : ""}> ${o.text}</label>`).join("")}</fieldset>`).join("")}${this.result ? `<p class="psii-score" role="status">Score: ${this.result.scorePoints}/${this.result.scoreMaximum} (${this.result.scorePercent}%). ${this.result.isPerfect ? this.sandbox ? "Perfect re-examination; saved progress is unchanged." : "Perfect score." : "Review the model and try again."}</p>${this.result.isPerfect ? "" : '<button type="button" data-atp-retry>Try questions again</button>'}` : `<button type="button" data-atp-submit ${Catalog.assessment.questions.some(q => !this.answers[q.id]) ? "disabled" : ""}>Submit for Score</button>`}</section>` : "";
        this.root.innerHTML = `<div class="psii-intro"><p><strong>Generate ATP:</strong> Place orange ATP synthase across the thylakoid membrane. ADP and Pi bind in the stroma as H⁺ flows from the lumen. This classroom model rounds the chloroplast ratio to 5 H⁺ per ATP; actual chloroplast ATP synthase uses about 14 H⁺ per 3 ATP.</p><p class="psii-progress" role="status" aria-live="polite">${status}</p></div>
        <div class="psii-workspace"><div class="psii-board"><svg viewBox="0 0 900 600" role="img" aria-label="Thylakoid membrane with ten lumen protons and ATP synthase"><rect width="900" height="600" rx="24" class="psii-background"/><text x="30" y="62" class="psii-side-label">STROMA</text><text x="30" y="580" class="psii-side-label">THYLAKOID LUMEN</text>${membrane()}
        ${this.placed ? `<g class="atp-tower ${this.phase === "running" && this.motion === "proton" ? "atp-tower-turn" : ""}" role="img" aria-label="ATP synthase with catalytic head in the stroma and proton channel across the membrane"><rect x="425" y="236" width="50" height="159" rx="8" class="atp-tower-stem"/><ellipse cx="450" cy="184" rx="80" ry="66" class="atp-tower-head"/><path d="M400 178 Q450 216 500 178" class="atp-tower-seam"/><text x="450" y="192" text-anchor="middle" class="atp-tower-label">ATP synthase</text></g>` : `<g data-atp-target role="button" aria-label="Place ATP synthase"><rect x="425" y="236" width="50" height="159" rx="8" class="atp-tower-target"/><ellipse cx="450" cy="184" rx="80" ry="66" class="atp-tower-target"/><text x="450" y="193" text-anchor="middle" class="psii-small-label">ATP synthase</text></g>`}
        ${protons}
        ${this.motion === "binding" ? `<g class="atp-adp-bind"><circle cx="175" cy="105" r="35" class="atp-substrate"/><text x="175" y="113" text-anchor="middle" class="atp-substrate-label">ADP</text></g><g class="atp-pi-bind"><circle cx="275" cy="105" r="29" class="atp-substrate"/><text x="275" y="113" text-anchor="middle" class="atp-substrate-label">Pi</text></g>` : this.motion === "proton" ? `<g><circle cx="400" cy="115" r="25" class="atp-substrate"/><text x="400" y="122" text-anchor="middle" class="atp-substrate-label">ADP</text><circle cx="500" cy="115" r="25" class="atp-substrate"/><text x="500" y="122" text-anchor="middle" class="atp-substrate-label">Pi</text></g>` : ""}
        ${this.motion === "product" ? `<g class="atp-product-flight" style="--atp-flight-x:${Math.tan(this.flightDegrees * Math.PI / 180) * 240}px">${bolt(450, 108)}</g>` : ""}
        <text x="745" y="72" class="atp-count">H⁺: ${TOTAL_PROTONS - this.used}/10</text><text x="745" y="102" class="atp-count">ATP: ${this.produced}/2</text>
        </svg></div><div class="psii-tray organelle-experiment-material-tray"><h3>Materials</h3><div class="psii-material-list organelle-experiment-material-list"><div class="organelle-experiment-material psii-material-card"><button type="button" class="psii-source ${this.selected ? "selected" : ""}" data-atp-source aria-label="Drag ATP synthase" ${this.placed ? "disabled" : ""}>${towerArt}</button><span class="organelle-experiment-material-name">ATP synthase</span></div></div><p>Position the enzyme first. Operate uses two rounds of ADP + Pi and five H⁺ each. The yellow ATP bolts leave upward; the tenth H⁺ stops the model.</p></div></div>${quiz}`;
        if (this.controls) this.controls.innerHTML = `<button type="button" class="psii-header-button ${this.phase === "ready" ? "water-action-ready" : ""}" data-atp-operate ${this.phase !== "ready" ? "disabled" : ""}>Operate</button><button type="button" class="psii-header-button" data-atp-reset>Reset model</button>`;
    }
};
export default View;
