import Catalog from "./SmoothERMembraneCurvatureCatalog.js";
import ResearchManager from "./ResearchManager.js";
import SubmissionManager
    from "./OrganelleExperimentSubmissionManager.js";
import OrganelleExperimentPanel
    from "./OrganelleExperimentPanel.js";
import SaveManager from "./SaveManager.js";
import gameState from "./GameState.js";

const LIPID_POSITION_COUNT = 16;
const TARGET_TOLERANCE = 2;

const LIPID_TYPES = Object.freeze({
    neutral: Object.freeze({
        id: "neutral",
        name: "Neutral Lipid",
        shortName: "Cylindrical shape",
        description:
            "Similar head and tail widths favor a relatively flat leaflet."
    }),
    curvature: Object.freeze({
        id: "curvature",
        name: "Curvature Lipid",
        shortName: "Inverted-cone shape",
        description:
            "A large headgroup relative to a narrower tail region favors positive curvature in this highlighted leaflet."
    }),
    outwardCurvature: Object.freeze({
        id: "curvature",
        name: "Outward-Curvature Lipid",
        shortName: "Cone shape",
        description:
            "A smaller headgroup relative to a wider tail region favors the opposite curvature needed for an outward bulge."
    })
});

const CURVATURE_MISSIONS = Object.freeze([
    Object.freeze({
        id: "pinocytosis_pit",
        name: "Pinocytosis Pit",
        icon: "●",
        targetCount: 6,
        targetDepth: 66,
        direction: 1,
        prompt:
            "The amoeba must take in dissolved nutrients. Match the shallow inward curve that begins a pinocytosis pit.",
        targetLabel: "Shallow inward pit"
    }),
    Object.freeze({
        id: "waste_export_bulge",
        name: "Waste Export Bulge",
        icon: "↑",
        targetCount: 11,
        targetDepth: -80,
        direction: -1,
        prompt:
            "The amoeba must export a waste particle from the cytosol by exocytosis. Build a membrane that bulges outward, up and away from the waste.",
        targetLabel: "Outward export bulge"
    })
]);

function clamp(value, minimum = 0, maximum = 100) {
    return Math.max(minimum, Math.min(maximum, value));
}

function calculateCurvatureDepth(curvatureCount = 0) {
    return Math.round(
        clamp(curvatureCount / LIPID_POSITION_COUNT) * 176
    );
}

function calculateCurvatureMatchPosition(
    curvatureCount,
    targetCount
) {
    return Math.round(clamp(
        50 + (curvatureCount - targetCount) * 8
    ));
}

function getCurvatureMatchBand(
    curvatureCount,
    targetCount
) {
    const difference = curvatureCount - targetCount;
    if (difference < -TARGET_TOLERANCE) return "flat";
    if (difference > TARGET_TOLERANCE) return "curved";
    return "matched";
}

function calculateCurvatureMatchScore(
    curvatureCount,
    targetCount
) {
    const distance = Math.abs(curvatureCount - targetCount);
    if (distance > TARGET_TOLERANCE) return 0;
    return Math.round(100 - (distance / TARGET_TOLERANCE) * 20);
}

function pointFor(index, depth, leafletOffset = 0) {
    const x = 72 + index * (756 / (LIPID_POSITION_COUNT - 1));
    const normalized = (x - 450) / 378;
    const y = 132 + depth * (1 - normalized ** 2) + leafletOffset;
    return { x, y };
}

function curvePath(depth, offset = 0) {
    const leftY = 132 + offset;
    const middleY = 132 + depth * 2 + offset;
    const rightY = 132 + offset;
    return `M72 ${leftY} Q450 ${middleY} 828 ${rightY}`;
}

const SmoothERMembraneCurvatureView = {
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
            cytosolicLeaflet:
                Array(LIPID_POSITION_COUNT).fill(null),
            selectedType: "curvature",
            actions: [],
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
        this.root.className = "ser-curvature-lab";
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
            return;
        }
        this.renderMission();
    },

    renderMission() {
        const mission = CURVATURE_MISSIONS[this.state.missionIndex];
        const curvatureCount = this.curvatureCount();
        const filledCount = this.filledCount();
        const isComplete = filledCount === LIPID_POSITION_COUNT;
        const depth = Math.round(
            calculateCurvatureDepth(curvatureCount) *
            mission.targetDepth /
            calculateCurvatureDepth(mission.targetCount)
        );
        const band = isComplete
            ? getCurvatureMatchBand(
                curvatureCount,
                mission.targetCount
            )
            : "building";
        const meterPosition = calculateCurvatureMatchPosition(
            curvatureCount,
            mission.targetCount
        );
        const matchScore = isComplete
            ? calculateCurvatureMatchScore(
                curvatureCount,
                mission.targetCount
            )
            : 0;

        this.root.innerHTML = `
            <header class="ser-fluidity-heading">
                <div>
                    <p class="ser-fluidity-eyebrow">Smooth ER · Destination-Membrane Design</p>
                    <h3>Lab 3: Shape the Leaflets</h3>
                </div>
                <strong>One variable: curvature-lipid amount</strong>
            </header>
            <section class="ser-curvature-context">
                <strong>Target membrane: Plasma membrane</strong>
                <p>The smooth ER supplies lipid building materials that are transported and redistributed to other membranes. The canvas shows their destination—not the SER membrane.</p>
            </section>
            <section class="ser-fluidity-mission ser-curvature-mission">
                <div class="ser-fluidity-mission-icon" aria-hidden="true">${mission.icon}</div>
                <div>
                    <strong>${mission.name}</strong>
                    <p>${mission.prompt} The extracellular leaflet and every other component are held constant.</p>
                </div>
                <span>Mission ${this.state.missionIndex + 1} / ${CURVATURE_MISSIONS.length}</span>
            </section>
            <div class="ser-curvature-workspace">
                <section class="ser-curvature-rack">
                    <p class="ser-fluidity-step">1 · Edit only the highlighted leaflet</p>
                    <h4>Cytosolic Leaflet</h4>
                    <p>Tap either lipid card to add that lipid to the next empty position from left to right. After all 16 positions are filled, select a card and tap any position to replace it.</p>
                    <div class="ser-curvature-card-list"></div>
                    <p class="ser-curvature-selection" role="status"></p>
                    <div class="ser-fluidity-edit-actions">
                        <button type="button" data-action="undo" ${this.state.actions.length === 0 ? "disabled" : ""}>Undo Last</button>
                        <button type="button" data-action="reset">Reset Flat</button>
                    </div>
                    <div class="ser-curvature-legend" aria-label="Membrane color key">
                        <span><i class="ser-curvature-legend-dot ser-curvature-legend-dot--fixed"></i><strong>Blue:</strong> fixed extracellular leaflet</span>
                        <span><i class="ser-curvature-legend-dot ser-curvature-legend-dot--neutral"></i><strong>Orange:</strong> neutral lipid</span>
                        <span><i class="ser-curvature-legend-dot ser-curvature-legend-dot--curvature"></i><strong>Purple:</strong> ${mission.direction > 0 ? "inverted-cone lipid with a large headgroup and narrow tail region" : "cone-shaped lipid with a smaller headgroup and wider tail region"}</span>
                    </div>
                    <p class="ser-curvature-fixed"><strong>Extracellular leaflet:</strong> the blue lipids are held constant for this controlled experiment.</p>
                </section>
                <section class="ser-fluidity-canvas" aria-label="Curving destination membrane">
                    <div class="ser-fluidity-canvas-heading">
                        <div>
                            <p class="ser-fluidity-step">2 · Match the dotted target</p>
                            <h4>Destination Plasma Membrane</h4>
                        </div>
                        <span>${mission.targetLabel}</span>
                    </div>
                    <svg class="ser-curvature-scene" viewBox="0 0 900 410" role="img" aria-label="Solid membrane curve compared with a dotted target curve">
                        <text x="34" y="40" class="ser-curvature-side-label">EXTRACELLULAR FLUID</text>
                        <text x="34" y="385" class="ser-curvature-side-label">CYTOSOL</text>
                        <path class="ser-curvature-target" d="${curvePath(mission.targetDepth)}"></path>
                        <path class="ser-curvature-target" d="${curvePath(mission.targetDepth, 36)}"></path>
                        <text x="450" y="${mission.direction > 0 ? Math.min(380, 102 + mission.targetDepth) : 30}" class="ser-curvature-target-label">DOTTED TARGET</text>
                        <path class="ser-curvature-current ser-curvature-current--outer" d="${curvePath(depth)}"></path>
                        <path class="ser-curvature-current ser-curvature-current--inner" d="${curvePath(depth, 36)}"></path>
                        <g class="ser-curvature-lipids"></g>
                        ${mission.id === "pinocytosis_pit"
                            ? `<g class="ser-curvature-cargo ser-curvature-cargo--nutrients">
                                <text x="450" y="22">dissolved nutrients</text>
                                <circle class="ser-nutrient-dot" cx="322" cy="66" r="8"></circle>
                                <polygon class="ser-nutrient-triangle" points="372,39 382,57 362,57"></polygon>
                                <circle class="ser-nutrient-dot" cx="421" cy="84" r="6"></circle>
                                <polygon class="ser-nutrient-triangle" points="468,49 479,68 457,68"></polygon>
                                <circle class="ser-nutrient-dot" cx="517" cy="77" r="9"></circle>
                                <polygon class="ser-nutrient-triangle" points="565,34 575,52 555,52"></polygon>
                                <circle class="ser-nutrient-dot" cx="608" cy="88" r="7"></circle>
                            </g>`
                            : `<g class="ser-curvature-cargo ser-curvature-cargo--waste">
                                <circle cx="450" cy="329" r="31"></circle>
                                <circle cx="439" cy="319" r="6"></circle>
                                <polygon points="461,314 471,332 451,332"></polygon>
                                <circle cx="459" cy="341" r="5"></circle>
                                <text x="450" y="376">waste particle in cytosol</text>
                            </g>`}
                    </svg>
                </section>
            </div>
            <section class="ser-fluidity-meter-panel">
                <div class="ser-fluidity-meter-heading">
                    <div>
                        <p class="ser-fluidity-step">3 · One live measurement</p>
                        <h4>Curvature Match</h4>
                    </div>
                    <strong class="ser-fluidity-reading ser-curvature-reading--${band}">${this.bandLabel(band, matchScore)}</strong>
                </div>
                <div class="ser-fluidity-meter ser-curvature-meter" role="meter" aria-label="Curvature match" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${meterPosition}">
                    <div class="ser-fluidity-zone ser-curvature-zone--flat"><span>Too flat</span></div>
                    <div class="ser-fluidity-zone ser-curvature-zone--matched"><span>Matched</span></div>
                    <div class="ser-fluidity-zone ser-curvature-zone--curved"><span>Too curved</span></div>
                    <i class="ser-fluidity-marker" style="left: ${meterPosition}%" aria-hidden="true"></i>
                </div>
                <p class="ser-fluidity-feedback" role="status" aria-live="polite">${this.feedbackText(band, filledCount, mission)}</p>
                ${isComplete && band === "matched" ? `<button type="button" class="ser-fluidity-continue" data-action="record-mission">Record ${mission.name} · ${matchScore}%</button>` : ""}
            </section>`;

        this.renderCards();
        this.renderLipids(depth);
        this.bindMission();
    },

    renderCards() {
        const mission = CURVATURE_MISSIONS[this.state.missionIndex];
        const list = this.root.querySelector(".ser-curvature-card-list");
        const visibleTypes = [
            LIPID_TYPES.neutral,
            mission.direction > 0
                ? LIPID_TYPES.curvature
                : LIPID_TYPES.outwardCurvature
        ];
        list.innerHTML = visibleTypes.map(type => `
            <button type="button" class="ser-curvature-card ser-curvature-card--${type.id}${type === LIPID_TYPES.outwardCurvature ? " ser-curvature-card--negative" : ""}${this.state.selectedType === type.id ? " is-selected" : ""}" data-lipid-type="${type.id}" aria-pressed="${this.state.selectedType === type.id}">
                <span class="ser-curvature-card-icon" aria-hidden="true"><i></i><i></i><i></i></span>
                <span><strong>${type.name}</strong><b>${type.shortName}</b><small>${type.description}</small></span>
            </button>`).join("");
        this.root.querySelector(".ser-curvature-selection").textContent =
            `${visibleTypes.find(type => type.id === this.state.selectedType)?.name ?? "Lipid"} selected. ${this.filledCount()} of ${LIPID_POSITION_COUNT} cytosolic positions are filled.`;
    },

    renderLipids(depth) {
        const mission = CURVATURE_MISSIONS[this.state.missionIndex];
        const shapingLipid = mission.direction > 0
            ? LIPID_TYPES.curvature
            : LIPID_TYPES.outwardCurvature;
        const group = this.root.querySelector(".ser-curvature-lipids");
        this.state.cytosolicLeaflet.forEach((type, index) => {
            const outer = pointFor(index, depth, 0);
            const inner = pointFor(index, depth, 36);
            const middleY = (outer.y + inner.y) / 2;
            const lipid = document.createElementNS("http://www.w3.org/2000/svg", "g");
            lipid.setAttribute("class", `ser-curvature-lipid${type ? ` is-${type}` : " is-empty"}`);
            lipid.dataset.position = String(index);
            lipid.setAttribute("role", "button");
            lipid.setAttribute("tabindex", "0");
            lipid.setAttribute("aria-label", type
                ? `Cytosolic position ${index + 1}: ${type === "curvature" ? shapingLipid.name : LIPID_TYPES[type].name}`
                : `Cytosolic position ${index + 1}: empty`);
            lipid.innerHTML = `
                <circle class="ser-curvature-head ser-curvature-head--fixed" cx="${outer.x}" cy="${outer.y}" r="11"></circle>
                <line class="ser-curvature-tail ser-curvature-tail--fixed" x1="${outer.x - 4}" y1="${outer.y + 9}" x2="${outer.x - 4}" y2="${middleY}"></line>
                <line class="ser-curvature-tail ser-curvature-tail--fixed" x1="${outer.x + 4}" y1="${outer.y + 9}" x2="${outer.x + 4}" y2="${middleY}"></line>
                ${type === "neutral" ? `
                    <line class="ser-curvature-tail" x1="${inner.x - 4}" y1="${inner.y - 9}" x2="${inner.x - 4}" y2="${middleY}"></line>
                    <line class="ser-curvature-tail" x1="${inner.x + 4}" y1="${inner.y - 9}" x2="${inner.x + 4}" y2="${middleY}"></line>
                    <circle class="ser-curvature-head ser-curvature-head--editable" cx="${inner.x}" cy="${inner.y}" r="11"></circle>` : ""}
                ${type === "curvature" && mission.direction > 0 ? `
                    <line class="ser-curvature-tail ser-curvature-tail--narrow" x1="${inner.x - 5}" y1="${inner.y - 12}" x2="${inner.x - 2}" y2="${middleY}"></line>
                    <line class="ser-curvature-tail ser-curvature-tail--narrow" x1="${inner.x + 5}" y1="${inner.y - 12}" x2="${inner.x + 2}" y2="${middleY}"></line>
                    <circle class="ser-curvature-head ser-curvature-head--editable" cx="${inner.x}" cy="${inner.y}" r="15"></circle>` : ""}
                ${type === "curvature" && mission.direction < 0 ? `
                    <line class="ser-curvature-tail ser-curvature-tail--spread" x1="${inner.x - 3}" y1="${inner.y - 6}" x2="${inner.x - 12}" y2="${middleY}"></line>
                    <line class="ser-curvature-tail ser-curvature-tail--spread" x1="${inner.x + 3}" y1="${inner.y - 6}" x2="${inner.x + 12}" y2="${middleY}"></line>
                    <circle class="ser-curvature-head ser-curvature-head--editable" cx="${inner.x}" cy="${inner.y}" r="8"></circle>` : ""}
                ${type === null ? `
                    <circle class="ser-curvature-empty-slot" cx="${inner.x}" cy="${inner.y}" r="12"></circle>
                    <text class="ser-curvature-empty-number" x="${inner.x}" y="${inner.y + 4}">${index + 1}</text>` : ""}`;
            group.appendChild(lipid);
        });
    },

    bindMission() {
        const signal = this.events.signal;
        this.root.querySelectorAll("[data-lipid-type]").forEach(card => {
            card.addEventListener("click", () => {
                this.chooseAndAdd(card.dataset.lipidType);
            }, { signal });
        });
        this.root.querySelectorAll("[data-position]").forEach(position => {
            const replace = () => this.replacePosition(
                Number(position.dataset.position)
            );
            position.addEventListener("click", replace, { signal });
            position.addEventListener("keydown", event => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    replace();
                }
            }, { signal });
        });
        this.root.querySelector('[data-action="undo"]')
            ?.addEventListener("click", () => this.undo(), { signal });
        this.root.querySelector('[data-action="reset"]')
            ?.addEventListener("click", () => {
                this.state.cytosolicLeaflet =
                    Array(LIPID_POSITION_COUNT).fill(null);
                this.state.actions = [];
                this.render();
            }, { signal });
        this.root.querySelector('[data-action="record-mission"]')
            ?.addEventListener("click", () => this.recordMission(), { signal });
    },

    chooseAndAdd(type) {
        if (!LIPID_TYPES[type]) return;
        this.state.selectedType = type;
        const nextEmpty = this.state.cytosolicLeaflet.indexOf(null);
        if (nextEmpty >= 0) this.setPosition(nextEmpty, type);
        else this.render();
    },

    replacePosition(index) {
        if (this.state.cytosolicLeaflet[index] === this.state.selectedType) return;
        this.setPosition(index, this.state.selectedType);
    },

    setPosition(index, type) {
        this.state.actions.push({
            index,
            previous: this.state.cytosolicLeaflet[index]
        });
        this.state.cytosolicLeaflet[index] = type;
        this.render();
    },

    undo() {
        const action = this.state.actions.pop();
        if (!action) return;
        this.state.cytosolicLeaflet[action.index] = action.previous;
        this.render();
    },

    curvatureCount() {
        return this.state.cytosolicLeaflet.filter(
            type => type === "curvature"
        ).length;
    },

    filledCount() {
        return this.state.cytosolicLeaflet.filter(Boolean).length;
    },

    recordMission() {
        const mission = CURVATURE_MISSIONS[this.state.missionIndex];
        const curvatureCount = this.curvatureCount();
        const matchScore = calculateCurvatureMatchScore(
            curvatureCount,
            mission.targetCount
        );
        if (matchScore < 80) return;
        this.state.results.push({
            missionId: mission.id,
            curvatureCount,
            neutralCount: LIPID_POSITION_COUNT - curvatureCount,
            targetCount: mission.targetCount,
            targetDepth: mission.targetDepth,
            matchScore
        });
        if (this.state.missionIndex < CURVATURE_MISSIONS.length - 1) {
            this.state.missionIndex += 1;
            this.state.cytosolicLeaflet =
                Array(LIPID_POSITION_COUNT).fill(null);
            this.state.actions = [];
            this.state.selectedType = "curvature";
        } else {
            this.state.readyToSave = true;
        }
        this.render();
    },

    bandLabel(band, matchScore = 0) {
        return {
            building: "Build all 16 positions",
            flat: "Too flat",
            matched: `Target matched · ${matchScore}%`,
            curved: "Too curved"
        }[band];
    },

    feedbackText(band, filledCount, mission) {
        if (band === "building") {
            const remaining = LIPID_POSITION_COUNT - filledCount;
            return `Build the cytosolic leaflet from left to right. ${remaining} position${remaining === 1 ? " remains" : "s remain"}. The curve and meter respond as you add each lipid.`;
        }
        if (band === "flat") {
            return `The solid membrane is less bent than the dotted target. Add another ${mission.direction > 0 ? "Curvature Lipid" : "Outward-Curvature Lipid"} to the highlighted cytosolic leaflet.`;
        }
        if (band === "curved") {
            return "The solid membrane bends past the dotted target. Select Neutral Lipid to replace one shaping lipid.";
        }
        return "The solid membrane is within the target range. A center match earns 100%; the edges of the green range earn 80%.";
    },

    renderConclusion() {
        const reward = this.state.saved
            ? `${this.state.completion?.xpAwarded ?? 0} XP awarded. Membrane Sculptor earned; the SER Detox Network is now revealed as Coming Soon.`
            : "Both destination-membrane designs are complete.";
        this.root.innerHTML = `
            <section class="ser-fluidity-completion ser-curvature-conclusion">
                <span aria-hidden="true">✓</span>
                <p class="ser-fluidity-eyebrow">Two curvature targets matched</p>
                <h3>Leaflet asymmetry can favor membrane bending</h3>
                <p>Inverted-cone lipids favored the inward pit, while cone-shaped lipids favored the opposite curvature of the outward waste-export bulge.</p>
                <p><strong>Lipids contribute to curvature, but membrane-shaping proteins and the cytoskeleton provide additional forces in living cells.</strong></p>
                <p>${reward}</p>
                ${this.state.saved ? "" : `<button type="button" data-action="save">${this.sandbox ? "Complete Practice Run" : "Save Investigation"}</button>`}
            </section>`;
        this.root.querySelector('[data-action="save"]')
            ?.addEventListener("click", () => this.submit(), { signal: this.events.signal });
    },

    submit() {
        if (this.sandbox) {
            this.state.saved = true;
            this.render();
            return;
        }
        const backup = structuredClone(gameState);
        try {
            const completion = ResearchManager.completeExperiment(Catalog.id);
            if (!completion.completed) throw new Error(completion.reason);
            const scorePercent = Math.round(
                this.state.results.reduce(
                    (total, result) => total + result.matchScore,
                    0
                ) / CURVATURE_MISSIONS.length
            );
            const report = {
                scorePoints: scorePercent,
                scoreMaximum: 100,
                scorePercent,
                isPerfect: scorePercent === 100,
                checks: CURVATURE_MISSIONS.map(mission => {
                    const result = this.state.results.find(
                        entry => entry.missionId === mission.id
                    );
                    return {
                        id: `${mission.id}_matched`,
                        passed: (result?.matchScore ?? 0) >= 80,
                        awardedPoints: (result?.matchScore ?? 0) / 2,
                        maximumPoints: 50
                    };
                })
            };
            const submission = SubmissionManager.recordSubmission({
                experiment: Catalog,
                report,
                completion,
                placementSnapshot: {
                    missionResults: structuredClone(this.state.results)
                },
                attemptSnapshot: {
                    observations: {
                        extracellularLeafletFixed: true,
                        cytosolicLeafletVaried: true,
                        pinocytosisTargetMatched: true,
                        wasteExportTargetMatched: true,
                        destinationWasPlasmaMembrane: true
                    }
                }
            });
            if (!submission || !SaveManager.save({ reason: "smooth-er-membrane-curvature" })) {
                throw new Error("save-failed");
            }
            this.state.completion = completion;
            this.state.saved = true;
            OrganelleExperimentPanel.refresh();
            this.render();
        } catch (error) {
            for (const key of Object.keys(gameState)) delete gameState[key];
            Object.assign(gameState, backup);
            const paragraph = document.createElement("p");
            paragraph.className = "ser-fluidity-feedback";
            paragraph.textContent = "Saving failed. Your two matched designs remain here; try Save Investigation again.";
            this.root.querySelector(".ser-curvature-conclusion")?.appendChild(paragraph);
        }
    },

    renderReview() {
        const record = SubmissionManager.getSubmissions(Catalog.id).at(-1);
        const results = record?.placementSnapshot?.missionResults ?? [];
        this.root.innerHTML = `
            <section class="ser-fluidity-completion ser-curvature-conclusion">
                <p class="ser-fluidity-eyebrow">Lab 3 submission review</p>
                <h3>${record ? `${record.scorePoints} / ${record.scoreMaximum}` : "No saved submission"}</h3>
                ${record ? `<p>You matched both destination plasma-membrane targets by changing only the cytosolic leaflet.</p><ul>${results.map(result => `<li>${result.missionId === "pinocytosis_pit" ? "Pinocytosis Pit" : "Waste Export Bulge"}: ${result.curvatureCount} shaping lipids and ${result.neutralCount} neutral lipids — ${result.matchScore ?? 100}% match</li>`).join("")}</ul>` : `<p>Complete and save the curvature investigation to create a review record.</p>`}
            </section>`;
    }
};

export {
    CURVATURE_MISSIONS,
    LIPID_POSITION_COUNT,
    LIPID_TYPES,
    calculateCurvatureDepth,
    calculateCurvatureMatchPosition,
    calculateCurvatureMatchScore,
    getCurvatureMatchBand
};

export default SmoothERMembraneCurvatureView;
