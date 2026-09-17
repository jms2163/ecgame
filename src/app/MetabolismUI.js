// --------------------------------------------------
// MetabolismUI.js
// Console-only Milestone 2 shell and pathway-map orchestration.
// --------------------------------------------------

import GameStateObserver
    from "./GameStateObserver.js";
import MetabolismManager
    from "./MetabolismManager.js";
import MetabolismPathwayView
    from "./MetabolismPathwayView.js";

const MetabolismUI = {

    initialized: false,
    active: false,
    rootElement: null,
    pathwayListElement: null,
    pathwayMapElement: null,
    chemistryElement: null,
    mapTitleElement: null,
    mapStatusElement: null,
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
                        Milestone 2 · Static Pathway Map
                    </div>
                </header>

                <div class="metabolism-workspace">
                    <aside class="metabolism-panel metabolism-library" aria-labelledby="metabolism-pathways-heading">
                        <p class="metabolism-panel-kicker">Pathway Library</p>
                        <h2 id="metabolism-pathways-heading">Available Maps</h2>
                        <div id="metabolism-pathway-list" class="metabolism-pathway-list"></div>
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
                            Enzyme slots are shown in pathway order. The Polymerizer inventory tray and card placement controls arrive in Milestone 3.
                        </p>

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
                    this.selectedPathwayId
            ) ?? pathways[0];

        if (!selectedPathway) {
            return false;
        }

        this.selectedPathwayId =
            selectedPathway.id;
        this.mapTitleElement.textContent =
            `${selectedPathway.name} Map`;
        this.mapStatusElement.textContent =
            selectedPathway.available
                ? "Available · Read-only Preview"
                : "Locked · Read-only Preview";

        MetabolismPathwayView.render(
            this.pathwayMapElement,
            selectedPathway
        );
        MetabolismPathwayView
            .renderChemistry(
                this.chemistryElement,
                selectedPathway
            );

        return true;

    },

    createPathwayCard(pathway) {

        const card = document.createElement(
            "button"
        );
        const requirement =
            pathway.unlockStatus;

        card.className = [
            "metabolism-pathway-card",
            pathway.available
                ? "metabolism-pathway-card--available"
                : "metabolism-pathway-card--locked"
        ].join(" ");
        card.type = "button";
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
                <span>${pathway.available ? "Available" : "Locked"}</span>
            </div>
            <p>${pathway.description}</p>
            <div class="metabolism-requirement">
                <strong>${requirement.label}</strong>
                <span>${requirement.currentCount} / ${requirement.minimumCount}</span>
            </div>
            <small>
                Completed in Polymerizer · This product is not consumed · Select to inspect map
            </small>
        `;

        card.addEventListener(
            "click",
            () => {
                this.selectedPathwayId =
                    pathway.id;
                this.render();
            }
        );

        return card;

    }

};

export default MetabolismUI;
