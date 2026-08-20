// --------------------------------------------------
// AtomCraftUI.js
// --------------------------------------------------

import AtomLabManager from "./AtomLabManager.js";
import AtomLabUI from "./AtomLabUI.js";
import ParticleInventoryManager from "./ParticleInventoryManager.js";
import GameStateObserver from "./GameStateObserver.js";

/**
 * Calculates (x, y) cartesian positions for nucleons in an alternating hexagonal grid layout.
 */
export function calculateNucleonPositions(Z, N, options = {}) {
    const total = Z + N;
    if (total === 0) return [];

    const spacing = options.spacing ?? 8;

    const maxRings = Math.ceil(Math.sqrt(total / 3)) + 1;
    const positions = [];

    for (let q = -maxRings; q <= maxRings; q++) {
        for (let r = -maxRings; r <= maxRings; r++) {
            const x = spacing * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
            const y = spacing * (1.5 * r);
            const distSq = x * x + y * y;

            positions.push({ x, y, distSq });
        }
    }

    positions.sort((a, b) => a.distSq - b.distSq);

    const selectedPositions = positions.slice(0, total);

    let remZ = Z;
    let remN = N;

    return selectedPositions.map((pos, index) => {
        let type;

        const prefersProton = index % 2 === 0;

        if (prefersProton && remZ > 0) {
            type = "proton";
            remZ--;
        } else if (!prefersProton && remN > 0) {
            type = "neutron";
            remN--;
        } else if (remZ > 0) {
            type = "proton";
            remZ--;
        } else {
            type = "neutron";
            remN--;
        }

        return {
            type,
            x: Math.round(pos.x * 100) / 100,
            y: Math.round(pos.y * 100) / 100
        };
    });
}

/**
 * Calculates (x, y) coordinates for electrons distributed across up to 7 Bohr shells.
 */
export function calculateElectronPositions(totalElectrons, options = {}) {
    if (totalElectrons <= 0) return [];

    const shellCapacities = options.shellCapacities || [2, 8, 18, 32, 32, 18, 10];
    const innerRadius = options.innerRadius ?? 105;
    const shellSpacing = options.shellSpacing ?? 18;

    let remaining = totalElectrons;
    const electronPositions = [];

    for (let shellIdx = 0; shellIdx < shellCapacities.length; shellIdx++) {
        if (remaining <= 0) break;

        const capacity = shellCapacities[shellIdx];
        const count = Math.min(remaining, capacity);
        remaining -= count;

        const radius = innerRadius + (shellIdx * shellSpacing);

        for (let i = 0; i < count; i++) {
            const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);

            electronPositions.push({
                x: Math.round(x * 100) / 100,
                y: Math.round(y * 100) / 100,
                shell: shellIdx + 1
            });
        }
    }

    return electronPositions;
}

const AtomCraftUI = {
    config: {
        nucleusRadius: 85,
        nucleonSpacing: 8,
        nucleonSize: 13,
        innerShellRadius: 400,
        shellSpacing: 60,
        electronSize: 40
    },

    container: null,
    promptEl: null,
    nucleusEl: null,
    orbitEl: null,
    countsEl: {},
    invEls: {},
    propertiesEl: {},
    buttons: {},

    createElement(tag, props = {}) {
        const el = document.createElement(tag);
        Object.assign(el, props);
        return el;
    },

    createSVGElement(tag, attrs = {}) {
        const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
        Object.entries(attrs).forEach(([key, val]) => el.setAttribute(key, val));
        return el;
    },

    createCountSpan(labelPrefix, strongElement) {
        const span = this.createElement("span");
        span.append(document.createTextNode(labelPrefix), strongElement);
        return span;
    },

    createButton(id, className, action, text) {
        const btn = this.createElement("button", {
            id,
            className,
            textContent: text
        });
        btn.dataset.action = action;
        return btn;
    },

    build() {
        this.container = this.createElement("div", {
            id: "atom-craft-container",
            className: "atom-craft-panel"
        });

        this.promptEl = this.createElement("span", {
            id: "craft-prompt-text",
            textContent: "Loading instructions..."
        });
        const promptBanner = this.createElement("div", {
            id: "craft-prompt-banner",
            className: "craft-prompt"
        });
        promptBanner.appendChild(this.promptEl);

        this.propertiesEl = {
            atomicNumber: this.createElement("strong", { id: "stat-atomic-number", textContent: "0" }),
            atomicMass: this.createElement("strong", { id: "stat-atomic-mass", textContent: "0" }),
            netCharge: this.createElement("strong", { id: "stat-net-charge", textContent: "0 (Neutral)" })
        };

        const propertiesPanel = this.createElement("div", {
            id: "atom-properties-panel",
            className: "atom-properties-panel"
        });

        const panelHeader = this.createElement("h4", {
            className: "properties-title",
            textContent: "Atomic Properties"
        });

        const numRow = this.createElement("div", { className: "property-row" });
        numRow.append(this.createElement("span", { textContent: "Atomic Number (Z): " }), this.propertiesEl.atomicNumber);

        const massRow = this.createElement("div", { className: "property-row" });
        massRow.append(this.createElement("span", { textContent: "Atomic Mass (A): " }), this.propertiesEl.atomicMass);

        const chargeRow = this.createElement("div", { className: "property-row" });
        chargeRow.append(this.createElement("span", { textContent: "Net Charge: " }), this.propertiesEl.netCharge);

        propertiesPanel.append(panelHeader, numRow, massRow, chargeRow);

        const shellsGroup = this.createSVGElement("g", { id: "shells-group" });
        const nucleusGroup = this.createSVGElement("g", { id: "nucleus-group" });
        const electronsGroup = this.createSVGElement("g", { id: "electrons-group" });

        const svg = this.createSVGElement("svg", {
            id: "nucleus-svg",
            class: "nucleus-svg",
            viewBox: "-250 -250 500 500",
            style: "width: 100%; height: 100%; pointer-events: none; overflow: visible;"
        });
        svg.append(shellsGroup, nucleusGroup, electronsGroup);

        this.nucleusEl = this.createElement("div", {
            id: "target-nucleus",
            className: "target-zone nucleus-zone",
            tabIndex: 0,
            role: "button"
        });
        this.nucleusEl.setAttribute("aria-label", "Nucleus");
        this.nucleusEl.appendChild(svg);

        this.orbitEl = this.createElement("div", {
            id: "target-orbit",
            className: "target-zone orbit-zone",
            tabIndex: 0,
            role: "button"
        });
        this.orbitEl.setAttribute("aria-label", "Electron Orbit");

        const orbitLabel = this.createElement("span", {
            className: "zone-label",
            textContent: "Orbit"
        });
        this.orbitEl.append(orbitLabel, this.nucleusEl);

        const workspace = this.createElement("div", {
            id: "atom-workspace",
            className: "atom-workspace"
        });
        workspace.append(propertiesPanel, this.orbitEl);

        this.countsEl = {
            p: this.createElement("strong", { id: "count-protons", textContent: "0" }),
            n: this.createElement("strong", { id: "count-neutrons", textContent: "0" }),
            e: this.createElement("strong", { id: "count-electrons", textContent: "0" })
        };

        const liveCounts = this.createElement("div", { className: "craft-live-counts" });
        liveCounts.append(
            this.createElement("span", { className: "counts-header", textContent: "Current Build:" }),
            this.createCountSpan("Protons: ", this.countsEl.p),
            this.createCountSpan("Neutrons: ", this.countsEl.n),
            this.createCountSpan("Electrons: ", this.countsEl.e)
        );

        const invP = this.createElement("strong", { id: "inventory-protons", textContent: "0 / 0" });
        const invN = this.createElement("strong", { id: "inventory-neutrons", textContent: "0 / 0" });
        const invE = this.createElement("strong", { id: "inventory-electrons", textContent: "0 / 0" });

        // Bind references to this component instance
        this.invEls = { p: invP, n: invN, e: invE };

        const inventoryCounts = this.createElement("div", { className: "craft-inventory-counts" });
        inventoryCounts.append(
            this.createElement("span", { className: "counts-header", textContent: "Inventory:" }),
            this.createCountSpan("Protons: ", invP),
            this.createCountSpan("Neutrons: ", invN),
            this.createCountSpan("Electrons: ", invE)
        );

        const countsContainer = this.createElement("div", { className: "craft-counts-container" });
        countsContainer.append(liveCounts, inventoryCounts);

        this.buttons = {
            proton: this.createButton("btn-add-proton", "craft-btn", "add_proton", "+ Proton"),
            neutron: this.createButton("btn-add-neutron", "craft-btn", "add_neutron", "+ Neutron"),
            electron: this.createButton("btn-add-electron", "craft-btn", "add_electron", "+ Electron"),
            synthesize: this.createButton("btn-synthesize", "craft-btn synthesize-btn", "synthesize", "Synthesize"),
            reset: this.createButton("btn-reset", "craft-btn reset-btn", "reset", "Reset")
        };

        const controlsContainer = this.createElement("div", { className: "craft-controls" });
        controlsContainer.append(
            this.buttons.proton,
            this.buttons.neutron,
            this.buttons.electron,
            this.buttons.synthesize,
            this.buttons.reset
        );

        this.container.append(
            promptBanner,
            workspace,
            countsContainer,
            controlsContainer
        );

        this.bindEvents();
        this.render();

        return this.container;
    },

    cacheDOM() {
        if (!this.container) return;
        this.promptEl = this.container.querySelector("#craft-prompt-text");
        this.nucleusEl = this.container.querySelector("#target-nucleus");
        this.orbitEl = this.container.querySelector("#target-orbit");

        this.propertiesEl = {
            atomicNumber: this.container.querySelector("#stat-atomic-number"),
            atomicMass: this.container.querySelector("#stat-atomic-mass"),
            netCharge: this.container.querySelector("#stat-net-charge")
        };

        this.countsEl = {
            p: this.container.querySelector("#count-protons"),
            n: this.container.querySelector("#count-neutrons"),
            e: this.container.querySelector("#count-electrons")
        };

        this.invEls = {
            p: this.container.querySelector("#inventory-protons"),
            n: this.container.querySelector("#inventory-neutrons"),
            e: this.container.querySelector("#inventory-electrons")
        };

        this.buttons = {
            proton: this.container.querySelector("#btn-add-proton"),
            neutron: this.container.querySelector("#btn-add-neutron"),
            electron: this.container.querySelector("#btn-add-electron"),
            synthesize: this.container.querySelector("#btn-synthesize"),
            reset: this.container.querySelector("#btn-reset")
        };
    },

    bindEvents() {
        if (this.nucleusEl) {
            this.nucleusEl.addEventListener("click", (e) => {
                e.stopPropagation();
                this.handleAction("click_nucleus", "nucleus");
            });
            this.nucleusEl.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleAction("click_nucleus", "nucleus");
                }
            });
        }

        if (this.orbitEl) {
            this.orbitEl.addEventListener("click", () => {
                this.handleAction("click_orbit", "orbit");
            });
            this.orbitEl.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    this.handleAction("click_orbit", "orbit");
                }
            });
        }

        this.container.querySelectorAll("[data-action]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const action = e.currentTarget.dataset.action;
                const payload = e.currentTarget.dataset.payload;
                this.handleAction(action, payload);
            });
        });

        const isotopeSelect = this.container.querySelector("#isotope-select");
        if (isotopeSelect) {
            isotopeSelect.addEventListener("change", (e) => {
                this.handleAction("select_isotope", e.target.value);
            });
        }

        // Module-scoped observer events
        GameStateObserver.on("particle-inventory-changed", () => {
            this.updateInventoryDisplay();
        });

        GameStateObserver.on("quantum-auto-collector-harvested", () => {
            this.updateInventoryDisplay();
        });

        this.updateInventoryDisplay();
    },

    handleAction(actionType, payload) {
        const manager = AtomLabManager;
        if (!manager) return;

        const result = manager.processAction(actionType, payload);
        if (!result.accepted) {
            console.warn("Action rejected:", result.message);
        }

        if (AtomLabUI) {
            AtomLabUI.render();
        } else {
            this.render(manager.getStatus());
        }

        this.updateInventoryDisplay();
    },

    renderNucleus(protons, neutrons) {
        const nucleusContainer = this.container.querySelector("#nucleus-group");
        if (!nucleusContainer) return;

        const nucleons = calculateNucleonPositions(protons, neutrons, {
            spacing: this.config.nucleonSpacing,
            nucleusRadius: this.config.nucleusRadius
        });

        const existingCircles = Array.from(nucleusContainer.children);
        const targetCount = nucleons.length;

        nucleons.forEach((p, index) => {
            let circle = existingCircles[index];
            if (!circle) {
                circle = this.createSVGElement("circle");
                nucleusContainer.appendChild(circle);
            }
            circle.setAttribute("cx", p.x);
            circle.setAttribute("cy", p.y);
            circle.setAttribute("r", this.config.nucleonSize / 2);
            circle.setAttribute("class", `nucleon nucleon-${p.type}`);
        });

        for (let i = existingCircles.length - 1; i >= targetCount; i--) {
            existingCircles[i].remove();
        }
    },

    renderShells() {
        const shellsGroup = this.container.querySelector("#shells-group");
        if (!shellsGroup) return;

        if (shellsGroup.children.length === 0) {
            const capacities = [2, 8, 18, 32, 32, 18, 10];
            const innerRadius = this.config.innerShellRadius;
            const spacing = this.config.shellSpacing;

            capacities.forEach((_, index) => {
                const radius = innerRadius + (index * spacing);
                const ring = this.createSVGElement("circle", {
                    cx: "0",
                    cy: "0",
                    r: radius,
                    class: "electron-shell-ring"
                });
                shellsGroup.appendChild(ring);
            });
        }
    },

    renderElectrons(electronCount) {
        const electronsGroup = this.container.querySelector("#electrons-group");
        if (!electronsGroup) return;

        const positions = calculateElectronPositions(electronCount, {
            innerRadius: this.config.innerShellRadius,
            shellSpacing: this.config.shellSpacing
        });

        const existingCircles = Array.from(electronsGroup.children);
        const targetCount = positions.length;

        positions.forEach((p, index) => {
            let circle = existingCircles[index];
            if (!circle) {
                circle = this.createSVGElement("circle", {
                    r: this.config.electronSize / 2,
                    class: "electron-particle"
                });
                electronsGroup.appendChild(circle);
            }
            circle.setAttribute("cx", p.x);
            circle.setAttribute("cy", p.y);
        });

        for (let i = existingCircles.length - 1; i >= targetCount; i--) {
            existingCircles[i].remove();
        }
    },

    renderIsotopeControls(state) {
        const isotopeContainer = this.container.querySelector("#isotope-select-container");
        if (!isotopeContainer) return;

        isotopeContainer.style.display = !state.isIsotopeUnlocked ? "none" : "block";
    },

    render(state = AtomLabManager?.getStatus()) {
        if (!this.container || !state) return;

        this.renderBanner(state);
        this.renderIsotopeControls(state);

        const workspace = state.freeBuildBuffer || {};
        const pWorkspace = workspace.protons ?? workspace.proton ?? 0;
        const nWorkspace = workspace.neutrons ?? workspace.neutron ?? 0;
        const eWorkspace = workspace.electrons ?? workspace.electron ?? 0;

        if (this.countsEl.p) this.countsEl.p.textContent = pWorkspace;
        if (this.countsEl.n) this.countsEl.n.textContent = nWorkspace;
        if (this.countsEl.e) this.countsEl.e.textContent = eWorkspace;

        const atomicNumber = pWorkspace;
        const atomicMass = pWorkspace + nWorkspace;
        const rawCharge = pWorkspace - eWorkspace;

        let chargeText = "0 (Neutral)";
        if (rawCharge > 0) chargeText = `+${rawCharge}`;
        else if (rawCharge < 0) chargeText = `${rawCharge}`;

        if (this.propertiesEl.atomicNumber) this.propertiesEl.atomicNumber.textContent = atomicNumber;
        if (this.propertiesEl.atomicMass) this.propertiesEl.atomicMass.textContent = atomicMass;
        if (this.propertiesEl.netCharge) this.propertiesEl.netCharge.textContent = chargeText;

        this.renderNucleus(pWorkspace, nWorkspace);
        this.renderShells();
        this.renderElectrons(eWorkspace);

        this.updateInventoryDisplay();
    },

    renderBanner(state) {
        const promptBannerEl = this.container.querySelector("#craft-prompt-banner");
        const promptTextEl = this.container.querySelector("#craft-prompt-text");
        if (!promptBannerEl || !promptTextEl) return;

        const targetSymbol = state.targetElement || state.selectedElement;

        const defaultIsotopes = {
            Li: "Lithium-7",
            Be: "Beryllium-9",
            B:  "Boron-11",
            C:  "Carbon-12",
            N:  "Nitrogen-14",
            O:  "Oxygen-16"
        };

        let promptText = state.nextPrompt || "";
        if (!promptText && targetSymbol && defaultIsotopes[targetSymbol]) {
            promptText = `Target: Synthesize ${defaultIsotopes[targetSymbol]}`;
        }

        if (state.buildMode === "free-build" && !promptText) {
            promptBannerEl.style.display = "none";
            return;
        }

        promptBannerEl.style.display = "flex";
        promptTextEl.textContent = promptText;

        let continueBtn = promptBannerEl.querySelector("#btn-continue-tutorial");

        if (state.isInterstitial) {
            if (!continueBtn) {
                continueBtn = this.createElement("button", {
                    id: "btn-continue-tutorial",
                    className: "craft-btn continue-btn",
                    textContent: "Continue →"
                });
                
                continueBtn.addEventListener("click", () => {
                    this.handleAction("continue_tutorial");
                });

                promptBannerEl.appendChild(continueBtn);
            }
            continueBtn.style.display = "inline-block";
        } else if (continueBtn) {
            continueBtn.style.display = "none";
        }
    },

    updateInventoryDisplay() {
        if (!this.invEls?.p && this.container) {
            this.invEls = {
                p: this.container.querySelector("#inventory-protons"),
                n: this.container.querySelector("#inventory-neutrons"),
                e: this.container.querySelector("#inventory-electrons")
            };
        }

        if (!this.invEls?.p) return;

        const status = ParticleInventoryManager.getStatus() || {};
        const cap = status.capacity ?? 0;

        this.invEls.p.textContent = `${status.proton ?? 0} / ${cap}`;
        this.invEls.n.textContent = `${status.neutron ?? 0} / ${cap}`;
        this.invEls.e.textContent = `${status.electron ?? 0} / ${cap}`;
    }
};

export default AtomCraftUI;