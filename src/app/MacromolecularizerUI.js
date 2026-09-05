// --------------------------------------------------
// MacromolecularizerUI.js
// Console-locked shell for the Macromolecularizer zone
// --------------------------------------------------

import GameStateObserver from "./GameStateObserver.js";
import MacromolecularizerManager
    from "./MacromolecularizerManager.js";
import MotifVisualCatalog
    from "../data/MotifVisualCatalog.js";

const MacromolecularizerUI = {

    initialized: false,
    active: false,
    subscribed: false,
    rootElement: null,
    elements: {},
    feedbackMessage: "",
    synthesisFeedbackMessage: "",
    upgradeFeedbackMessage: "",
    chamberViewMode: "synthesis",
    helixFramePreload: null,
    observationImagePreloads: {},
    observationLayers: {
        ribbon: true,
        hbonds: false,
        atoms: false
    },
    activeVisualMotifId: null,

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
    // Build the console-only laboratory shell
    // --------------------------------------------------
    buildStaticUI() {

        this.rootElement.innerHTML = `
            <div class="macro-lab-shell">
                <header class="macro-topbar">
                    <div class="macro-brand-block">
                        <p class="macro-kicker">Controlled Assembly System</p>
                        <h1>Macromolecularizer</h1>
                        <p class="macro-build-label">Protein Motif Lab // Development Build</p>
                    </div>

                    <div
                        class="macro-resource-strip"
                        aria-label="Macromolecularizer resources and status"
                    >
                        <div class="macro-instrument macro-instrument--atp">
                            <span class="macro-instrument-label">ATP Reserve</span>
                            <strong id="macromolecularizer-top-atp">0</strong>
                            <span class="macro-instrument-unit">ATP</span>
                        </div>

                        <div class="macro-instrument macro-instrument--points">
                            <span class="macro-instrument-label">Synthesis Points</span>
                            <strong id="macromolecularizer-synthesis-points">0</strong>
                            <span class="macro-instrument-unit">SP</span>
                        </div>

                        <div class="macro-status-stack">
                            <div class="macro-status-line">
                                <span class="macro-status-light" aria-hidden="true"></span>
                                <span id="macromolecularizer-system-status">System standby</span>
                            </div>
                            <div class="macro-status-line macro-status-line--muted">
                                <span class="macro-lock-glyph" aria-hidden="true">◆</span>
                                Console access only
                            </div>
                        </div>
                    </div>
                </header>

                <div class="macro-lab-grid">
                <aside
                    class="macro-panel macro-recipe-bank"
                    aria-label="Motif recipe catalog"
                >
                    <header class="macro-panel-heading">
                        <div>
                            <p class="macro-kicker">Specimen Catalog</p>
                            <h2>Recipe Bank</h2>
                        </div>
                        <span class="macro-panel-code">CAT-01</span>
                    </header>

                    <div
                        class="macro-category-tabs"
                        role="tablist"
                        aria-label="Macromolecule categories"
                    >
                        <button
                            type="button"
                            role="tab"
                            aria-selected="false"
                            disabled
                            title="Carbohydrate catalog pending"
                        >
                            <strong>C</strong>
                            <span>Carbohydrates</span>
                            <small>Locked</small>
                        </button>
                        <button
                            id="macromolecularizer-protein-tab"
                            class="is-selected"
                            type="button"
                            role="tab"
                            aria-selected="true"
                            aria-controls="macromolecularizer-protein-recipes"
                        >
                            <strong>P</strong>
                            <span>Proteins</span>
                            <small id="macromolecularizer-protein-recipe-count">1 recipe</small>
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected="false"
                            disabled
                            title="Nucleic-acid catalog planned for Milestone 10"
                        >
                            <strong>N</strong>
                            <span>Nucleic Acids</span>
                            <small>Locked</small>
                        </button>
                    </div>

                    <div
                        id="macromolecularizer-protein-recipes"
                        class="macro-recipe-list"
                        role="tabpanel"
                        aria-labelledby="macromolecularizer-protein-tab"
                    >
                        <p id="macromolecularizer-selected-motif" class="macro-selection-readout"></p>

                        <div
                            id="macromolecularizer-motif-card-list"
                            class="macro-motif-card-list"
                            aria-label="Available protein motif recipes"
                        ></div>

                    </div>
                </aside>

                <main
                    class="macro-panel macro-synthesis-workspace"
                    aria-label="Motif synthesis workspace"
                >
                    <header class="macro-panel-heading macro-chamber-heading">
                        <div>
                            <p class="macro-kicker">Assembly Core</p>
                            <h2>Synthesis Chamber</h2>
                        </div>
                        <span class="macro-panel-code">CHM-01</span>
                    </header>

                    <section
                        id="macromolecularizer-chamber"
                        class="macro-chamber"
                        data-mode="locked"
                        aria-labelledby="macromolecularizer-recipe-heading"
                    >
                        <div class="macro-chamber-grid" aria-hidden="true"></div>
                        <div
                            class="macro-mode-overlay"
                            role="status"
                            aria-live="polite"
                        >
                            <span class="macro-mode-light" aria-hidden="true"></span>
                            <span id="macromolecularizer-chamber-mode">Synthesis locked</span>
                        </div>
                        <fieldset
                            id="macromolecularizer-observation-controls"
                            class="macro-observation-controls"
                            aria-label="Structure display layers"
                            hidden
                        >
                            <legend>Structure display layers</legend>
                            <label class="macro-observation-toggle">
                                <span>Ribbon</span>
                                <input
                                    type="checkbox"
                                    data-observation-layer="ribbon"
                                    checked
                                >
                                <span class="macro-toggle-track" aria-hidden="true"></span>
                            </label>
                            <label class="macro-observation-toggle">
                                <span>H-bonds</span>
                                <input
                                    type="checkbox"
                                    data-observation-layer="hbonds"
                                >
                                <span class="macro-toggle-track" aria-hidden="true"></span>
                            </label>
                            <label class="macro-observation-toggle">
                                <span>Atoms</span>
                                <input
                                    type="checkbox"
                                    data-observation-layer="atoms"
                                >
                                <span class="macro-toggle-track" aria-hidden="true"></span>
                            </label>
                        </fieldset>
                        <div class="macro-chamber-readout">
                            <span>Target</span>
                            <strong id="macromolecularizer-chamber-target">Alpha Helix Motif</strong>
                            <small id="macromolecularizer-chamber-classification">H_helix // Protein secondary structure</small>
                        </div>
                        <div class="macro-helix-stage" aria-hidden="true">
                            <div class="macro-scan-ring macro-scan-ring--outer"></div>
                            <div class="macro-scan-ring macro-scan-ring--inner"></div>
                            <img
                                id="macromolecularizer-helix-frame"
                                class="macro-helix-frame"
                                src="./public/assets/molecularizer/H_helix_white15.png"
                                alt=""
                                decoding="async"
                            >
                            <svg
                                id="macromolecularizer-helix-fallback"
                                class="macro-helix-model"
                                viewBox="0 0 360 260"
                                focusable="false"
                                hidden
                            >
                                <defs>
                                    <linearGradient id="macro-helix-gradient" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0" stop-color="#ffb347"></stop>
                                        <stop offset="0.5" stop-color="#ff7700"></stop>
                                        <stop offset="1" stop-color="#ff4d00"></stop>
                                    </linearGradient>
                                    <filter id="macro-helix-glow" x="-50%" y="-50%" width="200%" height="200%">
                                        <feGaussianBlur stdDeviation="4" result="blur"></feGaussianBlur>
                                        <feMerge>
                                            <feMergeNode in="blur"></feMergeNode>
                                            <feMergeNode in="SourceGraphic"></feMergeNode>
                                        </feMerge>
                                    </filter>
                                </defs>
                                <g class="macro-helix-bonds" stroke="#ffd09a" stroke-width="2" stroke-dasharray="4 5" opacity="0.46">
                                    <line x1="180" y1="48" x2="180" y2="82"></line>
                                    <line x1="180" y1="91" x2="180" y2="125"></line>
                                    <line x1="180" y1="134" x2="180" y2="168"></line>
                                    <line x1="180" y1="177" x2="180" y2="211"></line>
                                </g>
                                <path
                                    class="macro-helix-shadow"
                                    d="M180 18 C93 29 98 62 180 69 C262 76 267 108 180 112 C93 119 98 151 180 158 C262 165 267 197 180 203 C98 210 102 237 180 244"
                                ></path>
                                <path
                                    class="macro-helix-strand"
                                    d="M180 18 C93 29 98 62 180 69 C262 76 267 108 180 112 C93 119 98 151 180 158 C262 165 267 197 180 203 C98 210 102 237 180 244"
                                ></path>
                                <g class="macro-helix-nodes" fill="#fff3e5" filter="url(#macro-helix-glow)">
                                    <circle cx="180" cy="18" r="5"></circle>
                                    <circle cx="180" cy="112" r="5"></circle>
                                    <circle cx="180" cy="158" r="5"></circle>
                                    <circle cx="180" cy="244" r="5"></circle>
                                </g>
                            </svg>
                            <div
                                id="macromolecularizer-generic-motif-visual"
                                class="macro-generic-motif-visual"
                                hidden
                            >
                                <span
                                    id="macromolecularizer-generic-motif-icon"
                                    class="macro-generic-motif-icon"
                                >◆</span>
                                <strong id="macromolecularizer-generic-motif-name">Motif</strong>
                                <small id="macromolecularizer-generic-motif-status">Awaiting synthesis</small>
                            </div>
                        </div>
                        <div
                            id="macromolecularizer-frame-readout"
                            class="macro-frame-readout"
                            hidden
                        >
                            <span>Assembly stage</span>
                            <strong id="macromolecularizer-frame-stage">0 / 16</strong>
                        </div>
                        <div class="macro-chamber-quantity">
                            <span>Stored</span>
                            <strong id="macromolecularizer-chamber-quantity">0</strong>
                        </div>

                    </section>

                    <div
                        id="macromolecularizer-synthesis-progress-panel"
                        class="macro-progress-panel"
                        aria-live="polite"
                        hidden
                    >
                        <label
                            id="macromolecularizer-synthesis-progress-label"
                            for="macromolecularizer-synthesis-progress"
                        >
                            Motif synthesis progress
                        </label>
                        <progress
                            id="macromolecularizer-synthesis-progress"
                            max="1"
                            value="0"
                        ></progress>
                        <p id="macromolecularizer-synthesis-countdown"></p>
                    </div>

                    <section class="macro-requirements-console">
                        <div class="macro-console-heading">
                            <div>
                                <p class="macro-kicker">Preflight Sequence</p>
                                <h3 id="macromolecularizer-recipe-heading">Synthesis Requirements</h3>
                            </div>
                            <span>Next job</span>
                        </div>
                        <ul id="macromolecularizer-requirement-summary" class="macro-requirement-list"></ul>
                        <p
                            id="macromolecularizer-recipe-gate"
                            class="macro-feedback macro-feedback--warning"
                            role="status"
                        ></p>

                        <div id="macromolecularizer-recipe-details" class="macro-recipe-details">
                            <p
                                id="macromolecularizer-eligibility-feedback"
                                class="macro-feedback"
                                role="status"
                                aria-live="polite"
                            ></p>
                            <div class="macro-primary-actions">
                                <button
                                    id="macromolecularizer-start-synthesis"
                                    class="macro-button macro-button--primary"
                                    type="button"
                                >
                                    Begin Motif Synthesis
                                </button>
                                <button
                                    id="macromolecularizer-observe-structure"
                                    class="macro-button macro-button--secondary"
                                    type="button"
                                >
                                    Observe Structure
                                </button>
                            </div>
                            <p
                                id="macromolecularizer-synthesis-feedback"
                                class="macro-feedback macro-feedback--quiet"
                                role="status"
                                aria-live="polite"
                            ></p>

                            <details class="macro-science-dossier">
                                <summary>Open molecular dossier</summary>
                                <div class="macro-dossier-grid">
                                    <div class="macro-dossier-copy">
                                        <span class="macro-dossier-label">Structure</span>
                                        <h4 id="macromolecularizer-recipe-name"></h4>
                                        <p id="macromolecularizer-recipe-description"></p>
                                        <p id="macromolecularizer-bond-calculation"></p>
                                    </div>
                                    <div>
                                        <span class="macro-dossier-label">Amino-acid composition</span>
                                        <p class="macro-dossier-note">
                                            Quantities describe the motif. Known amino-acid prerequisites are not consumed.
                                        </p>
                                        <ul id="macromolecularizer-amino-acid-requirements"></ul>
                                    </div>
                                    <div>
                                        <span class="macro-dossier-label">ATP requirement</span>
                                        <p id="macromolecularizer-atp-requirement"></p>
                                    </div>
                                    <div>
                                        <span class="macro-dossier-label">Synthesis timing</span>
                                        <p id="macromolecularizer-synthesis-timing"></p>
                                    </div>
                                </div>
                            </details>
                        </div>
                    </section>
                </main>

                <aside
                    class="macro-panel macro-inventory-tray"
                    aria-label="Macromolecularizer status"
                >
                    <header class="macro-panel-heading">
                        <div>
                            <p class="macro-kicker">Cold Storage</p>
                            <h2>Inventory Tray</h2>
                        </div>
                        <span class="macro-panel-code">INV-01</span>
                    </header>

                    <div class="macro-inventory-meters">
                        <div>
                            <span>Motif types</span>
                            <strong id="macromolecularizer-inventory-count">0</strong>
                        </div>
                        <div>
                            <span>Total copies</span>
                            <strong id="macromolecularizer-inventory-total">0</strong>
                        </div>
                    </div>

                    <div class="macro-active-job">
                        <span class="macro-dossier-label">Active synthesis</span>
                        <strong id="macromolecularizer-active-synthesis">None</strong>
                    </div>

                    <section
                        class="macro-tray-section"
                        aria-labelledby="macromolecularizer-inventory-heading"
                    >
                        <div class="macro-tray-heading">
                            <h3 id="macromolecularizer-inventory-heading">Completed Motifs</h3>
                            <span>Physical inventory</span>
                        </div>
                        <p id="macromolecularizer-inventory-empty" class="macro-empty-slot">
                            No completed motifs yet.
                        </p>
                        <ul id="macromolecularizer-inventory-list" class="macro-inventory-list"></ul>
                    </section>

                    <section
                        class="macro-tray-section"
                        aria-labelledby="macromolecularizer-known-aa-heading"
                    >
                        <div class="macro-tray-heading">
                            <h3 id="macromolecularizer-known-aa-heading">Known Amino Acids</h3>
                            <span>Knowledge · not consumed</span>
                        </div>
                        <ul id="macromolecularizer-known-amino-acids" class="macro-amino-acid-grid"></ul>
                    </section>

                    <section class="macro-tray-section macro-components-section">
                        <div class="macro-tray-heading">
                            <h3>Components</h3>
                            <span>Future inventory</span>
                        </div>
                        <div class="macro-empty-slot">
                            No consumable components are required for this protein recipe.
                        </div>
                    </section>
                </aside>

                <footer class="macro-panel macro-control-deck">
                    <header class="macro-panel-heading macro-control-heading">
                        <div>
                            <p class="macro-kicker">Operator Console</p>
                            <h2>Lab Controls</h2>
                        </div>
                        <span class="macro-panel-code">CTL-01</span>
                    </header>

                    <section
                        class="macro-control-module macro-reaction-module"
                        aria-labelledby="macromolecularizer-reaction-heading"
                    >
                        <div class="macro-module-heading">
                            <span class="macro-module-index">01</span>
                            <div>
                                <h3 id="macromolecularizer-reaction-heading">Reaction Discovery</h3>
                                <p>Identify the reactions that build and separate biological polymers.</p>
                            </div>
                        </div>
                        <div class="macromolecularizer-reaction-actions">
                            <button
                                id="macromolecularizer-discover-dehydration"
                                class="macro-button macro-button--compact"
                                type="button"
                                data-reaction-id="dehydration"
                            >
                                Discover Dehydration
                            </button>
                            <button
                                id="macromolecularizer-discover-hydrolysis"
                                class="macro-button macro-button--compact"
                                type="button"
                                data-reaction-id="hydrolysis"
                            >
                                Discover Hydrolysis
                            </button>
                        </div>
                        <p
                            id="macromolecularizer-reaction-feedback"
                            class="macro-feedback macro-feedback--quiet"
                            role="status"
                            aria-live="polite"
                        ></p>
                    </section>

                    <section
                        class="macro-control-module macro-upgrade-module"
                        aria-labelledby="macromolecularizer-speed-heading"
                    >
                        <div class="macro-module-heading">
                            <span class="macro-module-index">02</span>
                            <div>
                                <h3 id="macromolecularizer-speed-heading">Dehydration Speed</h3>
                                <p>Upgrades affect jobs started after installation.</p>
                            </div>
                        </div>
                        <dl class="macro-upgrade-stats">
                            <div>
                                <dt>Level</dt>
                                <dd id="macromolecularizer-speed-level">0</dd>
                            </div>
                            <div>
                                <dt>Speed</dt>
                                <dd id="macromolecularizer-speed-multiplier">1×</dd>
                            </div>
                            <div>
                                <dt>Seconds / bond</dt>
                                <dd id="macromolecularizer-seconds-per-bond">30</dd>
                            </div>
                        </dl>
                        <div class="macro-upgrade-action">
                            <button
                                id="macromolecularizer-upgrade-speed"
                                class="macro-button macro-button--compact macro-button--upgrade"
                                type="button"
                            >
                                Spend 1 Synthesis Point
                            </button>
                            <p
                                id="macromolecularizer-upgrade-feedback"
                                class="macro-feedback macro-feedback--quiet"
                                role="status"
                                aria-live="polite"
                            ></p>
                        </div>
                    </section>
                </footer>
                </div>
            </div>
        `;

    },

    // --------------------------------------------------
    // Cache stable shell elements
    // --------------------------------------------------
    cacheElements() {

        this.elements = {
            topATP:
                this.rootElement.querySelector(
                    "#macromolecularizer-top-atp"
                ),
            systemStatus:
                this.rootElement.querySelector(
                    "#macromolecularizer-system-status"
                ),
            selectedMotif:
                this.rootElement.querySelector(
                    "#macromolecularizer-selected-motif"
                ),
            proteinRecipeCount:
                this.rootElement.querySelector(
                    "#macromolecularizer-protein-recipe-count"
                ),
            motifCardList:
                this.rootElement.querySelector(
                    "#macromolecularizer-motif-card-list"
                ),
            inventoryCount:
                this.rootElement.querySelector(
                    "#macromolecularizer-inventory-count"
                ),
            inventoryTotal:
                this.rootElement.querySelector(
                    "#macromolecularizer-inventory-total"
                ),
            inventoryEmpty:
                this.rootElement.querySelector(
                    "#macromolecularizer-inventory-empty"
                ),
            inventoryList:
                this.rootElement.querySelector(
                    "#macromolecularizer-inventory-list"
                ),
            knownAminoAcids:
                this.rootElement.querySelector(
                    "#macromolecularizer-known-amino-acids"
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
                ),
            chamber:
                this.rootElement.querySelector(
                    "#macromolecularizer-chamber"
                ),
            chamberMode:
                this.rootElement.querySelector(
                    "#macromolecularizer-chamber-mode"
                ),
            chamberTarget:
                this.rootElement.querySelector(
                    "#macromolecularizer-chamber-target"
                ),
            chamberClassification:
                this.rootElement.querySelector(
                    "#macromolecularizer-chamber-classification"
                ),
            chamberQuantity:
                this.rootElement.querySelector(
                    "#macromolecularizer-chamber-quantity"
                ),
            helixFrame:
                this.rootElement.querySelector(
                    "#macromolecularizer-helix-frame"
                ),
            helixFallback:
                this.rootElement.querySelector(
                    "#macromolecularizer-helix-fallback"
                ),
            genericMotifVisual:
                this.rootElement.querySelector(
                    "#macromolecularizer-generic-motif-visual"
                ),
            genericMotifIcon:
                this.rootElement.querySelector(
                    "#macromolecularizer-generic-motif-icon"
                ),
            genericMotifName:
                this.rootElement.querySelector(
                    "#macromolecularizer-generic-motif-name"
                ),
            genericMotifStatus:
                this.rootElement.querySelector(
                    "#macromolecularizer-generic-motif-status"
                ),
            observationControls:
                this.rootElement.querySelector(
                    "#macromolecularizer-observation-controls"
                ),
            observationToggles:
                Array.from(
                    this.rootElement.querySelectorAll(
                        "[data-observation-layer]"
                    )
                ),
            frameStage:
                this.rootElement.querySelector(
                    "#macromolecularizer-frame-stage"
                ),
            frameReadout:
                this.rootElement.querySelector(
                    "#macromolecularizer-frame-readout"
                ),
            recipeGate:
                this.rootElement.querySelector(
                    "#macromolecularizer-recipe-gate"
                ),
            requirementSummary:
                this.rootElement.querySelector(
                    "#macromolecularizer-requirement-summary"
                ),
            recipeDetails:
                this.rootElement.querySelector(
                    "#macromolecularizer-recipe-details"
                ),
            recipeName:
                this.rootElement.querySelector(
                    "#macromolecularizer-recipe-name"
                ),
            recipeDescription:
                this.rootElement.querySelector(
                    "#macromolecularizer-recipe-description"
                ),
            bondCalculation:
                this.rootElement.querySelector(
                    "#macromolecularizer-bond-calculation"
                ),
            aminoAcidRequirements:
                this.rootElement.querySelector(
                    "#macromolecularizer-amino-acid-requirements"
                ),
            atpRequirement:
                this.rootElement.querySelector(
                    "#macromolecularizer-atp-requirement"
                ),
            synthesisTiming:
                this.rootElement.querySelector(
                    "#macromolecularizer-synthesis-timing"
                ),
            eligibilityFeedback:
                this.rootElement.querySelector(
                    "#macromolecularizer-eligibility-feedback"
                ),
            startSynthesisButton:
                this.rootElement.querySelector(
                    "#macromolecularizer-start-synthesis"
                ),
            observeStructureButton:
                this.rootElement.querySelector(
                    "#macromolecularizer-observe-structure"
                ),
            synthesisProgressPanel:
                this.rootElement.querySelector(
                    "#macromolecularizer-synthesis-progress-panel"
                ),
            synthesisProgressLabel:
                this.rootElement.querySelector(
                    "#macromolecularizer-synthesis-progress-label"
                ),
            synthesisProgress:
                this.rootElement.querySelector(
                    "#macromolecularizer-synthesis-progress"
                ),
            synthesisCountdown:
                this.rootElement.querySelector(
                    "#macromolecularizer-synthesis-countdown"
                ),
            synthesisFeedback:
                this.rootElement.querySelector(
                    "#macromolecularizer-synthesis-feedback"
                ),
            synthesisPoints:
                this.rootElement.querySelector(
                    "#macromolecularizer-synthesis-points"
                ),
            speedLevel:
                this.rootElement.querySelector(
                    "#macromolecularizer-speed-level"
                ),
            speedMultiplier:
                this.rootElement.querySelector(
                    "#macromolecularizer-speed-multiplier"
                ),
            secondsPerBond:
                this.rootElement.querySelector(
                    "#macromolecularizer-seconds-per-bond"
                ),
            upgradeSpeedButton:
                this.rootElement.querySelector(
                    "#macromolecularizer-upgrade-speed"
                ),
            upgradeFeedback:
                this.rootElement.querySelector(
                    "#macromolecularizer-upgrade-feedback"
                )
        };

    },

    // --------------------------------------------------
    // Bind temporary reaction-discovery controls once
    // --------------------------------------------------
    bindEvents() {

        this.elements.helixFrame
            .addEventListener(
                "load",
                () => {
                    this.setHelixImageAvailable(
                        true
                    );
                }
            );

        this.elements.helixFrame
            .addEventListener(
                "error",
                () => {
                    this.setHelixImageAvailable(
                        false
                    );
                }
            );

        if (this.elements.helixFrame.complete) {
            this.setHelixImageAvailable(
                this.elements.helixFrame
                    .naturalWidth > 0
            );
        } else if (
            typeof this.elements
                .helixFrame.decode ===
            "function"
        ) {
            const pendingSource =
                this.elements.helixFrame
                    .src;

            this.elements.helixFrame
                .decode()
                .then(
                    () => {
                        if (
                            this.elements
                                .helixFrame.src ===
                            pendingSource
                        ) {
                            this.setHelixImageAvailable(
                                true
                            );
                        }
                    }
                )
                .catch(
                    () => {
                        if (
                            this.elements
                                .helixFrame.src ===
                            pendingSource
                        ) {
                            this.setHelixImageAvailable(
                                false
                            );
                        }
                    }
                );
        }

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

        this.elements.startSynthesisButton
            .addEventListener(
                "click",
                () => {
                    this.chamberViewMode =
                        "synthesis";

                    const result =
                        MacromolecularizerManager
                            .startSynthesis(
                                MacromolecularizerManager
                                    .getStatus()
                                    .selectedMotifId
                            );

                    this.synthesisFeedbackMessage =
                        result.message;

                    this.render();
                }
            );

        this.elements.motifCardList
            .addEventListener(
                "click",
                event => {
                    const card =
                        event.target.closest(
                            "[data-motif-id]"
                        );

                    if (
                        !card ||
                        card.disabled
                    ) {
                        return;
                    }

                    const result =
                        MacromolecularizerManager
                            .selectMotif(
                                card.dataset
                                    .motifId
                            );

                    if (result.success) {
                        this.chamberViewMode =
                            "synthesis";
                        this.synthesisFeedbackMessage =
                            "";
                    } else {
                        this.synthesisFeedbackMessage =
                            result.message;
                    }

                    this.render();
                }
            );

        this.elements.observeStructureButton
            .addEventListener(
                "click",
                () => {
                    this.chamberViewMode =
                        this.chamberViewMode ===
                        "observation"
                            ? "synthesis"
                            : "observation";

                    this.render();
                }
            );

        this.elements.observationToggles
            .forEach(toggle => {
                toggle.addEventListener(
                    "change",
                    () => {
                        this.updateObservationLayer(
                            toggle.dataset
                                .observationLayer,
                            toggle.checked
                        );
                    }
                );
            });

        this.elements.upgradeSpeedButton
            .addEventListener(
                "click",
                () => {
                    const result =
                        MacromolecularizerManager
                            .spendSynthesisPointOnDehydrationSpeed();

                    this.upgradeFeedbackMessage =
                        result.message;

                    this.render();
                }
            );

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

        const selectedMotif =
            status.selectedMotif;

        this.elements.topATP
            .textContent =
                String(
                    selectedMotif
                        ?.atp.current ??
                    0
                );

        let systemState =
            selectedMotif
                ?.lifecycleStatus ||
            "blocked";

        if (
            this.chamberViewMode ===
                "observation" &&
            selectedMotif
                ?.inventory.quantity > 0
        ) {
            systemState =
                "observing";
        }

        if (status.activeSynthesis) {
            systemState =
                "synthesizing";
        }

        this.rootElement.dataset.systemStatus =
            systemState;

        if (status.activeSynthesis) {
            this.elements.systemStatus
                .textContent =
                    `Assembly active · ${Math.floor(status.activeSynthesis.progress * 100)}%`;
        } else if (
            systemState ===
            "observing"
        ) {
            this.elements.systemStatus
                .textContent =
                    "Structure observation";
        } else if (
            systemState ===
            "ready"
        ) {
            this.elements.systemStatus
                .textContent =
                    "System ready";
        } else {
            this.elements.systemStatus
                .textContent =
                    "Preflight incomplete";
        }

        this.elements.selectedMotif
            .textContent =
                `Selected: ${selectedMotif?.definition.name ?? status.selectedMotifId}`;

        this.renderMotifCards(
            status.motifCatalog,
            status.selectedMotifId,
            status.activeSynthesis
        );

        this.elements.inventoryCount
            .textContent =
                String(
                    status.motifInventoryStatus
                        .storedTypes
                );

        this.elements.inventoryTotal
            .textContent =
                String(
                    status.motifInventoryStatus
                        .totalQuantity
                );

        this.elements.activeSynthesis
            .textContent =
                status.activeSynthesis
                    ? `${status.activeSynthesis.motifId} — ${this.formatDuration(status.activeSynthesis.remainingMs)} remaining`
                    :
                "None";

        this.renderMotifRecipe(
            selectedMotif,
            status.activeSynthesis
        );

        this.renderChamber(
            selectedMotif,
            status.activeSynthesis
        );

        this.renderKnownAminoAcids(
            selectedMotif
        );

        this.renderSpeedUpgrade(
            status.dehydrationSpeed
        );

        this.renderInventory(
            status.motifInventoryStatus
        );

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

    // --------------------------------------------------
    // Render selectable motif recipes from manager status
    // --------------------------------------------------
    renderMotifCards(
        motifs,
        selectedMotifId,
        activeSynthesis
    ) {

        const recipeCount =
            motifs.length;

        this.elements.proteinRecipeCount
            .textContent =
                `${recipeCount} ${recipeCount === 1
                    ? "recipe"
                    : "recipes"}`;

        this.elements.motifCardList
            .replaceChildren(
                ...motifs.map(motif => {
                    const definition =
                        motif.definition;

                    const card =
                        document.createElement(
                            "button"
                        );

                    card.type = "button";
                    card.className =
                        "macro-recipe-card macro-recipe-card--selectable";
                    card.dataset.motifId =
                        definition.id;
                    card.dataset.status =
                        motif.lifecycleStatus;
                    card.setAttribute(
                        "aria-pressed",
                        String(
                            definition.id ===
                            selectedMotifId
                        )
                    );
                    card.disabled =
                        Boolean(
                            activeSynthesis &&
                            activeSynthesis.motifId !==
                                definition.id
                        );
                    card.setAttribute(
                        "aria-label",
                        `${definition.name}, ${motif.inventory.quantity} stored, ${this.formatLifecycleStatus(motif.lifecycleStatus, motif.inventory.quantity)}`
                    );

                    const topline =
                        document.createElement(
                            "span"
                        );
                    topline.className =
                        "macro-recipe-card-topline";

                    const icon =
                        document.createElement(
                            "span"
                        );
                    icon.className =
                        "macro-recipe-icon";
                    icon.setAttribute(
                        "aria-hidden",
                        "true"
                    );
                    icon.textContent =
                        this.getMotifIcon(
                            definition.id
                        );

                    const code =
                        document.createElement(
                            "span"
                        );
                    code.className =
                        "macro-recipe-code";
                    code.textContent =
                        definition.id;

                    topline.append(
                        icon,
                        code
                    );

                    const name =
                        document.createElement(
                            "span"
                        );
                    name.className =
                        "macro-recipe-title";
                    name.textContent =
                        definition.name;

                    const summary =
                        document.createElement(
                            "span"
                        );
                    summary.className =
                        "macro-recipe-specs";
                    summary.textContent =
                        `${definition.aminoAcidCount} amino acids · ${definition.atpCost} ATP · ${this.formatDuration(motif.timing.durationMs)}`;

                    const footer =
                        document.createElement(
                            "span"
                        );
                    footer.className =
                        "macro-recipe-card-footer";

                    const quantity =
                        document.createElement(
                            "span"
                        );
                    quantity.textContent =
                        `${motif.inventory.quantity} stored`;

                    const lifecycle =
                        document.createElement(
                            "span"
                        );
                    lifecycle.textContent =
                        this.formatLifecycleStatus(
                            motif.lifecycleStatus,
                            motif.inventory.quantity
                        );

                    footer.append(
                        quantity,
                        lifecycle
                    );
                    card.append(
                        topline,
                        name,
                        summary,
                        footer
                    );

                    return card;
                })
            );

        return recipeCount;

    },

    // --------------------------------------------------
    // Render selected-motif composition and eligibility
    // --------------------------------------------------
    renderMotifRecipe(
        motif,
        activeSynthesis
    ) {

        if (!motif) {
            this.elements.recipeDetails.hidden =
                true;
            this.elements.recipeGate
                .textContent =
                    "The selected motif recipe is unavailable.";

            return false;
        }

        const definition =
            motif.definition;

        this.renderRequirementSummary(
            motif
        );

        const dehydrationKnown =
            Boolean(
                motif.reactionDiscoveries
                    .dehydration
            );

        this.elements.recipeGate.hidden =
            dehydrationKnown;
        this.elements.recipeDetails.hidden =
            !dehydrationKnown;

        if (!dehydrationKnown) {
            this.elements.recipeGate
                .textContent =
                    "Discover dehydration before reviewing motif synthesis requirements.";

            return true;
        }

        this.elements.recipeName
            .textContent =
                definition.name;
        this.elements.recipeDescription
            .textContent =
                definition.description;
        this.elements.bondCalculation
            .textContent =
                `${definition.aminoAcidCount} amino acids form ${definition.peptideBondCount} peptide bonds, requiring ${definition.atpCost} ATP.`;

        this.elements
            .aminoAcidRequirements
            .replaceChildren(
                ...motif.aminoAcids.map(
                    requirement => {

                        const item =
                            document.createElement(
                                "li"
                            );

                        item.dataset.status =
                            requirement.synthesized
                                ? "complete"
                                : "missing";

                        item.textContent =
                            `${requirement.quantity} × ${requirement.name} (${requirement.id}) — ${requirement.synthesized
                                ? `Synthesized (${requirement.synthesisCount})`
                                : "Not yet synthesized"}`;

                        return item;

                    }
                )
            );

        this.elements.atpRequirement
            .textContent =
                `${motif.atp.current} ATP available · ${motif.atp.cost} ATP required`;

        this.elements.synthesisTiming
            .textContent =
                `${this.formatDuration(motif.timing.durationMs)} at ${motif.timing.speedMultiplier}× speed (${motif.timing.baseSecondsPerPeptideBond} seconds per peptide bond at base speed).`;

        const selectedJob =
            activeSynthesis
                ?.motifId ===
            definition.id
                ? activeSynthesis
                : null;

        this.elements.startSynthesisButton
            .disabled =
                !motif.canStart;

        this.elements.startSynthesisButton
            .textContent = selectedJob
                ? `${definition.id} Synthesis in Progress`
                : motif.inventory.quantity > 0
                    ? `Synthesize Another ${definition.id}`
                    : `Begin ${definition.id} Synthesis`;

        this.elements.synthesisProgressLabel
            .textContent =
                `${definition.id} synthesis progress`;

        this.elements.synthesisProgressPanel
            .hidden =
                !selectedJob;

        if (selectedJob) {
            this.elements.synthesisProgress
                .value =
                    selectedJob.progress;

            this.elements.synthesisCountdown
                .textContent =
                    `${this.formatDuration(selectedJob.remainingMs)} remaining · ${Math.floor(selectedJob.progress * 100)}% complete · started at ${selectedJob.speedMultiplier}× speed`;
        } else {
            this.elements.synthesisProgress
                .value = 0;
            this.elements.synthesisCountdown
                .textContent = "";
        }

        this.elements.synthesisFeedback
            .textContent =
                this.synthesisFeedbackMessage ||
                (
                    motif.inventory.quantity > 0
                        ? `${motif.inventory.quantity} completed ${definition.id} ${motif.inventory.quantity === 1
                            ? "is"
                            : "are"} stored in the motif inventory.`
                        : `No ${definition.id} motifs have been completed yet.`
                );

        if (selectedJob) {
            this.elements
                .eligibilityFeedback
                .textContent =
                    `${definition.id} synthesis is running. Amino-acid prerequisites remain available and are not consumed.`;
        } else if (
            motif.missingAminoAcidIds
                .length > 0
        ) {
            const missingNames =
                motif.aminoAcids
                    .filter(
                        requirement =>
                            !requirement
                                .synthesized
                    )
                    .map(
                        requirement =>
                            requirement.name
                    );

            this.elements
                .eligibilityFeedback
                .textContent =
                    `Synthesize each of these amino-acid types once in Molecule Lab: ${missingNames.join(", ")}. Recipe quantities describe the motif and are not consumed.`;
        } else if (!motif.atp.canAfford) {
            this.elements
                .eligibilityFeedback
                .textContent =
                    `Generate ${motif.requirements.atp.missingAmount} more ATP in the Pond. ${motif.atp.cost} ATP is required and ${motif.atp.current} ATP is available.`;
        } else {
            this.elements
                .eligibilityFeedback
                .textContent =
                    motif.inventory.quantity > 0
                        ? `All requirements are met. Another ${definition.id} can be synthesized without consuming amino-acid prerequisites.`
                        : `All ${definition.id} requirements are met. Synthesis is ready.`;
        }

        return true;

    },

    // --------------------------------------------------
    // Render the visual chamber without changing job state
    // --------------------------------------------------
    renderChamber(
        motif,
        activeSynthesis
    ) {

        if (!motif) {
            this.chamberViewMode =
                "synthesis";
            this.elements.chamber.dataset.mode =
                "locked";
            this.elements.chamberMode.textContent =
                "SYNTHESIS LOCKED";
            this.elements.chamberTarget.textContent =
                "No target selected";
            this.elements.chamberClassification.textContent =
                "No motif recipe available";
            this.elements.chamberQuantity.textContent =
                "0";
            this.renderHelixFrame(
                null,
                null
            );
            this.elements.observeStructureButton.disabled =
                true;
            this.elements.observeStructureButton
                .setAttribute(
                    "aria-pressed",
                    "false"
                );
            this.elements.observationControls.hidden =
                true;

            return false;
        }

        const selectedJob =
            activeSynthesis
                ?.motifId ===
            motif.definition.id
                ? activeSynthesis
                : null;

        if (selectedJob) {
            this.chamberViewMode =
                "synthesis";
        } else if (
            this.chamberViewMode ===
                "observation" &&
            (
                motif.inventory.quantity < 1 ||
                !MotifVisualCatalog
                    .supportsObservation(
                        motif.definition.id
                    )
            )
        ) {
            this.chamberViewMode =
                "synthesis";
        }

        let mode =
            motif.canStart
                ? "ready"
                : "locked";

        let modeLabel =
            motif.canStart
                ? "READY TO SYNTHESIZE"
                : "SYNTHESIS LOCKED";

        if (selectedJob) {
            mode = "synthesizing";
            modeLabel = "SYNTHESIZING";
        } else if (
            this.chamberViewMode ===
            "observation"
        ) {
            mode = "observing";
            modeLabel = "OBSERVING STRUCTURE";
        }

        this.elements.chamber.dataset.mode =
            mode;
        this.elements.chamberMode.textContent =
            modeLabel;
        this.elements.chamberTarget.textContent =
            motif.definition.name;

        const motifVisual =
            MotifVisualCatalog.get(
                motif.definition.id
            );

        this.elements.chamberClassification.textContent =
            `${motif.definition.id} // ${motifVisual?.classification ?? "Protein structural motif"}`;
        this.elements.chamberQuantity.textContent =
            String(
                motif.inventory.quantity
            );

        this.renderHelixFrame(
            motif,
            selectedJob
        );

        const observationAvailable =
            !selectedJob &&
            motif.inventory.quantity > 0 &&
            MotifVisualCatalog
                .supportsObservation(
                    motif.definition.id
                );

        this.elements.observeStructureButton.disabled =
            !observationAvailable;
        this.elements.observeStructureButton
            .setAttribute(
                "aria-pressed",
                String(
                    mode === "observing"
                )
            );
        this.elements.observeStructureButton
            .textContent =
                mode === "observing"
                    ? "Return to Synthesis"
                    : motif.inventory.quantity > 0 &&
                        !observationAvailable
                        ? "Observation Model Pending"
                    : "Observe Structure";

        this.elements.observationControls.hidden =
            mode !== "observing";

        if (mode === "observing") {
            this.preloadObservationImages(
                motif.definition.id
            );
            this.syncObservationControls();
        }

        this.elements.startSynthesisButton.dataset.state =
            mode;

        return true;

    },

    // --------------------------------------------------
    // Map job progress across the selected motif frame set
    // --------------------------------------------------
    renderHelixFrame(
        motif,
        selectedJob
    ) {

        const motifId =
            motif?.definition.id ??
            null;

        this.activeVisualMotifId =
            motifId;

        const visual =
            MotifVisualCatalog.get(
                motifId
            );

        const frameSet =
            visual?.synthesisFrames ??
            (
                motifId
                    ? null
                    : MotifVisualCatalog
                        .get("H_helix")
                        .synthesisFrames
            );

        if (
            motifId &&
            !frameSet
        ) {
            return this.renderGenericMotifVisual(
                motif,
                selectedJob
            );
        }

        this.elements.genericMotifVisual.hidden =
            true;
        this.setHelixImageAvailable(
            Boolean(
                this.elements.helixFrame
                    .complete &&
                this.elements.helixFrame
                    .naturalWidth > 0
            )
        );

        const observingStructure =
            this.chamberViewMode ===
                "observation" &&
            !selectedJob &&
            motif?.inventory.quantity > 0;

        if (observingStructure) {
            this.elements.frameReadout.hidden =
                true;
            this.elements.frameStage.textContent =
                "";

            return this.renderObservationImage(
                motifId
            );
        }

        if (
            motifId &&
            !selectedJob &&
            visual?.previewImage
        ) {
            this.renderMotifPreview(
                motifId,
                visual.previewImage
            );
            this.elements.frameReadout.hidden =
                true;
            this.elements.frameStage.textContent =
                "";

            return "preview";
        }

        const frameIndex =
            this.getHelixFrameIndex(
                motif,
                selectedJob,
                frameSet
            );

        const frameIndexText =
            String(frameIndex);

        this.elements.chamber.dataset.frameIndex =
            frameIndexText;

        if (
            this.elements.helixFrame
                .dataset.frameIndex !==
                frameIndexText ||
            this.elements.helixFrame
                .dataset.visualMode !==
                "synthesis" ||
            this.elements.helixFrame
                .dataset.visualMotifId !==
                motifId
        ) {
            if (
                this.elements.helixFrame
                    .dataset.visualMotifId !==
                    motifId ||
                this.elements.helixFrame
                    .dataset.visualMode !==
                    "synthesis"
            ) {
                this.elements.helixFrame.hidden =
                    true;
                this.elements.helixFallback.hidden =
                    true;
            }

            delete this.elements.helixFrame
                .dataset.observationState;
            this.elements.helixFrame
                .dataset.frameIndex =
                    frameIndexText;
            this.elements.helixFrame
                .dataset.visualMode =
                    "synthesis";
            this.elements.helixFrame
                .dataset.visualMotifId =
                    motifId ??
                    "H_helix";
            this.elements.helixFrame.src =
                this.getHelixFrameSource(
                    frameIndex,
                    frameSet
                );

            this.preloadNextHelixFrame(
                frameIndex,
                frameSet
            );
        }

        this.elements.frameReadout.hidden =
            !selectedJob;

        const visualStage =
            selectedJob
                ? frameSet.count -
                    frameIndex
                : null;

        this.elements.frameStage
            .textContent =
                visualStage === null
                    ? ""
                    : `${visualStage} / ${frameSet.count}`;

        return frameIndex;

    },

    renderMotifPreview(
        motifId,
        previewImage
    ) {

        if (
            this.elements.helixFrame
                .dataset.visualMode !==
                "preview" ||
            this.elements.helixFrame
                .dataset.visualMotifId !==
                motifId
        ) {
            if (
                this.elements.helixFrame
                    .dataset.visualMotifId !==
                    motifId ||
                this.elements.helixFrame
                    .dataset.visualMode !==
                    "preview"
            ) {
                this.elements.helixFrame.hidden =
                    true;
                this.elements.helixFallback.hidden =
                    true;
            }

            delete this.elements.helixFrame
                .dataset.frameIndex;
            delete this.elements.helixFrame
                .dataset.observationState;
            this.elements.helixFrame
                .dataset.visualMode =
                    "preview";
            this.elements.helixFrame
                .dataset.visualMotifId =
                    motifId;
            this.elements.helixFrame.src =
                previewImage;
        }

        return previewImage;

    },

    // --------------------------------------------------
    // Neutral progress display until motif art is supplied
    // --------------------------------------------------
    renderGenericMotifVisual(
        motif,
        selectedJob
    ) {

        const definition =
            motif.definition;

        const visual =
            MotifVisualCatalog.get(
                definition.id
            );

        this.elements.helixFrame.hidden =
            true;
        this.elements.helixFallback.hidden =
            true;
        this.elements.frameReadout.hidden =
            true;
        this.elements.frameStage.textContent =
            "";
        this.elements.genericMotifVisual.hidden =
            false;
        this.elements.genericMotifVisual
            .dataset.status =
                selectedJob
                    ? "synthesizing"
                    : motif.inventory.quantity > 0
                        ? "stored"
                        : "awaiting";
        this.elements.genericMotifIcon
            .textContent =
                visual?.icon ??
                "◆";
        this.elements.genericMotifName
            .textContent =
                definition.name;
        this.elements.genericMotifStatus
            .textContent =
                selectedJob
                    ? `${Math.floor(selectedJob.progress * 100)}% assembled`
                    : motif.inventory.quantity > 0
                        ? `${motif.inventory.quantity} stored`
                        : "Awaiting synthesis";

        const progress =
            selectedJob
                ? selectedJob.progress
                : motif.inventory.quantity > 0
                    ? 1
                    : 0;

        this.elements.genericMotifVisual
            .style.setProperty(
                "--macro-motif-progress",
                `${Math.max(0, Math.min(1, progress)) * 360}deg`
            );

        delete this.elements.chamber.dataset
            .frameIndex;
        delete this.elements.chamber.dataset
            .observationState;

        return definition.id;

    },

    // --------------------------------------------------
    // Select one of six supplied observation-layer images
    // --------------------------------------------------
    renderObservationImage(motifId) {

        const observationState =
            this.getObservationStateKey();

        const visual =
            MotifVisualCatalog.get(
                motifId
            );

        const filename =
            visual?.observationImages?.[
                observationState
            ];

        if (
            !filename ||
            !visual.observationPath
        ) {
            return false;
        }

        this.elements.chamber.dataset
            .observationState =
                observationState;

        if (
            this.elements.helixFrame
                .dataset.observationState !==
                observationState ||
            this.elements.helixFrame
                .dataset.visualMode !==
                "observation" ||
            this.elements.helixFrame
                .dataset.visualMotifId !==
                motifId
        ) {
            if (
                this.elements.helixFrame
                    .dataset.visualMotifId !==
                    motifId ||
                this.elements.helixFrame
                    .dataset.visualMode !==
                    "observation"
            ) {
                this.elements.helixFrame.hidden =
                    true;
                this.elements.helixFallback.hidden =
                    true;
            }

            delete this.elements.helixFrame
                .dataset.frameIndex;
            this.elements.helixFrame
                .dataset.observationState =
                    observationState;
            this.elements.helixFrame
                .dataset.visualMode =
                    "observation";
            this.elements.helixFrame
                .dataset.visualMotifId =
                    motifId;
            this.elements.helixFrame.src =
                `${visual.observationPath}${filename}`;
        }

        return observationState;

    },

    getObservationStateKey() {

        return [
            this.observationLayers.ribbon,
            this.observationLayers.hbonds,
            this.observationLayers.atoms
        ]
            .map(enabled => enabled ? "1" : "0")
            .join("");

    },

    updateObservationLayer(
        layerId,
        enabled
    ) {

        if (
            !Object.prototype.hasOwnProperty.call(
                this.observationLayers,
                layerId
            )
        ) {
            return false;
        }

        this.observationLayers[layerId] =
            Boolean(enabled);

        if (
            !this.observationLayers.ribbon &&
            !this.observationLayers.atoms
        ) {
            const companionLayer =
                layerId === "ribbon"
                    ? "atoms"
                    : "ribbon";

            this.observationLayers[
                companionLayer
            ] = true;
        }

        this.syncObservationControls();
        this.render();

        return true;

    },

    syncObservationControls() {

        const observationState =
            this.getObservationStateKey();

        this.elements.observationControls
            .dataset.observationState =
                observationState;

        this.elements.observationToggles
            .forEach(toggle => {
                toggle.checked =
                    Boolean(
                        this.observationLayers[
                            toggle.dataset
                                .observationLayer
                        ]
                    );
            });

        return observationState;

    },

    preloadObservationImages(motifId) {

        const visual =
            MotifVisualCatalog.get(
                motifId
            );

        if (
            !visual?.observationImages ||
            !visual.observationPath ||
            this.observationImagePreloads[
                motifId
            ] ||
            typeof Image !== "function"
        ) {
            return false;
        }

        this.observationImagePreloads[
            motifId
        ] =
            Object.values(
                visual.observationImages
            ).map(filename => {
                const image = new Image();

                image.decoding = "async";
                image.src =
                    `${visual.observationPath}${filename}`;

                return image;
            });

        return true;

    },

    getHelixFrameIndex(
        motif,
        selectedJob,
        frameSet
    ) {

        if (!selectedJob) {
            return motif
                ?.inventory.quantity > 0
                ? frameSet.completeIndex
                : frameSet.startIndex;
        }

        const progress =
            Number.isFinite(
                selectedJob.progress
            )
                ? Math.min(
                    1,
                    Math.max(
                        0,
                        selectedJob.progress
                    )
                )
                : 0;

        const elapsedFrameIntervals =
            Math.min(
                frameSet.count - 1,
                Math.floor(
                    progress *
                    frameSet.count
                )
            );

        return Math.max(
            frameSet.completeIndex,
            frameSet.startIndex -
                elapsedFrameIntervals
        );

    },

    getHelixFrameSource(
        frameIndex,
        frameSet
    ) {

        return `${frameSet.pathPrefix}${frameIndex}.png`;

    },

    preloadNextHelixFrame(
        frameIndex,
        frameSet
    ) {

        const nextFrameIndex =
            frameIndex - 1;

        if (
            nextFrameIndex <
                frameSet.completeIndex ||
            typeof Image !== "function"
        ) {
            this.helixFramePreload =
                null;

            return false;
        }

        this.helixFramePreload =
            new Image();
        this.helixFramePreload.decoding =
            "async";
        this.helixFramePreload.src =
            this.getHelixFrameSource(
                nextFrameIndex,
                frameSet
            );

        return true;

    },

    setHelixImageAvailable(available) {

        const activeVisual =
            MotifVisualCatalog.get(
                this.activeVisualMotifId
            );

        if (
            this.activeVisualMotifId &&
            !activeVisual?.synthesisFrames &&
            !activeVisual?.previewImage
        ) {
            return false;
        }

        if (
            !available &&
            this.activeVisualMotifId &&
            this.activeVisualMotifId !==
                "H_helix"
        ) {
            const status =
                MacromolecularizerManager
                    .getStatus();

            if (
                status.selectedMotif?.id ===
                this.activeVisualMotifId
            ) {
                this.renderGenericMotifVisual(
                    status.selectedMotif,
                    status.activeSynthesis
                );
            }

            return false;
        }

        this.elements.helixFrame.hidden =
            !available;
        this.elements.helixFallback.hidden =
            available;
        this.elements.genericMotifVisual.hidden =
            true;

        return available;

    },

    // --------------------------------------------------
    // Show prerequisite knowledge separately from inventory
    // --------------------------------------------------
    renderKnownAminoAcids(motif) {

        if (!motif) {
            this.elements.knownAminoAcids
                .replaceChildren();

            return false;
        }

        this.elements.knownAminoAcids
            .replaceChildren(
                ...motif.aminoAcids.map(
                    requirement => {
                        const item =
                            document.createElement(
                                "li"
                            );

                        item.dataset.status =
                            requirement.synthesized
                                ? "complete"
                                : "missing";

                        item.textContent =
                            `${requirement.id} · ${requirement.name} — ${requirement.synthesized
                                ? "Known"
                                : "Not synthesized"} · ${requirement.quantity} recipe ${requirement.quantity === 1
                                ? "position"
                                : "positions"}`;

                        return item;
                    }
                )
            );

        return true;

    },

    // --------------------------------------------------
    // Render one concise checklist for the next job
    // --------------------------------------------------
    renderRequirementSummary(motif) {

        const reactionNames =
            Object.keys(
                motif.reactionDiscoveries
            ).map(
                reactionId =>
                    this.formatReactionName(
                        reactionId
                    )
            );

        const missingAminoAcidNames =
            motif.aminoAcids
                .filter(
                    requirement =>
                        !requirement
                            .synthesized
                )
                .map(
                    requirement =>
                        requirement.name
                );

        const requirementRows = [
            {
                complete:
                    motif.requirements
                        .reactionDiscovery
                        .complete,
                text:
                    `${reactionNames.join(", ")} discovery — ${motif.requirements.reactionDiscovery.complete
                        ? "Complete"
                        : "Missing"}`
            },
            {
                complete:
                    motif.requirements
                        .aminoAcids
                        .complete,
                text:
                    `Amino-acid synthesis knowledge — ${motif.requirements.aminoAcids.synthesizedTypes} of ${motif.requirements.aminoAcids.requiredTypes} types complete${missingAminoAcidNames.length > 0
                        ? `; missing ${missingAminoAcidNames.join(", ")}`
                        : ""}`
            },
            {
                complete:
                    motif.requirements
                        .atp
                        .complete,
                text:
                    `ATP — ${motif.atp.current} available / ${motif.atp.cost} required${motif.requirements.atp.missingAmount > 0
                        ? `; generate ${motif.requirements.atp.missingAmount} more`
                        : ""}`
            }
        ];

        this.elements.requirementSummary
            .replaceChildren(
                ...requirementRows.map(
                    requirement => {
                        const item =
                            document.createElement(
                                "li"
                            );

                        item.dataset.status =
                            requirement.complete
                                ? "complete"
                                : "missing";

                        item.textContent =
                            requirement.text;

                        return item;
                    }
                )
            );

        return true;

    },

    // --------------------------------------------------
    // Render persisted quantities for enabled motifs
    // --------------------------------------------------
    renderInventory(inventoryStatus) {

        const storedMotifs =
            inventoryStatus.items
                .filter(
                    motif =>
                        motif.quantity > 0
                );

        this.elements.inventoryEmpty.hidden =
            storedMotifs.length > 0;

        this.elements.inventoryList
            .replaceChildren(
                ...storedMotifs.map(
                    motif => {
                        const item =
                            document.createElement(
                                "li"
                            );

                        item.dataset.status =
                            motif.lifecycleStatus;

                        item.textContent =
                            `${motif.name} (${motif.id}) — ${motif.quantity} stored · ${this.formatLifecycleStatus(motif.lifecycleStatus, motif.quantity)}`;

                        return item;
                    }
                )
            );

        return true;

    },

    formatLifecycleStatus(
        lifecycleStatus,
        quantity
    ) {

        if (
            lifecycleStatus ===
            "synthesizing"
        ) {
            return quantity > 0
                ? "Synthesizing another motif"
                : "Synthesizing first motif";
        }

        if (
            lifecycleStatus === "ready"
        ) {
            return quantity > 0
                ? "Ready to synthesize another"
                : "Ready to synthesize";
        }

        return quantity > 0
            ? "Requirements incomplete for another synthesis"
            : "Requirements incomplete";

    },

    // --------------------------------------------------
    // Render Synthesis Points and speed-upgrade status
    // --------------------------------------------------
    renderSpeedUpgrade(speed) {

        this.elements.synthesisPoints
            .textContent =
                String(
                    speed.points.current
                );

        this.elements.speedLevel
            .textContent =
                String(speed.level);

        this.elements.speedMultiplier
            .textContent =
                `${speed.speedMultiplier}×`;

        this.elements.secondsPerBond
            .textContent =
                this.formatSeconds(
                    speed.effectiveSecondsPerPeptideBond
                );

        this.elements.upgradeSpeedButton
            .disabled =
                speed.points.current <
                speed.synthesisPointCost;

        this.elements.upgradeFeedback
            .textContent =
                this.upgradeFeedbackMessage ||
                "Speed upgrades apply only to newly started jobs.";

        return true;

    },

    formatDuration(durationMs) {

        const totalSeconds =
            Math.max(
                0,
                Math.ceil(
                    durationMs /
                    1000
                )
            );

        const minutes =
            Math.floor(
                totalSeconds /
                60
            );

        const seconds =
            totalSeconds % 60;

        if (minutes === 0) {
            return `${seconds}s`;
        }

        return `${minutes}m ${seconds}s`;

    },

    formatSeconds(seconds) {

        return Number.isInteger(seconds)
            ? String(seconds)
            : seconds.toFixed(2)
                .replace(/0+$/, "")
                .replace(/\.$/, "");

    },

    formatReactionName(reactionId) {

        return reactionId
            .charAt(0)
            .toUpperCase() +
            reactionId.slice(1);

    },

    getMotifIcon(motifId) {

        return MotifVisualCatalog
            .get(motifId)
            ?.icon ??
            "◆";

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
            detail => {
                if (
                    detail?.reason ===
                    "synthesis-completed"
                ) {
                    this.chamberViewMode =
                        MotifVisualCatalog
                            .supportsObservation(
                                detail.motifId
                            )
                            ? "observation"
                            : "synthesis";

                    const capacityFeedback =
                        Number.isFinite(
                            detail.atpCapacity
                                ?.maximum
                        )
                            ? ` ATP capacity increased to ${detail.atpCapacity.maximum}.`
                            : "";

                    this.synthesisFeedbackMessage =
                        detail.saved
                            ? `${detail.motifId} synthesis completed and saved.${capacityFeedback}`
                            : `${detail.motifId} synthesis completed, but the browser save failed.`;
                }

                this.render();
            }
        );

        this.subscribed = true;

    }

};

export default MacromolecularizerUI;
