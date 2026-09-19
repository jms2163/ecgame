// --------------------------------------------------
// MetabolismUI.js
// Console-only Metabolism pathway placement orchestration.
// --------------------------------------------------

import GameStateObserver
    from "./GameStateObserver.js";
import MetabolismManager
    from "./MetabolismManager.js";
import MetabolismPathwayView
    from "./MetabolismPathwayView.js";
import MetabolismEnzymeTrayView
    from "./MetabolismEnzymeTrayView.js";
import MetabolismCoreModuleView
    from "./MetabolismCoreModuleView.js";

const MetabolismUI = {

    initialized: false,
    active: false,
    rootElement: null,
    pathwayListElement: null,
    pathwayMapElement: null,
    chemistryElement: null,
    mapTitleElement: null,
    mapStatusElement: null,
    productionSummaryElement: null,
    enzymeTrayElement: null,
    coreModuleElement: null,
    selectedPathwayId: "glycolysis",

    initialize() {

        if (this.initialized) {
            this.render();
            return true;
        }

        this.rootElement =
            this.ensureRootElement();

        if (!this.rootElement) {
            console.warn(
                "MetabolismUI: unable to mount the zone root"
            );
            return false;
        }

        this.buildStaticUI();

        this.pathwayListElement =
            this.rootElement.querySelector(
                "#metabolism-pathway-list"
            );
        this.pathwayMapElement =
            this.rootElement.querySelector(
                "#metabolism-pathway-map"
            );
        this.chemistryElement =
            this.rootElement.querySelector(
                "#metabolism-chemistry-summary"
            );
        this.mapTitleElement =
            this.rootElement.querySelector(
                "#metabolism-map-heading"
            );
        this.mapStatusElement =
            this.rootElement.querySelector(
                "#metabolism-map-status"
            );
        this.productionSummaryElement =
            this.rootElement.querySelector(
                "#metabolism-production-summary"
            );
        this.enzymeTrayElement =
            this.rootElement.querySelector(
                "#metabolism-enzyme-tray"
            );
        this.coreModuleElement =
            this.rootElement.querySelector(
                "#metabolism-core-module"
            );

        GameStateObserver.on(
            "metabolism-state-changed",
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

        let root = document.getElementById(
            "metabolism-zone"
        );

        if (root) return root;

        const host =
            document.getElementById(
                "app-main"
            ) ||
            document.getElementById("app") ||
            document.body;

        if (!host) return null;

        root = document.createElement(
            "section"
        );
        root.id = "metabolism-zone";
        root.className = "zone hidden";
        root.setAttribute(
            "aria-label",
            "Metabolism"
        );
        host.appendChild(root);

        return root;

    },

    buildStaticUI() {

        this.rootElement.innerHTML = `
            <div class="metabolism-lab-shell">
                <header class="metabolism-topbar">
                    <div>
                        <p class="metabolism-kicker">Cellular Energy Pathways</p>
                        <h1>Metabolism</h1>
                        <p class="metabolism-subtitle">Development preview · Student navigation remains locked</p>
                    </div>
                    <div class="metabolism-status-chip" aria-label="Development status">
                        <span aria-hidden="true"></span>
                        Milestone 3 · Enzyme Placement
                    </div>
                </header>

                <div class="metabolism-workspace">
                    <aside class="metabolism-panel metabolism-library" aria-labelledby="metabolism-pathways-heading">
                        <p class="metabolism-panel-kicker">Pathway Library</p>
                        <h2 id="metabolism-pathways-heading">Available Maps</h2>
                        <div id="metabolism-pathway-list" class="metabolism-pathway-list"></div>
                        <section class="metabolism-core-panel" aria-labelledby="metabolism-core-heading">
                            <p class="metabolism-panel-kicker">Black-box Foundation</p>
                            <h3 id="metabolism-core-heading">Core Preflight</h3>
                            <div id="metabolism-core-module"></div>
                        </section>
                    </aside>

                    <main class="metabolism-panel metabolism-map-panel" aria-labelledby="metabolism-map-heading">
                        <div class="metabolism-map-heading">
                            <div>
                                <p class="metabolism-panel-kicker">Pathway Workspace</p>
                                <h2 id="metabolism-map-heading">Glycolysis Map</h2>
                            </div>
                            <span id="metabolism-map-status" class="metabolism-map-status">Read-only Preview</span>
                        </div>

                        <div class="metabolism-connection-legend" aria-label="Connection legend">
                            <span><i class="metabolism-legend-line metabolism-legend-line--adjacent"></i>Adjacent cards</span>
                            <span><i class="metabolism-legend-line metabolism-legend-line--gap"></i>Pathway gap</span>
                            <span><i class="metabolism-legend-line metabolism-legend-line--complete"></i>Complete pathway</span>
                        </div>

                        <div id="metabolism-pathway-map" class="metabolism-pathway-map"></div>

                        <p class="metabolism-map-guidance">
                            Synthesize an enzyme in Polymerizer, then drag its card to the matching slot. Products are not consumed. Each correctly placed core enzyme adds +1 ATP/min even when neighboring slots are empty.
                        </p>

                        <section class="metabolism-production-panel" aria-labelledby="metabolism-production-heading">
                            <div>
                                <p class="metabolism-panel-kicker">Glycolysis Reconstruction</p>
                                <h3 id="metabolism-production-heading">Partial ATP Benefit</h3>
                            </div>
                            <strong id="metabolism-production-summary">0 / 10 · +0 ATP/min</strong>
                        </section>

                        <section class="metabolism-enzyme-tray-panel" aria-labelledby="metabolism-enzyme-tray-heading">
                            <p class="metabolism-panel-kicker">Polymerizer Inventory</p>
                            <h3 id="metabolism-enzyme-tray-heading">Available Enzyme Cards</h3>
                            <div id="metabolism-enzyme-tray" class="metabolism-enzyme-tray"></div>
                        </section>

                        <div id="metabolism-chemistry-summary" class="metabolism-chemistry-summary"></div>
                    </main>
                </div>
            </div>
        `;

    },

    activate() {

        if (
            !this.initialized &&
            !this.initialize()
        ) {
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

        if (!this.pathwayListElement) {
            return false;
        }

        const { pathways } =
            MetabolismManager.getStatus();

        this.pathwayListElement.replaceChildren(
            ...pathways.map(pathway =>
                this.createPathwayCard(
                    pathway
                )
            )
        );

        const selectedPathway =
            pathways.find(pathway =>
                pathway.id ===
                    this.selectedPathwayId &&
                pathway.selectable
            ) ?? pathways.find(pathway =>
                pathway.selectable
            );

        if (!selectedPathway) {
            return false;
        }

        this.selectedPathwayId =
            selectedPathway.id;
        this.rootElement.dataset.pathwayTheme =
            selectedPathway.themeId;
        this.mapTitleElement.textContent =
            `${selectedPathway.name} Map`;
        this.mapStatusElement.textContent =
            selectedPathway.available
                ? "Development Preview"
                : "Locked · Development Preview";

        const isNetwork =
            selectedPathway.mapType ===
                "network";
        const connectionLegend =
            this.rootElement.querySelector(
                ".metabolism-connection-legend"
            );
        const mapGuidance =
            this.rootElement.querySelector(
                ".metabolism-map-guidance"
            );
        if (connectionLegend) {
            connectionLegend.hidden =
                isNetwork;
        }
        if (mapGuidance) {
            mapGuidance.textContent = isNetwork
                ? "ETC components are shown as a functional dependency network. Protein products will remain owned by Polymerizer; metabolites and the proton gradient are never draggable protein cards."
                : "Synthesize an enzyme in Polymerizer, then drag its card to the matching slot. Products are not consumed. Each configured core enzyme benefit is derived from the selected pathway catalog.";
        }

        MetabolismPathwayView.render(
            this.pathwayMapElement,
            selectedPathway,
            {
                occupiedEnzymeIds:
                    selectedPathway
                        .placedEnzymeIds,
                pathwayComplete:
                    selectedPathway
                        .reconstruction
                        .complete &&
                    selectedPathway
                        .regenerationComplete,
                onPlaceEnzyme:
                    selectedPathway.available
                        ? (
                            slotNumber,
                            enzymeId
                        ) => {
                            MetabolismManager
                                .placeEnzyme(
                                    selectedPathway
                                        .id,
                                    slotNumber,
                                    enzymeId
                                );
                            this.render();
                        }
                        : null
            }
        );
        MetabolismPathwayView
            .renderChemistry(
                this.chemistryElement,
                selectedPathway
            );

        const reconstruction =
            selectedPathway.reconstruction;
        this.productionSummaryElement
            .textContent =
                selectedPathway.reward
                    ?.implemented
                    ? `${reconstruction.placedCoreEnzymes} / ${reconstruction.requiredCoreEnzymes} · ${reconstruction.percent}% · +${reconstruction.atpPerMinute} ATP/min`
                    : `${reconstruction.placedCoreEnzymes} / ${reconstruction.requiredCoreEnzymes} · ATP reward not configured`;

        const productionPanel =
            this.productionSummaryElement
                .closest(
                    ".metabolism-production-panel"
                );
        const productionKicker =
            productionPanel?.querySelector(
                ".metabolism-panel-kicker"
            );
        const productionHeading =
            productionPanel?.querySelector(
                "h3"
            );
        if (productionKicker) {
            productionKicker.textContent =
                isNetwork
                    ? "ETC Energy Accounting"
                    : `${selectedPathway.name} Reconstruction`;
        }
        if (productionHeading) {
            productionHeading.textContent =
                isNetwork
                    ? "ATP Balance Deferred"
                    : "Partial ATP Benefit";
        }

        MetabolismEnzymeTrayView.render(
            this.enzymeTrayElement,
            selectedPathway,
            (slotNumber, enzymeId) => {
                MetabolismManager.placeEnzyme(
                    selectedPathway.id,
                    slotNumber,
                    enzymeId
                );
                this.render();
            }
        );
        const trayPanel =
            this.enzymeTrayElement.closest(
                ".metabolism-enzyme-tray-panel"
            );
        if (trayPanel) {
            trayPanel.hidden = isNetwork;
        }

        const corePanel =
            this.coreModuleElement.closest(
                ".metabolism-core-panel"
            );
        if (corePanel) {
            corePanel.hidden =
                !selectedPathway
                    .coreModuleStatus;
        }
        if (selectedPathway.coreModuleStatus) {
            MetabolismCoreModuleView.render(
                this.coreModuleElement,
                selectedPathway
                    .coreModuleStatus,
                () => {
                    MetabolismManager
                        .completeCoreModule(
                            selectedPathway.id
                        );
                    this.render();
                }
            );
        } else {
            this.coreModuleElement
                .replaceChildren();
        }

        return true;

    },

    createPathwayCard(pathway) {

        const card = document.createElement(
            "button"
        );
        const requirements =
            pathway.unlockRequirements ?? [];
        const comingSoon =
            pathway.releaseState ===
                "coming-soon";

        card.className = [
            "metabolism-pathway-card",
            `metabolism-pathway-card--theme-${pathway.themeId}`,
            pathway.available
                ? "metabolism-pathway-card--available"
                : "metabolism-pathway-card--locked",
            comingSoon
                ? "metabolism-pathway-card--coming-soon"
                : ""
        ].join(" ");
        card.type = "button";
        card.disabled = comingSoon;
        card.setAttribute(
            "aria-pressed",
            String(
                pathway.id ===
                    this.selectedPathwayId
            )
        );

        card.innerHTML = `
            <div class="metabolism-card-heading">
                <div>
                    <p>${pathway.category}</p>
                    <h3>${pathway.name}</h3>
                </div>
                <span>${comingSoon ? "Coming Soon" : pathway.available ? "Preview" : "Locked"}</span>
            </div>
            <p>${pathway.description}</p>
            ${requirements.length > 0
                ? requirements.map(requirement => `
                    <div class="metabolism-requirement">
                        <strong>${requirement.label}</strong>
                        <span>${requirement.currentCount} / ${requirement.minimumCount}</span>
                    </div>
                `).join("")
                : `
                    <div class="metabolism-requirement">
                        <strong>${comingSoon ? "Pathway design" : "Pathway map"}</strong>
                        <span>${comingSoon ? "Not configured" : "Development preview"}</span>
                    </div>
                `}
            <small>
                ${comingSoon
                    ? pathway.comingSoonMessage
                    : "Enzymes and cofactors are not consumed · Select to inspect map"}
            </small>
        `;

        if (!comingSoon) {
            card.addEventListener(
                "click",
                () => {
                    this.selectedPathwayId =
                        pathway.id;
                    this.render();
                }
            );
        }

        return card;

    }

};

export default MetabolismUI;
