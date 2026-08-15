// --------------------------------------------------
// AtomCraftUI.js
// --------------------------------------------------


import AtomLabManager from "./AtomLabManager.js";


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

            <div class="craft-live-counts">
                <span>P: <strong id="count-p">0</strong></span>
                <span>N: <strong id="count-n">0</strong></span>
                <span>E: <strong id="count-e">0</strong></span>
            </div>

            <div class="craft-controls">
                <button id="btn-add-proton" class="craft-btn" data-action="proton">+ Proton</button>
                <button id="btn-add-neutron" class="craft-btn" data-action="neutron">+ Neutron</button>
                <button id="btn-add-electron" class="craft-btn" data-action="electron">+ Electron</button>
                <button id="btn-synthesize" class="craft-btn synthesize-btn" data-action="synthesize">Synthesize</button>
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
            synthesize: this.container.querySelector("#btn-synthesize")
        };
    },

    bindEvents() {
        // Target region clicks
        this.nucleusEl.addEventListener("click", (e) => {
            e.stopPropagation(); // Avoid triggering orbit click
            this.handleAction("click_nucleus", "nucleus");
        });

        this.orbitEl.addEventListener("click", () => {
            this.handleAction("click_orbit", "orbit");
        });

        // Control panel button clicks
        this.container.querySelectorAll(".craft-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const action = e.target.dataset.action;
                this.handleAction(action, action);
            });
        });
    },

    handleAction(actionType, payload) {
        const result = AtomLabManager.processAction(actionType, payload);
        
        if (!result.accepted) {
            console.warn("Action rejected:", result.message);
        }

        // Trigger UI refresh after state changes
        this.render();
    },

    render() {
        if (!this.container) return;

        const status = AtomLabManager.getStatus();

        // 1. Update Prompt Text
        if (this.promptEl) {
            this.promptEl.textContent = status.nextPrompt || "Free Build Mode: Add particles and synthesize!";
        }

        // 2. Update Particle Inventory Counts
        if (status.inventory) {
            this.countsEl.p.textContent = status.inventory.proton ?? 0;
            this.countsEl.n.textContent = status.inventory.neutron ?? 0;
            this.countsEl.e.textContent = status.inventory.electron ?? 0;
        }

        // 3. Disable control buttons if pre-requisites or inventory checks fail
        const isReady = status.inventoryCheck?.ready ?? true;
        Object.values(this.buttons).forEach(btn => {
            btn.disabled = !isReady;
        });
    }
};

export default AtomCraftUI;