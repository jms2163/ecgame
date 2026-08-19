// --------------------------------------------------
// MolecularLabUI.js
// Orchestration & View Controller for Molecular Lab
// --------------------------------------------------

import MolecularLabManager from "./MolecularLabManager.js";

const MolecularLabUI = {

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
    // Initialize Molecular Lab UI
    // --------------------------------------------------
    initialize() {
        if (this.initialized) {
            this.render();
            return true;
        }

        this.rootElement = this.ensureRootElement();

        if (!this.rootElement) {
            console.warn("[MolecularLabUI] Unable to mount #molecule-lab-zone");
            return false;
        }

        this.buildInterface();

        this.initialized = true;
        this.render();

        console.log("[MolecularLabUI] Initialized successfully.");
        return true;
    },

    // --------------------------------------------------
    // Ensure DOM Root Exists
    // --------------------------------------------------
    ensureRootElement() {
        let root = document.getElementById("molecule-lab-zone");

        if (!root) {
            console.warn("[MolecularLabUI] #molecule-lab-zone not found in HTML skeleton, creating anchor...");
            const appElement = document.getElementById("app") || document.body;

            root = this.createElement("section", {
                id: "molecule-lab-zone",
                className: "hidden"
            });

            appElement.appendChild(root);
        }

        return root;
    },

    // --------------------------------------------------
    // Build & Assemble Interface
    // --------------------------------------------------
    buildInterface() {
        if (!this.rootElement) return;

        this.rootElement.replaceChildren();

        // 1. Header Panel
        const headerPanel = this.createHeaderPanel();

        // 2. Content Layout Shell
        const contentContainer = this.createElement("div", { className: "moleculelab-content" });

        // 3. Side Nav & Main Workspace
        const navSidePanel = this.createNavSidePanel();
        const mainWorkspace = this.createMainWorkspace();

        contentContainer.append(navSidePanel, mainWorkspace);
        this.rootElement.append(headerPanel, contentContainer);
    },

    // --------------------------------------------------
    // Header Panel Component
    // --------------------------------------------------
    createHeaderPanel() {
        const header = this.createElement("header", { className: "moleculelab-header-panel" });
        header.innerHTML = `
            <div class="header-left">
                <span class="moleculelab-subtitle">Molecular Lab - Chemical Crafting Zone</span>
                <h1 class="moleculelab-title">Molecular Synthesis</h1>
            </div>
            <div class="header-right">
                <span class="moleculelab-library-title">Library</span>
                <div class="moleculelab-stat-row">
                    <span>Molecules Discovered: </span><strong id="stat-discovered-molecules">0</strong>
                </div>
            </div>
        `;
        return header;
    },

    // --------------------------------------------------
    // Left Navigation Side Panel
    // --------------------------------------------------
    createNavSidePanel() {
        const nav = this.createElement("nav", { className: "moleculelab-nav-side-panel" });
        nav.innerHTML = `
            <div class="moleculelab-nav-group">
                <button class="mol-lab-tab-btn active" data-tab="tech-tree">
                    <span class="icon">🌳</span> Tech Tree
                </button>
                <button class="mol-lab-tab-btn" data-tab="builder">
                    <span class="icon">🧪</span> Workbench
                </button>
                <button class="mol-lab-tab-btn" data-tab="library">
                    <span class="icon">📖</span> Library
                </button>
            </div>
        `;

        nav.addEventListener("click", (e) => {
            const btn = e.target.closest(".mol-lab-tab-btn");
            if (!btn) return;

            nav.querySelectorAll(".mol-lab-tab-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            this.switchTab(btn.dataset.tab);
        });

        return nav;
    },

    // --------------------------------------------------
    // Main Workspace (Tech Tree, Builder, Inspector)
    // --------------------------------------------------
    createMainWorkspace() {
        const workspace = this.createElement("main", { className: "moleculelab-workspace" });

        const techTreePane = this.createElement("section", {
            id: "mol-lab-pane-tech-tree",
            className: "mol-lab-pane active"
        });
        techTreePane.innerHTML = `
            <div class="pane-header"><h3>Molecular Tech Tree</h3></div>
            <div id="mol-tech-tree-canvas" class="tree-canvas"></div>
        `;

        const builderPane = this.createElement("section", {
            id: "mol-lab-pane-builder",
            className: "mol-lab-pane hidden"
        });
        builderPane.innerHTML = `
            <div class="pane-header"><h3>Synthesis Workbench</h3></div>
            <div class="builder-slots-container"></div>
        `;

        const inspectorPane = this.createElement("aside", {
            id: "mol-lab-pane-inspector",
            className: "mol-lab-inspector-panel"
        });
        inspectorPane.innerHTML = `
            <div class="inspector-header"><h4>Molecule Inspector</h4></div>
            <div id="mol-inspector-details" class="inspector-content">
                <p class="placeholder-text">Select a node or recipe to inspect chemical properties.</p>
            </div>
        `;

        workspace.append(techTreePane, builderPane, inspectorPane);
        return workspace;
    },

    // --------------------------------------------------
    // Tab Switcher Helper
    // --------------------------------------------------
    switchTab(tabId) {
        const techTreePane = this.rootElement?.querySelector("#mol-lab-pane-tech-tree");
        const builderPane = this.rootElement?.querySelector("#mol-lab-pane-builder");

        if (techTreePane) {
            techTreePane.classList.toggle("hidden", tabId !== "tech-tree");
            techTreePane.classList.toggle("active", tabId === "tech-tree");
        }
        if (builderPane) {
            builderPane.classList.toggle("hidden", tabId !== "builder");
            builderPane.classList.toggle("active", tabId === "builder");
        }
        console.log(`[MolecularLabUI] Switched view tab to: ${tabId}`);
    },

    // --------------------------------------------------
    // Orchestrated Render Cascade
    // --------------------------------------------------
    render(stateParam) {
        const state = stateParam || MolecularLabManager?.getStatus();

        if (!state) {
            console.warn("[MolecularLabUI] Render skipped: state unavailable.");
            return false;
        }

        const discoveredEl = this.rootElement?.querySelector("#stat-discovered-molecules");
        if (discoveredEl && state.discoveredCount !== undefined) {
            discoveredEl.textContent = `${state.discoveredCount}/${state.totalMoleculesCount || 0}`;
        }

        return true;
    }
};

window.ECGame = window.ECGame || {};
window.ECGame.MolecularLabUI = MolecularLabUI;

export default MolecularLabUI;