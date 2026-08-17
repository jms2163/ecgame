// --------------------------------------------------
// AtomCraftUI.js
// --------------------------------------------------

import AtomLabManager from "./AtomLabManager.js";
import AtomLabUI from "./AtomLabUI.js";
import ParticleInventoryManager from "./ParticleInventoryManager.js";

/**
 * Calculates (x, y) cartesian positions for nucleons in an alternating hexagonal grid layout.
 * 
 * @param {number} Z - Proton count
 * @param {number} N - Neutron count
 * @param {Object} options
 * @param {number} [options.spacing=8] - Center-to-center particle spacing in pixels
 * @returns {Array<{type: string, x: number, y: number}>}
 */
export function calculateNucleonPositions(Z, N, options = {}) {
    const total = Z + N;
    if (total === 0) return [];

    const spacing = options.spacing ?? 8;

    // 1. Dynamically calculate required hex rings to fit ALL requested nucleons
    const maxRings = Math.ceil(Math.sqrt(total / 3)) + 1;
    const positions = [];

    // 2. Generate axial hex grid points
    for (let q = -maxRings; q <= maxRings; q++) {
        for (let r = -maxRings; r <= maxRings; r++) {
            const x = spacing * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
            const y = spacing * (1.5 * r);
            const distSq = x * x + y * y;

            positions.push({ x, y, distSq });
        }
    }

    // 3. Sort positions strictly center-outward
    positions.sort((a, b) => a.distSq - b.distSq);

    // 4. Take exact required positions for total nucleons
    const selectedPositions = positions.slice(0, total);

    // 5. Interleave Protons and Neutrons (Alternating Assignment)
    let remZ = Z;
    let remN = N;

    return selectedPositions.map((pos, index) => {
        let type;

        // Alternate preference based on index parity (0 = proton, 1 = neutron)
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
 * 
 * @param {number} totalElectrons - Active electron count
 * @param {Object} options
 * @param {number[]} [options.shellCapacities=[2, 8, 18, 32, 32, 18, 10]] - Max capacity per shell (1-7)
 * @param {number} [options.innerRadius=105] - Radius of Ring 1
 * @param {number} [options.shellSpacing=18] - Radial distance between concentric rings
 * @returns {Array<{x: number, y: number, shell: number}>}
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
            // Angle starting at 12 o'clock (-pi/2)
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
    // Configurable nucleus rendering dimensions
    config: {
        nucleusRadius: 85,
        nucleonSpacing: 8,
        nucleonSize: 13,
        innerShellRadius: 400, // Ring 1 radius
        shellSpacing: 60,      // Distance between ring 1 through 7
        electronSize: 40        // Grey circle diameter
    },

    // DOM References
    container: null,
    promptEl: null,
    nucleusEl: null,
    orbitEl: null,
    countsEl: {},
    propertiesEl: {},
    buttons: {},

    // --------------------------------------------------
    // DOM Construction Helpers
    // --------------------------------------------------
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

    // --------------------------------------------------
    // Standardized Component Construction
    // --------------------------------------------------
    build() {
        // 1. Root Container
        this.container = this.createElement("div", {
            id: "atom-craft-container",
            className: "atom-craft-panel"
        });

        // 2. Prompt Banner
        this.promptEl = this.createElement("span", {
            id: "craft-prompt-text",
            textContent: "Loading instructions..."
        });
        const promptBanner = this.createElement("div", {
            id: "craft-prompt-banner",
            className: "craft-prompt"
        });
        promptBanner.appendChild(this.promptEl);

        // 3a. Real-time Atomic Properties Panel
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

        // 3b. Workspace SVG & Interactive Zones
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
        // Position properties panel to the left of the atom orbit model
        workspace.append(propertiesPanel, this.orbitEl);

        // 4. Counts Container
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

        const inventoryCounts = this.createElement("div", { className: "craft-inventory-counts" });
        inventoryCounts.append(
            this.createElement("span", { className: "counts-header", textContent: "Inventory:" }),
            this.createCountSpan("Protons: ", invP),
            this.createCountSpan("Neutrons: ", invN),
            this.createCountSpan("Electrons: ", invE)
        );

        const countsContainer = this.createElement("div", { className: "craft-counts-container" });
        countsContainer.append(liveCounts, inventoryCounts);

        // 5. Control Buttons
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

        // 6. Assemble Main Layout
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

        this.buttons = {
            proton: this.container.querySelector("#btn-add-proton"),
            neutron: this.container.querySelector("#btn-add-neutron"),
            electron: this.container.querySelector("#btn-add-electron"),
            synthesize: this.container.querySelector("#btn-synthesize"),
            reset: this.container.querySelector("#btn-reset")
        };
    },

    bindEvents() {
        // Target region clicks & keyboard navigation
        if (this.nucleusEl) {
            this.nucleusEl.addEventListener("click", (e) => {
                e.stopPropagation(); // Avoid triggering orbit click
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

        // Generic handler for all action buttons (particle controls, synthesize, reset)
        this.container.querySelectorAll("[data-action]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const action = e.currentTarget.dataset.action;
                const payload = e.currentTarget.dataset.payload;
                this.handleAction(action, payload);
            });
        });

        // Isotope selection dropdown listener (if present)
        const isotopeSelect = this.container.querySelector("#isotope-select");
        if (isotopeSelect) {
            isotopeSelect.addEventListener("change", (e) => {
                this.handleAction("select_isotope", e.target.value);
            });
        }
    },

    handleAction(actionType, payload) {
        const manager = AtomLabManager;
        if (!manager) return;

        const result = manager.processAction(actionType, payload);
        if (!result.accepted) {
            console.warn("Action rejected:", result.message);
        }

        // Trigger immediate top-down UI refresh
        if (AtomLabUI) {
            AtomLabUI.render();
        } else {
            this.render(manager.getStatus());
        }
    },

    // --------------------------------------------------
    // Optimized SVG Particle Rendering (Reconciliation)
    // --------------------------------------------------
    renderNucleus(protons, neutrons) {
        const nucleusContainer = this.container.querySelector("#nucleus-group");
        if (!nucleusContainer) return;

        // Calculate positions centered around (0,0)
        const nucleons = calculateNucleonPositions(protons, neutrons, {
            spacing: this.config.nucleonSpacing,
            nucleusRadius: this.config.nucleusRadius
        });

        const existingCircles = Array.from(nucleusContainer.children);
        const targetCount = nucleons.length;

        // 1. Update existing circles or append new ones as needed
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

        // 2. Remove excess circles if particle count decreased
        for (let i = existingCircles.length - 1; i >= targetCount; i--) {
            existingCircles[i].remove();
        }
    },

    renderShells() {
        const shellsGroup = this.container.querySelector("#shells-group");
        if (!shellsGroup) return;

        // Render static ring outlines once
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

        // 1. Update existing circles or append new ones as needed
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

        // 2. Remove excess circles if electron count decreased
        for (let i = existingCircles.length - 1; i >= targetCount; i--) {
            existingCircles[i].remove();
        }
    },

    // --------------------------------------------------
    // Top-Down Decoupled Render Loop
    // --------------------------------------------------
    render(state = AtomLabManager?.getStatus()) {
        if (!this.container || !state) return;

        // 1. Live Banner Prompt Update
        const promptTextEl = this.container.querySelector("#craft-prompt-text");
        const promptBannerEl = this.container.querySelector("#craft-prompt-banner");

        if (promptTextEl && promptBannerEl) {
            if (state.mode === "free-build" || !state.nextPrompt) {
                promptBannerEl.style.display = "none";
            } else {
                promptBannerEl.style.display = "block";
                promptTextEl.textContent = state.nextPrompt;
            }
        } 

        // 2. Workspace Build Counts & Nucleus SVG
        const workspace = state.freeBuildBuffer || {};
        const pWorkspace = workspace.protons ?? workspace.proton ?? 0;
        const nWorkspace = workspace.neutrons ?? workspace.neutron ?? 0;
        const eWorkspace = workspace.electrons ?? workspace.electron ?? 0;

        const pEl = this.container.querySelector("#count-protons");
        const nEl = this.container.querySelector("#count-neutrons");
        const eEl = this.container.querySelector("#count-electrons");

        if (pEl) pEl.textContent = pWorkspace;
        if (nEl) nEl.textContent = nWorkspace;
        if (eEl) eEl.textContent = eWorkspace;

        // 3. Real-time Atomic Properties Panel Calculation
        const atomicNumber = pWorkspace;
        const atomicMass = pWorkspace + nWorkspace;
        const rawCharge = pWorkspace - eWorkspace;

        let chargeText = "0 (Neutral)";
        if (rawCharge > 0) chargeText = `+${rawCharge}`;
        else if (rawCharge < 0) chargeText = `${rawCharge}`;

        if (this.propertiesEl.atomicNumber) this.propertiesEl.atomicNumber.textContent = atomicNumber;
        if (this.propertiesEl.atomicMass) this.propertiesEl.atomicMass.textContent = atomicMass;
        if (this.propertiesEl.netCharge) this.propertiesEl.netCharge.textContent = chargeText;

        // Render particle graphics
        this.renderNucleus(pWorkspace, nWorkspace);
        this.renderShells();
        this.renderElectrons(eWorkspace);

        // 4. Storage Inventory Counts
        const inventory = state.inventory || {};
        const cap = inventory.capacity ?? 0;
        
        const invP = this.container.querySelector("#inventory-protons");
        const invN = this.container.querySelector("#inventory-neutrons");
        const invE = this.container.querySelector("#inventory-electrons");

        if (invP) invP.textContent = `${inventory.proton ?? 0} / ${cap}`;
        if (invN) invN.textContent = `${inventory.neutron ?? 0} / ${cap}`;
        if (invE) invE.textContent = `${inventory.electron ?? 0} / ${cap}`;
    },

    updateInventoryDisplay(status = ParticleInventoryManager?.getStatus()) {
        if (!status) return;

        ["proton", "neutron", "electron"].forEach(type => {
            const el = this.container.querySelector(`.particle-count[data-type="${type}"]`);
            if (el) {
                el.textContent = `${status[type]} / ${status.capacity}`;
            }
        });
    }
};

export default AtomCraftUI;