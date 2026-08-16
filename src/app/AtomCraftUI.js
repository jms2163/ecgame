// --------------------------------------------------
// AtomCraftUI.js
// --------------------------------------------------


import AtomLabManager from "./AtomLabManager.js";
import AtomLabUI from "./AtomLabUI.js"

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
                <button id="btn-add-proton" class="craft-btn" data-action="add_proton">+ Proton</button>
                <button id="btn-add-neutron" class="craft-btn" data-action="add_neutron">+ Neutron</button>
                <button id="btn-add-electron" class="craft-btn" data-action="add_electron">+ Electron</button>
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
        this.nucleusEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            this.handleAction("click_nucleus", "nucleus");
        }
    });

        this.orbitEl.addEventListener("click", () => {
            this.handleAction("click_orbit", "orbit");
        });
        this.orbitEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this.handleAction("click_orbit", "orbit");
        }
    });

        // Control panel button clicks
        this.container.querySelectorAll(".craft-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const action = e.currentTarget.dataset.action;
                const payload = e.currentTarget.dataset.payload;
                this.handleAction(action, payload);
            });
        });
    },

    handleAction(actionType, payload) {
        const result = AtomLabManager.processAction(actionType, payload);
        
        if (!result.accepted) {
            console.warn("Action rejected:", result.message);
        } else {
        console.log(`Action accepted (${actionType}):`, result.message);
    }

    // Trigger immediate UI refresh
    AtomLabUI.render();

        // Trigger UI refresh after state changes
        this.render();
    },

    render(workspaceState) {
    if (!workspaceState) return;

    const { protons = 0, neutrons = 0, electrons = 0 } = workspaceState;

    // 1. Update Workspace Counts
    const protonCountEl = this.container.querySelector("#count-protons");
    const neutronCountEl = this.container.querySelector("#count-neutrons");
    const electronCountEl = this.container.querySelector("#count-electrons");

    if (protonCountEl) protonCountEl.textContent = protons;
    if (neutronCountEl) neutronCountEl.textContent = neutrons;
    if (electronCountEl) electronCountEl.textContent = electrons;

    // 2. Dynamic Visual Node Rendering inside Nucleus & Orbit
    const nucleusZone = this.container.querySelector("#target-nucleus");
    const orbitZone = this.container.querySelector("#target-orbit");

    if (nucleusZone) {
        nucleusZone.setAttribute("aria-label", `Nucleus containing ${protons} protons and ${neutrons} neutrons`);
        // Render simple particle dots or badge
        nucleusZone.dataset.particles = protons + neutrons;
    }

    if (orbitZone) {
        orbitZone.setAttribute("aria-label", `Electron orbits containing ${electrons} electrons`);
        orbitZone.dataset.electrons = electrons;
    }
}
};

export default AtomCraftUI;