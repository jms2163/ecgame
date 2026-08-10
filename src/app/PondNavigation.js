// --------------------------------------------------
// PondNavigation.js
// Controls navigation between Pond semantic views
// --------------------------------------------------

import PondGridView from "./PondGridView.js";
import CellView from "./CellView.js";
import OrganelleView from "./OrganelleView.js";
import GameStateManager from "./GameStateManager.js";

const PondNavigation = {

    initialized: false,
    currentView: null,

    // --------------------------------------------------
    // Initialize Pond Navigation
    // --------------------------------------------------
    initialize() {

        if (this.initialized) {
            console.log(
                "PondNavigation.initialize() skipped (already initialized)"
            );

            return;
        }

        console.log(
            "PondNavigation.initialize() called"
        );

        this.bindButtons();

        this.initialized = true;

    },

    // --------------------------------------------------
    // Bind semantic zoom buttons
    // --------------------------------------------------
    bindButtons() {

        const buttons = {
            0: document.getElementById(
                "btn-pond-grid"
            ),

            1: document.getElementById(
                "btn-cell"
            ),

            2: document.getElementById(
                "btn-organelle"
            )
        };

        Object.entries(buttons).forEach(
            ([level, button]) => {

                if (!button) {
                    console.warn(
                        `PondNavigation: button for view ${level} not found`
                    );

                    return;
                }

                button.addEventListener(
                    "click",
                    () => {

                        this.showView(
                            Number(level)
                        );

                    }
                );

            }
        );

    },

    // --------------------------------------------------
    // Open Organelle Lab focused on one feature
    // --------------------------------------------------
    showOrganelle(focusId) {

        if (
            typeof focusId !== "string" ||
            focusId.length === 0
        ) {
            console.warn(
                "PondNavigation: organelle focus ID is unavailable"
            );

            return;
        }

        this.showView(
            2,
            {
                focusId
            }
        );

    },

    // --------------------------------------------------
    // Show requested Pond view
    // --------------------------------------------------
    showView(
        level,
        options = {}
    ) {

        let nextView = null;

        switch (level) {

            case 0:

                nextView = PondGridView;
                break;

            case 1:

                case 1:

    nextView = CellView;

    options = {
        ...options,

        onFeatureSelected: feature => {

            if (!feature?.labFocusId) {
                console.warn(
                    "PondNavigation: selected Cell Map feature has no lab focus ID"
                );

                return;
            }

            this.showOrganelle(
                feature.labFocusId
            );

        }
    };

    break;

            case 2:

                nextView = OrganelleView;
                break;

            default:

                console.warn(
                    `PondNavigation: unknown view level ${level}`
                );

                return;

        }

        // --------------------------------------------------
        // Deactivate current semantic view
        // --------------------------------------------------

        if (this.currentView) {
            this.currentView.deactivate();
        }

        // --------------------------------------------------
        // Show requested DOM layer
        // --------------------------------------------------

        this.updateVisibleLayer(
            level
        );

        // --------------------------------------------------
        // Prepare and activate requested view
        // --------------------------------------------------

        nextView.initialize();

        nextView.activate(
            options
        );

        // --------------------------------------------------
        // Record active zoom level
        // --------------------------------------------------

        GameStateManager.setCurrentZoom(
            level
        );

        this.updateButtons(
            level
        );

        this.currentView = nextView;

        console.log(
            `PondNavigation: view ${level} is now active`
        );

    },

    // --------------------------------------------------
    // Synchronize breadcrumb button state
    // --------------------------------------------------
    updateButtons(activeLevel) {

        const buttons = {
            0: document.getElementById(
                "btn-pond-grid"
            ),

            1: document.getElementById(
                "btn-cell"
            ),

            2: document.getElementById(
                "btn-organelle"
            )
        };

        Object.entries(buttons).forEach(
            ([level, button]) => {

                if (!button) {
                    return;
                }

                const isActive =
                    Number(level) === activeLevel;

                button.classList.toggle(
                    "active",
                    isActive
                );

            }
        );

    },

    // --------------------------------------------------
    // Show one Pond semantic-view layer
    // --------------------------------------------------
    updateVisibleLayer(activeLevel) {

        const viewLayers = {
            0: "pond-grid-view",
            1: "cell-view",
            2: "organelle-view"
        };

        Object.entries(viewLayers).forEach(
            ([level, layerId]) => {

                const layer =
                    document.getElementById(
                        layerId
                    );

                if (!layer) {
                    console.warn(
                        `PondNavigation: layer "${layerId}" not found`
                    );

                    return;
                }

                const isActive =
                    Number(level) === activeLevel;

                layer.classList.toggle(
                    "hidden",
                    !isActive
                );

            }
        );

    }

};

export default PondNavigation;