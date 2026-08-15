// --------------------------------------------------
// AtomLabUI.js
// --------------------------------------------------

// Uncomment these when your sub-components are ready
// import PeriodicTableUI from "./PeriodicTableUI.js";
// import AtomCraftUI from "./AtomCraftUI.js";

import PeriodicTableUI from "./PeriodicTableUI.js";

const AtomLabUI = {

    initialized: false,
    rootElement: null,

    // --------------------------------------------------
    // Initialize Atom Lab UI
    // --------------------------------------------------
    initialize() {

        if (this.initialized) {
            this.render();
            return true;
        }

        this.rootElement = this.ensureRootElement();

        if (!this.rootElement) {
            console.warn("AtomLabUI: unable to mount #atomlab-zone");
            return false;
        }

        this.buildInterface();

        this.initialized = true;
        this.render();

        console.log("AtomLabUI.initialize() called");

        return true;
    },

    // --------------------------------------------------
    // Ensure DOM root exists 
    // --------------------------------------------------
    ensureRootElement() {

        // 1. Look for the existing HTML skeleton
        const existingRoot = document.getElementById("atomlab-zone");
        if (existingRoot) {
            return existingRoot;
        }

        // 2. Fallback: If not found, create it dynamically matching your exact HTML
        console.warn("AtomLabUI: HTML skeleton not found, generating fallback...");
        
        const appElement = document.getElementById("app") || document.body;

        const root = document.createElement("section");
        root.id = "atomlab-zone";
        root.className = "hidden";
        
        root.innerHTML = `
            <h1 class="zone-title">Atom Lab</h1>
            <div class="atomlab-content">
                <div id="atomlab-periodic-table"></div>
                <div id="atomlab-crafting"></div>
            </div>
        `;

        appElement.appendChild(root);

        return root;
    },

    // --------------------------------------------------
    // Build and inject sub-components
    // --------------------------------------------------
    buildInterface() {

        // Target the containers provided by the HTML skeleton
        const tableContainer = this.rootElement.querySelector("#atomlab-periodic-table");
        const craftContainer = this.rootElement.querySelector("#atomlab-crafting");

        if (tableContainer) {
            // Clear any placeholder text
            tableContainer.replaceChildren(); 
            
            // Inject the Periodic Table module
            tableContainer.appendChild(PeriodicTableUI.build());
        } else {
            console.warn("AtomLabUI: #atomlab-periodic-table container is missing.");
        }

        if (craftContainer) {
            // Clear any placeholder text
            craftContainer.replaceChildren();
            
            // Inject the Atom Crafting module
            // craftContainer.appendChild(AtomCraftUI.build());
        } else {
            console.warn("AtomLabUI: #atomlab-crafting container is missing.");
        }
    },

    // --------------------------------------------------
    // Render UI state
    // --------------------------------------------------
    render() {
        // Cascade the render calls to your sub-components
        // PeriodicTableUI.render();
        PeriodicTableUI.build();
        // AtomCraftUI.render();
        return true;
    }

};

export default AtomLabUI;