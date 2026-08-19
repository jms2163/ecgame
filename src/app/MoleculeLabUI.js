// --------------------------------------------------
// MoleculeLabUI.js
// Orchestration & View Controller for Molecule Lab
// --------------------------------------------------

import MoleculeLabManager from "./MoleculeLabManager.js";

const MoleculeLabUI = {

    initialized: false,
    rootElement: null,
    activeTab: "molecules",

    // --------------------------------------------------
    // DOM Helper
    // --------------------------------------------------
    createElement(tag, props = {}) {
        const el = document.createElement(tag);
        Object.assign(el, props);
        return el;
    },

    // --------------------------------------------------
    // Initialize Molecule Lab UI
    // --------------------------------------------------
    initialize() {
        if (this.initialized) {
            this.render();
            return true;
        }

        this.rootElement = this.ensureRootElement();

        if (!this.rootElement) {
            console.warn("[MoleculeLabUI] Unable to mount #molecule-lab-zone");
            return false;
        }

        this.buildUI();

        this.initialized = true;
        this.render();

        console.log("[MoleculeLabUI] Initialized successfully.");
        return true;
    },

    // --------------------------------------------------
    // Ensure DOM Root & Layout Structure Exist
    // --------------------------------------------------
    ensureRootElement() {
        let root = document.getElementById("molecule-lab-zone");

        if (!root) {
            console.warn("[MoleculeLabUI] #molecule-lab-zone not found in HTML skeleton, creating anchor...");
            const appElement = document.getElementById("app-main") || document.getElementById("app") || document.body;

            root = this.createElement("section", {
                id: "molecule-lab-zone",
                className: "zone hidden"
            });

            root.innerHTML = `
                <header id="molecule-lab-header"></header>
                <div class="molecule-lab-layout">
                    <nav id="molecule-lab-tabs"></nav>
                    <div class="molecule-lab-workspace">
                        <aside id="molecule-lab-recipe-drawer"></aside>
                        <main id="molecule-lab-synthesis-canvas"></main>
                        <aside id="molecule-lab-inspector"></aside>
                        <aside id="molecule-lab-reference"></aside>
                    </div>
                </div>
            `;

            appElement.appendChild(root);
        }

        return root;
    },

    // --------------------------------------------------
    // Build & Mount Sub-Components
    // --------------------------------------------------
    buildUI() {
        const headerEl = document.getElementById("molecule-lab-header");
        const tabsEl = document.getElementById("molecule-lab-tabs");
        const recipeDrawerEl = document.getElementById("molecule-lab-recipe-drawer");
        const canvasEl = document.getElementById("molecule-lab-synthesis-canvas");
        const inspectorEl = document.getElementById("molecule-lab-inspector");
        const referenceEl = document.getElementById("molecule-lab-reference");

        const mountComponent = (target, content) => {
            if (!target || !content) return;
            if (content instanceof HTMLElement) {
                target.replaceChildren(content);
            } else if (typeof content === "string") {
                target.innerHTML = content;
            }
        };

        if (headerEl) {
            headerEl.className = "molecule-lab-header-panel";
            mountComponent(headerEl, this.createHeaderPanel());
        }

        if (tabsEl) {
            tabsEl.className = "molecule-lab-tabs-panel";
            mountComponent(tabsEl, this.createTabs());
        }

        if (recipeDrawerEl) {
            recipeDrawerEl.className = "molecule-lab-recipe-drawer";
            mountComponent(recipeDrawerEl, this.createRecipeDrawerPanel());
        }

        if (canvasEl) {
            canvasEl.className = "molecule-lab-synthesis-canvas";
            mountComponent(canvasEl, this.createSynthesisCanvasPanel());
        }

        if (inspectorEl) {
            inspectorEl.className = "molecule-lab-inspector";
            mountComponent(inspectorEl, this.createInspectorPanel());
        }

        if (referenceEl) {
            referenceEl.className = "molecule-lab-reference-panel";
            mountComponent(referenceEl, this.createReferencePanel());
        }

        this.attachEventListeners();
    },

    // --------------------------------------------------
    // Component Builders
    // --------------------------------------------------
    createHeaderPanel() {
        const header = this.createElement("header", { className: "molecule-lab-header-panel" });
        header.innerHTML = `
            <div class="header-left">
                <span class="molecule-lab-subtitle">Molecule Lab - Chemical Bonding Zone</span>
                <h1 class="molecule-lab-title">Molecular Synthesis</h1>
            </div>
            <div class="header-right">
                <span class="molecule-lab-library-title">Library</span>
                <div class="molecule-lab-stat-row">
                    <span>Molecules Synthesized: </span><strong id="stat-synthesized-molecules">0</strong>
                </div>
                <div class="molecule-lab-stat-row">
                    <span>Properties Investigated: </span><strong id="stat-properties-investigated">0</strong>
                </div>
            </div>
        `;
        return header;
    },

    createTabs() {
        const nav = this.createElement("nav", { className: "molecule-lab-tabs-panel" });

        const tabs = [
            { id: "molecules", label: "M", title: "Molecules" },
            { id: "carbohydrates", label: "C", title: "Carbohydrates" },
            { id: "proteins", label: "P", title: "Proteins" },
            { id: "lipids", label: "L", title: "Lipids & Library" }
        ];

        tabs.forEach(({ id, label, title }, index) => {
            const isDefault = index === 0;
            const button = this.createElement("button", {
                className: `molecule-lab-tab-btn${isDefault ? " active" : ""}`,
                title: title
            });

            button.dataset.tab = id;
            button.appendChild(this.createElement("span", {
                className: "molecule-lab-tab-label",
                textContent: label
            }));

            button.addEventListener("click", () => {
                const allTabs = nav.querySelectorAll(".molecule-lab-tab-btn");
                allTabs.forEach(tab => tab.classList.remove("active"));
                button.classList.add("active");

                this.onTabChange(id);
            });

            nav.appendChild(button);
        });

        return nav;
    },

    createRecipeDrawerPanel() {
        const drawer = this.createElement("aside", { className: "molecule-lab-panel recipe-panel" });
        drawer.innerHTML = `
            <h3>Compound Recipes</h3>
            <div id="molecule-lab-recipe-list" class="panel-content list-stub">
                <p class="placeholder-text">Select a tab to view available molecule formulas.</p>
            </div>
        `;
        return drawer;
    },

    createSynthesisCanvasPanel() {
        const canvas = this.createElement("main", { className: "molecule-lab-panel canvas-panel" });
        canvas.innerHTML = `
            <h3>Synthesis Chamber</h3>
            <div id="molecule-lab-canvas-viewport" class="panel-content canvas-stub">
                <p class="placeholder-text">Select a recipe from the drawer to assemble atoms.</p>
            </div>
        `;
        return canvas;
    },

    createInspectorPanel() {
        const inspector = this.createElement("aside", { className: "molecule-lab-panel inspector-panel" });
        inspector.innerHTML = `
            <h3>Molecule Details</h3>
            <div id="molecule-lab-inspector-content" class="panel-content inspector-stub">
                <p class="placeholder-text">No molecule selected.</p>
            </div>
        `;
        return inspector;
    },

    createReferencePanel() {
        const panel = this.createElement("aside", { className: "molecule-lab-reference-panel" });
        panel.appendChild(this.createElement("h2", { textContent: "Chemical Bonding Reference" }));

        const grid = this.createElement("div", { className: "molecule-lab-reference-grid" });

        const concepts = [
            {
                term: "Covalent Bonding",
                formula: "Shared Electrons",
                definition: "A chemical bond formed when two atoms share one or more pairs of valence electrons to achieve molecular stability.",
                example: "example1.png"
            },
            {
                term: "Carbon (C)",
                formula: "4 Covalent Bonds",
                definition: "Forms up to four covalent bonds simultaneously, providing the structural tetravalent backbone for all organic molecules.",
                example: "example2.png"
            },
            {
                term: "Hydrogen (H)",
                formula: "1 Covalent Bond",
                definition: "Forms a single covalent bond in chemical compounds, filling its single valence electron shell.",
                example: "example3.png"
            },
            {
                term: "Polar Covalent Bond",
                formula: "Unequal Sharing (Dipole)",
                definition: "Occurs when atoms share electrons unequally due to differences in electronegativity, creating partial electrical charges (measured via dipole experiments).",
                example: "example4.png"
            },
            {
                term: "Non-Polar Covalent Bond",
                formula: "Equal Sharing (Neutral)",
                definition: "Occurs when electrons are shared equally between atoms, resulting in zero net partial charge (measured via dipole experiments).",
                example: "example5.png"
            },
            {
                term: "Hydrophilic",
                formula: "Water-Loving / Polar",
                definition: "Molecules that readily interact with or dissolve in water, characterized by polar covalent bonds, ionic charges, or hydrogen bonding capability.",
                example: "example6.png"
            },
            {
                term: "Hydrophobic",
                formula: "Water-Fearing / Non-Polar",
                definition: "Non-polar molecules that repel water, characterized by abundant C–H bonds, minimal electrical dipoles, and little to no hydrogen bonding capability.",
                example: "example7.png"
            }
        ];

        concepts.forEach(({ term, formula, definition, example }) => {
            const card = this.createElement("div", { className: "molecule-lab-reference-card" });
            card.appendChild(this.createElement("h3", { textContent: term }));

            if (formula) {
                card.appendChild(this.createElement("span", {
                    className: "molecule-lab-formula-badge",
                    textContent: formula
                }));
            }

            card.appendChild(this.createElement("p", { textContent: definition }));

            if (example) {
                const img = this.createElement("img", {
                    className: "molecule-lab-example-img",
                    src: example,
                    alt: `${term} Example`
                });
                card.appendChild(img);
            }

            grid.appendChild(card);
        });

        panel.appendChild(grid);
        return panel;
    },

    // --------------------------------------------------
    // Event Handlers & Orchestration
    // --------------------------------------------------
    attachEventListeners() {
        // Space reserved for global delegate listeners within molecule lab
    },

    onTabChange(tabId) {
        this.activeTab = tabId;
        console.log(`[MoleculeLabUI] Switched active tab to: ${tabId}`);
    },

    // --------------------------------------------------
    // Render Cascade
    // --------------------------------------------------
    render(stateParam) {
        const state = stateParam || MoleculeLabManager?.getStatus();

        if (!state) {
            return false;
        }

        const synthesizedStat = document.getElementById("stat-synthesized-molecules");
        if (synthesizedStat && state.synthesizedCount !== undefined) {
            synthesizedStat.textContent = state.synthesizedCount;
        }

        const propertiesStat = document.getElementById("stat-properties-investigated");
        if (propertiesStat && state.investigatedCount !== undefined) {
            propertiesStat.textContent = state.investigatedCount;
        }

        return true;
    }
};



export default MoleculeLabUI;