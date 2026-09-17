// --------------------------------------------------
// MetabolismUI.js
// Console-only Milestone 1 shell for the Metabolism zone.
// --------------------------------------------------

import GameStateObserver
    from "./GameStateObserver.js";
import MetabolismManager
    from "./MetabolismManager.js";

const MetabolismUI = {

    initialized: false,
    active: false,
    rootElement: null,
    pathwayListElement: null,

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
                        Milestone 1 · Catalog Shell
                    </div>
                </header>

                <div class="metabolism-workspace">
                    <aside class="metabolism-panel metabolism-library" aria-labelledby="metabolism-pathways-heading">
                        <p class="metabolism-panel-kicker">Pathway Library</p>
                        <h2 id="metabolism-pathways-heading">Available Maps</h2>
                        <div id="metabolism-pathway-list" class="metabolism-pathway-list"></div>
                    </aside>

                    <main class="metabolism-panel metabolism-map-preview" aria-labelledby="metabolism-map-heading">
                        <p class="metabolism-panel-kicker">Pathway Workspace</p>
                        <h2 id="metabolism-map-heading">Glycolysis Map</h2>
                        <div class="metabolism-map-placeholder" aria-hidden="true">
                            <span>1</span><i></i><span>2</span><i></i><span>3</span>
                        </div>
                        <p>
                            The enzyme-slot map and drag-and-drop tray arrive in later milestones. This preview is intentionally read-only.
                        </p>
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

        return true;

    },

    createPathwayCard(pathway) {

        const card = document.createElement(
            "article"
        );
        const requirement =
            pathway.unlockStatus;

        card.className = [
            "metabolism-pathway-card",
            pathway.available
                ? "metabolism-pathway-card--available"
                : "metabolism-pathway-card--locked"
        ].join(" ");

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
                Completed in Polymerizer · This product is not consumed
            </small>
        `;

        return card;

    }

};

export default MetabolismUI;
