import Catalog from "./PhotosystemIIWaterSplittingCatalog.js";
import ResearchManager from "./ResearchManager.js";
import SaveManager from "./SaveManager.js";
import gameState from "./GameState.js";
import OrganelleExperimentPanel from "./OrganelleExperimentPanel.js";
import SubmissionManager from "./OrganelleExperimentSubmissionManager.js";

const CHLOROPHYLLS = [
    [330, 205], [300, 285], [350, 365],
    [570, 205], [600, 285], [550, 365]
];
const STARTS = [0, 1, 3, 4];
const WATER_X = [300, 600];
const PROTON_X = [198, 402, 498, 702];
const GROUP_X = [694, 748, 802, 856];

function excitationPath(random = Math.random) {
    const start = STARTS[Math.min(3, Math.max(0, Math.floor(random() * 4)))];
    return start < 3
        ? (start === 0 ? [0, 1, 2] : [1, 2])
        : (start === 3 ? [3, 4, 5] : [4, 5]);
}

function stepForSplit(splits) {
    return { waterIndex: Math.floor(splits / 2), side: splits % 2 ? "right" : "left" };
}

function scoreAnswers(answers) {
    const checks = Catalog.assessment.questions.map(question => {
        const passed = answers[question.id] === question.correctOptionId;
        return {
            id: question.id,
            selectedOptionId: answers[question.id] ?? null,
            correctOptionId: question.correctOptionId,
            passed,
            awardedPoints: passed ? 1 : 0,
            maximumPoints: 1
        };
    });
    const scorePoints = checks.filter(check => check.passed).length;
    return {
        scorePoints,
        scoreMaximum: checks.length,
        scorePercent: scorePoints / checks.length * 100,
        isPerfect: scorePoints === checks.length,
        checks
    };
}

const PSII_ART = `<svg viewBox="0 0 92 100" aria-hidden="true"><path d="M10 22 C10 8 28 5 46 17 C64 5 82 8 82 22 L86 79 C82 96 63 96 46 83 C29 96 10 96 6 79 Z" fill="#925099" stroke="#29132e" stroke-width="3"/><rect x="37" y="19" width="18" height="64" rx="8" fill="#9ccfe6"/><circle cx="22" cy="35" r="7" fill="#6bbd37"/><circle cx="70" cy="35" r="7" fill="#6bbd37"/><circle cx="19" cy="58" r="7" fill="#6bbd37"/><circle cx="73" cy="58" r="7" fill="#6bbd37"/><circle cx="35" cy="72" r="7" fill="#6bbd37"/><circle cx="57" cy="72" r="7" fill="#6bbd37"/><circle cx="40" cy="84" r="7" fill="#6bbd37"/><circle cx="52" cy="84" r="7" fill="#6bbd37"/><rect x="38" y="8" width="16" height="16" rx="3" fill="#86c8e9"/></svg>`;
const WATER_ART = `<svg viewBox="0 0 240 100" aria-hidden="true">
    <path d="M52 50 H94 M146 50 H188" class="water-covalent-bond"/>
    <circle cx="28" cy="50" r="24" class="water-hydrogen"/>
    <circle cx="120" cy="50" r="28" class="water-oxygen"/>
    <circle cx="212" cy="50" r="24" class="water-hydrogen"/>
    <circle cx="69" cy="50" r="9" class="water-bond-electron"/><circle cx="85" cy="50" r="9" class="water-bond-electron"/>
    <circle cx="155" cy="50" r="9" class="water-bond-electron"/><circle cx="171" cy="50" r="9" class="water-bond-electron"/>
    <text x="28" y="58" text-anchor="middle" class="water-hydrogen-label">H</text>
    <text x="120" y="59" text-anchor="middle" class="water-oxygen-label">O</text>
    <text x="212" y="58" text-anchor="middle" class="water-hydrogen-label">H</text>
</svg>`;
const ETC_ART = `<svg viewBox="0 0 92 100" aria-hidden="true"><rect x="8" y="30" width="76" height="40" rx="5" fill="#70431d" stroke="#dbad6c" stroke-width="3"/><text x="46" y="57" text-anchor="middle" fill="#fff" font-size="19" font-weight="800">ETC</text></svg>`;
const PHOTON_ART = `<svg viewBox="0 0 92 100" aria-hidden="true"><circle cx="46" cy="50" r="24" fill="#328be8" stroke="#103963" stroke-width="4"/></svg>`;

function source(material, label, art, disabled, selected) {
    return `<div class="organelle-experiment-material psii-material-card"><button type="button"
        class="psii-source ${selected ? "selected" : ""}" data-water-material="${material}"
        aria-label="Drag ${label}" ${disabled ? "disabled" : ""}>${art}</button>
        <span class="organelle-experiment-material-name">${label}</span></div>`;
}

function membrane() {
    const heads = Array.from({ length: 20 }, (_, i) => 26 + i * 50)
        .map(x => `<ellipse cx="${x}" cy="174" rx="19" ry="15"/><ellipse cx="${x}" cy="426" rx="19" ry="15"/>`).join("");
    const tails = Array.from({ length: 40 }, (_, i) => 13 + i * 25)
        .map(x => `<path d="M${x} 198 q-9 27 0 52 t0 52 M${x} 400 q9-27 0-52 t0-52"/>`).join("");
    return `<g class="psii-heads">${heads}</g><g class="psii-tails">${tails}</g>`;
}

function electron(x, y, dataAttribute, visible = true) {
    return `<g ${dataAttribute} style="display:${visible ? "" : "none"}"><circle cx="${x}" cy="${y}" r="10" class="psii-electron"/><text x="${x}" y="${y + 4}" text-anchor="middle" class="psii-electron-label">e</text></g>`;
}

function proton(x, y, step) {
    return `<g data-proton="${step}"><circle cx="${x}" cy="${y}" r="20" class="water-proton"/><text x="${x}" y="${y + 6}" text-anchor="middle" class="water-proton-label">H⁺</text></g>`;
}

function water(index, splits, grouped, inFlight, pairing) {
    const x = WATER_X[index];
    const y = 545;
    const leftStep = index * 2;
    const rightStep = leftStep + 1;
    const leftDone = splits > leftStep;
    const rightDone = splits > rightStep;
    const facing = index === 0 ? 1 : -1;
    const oxygen = inFlight ? "" : `<g data-oxygen="${index}">
        <circle cx="${x}" cy="${y}" r="30" class="water-oxygen"/>
        <text x="${x}" y="${y + 10}" text-anchor="middle" class="water-oxygen-label">O</text>
        ${pairing ? `<circle cx="${x + facing * 35}" cy="${y - 12}" r="9" class="water-bond-electron"/>
            <circle cx="${x + facing * 35}" cy="${y + 12}" r="9" class="water-bond-electron"/>` : ""}
    </g>`;
    const bond = (side, done) => {
        const direction = side === "left" ? -1 : 1;
        const a = x + direction * 39;
        const b = x + direction * 58;
        return done
            ? pairing ? "" : `<circle cx="${a}" cy="${y}" r="9" class="water-bond-electron"/>`
            : `<line x1="${x + direction * 30}" y1="${y}" x2="${x + direction * 68}" y2="${y}" class="water-covalent-bond"/>
                <circle cx="${a}" cy="${y}" r="9" class="water-bond-electron"/>
                <circle data-bond-electron="${index}-${side}" cx="${b}" cy="${y}" r="9" class="water-bond-electron"/>`;
    };
    const hydrogen = (side, done, step) => {
        if (done) return proton(grouped ? GROUP_X[step] : PROTON_X[step], grouped ? 615 : 585, step);
        const hx = x + (side === "left" ? -82 : 82);
        return `<g data-hydrogen="${step}"><circle cx="${hx}" cy="${y}" r="25" class="water-hydrogen"/>
            <text x="${hx}" y="${y + 9}" text-anchor="middle" class="water-hydrogen-label">H</text></g>`;
    };
    return `<g data-water="${index}">${inFlight ? "" : `${bond("left", leftDone)}${bond("right", rightDone)}`}${oxygen}
        ${hydrogen("left", leftDone, leftStep)}${hydrogen("right", rightDone, rightStep)}</g>`;
}

const PhotosystemIIWaterSplittingView = {
    root: null,
    controls: null,
    events: null,
    dragging: null,
    selected: null,
    sandbox: false,
    psii: false,
    waters: 0,
    etc: false,
    photon: null,
    splits: 0,
    phase: "setup",
    animationStep: null,
    bondCount: 0,
    answers: {},
    result: null,
    generation: 0,
    timer: null,
    wake: null,
    animations: new Set(),

    clear() {
        this.generation++;
        this.events?.abort();
        this.events = null;
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
        this.wake?.();
        this.wake = null;
        this.animations.forEach(animation => animation.cancel());
        this.animations.clear();
        this.dragging?.ghost?.remove();
        this.dragging = null;
        this.root = null;
        this.controls = null;
        this.selected = null;
    },

    reset() {
        this.clear();
        if (this.container) this.mount(this.container, {
            sandbox: this.sandbox || ResearchManager.isExperimentCompleted(Catalog.id),
            controlsElement: this.controlContainer
        });
    },

    mount(container, { sandbox = false, review = false, controlsElement = null } = {}) {
        this.clear();
        this.container = container;
        this.controlContainer = controlsElement;
        this.sandbox = sandbox;
        this.psii = false;
        this.waters = 0;
        this.etc = false;
        this.photon = null;
        this.splits = 0;
        this.phase = "setup";
        this.animationStep = null;
        this.bondCount = 0;
        this.answers = {};
        this.result = null;
        this.root = document.createElement("section");
        this.root.className = "psii-lab water-lab";
        container.replaceChildren(this.root);
        if (review) {
            const latest = SubmissionManager.getSubmissions(Catalog.id).at(-1);
            this.root.innerHTML = latest
                ? `<div class="psii-intro"><h3>Water Splitting submission</h3><p>${latest.scorePoints} / ${latest.scoreMaximum} correct</p><p>${ResearchManager.isExperimentCompleted(Catalog.id) ? "Completed: two H₂O yielded four H⁺ and O₂." : "Review the model and try again for completion."}</p></div>`
                : `<div class="psii-intro"><p>No saved submission is available.</p></div>`;
            return;
        }
        this.events = new AbortController();
        const signal = this.events.signal;
        this.controls = controlsElement;
        this.controls?.addEventListener("click", event => {
            if (event.target.closest("[data-split-water]")) void this.splitWater();
            if (event.target.closest("[data-excite-water]")) void this.excite();
            if (event.target.closest("[data-create-o2]")) void this.createO2();
            if (event.target.closest("[data-reset-water]")) this.reset();
        }, { signal });
        this.root.addEventListener("pointerdown", event => {
            const item = event.target.closest("[data-water-material]");
            if (!item || item.disabled) return;
            event.preventDefault();
            this.selected = item.dataset.waterMaterial;
            const ghost = document.createElement("div");
            ghost.className = "psii-drag-ghost";
            ghost.setAttribute("aria-hidden", "true");
            ghost.appendChild(item.querySelector("svg").cloneNode(true));
            document.body.appendChild(ghost);
            this.dragging = { material: this.selected, ghost };
            this.moveGhost(event);
        }, { signal });
        window.addEventListener("pointermove", event => {
            if (this.dragging) this.moveGhost(event);
        }, { signal });
        window.addEventListener("pointerup", event => {
            if (!this.dragging) return;
            const { material, ghost } = this.dragging;
            ghost.remove();
            this.dragging = null;
            const hit = document.elementFromPoint(event.clientX, event.clientY);
            const board = hit?.closest("[data-water-board]");
            if (board && this.root?.contains(board)) {
                this.place(material, event.clientX, event.clientY);
            } else this.render();
        }, { signal });
        this.root.addEventListener("click", event => {
            if (event.target.closest("[data-water-submit]")) { this.submit(); return; }
            if (event.target.closest("[data-water-retry]")) {
                this.answers = {};
                this.result = null;
                this.render();
                return;
            }
            const item = event.target.closest("[data-water-material]");
            if (item && !item.disabled) {
                this.selected = item.dataset.waterMaterial;
                this.render();
            } else if (event.target.closest("[data-water-board]") && this.selected) {
                this.place(this.selected);
            }
        }, { signal });
        this.root.addEventListener("change", event => {
            const input = event.target.closest("input[data-water-question]");
            if (!input) return;
            this.answers[input.dataset.waterQuestion] = input.value;
            const submit = this.root.querySelector("[data-water-submit]");
            if (submit) submit.disabled = Catalog.assessment.questions.some(
                question => !this.answers[question.id]
            );
        }, { signal });
        this.render();
    },

    moveGhost(event) {
        if (!this.dragging) return;
        this.dragging.ghost.style.left = `${event.clientX}px`;
        this.dragging.ghost.style.top = `${event.clientY}px`;
    },

    place(material, clientX, clientY) {
        const svg = this.root?.querySelector("[data-water-board]");
        const box = svg?.getBoundingClientRect();
        const point = box && Number.isFinite(clientX) && Number.isFinite(clientY)
            ? { x: (clientX - box.left) * 1000 / box.width, y: (clientY - box.top) * 700 / box.height }
            : null;
        if (this.phase === "setup") {
            if (material === "psii" && !this.psii) this.psii = true;
            else if (material === "water" && this.psii && this.waters < 2 && (!point || point.y > 440)) this.waters++;
            else if (material === "etc" && this.psii && !this.etc && (!point || point.x > 650)) this.etc = true;
            else { this.render("Place PSII first, two waters in the lumen, and the ETC to the right."); return; }
            if (this.psii && this.waters === 2 && this.etc) this.phase = "ready-split";
        } else if (this.phase === "needs-photon" && material === "photon" && !this.photon) {
            this.photon = point
                ? { x: Math.max(30, Math.min(970, point.x)), y: Math.max(30, Math.min(670, point.y)) }
                : { x: 130, y: 95 };
            this.phase = "ready-excite";
        } else { this.render("Follow the highlighted action before placing another material."); return; }
        this.selected = null;
        this.render();
    },

    async pause(ms, generation) {
        await new Promise(resolve => {
            this.wake = resolve;
            this.timer = setTimeout(() => {
                this.timer = null;
                this.wake = null;
                resolve();
            }, ms);
        });
        return generation === this.generation && Boolean(this.root);
    },

    async move(node, dx, dy, duration, generation, fromX = 0, fromY = 0) {
        if (!node || generation !== this.generation) return false;
        const animation = node.animate([
            { transform: `translate(${fromX}px, ${fromY}px)` },
            { transform: `translate(${dx}px, ${dy}px)` }
        ], { duration, easing: "ease-in-out", fill: "forwards" });
        this.animations.add(animation);
        try { await animation.finished; }
        catch { this.animations.delete(animation); return false; }
        this.animations.delete(animation);
        return generation === this.generation && Boolean(this.root);
    },

    announce(message) {
        const status = this.root?.querySelector("[data-water-status]");
        if (status) status.textContent = message;
    },

    async splitWater() {
        if (this.phase !== "ready-split" || this.splits >= 4 || !this.root) return;
        const generation = ++this.generation;
        const step = this.splits;
        const { waterIndex, side } = stepForSplit(step);
        const x = WATER_X[waterIndex];
        const direction = side === "left" ? -1 : 1;
        this.phase = "running";
        this.animationStep = "splitting";
        this.render(`Split ${step + 1} of 4: an H⁺ leaves water ${waterIndex + 1}.`);
        const hydrogen = this.root.querySelector(`[data-hydrogen="${step}"]`);
        const hx = x + direction * 82;
        hydrogen.innerHTML = `<circle cx="${hx}" cy="545" r="20" class="water-proton"/><text x="${hx}" y="551" text-anchor="middle" class="water-proton-label">H⁺</text>`;
        if (!await this.move(hydrogen, direction * 20, 40, 850, generation)) return;
        this.announce("An electron from water replaces the electron lost by P680+.");
        const bondElectron = this.root.querySelector(`[data-bond-electron="${waterIndex}-${side}"]`);
        if (!await this.move(bondElectron, 450 - (x + direction * 58), 370 - 545, 1150, generation)) return;
        this.root.querySelector("[data-p680-label]").textContent = "P680";
        this.announce("P680 is restored. The electron in the primary acceptor moves to the ETC.");
        const acceptedElectron = this.root.querySelector("[data-accepted-electron]");
        acceptedElectron?.classList.remove("psii-electron-shake");
        if (!await this.move(acceptedElectron, 350, 49, 1100, generation)) return;
        if (!await this.move(acceptedElectron, 600, 49, 850, generation, 350, 49)) return;
        this.splits++;
        this.phase = this.splits === 4 ? "ready-o2" : "needs-photon";
        this.animationStep = null;
        this.render();
    },

    async excite() {
        if (this.phase !== "ready-excite" || !this.photon || !this.root) return;
        const generation = ++this.generation;
        const path = excitationPath();
        this.phase = "running";
        this.animationStep = "exciting";
        this.render("Blue light travels toward an antenna chlorophyll.");
        const photon = this.root.querySelector("[data-water-photon]");
        const [x, y] = CHLOROPHYLLS[path[0]];
        if (!await this.move(photon, x - this.photon.x, y - this.photon.y, 1050, generation)) return;
        photon.style.display = "none";
        for (const index of path) {
            const pigment = this.root.querySelector(`[data-water-chl="${index}"]`);
            pigment?.classList.add("psii-excited");
            this.announce("Excitation energy moves toward P680.");
            if (!await this.pause(850, generation)) return;
            pigment?.classList.remove("psii-excited");
        }
        const p680 = this.root.querySelector("[data-water-p680]");
        p680?.classList.add("psii-excited");
        if (!await this.pause(850, generation)) return;
        p680?.classList.remove("psii-excited");
        this.root.querySelector("[data-p680-label]").textContent = "P680+";
        const ejected = this.root.querySelector("[data-ejected-electron]");
        ejected.style.display = "";
        this.announce("P680+ has lost an electron to the primary acceptor.");
        if (!await this.move(ejected, 0, -105, 1400, generation)) return;
        this.photon = null;
        this.phase = "ready-split";
        this.animationStep = null;
        this.render();
    },

    async createO2() {
        if (this.phase !== "ready-o2" || this.splits !== 4 || !this.root) return;
        const generation = ++this.generation;
        this.phase = "running";
        this.animationStep = "oxygen";
        this.bondCount = 0;
        this.render("Two oxygen atoms approach each other; four protons collect in the lumen.");
        const movements = [
            this.move(this.root.querySelector('[data-oxygen="0"]'), 100, 0, 1000, generation),
            this.move(this.root.querySelector('[data-oxygen="1"]'), -100, 0, 1000, generation),
            ...[0, 1, 2, 3].map(i =>
                this.move(this.root.querySelector(`[data-proton="${i}"]`),
                    GROUP_X[i] - PROTON_X[i], 30, 1000, generation)
            )
        ];
        if (!(await Promise.all(movements)).every(Boolean)) return;
        this.phase = "oxygen-bonding";
        this.bondCount = 1;
        this.render("The upper electron pair forms the first O–O bond.");
        if (!await this.pause(800, generation)) return;
        this.bondCount = 2;
        this.render("The lower electron pair forms the second O–O bond.");
        if (!await this.pause(800, generation)) return;
        const pairElectrons = this.root.querySelector("[data-oxygen-pair-electrons]");
        const fade = pairElectrons.animate([{ opacity: 1 }, { opacity: 0 }],
            { duration: 700, fill: "forwards" });
        this.animations.add(fade);
        try { await fade.finished; }
        catch { this.animations.delete(fade); return; }
        this.animations.delete(fade);
        if (generation !== this.generation || !this.root) return;
        this.phase = "o2-flight";
        this.animationStep = null;
        this.render("O₂ forms and travels through the thylakoid membrane toward the stroma.");
        const oxygen = this.root.querySelector("[data-o2]");
        const exitX = 170 + Math.floor(Math.random() * 640);
        if (!await this.move(oxygen, exitX - 450, -620, 2150, generation)) return;
        this.phase = "quiz";
        this.render();
    },

    submit() {
        if (this.phase !== "quiz" || this.result || Catalog.assessment.questions.some(
            question => !this.answers[question.id]
        )) return;
        const report = scoreAnswers(this.answers);
        if (this.sandbox) {
            this.result = report;
            this.render();
            return;
        }
        const backup = structuredClone(gameState);
        try {
            const passes = ResearchManager.meetsCompletionThreshold(Catalog, report);
            const completion = passes ? ResearchManager.completeExperiment(Catalog.id) : null;
            if (passes && !completion?.completed) {
                throw new Error(completion?.reason ?? "completion-failed");
            }
            const submission = SubmissionManager.recordSubmission({
                experiment: Catalog,
                report,
                completion,
                placementSnapshot: { excitedPSII: true, waterMolecules: 2, etcPlaced: true },
                attemptSnapshot: { answers: { ...this.answers }, waterSplits: 4, oxygenFormed: true }
            });
            if (!submission || !SaveManager.save({ reason: "photosystem-ii-water-splitting-submission" })) {
                throw new Error("save-failed");
            }
            this.result = report;
            OrganelleExperimentPanel.refresh();
            this.render();
        } catch {
            for (const key of Object.keys(gameState)) delete gameState[key];
            Object.assign(gameState, backup);
            this.render("Score could not be saved. Please try Submit for Score again.");
        }
    },

    render(message = "") {
        if (!this.root) return;
        const accepted = this.psii && (this.phase === "ready-split" || this.phase === "running" && this.animationStep === "splitting" || this.phase === "setup");
        const p680Plus = accepted || this.phase === "setup";
        const pigments = CHLOROPHYLLS.map(([x, y], i) =>
            `<circle data-water-chl="${i}" cx="${x}" cy="${y}" r="25" class="psii-filled"/>`
        ).join("");
        const psiiArt = this.psii ? `<path d="M290 160 C285 100 390 98 450 135 C510 98 615 100 610 160 L625 416 C620 496 510 490 450 454 C390 490 280 496 275 416 Z" class="psii-body psii-body-filled"/>
            <rect x="415" y="175" width="70" height="245" rx="30" class="psii-core"/>
            <rect x="414" y="205" width="72" height="72" rx="12" class="psii-acceptor psii-acceptor-filled"/>
            ${pigments}<g data-water-p680 class="psii-p680 psii-filled"><circle cx="426" cy="369" r="25"/><circle cx="474" cy="369" r="25"/></g>
            ${electron(450, 241, 'data-accepted-electron', accepted)}
            ${electron(450, 346, 'data-ejected-electron', false)}
            <text x="450" y="305" text-anchor="middle" class="psii-center-label">PSII</text>
            <text data-p680-label x="450" y="460" text-anchor="middle" class="psii-small-label">${p680Plus ? "P680+" : "P680"}</text>
            <text x="450" y="196" text-anchor="middle" class="psii-small-label">PRIMARY ACCEPTOR</text>`
            : `<path d="M290 160 C285 100 390 98 450 135 C510 98 615 100 610 160 L625 416 C620 496 510 490 450 454 C390 490 280 496 275 416 Z" class="psii-body"/>`;
        const grouped = this.phase === "oxygen-bonding" || this.phase === "o2-flight" || this.phase === "quiz";
        const inFlight = grouped;
        const pairing = this.splits === 4 && !inFlight;
        const bondedOxygen = this.phase === "oxygen-bonding" ? `<g data-oxygen-bonded>
            ${this.bondCount >= 1 ? `<line data-upper-o-bond x1="435" y1="533" x2="465" y2="533" class="water-double-bond"/>` : ""}
            ${this.bondCount >= 2 ? `<line data-lower-o-bond x1="435" y1="557" x2="465" y2="557" class="water-double-bond"/>` : ""}
            <circle cx="400" cy="545" r="30" class="water-oxygen"/><circle cx="500" cy="545" r="30" class="water-oxygen"/>
            <text x="400" y="555" text-anchor="middle" class="water-oxygen-label">O</text>
            <text x="500" y="555" text-anchor="middle" class="water-oxygen-label">O</text>
            <g data-oxygen-pair-electrons>
                <circle cx="435" cy="533" r="9" class="water-bond-electron"/><circle cx="465" cy="533" r="9" class="water-bond-electron"/>
                <circle cx="435" cy="557" r="9" class="water-bond-electron"/><circle cx="465" cy="557" r="9" class="water-bond-electron"/>
            </g></g>` : "";
        const flyingOxygen = this.phase === "o2-flight" ? `<g data-o2><g class="water-o2-spin">
            <line x1="430" y1="534" x2="470" y2="534" class="water-double-bond"/>
            <line x1="430" y1="556" x2="470" y2="556" class="water-double-bond"/>
            <circle cx="400" cy="545" r="30" class="water-oxygen"/><circle cx="500" cy="545" r="30" class="water-oxygen"/>
            <text x="400" y="555" text-anchor="middle" class="water-oxygen-label">O</text>
            <text x="500" y="555" text-anchor="middle" class="water-oxygen-label">O</text>
        </g></g>` : "";
        const description = message || ({
            setup: "Place excited PSII, two waters in the lumen, then the ETC on the right.",
            "ready-split": `Press Split H₂O for electron replacement ${this.splits + 1} of 4.`,
            "needs-photon": "Add a blue photon to excite P680 again.",
            "ready-excite": "Press Excite to send energy to P680.",
            "ready-o2": "Four H⁺ have formed. Press Create O₂.",
            "oxygen-bonding": "Two bonds form between the oxygens; the electron dots fade.",
            "o2-flight": "O₂ is moving toward the stroma.",
            quiz: "O₂ has departed. Answer the four questions below and submit for a saved score."
        }[this.phase] ?? "Watch the animation.");
        const quiz = this.phase === "quiz" ? `<section class="psii-quiz" aria-labelledby="water-quiz-title">
            <h3 id="water-quiz-title">Check the water splitting model</h3>
            <p>Answer all four questions. A score of 4/4 completes Water Splitting.</p>
            ${Catalog.assessment.questions.map((question, index) => `<fieldset>
                <legend>${index + 1}. ${question.prompt}</legend>
                ${question.options.map(option => `<label><input type="radio" name="${question.id}"
                    data-water-question="${question.id}" value="${option.id}"
                    ${this.answers[question.id] === option.id ? "checked" : ""}
                    ${this.result ? "disabled" : ""}> ${option.text}</label>`).join("")}
            </fieldset>`).join("")}
            ${this.result ? `<p class="psii-score" role="status">Score: ${this.result.scorePoints}/${this.result.scoreMaximum}. ${this.result.isPerfect ? "Water Splitting complete." : "Review the model and try again."}</p>
                ${this.result.isPerfect ? "" : `<button type="button" data-water-retry>Try questions again</button>`}`
                : `<button type="button" data-water-submit ${Catalog.assessment.questions.some(question => !this.answers[question.id]) ? "disabled" : ""}>Submit for Score</button>`}
        </section>` : "";
        this.root.innerHTML = `<div class="psii-intro"><p><strong>Water Splitting:</strong> Drag the already excited PSII into the membrane, add two H–O–H molecules to the thylakoid lumen, and drag the electron transport chain (ETC) to the right. Each water shows two shared electrons along each white O–H bond.</p>
            <p class="psii-progress" role="status" data-water-status>${description}</p></div>
            <div class="psii-workspace"><div class="psii-board"><svg data-water-board viewBox="0 0 1000 700" role="img" aria-label="Water splitting model in a thylakoid membrane">
                <rect width="1000" height="700" rx="24" class="psii-background"/>
                <text x="35" y="80" class="psii-side-label">STROMA</text>
                <text x="35" y="678" class="psii-side-label">THYLAKOID LUMEN</text>
                ${membrane()}${psiiArt}
                <rect x="624" y="230" width="430" height="120" rx="10" class="water-etc ${this.etc ? "water-etc-filled" : ""}"/>
                <text x="810" y="276" text-anchor="middle" class="water-etc-label">ELECTRON</text>
                <text x="810" y="311" text-anchor="middle" class="water-etc-label">TRANSPORT CHAIN</text>
                ${Array.from({ length: this.waters }, (_, i) => water(i, this.splits, grouped, inFlight, pairing)).join("")}
                ${this.photon ? `<circle data-water-photon cx="${this.photon.x}" cy="${this.photon.y}" r="19" class="psii-photon psii-photon--blue"/>` : ""}
                ${bondedOxygen}${flyingOxygen}
                ${grouped ? `<text x="775" y="663" text-anchor="middle" class="water-protons-label">protons</text>` : ""}
            </svg></div>
            <div class="psii-tray organelle-experiment-material-tray" aria-label="Water splitting materials">
                <h3>Materials</h3><div class="psii-material-list organelle-experiment-material-list">
                    ${source("psii", "Excited PSII", PSII_ART, this.psii || this.phase !== "setup", this.selected === "psii")}
                    ${source("water", `Water (H₂O) ${this.waters}/2`, WATER_ART, this.waters === 2 || this.phase !== "setup", this.selected === "water")}
                    ${source("etc", "Electron transport chain", ETC_ART, this.etc || this.phase !== "setup", this.selected === "etc")}
                    ${this.phase === "needs-photon" || this.phase === "ready-excite" ? source("photon", "Blue light", PHOTON_ART, Boolean(this.photon), this.selected === "photon") : ""}
                </div><p>Two H₂O molecules supply four replacement electrons. Four H⁺ stay in the lumen; the two oxygens form O₂.</p>
            </div></div>${quiz}`;
        if (accepted) this.root.querySelector("[data-accepted-electron]")?.classList.add("psii-electron-shake");
        if (this.controls) {
            const button = this.phase === "ready-split" ? `<button type="button" class="psii-header-button water-action-ready" data-split-water>Split H₂O</button>`
                : this.phase === "ready-excite" ? `<button type="button" class="psii-header-button water-action-ready" data-excite-water>Excite</button>`
                : this.phase === "ready-o2" ? `<button type="button" class="psii-header-button water-action-ready" data-create-o2>Create O₂</button>` : "";
            this.controls.innerHTML = `${button}<button type="button" class="psii-header-button" data-reset-water ${this.phase === "running" || this.phase === "oxygen-bonding" || this.phase === "o2-flight" ? "disabled" : ""}>Reset model</button>`;
        }
    }
};

export { excitationPath, stepForSplit, scoreAnswers };
export default PhotosystemIIWaterSplittingView;
