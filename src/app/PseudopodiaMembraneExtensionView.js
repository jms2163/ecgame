import Catalog from "./PseudopodiaMembraneExtensionCatalog.js";
import ResearchManager from "./ResearchManager.js";
import SubmissionManager
    from "./OrganelleExperimentSubmissionManager.js";
import OrganelleExperimentPanel
    from "./OrganelleExperimentPanel.js";
import SaveManager from "./SaveManager.js";
import gameState from "./GameState.js";

const LIPID_SLOT_COUNT = 28;
const CURVATURE_TARGET_COUNT = 18;
const CURVATURE_TOLERANCE = 2;
const ACTIN_TARGET_COUNT = 5;
const ACTIN_TOLERANCE = 1;
const MAX_ACTIN_UNITS = 6;

const LIPID_TYPES = Object.freeze({
    neutral: Object.freeze({
        id: "neutral",
        name: "Neutral Lipid",
        shape: "Cylindrical",
        description: "Maintains the straighter membrane arms."
    }),
    curvature: Object.freeze({
        id: "curvature",
        name: "Curvature Lipid",
        shape: "Inverted-cone",
        description: "Its larger headgroup favors the rounded leading edge."
    })
});

function clamp(value, minimum = 0, maximum = 100) {
    return Math.max(minimum, Math.min(maximum, value));
}

function calculateTargetScore(value, target, tolerance) {
    const distance = Math.abs(value - target);
    if (distance > tolerance) return 0;
    return Math.round(100 - (distance / tolerance) * 20);
}

function calculatePseudopodTipX(curvatureCount) {
    return Math.round(clamp(360 + curvatureCount * 18, 360, 820));
}

function pseudopodPath(tipX) {
    const shoulderX = Math.max(250, tipX - 95);
    return `M145 135 C270 135 ${shoulderX} 136 ${tipX} 195 C${shoulderX} 254 270 255 145 255`;
}

function lipidPoint(index, tipX) {
    const centerX = tipX - 55;
    if (index < 9) {
        const ratio = index / 8;
        return {
            x: 165 + (centerX - 165) * ratio,
            y: 145,
            tailX: 0,
            tailY: 13
        };
    }
    if (index < 19) {
        const ratio = (index - 9) / 9;
        const angle = -Math.PI / 2 + ratio * Math.PI;
        return {
            x: centerX + Math.cos(angle) * 55,
            y: 195 + Math.sin(angle) * 50,
            tailX: -Math.cos(angle) * 13,
            tailY: -Math.sin(angle) * 13
        };
    }
    const ratio = (index - 19) / 8;
    return {
        x: centerX - (centerX - 165) * ratio,
        y: 245,
        tailX: 0,
        tailY: -13
    };
}

const PseudopodiaMembraneExtensionView = {
    events: null,
    root: null,
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
            lipidSlots: Array(LIPID_SLOT_COUNT).fill(null),
            selectedLipid: "curvature",
            lipidActions: [],
            actinUnits: 0,
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
        this.root.className = "pseudo-extension-lab";
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
            this.renderMembraneMission();
        } else {
            this.renderActinMission();
        }
    },

    renderHeader(title, missionNumber) {
        return `
            <header class="pseudo-heading">
                <div>
                    <p>Cytoskeleton Lab · Pseudopod Model</p>
                    <h3>${title}</h3>
                </div>
                <strong>Mission ${missionNumber} / 2</strong>
            </header>`;
    },

    renderMembraneMission() {
        const filledCount = this.state.lipidSlots.filter(Boolean).length;
        const curvatureCount = this.curvatureCount();
        const complete = filledCount === LIPID_SLOT_COUNT;
        const score = complete
            ? calculateTargetScore(
                curvatureCount,
                CURVATURE_TARGET_COUNT,
                CURVATURE_TOLERANCE
            )
            : 0;
        const tipX = calculatePseudopodTipX(curvatureCount);
        const targetTipX = calculatePseudopodTipX(
            CURVATURE_TARGET_COUNT
        );
        const band = !complete
            ? "building"
            : curvatureCount < CURVATURE_TARGET_COUNT - CURVATURE_TOLERANCE
                ? "short"
                : curvatureCount > CURVATURE_TARGET_COUNT + CURVATURE_TOLERANCE
                    ? "over"
                    : "matched";

        this.root.innerHTML = `
            ${this.renderHeader("Mission 1: Curve and Extend the Membrane", 1)}
            <section class="pseudo-context">
                <strong>One variable: curvature-lipid amount</strong>
                <p>Build one continuous plasma-membrane extension from 28 small lipids. The dotted outline marks the target pseudopod. Cytoskeletal pushing is introduced in Mission 2.</p>
            </section>
            <div class="pseudo-workspace">
                <section class="pseudo-controls">
                    <p class="pseudo-step">1 · Tap a lipid to build left to right</p>
                    <h4>Membrane Lipids</h4>
                    <div class="pseudo-lipid-cards">
                        ${Object.values(LIPID_TYPES).map(type => `
                            <button type="button" class="pseudo-lipid-card pseudo-lipid-card--${type.id}${this.state.selectedLipid === type.id ? " is-selected" : ""}" data-lipid-type="${type.id}" aria-pressed="${this.state.selectedLipid === type.id}">
                                <i aria-hidden="true"></i>
                                <span><strong>${type.name}</strong><b>${type.shape}</b><small>${type.description}</small></span>
                            </button>`).join("")}
                    </div>
                    <p class="pseudo-selection" role="status">${LIPID_TYPES[this.state.selectedLipid].name} selected · ${filledCount} / ${LIPID_SLOT_COUNT} placed</p>
                    <div class="pseudo-actions">
                        <button type="button" data-action="undo" ${this.state.lipidActions.length ? "" : "disabled"}>Undo Last</button>
                        <button type="button" data-action="reset">Reset Membrane</button>
                    </div>
                    <div class="pseudo-key">
                        <span><i class="is-neutral"></i>Neutral cylindrical lipid</span>
                        <span><i class="is-curvature"></i>Curvature-promoting inverted cone</span>
                    </div>
                </section>
                <section class="pseudo-canvas-panel">
                    <div class="pseudo-canvas-heading">
                        <div><p class="pseudo-step">2 · Watch the leading edge extend</p><h4>Living Pseudopod Canvas</h4></div>
                        <span>${curvatureCount} shaping lipids</span>
                    </div>
                    <svg class="pseudo-scene" viewBox="0 0 900 390" role="img" aria-label="Amoeba membrane extending toward a dotted pseudopod target">
                        <text x="38" y="35" class="pseudo-side-label">EXTRACELLULAR FLUID</text>
                        <path class="pseudo-target" d="${pseudopodPath(targetTipX)}"></path>
                        <path class="pseudo-current" d="${pseudopodPath(tipX)}"></path>
                        <ellipse class="pseudo-cell-body" cx="112" cy="195" rx="102" ry="158"></ellipse>
                        <text x="75" y="200" class="pseudo-cell-label">CELL</text>
                        <g class="pseudo-lipid-layer"></g>
                        <text x="420" y="355" class="pseudo-cytosol-label">CYTOSOL · ACTIN ADDED IN MISSION 2</text>
                    </svg>
                </section>
            </div>
            <section class="pseudo-meter-panel">
                <div class="pseudo-meter-heading">
                    <div><p class="pseudo-step">3 · Match one target</p><h4>Leading-Edge Curvature</h4></div>
                    <strong class="pseudo-reading pseudo-reading--${band}">${this.membraneBandLabel(band, score)}</strong>
                </div>
                <div class="pseudo-meter" role="meter" aria-label="Leading-edge curvature match" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${this.meterPosition(curvatureCount, CURVATURE_TARGET_COUNT, CURVATURE_TOLERANCE)}">
                    <div><span>Too short</span></div><div><span>Target</span></div><div><span>Over-curved</span></div>
                    <i style="left:${this.meterPosition(curvatureCount, CURVATURE_TARGET_COUNT, CURVATURE_TOLERANCE)}%"></i>
                </div>
                <p class="pseudo-feedback" role="status">${this.membraneFeedback(band, filledCount, score)}</p>
                ${score >= 80 ? `<button type="button" class="pseudo-continue" data-action="record-membrane">Record Membrane · ${score}%</button>` : ""}
            </section>`;

        this.renderLipids(tipX);
        this.bindMembraneMission();
    },

    renderLipids(tipX) {
        const group = this.root.querySelector(".pseudo-lipid-layer");
        this.state.lipidSlots.forEach((type, index) => {
            const point = lipidPoint(index, tipX);
            const node = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "g"
            );
            node.classList.add("pseudo-lipid", type ? `is-${type}` : "is-empty");
            node.dataset.lipidPosition = String(index);
            node.setAttribute("role", "button");
            node.setAttribute("tabindex", "0");
            node.setAttribute("aria-label", type
                ? `Membrane position ${index + 1}: ${LIPID_TYPES[type].name}`
                : `Membrane position ${index + 1}: empty`);
            node.innerHTML = type
                ? `<line x1="${point.x}" y1="${point.y}" x2="${point.x + point.tailX}" y2="${point.y + point.tailY}"></line><circle cx="${point.x}" cy="${point.y}" r="${type === "curvature" ? 7 : 6}"></circle>`
                : `<circle class="pseudo-empty-slot" cx="${point.x}" cy="${point.y}" r="7"></circle>`;
            group.appendChild(node);
        });
    },

    bindMembraneMission() {
        const signal = this.events.signal;
        this.root.querySelectorAll("[data-lipid-type]").forEach(card => {
            card.addEventListener("click", () => {
                this.state.selectedLipid = card.dataset.lipidType;
                const next = this.state.lipidSlots.indexOf(null);
                if (next >= 0) this.setLipid(next, this.state.selectedLipid);
                else this.render();
            }, { signal });
        });
        this.root.querySelectorAll("[data-lipid-position]").forEach(slot => {
            const replace = () => this.setLipid(
                Number(slot.dataset.lipidPosition),
                this.state.selectedLipid
            );
            slot.addEventListener("click", replace, { signal });
            slot.addEventListener("keydown", event => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    replace();
                }
            }, { signal });
        });
        this.root.querySelector('[data-action="undo"]')
            ?.addEventListener("click", () => {
                const action = this.state.lipidActions.pop();
                if (action) this.state.lipidSlots[action.index] = action.previous;
                this.render();
            }, { signal });
        this.root.querySelector('[data-action="reset"]')
            ?.addEventListener("click", () => {
                this.state.lipidSlots = Array(LIPID_SLOT_COUNT).fill(null);
                this.state.lipidActions = [];
                this.render();
            }, { signal });
        this.root.querySelector('[data-action="record-membrane"]')
            ?.addEventListener("click", () => this.recordMembrane(), { signal });
    },

    setLipid(index, type) {
        if (!LIPID_TYPES[type] || this.state.lipidSlots[index] === type) return;
        this.state.lipidActions.push({
            index,
            previous: this.state.lipidSlots[index]
        });
        this.state.lipidSlots[index] = type;
        this.render();
    },

    curvatureCount() {
        return this.state.lipidSlots.filter(type => type === "curvature").length;
    },

    meterPosition(value, target, tolerance) {
        return Math.round(clamp(50 + (value - target) * (16 / tolerance)));
    },

    membraneBandLabel(band, score) {
        return {
            building: "Build all 28 lipids",
            short: "Too short",
            matched: `Target matched · ${score}%`,
            over: "Over-curved"
        }[band];
    },

    membraneFeedback(band, filledCount, score) {
        if (band === "building") {
            return `${LIPID_SLOT_COUNT - filledCount} lipid positions remain. Keep one variable in view: the amount of curvature-promoting lipid.`;
        }
        if (band === "short") {
            return "The leading edge is short of the dotted target. Replace a Neutral Lipid with a Curvature Lipid.";
        }
        if (band === "over") {
            return "The membrane extends past the target. Replace a Curvature Lipid with a Neutral Lipid.";
        }
        return `The membrane is within the target range at ${score}%. Mission 2 will add the pushing cytoskeleton.`;
    },

    recordMembrane() {
        const curvatureCount = this.curvatureCount();
        const score = calculateTargetScore(
            curvatureCount,
            CURVATURE_TARGET_COUNT,
            CURVATURE_TOLERANCE
        );
        if (this.state.lipidSlots.some(type => !type) || score < 80) return;
        this.state.results.push({
            missionId: "curve_and_extend",
            score,
            curvatureCount,
            neutralCount: LIPID_SLOT_COUNT - curvatureCount
        });
        this.state.missionIndex = 1;
        this.render();
    },

    renderActinMission() {
        const score = calculateTargetScore(
            this.state.actinUnits,
            ACTIN_TARGET_COUNT,
            ACTIN_TOLERANCE
        );
        const band = this.state.actinUnits < ACTIN_TARGET_COUNT - ACTIN_TOLERANCE
            ? "weak"
            : this.state.actinUnits > ACTIN_TARGET_COUNT + ACTIN_TOLERANCE
                ? "crowded"
                : "matched";
        const targetTipX = calculatePseudopodTipX(CURVATURE_TARGET_COUNT);

        this.root.innerHTML = `
            ${this.renderHeader("Mission 2: Push and Stabilize with Actin", 2)}
            <section class="pseudo-context pseudo-context--actin">
                <strong>New variable: actin-network growth</strong>
                <p>The membrane design is now held constant. Add ATP-bound actin units beneath the leading edge. Actin—not the αβ-tubulin track from the transport lab—is the primary protrusive network in this simplified pseudopod model.</p>
            </section>
            <div class="pseudo-workspace pseudo-workspace--actin">
                <section class="pseudo-controls">
                    <p class="pseudo-step">1 · Grow the submembrane network</p>
                    <h4>ATP-Actin Units</h4>
                    <button type="button" class="pseudo-actin-card" data-action="add-actin" ${this.state.actinUnits >= MAX_ACTIN_UNITS ? "disabled" : ""}>
                        <span aria-hidden="true"><i></i><i></i><i></i></span>
                        <span><strong>Add ATP-Actin</strong><small>Each tap extends one visible filament toward the leading membrane.</small></span>
                    </button>
                    <p class="pseudo-selection" role="status">${this.state.actinUnits} / ${MAX_ACTIN_UNITS} actin filaments grown</p>
                    <div class="pseudo-actions">
                        <button type="button" data-action="remove-actin" ${this.state.actinUnits ? "" : "disabled"}>Remove Last</button>
                        <button type="button" data-action="reset-actin">Reset Network</button>
                    </div>
                </section>
                <section class="pseudo-canvas-panel">
                    <div class="pseudo-canvas-heading">
                        <div><p class="pseudo-step">2 · Watch filaments push the leading edge</p><h4>Actin-Supported Pseudopod</h4></div>
                        <span>${this.state.actinUnits} filaments</span>
                    </div>
                    <svg class="pseudo-scene pseudo-scene--actin" viewBox="0 0 900 390" role="img" aria-label="Actin filaments growing beneath a curved pseudopod membrane">
                        <text x="38" y="35" class="pseudo-side-label">EXTRACELLULAR FLUID</text>
                        <path class="pseudo-current is-complete" d="${pseudopodPath(targetTipX)}"></path>
                        <ellipse class="pseudo-cell-body" cx="112" cy="195" rx="102" ry="158"></ellipse>
                        <text x="75" y="200" class="pseudo-cell-label">CELL</text>
                        <g class="pseudo-complete-lipids"></g>
                        <g class="pseudo-actin-network"></g>
                        <text x="475" y="352" class="pseudo-cytosol-label">BRANCHED ACTIN NETWORK IN CYTOSOL</text>
                    </svg>
                </section>
            </div>
            <section class="pseudo-meter-panel">
                <div class="pseudo-meter-heading">
                    <div><p class="pseudo-step">3 · Match one target</p><h4>Extension Stability</h4></div>
                    <strong class="pseudo-reading pseudo-reading--${band}">${band === "matched" ? `Stable extension · ${score}%` : band === "weak" ? "Too little support" : "Overcrowded"}</strong>
                </div>
                <div class="pseudo-meter" role="meter" aria-label="Actin support match" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${this.meterPosition(this.state.actinUnits, ACTIN_TARGET_COUNT, ACTIN_TOLERANCE)}">
                    <div><span>Weak</span></div><div><span>Stable</span></div><div><span>Overcrowded</span></div>
                    <i style="left:${this.meterPosition(this.state.actinUnits, ACTIN_TARGET_COUNT, ACTIN_TOLERANCE)}%"></i>
                </div>
                <p class="pseudo-feedback" role="status">${band === "matched" ? `The actin network supports the leading edge at ${score}%. Five filaments center the target.` : band === "weak" ? "Add ATP-actin so growing filaments can push and support the membrane." : "The teaching model is overcrowded. Remove one actin filament."}</p>
                ${score >= 80 ? `<button type="button" class="pseudo-continue" data-action="record-actin">Record Actin Network · ${score}%</button>` : ""}
            </section>`;

        this.renderCompletedLipids(targetTipX);
        this.renderActinNetwork(targetTipX);
        this.bindActinMission();
    },

    renderCompletedLipids(tipX) {
        const group = this.root.querySelector(".pseudo-complete-lipids");
        if (!group) return;
        this.state.lipidSlots.forEach((type, index) => {
            const point = lipidPoint(index, tipX);
            const node = document.createElementNS("http://www.w3.org/2000/svg", "g");
            node.setAttribute("class", `pseudo-lipid is-${type}`);
            node.innerHTML = `<line x1="${point.x}" y1="${point.y}" x2="${point.x + point.tailX}" y2="${point.y + point.tailY}"></line><circle cx="${point.x}" cy="${point.y}" r="${type === "curvature" ? 7 : 6}"></circle>`;
            group.appendChild(node);
        });
    },

    renderActinNetwork(tipX) {
        const group = this.root.querySelector(".pseudo-actin-network");
        const starts = [
            [225, 188], [245, 215], [270, 170],
            [285, 235], [315, 195], [335, 220]
        ];
        starts.slice(0, this.state.actinUnits).forEach(([startX, startY], index) => {
            const endX = tipX - 34 - (index % 3) * 8;
            const endY = 166 + (index % 3) * 29;
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("class", "pseudo-actin-filament");
            path.setAttribute("d", `M${startX} ${startY} Q${(startX + endX) / 2} ${startY - 18 + index * 4} ${endX} ${endY}`);
            group.appendChild(path);
            const beadCount = 8;
            for (let bead = 0; bead < beadCount; bead += 1) {
                const ratio = bead / (beadCount - 1);
                const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                circle.setAttribute("class", "pseudo-actin-bead");
                circle.setAttribute("cx", String(startX + (endX - startX) * ratio));
                circle.setAttribute("cy", String(startY + (endY - startY) * ratio - Math.sin(ratio * Math.PI) * 10));
                circle.setAttribute("r", "4.5");
                group.appendChild(circle);
            }
        });
    },

    bindActinMission() {
        const signal = this.events.signal;
        this.root.querySelector('[data-action="add-actin"]')
            ?.addEventListener("click", () => {
                this.state.actinUnits = Math.min(
                    MAX_ACTIN_UNITS,
                    this.state.actinUnits + 1
                );
                this.render();
            }, { signal });
        this.root.querySelector('[data-action="remove-actin"]')
            ?.addEventListener("click", () => {
                this.state.actinUnits = Math.max(0, this.state.actinUnits - 1);
                this.render();
            }, { signal });
        this.root.querySelector('[data-action="reset-actin"]')
            ?.addEventListener("click", () => {
                this.state.actinUnits = 0;
                this.render();
            }, { signal });
        this.root.querySelector('[data-action="record-actin"]')
            ?.addEventListener("click", () => this.recordActin(), { signal });
    },

    recordActin() {
        const score = calculateTargetScore(
            this.state.actinUnits,
            ACTIN_TARGET_COUNT,
            ACTIN_TOLERANCE
        );
        if (score < 80) return;
        this.state.results.push({
            missionId: "actin_push_and_stabilize",
            score,
            actinFilamentCount: this.state.actinUnits
        });
        this.state.readyToSave = true;
        this.render();
    },

    renderConclusion() {
        const totalScore = this.averageScore();
        const reward = this.state.saved
            ? `${this.state.completion?.xpAwarded ?? 0} XP awarded. Phagocytosis Ready discovered; the Food Vacuole Lab is now revealed as Coming Soon.`
            : `Both missions are complete at ${totalScore}%.`;
        this.root.innerHTML = `
            <section class="pseudo-conclusion">
                <span aria-hidden="true">✓</span>
                <p>Cytoskeleton Lab complete</p>
                <h3>A bendable membrane and actin forces build a pseudopod</h3>
                <p>Curvature-promoting lipids shaped the leading membrane. Polymerizing actin filaments then pushed from the cytosol and stabilized the extension.</p>
                <p><strong>Microtubules support long-range transport; actin drives this simplified leading-edge protrusion.</strong></p>
                <p>${reward}</p>
                ${this.state.saved ? "" : `<button type="button" data-action="save">${this.sandbox ? "Complete Practice Run" : `Save Investigation · ${totalScore}%`}</button>`}
            </section>`;
        this.root.querySelector('[data-action="save"]')
            ?.addEventListener("click", () => this.submit(), { signal: this.events.signal });
    },

    averageScore() {
        if (!this.state?.results?.length) return 0;
        return Math.round(
            this.state.results.reduce((sum, result) => sum + result.score, 0) /
            this.state.results.length
        );
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
                    lipidSlots: [...this.state.lipidSlots],
                    actinUnits: this.state.actinUnits,
                    missionResults: structuredClone(this.state.results)
                },
                attemptSnapshot: {
                    observations: {
                        membraneCurvedBeforeActin: true,
                        actinPushedFromCytosol: true,
                        microtubuleTransportDistinguishedFromActinProtrusion: true
                    }
                }
            });
            if (!submission || !SaveManager.save({ reason: "pseudopodia-membrane-extension" })) {
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
            message.className = "pseudo-feedback";
            message.textContent = "Saving failed. Both completed missions remain here; try Save Investigation again.";
            this.root.querySelector(".pseudo-conclusion")?.appendChild(message);
        }
    },

    renderReview() {
        const record = SubmissionManager.getSubmissions(Catalog.id).at(-1);
        const results = record?.placementSnapshot?.missionResults ?? [];
        this.root.innerHTML = `
            <section class="pseudo-conclusion">
                <p>Pseudopod Extension submission review</p>
                <h3>${record ? `${record.scorePoints} / ${record.scoreMaximum}` : "No saved submission"}</h3>
                ${record ? `<ul>${results.map(result => `<li>${result.missionId === "curve_and_extend" ? "Curve and Extend" : "Actin Push and Stabilize"}: ${result.score}%</li>`).join("")}</ul><p>The membrane was shaped first; actin was then added beneath the leading edge.</p>` : `<p>Complete and save both pseudopod missions to create a review record.</p>`}
            </section>`;
    }
};

export {
    ACTIN_TARGET_COUNT,
    ACTIN_TOLERANCE,
    CURVATURE_TARGET_COUNT,
    CURVATURE_TOLERANCE,
    LIPID_SLOT_COUNT,
    calculatePseudopodTipX,
    calculateTargetScore
};

export default PseudopodiaMembraneExtensionView;
