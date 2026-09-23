import Catalog from "./SmoothERSterolBufferCatalog.js";
import ResearchManager from "./ResearchManager.js";
import SubmissionManager
    from "./OrganelleExperimentSubmissionManager.js";
import OrganelleExperimentPanel
    from "./OrganelleExperimentPanel.js";
import SaveManager from "./SaveManager.js";
import gameState from "./GameState.js";

const CHOLESTEROL_SITE_COUNT = 6;
const BUFFERED_MINIMUM = 40;
const BUFFERED_MAXIMUM = 70;

const TRIALS = Object.freeze([
    Object.freeze({
        id: "cold_snap",
        name: "Cold Snap",
        icon: "❄",
        temperature: "Low temperature",
        prompt:
            "Cold slows phospholipid movement and encourages tight packing. Add cholesterol until the membrane is buffered.",
        mechanism:
            "Cholesterol interrupts tight packing between phospholipid tails."
    }),
    Object.freeze({
        id: "warm_surge",
        name: "Warm Surge",
        icon: "☀",
        temperature: "High temperature",
        prompt:
            "Warmth increases phospholipid movement. Add cholesterol until the same membrane is buffered.",
        mechanism:
            "Cholesterol's rigid rings restrain excessive phospholipid movement."
    })
]);

function clamp(value, minimum = 0, maximum = 100) {
    return Math.max(minimum, Math.min(maximum, value));
}

function calculateSterolStability(cholesterolCount = 0) {
    return Math.round(clamp(
        10 + Number(cholesterolCount) * 18
    ));
}

function getSterolStabilityBand(value) {
    if (value < BUFFERED_MINIMUM) return "unstable";
    if (value > BUFFERED_MAXIMUM) return "constrained";
    return "buffered";
}

const SmoothERSterolBufferView = {
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
            trialIndex: 0,
            cholesterolSites:
                Array(CHOLESTEROL_SITE_COUNT)
                    .fill(false),
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
        this.root.className = "ser-sterol-lab";
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
        this.renderTrial();
    },

    renderTrial() {
        const trial = TRIALS[this.state.trialIndex];
        const cholesterolCount =
            this.state.cholesterolSites.filter(Boolean).length;
        const stability =
            calculateSterolStability(cholesterolCount);
        const band = getSterolStabilityBand(stability);
        const buffered = band === "buffered";

        this.root.innerHTML = `
            <header class="ser-fluidity-heading">
                <div>
                    <p class="ser-fluidity-eyebrow">Smooth ER · Controlled Investigation</p>
                    <h3>Lab 2: Cholesterol Buffering</h3>
                </div>
                <strong>One variable: cholesterol amount</strong>
            </header>
            <section class="ser-fluidity-mission ser-sterol-mission">
                <div class="ser-fluidity-mission-icon" aria-hidden="true">${trial.icon}</div>
                <div>
                    <strong>${trial.name} · ${trial.temperature}</strong>
                    <p>${trial.prompt} Tail composition and every other membrane component are held constant.</p>
                </div>
                <span>Trial ${this.state.trialIndex + 1} / ${TRIALS.length}</span>
            </section>
            <div class="ser-sterol-workspace">
                <section class="ser-sterol-rack">
                    <p class="ser-fluidity-step">1 · Add one sterol at a time</p>
                    <h4>Cholesterol</h4>
                    <p>Drag cholesterol into an open membrane site, or tap the card to fill the next site. Tap a placed cholesterol to remove it.</p>
                    <button type="button" class="ser-cholesterol-card" draggable="true" data-action="add-cholesterol">
                        <span class="ser-cholesterol-icon" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
                        <span><strong>Cholesterol</strong><small>Rigid rings fit between phospholipid tails.</small></span>
                    </button>
                    <p class="ser-sterol-count" role="status">${cholesterolCount} of ${CHOLESTEROL_SITE_COUNT} sites filled</p>
                    <div class="ser-fluidity-edit-actions">
                        <button type="button" data-action="undo" ${this.state.actions.length === 0 ? "disabled" : ""}>Undo Last</button>
                        <button type="button" data-action="reset">Remove All</button>
                    </div>
                </section>
                <section class="ser-fluidity-canvas" aria-label="Temperature-challenged membrane">
                    <div class="ser-fluidity-canvas-heading">
                        <div>
                            <p class="ser-fluidity-step">2 · Watch the membrane respond</p>
                            <h4>Living Membrane</h4>
                        </div>
                        <span>${trial.temperature}</span>
                    </div>
                    <div class="ser-sterol-scene" data-trial="${trial.id}" data-stability-band="${band}" style="--ser-sterol-motion: ${Math.max(1.1, 3.9 - stability / 38)}s;">
                        <span class="ser-fluidity-side-label ser-fluidity-side-label--top">Cytosol</span>
                        <div class="ser-sterol-bilayer"></div>
                        <div class="ser-sterol-sites" aria-label="Cholesterol sites"></div>
                        <span class="ser-fluidity-side-label ser-fluidity-side-label--bottom">SER lumen</span>
                    </div>
                </section>
            </div>
            <section class="ser-fluidity-meter-panel">
                <div class="ser-fluidity-meter-heading">
                    <div>
                        <p class="ser-fluidity-step">3 · One live measurement</p>
                        <h4>Membrane Stability</h4>
                    </div>
                    <strong class="ser-fluidity-reading ser-sterol-reading--${band}">${this.bandLabel(band)}</strong>
                </div>
                <div class="ser-fluidity-meter ser-sterol-meter" role="meter" aria-label="Membrane stability" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${stability}">
                    <div class="ser-fluidity-zone ser-sterol-zone--unstable"><span>Unstable</span></div>
                    <div class="ser-fluidity-zone ser-sterol-zone--buffered"><span>Buffered</span></div>
                    <div class="ser-fluidity-zone ser-sterol-zone--constrained"><span>Over-constrained</span></div>
                    <i class="ser-fluidity-marker" style="left: ${stability}%" aria-hidden="true"></i>
                </div>
                <p class="ser-fluidity-feedback" role="status" aria-live="polite">${this.feedbackText(trial, band)}</p>
                ${buffered ? `<button type="button" class="ser-fluidity-continue" data-action="record-trial">Record ${trial.name} Result</button>` : ""}
            </section>`;

        this.renderPhospholipids();
        this.renderCholesterolSites();
        this.bindTrial();
    },

    renderPhospholipids() {
        const bilayer = this.root.querySelector(".ser-sterol-bilayer");
        for (let index = 0; index < 12; index += 1) {
            const lipid = document.createElement("span");
            lipid.className = "ser-sterol-phospholipid";
            lipid.style.setProperty("--ser-position-index", String(index));
            lipid.innerHTML = `<i class="ser-sterol-head"></i><i class="ser-sterol-tail ser-sterol-tail--a"></i><i class="ser-sterol-tail ser-sterol-tail--b"></i><i class="ser-sterol-head ser-sterol-head--bottom"></i><i class="ser-sterol-tail ser-sterol-tail--c"></i><i class="ser-sterol-tail ser-sterol-tail--d"></i>`;
            bilayer.appendChild(lipid);
        }
    },

    renderCholesterolSites() {
        const sites = this.root.querySelector(".ser-sterol-sites");
        this.state.cholesterolSites.forEach((filled, index) => {
            const site = document.createElement("button");
            site.type = "button";
            site.className = `ser-cholesterol-site${filled ? " is-filled" : ""}`;
            site.dataset.cholesterolSite = String(index);
            site.setAttribute("aria-label", filled
                ? `Cholesterol site ${index + 1}: filled; tap to remove`
                : `Cholesterol site ${index + 1}: empty`);
            site.innerHTML = filled
                ? `<span class="ser-cholesterol-icon" aria-hidden="true"><i></i><i></i><i></i><i></i></span>`
                : `<span aria-hidden="true">+</span>`;
            sites.appendChild(site);
        });
    },

    bindTrial() {
        const signal = this.events.signal;
        const source = this.root.querySelector('[data-action="add-cholesterol"]');
        source?.addEventListener("click", () => this.addNext(), { signal });
        source?.addEventListener("dragstart", event => {
            event.dataTransfer?.setData("text/plain", "cholesterol");
            if (event.dataTransfer) event.dataTransfer.effectAllowed = "copy";
        }, { signal });

        this.root.querySelectorAll("[data-cholesterol-site]").forEach(site => {
            const index = Number(site.dataset.cholesterolSite);
            site.addEventListener("click", () => {
                if (this.state.cholesterolSites[index]) this.removeAt(index);
                else this.addAt(index);
            }, { signal });
            site.addEventListener("dragover", event => {
                event.preventDefault();
                site.classList.add("is-drop-target");
            }, { signal });
            site.addEventListener("dragleave", () => {
                site.classList.remove("is-drop-target");
            }, { signal });
            site.addEventListener("drop", event => {
                event.preventDefault();
                if (event.dataTransfer?.getData("text/plain") === "cholesterol") {
                    this.addAt(index);
                }
            }, { signal });
        });

        this.root.querySelector('[data-action="undo"]')
            ?.addEventListener("click", () => this.undo(), { signal });
        this.root.querySelector('[data-action="reset"]')
            ?.addEventListener("click", () => this.resetSites(), { signal });
        this.root.querySelector('[data-action="record-trial"]')
            ?.addEventListener("click", () => this.recordTrial(), { signal });
    },

    setSite(index, filled) {
        if (this.state.cholesterolSites[index] === filled) return;
        this.state.actions.push({
            index,
            previous: this.state.cholesterolSites[index]
        });
        this.state.cholesterolSites[index] = filled;
        this.render();
    },

    addNext() {
        const index = this.state.cholesterolSites.indexOf(false);
        if (index >= 0) this.setSite(index, true);
    },

    addAt(index) {
        if (!this.state.cholesterolSites[index]) this.setSite(index, true);
    },

    removeAt(index) {
        if (this.state.cholesterolSites[index]) this.setSite(index, false);
    },

    undo() {
        const action = this.state.actions.pop();
        if (!action) return;
        this.state.cholesterolSites[action.index] = action.previous;
        this.render();
    },

    resetSites() {
        this.state.cholesterolSites =
            Array(CHOLESTEROL_SITE_COUNT).fill(false);
        this.state.actions = [];
        this.render();
    },

    recordTrial() {
        const cholesterolCount =
            this.state.cholesterolSites.filter(Boolean).length;
        const stability = calculateSterolStability(cholesterolCount);
        if (getSterolStabilityBand(stability) !== "buffered") return;

        this.state.results.push({
            trialId: TRIALS[this.state.trialIndex].id,
            cholesterolCount,
            stability
        });
        if (this.state.trialIndex < TRIALS.length - 1) {
            this.state.trialIndex += 1;
            this.state.cholesterolSites =
                Array(CHOLESTEROL_SITE_COUNT).fill(false);
            this.state.actions = [];
        } else {
            this.state.readyToSave = true;
        }
        this.render();
    },

    bandLabel(band) {
        return {
            unstable: "Unstable",
            buffered: "Buffered range",
            constrained: "Over-constrained"
        }[band];
    },

    feedbackText(trial, band) {
        if (band === "unstable") {
            return trial.id === "cold_snap"
                ? "The tails are packing too tightly. Add cholesterol to interrupt that packing."
                : "The phospholipids are moving too freely. Add cholesterol so its rigid rings restrain their movement.";
        }
        if (band === "constrained") {
            return "Too much cholesterol is constraining the membrane. Tap a placed cholesterol to remove it.";
        }
        return `${trial.mechanism} Record this controlled result when you are ready.`;
    },

    renderConclusion() {
        const reward = this.state.saved
            ? `${this.state.completion?.xpAwarded ?? 0} XP awarded. Membrane Buffer earned; ERG1 and ERG7 recipes unlocked; the curvature lab is now revealed.`
            : "Both controlled trials are complete.";
        this.root.innerHTML = `
            <section class="ser-fluidity-completion ser-sterol-conclusion">
                <span aria-hidden="true">✓</span>
                <p class="ser-fluidity-eyebrow">Cold and warm trials complete</p>
                <h3>Cholesterol is a fluidity buffer</h3>
                <p>At low temperature, cholesterol prevents overly tight phospholipid packing. At high temperature, its rigid rings restrain excessive phospholipid movement.</p>
                <p><strong>It does not simply make every membrane more rigid.</strong></p>
                <p class="ser-sterol-pathway"><strong>Sterol-ring pathway:</strong> ERG1 converts squalene to 2,3-oxidosqualene. ERG7 then cyclizes 2,3-oxidosqualene into lanosterol.</p>
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
            const report = {
                scorePoints: 100,
                scoreMaximum: 100,
                scorePercent: 100,
                isPerfect: true,
                checks: TRIALS.map(trial => ({
                    id: `${trial.id}_buffered`,
                    passed: true,
                    awardedPoints: 50,
                    maximumPoints: 50
                }))
            };
            const submission = SubmissionManager.recordSubmission({
                experiment: Catalog,
                report,
                completion,
                placementSnapshot: {
                    trialResults: structuredClone(this.state.results)
                },
                attemptSnapshot: {
                    observations: {
                        coldPackingInterrupted: true,
                        warmMovementRestrained: true,
                        cholesterolActsAsBuffer: true
                    }
                }
            });
            if (!submission || !SaveManager.save({ reason: "smooth-er-sterol-buffer" })) {
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
            paragraph.textContent = "Saving failed. Your two results remain here; try Save Investigation again.";
            this.root.querySelector(".ser-sterol-conclusion")?.appendChild(paragraph);
        }
    },

    renderReview() {
        const record = SubmissionManager.getSubmissions(Catalog.id).at(-1);
        const results = record?.placementSnapshot?.trialResults ?? [];
        this.root.innerHTML = `
            <section class="ser-fluidity-completion ser-sterol-conclusion">
                <p class="ser-fluidity-eyebrow">Lab 2 submission review</p>
                <h3>${record ? `${record.scorePoints} / ${record.scoreMaximum}` : "No saved submission"}</h3>
                ${record ? `<p>You stabilized both temperature challenges by changing only cholesterol.</p><ul>${results.map(result => `<li>${result.trialId === "cold_snap" ? "Cold Snap" : "Warm Surge"}: ${result.cholesterolCount} cholesterol molecules · buffered</li>`).join("")}</ul>` : `<p>Complete and save the cholesterol investigation to create a review record.</p>`}
            </section>`;
    }
};

export {
    BUFFERED_MAXIMUM,
    BUFFERED_MINIMUM,
    CHOLESTEROL_SITE_COUNT,
    TRIALS,
    calculateSterolStability,
    getSterolStabilityBand
};

export default SmoothERSterolBufferView;
