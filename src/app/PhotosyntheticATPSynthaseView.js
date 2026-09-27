import Catalog from "./PhotosyntheticATPSynthaseCatalog.js";
import ResearchManager from "./ResearchManager.js";
import SubmissionManager from "./OrganelleExperimentSubmissionManager.js";
import OrganelleExperimentPanel from "./OrganelleExperimentPanel.js";
import SaveManager from "./SaveManager.js";
import gameState from "./GameState.js";
import { randomizedOptions } from "./PhotosystemIIQuizOptions.js";
import { hasPerfectLightReactions } from "./LightReactionsReward.js";

export const TOTAL_PROTONS = 10;
export const PROTONS_PER_ATP = 5; // Classroom animation budget; ring size and H+/ATP vary between organelles.
export const ASSEMBLY_STEPS = Object.freeze([
    { id: "c-ring", label: "c rotor ring", detail: "A ring of proton-binding c subunits rotates inside the membrane. Ring size differs between organelles." },
    { id: "a", label: "a channel", detail: "Subunit a forms two separate half channels beside the c ring: one for proton entry and one for exit." },
    { id: "epsilon", label: "ε connector", detail: "Epsilon links the c ring to the central shaft and helps regulate the motor." },
    { id: "gamma", label: "γ central shaft", detail: "Gamma turns with the c ring and changes the catalytic head's shape." },
    { id: "alpha", label: "α head subunits", detail: "Three alpha subunits help form the ATP-making head." },
    { id: "beta", label: "β catalytic subunits", detail: "Three beta subunits bind ADP and Pi and catalyze ATP synthesis." },
    { id: "b-stalk", label: "peripheral stalk", detail: "The outer stalk holds the catalytic head steady while the central rotor turns." },
    { id: "delta", label: "head connector", detail: "A connector secures the peripheral stalk to the catalytic head; the exact subunits differ between organelles." }
]);
export function atpContext(organelleId) {
    return organelleId === "mitochondria"
        ? { organelleId: "mitochondria", highSide: "INTERMEMBRANE SPACE", lowSide: "MATRIX", entry: "intermembrane space", exit: "matrix", membrane: "inner mitochondrial membrane" }
        : { organelleId: "symbiosomes", highSide: "THYLAKOID LUMEN", lowSide: "STROMA", entry: "thylakoid lumen", exit: "stroma", membrane: "thylakoid membrane" };
}
export function protonPosition(index) {
    return { x: 375 + index % 5 * 125, y: 525 + Math.floor(index / 5) * 60 };
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
const label = (x, y, content, visible) => visible ? `<text x="${x}" y="${y}" text-anchor="middle" class="atp-part-label">${content}</text>` : "";
function partArt(id, visible, used, turning) {
    const rotorStyle = `--atp-rotor-start:${used * 30}deg;--atp-rotor-end:${(used + 1) * 30}deg`;
    switch (id) {
        case "c-ring": return `<g class="atp-c-ring ${turning ? "atp-c-ring-turn" : ""}" style="${rotorStyle}"><circle cx="600" cy="393" r="60" fill="#a369b6" stroke="#5b3474" stroke-width="5"/>${Array.from({ length: 12 }, (_, i) => { const angle = 2 * Math.PI * i / 12; const x = 600 + 48 * Math.cos(angle), y = 393 + 48 * Math.sin(angle); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="${i % 2 ? "#ca93d2" : "#8f5ca9"}" stroke="#5b3474" stroke-width="2"/>`; }).join("")}${label(600, 399, "c", visible)}</g>`;
        case "a": return `<g class="atp-a"><path d="M516 308 Q484 318 487 356 L487 427 Q489 454 525 451 L553 433 Q520 420 522 399 L522 354 Q526 330 555 329 Z" fill="#a6d47c" stroke="#477540" stroke-width="5"/>${label(495, 371, "a", visible)}<path d="M519 438 V401 M530 369 V321" fill="none" stroke="#eaf9b9" stroke-width="8" stroke-linecap="round"/></g>`;
        case "epsilon": return `<g><ellipse cx="615" cy="325" rx="25" ry="20" fill="#bdb9a8" stroke="#5e5b55" stroke-width="4"/>${label(615, 332, "ε", visible)}</g>`;
        case "gamma": return `<g class="atp-gamma ${turning ? "atp-gamma-turn" : ""}"><rect x="589" y="232" width="22" height="99" rx="9" fill="#d2c89f" stroke="#5f5a4a" stroke-width="4"/>${label(600, 289, "γ", visible)}</g>`;
        case "alpha": return `<g class="atp-head-alpha ${turning ? "atp-head-pulse" : ""}">${[[549, 185], [651, 185], [600, 130]].map(([x,y]) => `<ellipse cx="${x}" cy="${y}" rx="46" ry="42" fill="#726fd0" stroke="#433fa1" stroke-width="4"/>${label(x, y + 8, "α", visible)}`).join("")}</g>`;
        case "beta": return `<g class="atp-head-beta ${turning ? "atp-head-pulse" : ""}">${[[600, 196], [550, 130], [650, 130]].map(([x,y]) => `<ellipse cx="${x}" cy="${y}" rx="45" ry="43" fill="#76a1d6" stroke="#396b9d" stroke-width="4"/>${label(x, y + 8, "β", visible)}`).join("")}</g>`;
        case "b-stalk": return `<g><path d="M510 300 Q475 282 475 233 L475 148 Q475 110 518 106" fill="none" stroke="#e79b56" stroke-width="19" stroke-linecap="round"/>${label(480, 208, "stalk", visible)}</g>`;
        case "delta": return `<g><path d="M526 102 Q600 60 674 102 L658 122 Q600 94 542 122 Z" fill="#e7ca64" stroke="#946b18" stroke-width="4"/>${label(600, 104, "δ", visible)}</g>`;
        default: return "";
    }
}
const membrane = () => `<g class="psii-heads">${Array.from({ length: 20 }, (_, i) => 25 + i * 50).map(x => `<ellipse cx="${x}" cy="317" rx="18" ry="14"/><ellipse cx="${x}" cy="440" rx="18" ry="14"/>`).join("")}</g><g class="psii-tails">${Array.from({ length: 40 }, (_, i) => 13 + i * 25).map(x => `<path d="M${x} 336 q-9 21 0 41 t0 43 M${x} 420 q9-22 0-43 t0-41"/>`).join("")}</g>`;
const proton = (x, y, id, motion) => `<g data-atp-proton="${id}" class="${motion ? `atp-proton-${motion}` : ""}" style="--atp-source-x:${x}px;--atp-source-y:${y}px;--atp-entry-x:${520 - x}px;--atp-entry-y:${425 - y}px"><circle cx="${x}" cy="${y}" r="18" class="water-proton"/><text x="${x}" y="${y + 6}" text-anchor="middle" class="water-proton-label">H⁺</text></g>`;
const bolt = () => `<g transform="translate(600 100)"><path d="M-10 -25 H7 L0 -5 H16 L-12 29 L-4 3 H-18 Z" fill="#ffe453" stroke="#8c5811" stroke-width="3"/><text x="25" y="8" class="atp-bolt-label">ATP</text></g>`;

const View = {
    root: null, controls: null, events: null, generation: 0,
    clear() {
        this.generation++; this.events?.abort(); this.events = null;
        this.root = null; this.controls = null;
    },
    mount(container, { controlsElement = null, sandbox = false, review = false, organelleId = "symbiosomes" } = {}) {
        this.clear(); this.container = container; this.controlContainer = controlsElement;
        this.sandbox = sandbox; this.organelleId = organelleId; this.assembled = new Set(); this.assemblyIndex = 0;
        this.showLabels = true; this.used = 0; this.produced = 0;
        this.currentProton = null; this.motion = ""; this.phase = "assembly";
        this.flightDegrees = 0; this.answers = {};
        this.optionOrder = randomizedOptions(Catalog.assessment.questions); this.result = null;
        this.root = document.createElement("section"); this.root.className = "psii-lab atp-lab";
        container.replaceChildren(this.root); this.controls = controlsElement;
        if (review) {
            const latest = SubmissionManager.getSubmissions(Catalog.id).at(-1);
            const best = SubmissionManager.getBestScore(Catalog.id) ?? latest;
            this.root.innerHTML = latest
                ? `<div class="psii-intro"><h3>Assemble F-ATPase submission</h3><p>Latest score: ${latest.scorePoints}/${latest.scoreMaximum} (${latest.scorePercent}%).</p><p>Highest score: ${best.scorePoints}/${best.scoreMaximum} (${best.scorePercent}%).</p></div>`
                : '<div class="psii-intro">No saved submission is available.</div>';
            return;
        }
        this.events = new AbortController(); const { signal } = this.events;
        this.controls?.addEventListener("click", event => {
            if (event.target.closest("[data-atp-assemble]")) void this.assemble();
            if (event.target.closest("[data-atp-operate]")) void this.operate();
            if (event.target.closest("[data-atp-labels]")) { this.showLabels = !this.showLabels; this.render(); }
            if (event.target.closest("[data-atp-reset]")) this.mount(this.container, { controlsElement: this.controlContainer, sandbox: this.sandbox, organelleId: this.organelleId });
        }, { signal });
        this.root.addEventListener("click", event => {
            if (event.target.closest("[data-atp-submit]")) return void this.submit();
            if (event.target.closest("[data-atp-retry]")) {
                this.answers = {}; this.result = null;
                this.optionOrder = randomizedOptions(Catalog.assessment.questions); this.render();
            }
        }, { signal });
        this.root.addEventListener("change", event => {
            const input = event.target.closest("input[data-atp-question]"); if (!input) return;
            this.answers[input.dataset.atpQuestion] = input.value;
            const submit = this.root.querySelector("[data-atp-submit]");
            if (submit) submit.disabled = Catalog.assessment.questions.some(q => !this.answers[q.id]);
        }, { signal });
        this.render();
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
    async assemble() {
        if (this.phase !== "assembly" || this.assemblyIndex >= ASSEMBLY_STEPS.length) return;
        const token = this.generation;
        const part = ASSEMBLY_STEPS[this.assemblyIndex];
        this.phase = "assembling";
        if (!await this.step("glide", 1050, token)) return;
        this.assembled.add(part.id); this.assemblyIndex++;
        this.motion = "";
        this.phase = this.assemblyIndex === ASSEMBLY_STEPS.length ? "ready" : "assembly";
        this.render();
    },
    async operate() {
        if (this.phase !== "ready" || this.assembled.size !== ASSEMBLY_STEPS.length || this.used !== 0) return;
        const token = this.generation; this.phase = "running";
        for (let turn = 0; turn < 2; turn++) {
            if (!await this.step("binding", 1100, token)) return;
            for (let count = 0; count < PROTONS_PER_ATP; count++) {
                this.currentProton = this.used;
                for (const motion of ["inlet", "bind-c", "rotate", "exit"]) {
                    if (!await this.step(motion, motion === "rotate" ? 800 : 600, token)) return;
                }
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
            const completion = passes && !alreadyCompleted ? ResearchManager.completeExperiment(Catalog.id, this.organelleId) : null;
            if (passes && !alreadyCompleted && !completion?.completed)
                throw new Error(completion?.reason ?? "completion-failed");
            const submission = SubmissionManager.recordSubmission({ experiment: Catalog, report, completion,
                placementSnapshot: { assembledParts: [...this.assembled] },
                attemptSnapshot: { answers: { ...this.answers }, organelleId: this.organelleId, protonsUsed: this.used, atpProduced: this.produced } });
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
        const next = ASSEMBLY_STEPS[this.assemblyIndex] ?? null;
        const context = atpContext(this.organelleId);
        const status = message || ({
            assembly: `Read the component at left, then press Assemble. ${this.assemblyIndex}/${ASSEMBLY_STEPS.length} parts placed.`,
            assembling: `${next?.label ?? "Component"} is gliding into position.`,
            ready: "All eight component groups are assembled. Press Operate to bring in ADP and Pi.",
            running: this.motion === "binding" ? `ADP and Pi are binding at the ${context.exit} catalytic head.` :
                this.motion === "product" ? `ATP ${this.produced + 1} is leaving into the ${context.exit}.` :
                    `H⁺ ${this.used + 1}/10: ${this.motion === "inlet" ? `entering the a channel from the ${context.entry}` : this.motion === "bind-c" ? "binding the c ring" : this.motion === "rotate" ? "turning with the c ring and γ shaft" : `leaving through the a channel into the ${context.exit}`}.`,
            done: "All ten H⁺ passed through. The rotor stopped after two ATP were produced. Answer the questions below."
        }[this.phase]);
        const turn = this.phase === "running" && this.motion === "rotate";
        const completed = ASSEMBLY_STEPS.filter(part => this.assembled.has(part.id))
            .map(part => partArt(part.id, this.showLabels, this.used, turn)).join("");
        const preview = next && this.phase === "assembly" ? `<g class="atp-preview-part" transform="translate(-430 0)">${partArt(next.id, this.showLabels, this.used, false)}</g>` : "";
        const flying = next && this.phase === "assembling" ? `<g class="atp-part-glide">${partArt(next.id, this.showLabels, this.used, false)}</g>` : "";
        const protons = Array.from({ length: TOTAL_PROTONS }, (_, index) => {
            if (index < this.used) return "";
            const { x, y } = protonPosition(index);
            return proton(x, y, index, index === this.currentProton ? this.motion : "");
        }).join("");
        const masteryMessage = this.result && !this.sandbox && hasPerfectLightReactions()
            ? " All symbiosome experiments scored 100%. Light Reactions achieved! Go to metabolics to build sugars with your ATP and NADPH."
            : "";
        const quiz = this.phase === "done" ? `<section class="psii-quiz"><h3>Check your ATP model</h3><p>Answer all five questions and submit for a saved score.</p>${Catalog.assessment.questions.map((q, i) => `<fieldset><legend>${i + 1}. ${q.prompt}</legend>${(this.optionOrder?.get(q.id) ?? q.options).map(o => `<label><input type="radio" name="${q.id}" data-atp-question="${q.id}" value="${o.id}" ${this.answers[q.id] === o.id ? "checked" : ""} ${this.result ? "disabled" : ""}> ${o.text}</label>`).join("")}</fieldset>`).join("")}${this.result ? `<p class="psii-score" role="status">Score: ${this.result.scorePoints}/${this.result.scoreMaximum} (${this.result.scorePercent}%). ${this.result.isPerfect ? this.sandbox ? "Perfect re-examination; saved progress is unchanged." : "Perfect score." : "Review the model and try again."}${masteryMessage}</p>${this.result.isPerfect ? "" : '<button type="button" data-atp-retry>Try questions again</button>'}` : `<button type="button" data-atp-submit ${Catalog.assessment.questions.some(q => !this.answers[q.id]) ? "disabled" : ""}>Submit for Score</button>`}</section>` : "";
        this.root.innerHTML = `<div class="psii-intro"><p><strong>Assemble F-ATPase:</strong> Build the F-type enzyme in the ${context.membrane}. During ATP synthesis, H⁺ moves from the ${context.entry} to the ${context.exit}, turning the c ring and γ shaft. The stationary α/β head changes shape to release ATP. This animation uses 10 H⁺ to show two ATP releases; the actual H⁺/ATP ratio and c-ring size differ between chloroplasts and mitochondria.</p><p class="psii-progress" role="status" aria-live="polite">${status}</p></div>
        <div class="psii-workspace"><div class="psii-board"><svg viewBox="0 0 1000 650" role="img" aria-label="Guided assembly and proton-driven operation of F-type ATP synthase"><rect width="1000" height="650" rx="24" class="psii-background"/><text x="30" y="55" class="psii-side-label">${context.lowSide}</text><text x="30" y="632" class="psii-side-label">${context.highSide}</text>${membrane()}
        ${next ? `<rect x="23" y="77" width="285" height="430" rx="15" class="atp-preview-box"/><text x="165" y="105" text-anchor="middle" class="atp-preview-title">NEXT COMPONENT</text>` : ""}${preview}${flying}
        ${completed}
        ${protons}
        ${this.phase === "running" ? `<path d="M520 479 V423 L555 393 Q635 463 651 393 Q640 347 530 369 V283" class="atp-proton-guide"/>` : ""}
        ${this.motion === "binding" ? `<g class="atp-adp-bind"><circle cx="340" cy="90" r="31" class="atp-substrate"/><text x="340" y="97" text-anchor="middle" class="atp-substrate-label">ADP</text></g><g class="atp-pi-bind"><circle cx="425" cy="90" r="27" class="atp-substrate"/><text x="425" y="97" text-anchor="middle" class="atp-substrate-label">Pi</text></g>` : this.phase === "running" && this.motion !== "product" ? `<g><circle cx="522" cy="108" r="25" class="atp-substrate"/><text x="522" y="116" text-anchor="middle" class="atp-substrate-label">ADP</text><circle cx="678" cy="108" r="25" class="atp-substrate"/><text x="678" y="116" text-anchor="middle" class="atp-substrate-label">Pi</text></g>` : ""}
        ${this.motion === "product" ? `<g class="atp-product-flight" style="--atp-flight-x:${Math.tan(this.flightDegrees * Math.PI / 180) * 250}px">${bolt()}</g>` : ""}
        <text x="795" y="72" class="atp-count">H⁺: ${TOTAL_PROTONS - this.used}/10</text><text x="795" y="105" class="atp-count">ATP: ${this.produced}/2</text>
        </svg></div><div class="psii-tray organelle-experiment-material-tray"><h3>${next ? `${this.assemblyIndex + 1}. ${next.label}` : "F-type ATP synthase"}</h3><p>${next ? next.detail : "Assembly complete. The central c ring and γ shaft rotate; α and β stay in the head and change shape as ATP is made."}</p><p>${next ? "Read this part, then press Assemble. It glides from the preview box into the enzyme." : `Operate uses two rounds of ADP + Pi and five H⁺ each from the ${context.entry}. The yellow ATP bolts leave upward.`}</p><details class="atp-reference"><summary>View F-ATPase reference figure</summary><img src="${Catalog.figure}" alt="F-type ATPase structure, with arrows for the reverse proton-pumping mode"/><p>The reference arrows show proton pumping. In this activity, H⁺ travels upward through the enzyme to make ATP.</p></details></div></div>${quiz}`;
        if (this.controls) this.controls.innerHTML = `${this.phase === "assembly" || this.phase === "assembling" ? `<button type="button" class="psii-header-button ${this.phase === "assembly" ? "water-action-ready" : ""}" data-atp-assemble ${this.phase !== "assembly" ? "disabled" : ""}>Assemble ${next?.label ?? "part"}</button>` : ""}<button type="button" class="psii-header-button ${this.phase === "ready" ? "water-action-ready" : ""}" data-atp-operate ${this.phase !== "ready" ? "disabled" : ""}>Operate</button><button type="button" class="psii-header-button" data-atp-labels aria-pressed="${!this.showLabels}">${this.showLabels ? "Hide labels" : "Show labels"}</button><button type="button" class="psii-header-button" data-atp-reset>Reset model</button>`;
    }
};
export default View;
