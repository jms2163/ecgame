// --------------------------------------------------
// MacromolecularizerUI.js
// Console-locked shell for the Macromolecularizer zone
// --------------------------------------------------

import GameStateObserver from "./GameStateObserver.js";
import MacromolecularizerManager
    from "./MacromolecularizerManager.js";

const MacromolecularizerUI = {

    initialized: false,
    active: false,
    subscribed: false,
    rootElement: null,
    elements: {},

    // --------------------------------------------------
    // Initialize the persistent zone shell once
    // --------------------------------------------------
    initialize() {

        if (this.initialized) {
            return true;
        }

        this.rootElement =
            this.ensureRootElement();

        if (!this.rootElement) {
            console.warn(
                "[MacromolecularizerUI] Unable to mount #macromolecularizer-zone."
            );

            return false;
        }

        this.buildStaticUI();
        this.cacheElements();
        this.subscribe();

        this.initialized = true;
        this.render();

        console.log(
            "[MacromolecularizerUI] Initialized."
        );

        return true;

    },

    // --------------------------------------------------
    // Create the zone root when it is first requested
    // --------------------------------------------------
    ensureRootElement() {

        let root =
            document.getElementById(
                "macromolecularizer-zone"
            );

        if (root) {
            return root;
        }

        const host =
            document.getElementById(
                "app-main"
            ) ||
            document.getElementById(
                "app"
            ) ||
            document.body;

        if (!host) {
            return null;
        }

        root =
            document.createElement(
                "section"
            );

        root.id =
            "macromolecularizer-zone";

        root.className =
            "zone hidden";

        root.setAttribute(
            "aria-label",
            "Macromolecularizer"
        );

        host.appendChild(root);

        return root;

    },

    // --------------------------------------------------
    // Build a noninteractive development shell
    // --------------------------------------------------
    buildStaticUI() {

        this.rootElement.innerHTML = `
            <header class="macromolecularizer-header">
                <p class="macromolecularizer-eyebrow">Macromolecularizer</p>
                <h1>Motif Lab</h1>
                <p>
                    Build small polypeptide motifs from amino-acid
                    synthesis knowledge.
                </p>
            </header>

            <div class="macromolecularizer-layout">
                <aside
                    class="macromolecularizer-catalog"
                    aria-label="Motif recipe catalog"
                >
                    <h2>Motif Recipes</h2>
                    <p id="macromolecularizer-selected-motif"></p>
                </aside>

                <main
                    class="macromolecularizer-workspace"
                    aria-label="Motif synthesis workspace"
                >
                    <h2>Synthesis Workspace</h2>
                    <p>
                        This development shell is intentionally
                        noninteractive. Dehydration discovery and
                        synthesis controls will be added in later milestones.
                    </p>
                </main>

                <aside
                    class="macromolecularizer-status"
                    aria-label="Macromolecularizer status"
                >
                    <h2>Development Status</h2>
                    <dl>
                        <dt>Access</dt>
                        <dd>Development console only</dd>

                        <dt>Stored motif types</dt>
                        <dd id="macromolecularizer-inventory-count">0</dd>

                        <dt>Active synthesis</dt>
                        <dd id="macromolecularizer-active-synthesis">None</dd>
                    </dl>
                </aside>
            </div>
        `;

    },

    // --------------------------------------------------
    // Cache stable shell elements
    // --------------------------------------------------
    cacheElements() {

        this.elements = {
            selectedMotif:
                this.rootElement.querySelector(
                    "#macromolecularizer-selected-motif"
                ),
            inventoryCount:
                this.rootElement.querySelector(
                    "#macromolecularizer-inventory-count"
                ),
            activeSynthesis:
                this.rootElement.querySelector(
                    "#macromolecularizer-active-synthesis"
                )
        };

    },

    // --------------------------------------------------
    // Activate the shell
    // --------------------------------------------------
    activate() {

        if (
            !this.initialized &&
            !this.initialize()
        ) {
            return false;
        }

        this.active = true;
        this.render();

        return true;

    },

    // --------------------------------------------------
    // Deactivate the shell
    // --------------------------------------------------
    deactivate() {

        this.active = false;

        return true;

    },

    // --------------------------------------------------
    // Render read-only persistent status
    // --------------------------------------------------
    render() {

        if (!this.initialized) {
            return false;
        }

        const status =
            MacromolecularizerManager
                .getStatus();

        const storedMotifTypes =
            Object.values(
                status.motifInventory
            ).filter(
                count => count > 0
            ).length;

        this.elements.selectedMotif
            .textContent =
                `Selected: ${status.selectedMotifId}`;

        this.elements.inventoryCount
            .textContent =
                String(storedMotifTypes);

        this.elements.activeSynthesis
            .textContent =
                status.activeSynthesis
                    ?.motifId ??
                "None";

        return true;

    },

    // --------------------------------------------------
    // Subscribe once to domain-state changes
    // --------------------------------------------------
    subscribe() {

        if (this.subscribed) {
            return;
        }

        GameStateObserver.on(
            "macromolecularizer-state-changed",
            () => this.render()
        );

        this.subscribed = true;

    }

};

export default MacromolecularizerUI;
