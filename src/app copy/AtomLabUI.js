// --------------------------------------------------
// AtomLabUI.js
// Orchestration & View Controller for Atom Lab
// --------------------------------------------------

import PeriodicTableUI from "./PeriodicTableUI.js";
import AtomCraftUI from "./AtomCraftUI.js";
import AtomLabManager from "./AtomLabManager.js";

const AtomLabUI = {

    initialized: false,
    rootElement: null,

    // --------------------------------------------------
    // DOM Helper
    // --------------------------------------------------
    createElement(tag, props = {}) {
        const el = document.createElement(tag);
        Object.assign(el, props);
        return el;
    },

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
            console.warn("[AtomLabUI] Unable to mount #atomlab-zone");
            return false;
        }

        this.buildInterface();

        this.initialized = true;
        this.render();

        console.log("[AtomLabUI] Initialized successfully.");
        return true;
    },

    // --------------------------------------------------
    // Ensure DOM Root Exists (Lightweight Anchor Lookup)
    // --------------------------------------------------
    ensureRootElement() {
        let root = document.getElementById("atomlab-zone");

        if (!root) {
            console.warn("[AtomLabUI] #atomlab-zone not found in HTML skeleton, creating anchor...");
            const appElement = document.getElementById("app") || document.body;

            root = this.createElement("section", {
                id: "atomlab-zone",
                className: "hidden"
            });

            appElement.appendChild(root);
        }

        return root;
    },

    // --------------------------------------------------
    // Build & Assemble Interface (Single Source of Truth)
    // --------------------------------------------------
    buildInterface() {
        if (!this.rootElement) return;

        // Clear root container before assembling layout
        this.rootElement.replaceChildren();

        // 1. Build Header Panel Component
        const headerPanel = this.createHeaderPanel();

        // 2. Build Content Wrapper & Sub-components
        const contentContainer = this.createElement("div", { className: "atomlab-content" });
        const tableContainer = this.createElement("div", { id: "atomlab-periodic-table" });

        // Build Periodic Table component
        const ptElement = PeriodicTableUI.build();

        // Embed AtomCraft into Periodic Table grid slot (top-center cutout)
        const gridContainer = ptElement.querySelector(".pt-grid") || ptElement;
        gridContainer.appendChild(AtomCraftUI.build());

        // Build Subatomic Reference Panel
        const referencePanel = this.createReferencePanel();

        // Append sub-components into table container
        tableContainer.append(ptElement, referencePanel);
        contentContainer.appendChild(tableContainer);

        // 3. Mount assembled header and content layout to root
        this.rootElement.append(headerPanel, contentContainer);
    },

    // --------------------------------------------------
    // Header Panel Component
    // --------------------------------------------------
    createHeaderPanel() {
        const header = this.createElement("header", { className: "atomlab-header-panel" });
        header.innerHTML = `
            <div class="header-left">
                <span class="atomlab-subtitle">Atom Lab - Atomic Crafting Zone</span>
                <h1 class="atomlab-title">Atomic Synthesis</h1>
            </div>
            <div class="header-right">
                <span class="atomlab-library-title">Library</span>
                <div class="atomlab-stat-row">
                    <span>Elements Discovered: </span><strong id="stat-discovered-elements">0/118</strong>
                </div>
                <div class="atomlab-stat-row">
                    <span>Isotopes Synthesized: </span><strong id="stat-synthesized-isotopes">0</strong>
                </div>
            </div>
        `;
        return header;
    },

    // --------------------------------------------------
    // Subatomic Reference Panel View
    // --------------------------------------------------
    createReferencePanel() {
        const panel = this.createElement("aside", { className: "atomlab-reference-panel" });
        panel.appendChild(this.createElement("h2", { textContent: "Periodic Table Reference" }));

        const grid = this.createElement("div", { className: "atomlab-reference-grid" });

        const concepts = [
            {
                term: "Element",
                formula: null,
                definition: "A pure substance made of atoms that all share the same proton count. Changing the number of protons alters the element's identity entirely."
            },
            {
                term: "Atomic Number (Z)",
                formula: "Protons",
                definition: "The total number of protons in the nucleus. This determines the element's placement and order on the Periodic Table."
            },
            {
                term: "Atomic Mass / Mass Number (A)",
                formula: "Protons + Neutrons",
                definition: "The combined mass of the nucleus. Because electrons have near-zero mass, atomic mass is calculated solely by adding protons and neutrons."
            },
            {
                term: "Isotope",
                formula: "Same Protons, Different Neutrons",
                definition: "Variations of the same element. They share identical chemical properties (protons) but differ in total mass (neutrons)."
            }
        ];

        concepts.forEach(({ term, formula, definition }) => {
            const card = this.createElement("div", { className: "atomlab-reference-card" });
            card.appendChild(this.createElement("h3", { textContent: term }));

            if (formula) {
                card.appendChild(this.createElement("span", {
                    className: "atomlab-formula-badge",
                    textContent: formula
                }));
            }

            card.appendChild(this.createElement("p", { textContent: definition }));
            grid.appendChild(card);
        });

        panel.appendChild(grid);
        return panel;
    },

    // --------------------------------------------------
    // Orchestrated Top-Down Render Cascade
    // --------------------------------------------------
    render(stateParam) {
        const state = stateParam || AtomLabManager?.getStatus();

        if (!state) {
            console.warn("[AtomLabUI] Render skipped: state unavailable.");
            return false;
        }

        // Dynamically update Header Library Stats
        const discoveredEl = this.rootElement?.querySelector("#stat-discovered-elements");
        const isotopesEl = this.rootElement?.querySelector("#stat-synthesized-isotopes");

        if (discoveredEl && state.discoveredElementsCount !== undefined) {
            discoveredEl.textContent = `${state.discoveredElementsCount}/118`;
        }
        if (isotopesEl && state.synthesizedIsotopesCount !== undefined) {
            isotopesEl.textContent = state.synthesizedIsotopesCount;
        }

        // Pass state down to child components
        PeriodicTableUI.render(state);
        AtomCraftUI.render(state);

        return true;
    }
};

export default AtomLabUI;