// A local, unsaved assembly preview. Electron transfer belongs to a later stage.
import Catalog from "./PhotosystemIIAssemblyCatalog.js";
import ResearchManager from "./ResearchManager.js";
import SubmissionManager from "./OrganelleExperimentSubmissionManager.js";
import OrganelleExperimentPanel from "./OrganelleExperimentPanel.js";
import SaveManager from "./SaveManager.js";
import gameState from "./GameState.js";

const CHLOROPHYLLS = [
    [330, 205], [300, 285], [350, 365],
    [570, 205], [600, 285], [550, 365]
];
const REQUIRED = [
    "psii", "acceptor", "p680",
    ...CHLOROPHYLLS.map((_, index) => `chl${index}`)
];

function scoreAnswers(answers) {
    const checks = Catalog.assessment.questions.map(question => ({
        id: question.id,
        selectedOptionId: answers[question.id] ?? null,
        correctOptionId: question.correctOptionId,
        passed: answers[question.id] === question.correctOptionId,
        awardedPoints: answers[question.id] === question.correctOptionId ? 1 : 0,
        maximumPoints: 1
    }));
    const scorePoints = checks.filter(check => check.passed).length;
    return {
        scorePoints,
        scoreMaximum: checks.length,
        scorePercent: scorePoints / checks.length * 100,
        isPerfect: scorePoints === checks.length,
        checks
    };
}

function materialFor(target) {
    return target.startsWith("chl") ? "chlorophyll" : target;
}

function membrane() {
    const heads = Array.from({ length: 18 }, (_, i) => 26 + i * 50)
        .map(x => `<ellipse cx="${x}" cy="174" rx="19" ry="15"/><ellipse cx="${x}" cy="426" rx="19" ry="15"/>`).join("");
    const tails = Array.from({ length: 36 }, (_, i) => 13 + i * 25)
        .map(x => `<path d="M${x} 198 q-9 27 0 52 t0 52 M${x} 400 q9-27 0-52 t0-52"/>`).join("");
    return `<g class="psii-heads">${heads}</g><g class="psii-tails">${tails}</g>`;
}

function source(material, label, art, disabled, selected) {
    return `<div class="organelle-experiment-material psii-material-card">
        <button type="button" class="psii-source ${selected ? "selected" : ""}"
            data-material="${material}" aria-label="Drag ${label}" ${disabled ? "disabled" : ""}>
            ${art}
        </button>
        <span class="organelle-experiment-material-name">${label}</span>
    </div>`;
}

const PSII_ART = `<svg viewBox="0 0 92 100" aria-hidden="true" focusable="false">
    <path d="M10 22 C10 8 28 5 46 17 C64 5 82 8 82 22 L86 79 C82 96 63 96 46 83 C29 96 10 96 6 79 Z" fill="#925099" stroke="#29132e" stroke-width="3"/>
    <rect x="37" y="19" width="18" height="64" rx="8" fill="#9ccfe6" stroke="#173447" stroke-width="3"/>
</svg>`;
const CHL_ART = `<svg viewBox="0 0 92 100" aria-hidden="true" focusable="false"><circle cx="46" cy="50" r="27" fill="#6bbd37" stroke="#173d13" stroke-width="4"/></svg>`;
const P680_ART = `<svg viewBox="0 0 92 100" aria-hidden="true" focusable="false"><circle cx="33" cy="50" r="23" fill="#6bbd37" stroke="#173d13" stroke-width="4"/><circle cx="59" cy="50" r="23" fill="#6bbd37" stroke="#173d13" stroke-width="4"/></svg>`;
const ACCEPTOR_ART = `<svg viewBox="0 0 92 100" aria-hidden="true" focusable="false"><rect x="20" y="24" width="52" height="52" rx="8" fill="#86c8e9" stroke="#173447" stroke-width="4"/></svg>`;

const PhotosystemIIAssemblyView = {
    root: null,
    events: null,
    placed: new Set(),
    selected: null,
    dragging: null,
    answers: {},
    result: null,
    sandbox: false,

    clear() {
        this.events?.abort();
        this.events = null;
        this.dragging?.ghost?.remove();
        this.dragging = null;
        this.root = null;
        this.selected = null;
    },

    mount(container, { sandbox = false, review = false } = {}) {
        this.clear();
        this.sandbox = sandbox;
        this.placed = new Set();
        this.answers = {};
        this.result = null;
        this.root = document.createElement("section");
        this.root.className = "psii-lab";
        container.replaceChildren(this.root);
        if (review) {
            const latest = SubmissionManager.getSubmissions(Catalog.id).at(-1);
            this.root.innerHTML = latest
                ? `<div class="psii-intro"><h3>Saved submission</h3><p>${latest.scorePoints} / ${latest.scoreMaximum} correct</p><p>${latest.isPerfect ? "Excite Photosystem II unlocked." : "A perfect score is needed to unlock the next lab."}</p></div>`
                : `<div class="psii-intro"><p>No saved submission is available.</p></div>`;
            return;
        }
        this.events = new AbortController();
        const signal = this.events.signal;

        this.root.addEventListener("pointerdown", event => {
            const item = event.target.closest("[data-material]");
            if (!item || item.disabled) return;
            event.preventDefault();
            const material = item.dataset.material;
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
            const target = hit?.closest("[data-target]");
            if (target && this.root.contains(target)) {
                this.place(material, target.dataset.target);
            } else {
                this.render();
            }
        }, { signal });

        this.root.addEventListener("click", event => {
            if (event.target.closest("[data-submit-quiz]")) {
                this.submit();
                return;
            }
            if (event.target.closest("[data-retry-quiz]")) {
                this.answers = {};
                this.result = null;
                this.render();
                return;
            }
            if (event.target.closest("[data-reset]")) {
                this.placed.clear();
                this.selected = null;
                this.render();
                return;
            }
            const item = event.target.closest("[data-material]");
            if (item && !item.disabled) {
                this.selected = item.dataset.material;
                this.render();
                return;
            }
            const target = event.target.closest("[data-target]");
            if (target && this.selected) {
                this.place(this.selected, target.dataset.target);
            }
        }, { signal });
        this.root.addEventListener("change", event => {
            const input = event.target.closest("input[data-question]");
            if (!input) return;
            this.answers[input.dataset.question] = input.value;
            const submit = this.root.querySelector("[data-submit-quiz]");
            if (submit) submit.disabled =
                Catalog.assessment.questions.some(question =>
                    !this.answers[question.id]
                );
        }, { signal });
        this.render();
    },

    submit() {
        if (!REQUIRED.every(id => this.placed.has(id)) ||
            Catalog.assessment.questions.some(question => !this.answers[question.id]) ||
            this.result) return;

        const report = scoreAnswers(this.answers);
        if (this.sandbox) {
            this.result = report;
            this.render();
            return;
        }

        const backup = structuredClone(gameState);
        try {
            const completion = report.isPerfect
                ? ResearchManager.completeExperiment(Catalog.id)
                : null;
            if (report.isPerfect && !completion?.completed) {
                throw new Error(completion?.reason ?? "completion-failed");
            }
            const submission = SubmissionManager.recordSubmission({
                experiment: Catalog,
                report,
                completion,
                placementSnapshot: { placedParts: [...this.placed] },
                attemptSnapshot: { answers: { ...this.answers } }
            });
            if (!submission || !SaveManager.save({ reason: "photosystem-ii-assembly-submission" })) {
                throw new Error("save-failed");
            }
            this.result = report;
            OrganelleExperimentPanel.refresh();
            this.render();
        } catch (error) {
            for (const key of Object.keys(gameState)) delete gameState[key];
            Object.assign(gameState, backup);
            this.render("Score could not be saved. Please try Submit for Score again.");
        }
    },

    moveGhost(event) {
        const ghost = this.dragging?.ghost;
        if (!ghost) return;
        ghost.style.left = `${event.clientX}px`;
        ghost.style.top = `${event.clientY}px`;
    },

    place(material, target) {
        if (this.placed.has(target) || materialFor(target) !== material ||
            (target !== "psii" && !this.placed.has("psii"))) {
            this.render("Place Photosystem II first, then match each piece to its dotted target.");
            return;
        }
        this.placed.add(target);
        this.selected = null;
        this.render();
    },

    render(message = "") {
        if (!this.root) return;
        const has = id => this.placed.has(id);
        const chlCount = CHLOROPHYLLS.filter((_, i) => has(`chl${i}`)).length;
        const complete = REQUIRED.every(id => has(id));
        const questions = complete ? `<section class="psii-quiz" aria-labelledby="psii-quiz-title">
            <h3 id="psii-quiz-title">Check your model</h3>
            <p>Answer all three questions. A score of 3/3 unlocks Excite Photosystem II.</p>
            ${Catalog.assessment.questions.map((question, index) => `<fieldset>
                <legend>${index + 1}. ${question.prompt}</legend>
                ${question.options.map(option => `<label><input type="radio" name="${question.id}" data-question="${question.id}" value="${option.id}" ${this.answers[question.id] === option.id ? "checked" : ""} ${this.result ? "disabled" : ""}> ${option.text}</label>`).join("")}
            </fieldset>`).join("")}
            ${this.result ? `<p class="psii-score" role="status">Score: ${this.result.scorePoints}/${this.result.scoreMaximum}. ${this.result.isPerfect ? "Excite Photosystem II unlocked." : "Review the model and try again."}</p>
                ${this.result.isPerfect ? "" : `<button type="button" data-retry-quiz>Try questions again</button>`}`
                : `<button type="button" data-submit-quiz ${Catalog.assessment.questions.some(question => !this.answers[question.id]) ? "disabled" : ""}>Submit for Score</button>`}
            </section>` : "";
        const pigments = CHLOROPHYLLS.map(([x, y], i) =>
            `<circle data-target="chl${i}" cx="${x}" cy="${y}" r="25" class="psii-target ${has(`chl${i}`) ? "psii-filled" : ""}"/>`
        ).join("");
        this.root.innerHTML = `
            <div class="psii-intro">
                <p><strong>Assembly preview:</strong> Build a simplified Photosystem II in the alga's thylakoid membrane. Drag pieces onto dotted targets, or select a piece and then a target.</p>
                <p class="psii-progress" aria-live="polite">${complete ? "Assembly complete. Answer the questions below to unlock the next lab." : `${this.placed.size} of ${REQUIRED.length} parts placed.`} ${message}</p>
            </div>
            <div class="psii-workspace">
                <div class="psii-board">
                    <svg viewBox="0 0 900 570" role="img" aria-label="Thylakoid membrane with Photosystem II assembly targets">
                        <rect width="900" height="570" rx="24" class="psii-background"/>
                        <text x="40" y="82" class="psii-side-label">STROMA</text>
                        <text x="40" y="522" class="psii-side-label">THYLAKOID LUMEN</text>
                        ${membrane()}
                        <path data-target="psii" d="M290 160 C285 100 390 98 450 135 C510 98 615 100 610 160 L625 416 C620 496 510 490 450 454 C390 490 280 496 275 416 Z" class="psii-body ${has("psii") ? "psii-body-filled" : ""}"/>
                        ${has("psii") ? `<rect x="415" y="175" width="70" height="245" rx="30" class="psii-core"/>` : ""}
                        <rect data-target="acceptor" x="414" y="205" width="72" height="72" rx="12" class="psii-acceptor ${has("acceptor") ? "psii-acceptor-filled" : ""}"/>
                        ${pigments}
                        <g data-target="p680" class="psii-p680 ${has("p680") ? "psii-filled" : ""}">
                            <circle cx="426" cy="369" r="25"/><circle cx="474" cy="369" r="25"/>
                        </g>
                        <text x="450" y="305" text-anchor="middle" class="psii-center-label">PSII</text>
                        <text x="450" y="460" text-anchor="middle" class="psii-small-label">P680</text>
                        <text x="450" y="196" text-anchor="middle" class="psii-small-label">PRIMARY ACCEPTOR</text>
                    </svg>
                </div>
                <div class="psii-tray organelle-experiment-material-tray" aria-label="Assembly materials">
                    <h3>Materials</h3>
                    <div class="psii-material-list organelle-experiment-material-list">
                        ${source("psii", "Photosystem II", PSII_ART, has("psii"), this.selected === "psii")}
                        ${source("chlorophyll", `Chlorophyll a (${chlCount}/${CHLOROPHYLLS.length})`, CHL_ART, chlCount === CHLOROPHYLLS.length, this.selected === "chlorophyll")}
                        ${source("p680", "P680 pair", P680_ART, has("p680"), this.selected === "p680")}
                        ${source("acceptor", "Primary acceptor (pheophytin)", ACCEPTOR_ART, has("acceptor"), this.selected === "acceptor")}
                    </div>
                    <button class="psii-reset" type="button" data-reset>Reset assembly</button>
                    <p>The six green antenna circles stand in for many chlorophylls. P680 is the reaction-center pair; pheophytin is the first electron acceptor. No reaction is simulated here.</p>
                </div>
            </div>
            ${questions}`;
    }
};

export { scoreAnswers };
export default PhotosystemIIAssemblyView;
