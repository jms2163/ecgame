// --------------------------------------------------
// MoleculeLabUI.js
// DOM orchestration for Molecule Lab. It renders state
// supplied by MoleculeLabManager and forwards user intent.
// --------------------------------------------------

import GameStateObserver from "./GameStateObserver.js";
import MoleculeBuilderView from "./MoleculeBuilderView.js";
import MoleculeLabManager from "./MoleculeLabManager.js";

const MoleculeLabUI = {
    initialized: false,
    active: false,
    subscribed: false,
    renderFrameId: null,
    builderSignature: null,
    expandedPropertiesId: null,
    rootElement: null,
    elements: {},
    zoneButtonPointerGesture: null,
    lastZoneButtonActivation: null,
    dispatchingZonePointerClick: false,

    initialize() {
        if (this.initialized) return true;

        this.rootElement = this.ensureRootElement();
        if (!this.rootElement) {
            console.warn("[MoleculeLabUI] Unable to mount #molecule-lab-zone.");
            return false;
        }

        this.cacheElements();
        this.buildStaticUI();
        this.subscribe();

        const builderReady = MoleculeBuilderView.initialize({
            container: this.elements.builderViewport,
            canvas: this.elements.builderCanvas,
            onPlacementRequest: (moleculeId, slotIndex) =>
                MoleculeLabManager.placeAtom(moleculeId, slotIndex),
            onAssemblyComplete: () => this.scheduleRender(),
            onFeedback: message => this.setFeedback(message)
        });

        if (!builderReady) return false;

        this.initialized = true;
        this.render();
        console.log("[MoleculeLabUI] Initialized.");
        return true;
    },

    ensureRootElement() {
        let root = document.getElementById("molecule-lab-zone");
        if (root) return root;

        const host = document.getElementById("app-main") ||
            document.getElementById("app") ||
            document.body;
        root = document.createElement("section");
        root.id = "molecule-lab-zone";
        root.className = "zone hidden";
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
            </div>`;
        host.appendChild(root);
        return root;
    },

    cacheElements() {
        const byId = id => this.rootElement.querySelector(`#${id}`);
        this.elements.header = byId("molecule-lab-header");
        this.elements.tabs = byId("molecule-lab-tabs");
        this.elements.recipeDrawer = byId("molecule-lab-recipe-drawer");
        this.elements.synthesisCanvas = byId("molecule-lab-synthesis-canvas");
        this.elements.inspector = byId("molecule-lab-inspector");
        this.elements.reference = byId("molecule-lab-reference");
    },

    buildStaticUI() {
        this.elements.header.className = "molecule-lab-header-panel";
        this.elements.header.innerHTML = `
            <div class="molecule-lab-title-group">
                <p class="molecule-lab-eyebrow">Molecule Lab · Chemical Bonding Zone</p>
                <h1 class="molecule-lab-title">Molecular Synthesis</h1>
            </div>
            <div class="molecule-lab-stats-group" aria-label="Molecule library statistics">
                <span class="molecule-lab-library-title">Library</span>
                <div class="molecule-lab-stat-row">
                    Molecules synthesized:
                    <strong id="stat-synthesized-molecules">0</strong>
                </div>
                <div class="molecule-lab-stat-row">
                    Properties investigated:
                    <strong id="stat-properties-investigated">0</strong>
                </div>
            </div>`;

        this.elements.tabs.className = "molecule-lab-tabs-panel";
        this.elements.recipeDrawer.className = "molecule-lab-recipe-drawer";
        this.elements.inspector.className = "molecule-lab-inspector";
        this.elements.reference.className = "molecule-lab-reference-panel";
        this.elements.synthesisCanvas.className = "molecule-lab-synthesis-canvas";

        this.elements.synthesisCanvas.innerHTML = `
            <div class="molecule-lab-panel-heading">
                <div>
                    <p class="molecule-lab-panel-kicker">Interactive builder</p>
                    <h2>Synthesis Chamber</h2>
                </div>
                <div class="molecule-builder-toolbar" aria-label="Builder view controls">
                    <button type="button" data-builder-action="rotate-left" title="Rotate left">↶</button>
                    <button type="button" data-builder-action="rotate-right" title="Rotate right">↷</button>
                    <button type="button" data-builder-action="zoom-in" title="Zoom in">＋</button>
                    <button type="button" data-builder-action="zoom-out" title="Zoom out">−</button>
                </div>
            </div>
            <div id="molecule-lab-builder-viewport" class="molecule-lab-builder-viewport">
                <canvas id="molecule-lab-builder-canvas" aria-label="Three-dimensional molecule assembly window"></canvas>
                <button
                    type="button"
                    id="molecule-element-key-toggle"
                    class="molecule-element-key-toggle"
                    aria-controls="molecule-element-key"
                    aria-expanded="false"
                    aria-label="Show atom color key"
                    title="Show atom color key"
                >?</button>
                <div id="molecule-element-key" class="molecule-element-key hidden" aria-label="Atom color key">
                    <strong>Atom key</strong>
                    <span><i class="element-h" aria-hidden="true"></i>Hydrogen</span>
                    <span><i class="element-c" aria-hidden="true"></i>Carbon</span>
                    <span><i class="element-n" aria-hidden="true"></i>Nitrogen</span>
                    <span><i class="element-o" aria-hidden="true"></i>Oxygen</span>
                    <span><i class="element-p" aria-hidden="true"></i>Phosphorus</span>
                    <span><i class="element-s" aria-hidden="true"></i>Sulfur</span>
                </div>
                <div class="molecule-lab-builder-overlay">
                    <p id="molecule-lab-feedback" role="status" aria-live="polite">
                        Select an available molecule from the tech tree.
                    </p>
                </div>
            </div>`;

        this.elements.builderViewport = this.rootElement.querySelector(
            "#molecule-lab-builder-viewport"
        );
        this.elements.builderCanvas = this.rootElement.querySelector(
            "#molecule-lab-builder-canvas"
        );
        this.elements.feedback = this.rootElement.querySelector(
            "#molecule-lab-feedback"
        );
        this.elements.elementKeyToggle = this.rootElement.querySelector(
            "#molecule-element-key-toggle"
        );
        this.elements.elementKey = this.rootElement.querySelector(
            "#molecule-element-key"
        );

        // Every button in the zone uses the same stable pointer-up path.
        // Calling button.click() here reaches each button's normal action
        // without depending on the browser to synthesize a later click.
        this.rootElement.addEventListener(
            "pointerdown",
            event => this.beginZoneButtonPointer(event),
            true
        );
        this.rootElement.addEventListener(
            "pointerup",
            event => this.finishZoneButtonPointer(event),
            true
        );
        this.rootElement.addEventListener(
            "pointercancel",
            () => this.cancelZoneButtonPointer(),
            true
        );
        this.rootElement.addEventListener(
            "click",
            event => this.suppressHandledZoneButtonClick(event),
            true
        );

        this.elements.synthesisCanvas.addEventListener("click", event => {
            const action = event.target.closest("[data-builder-action]")
                ?.dataset.builderAction;
            if (action === "rotate-left") MoleculeBuilderView.rotate(-Math.PI / 8);
            if (action === "rotate-right") MoleculeBuilderView.rotate(Math.PI / 8);
            if (action === "zoom-in") MoleculeBuilderView.zoom(-1);
            if (action === "zoom-out") MoleculeBuilderView.zoom(1);
        });

        this.elements.elementKeyToggle.addEventListener("click", () => {
            const opening = this.elements.elementKey.classList.contains("hidden");
            this.elements.elementKey.classList.toggle("hidden", !opening);
            this.elements.elementKeyToggle.setAttribute(
                "aria-expanded",
                String(opening)
            );
            this.elements.elementKeyToggle.setAttribute(
                "aria-label",
                `${opening ? "Hide" : "Show"} atom color key`
            );
        });

        // Card clicks are still delegated to the stable drawer. Pointer users
        // arrive here through the zone-wide pointer-up dispatcher; keyboard
        // users arrive through the button's native Enter/Space click.
        this.elements.recipeDrawer.addEventListener(
            "click",
            event => {
                const card = this.resolveTreeCardFromPointer(event);
                if (!card) return;
                this.activateTreeCard(card.dataset.moleculeId);
            },
            true
        );

        // The inspector contents are replaced during renders. Keep one
        // permanent listener on the stable inspector shell so synthesis and
        // review actions never depend on rebinding a newly-created button.
        this.elements.inspector.addEventListener("click", event => {
            const control = event.target instanceof Element
                ? event.target.closest("[data-molecule-action]")
                : null;
            if (!control || !this.elements.inspector.contains(control)) return;

            if (control.dataset.moleculeAction === "start-synthesis") {
                this.startSelectedSynthesis();
            }

            if (control.dataset.moleculeAction === "review-properties") {
                this.reviewSelectedProperties();
            }
        }, true);

        this.renderReferencePanel();
    },

    resolveZoneButtonFromPointer(event) {
        const directButton = event.target instanceof Element
            ? event.target.closest("button")
            : null;
        if (directButton && this.rootElement.contains(directButton)) {
            return directButton;
        }

        if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) {
            return null;
        }

        const stackedButton = document.elementsFromPoint(
            event.clientX,
            event.clientY
        ).map(element => element.closest?.("button"))
            .find(button => button && this.rootElement.contains(button));
        if (stackedButton) return stackedButton;

        return [...this.rootElement.querySelectorAll("button")].find(button => {
            const rect = button.getBoundingClientRect();
            return event.clientX >= rect.left &&
                event.clientX <= rect.right &&
                event.clientY >= rect.top &&
                event.clientY <= rect.bottom;
        }) ?? null;
    },

    getZoneButtonKey(button) {
        if (button.id) return `id:${button.id}`;

        const dataKeys = [
            "moleculeId",
            "category",
            "builderAction",
            "moleculeAction"
        ];
        for (const key of dataKeys) {
            if (button.dataset[key]) {
                return `${key}:${button.dataset[key]}`;
            }
        }

        return `button:${button.className}:${button.textContent.trim()}`;
    },

    beginZoneButtonPointer(event) {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        const button = this.resolveZoneButtonFromPointer(event);
        if (!button || button.disabled) {
            this.zoneButtonPointerGesture = null;
            return;
        }

        this.zoneButtonPointerGesture = {
            pointerId: event.pointerId,
            buttonKey: this.getZoneButtonKey(button),
            startX: event.clientX,
            startY: event.clientY
        };
    },

    finishZoneButtonPointer(event) {
        const gesture = this.zoneButtonPointerGesture;
        this.zoneButtonPointerGesture = null;
        if (!gesture || gesture.pointerId !== event.pointerId) return;

        const movementPx = Math.hypot(
            event.clientX - gesture.startX,
            event.clientY - gesture.startY
        );
        if (movementPx > 10) return;

        const button = this.resolveZoneButtonFromPointer(event);
        if (
            !button ||
            button.disabled ||
            this.getZoneButtonKey(button) !== gesture.buttonKey
        ) {
            return;
        }

        this.lastZoneButtonActivation = {
            buttonKey: gesture.buttonKey,
            atMs: performance.now()
        };

        this.dispatchingZonePointerClick = true;
        try {
            button.click();
        } finally {
            this.dispatchingZonePointerClick = false;
        }
    },

    cancelZoneButtonPointer() {
        this.zoneButtonPointerGesture = null;
    },

    suppressHandledZoneButtonClick(event) {
        if (this.dispatchingZonePointerClick) return;

        const button = this.resolveZoneButtonFromPointer(event);
        if (!button) return;

        const recent = this.lastZoneButtonActivation;
        const alreadyHandled =
            event.isTrusted &&
            event.detail > 0 &&
            recent?.buttonKey === this.getZoneButtonKey(button) &&
            performance.now() - recent.atMs < 750;

        if (alreadyHandled) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    },

    renderReferencePanel() {
        const concepts = [
            ["Covalent bond", "Atoms share electrons to fill their outer shells."],
            ["Nonpolar", "Electrons are shared evenly, producing no permanent charge separation."],
            ["Polar", "Unequal electron sharing creates partial positive and negative regions."],
            ["Molecular shape", "Three-dimensional geometry determines many molecular properties."],
            ["Hydrophilic", "Polar or charged substances interact readily with water."],
            ["Hydrophobic", "Nonpolar substances interact poorly with water."]
        ];

        this.elements.reference.innerHTML = `
            <h2>Chemical Bonding Reference</h2>
            <div class="molecule-lab-reference-grid">
                ${concepts.map(([term, definition]) => `
                    <article class="molecule-lab-reference-card">
                        <h3>${term}</h3>
                        <p>${definition}</p>
                    </article>`).join("")}
            </div>`;
    },

    activate() {
        if (!this.initialized && !this.initialize()) return false;
        this.active = true;
        MoleculeBuilderView.activate();
        this.render(true);
        return true;
    },

    deactivate() {
        this.active = false;
        MoleculeBuilderView.deactivate();
        return true;
    },

    render(forceBuilder = false) {
        if (!this.initialized) return false;
        const status = MoleculeLabManager.getStatus();

        this.rootElement.querySelector("#stat-synthesized-molecules")
            .textContent = String(status.synthesizedCount);
        this.rootElement.querySelector("#stat-properties-investigated")
            .textContent = String(status.investigatedCount);

        this.renderTabs(status);
        this.renderTree(status);
        this.renderInspector(status);
        this.renderSynthesisControls(status);
        this.syncBuilder(status, forceBuilder);
        return true;
    },

    renderTabs(status) {
        this.elements.tabs.replaceChildren();
        status.categories.forEach(category => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "molecule-lab-tab-btn";
            button.classList.toggle(
                "active",
                status.activeCategory === category.id
            );
            button.classList.toggle("locked", !category.unlocked);
            button.disabled = !category.unlocked;
            button.dataset.category = category.id;
            button.title = category.unlocked
                ? category.title
                : `Requires ${category.missing.join(" and ")}`;
            button.setAttribute(
                "aria-label",
                category.unlocked
                    ? category.title
                    : `${category.title} locked. ${button.title}`
            );
            button.innerHTML = `<span class="molecule-lab-tab-label">${category.label}</span>`;
            button.addEventListener("click", () => {
                const result = MoleculeLabManager.setActiveCategory(category.id);
                if (!result.success) {
                    this.setFeedback(
                        `Requires ${result.missing.join(" and ")} first.`
                    );
                }
                this.builderSignature = null;
                this.scheduleRender();
            });
            this.elements.tabs.appendChild(button);
        });
    },

    renderTree(status) {
        const category = status.categories.find(
            item => item.id === status.activeCategory
        );
        const categoryNodes = status.nodes.filter(
            node => node.definition.category === status.activeCategory
        );
        const tiers = new Map();
        categoryNodes.forEach(node => {
            if (!tiers.has(node.definition.tier)) {
                tiers.set(node.definition.tier, []);
            }
            tiers.get(node.definition.tier).push(node);
        });

        const scrollTop = this.elements.recipeDrawer.scrollTop;
        this.elements.recipeDrawer.innerHTML = `
            <div class="molecule-lab-panel-heading molecule-tree-heading">
                <div>
                    <p class="molecule-lab-panel-kicker">Conditional progression</p>
                    <h2>${category?.title ?? "Recipes"}</h2>
                </div>
                <span>${categoryNodes.length} nodes</span>
            </div>
            <div id="molecule-tech-tree" class="molecule-tech-tree">
                <div id="molecule-tech-tree-content"></div>
            </div>`;

        const content = this.elements.recipeDrawer.querySelector(
            "#molecule-tech-tree-content"
        );

        [...tiers.entries()]
            .sort(([a], [b]) => a - b)
            .forEach(([tier, nodes]) => {
                const row = document.createElement("section");
                row.className = "molecule-tech-tier";
                row.dataset.tier = tier;
                row.setAttribute("aria-label", `Tier ${Number(tier) + 1}`);

                nodes.forEach(node => {
                    const button = document.createElement("button");
                    button.type = "button";
                    button.id = `molecule-node-${node.id}`;
                    button.className = `molecule-tech-node ${node.phase}`;
                    button.classList.toggle(
                        "selected",
                        node.id === status.selectedMoleculeId
                    );
                    button.dataset.moleculeId = node.id;
                    // Locked cards remain focusable so keyboard users can read
                    // their unlock requirement and activate them for feedback.
                    button.tabIndex = 0;
                    button.setAttribute(
                        "aria-disabled",
                        String(node.phase === "locked")
                    );
                    button.setAttribute(
                        "aria-label",
                        `${node.definition.name}. ${this.phaseLabel(node.phase)}. ${node.message}`
                    );
                    button.title = node.message;
                    button.innerHTML = `
                        <span class="molecule-tech-icon">${node.definition.icon}</span>
                        <span class="molecule-tech-name">${node.definition.name}</span>
                        <span class="molecule-tech-state">${this.phaseLabel(node.phase)}</span>
                        <span class="molecule-tech-progress" aria-hidden="true">
                            <span style="width:${Math.round((node.synthesis?.progress ?? 0) * 100)}%"></span>
                        </span>`;
                    row.appendChild(button);
                });
                content.appendChild(row);
            });

        this.elements.recipeDrawer.scrollTop = scrollTop;
    },

    resolveTreeCardFromPointer(event) {
        const directCard = event.target instanceof Element
            ? event.target.closest(".molecule-tech-node")
            : null;

        if (
            directCard &&
            this.elements.recipeDrawer.contains(directCard)
        ) {
            return directCard;
        }

        // Coordinate fallback covers rare cases where an overlay or browser
        // retargeting makes event.target differ from the visible card.
        return [...this.elements.recipeDrawer.querySelectorAll(
            ".molecule-tech-node"
        )].find(card => {
            const rect = card.getBoundingClientRect();
            return event.clientX >= rect.left &&
                event.clientX <= rect.right &&
                event.clientY >= rect.top &&
                event.clientY <= rect.bottom;
        }) ?? null;
    },


    activateTreeCard(moleculeId) {
        const result =
            MoleculeLabManager.selectMolecule(moleculeId);

        if (!result.success) {
            this.setFeedback(
                result.message ?? "That recipe is locked."
            );
        } else {
            this.builderSignature = null;
        }

        this.scheduleRender();
    },

    renderInspector(status) {
        const node = status.selectedNode;
        if (!node) {
            this.elements.inspector.innerHTML = "<p>No molecule selected.</p>";
            return;
        }

        const formula = Object.entries(node.definition.formula)
            .map(([symbol, count]) => `${symbol}${count > 1 ? count : ""}`)
            .join(" ") || "—";
        const inventoryRows = Object.entries(node.definition.formula)
            .map(([symbol, required]) => {
                const owned = status.atomInventory[symbol]?.count ?? 0;
                return `<li><span>${symbol}</span><strong>${owned} owned · ${required} total</strong></li>`;
            }).join("");

        const isComplete = node.phase === "complete";
        const actionMarkup = isComplete
            ? `
                <div class="molecule-inspector-actions">
                    <button
                        type="button"
                        id="molecule-review-properties"
                        data-molecule-action="review-properties"
                    >
                        Review Molecular Properties
                    </button>
                    <button type="button" class="molecule-analysis-action">
                        Measure Dipole
                    </button>
                    <button type="button" class="molecule-analysis-action">
                        Measure Water Interaction
                    </button>
                </div>
                <div id="molecule-property-notes" class="${
                    this.expandedPropertiesId === node.id ? "" : "hidden"
                }">
                    ${node.definition.info}
                </div>`
            : `
                <div class="molecule-inspector-actions">
                    <button
                        type="button"
                        id="molecule-lab-start-synthesis"
                        data-molecule-action="start-synthesis"
                        disabled
                    >
                        Assembly in progress 0/${node.definition.atoms.length}
                    </button>
                </div>`;

        this.elements.inspector.innerHTML = `
            <div class="molecule-lab-panel-heading">
                <div>
                    <p class="molecule-lab-panel-kicker">Selected molecule</p>
                    <h2>${node.definition.name}</h2>
                </div>
                <span class="molecule-status-badge ${node.phase}">${this.phaseLabel(node.phase)}</span>
            </div>
            <div class="molecule-inspector-content">
                <div class="molecule-formula-display">${formula}</div>
                <p>${node.definition.description}</p>
                <h3>Atom requirements</h3>
                <ul>${inventoryRows || "<li>No atom recipe.</li>"}</ul>
                <p class="molecule-requirement-message">${node.message}</p>
                ${actionMarkup}
            </div>`;

        this.elements.startSynthesis = this.elements.inspector.querySelector(
            "#molecule-lab-start-synthesis"
        );
    },

    startSelectedSynthesis() {
        const moleculeId = MoleculeLabManager.getStatus().selectedMoleculeId;
        const result = MoleculeLabManager.startSynthesis(moleculeId);
        if (!result.success) {
            this.setFeedback(
                result.message ?? "Synthesis cannot start yet."
            );
        }
        this.scheduleRender();
    },

    reviewSelectedProperties() {
        const node = MoleculeLabManager.getStatus().selectedNode;
        if (!node || node.phase !== "complete") return;

        this.expandedPropertiesId = node.id;
        this.elements.inspector.querySelector("#molecule-property-notes")
            ?.classList.remove("hidden");
        MoleculeLabManager.recordInvestigation(node.id);
    },

    renderSynthesisControls(status) {
        const node = status.selectedNode;
        const button = this.elements.startSynthesis;
        if (!node) {
            return;
        }

        // A completed molecule renders inspection actions instead of this
        // button, so there is intentionally nothing to update here.
        if (!button) {
            if (node.phase === "complete") {
                this.setFeedback(
                    `${node.definition.name} is available for inspection.`
                );
            }
            return;
        }

        if (node.phase === "ready") {
            button.disabled = false;
            button.textContent = `Begin ${Math.ceil(node.definition.durationMs / 1000)}s synthesis`;
            this.setFeedback("Assembly complete. Begin timed synthesis when ready.");
        } else if (node.phase === "synthesizing") {
            button.disabled = true;
            this.updateSynthesisProgress(node.synthesis);
        } else if (node.phase === "complete") {
            this.setFeedback(`${node.definition.name} is available for inspection.`);
        } else if (node.phase === "locked") {
            button.disabled = true;
            button.textContent = "Recipe locked";
            this.setFeedback(node.message);
        } else {
            const placed = node.assembly.placedSlots.length;
            const total = node.definition.atoms.length;
            button.disabled = true;
            button.textContent = `Assembly in progress ${placed}/${total}`;
            this.setFeedback(node.message);
        }
    },

    updateSynthesisProgress(progress) {
        if (!progress) return;
        const seconds = Math.ceil(progress.remainingMs / 1000);
        if (this.elements.startSynthesis) {
            this.elements.startSynthesis.textContent = `Synthesizing · ${seconds}s`;
        }
        this.setFeedback(`Synthesis in progress: ${seconds} seconds remaining.`);
        const cardFill = this.rootElement.querySelector(
            `#molecule-node-${progress.moleculeId} .molecule-tech-progress span`
        );
        if (cardFill) {
            cardFill.style.width = `${Math.round(progress.progress * 100)}%`;
        }
    },

    syncBuilder(status, force = false) {
        const node = status.selectedNode;
        if (!node || node.phase === "locked" || !node.definition.atoms.length) {
            if (force || this.builderSignature !== "empty") {
                MoleculeBuilderView.clearScene();
                this.builderSignature = "empty";
            }
            return;
        }

        const slots = node.assembly.placedSlots.join(",");
        const signature = `${node.id}:${node.phase}:${slots}`;
        if (!force && signature === this.builderSignature) return;

        if (node.phase === "complete") {
            MoleculeBuilderView.showCompleted(node.definition);
        } else {
            MoleculeBuilderView.loadAssembly(
                node.definition,
                node.assembly.placedSlots
            );
        }
        this.builderSignature = signature;
    },

    phaseLabel(phase) {
        return ({
            locked: "Locked",
            available: "Available",
            assembling: "Assembling",
            ready: "Ready",
            synthesizing: "Synthesizing",
            complete: "Complete"
        })[phase] ?? phase;
    },

    setFeedback(message) {
        if (this.elements.feedback && message) {
            this.elements.feedback.textContent = message;
        }
    },

    scheduleRender() {
        if (!this.active || this.renderFrameId) return;
        this.renderFrameId = requestAnimationFrame(() => {
            this.renderFrameId = null;
            this.render();
        });
    },

    subscribe() {
        if (this.subscribed) return;
        GameStateObserver.on("molecule-lab-state-changed", () => {
            this.scheduleRender();
        });
        GameStateObserver.on("molecule-synthesis-progress", progress => {
            if (this.active) this.updateSynthesisProgress(progress);
        });
        GameStateObserver.on("zone-state-changed", payload => {
            if (payload?.zoneId === "moleculeLab") this.scheduleRender();
        });
        this.subscribed = true;
    }
};

export default MoleculeLabUI;
