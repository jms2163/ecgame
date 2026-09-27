import Catalog from "./PhotosystemIExcitationCatalog.js";
import ResearchManager from "./ResearchManager.js";
import SubmissionManager from "./OrganelleExperimentSubmissionManager.js";
import OrganelleExperimentPanel from "./OrganelleExperimentPanel.js";
import SaveManager from "./SaveManager.js";
import gameState from "./GameState.js";
import { randomizedOptions } from "./PhotosystemIIQuizOptions.js";

const ANTENNA = [[345, 210], [315, 280], [355, 355], [555, 210], [585, 280], [545, 355]];
const PARTS = ["psi", "acceptor", "p700", "fd", ...ANTENNA.map((_, i) => `chl${i}`)];
export function chooseAntenna(random = Math.random) {
    return Math.min(ANTENNA.length - 1, Math.max(0, Math.floor(random() * ANTENNA.length)));
}
export function antennaPath(start) {
    const branches = [[0, 1, 2], [1, 2], [2], [3, 4, 5], [4, 5], [5]];
    return branches[start] ?? [];
}
const labels = { psi: "PSI body", acceptor: "Primary acceptor", p700: "P700 pair", chlorophyll: "Chlorophyll a", fd: "Ferredoxin (Fd)", fnr: "NADP⁺ reductase (FNR)" };
const art = {
    psi: '<svg viewBox="0 0 92 100" aria-hidden="true"><path d="M10 22 Q10 4 46 17 Q82 4 82 22 L86 79 Q82 96 46 83 Q10 96 6 79 Z" fill="#925099" stroke="#29132e" stroke-width="3"/><rect x="37" y="19" width="18" height="64" rx="8" fill="#9ccfe6"/></svg>',
    chlorophyll: '<svg viewBox="0 0 92 100" aria-hidden="true"><circle cx="46" cy="50" r="27" fill="#6bbd37" stroke="#173d13" stroke-width="4"/></svg>',
    p700: '<svg viewBox="0 0 92 100" aria-hidden="true"><circle cx="33" cy="50" r="23" fill="#6bbd37" stroke="#173d13" stroke-width="4"/><circle cx="59" cy="50" r="23" fill="#6bbd37" stroke="#173d13" stroke-width="4"/></svg>',
    acceptor: '<svg viewBox="0 0 92 100" aria-hidden="true"><rect x="20" y="24" width="52" height="52" rx="8" fill="#86c8e9" stroke="#173447" stroke-width="4"/></svg>',
    fd: '<svg viewBox="0 0 92 100" aria-hidden="true"><ellipse cx="46" cy="50" rx="36" ry="24" fill="#b7e878" stroke="#416727" stroke-width="4"/><text x="46" y="58" text-anchor="middle" font-size="23" font-weight="800">Fd</text></svg>',
    fnr: '<svg viewBox="0 0 92 100" aria-hidden="true"><rect x="12" y="23" width="68" height="54" rx="18" fill="#efab64" stroke="#673d1e" stroke-width="4"/><text x="46" y="59" text-anchor="middle" font-size="23" font-weight="800">FNR</text></svg>'
};
const electron = (x, y, key) => `<g data-psi-electron="${key}"><circle cx="${x}" cy="${y}" r="11" class="psii-electron"/><text x="${x}" y="${y + 4}" text-anchor="middle" class="psii-electron-label">e</text></g>`;
const proton = (x, y) => `<g data-psi-proton><circle cx="${x}" cy="${y}" r="16" class="water-proton"/><text x="${x}" y="${y + 6}" text-anchor="middle" class="water-proton-label">H⁺</text></g>`;
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
const source = (id, disabled, selected, caption = labels[id]) => `<div class="organelle-experiment-material psii-material-card"><button type="button" class="psii-source ${selected ? "selected" : ""}" data-psi-material="${id}" aria-label="Drag ${caption}" ${disabled ? "disabled" : ""}>${art[id]}</button><span class="organelle-experiment-material-name">${caption}</span></div>`;
const membrane = () => `<g class="psii-heads">${Array.from({ length: 18 }, (_, i) => 26 + i * 50).map(x => `<ellipse cx="${x}" cy="174" rx="19" ry="15"/><ellipse cx="${x}" cy="426" rx="19" ry="15"/>`).join("")}</g><g class="psii-tails">${Array.from({ length: 36 }, (_, i) => 13 + i * 25).map(x => `<path d="M${x} 198 q-9 27 0 52 t0 52 M${x} 400 q9-27 0-52 t0-52"/>`).join("")}</g>`;

const View = {
    root: null, controls: null, events: null, generation: 0, dragging: null,
    clear() {
        this.generation++;
        this.events?.abort(); this.events = null;
        this.dragging?.ghost.remove(); this.dragging = null;
        this.root = null; this.controls = null; this.selected = null;
    },
    mount(container, { controlsElement = null, sandbox = false, review = false } = {}) {
        this.clear();
        this.container = container; this.controlContainer = controlsElement; this.sandbox = sandbox;
        this.placed = new Set(); this.selected = null; this.answers = {};
        this.optionOrder = randomizedOptions(Catalog.assessment.questions);
        this.result = null; this.phase = "assembly"; this.cycles = 0;
        this.fdElectrons = 0; this.fnrElectrons = 0; this.fdDocked = false;
        this.pcElectron = false; this.p700Plus = false;
        this.acceptorElectron = false; this.nadph = false;
        this.nadpApproached = false; this.motion = "";
        this.targetAntenna = null;
        this.root = document.createElement("section"); this.root.className = "psii-lab psi-lab";
        container.replaceChildren(this.root); this.controls = controlsElement;
        if (review) {
            const latest = SubmissionManager.getSubmissions(Catalog.id).at(-1);
            const best = SubmissionManager.getBestScore(Catalog.id) ?? latest;
            this.root.innerHTML = latest ? `<div class="psii-intro"><h3>Excite PSI submission</h3><p>Latest score: ${latest.scorePoints}/${latest.scoreMaximum} (${latest.scorePercent}%).</p><p>Highest score: ${best.scorePoints}/${best.scoreMaximum} (${best.scorePercent}%).</p></div>` : '<div class="psii-intro">No saved submission is available.</div>';
            return;
        }
        this.events = new AbortController(); const { signal } = this.events;
        this.controls?.addEventListener("click", event => {
            if (event.target.closest("[data-psi-excite]")) void this.excite();
            if (event.target.closest("[data-psi-reset]")) this.mount(this.container, { controlsElement: this.controlContainer, sandbox: this.sandbox });
        }, { signal });
        this.root.addEventListener("pointerdown", event => {
            const button = event.target.closest("[data-psi-material]");
            if (!button || button.disabled) return;
            event.preventDefault(); this.selected = button.dataset.psiMaterial;
            const ghost = document.createElement("div"); ghost.className = "psii-drag-ghost";
            ghost.setAttribute("aria-hidden", "true"); ghost.innerHTML = art[this.selected];
            document.body.appendChild(ghost); this.dragging = { material: this.selected, ghost };
            this.moveGhost(event);
        }, { signal });
        window.addEventListener("pointermove", event => this.moveGhost(event), { signal });
        window.addEventListener("pointerup", event => {
            if (!this.dragging) return;
            const { material, ghost } = this.dragging; ghost.remove(); this.dragging = null;
            const target = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-psi-target]");
            if (target && this.root.contains(target)) this.place(material, target.dataset.psiTarget);
            else this.render();
        }, { signal });
        this.root.addEventListener("click", event => {
            if (event.target.closest("[data-psi-submit]")) return void this.submit();
            if (event.target.closest("[data-psi-retry]")) {
                this.answers = {}; this.result = null;
                this.optionOrder = randomizedOptions(Catalog.assessment.questions); this.render(); return;
            }
            const button = event.target.closest("[data-psi-material]");
            if (button && !button.disabled) { this.selected = button.dataset.psiMaterial; this.render(); return; }
            const target = event.target.closest("[data-psi-target]");
            if (target && this.selected) this.place(this.selected, target.dataset.psiTarget);
        }, { signal });
        this.root.addEventListener("change", event => {
            const input = event.target.closest("input[data-psi-question]"); if (!input) return;
            this.answers[input.dataset.psiQuestion] = input.value;
            const submit = this.root.querySelector("[data-psi-submit]");
            if (submit) submit.disabled = Catalog.assessment.questions.some(q => !this.answers[q.id]);
        }, { signal });
        this.render();
    },
    moveGhost(event) {
        if (this.dragging) { this.dragging.ghost.style.left = `${event.clientX}px`; this.dragging.ghost.style.top = `${event.clientY}px`; }
    },
    place(material, target) {
        const expected = target.startsWith("chl") ? "chlorophyll" : target;
        const assembly = PARTS.includes(target);
        if (material !== expected || this.placed.has(target) ||
            (assembly && (this.phase !== "assembly" || (target !== "psi" && !this.placed.has("psi")))) ||
            (!assembly && (this.phase !== "place-carriers" || (target === "fnr" && !this.placed.has("fd"))))) {
            this.render("Match each material to its dotted target. Place PSI and Fd before excitation; add FNR after the first light pulse."); return;
        }
        this.placed.add(target); this.selected = null;
        if (this.phase === "assembly" && PARTS.every(id => this.placed.has(id))) this.phase = "ready-excite";
        if (this.phase === "place-carriers" && this.placed.has("fd") && this.placed.has("fnr")) {
            this.phase = "ready-excite";
            this.render();
        } else this.render();
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
    async excite() {
        if (this.phase !== "ready-excite") return;
        const token = this.generation;
        this.targetAntenna = chooseAntenna();
        this.phase = "running";
        if (!await this.step("photon", 1150, token)) return;
        for (const index of antennaPath(this.targetAntenna)) {
            if (!await this.step(`antenna-${index}`, 1000, token)) return;
        }
        if (!await this.step("jiggle", 1000, token)) return;
        this.p700Plus = true;
        this.acceptorElectron = false;
        if (!await this.step("acceptor", 1550, token)) return;
        this.acceptorElectron = true;
        if (!await this.step("to-fd", 1550, token)) return;
        this.acceptorElectron = false; this.fdElectrons++;
        this.pcElectron = true;
        if (!await this.step("pc-approach", 1300, token)) return;
        if (!await this.step("pc-donate", 1000, token)) return;
        this.pcElectron = false; this.p700Plus = false;
        if (!await this.step("pc-depart", 1300, token)) return;
        this.cycles++;
        this.motion = "";
        if (this.cycles === 1) { this.phase = "place-carriers"; this.render(); }
        else { this.phase = "transfer-fd"; await this.deliverFd(); }
    },
    async deliverFd() {
        if (this.phase !== "transfer-fd" || !this.placed.has("fd") || !this.placed.has("fnr")) return;
        const token = this.generation; this.phase = "running";
        if (this.fdElectrons !== 2) return;
        if (!await this.step("fd-to-fnr", 1400, token)) return;
        this.fdDocked = true;
        if (!await this.step("fd-handoff", 900, token)) return;
        this.fdElectrons = 0; this.fnrElectrons = 2;
        if (!await this.step("fd-return", 1000, token)) return;
        this.fdDocked = false;
        if (!await this.step("nadp-approach", 1100, token)) return;
        this.nadpApproached = true;
        if (!await this.step("fnr-to-nadp", 1400, token)) return;
        this.fnrElectrons = 0;
        if (!await this.step("proton", 1300, token)) return;
        this.nadph = true;
        if (!await this.step("nadph-return", 1300, token)) return;
        this.nadpApproached = false;
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
            const completion = passes && !alreadyCompleted
                ? ResearchManager.completeExperiment(Catalog.id) : null;
            if (passes && !alreadyCompleted && !completion?.completed)
                throw new Error(completion?.reason ?? "completion-failed");
            const submission = SubmissionManager.recordSubmission({ experiment: Catalog, report, completion,
                placementSnapshot: { placedParts: [...this.placed] },
                attemptSnapshot: { answers: { ...this.answers }, excitationCycles: this.cycles, nadph: this.nadph } });
            if (!submission || !SaveManager.save({ reason: "photosystem-i-excitation-submission" })) throw new Error("save-failed");
            this.result = report; OrganelleExperimentPanel.refresh(); this.render();
        } catch {
            for (const key of Object.keys(gameState)) delete gameState[key];
            Object.assign(gameState, backup);
            this.render("Score could not be saved. Please try Submit for Score again.");
        }
    },
    render(message = "") {
        if (!this.root) return;
        const has = id => this.placed.has(id);
        const status = message || ({ assembly: `${this.placed.size} of ${PARTS.length} PSI parts placed.`,
            "ready-excite": `Press Excite for light pulse ${this.cycles + 1} of 2.`,
            "place-carriers": "PC has restored P700. Dock FNR at the membrane’s stromal surface to receive electrons from Fd.",
            running: "Follow the photon, electron, PC, and H⁺ movements.",
            "transfer-fd": "The primary acceptor is passing its electron to Fd.",
            done: "Two light pulses supplied two electrons. FNR used them and an H⁺ from the stroma to form NADPH. Answer the questions below." }[this.phase]);
        const pigments = ANTENNA.map(([x, y], i) => `<circle data-psi-target="chl${i}" cx="${x}" cy="${y}" r="25" class="psii-target ${has(`chl${i}`) ? "psii-filled" : ""} ${this.motion === `antenna-${i}` ? "psii-excited" : ""}"/>`).join("");
        const quiz = this.phase === "done" ? `<section class="psii-quiz"><h3>Check your PSI model</h3><p>Answer all five questions and submit for a saved score.</p>${Catalog.assessment.questions.map((q, i) => `<fieldset><legend>${i + 1}. ${q.prompt}</legend>${(this.optionOrder?.get(q.id) ?? q.options).map(o => `<label><input type="radio" name="${q.id}" data-psi-question="${q.id}" value="${o.id}" ${this.answers[q.id] === o.id ? "checked" : ""} ${this.result ? "disabled" : ""}> ${o.text}</label>`).join("")}</fieldset>`).join("")}${this.result ? `<p class="psii-score" role="status">Score: ${this.result.scorePoints}/${this.result.scoreMaximum} (${this.result.scorePercent}%). ${this.result.isPerfect ? this.sandbox ? "Perfect re-examination; saved progress is unchanged." : "Perfect score." : "Review the model and try again."}</p>${this.result.isPerfect ? "" : '<button type="button" data-psi-retry>Try questions again</button>'}` : `<button type="button" data-psi-submit ${Catalog.assessment.questions.some(q => !this.answers[q.id]) ? "disabled" : ""}>Submit for Score</button>`}</section>` : "";
        const acceptorActive = this.acceptorElectron && this.motion !== "to-fd";
        this.root.innerHTML = `<div class="psii-intro"><p><strong>Excite PSI:</strong> Assemble PSI in the membrane. Blue light excites P700; PC replaces each electron. Add Fd and FNR after the first pulse to make NADPH from two electrons and a stromal H⁺.</p><p class="psii-progress" role="status" aria-live="polite">${status}</p></div>
        <div class="psii-workspace"><div class="psii-board"><svg viewBox="0 0 900 570" class="${this.motion === "proton" ? "psi-proton-flight" : ""}" role="img" aria-label="Thylakoid membrane, Photosystem I, electron carriers, and NADPH product"><rect width="900" height="570" rx="24" class="psii-background"/><text x="25" y="74" class="psii-side-label">STROMA</text><text x="25" y="525" class="psii-side-label">THYLAKOID LUMEN</text>${membrane()}
        <path data-psi-target="psi" d="M290 160 C285 100 390 98 450 135 C510 98 615 100 610 160 L625 416 C620 496 510 490 450 454 C390 490 280 496 275 416 Z" class="psii-body ${has("psi") ? "psii-body-filled" : ""}"/>${has("psi") ? '<rect x="415" y="175" width="70" height="245" rx="30" class="psii-core"/>' : ""}
        <rect data-psi-target="acceptor" x="414" y="205" width="72" height="72" rx="12" class="psii-acceptor ${has("acceptor") ? "psii-acceptor-filled" : ""}"/>${pigments}
        <g data-psi-target="p700" class="psii-p680 ${has("p700") ? "psii-filled" : ""} ${this.motion === "jiggle" ? "psii-excited" : ""}"><circle cx="426" cy="369" r="25"/><circle cx="474" cy="369" r="25"/></g><text x="450" y="305" text-anchor="middle" class="psii-center-label">PSI</text><text x="450" y="460" text-anchor="middle" class="psii-small-label">${this.p700Plus ? "P700⁺" : "P700"}</text><text x="450" y="194" text-anchor="middle" class="psii-small-label">PRIMARY ACCEPTOR</text>
        ${this.phase === "ready-excite" ? '<circle cx="230" cy="85" r="24" class="psii-photon psii-photon--blue" aria-label="Blue photon waiting for Excite"/>' : ""}
        ${this.motion === "photon" ? `<circle cx="130" cy="60" r="24" class="psii-photon psii-photon--blue psi-photon-flight" style="--psi-photon-dx:${ANTENNA[this.targetAntenna][0] - 130}px;--psi-photon-dy:${ANTENNA[this.targetAntenna][1] - 60}px" aria-label="New blue photon traveling to antenna chlorophyll"/>` : ""}
        ${this.motion === "acceptor" ? electron(450, 335, "flight") : ""}${acceptorActive ? electron(450, 240, "acceptor") : ""}
        ${["pc-approach", "pc-donate", "pc-depart"].includes(this.motion) ? `<g class="psi-pc psi-${this.motion}"><ellipse cx="215" cy="480" rx="43" ry="27" class="etc-pc"/><text x="215" y="488" text-anchor="middle" class="etc-pc-label">PC</text>${this.pcElectron ? electron(236, 466, "pc") : ""}</g>` : ""}
        <g class="psi-fd-unit ${this.motion === "fd-to-fnr" ? "psi-fd-to-fnr" : this.motion === "fd-return" ? "psi-fd-return" : this.fdDocked ? "psi-fd-docked" : ""} ${this.motion === "fd-handoff" ? "psi-fd-handoff" : ""}"><ellipse data-psi-target="fd" cx="580" cy="145" rx="48" ry="30" class="psi-fd ${has("fd") ? "psi-filled" : ""}"/><text x="580" y="152" text-anchor="middle" class="psi-carrier-label">Fd</text>${Array.from({ length: this.fdElectrons }, (_, i) => electron(565 + i * 29, 128, `fd-${i}`)).join("")}</g>
        ${this.phase !== "assembly" && this.cycles > 0 ? `<rect data-psi-target="fnr" x="705" y="119" width="108" height="68" rx="20" class="psi-fnr ${has("fnr") ? "psi-filled" : ""}"/><text x="759" y="160" text-anchor="middle" class="psi-carrier-label">FNR</text>` : ""}
        ${this.motion === "to-fd" ? electron(450, 240, "to-fd") : ""}
        ${this.placed.has("fnr") ? `<defs><mask id="psi-nadp-cutout" maskUnits="userSpaceOnUse" x="768" y="8" width="112" height="82"><rect x="768" y="8" width="112" height="82" fill="white"/><circle cx="814" cy="25" r="16" fill="black"/></mask></defs><g class="psi-nadp-unit ${this.motion === "nadp-approach" ? "psi-nadp-approach" : this.motion === "nadph-return" ? "psi-nadph-return" : this.nadpApproached ? "psi-nadp-docked" : ""}"><rect x="770" y="25" width="107" height="62" rx="12" class="psi-nadp" mask="url(#psi-nadp-cutout)"/><path d="M798 25 Q814 57 830 25" class="psi-nadp-rim"/>${this.nadph ? `<circle cx="814" cy="25" r="16" class="water-proton"/><text x="814" y="31" text-anchor="middle" class="water-proton-label">H</text>` : ""}<text x="823" y="69" text-anchor="middle" class="psi-carrier-label">${this.nadph ? "NADPH" : "NADP⁺"}</text></g>${!this.nadph ? proton(704, 46) : ""}` : ""}
        ${this.fnrElectrons === 2 ? this.motion === "fnr-to-nadp"
            ? `${electron(747, 150, "fnr-to-nadp-1")}${electron(767, 150, "fnr-to-nadp-2")}`
            : `${electron(747, 150, "fnr-1")}${electron(767, 150, "fnr-2")}` : ""}
        </svg></div><div class="psii-tray organelle-experiment-material-tray"><h3>Materials</h3><div class="psii-material-list organelle-experiment-material-list">${source("psi", has("psi"))}${source("chlorophyll", ANTENNA.every((_, i) => has(`chl${i}`)), this.selected === "chlorophyll", `Chlorophyll a (${ANTENNA.filter((_, i) => has(`chl${i}`)).length}/6)`)}${source("p700", has("p700"), this.selected === "p700")}${source("acceptor", has("acceptor"), this.selected === "acceptor")}${source("fd", this.phase !== "assembly" || has("fd"), this.selected === "fd")}${source("fnr", this.phase !== "place-carriers" || !has("fd") || has("fnr"), this.selected === "fnr")}</div><p>Drag each piece to its dotted shape, or select a card and then its target. Place Fd before excitation. The primary acceptor hands each electron to Fd; FNR uses the pair to form NADPH.</p></div></div>${quiz}`;
        if (this.controls) this.controls.innerHTML = `<button type="button" class="psii-header-button ${this.phase === "ready-excite" ? "water-action-ready" : ""}" data-psi-excite ${this.phase !== "ready-excite" ? "disabled" : ""}>Excite${this.cycles ? " again" : ""}</button><button type="button" class="psii-header-button" data-psi-reset>Reset model</button>`;
    }
};
export default View;
