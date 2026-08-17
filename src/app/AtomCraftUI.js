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
    countsEl: null,
    buttons: {},

    build() {
        this.container = document.createElement("div");
        this.container.id = "atom-craft-container";
        this.container.className = "atom-craft-panel";

        this.container.innerHTML = `
            <div id="craft-prompt-banner" class="craft-prompt">
                <span id="craft-prompt-text">Loading instructions...</span>
            </div>

            <div id="atom-workspace" class="atom-workspace">
                <div id="target-orbit" class="target-zone orbit-zone" tabindex="0" role="button" aria-label="Electron Orbit">
                    <span class="zone-label">Orbit</span>
                    <div id="target-nucleus" class="target-zone nucleus-zone" tabindex="0" role="button" aria-label="Nucleus">
                        
<svg id="nucleus-svg" class="nucleus-svg" viewBox="-250 -250 500 500" style="width: 100%; height: 100%; pointer-events: none; overflow: visible;">
    <g id="shells-group"></g>
    <g id="nucleus-group"></g>
    <g id="electrons-group"></g>
</svg>
                    </div>
                </div>
            </div>

            <div class="craft-counts-container">
                <div class="craft-live-counts">
                    <span class="counts-header">Current Build:</span>
                    <span>Protons: <strong id="count-protons">0</strong></span>
                    <span>Neutrons: <strong id="count-neutrons">0</strong></span>
                    <span>Electrons: <strong id="count-electrons">0</strong></span>
                </div>

                <div class="craft-inventory-counts">
                    <span class="counts-header">Inventory:</span>
                    <span>Protons: <strong id="inventory-protons">0 / 0</strong></span>
                    <span>Neutrons: <strong id="inventory-neutrons">0 / 0</strong></span>
                    <span>Electrons: <strong id="inventory-electrons">0 / 0</strong></span>
                </div>
            </div>

            <div class="craft-controls">
                <button id="btn-add-proton" class="craft-btn" data-action="add_proton">+ Proton</button>
                <button id="btn-add-neutron" class="craft-btn" data-action="add_neutron">+ Neutron</button>
                <button id="btn-add-electron" class="craft-btn" data-action="add_electron">+ Electron</button>
                <button id="btn-synthesize" class="craft-btn synthesize-btn" data-action="synthesize">Synthesize</button>
                <button id="btn-reset" class="craft-btn reset-btn" data-action="reset">Reset</button>
            </div>
        `;

        this.cacheDOM();
        this.bindEvents();
        this.render();

        return this.container;
    },

    cacheDOM() {
        this.promptEl = this.container.querySelector("#craft-prompt-text");
        this.nucleusEl = this.container.querySelector("#target-nucleus");
        this.orbitEl = this.container.querySelector("#target-orbit");
        
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

        // Trigger immediate UI refresh
        AtomLabUI?.render();
        this.render();
    },

    renderNucleus(protons, neutrons) {
        const nucleusContainer = this.container.querySelector("#nucleus-group");
        if (!nucleusContainer) return;

        // Clear previous nucleon SVG elements
        nucleusContainer.innerHTML = "";

        // Calculate positions centered around (0,0)
        const nucleons = calculateNucleonPositions(protons, neutrons, {
            spacing: this.config.nucleonSpacing,
            nucleusRadius: this.config.nucleusRadius
        });

        // Render each particle sphere into the SVG group
        nucleons.forEach(p => {
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", p.x);
            circle.setAttribute("cy", p.y);
            circle.setAttribute("r", this.config.nucleonSize / 2);
            circle.setAttribute("class", `nucleon nucleon-${p.type}`);
            
            nucleusContainer.appendChild(circle);
        });
    },

    // Inside AtomCraftUI object:

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
            const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            ring.setAttribute("cx", "0");
            ring.setAttribute("cy", "0");
            ring.setAttribute("r", radius);
            ring.setAttribute("class", "electron-shell-ring");
            shellsGroup.appendChild(ring);
        });
    }
},

renderElectrons(electronCount) {
    const electronsGroup = this.container.querySelector("#electrons-group");
    if (!electronsGroup) return;

    electronsGroup.innerHTML = "";

    const positions = calculateElectronPositions(electronCount, {
        innerRadius: this.config.innerShellRadius,
        shellSpacing: this.config.shellSpacing
    });

    positions.forEach(p => {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", p.x);
        circle.setAttribute("cy", p.y);
        circle.setAttribute("r", this.config.electronSize / 2);
        circle.setAttribute("class", "electron-particle");
        electronsGroup.appendChild(circle);
    });
},

    render() {
        if (!this.container) return;

        const status = AtomLabManager?.getStatus();
        if (!status) return;

        // 1. Live Banner Prompt Update
        const promptTextEl = this.container.querySelector("#craft-prompt-text");
        const promptBannerEl = this.container.querySelector("#craft-prompt-banner");

        if (promptTextEl && promptBannerEl) {
            if (status.mode === "free-build" || !status.nextPrompt) {
                promptBannerEl.style.display = "none";
            } else {
                promptBannerEl.style.display = "block";
                promptTextEl.textContent = status.nextPrompt;
            }
        } 

        // 2. Workspace Build Counts & Nucleus SVG
        const workspace = status.freeBuildBuffer || {};
        // Check plural first, then singular as a fallback
const pWorkspace = workspace.protons ?? workspace.proton ?? 0;
const nWorkspace = workspace.neutrons ?? workspace.neutron ?? 0;
const eWorkspace = workspace.electrons ?? workspace.electron ?? 0;

        const pEl = this.container.querySelector("#count-protons");
        const nEl = this.container.querySelector("#count-neutrons");
        const eEl = this.container.querySelector("#count-electrons");

        if (pEl) pEl.textContent = pWorkspace;
        if (nEl) nEl.textContent = nWorkspace;
        if (eEl) eEl.textContent = eWorkspace;

        // Render hexagonal layout in nucleus
        this.renderNucleus(pWorkspace, nWorkspace);
        this.renderShells();
        this.renderElectrons(eWorkspace);

        // 3. Storage Inventory Counts
        const inventory = status.inventory || {};
        const cap = inventory.capacity ?? 0;
        
        const invP = this.container.querySelector("#inventory-protons");
        const invN = this.container.querySelector("#inventory-neutrons");
        const invE = this.container.querySelector("#inventory-electrons");

        if (invP) invP.textContent = `${inventory.proton ?? 0} / ${cap}`;
        if (invN) invN.textContent = `${inventory.neutron ?? 0} / ${cap}`;
        if (invE) invE.textContent = `${inventory.electron ?? 0} / ${cap}`;
    },

    updateInventoryDisplay() {
        const status = ParticleInventoryManager?.getStatus();
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