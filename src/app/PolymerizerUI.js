// --------------------------------------------------
// PolymerizerUI.js
// Console-development shell and UI orchestration.
// --------------------------------------------------

import GameStateObserver from "./GameStateObserver.js";
import PolymerizerManager from "./PolymerizerManager.js";
import PolymerizerProductView
    from "./PolymerizerProductView.js";
import PolymerizerComponentManager from "./PolymerizerComponentManager.js";
import PolymerizerPracticeView from "./PolymerizerPracticeView.js";
import PolymerizerVisualCatalog from "../data/PolymerizerVisualCatalog.js";

const PolymerizerUI = {

    initialized: false,
    active: false,
    rootElement: null,
    elements: {},
    // Product browsing is presentation-only and intentionally does not add
    // a speculative selection field to persistent Polymerizer save state.
    selectedProductId: "Aquaporin",
    // Temporary viewing preference; it never changes game/save state.
    imageZoomPercent: 100,
    zoomProductId: null,
    imageZoomByProduct: {},

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
        GameStateObserver.on("game-state-loaded", () => PolymerizerPracticeView.close());
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
                    </div>
                    <div class="poly-status-chip" aria-label="Assembly status">
                        <span aria-hidden="true"></span>
                        Functional Structure Assembly
                    </div>
                </header>

                <div class="poly-workspace">
                    <aside class="poly-panel poly-selection-panel" aria-labelledby="poly-products-heading">
                        <p class="poly-panel-kicker">Product Library</p>
                        <h2 id="poly-products-heading">Structures</h2>

                        <nav class="poly-category-list" aria-label="Polymerizer categories">
                            <button type="button" class="poly-category poly-category--active" disabled>
                                <strong>Proteins</strong><span id="polymerizer-protein-count">0 structures</span>
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
                            <div class="poly-image-zoom" role="group" aria-label="Protein image zoom">
                                <button id="polymerizer-image-zoom-out" type="button" aria-label="Zoom protein image out by 10 percent">−</button>
                                <output id="polymerizer-image-zoom-level" aria-live="polite">100%</output>
                                <button id="polymerizer-image-zoom-in" type="button" aria-label="Zoom protein image in by 10 percent">+</button>
                            </div>
                        </div>

                        <div id="polymerizer-progress-panel" class="poly-progress-panel" hidden>
                            <label for="polymerizer-progress">Assembly progress</label>
                            <progress id="polymerizer-progress" max="1" value="0"></progress>
                            <strong id="polymerizer-countdown">Assembly timing calculated from motif level</strong>
                        </div>

                        <p id="polymerizer-product-description" class="poly-description"></p>
                        <p id="polymerizer-chamber-status" class="poly-chamber-status" role="status"></p>
                        <button id="polymerizer-assemble-button" class="poly-assemble-button" type="button" disabled>
                            Assemble Aquaporin · 15 ATP
                        </button>
                        <div id="polymerizer-component-actions" class="poly-component-actions"></div>
                        <button id="polymerizer-practice-button" class="poly-practice-button" type="button">Explore assembly · Practice</button>
                    </main>

                    <aside class="poly-side-stack">
                        <section class="poly-panel poly-preflight-panel" aria-labelledby="polymerizer-preflight-heading">
                            <p class="poly-panel-kicker">Preflight</p>
                            <h2 id="polymerizer-preflight-heading">Structural Requirements</h2>
                            <p id="polymerizer-preflight-guidance" class="poly-guidance">
                                Motif levels come from Macromolecularizer. Meeting a level unlocks assembly; motifs are never consumed.
                            </p>
                            <ul id="polymerizer-requirements" class="poly-requirement-list"></ul>
                        </section>

                        <section class="poly-panel poly-profile-panel" aria-labelledby="polymerizer-profile-heading">
                            <p class="poly-panel-kicker">Protein Profile</p>
                            <h2 id="polymerizer-profile-heading">Aquaporin</h2>
                            <div id="polymerizer-profile-details"></div>
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
            proteinCount:
                find("polymerizer-protein-count"),
            productName:
                find("polymerizer-product-name"),
            productClass:
                find("polymerizer-product-class"),
            productImage:
                find("polymerizer-product-image"),
            imageZoomOut: find("polymerizer-image-zoom-out"),
            imageZoomIn: find("polymerizer-image-zoom-in"),
            imageZoomLevel: find("polymerizer-image-zoom-level"),
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
            componentActions: find("polymerizer-component-actions"),
            practiceButton: find("polymerizer-practice-button"),
            requirements:
                find("polymerizer-requirements"),
            preflightPanel:
                find("polymerizer-preflight-heading")?.closest("section"),
            preflightGuidance:
                find("polymerizer-preflight-guidance"),
            profileHeading:
                find("polymerizer-profile-heading"),
            profileDetails:
                find("polymerizer-profile-details")
        };

    },

    bindEvents() {

        this.elements.imageZoomOut?.addEventListener("click", () => this.changeImageZoom(-10));
        this.elements.imageZoomIn?.addEventListener("click", () => this.changeImageZoom(10));
        this.elements.productImage?.addEventListener("load", () => this.updateImageZoom());
        this.elements.productImage?.addEventListener("error", () => this.updateImageZoom());

        this.elements.practiceButton?.addEventListener("click", () => {
            PolymerizerPracticeView.open(this.selectedProductId);
        });

        this.elements.assembleButton
            ?.addEventListener(
                "click",
                () => {
                    PolymerizerManager
                        .startAssembly(
                            this.selectedProductId
                        );
                    this.render();
                }
            );

    },

    updateImageZoom() {
        const image = this.elements.productImage;
        if (!image) return;
        image.style.setProperty("--poly-image-zoom", this.imageZoomPercent / 100);
        // Apply the configured zoom even if an older stylesheet is cached.
        image.style.transform = `scale(${this.imageZoomPercent / 100})`;
        this.elements.imageZoomLevel.textContent = `${this.imageZoomPercent}%`;
        this.elements.imageZoomOut.disabled = image.hidden || this.imageZoomPercent <= 10;
        this.elements.imageZoomIn.disabled = image.hidden || this.imageZoomPercent >= 500;
    },

    changeImageZoom(deltaPercent) {
        this.imageZoomPercent = Math.max(10, Math.min(500, this.imageZoomPercent + deltaPercent));
        this.imageZoomByProduct[this.zoomProductId ?? this.selectedProductId] = this.imageZoomPercent;
        this.updateImageZoom();
        const image = this.elements.productImage;
        if (!image) return;
        const box = image.getBoundingClientRect();
        const viewport = image.closest(".poly-chamber-viewport");
        const round = value => Math.round(value * 10) / 10;
        const inner = round(viewport.querySelector(".poly-orbit--inner").getBoundingClientRect().width);
        const outer = round(viewport.querySelector(".poly-orbit--outer").getBoundingClientRect().width);
        const fit = image.naturalWidth && image.naturalHeight
            ? Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight) : 0;
        const width = round(fit ? image.naturalWidth * fit : box.width);
        const height = round(fit ? image.naturalHeight * fit : box.height);
        console.info(
            `[Polymerizer PNG] ${this.elements.productName.textContent} | zoom ${this.imageZoomPercent}% | displayed ${width} × ${height} px | source ${image.naturalWidth} × ${image.naturalHeight} px | rings ${inner} / ${outer} px`,
            { productId: this.selectedProductId, zoomPercent: this.imageZoomPercent,
                displayedWidthPx: width, displayedHeightPx: height,
                imageBoxWidthPx: round(box.width), imageBoxHeightPx: round(box.height),
                sourceWidthPx: image.naturalWidth, sourceHeightPx: image.naturalHeight,
                innerRingDiameterPx: inner, outerRingDiameterPx: outer }
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

        PolymerizerPracticeView.close();
        this.active = false;
        this.rootElement?.classList.add(
            "hidden"
        );
        return true;

    },

    render() {

        if (!this.rootElement) return false;

        let status =
            PolymerizerManager.getStatus(
                this.selectedProductId
            );

        // Keep the active job visible while it is assembling. Product cards
        // are disabled during this interval, so the timer and image sequence
        // always describe the job that is actually running.
        if (
            status.activeAssembly &&
            status.activeAssembly.productId !==
                status.selectedProductId
        ) {
            this.selectedProductId =
                status.activeAssembly.productId;
            status =
                PolymerizerManager.getStatus(
                    this.selectedProductId
                );
        }

        const product =
            status.selectedProduct;

        if (this.elements.proteinCount) {
            this.elements.proteinCount
                .textContent =
                    `${status.products.length} structures`;
        }

        PolymerizerProductView.renderCatalog(
            this.elements.productList,
            status.products,
            status.activeAssembly,
            status.selectedProductId,
            productId => {
                this.selectedProductId =
                    productId;
                this.render();
            }
        );
        if (product && this.zoomProductId !== product.id) {
            this.zoomProductId = product.id;
            this.imageZoomPercent = this.imageZoomByProduct[product.id] ??
                PolymerizerVisualCatalog.get(product.id)?.displayZoomPercent ?? 100;
        }
        PolymerizerProductView.renderChamber(
            this.elements,
            product,
            status.activeAssembly
        );
        this.updateImageZoom();
        PolymerizerProductView.renderPreflight(
            this.elements.requirements,
            product,
            this.elements.preflightPanel,
            this.elements.preflightGuidance
        );
        PolymerizerProductView.renderProfile(
            this.elements,
            product
        );

        this.renderComponents(product, status.activeAssembly);

        return true;

    },

    renderComponents(product, activeAssembly) {
        const container = this.elements.componentActions;
        if (!container) return;
        container.replaceChildren();
        const components = product?.definition.components ?? [];
        if (!components.length || product.completion?.completed) return;
        const note = document.createElement("p");
        note.textContent = "Synthesize numbered components in order, or finish all remaining components. Benefits require the full complex.";
        container.append(note);
        if (!activeAssembly) this.elements.assembleButton.textContent =
            `Synthesize full complex · ${product.atp.cost} ATP`;
        for (const component of components) {
            const status = PolymerizerComponentManager.getStatus(product.id, component.number);
            const done = status.progress.completedIds.includes(component.number);
            const button = document.createElement("button");
            button.type = "button";
            button.className = "poly-component-button";
            button.textContent = `Component ${component.number} · ${done ? "Complete" : `${status.plan.atpCost} ATP`}`;
            button.title = Object.entries(component.recipe).map(([k,v]) => `${k}${v}`).join(" / ");
            button.disabled = !status.canStart;
            button.addEventListener("click", () => {
                PolymerizerComponentManager.start(product.id, component.number);
                this.render();
            });
            container.append(button);
        }
    }

};

export default PolymerizerUI;
