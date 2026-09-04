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
    feedbackMessage: "",

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
        this.bindEvents();
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
    // Build the console-only development shell
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
                        Discover the reactions that build and break
                        biological polymers. Motif synthesis controls
                        will be added in the next milestone.
                    </p>

                    <section
                        class="macromolecularizer-reaction-discovery"
                        aria-labelledby="macromolecularizer-reaction-heading"
                    >
                        <h3 id="macromolecularizer-reaction-heading">
                            Reaction Discovery
                        </h3>
                        <p>
                            Dehydration synthesis joins monomers by
                            removing water. Hydrolysis uses water to
                            separate them.
                        </p>
                        <div class="macromolecularizer-reaction-actions">
                            <button
                                id="macromolecularizer-discover-dehydration"
                                type="button"
                                data-reaction-id="dehydration"
                            >
                                Discover Dehydration
                            </button>
                            <button
                                id="macromolecularizer-discover-hydrolysis"
                                type="button"
                                data-reaction-id="hydrolysis"
                            >
                                Discover Hydrolysis
                            </button>
                        </div>
                        <p
                            id="macromolecularizer-reaction-feedback"
                            role="status"
                            aria-live="polite"
                        ></p>
                    </section>
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
                ),
            reactionFeedback:
                this.rootElement.querySelector(
                    "#macromolecularizer-reaction-feedback"
                ),
            reactionButtons:
                Array.from(
                    this.rootElement.querySelectorAll(
                        "[data-reaction-id]"
                    )
                )
        };

    },

    // --------------------------------------------------
    // Bind temporary reaction-discovery controls once
    // --------------------------------------------------
    bindEvents() {

        this.elements.reactionButtons
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        const result =
                            MacromolecularizerManager
                                .discoverReaction(
                                    button.dataset
                                        .reactionId
                                );

                        this.elements
                            .reactionFeedback
                            .textContent =
                                result.message;

                        this.feedbackMessage =
                            result.message;

                        this.render();
                    }
                );
            });

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

        this.elements.reactionButtons
            .forEach(button => {
                const reactionId =
                    button.dataset.reactionId;

                const discovered =
                    Boolean(
                        status.reactionDiscoveries[
                            reactionId
                        ]
                    );

                button.disabled =
                    discovered;

                button.setAttribute(
                    "aria-pressed",
                    String(discovered)
                );

                if (discovered) {
                    button.textContent =
                        `${this.formatReactionName(reactionId)} Discovered`;
                } else {
                    button.textContent =
                        `Discover ${this.formatReactionName(reactionId)}`;
                }
            });

        if (this.feedbackMessage === "") {
            const discoveredNames =
                Object.entries(
                    status.reactionDiscoveries
                )
                    .filter(([, discovered]) => discovered)
                    .map(([reactionId]) =>
                        this.formatReactionName(
                            reactionId
                        )
                    );

            this.elements.reactionFeedback
                .textContent =
                    discoveredNames.length > 0
                        ? `Known reactions: ${discoveredNames.join(", ")}.`
                        : "No polymer reactions discovered yet.";
        }

        return true;

    },

    formatReactionName(reactionId) {

        return reactionId
            .charAt(0)
            .toUpperCase() +
            reactionId.slice(1);

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
