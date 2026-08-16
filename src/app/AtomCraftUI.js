// --------------------------------------------------
// AtomCraftUI.js
// --------------------------------------------------


import AtomLabManager from "./AtomLabManager.js";
import AtomLabUI from "./AtomLabUI.js"
import ParticleInventoryManager from "./ParticleInventoryManager.js";

const AtomCraftUI = {
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
            <div id="target-nucleus" class="target-zone nucleus-zone" tabindex="0" role="button" aria-label="Nucleus"></div>
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
            p: this.container.querySelector("#count-p"),
            n: this.container.querySelector("#count-n"),
            e: this.container.querySelector("#count-e")
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



render() {
    if (!this.container) return;

    const status = window.ECGame?.AtomLabManager?.getStatus();
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

    // 2. Workspace Build Counts
    const workspace = status.freeBuildBuffer || {};
    const pWorkspace = workspace.proton ?? 0;
    const nWorkspace = workspace.neutron ?? 0;
    const eWorkspace = workspace.electron ?? 0;

    const pEl = this.container.querySelector("#count-protons");
    const nEl = this.container.querySelector("#count-neutrons");
    const eEl = this.container.querySelector("#count-electrons");

    if (pEl) pEl.textContent = pWorkspace;
    if (nEl) nEl.textContent = nWorkspace;
    if (eEl) eEl.textContent = eWorkspace;

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