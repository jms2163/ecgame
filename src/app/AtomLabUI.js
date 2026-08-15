// --------------------------------------------------
// AtomLabUI.js
// --------------------------------------------------

import PeriodicTableUI from "./PeriodicTableUI.js";
import AtomCraftUI from "./AtomCraftUI.js";

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

        // 2. Fallback: If not found, create it dynamically
        console.warn("AtomLabUI: HTML skeleton not found, generating fallback...");
        
        const appElement = document.getElementById("app") || document.body;

        const root = document.createElement("section");
        root.id = "atomlab-zone";
        root.className = "hidden";
        
        root.innerHTML = `
            <h1 class="zone-title">Atom Lab</h1>
            <div class="atomlab-content">
                <div id="atomlab-periodic-table"></div>
            </div>
        `;

        appElement.appendChild(root);

        return root;
    },

    // --------------------------------------------------
    // Build and inject sub-components
    // --------------------------------------------------
    buildInterface() {

        const tableContainer = this.rootElement.querySelector("#atomlab-periodic-table");
        const craftContainer = this.rootElement.querySelector("#atomlab-crafting");

        if (tableContainer) {
            tableContainer.replaceChildren(); 
            
            // 1. Build and inject the Periodic Table element
            const ptElement = PeriodicTableUI.build();
            tableContainer.appendChild(ptElement);

            // 2. Locate the CSS grid inside the table and embed AtomCraft directly in top-center gap
            const gridContainer = ptElement.querySelector(".pt-grid") || ptElement;
            gridContainer.appendChild(AtomCraftUI.build());
        } else {
            console.warn("AtomLabUI: #atomlab-periodic-table container is missing.");
        }

        // Clean up legacy standalone container if present in an existing static HTML skeleton
        if (craftContainer) {
            craftContainer.replaceChildren();
        }
    },

    // --------------------------------------------------
    // Render UI state
    // --------------------------------------------------
    render() {
        // Cascade render calls to update active UI state without re-building DOM elements
        PeriodicTableUI.render();
        AtomCraftUI.render();
        return true;
    }

};

export default AtomLabUI;