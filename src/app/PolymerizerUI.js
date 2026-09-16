// --------------------------------------------------
// PolymerizerUI.js
// Console-development shell and UI orchestration.
// --------------------------------------------------

import GameStateObserver from "./GameStateObserver.js";
import PolymerizerManager from "./PolymerizerManager.js";
import PolymerizerProductView
    from "./PolymerizerProductView.js";

const PolymerizerUI = {

    initialized: false,
    active: false,
    rootElement: null,
    elements: {},

    initialize() {

        if (this.initialized) {
            this.render();
            return true;
        }

        this.rootElement =
            this.ensureRootElement();

        if (!this.rootElement) {
            console.warn(
                "PolymerizerUI: unable to mount the zone root"
            );
            return false;
        }

        this.buildStaticUI();
        this.cacheElements();
        this.bindEvents();

        GameStateObserver.on(
            "polymerizer-state-changed",
            () => {
                if (this.active) {
                    this.render();
                }
            }
        );

        this.initialized = true;
        this.render();
        return true;

    },

    ensureRootElement() {

        let root =
            document.getElementById(
                "polymerizer-zone"
            );

        if (root) return root;

        const host =
            document.getElementById("app-main") ||
            document.getElementById("app") ||
            document.body;

        if (!host) return null;

        root = document.createElement("section");
        root.id = "polymerizer-zone";
        root.className = "zone hidden";
        root.setAttribute(
            "aria-label",
            "Polymerizer"
        );
        host.appendChild(root);

        return root;

    },

    buildStaticUI() {

        this.rootElement.innerHTML = `
            <div class="poly-lab-shell">
                <header class="poly-topbar">
                    <div>
                        <p class="poly-kicker">Functional Structure Assembly</p>
                        <h1>Polymerizer</h1>
                        <p class="poly-subtitle">Development preview · Student navigation remains locked</p>
                    </div>
                    <div class="poly-status-chip" aria-label="Development status">
                        <span aria-hidden="true"></span>
                        Milestone 3 Assembly Lifecycle
                    </div>
                </header>

                <div class="poly-workspace">
                    <aside class="poly-panel poly-selection-panel" aria-labelledby="poly-products-heading">
                        <p class="poly-panel-kicker">Product Library</p>
                        <h2 id="poly-products-heading">Structures</h2>

                        <nav class="poly-category-list" aria-label="Polymerizer categories">
                            <button type="button" class="poly-category poly-category--active" disabled>
                                <strong>Proteins</strong><span>1 preview</span>
                            </button>
                            <button type="button" class="poly-category" disabled>
                                <strong>Polysaccharides</strong><span>Coming Soon</span>
                            </button>
                            <button type="button" class="poly-category" disabled>
                                <strong>Nucleic Acids</strong><span>Coming Soon</span>
                            </button>
                        </nav>

                        <div id="polymerizer-product-list" class="poly-product-list"></div>
                    </aside>

                    <main class="poly-panel poly-chamber-panel" aria-labelledby="polymerizer-product-name">
                        <div class="poly-chamber-heading">
                            <div>
                                <p class="poly-panel-kicker">Assembly Chamber</p>
                                <h2 id="polymerizer-product-name">Aquaporin</h2>
                                <p id="polymerizer-product-class"></p>
                            </div>
                            <span id="polymerizer-chamber-mode" class="poly-chamber-lock">Development</span>
                        </div>

                        <div class="poly-chamber-viewport">
                            <div class="poly-orbit poly-orbit--outer" aria-hidden="true"></div>
                            <div class="poly-orbit poly-orbit--inner" aria-hidden="true"></div>
                            <img id="polymerizer-product-image" alt="">
                        </div>

                        <div id="polymerizer-progress-panel" class="poly-progress-panel" hidden>
                            <label for="polymerizer-progress">Assembly progress</label>
                            <progress id="polymerizer-progress" max="1" value="0"></progress>
                            <strong id="polymerizer-countdown">15 seconds remaining</strong>
                        </div>

                        <p id="polymerizer-product-description" class="poly-description"></p>
                        <p id="polymerizer-chamber-status" class="poly-chamber-status" role="status"></p>
                        <button id="polymerizer-assemble-button" class="poly-assemble-button" type="button" disabled>
                            Assemble Aquaporin · 15 ATP
                        </button>
                    </main>

                    <aside class="poly-side-stack">
                        <section class="poly-panel poly-preflight-panel" aria-labelledby="polymerizer-preflight-heading">
                            <p class="poly-panel-kicker">Preflight</p>
                            <h2 id="polymerizer-preflight-heading">Structural Requirements</h2>
                            <p class="poly-guidance">
                                Motif levels come from Macromolecularizer. Meeting a level unlocks assembly; motifs are never consumed.
                            </p>
                            <ul id="polymerizer-requirements" class="poly-requirement-list"></ul>
                        </section>

                        <section class="poly-panel poly-output-panel" aria-labelledby="polymerizer-output-heading">
                            <div class="poly-output-heading">
                                <div>
                                    <p class="poly-panel-kicker">Output Tray</p>
                                    <h2 id="polymerizer-output-heading">Completed Products</h2>
                                </div>
                                <strong id="polymerizer-output-quantity">0</strong>
                            </div>
                            <p id="polymerizer-output-message"></p>
                        </section>
                    </aside>
                </div>
            </div>
        `;

    },

    cacheElements() {

        const find = id =>
            this.rootElement.querySelector(
                `#${id}`
            );

        this.elements = {
            productList:
                find("polymerizer-product-list"),
            productName:
                find("polymerizer-product-name"),
            productClass:
                find("polymerizer-product-class"),
            productImage:
                find("polymerizer-product-image"),
            chamberMode:
                find("polymerizer-chamber-mode"),
            progressPanel:
                find("polymerizer-progress-panel"),
            progress:
                find("polymerizer-progress"),
            countdown:
                find("polymerizer-countdown"),
            productDescription:
                find("polymerizer-product-description"),
            chamberStatus:
                find("polymerizer-chamber-status"),
            assembleButton:
                find("polymerizer-assemble-button"),
            requirements:
                find("polymerizer-requirements"),
            outputQuantity:
                find("polymerizer-output-quantity"),
            outputMessage:
                find("polymerizer-output-message")
        };

    },

    bindEvents() {

        this.elements.assembleButton
            ?.addEventListener(
                "click",
                () => {
                    PolymerizerManager
                        .startAssembly(
                            "Aquaporin"
                        );
                    this.render();
                }
            );

    },

    activate() {

        if (!this.initialized &&
            !this.initialize()) {
            return false;
        }

        this.active = true;
        this.rootElement.classList.remove(
            "hidden"
        );
        this.render();
        return true;

    },

    deactivate() {

        this.active = false;
        this.rootElement?.classList.add(
            "hidden"
        );
        return true;

    },

    render() {

        if (!this.rootElement) return false;

        const status =
            PolymerizerManager.getStatus();
        const product =
            status.selectedProduct;

        PolymerizerProductView.renderCatalog(
            this.elements.productList,
            status.products,
            status.activeAssembly
        );
        PolymerizerProductView.renderChamber(
            this.elements,
            product,
            status.activeAssembly
        );
        PolymerizerProductView.renderPreflight(
            this.elements.requirements,
            product
        );
        PolymerizerProductView.renderOutput(
            this.elements,
            product
        );

        return true;

    }

};

export default PolymerizerUI;
