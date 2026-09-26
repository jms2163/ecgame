import Catalog from "./PhotosystemIIExcitationCatalog.js";
import ResearchManager from "./ResearchManager.js";
import SubmissionManager from "./OrganelleExperimentSubmissionManager.js";
import OrganelleExperimentPanel from "./OrganelleExperimentPanel.js";
import SaveManager from "./SaveManager.js";
import gameState from "./GameState.js";

// The four possible photon targets are the two upper antenna pigments on each side.
const CHLOROPHYLLS = [
    [330, 205], [300, 285], [350, 365],
    [570, 205], [600, 285], [550, 365]
];
const STARTS = [0, 1, 3, 4];

function excitationPath(random = Math.random) {
    const choice = STARTS[Math.min(3, Math.max(0, Math.floor(random() * 4)))];
    return choice < 3
        ? (choice === 0 ? [0, 1, 2] : [1, 2])
        : (choice === 3 ? [3, 4, 5] : [4, 5]);
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

function membrane() {
    const heads = Array.from({ length: 18 }, (_, i) => 26 + i * 50)
        .map(x => `<ellipse cx="${x}" cy="174" rx="19" ry="15"/><ellipse cx="${x}" cy="426" rx="19" ry="15"/>`).join("");
    const tails = Array.from({ length: 36 }, (_, i) => 13 + i * 25)
        .map(x => `<path d="M${x} 198 q-9 27 0 52 t0 52 M${x} 400 q9-27 0-52 t0-52"/>`).join("");
    return `<g class="psii-heads">${heads}</g><g class="psii-tails">${tails}</g>`;
}

const PSII_ART = `<svg viewBox="0 0 92 100" aria-hidden="true" focusable="false">
    <path d="M10 22 C10 8 28 5 46 17 C64 5 82 8 82 22 L86 79 C82 96 63 96 46 83 C29 96 10 96 6 79 Z" fill="#925099" stroke="#29132e" stroke-width="3"/>
    <rect x="37" y="19" width="18" height="64" rx="8" fill="#9ccfe6" stroke="#173447" stroke-width="3"/>
    <circle cx="23" cy="36" r="8" fill="#6bbd37"/><circle cx="19" cy="57" r="8" fill="#6bbd37"/>
    <circle cx="69" cy="36" r="8" fill="#6bbd37"/><circle cx="73" cy="57" r="8" fill="#6bbd37"/>
    <circle cx="34" cy="72" r="8" fill="#6bbd37"/><circle cx="58" cy="72" r="8" fill="#6bbd37"/>
    <circle cx="39" cy="84" r="7" fill="#6bbd37"/><circle cx="53" cy="84" r="7" fill="#6bbd37"/>
    <rect x="38" y="9" width="16" height="16" rx="3" fill="#86c8e9" stroke="#173447" stroke-width="2"/>
</svg>`;
const PHOTON_COLORS = {
    red: { fill: "#e64641", stroke: "#61120e" },
    blue: { fill: "#328be8", stroke: "#103963" },
    green: { fill: "#54c744", stroke: "#1d4b17" }
};
function photonArt(color) {
    const { fill, stroke } = PHOTON_COLORS[color];
    return `<svg viewBox="0 0 92 100" aria-hidden="true" focusable="false"><circle cx="46" cy="50" r="24" fill="${fill}" stroke="${stroke}" stroke-width="4"/></svg>`;
}
const ELECTRON_ART = `<svg viewBox="0 0 92 100" aria-hidden="true" focusable="false"><circle cx="46" cy="50" r="13" fill="#47bbff" stroke="#082b48" stroke-width="3"/><text x="46" y="54" text-anchor="middle" fill="#082b48" font-size="14" font-weight="800">e</text></svg>`;

function source(material, label, art, disabled, selected) {
    return `<div class="organelle-experiment-material psii-material-card">
        <button type="button" class="psii-source ${selected ? "selected" : ""}"
            data-excitation-material="${material}" aria-label="Drag ${label}"
            ${disabled ? "disabled" : ""}>${art}</button>
        <span class="organelle-experiment-material-name">${label}</span>
    </div>`;
}

const PhotosystemIIExcitationView = {
    root: null,
    controls: null,
    events: null,
    dragging: null,
    selected: null,
    assembled: false,
    photon: null,
    running: false,
    observed: false,
    greenMissed: false,
    p680Oxidized: false,
    answers: {},
    result: null,
    sandbox: false,
    generation: 0,
    timer: null,
    wake: null,
    animation: null,

    clear() {
        this.generation++;
        this.events?.abort();
        this.events = null;
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
        this.wake?.();
        this.wake = null;
        this.animation?.cancel();
        this.animation = null;
        this.dragging?.ghost?.remove();
        this.dragging = null;
        this.root = null;
        this.controls = null;
        this.selected = null;
        this.running = false;
    },

    mount(container, { sandbox = false, review = false, controlsElement = null } = {}) {
        this.clear();
        this.sandbox = sandbox;
        this.assembled = false;
        this.photon = null;
        this.observed = false;
        this.greenMissed = false;
        this.p680Oxidized = false;
        this.answers = {};
        this.result = null;
        this.root = document.createElement("section");
        this.root.className = "psii-lab psii-excitation";
        container.replaceChildren(this.root);
        if (review) {
            const latest = SubmissionManager.getSubmissions(Catalog.id).at(-1);
            this.root.innerHTML = latest
                ? `<div class="psii-intro"><h3>Saved submission</h3><p>${latest.scorePoints} / ${latest.scoreMaximum} correct</p></div>`
                : `<div class="psii-intro"><p>No saved submission is available.</p></div>`;
            return;
        }
        this.events = new AbortController();
        const signal = this.events.signal;
        this.controls = controlsElement;
        if (this.controls) {
            this.controls.innerHTML = `<button type="button" class="psii-header-button" data-excite>Excite</button>
                <button type="button" class="psii-header-button" data-reset-excitation>Reset model</button>`;
            this.controls.addEventListener("click", event => {
                if (event.target.closest("[data-excite]")) void this.excite();
                if (event.target.closest("[data-reset-excitation]")) this.reset();
            }, { signal });
        }
        this.root.addEventListener("pointerdown", event => {
            const item = event.target.closest("[data-excitation-material]");
            if (!item || item.disabled) return;
            event.preventDefault();
            const material = item.dataset.excitationMaterial;
            this.selected = material;
            const ghost = document.createElement("div");
            ghost.className = "psii-drag-ghost";
            ghost.setAttribute("aria-hidden", "true");
            ghost.appendChild(item.querySelector("svg").cloneNode(true));
            document.body.appendChild(ghost);
            this.dragging = { material, ghost };
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
            const board = hit?.closest("[data-excitation-board]");
            if (board && this.root?.contains(board)) {
                this.place(material, event.clientX, event.clientY);
            } else {
                this.render();
            }
        }, { signal });
        this.root.addEventListener("click", event => {
            if (event.target.closest("[data-excite]")) {
                void this.excite();
                return;
            }
            if (event.target.closest("[data-retry-quiz]")) {
                this.answers = {};
                this.result = null;
                this.render();
                return;
            }
            if (event.target.closest("[data-submit-quiz]")) {
                this.submit();
                return;
            }
            if (event.target.closest("[data-reset-excitation]")) {
                this.reset();
                return;
            }
            const item = event.target.closest("[data-excitation-material]");
            if (item && !item.disabled) {
                this.selected = item.dataset.excitationMaterial;
                this.render();
                return;
            }
            if (event.target.closest("[data-excitation-board]") && this.selected) {
                this.place(this.selected);
            }
        }, { signal });
        this.root.addEventListener("change", event => {
            const input = event.target.closest("input[data-excitation-question]");
            if (!input) return;
            this.answers[input.dataset.excitationQuestion] = input.value;
            const submit = this.root.querySelector("[data-submit-quiz]");
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
        if (this.running || this.observed || this.greenMissed) return;
        if (material === "psii" && !this.assembled) {
            this.assembled = true;
        } else if (material.startsWith("photon-") &&
            Object.hasOwn(PHOTON_COLORS, material.slice(7)) &&
            this.assembled && !this.photon) {
            const svg = this.root?.querySelector("[data-excitation-board]");
            const box = svg?.getBoundingClientRect();
            const position = box && Number.isFinite(clientX) && Number.isFinite(clientY)
                ? {
                    x: Math.max(36, Math.min(864, (clientX - box.left) * 900 / box.width)),
                    y: Math.max(35, Math.min(535, (clientY - box.top) * 570 / box.height))
                }
                : { x: 140, y: 105 };
            this.photon = { ...position, color: material.slice(7) };
        } else {
            this.render("Place the assembled Photosystem II first, then place one photon on the canvas.");
            return;
        }
        this.selected = null;
        this.render();
    },

    reset() {
        this.generation++;
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
        this.wake?.();
        this.wake = null;
        this.animation?.cancel();
        this.animation = null;
        this.running = false;
        this.assembled = false;
        this.photon = null;
        this.observed = false;
        this.greenMissed = false;
        this.p680Oxidized = false;
        this.answers = {};
        this.result = null;
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

    async move(node, dx, dy, duration, generation) {
        if (!node || generation !== this.generation) return false;
        this.animation = node.animate([
            { transform: "translate(0px, 0px)" },
            { transform: `translate(${dx}px, ${dy}px)` }
        ], { duration, easing: "ease-in-out", fill: "forwards" });
        try {
            await this.animation.finished;
        } catch {
            return false;
        }
        this.animation = null;
        return generation === this.generation && Boolean(this.root);
    },

    announce(message) {
        const status = this.root?.querySelector("[data-excitation-status]");
        if (status) status.textContent = message;
    },

    updateControls() {
        const excite = this.controls?.querySelector("[data-excite]");
        const reset = this.controls?.querySelector("[data-reset-excitation]");
        if (excite) {
            excite.disabled = !this.photon || this.running || this.observed || this.greenMissed;
            excite.classList.toggle("psii-excite-ready", !excite.disabled);
        }
        if (reset) reset.disabled = this.running;
    },

    async excite() {
        if (!this.root || !this.assembled || !this.photon || this.running || this.observed || this.greenMissed) return;
        const generation = ++this.generation;
        this.running = true;
        if (this.photon.color === "green") {
            this.render("Green light traveling through the model.");
            const photon = this.root.querySelector("[data-photon]");
            const exitX = this.photon.x <= 450 ? 960 : -60;
            const exitY = this.photon.y <= 285 ? 630 : -60;
            if (!await this.move(photon, exitX - this.photon.x, exitY - this.photon.y, 1900, generation)) return;
            this.running = false;
            this.greenMissed = true;
            this.render("chlorophyll doesn't absorb green light. reset the simulation and try again.");
            return;
        }
        const path = excitationPath();
        this.render("Photon moving toward an antenna chlorophyll.");
        const photon = this.root.querySelector("[data-photon]");
        const [targetX, targetY] = CHLOROPHYLLS[path[0]];
        if (!await this.move(photon, targetX - this.photon.x, targetY - this.photon.y, 1150, generation)) return;
        photon.style.display = "none";
        for (const index of path) {
            const chlorophyll = this.root.querySelector(`[data-chlorophyll="${index}"]`);
            chlorophyll?.classList.add("psii-excited");
            this.announce(`Excitation energy at antenna chlorophyll ${index + 1}.`);
            if (!await this.pause(1000, generation)) return;
            chlorophyll?.classList.remove("psii-excited");
        }
        const p680 = this.root.querySelector("[data-p680]");
        p680?.classList.add("psii-excited");
        this.announce("Excitation energy reaches P680.");
        if (!await this.pause(1000, generation)) return;
        p680?.classList.remove("psii-excited");
        const electron = this.root.querySelector("[data-electron]");
        this.p680Oxidized = true;
        this.root.querySelector("[data-p680-label]").textContent = "P680+";
        electron.style.display = "";
        this.announce("An electron leaves P680 for the primary electron acceptor.");
        if (!await this.move(electron, 0, -105, 1550, generation)) return;
        electron.style.display = "none";
        const captured = this.root.querySelector("[data-captured-electron]");
        captured.style.display = "";
        captured.classList.add("psii-electron-shake");
        this.announce("The primary acceptor holds the electron. Answer the questions below.");
        this.running = false;
        this.observed = true;
        this.render();
    },

    submit() {
        if (!this.observed || this.result || Catalog.assessment.questions.some(
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
                placementSnapshot: { assembledPSII: true, photonPlaced: true, photonColor: this.photon.color },
                attemptSnapshot: { answers: { ...this.answers }, observedExcitation: true }
            });
            if (!submission || !SaveManager.save({ reason: "photosystem-ii-excitation-submission" })) {
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
        const pigments = CHLOROPHYLLS.map(([x, y], i) =>
            `<circle data-chlorophyll="${i}" cx="${x}" cy="${y}" r="25" class="psii-filled"/>`
        ).join("");
        const assembled = this.assembled ? `
            <path d="M290 160 C285 100 390 98 450 135 C510 98 615 100 610 160 L625 416 C620 496 510 490 450 454 C390 490 280 496 275 416 Z" class="psii-body psii-body-filled"/>
            <rect x="415" y="175" width="70" height="245" rx="30" class="psii-core"/>
            <rect x="414" y="205" width="72" height="72" rx="12" class="psii-acceptor psii-acceptor-filled"/>
            ${pigments}
            <g data-p680 class="psii-p680 psii-filled"><circle cx="426" cy="369" r="25"/><circle cx="474" cy="369" r="25"/></g>
            <g data-electron style="display:none"><circle cx="450" cy="346" r="10" class="psii-electron"/><text x="450" y="350" text-anchor="middle" class="psii-electron-label">e</text></g>
            <g data-captured-electron style="display:${this.observed ? "" : "none"}"><circle cx="450" cy="241" r="10" class="psii-electron"/><text x="450" y="245" text-anchor="middle" class="psii-electron-label">e</text></g>
            <text x="450" y="305" text-anchor="middle" class="psii-center-label">PSII</text>
            <text data-p680-label x="450" y="460" text-anchor="middle" class="psii-small-label">${this.p680Oxidized ? "P680+" : "P680"}</text>
            <text x="450" y="196" text-anchor="middle" class="psii-small-label">PRIMARY ACCEPTOR</text>`
            : `<path d="M290 160 C285 100 390 98 450 135 C510 98 615 100 610 160 L625 416 C620 496 510 490 450 454 C390 490 280 496 275 416 Z" class="psii-body"/>`;
        const quiz = this.observed ? `<section class="psii-quiz" aria-labelledby="psii-excitation-quiz-title">
            <h3 id="psii-excitation-quiz-title">Check the excitation model</h3>
            <p>Answer all four questions and submit for a saved score.</p>
            ${Catalog.assessment.questions.map((question, i) => `<fieldset>
                <legend>${i + 1}. ${question.prompt}</legend>
                ${question.options.map(option => `<label><input type="radio" name="${question.id}"
                    data-excitation-question="${question.id}" value="${option.id}"
                    ${this.answers[question.id] === option.id ? "checked" : ""}
                    ${this.result ? "disabled" : ""}> ${option.text}</label>`).join("")}
            </fieldset>`).join("")}
            ${this.result ? `<p class="psii-score" role="status">Score: ${this.result.scorePoints}/${this.result.scoreMaximum}. ${this.result.scorePoints >= 4 ? "Lab complete." : "Review the model and try again."}</p>
                ${this.result.scorePoints >= 4 ? "" : `<button type="button" data-retry-quiz>Try questions again</button>`}`
                : `<button type="button" data-submit-quiz ${Catalog.assessment.questions.some(question => !this.answers[question.id]) ? "disabled" : ""}>Submit for Score</button>`}
        </section>` : "";
        this.root.innerHTML = `
            <div class="psii-intro"><p><strong>Excite Photosystem II:</strong> Drag the assembled complex into the thylakoid membrane, then choose one red, blue, or green photon and place it on the canvas. Select a material and then the canvas if dragging is difficult.</p>
                <p class="psii-progress" role="status" data-excitation-status>${this.observed ? "The primary acceptor holds the electron. Answer the questions below." : message || (this.greenMissed ? "chlorophyll doesn't absorb green light. reset the simulation and try again." : this.assembled ? this.photon ? "Both pieces placed. Press Excite." : "PSII placed. Add one photon." : "Place the assembled PSII first.")}</p></div>
            <div class="psii-workspace"><div class="psii-board">
                <svg data-excitation-board viewBox="0 0 900 570" role="img" aria-label="Thylakoid membrane, assembled Photosystem II, and photon">
                    <rect width="900" height="570" rx="24" class="psii-background"/>
                    <text x="40" y="82" class="psii-side-label">STROMA</text>
                    <text x="40" y="522" class="psii-side-label">THYLAKOID LUMEN</text>
                    ${membrane()}${assembled}
                    ${this.photon && !this.observed && !this.greenMissed ? `<circle data-photon cx="${this.photon.x}" cy="${this.photon.y}" r="19" class="psii-photon psii-photon--${this.photon.color}"/>` : ""}
                </svg></div>
                <div class="psii-tray organelle-experiment-material-tray" aria-label="Excitation materials">
                    <h3>Materials</h3><div class="psii-material-list organelle-experiment-material-list">
                        ${source("psii", "Assembled Photosystem II", PSII_ART, this.assembled, this.selected === "psii")}
                        ${["red", "blue", "green"].map(color => source(`photon-${color}`, `${color[0].toUpperCase()}${color.slice(1)} light`, photonArt(color), Boolean(this.photon), this.selected === `photon-${color}`)).join("")}
                        <div class="organelle-experiment-material psii-material-card psii-reference-card" aria-label="Electron, reference only; not draggable">
                            <div class="psii-reference-art" aria-hidden="true">${ELECTRON_ART}</div>
                            <span class="organelle-experiment-material-name">Electron (already in P680)</span>
                        </div>
                    </div><p>The electron is already in P680. Light transfers energy; it does not add an electron. The animation follows one possible path through a simplified antenna.</p>
                </div></div>${quiz}`;
        if (this.observed) this.root.querySelector("[data-captured-electron]")?.classList.add("psii-electron-shake");
        this.updateControls();
    }
};

export { excitationPath, scoreAnswers };
export default PhotosystemIIExcitationView;
