import Catalog from "./FoodVacuolePhagocytosisCatalog.js";
import ResearchManager from "./ResearchManager.js";
import SubmissionManager
    from "./OrganelleExperimentSubmissionManager.js";
import OrganelleExperimentPanel
    from "./OrganelleExperimentPanel.js";
import SaveManager from "./SaveManager.js";
import gameState from "./GameState.js";

const WRAP_TARGET_COUNT = 6;
const WRAP_TOLERANCE = 1;
const MAX_WRAP_COUNT = 8;
const SEAL_TARGET_COUNT = 5;
const SEAL_TOLERANCE = 1;
const MAX_SEAL_COUNT = 6;

function clamp(value, minimum = 0, maximum = 100) {
    return Math.max(minimum, Math.min(maximum, value));
}

function calculateTargetScore(value, target, tolerance) {
    const distance = Math.abs(value - target);
    if (distance > tolerance) return 0;
    return Math.round(100 - (distance / tolerance) * 20);
}

function quadraticPoint(start, control, end, ratio) {
    const inverse = 1 - ratio;
    return {
        x:
            inverse * inverse * start.x +
            2 * inverse * ratio * control.x +
            ratio * ratio * end.x,
        y:
            inverse * inverse * start.y +
            2 * inverse * ratio * control.y +
            ratio * ratio * end.y
    };
}

function armGeometry(side, wrapCount, engulfmentStep = 0) {
    const progress = clamp(
        wrapCount / WRAP_TARGET_COUNT,
        0,
        1.15
    );
    const engulfmentProgress = clamp(
        engulfmentStep / SEAL_TARGET_COUNT,
        0,
        1
    );
    const postClosureShift = Math.max(
        0,
        engulfmentStep - SEAL_TARGET_COUNT
    ) * 12;
    const direction = side === "upper" ? 1 : -1;
    const start = {
        x: side === "upper" ? 360 : 540,
        y: 350
    };
    const control = {
        x:
            (side === "upper" ? 260 : 640) +
            direction * 48 * engulfmentProgress,
        y:
            225 +
            52 * engulfmentProgress +
            postClosureShift * 0.6
    };
    const finalEnd = {
        x:
            (side === "upper" ? 335 : 565) +
            direction * 81 * engulfmentProgress,
        y:
            75 +
            90 * engulfmentProgress +
            postClosureShift
    };
    const end = quadraticPoint(
        start,
        control,
        finalEnd,
        progress
    );
    return { start, control, finalEnd, end, progress };
}

function armPath(side, wrapCount, engulfmentStep = 0) {
    const geometry = armGeometry(
        side,
        wrapCount,
        engulfmentStep
    );
    const adjustedControl = {
        x:
            geometry.start.x +
            (geometry.control.x - geometry.start.x) *
                geometry.progress,
        y:
            geometry.start.y +
            (geometry.control.y - geometry.start.y) *
                geometry.progress
    };
    return `M${geometry.start.x} ${geometry.start.y} Q${adjustedControl.x} ${adjustedControl.y} ${geometry.end.x} ${geometry.end.y}`;
}

function armFillPath(side, wrapCount, engulfmentStep = 0) {
    const geometry = armGeometry(
        side,
        wrapCount,
        engulfmentStep
    );
    const adjustedControl = {
        x:
            geometry.start.x +
            (geometry.control.x - geometry.start.x) *
                geometry.progress,
        y:
            geometry.start.y +
            (geometry.control.y - geometry.start.y) *
                geometry.progress
    };
    const inwardOffset = side === "upper" ? 34 : -34;
    return [
        `M${geometry.start.x} ${geometry.start.y}`,
        `Q${adjustedControl.x} ${adjustedControl.y} ${geometry.end.x} ${geometry.end.y}`,
        `Q${geometry.end.x + inwardOffset / 2} ${geometry.end.y - 20} ${geometry.end.x + inwardOffset} ${geometry.end.y}`,
        `Q${adjustedControl.x + inwardOffset} ${adjustedControl.y} ${geometry.start.x + inwardOffset} ${geometry.start.y}`,
        "Z"
    ].join(" ");
}


function armActinPath(side, wrapCount, engulfmentStep = 0) {
    const geometry = armGeometry(
        side,
        wrapCount,
        engulfmentStep
    );
    const adjustedControl = {
        x:
            geometry.start.x +
            (geometry.control.x - geometry.start.x) *
                geometry.progress,
        y:
            geometry.start.y +
            (geometry.control.y - geometry.start.y) *
                geometry.progress
    };
    const inwardOffset = side === "upper" ? 19 : -19;
    return [
        `M${geometry.start.x + inwardOffset} ${geometry.start.y}`,
        `Q${adjustedControl.x + inwardOffset} ${adjustedControl.y} ${geometry.end.x + inwardOffset} ${geometry.end.y}`
    ].join(" ");
}

const FoodVacuolePhagocytosisView = {
    root: null,
    events: null,
    state: null,
    sandbox: false,

    clear() {
        this.events?.abort();
        this.events = null;
        this.root = null;
        this.state = null;
    },

    initialState() {
        return {
            missionIndex: 0,
            wrapCount: 0,
            sealCount: 0,
            results: [],
            readyToSave: false,
            saved: false,
            completion: null
        };
    },

    mount(container, { sandbox = false, review = false } = {}) {
        this.clear();
        this.sandbox = sandbox;
        this.root = document.createElement("section");
        this.root.className = "phago-lab";
        container.replaceChildren(this.root);
        if (review) {
            this.renderReview();
            return;
        }
        this.state = this.initialState();
        this.render();
    },

    render() {
        this.events?.abort();
        this.events = new AbortController();
        if (this.state.readyToSave || this.state.saved) {
            this.renderConclusion();
        } else if (this.state.missionIndex === 0) {
            this.renderSurroundMission();
        } else {
            this.renderSealMission();
        }
    },

    renderHeader(title, missionNumber) {
        return `
            <header class="phago-heading">
                <div>
                    <p>Food Vacuole Lab · Phagocytosis Model</p>
                    <h3>${title}</h3>
                </div>
                <strong>Mission ${missionNumber} / 2</strong>
            </header>`;
    },

    meterPosition(value, target, tolerance) {
        return Math.round(
            clamp(50 + (value - target) * (25 / tolerance))
        );
    },

    renderSurroundMission() {
        const score = calculateTargetScore(
            this.state.wrapCount,
            WRAP_TARGET_COUNT,
            WRAP_TOLERANCE
        );
        const band = this.state.wrapCount < WRAP_TARGET_COUNT - WRAP_TOLERANCE
            ? "open"
            : this.state.wrapCount > WRAP_TARGET_COUNT + WRAP_TOLERANCE
                ? "over"
                : "matched";

        this.root.innerHTML = `
            ${this.renderHeader("Mission 1: Surround the Food Particle", 1)}
            <section class="phago-context">
                <strong>One variable: paired pseudopod extension</strong>
                <p>The food particle begins outside the cell. Each tap adds one matched membrane pair, so the left and right pseudopods grow upward together around it.</p>
            </section>
            <div class="phago-workspace">
                <section class="phago-controls">
                    <p class="phago-step">1 · Add matched membrane pairs</p>
                    <h4>Curvature-Supported Pair</h4>
                    <button type="button" class="phago-pair-card" data-action="add-pair" ${this.state.wrapCount >= MAX_WRAP_COUNT ? "disabled" : ""}>
                        <span class="phago-pair-icon" aria-hidden="true"><i></i><i></i></span>
                        <span><strong>Add to Both Pseudopods</strong><small>One tap grows the left and right membrane arms equally.</small></span>
                    </button>
                    <p class="phago-selection" role="status">${this.state.wrapCount} / ${MAX_WRAP_COUNT} matched pairs added</p>
                    <div class="phago-actions">
                        <button type="button" data-action="remove-pair" ${this.state.wrapCount ? "" : "disabled"}>Remove Last Pair</button>
                        <button type="button" data-action="reset-pairs">Reset Cup</button>
                    </div>
                    <div class="phago-reminder">
                        <strong>Transferred knowledge</strong>
                        <p>Curvature-supporting membrane and actin-driven extension were established in the Pseudopodia Lab.</p>
                    </div>
                </section>
                <section class="phago-canvas-panel">
                    <div class="phago-canvas-heading">
                        <div><p class="phago-step">2 · Watch a phagocytic cup form</p><h4>Living Cell Boundary</h4></div>
                        <span>${this.state.wrapCount * 2} paired lipid markers</span>
                    </div>
                    ${this.renderScene({ wrapCount: this.state.wrapCount })}
                </section>
            </div>
            ${this.renderMeter({
                title: "Food-Particle Enclosure",
                left: "Still exposed",
                center: "Surrounded",
                right: "Overwrapped",
                value: this.state.wrapCount,
                target: WRAP_TARGET_COUNT,
                tolerance: WRAP_TOLERANCE,
                band,
                score,
                feedback: this.surroundFeedback(band, score),
                action: "record-surround",
                actionLabel: "Record Phagocytic Cup"
            })}`;

        this.renderMembraneUnits(this.state.wrapCount);
        this.bindSurroundMission();
    },

    renderScene({ wrapCount, sealCount = 0, sealing = false }) {
        const activeEngulfmentStep = sealing ? sealCount : 0;
        const upperPath = armPath(
            "upper",
            wrapCount,
            activeEngulfmentStep
        );
        const lowerPath = armPath(
            "lower",
            wrapCount,
            activeEngulfmentStep
        );
        const sealed =
            sealing && sealCount >= SEAL_TARGET_COUNT;
        const engulfmentProgress = sealing
            ? clamp(
                sealCount / SEAL_TARGET_COUNT,
                0,
                1
            )
            : 0;
        const postClosureShift = sealing
            ? Math.max(0, sealCount - SEAL_TARGET_COUNT) * 12
            : 0;
        const foodY = Math.round(
            175 +
            engulfmentProgress * 95 +
            postClosureShift
        );
        return `
            <svg class="phago-scene${sealed ? " is-sealed" : ""}" viewBox="45 15 810 468" role="img" aria-label="Two pseudopods surrounding an extracellular food particle and forming a food vacuole">
                <rect class="phago-extracellular" x="0" y="0" width="900" height="520"></rect>
                <path class="phago-cell-body" d="M360 350 C300 315 215 350 190 430 C165 510 250 565 450 570 C650 565 735 510 710 430 C685 350 600 315 540 350 L506 350 C495 395 475 415 450 415 C425 415 405 395 394 350 Z"></path>
                <path class="phago-pseudopod-fill" d="${armFillPath("upper", wrapCount, activeEngulfmentStep)}"></path>
                <path class="phago-pseudopod-fill" d="${armFillPath("lower", wrapCount, activeEngulfmentStep)}"></path>
                <rect class="phago-cell-join" x="326" y="346" width="248" height="8"></rect>
                <path class="phago-cell-membrane" d="M360 350 C300 315 215 350 190 430 C165 510 250 565 450 570 C650 565 735 510 710 430 C685 350 600 315 540 350"></path>
                <path class="phago-cup-base" d="M394 350 C394 395 415 415 450 415 C485 415 506 395 506 350"></path>
                ${wrapCount === 0 ? `<g class="phago-zero-caps"><path class="phago-zero-cap" d="M360 350 Q377 338 394 350"></path><path class="phago-zero-cap" d="M506 350 Q523 338 540 350"></path></g>` : ""}
                <text class="phago-region-label" x="835" y="40" text-anchor="end">EXTRACELLULAR SPACE</text>
                <text class="phago-cytosol-label" x="390" y="500">CYTOSOL</text>
                ${sealing ? "" : `<path class="phago-target-arm" d="${armPath("upper", WRAP_TARGET_COUNT)}"></path><path class="phago-target-arm" d="${armPath("lower", WRAP_TARGET_COUNT)}"></path>`}
                <path class="phago-membrane-arm phago-membrane-arm--upper" d="${upperPath}"></path>
                <path class="phago-membrane-arm phago-membrane-arm--lower" d="${lowerPath}"></path>
                <path class="phago-actin-arm phago-actin-arm--upper" d="${armActinPath("upper", wrapCount, activeEngulfmentStep)}"></path>
                <path class="phago-actin-arm phago-actin-arm--lower" d="${armActinPath("lower", wrapCount, activeEngulfmentStep)}"></path>
                <g class="phago-membrane-units"></g>
                <g class="phago-food-particle" transform="translate(450 ${foodY})">
                    <path d="M-52 -20 C-39 -51 2 -57 34 -41 C62 -27 67 10 44 37 C18 64 -28 54 -52 25 C-65 9 -65 -5 -52 -20Z"></path>
                    <circle cx="-24" cy="-12" r="6"></circle>
                    <circle cx="14" cy="19" r="7"></circle>
                    <circle cx="29" cy="-18" r="5"></circle>
                    <text x="0" y="4">FOOD</text>
                </g>
                ${sealing ? `
                    <text class="phago-vacuole-label" x="555" y="318" text-anchor="start">${sealed ? "FOOD VACUOLE" : "PHAGOCYTIC CUP"}</text>` : ""}
            </svg>`;
    },

    renderMembraneUnits(wrapCount, engulfmentStep = 0) {
        const group = this.root.querySelector(".phago-membrane-units");
        if (!group) return;
        ["upper", "lower"].forEach(side => {
            const geometry = armGeometry(
                side,
                WRAP_TARGET_COUNT,
                engulfmentStep
            );
            for (let index = 0; index < wrapCount; index += 1) {
                const ratio = Math.min(
                    (index + 1) / WRAP_TARGET_COUNT,
                    1.15
                );
                const point = quadraticPoint(
                    geometry.start,
                    geometry.control,
                    geometry.finalEnd,
                    ratio
                );
                const circle = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "circle"
                );
                circle.setAttribute("class", `phago-unit phago-unit--${side}`);
                circle.setAttribute("cx", String(point.x));
                circle.setAttribute("cy", String(point.y));
                circle.setAttribute("r", "6.5");
                const innerCircle = circle.cloneNode();
                innerCircle.classList.add("is-inner");
                innerCircle.setAttribute(
                    "cx",
                    String(
                        point.x +
                        (side === "upper" ? 34 : -34)
                    )
                );
                group.append(circle, innerCircle);
            }
        });
    },

    renderMeter({
        title,
        left,
        center,
        right,
        value,
        target,
        tolerance,
        band,
        score,
        feedback,
        action,
        actionLabel
    }) {
        const label = band === "matched"
            ? `Target matched · ${score}%`
            : band === "open" || band === "loose"
                ? left
                : right;
        return `
            <section class="phago-meter-panel">
                <div class="phago-meter-heading">
                    <div><p class="phago-step">3 · Match one target</p><h4>${title}</h4></div>
                    <strong class="phago-reading phago-reading--${band}">${label}</strong>
                </div>
                <div class="phago-meter" role="meter" aria-label="${title}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${this.meterPosition(value, target, tolerance)}">
                    <div><span>${left}</span></div><div><span>${center}</span></div><div><span>${right}</span></div>
                    <i style="left:${this.meterPosition(value, target, tolerance)}%"></i>
                </div>
                <p class="phago-feedback" role="status">${feedback}</p>
                ${score >= 80 ? `<button type="button" class="phago-continue" data-action="${action}">${actionLabel} · ${score}%</button>` : ""}
            </section>`;
    },

    surroundFeedback(band, score) {
        if (band === "open") {
            return "The food particle is still exposed to extracellular space. Add another matched membrane pair.";
        }
        if (band === "over") {
            return "The teaching model has extended past the closure zone. Remove one matched pair.";
        }
        return `Both pseudopods surround the particle at ${score}%. The membrane neck remains open for Mission 2.`;
    },

    bindSurroundMission() {
        const signal = this.events.signal;
        this.root.querySelector('[data-action="add-pair"]')
            ?.addEventListener("click", () => {
                this.state.wrapCount = Math.min(
                    MAX_WRAP_COUNT,
                    this.state.wrapCount + 1
                );
                this.render();
            }, { signal });
        this.root.querySelector('[data-action="remove-pair"]')
            ?.addEventListener("click", () => {
                this.state.wrapCount = Math.max(0, this.state.wrapCount - 1);
                this.render();
            }, { signal });
        this.root.querySelector('[data-action="reset-pairs"]')
            ?.addEventListener("click", () => {
                this.state.wrapCount = 0;
                this.render();
            }, { signal });
        this.root.querySelector('[data-action="record-surround"]')
            ?.addEventListener("click", () => this.recordSurround(), { signal });
    },

    recordSurround() {
        const score = calculateTargetScore(
            this.state.wrapCount,
            WRAP_TARGET_COUNT,
            WRAP_TOLERANCE
        );
        if (score < 80) return;
        this.state.results.push({
            missionId: "surround_food_particle",
            score,
            matchedPairCount: this.state.wrapCount,
            membraneUnitCount: this.state.wrapCount * 2
        });
        this.state.missionIndex = 1;
        this.render();
    },

    renderSealMission() {
        const score = calculateTargetScore(
            this.state.sealCount,
            SEAL_TARGET_COUNT,
            SEAL_TOLERANCE
        );
        const band = this.state.sealCount < SEAL_TARGET_COUNT - SEAL_TOLERANCE
            ? "loose"
            : this.state.sealCount > SEAL_TARGET_COUNT + SEAL_TOLERANCE
                ? "over"
                : "matched";

        this.root.innerHTML = `
            ${this.renderHeader("Mission 2: Pinch Off and Seal", 2)}
            <section class="phago-context phago-context--seal">
                <strong>New variable: engulfment progression</strong>
                <p>Continue actin-driven pseudopod movement. Each step brings both cup margins inward and carries the enclosed food particle deeper into the cell before membrane closure.</p>
            </section>
            <div class="phago-workspace">
                <section class="phago-controls">
                    <p class="phago-step">1 · Constrict the membrane neck</p>
                    <h4>Engulfment Step</h4>
                    <button type="button" class="phago-seal-card" data-action="add-seal" ${this.state.sealCount >= MAX_SEAL_COUNT ? "disabled" : ""}>
                        <span aria-hidden="true"><i></i><i></i><i></i></span>
                        <span><strong>Advance Engulfment</strong><small>Each tap moves both pseudopods inward and draws the food particle deeper into the cell.</small></span>
                    </button>
                    <p class="phago-selection" role="status">${this.state.sealCount} / ${MAX_SEAL_COUNT} engulfment steps</p>
                    <div class="phago-actions">
                        <button type="button" data-action="remove-seal" ${this.state.sealCount ? "" : "disabled"}>Undo Step</button>
                        <button type="button" data-action="reset-seal">Reset Engulfment</button>
                    </div>
                    <div class="phago-reminder">
                        <strong>Simplified model</strong>
                        <p>Actin remodeling extends and reshapes the pseudopods; membrane-remodeling proteins help complete the final seal.</p>
                    </div>
                </section>
                <section class="phago-canvas-panel">
                    <div class="phago-canvas-heading">
                        <div><p class="phago-step">2 · Watch extracellular become intracellular</p><h4>Food Vacuole Formation</h4></div>
                        <span>${this.state.sealCount >= 4 ? "Membrane sealed" : "Cup open"}</span>
                    </div>
                    ${this.renderScene({
                        wrapCount: WRAP_TARGET_COUNT,
                        sealCount: this.state.sealCount,
                        sealing: true
                    })}
                </section>
            </div>
            ${this.renderMeter({
                title: "Pseudopod Closure",
                left: "Cup open",
                center: "Internalized",
                right: "Past target",
                value: this.state.sealCount,
                target: SEAL_TARGET_COUNT,
                tolerance: SEAL_TOLERANCE,
                band,
                score,
                feedback: this.sealFeedback(band, score),
                action: "record-seal",
                actionLabel: "Record Internalization"
            })}`;

        this.renderMembraneUnits(
            WRAP_TARGET_COUNT,
            this.state.sealCount
        );
        this.bindSealMission();
    },

    sealFeedback(band, score) {
        if (band === "loose") {
            return "The cup is still connected to extracellular space. Advance both pseudopods farther around the particle.";
        }
        if (band === "over") {
            return "The model has advanced past the clean internalization target. Undo one step.";
        }
        return `The neck is functionally sealed at ${score}%. The enclosed particle is now inside a food vacuole.`;
    },

    bindSealMission() {
        const signal = this.events.signal;
        this.root.querySelector('[data-action="add-seal"]')
            ?.addEventListener("click", () => {
                this.state.sealCount = Math.min(
                    MAX_SEAL_COUNT,
                    this.state.sealCount + 1
                );
                this.render();
            }, { signal });
        this.root.querySelector('[data-action="remove-seal"]')
            ?.addEventListener("click", () => {
                this.state.sealCount = Math.max(0, this.state.sealCount - 1);
                this.render();
            }, { signal });
        this.root.querySelector('[data-action="reset-seal"]')
            ?.addEventListener("click", () => {
                this.state.sealCount = 0;
                this.render();
            }, { signal });
        this.root.querySelector('[data-action="record-seal"]')
            ?.addEventListener("click", () => this.recordSeal(), { signal });
    },

    recordSeal() {
        const score = calculateTargetScore(
            this.state.sealCount,
            SEAL_TARGET_COUNT,
            SEAL_TOLERANCE
        );
        if (score < 80) return;
        this.state.results.push({
            missionId: "pinch_and_seal",
            score,
            constrictionPulseCount: this.state.sealCount
        });
        this.state.readyToSave = true;
        this.render();
    },

    averageScore() {
        if (!this.state?.results?.length) return 0;
        return Math.round(
            this.state.results.reduce(
                (sum, result) => sum + result.score,
                0
            ) / this.state.results.length
        );
    },

    renderConclusion() {
        const totalScore = this.averageScore();
        const reward = this.state.saved
            ? `${this.state.completion?.xpAwarded ?? 0} XP awarded. Successful Phagocytosis and Food Vacuole Formation discovered.`
            : `Both missions are complete at ${totalScore}%.`;
        this.root.innerHTML = `
            <section class="phago-conclusion">
                <span aria-hidden="true">✓</span>
                <p>Food Vacuole Lab complete</p>
                <h3>The extracellular food particle is now intracellular</h3>
                <p>Paired pseudopods formed a cup around the particle. Actin–myosin constriction and membrane remodeling then sealed the cup as a food vacuole.</p>
                <p><strong>The new food vacuole is derived from the cell's plasma membrane.</strong></p>
                <p>${reward}</p>
                ${this.state.saved ? "" : `<button type="button" data-action="save">${this.sandbox ? "Complete Practice Run" : `Save Investigation · ${totalScore}%`}</button>`}
            </section>`;
        this.root.querySelector('[data-action="save"]')
            ?.addEventListener("click", () => this.submit(), {
                signal: this.events.signal
            });
    },

    submit() {
        if (this.sandbox) {
            this.state.saved = true;
            this.render();
            return;
        }
        const backup = structuredClone(gameState);
        try {
            const scorePercent = this.averageScore();
            const completion = ResearchManager.completeExperiment(Catalog.id);
            if (!completion.completed) throw new Error(completion.reason);
            const report = {
                scorePoints: scorePercent,
                scoreMaximum: 100,
                scorePercent,
                isPerfect: scorePercent === 100,
                checks: this.state.results.map(result => ({
                    id: `${result.missionId}_matched`,
                    passed: result.score >= 80,
                    awardedPoints: result.score / 2,
                    maximumPoints: 50
                }))
            };
            const submission = SubmissionManager.recordSubmission({
                experiment: Catalog,
                report,
                completion,
                placementSnapshot: {
                    missionResults: structuredClone(this.state.results),
                    wrapCount: this.state.wrapCount,
                    sealCount: this.state.sealCount
                },
                attemptSnapshot: {
                    observations: {
                        particleStartedExtracellular: true,
                        pairedPseudopodsSurroundedParticle: true,
                        sealedVacuoleBecameIntracellular: true
                    }
                }
            });
            if (
                !submission ||
                !SaveManager.save({ reason: "food-vacuole-phagocytosis" })
            ) {
                throw new Error("save-failed");
            }
            this.state.completion = completion;
            this.state.saved = true;
            OrganelleExperimentPanel.refresh();
            this.render();
        } catch (error) {
            for (const key of Object.keys(gameState)) delete gameState[key];
            Object.assign(gameState, backup);
            const message = document.createElement("p");
            message.className = "phago-feedback";
            message.textContent =
                "Saving failed. Both completed missions remain here; try Save Investigation again.";
            this.root.querySelector(".phago-conclusion")?.appendChild(message);
        }
    },

    renderReview() {
        const record = SubmissionManager.getSubmissions(Catalog.id).at(-1);
        const results = record?.placementSnapshot?.missionResults ?? [];
        this.root.innerHTML = `
            <section class="phago-conclusion">
                <p>Phagocytosis submission review</p>
                <h3>${record ? `${record.scorePoints} / ${record.scoreMaximum}` : "No saved submission"}</h3>
                ${record
                    ? `<ul>${results.map(result => `<li>${result.missionId === "surround_food_particle" ? "Surround Food Particle" : "Pinch and Seal"}: ${result.score}%</li>`).join("")}</ul><p>The particle began extracellularly and ended inside a sealed, plasma-membrane-derived food vacuole.</p>`
                    : "<p>Complete and save both phagocytosis missions to create a review record.</p>"}
            </section>`;
    }
};

export {
    MAX_SEAL_COUNT,
    MAX_WRAP_COUNT,
    SEAL_TARGET_COUNT,
    SEAL_TOLERANCE,
    WRAP_TARGET_COUNT,
    WRAP_TOLERANCE,
    armActinPath,
    armFillPath,
    armGeometry,
    calculateTargetScore
};

export default FoodVacuolePhagocytosisView;
