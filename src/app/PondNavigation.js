// --------------------------------------------------
// PondNavigation.js
// Controls navigation between Pond semantic views
// --------------------------------------------------


import PondGridView from "./PondGridView.js";
import CellView from "./CellView.js";
import OrganelleView from "./OrganelleView.js";
import GameStateManager from "./GameStateManager.js";


const PondNavigation = {

    currentView: null,

    // --------------------------------------------------
    // Initialize Pond Navigation
    // --------------------------------------------------
    initialize() {

    if (this.initialized) {
        console.log("PondNavigation.initialize() skipped (already initialized)");
        return;
    }

    console.log("PondNavigation.initialize() called");

    // Bind UI buttons for switching views
    this.bindButtons();

    this.initialized = true;
},


    // --------------------------------------------------
    // Bind semantic zoom buttons
    // --------------------------------------------------
    bindButtons() {

        const buttons = {
            0: document.getElementById("btn-pond-grid"),
            1: document.getElementById("btn-cell"),
            2: document.getElementById("btn-organelle")
    };


        Object.entries(buttons).forEach(([level, button]) => {

            if (!button) {

                console.warn(
                    `PondNavigation: button for view ${level} not found`
                );

                return;

            }

            button.addEventListener("click", () => {

                this.showView(Number(level));

            });

        });

    },

    // --------------------------------------------------
    // Show requested Pond view
    // --------------------------------------------------
    showView(level) {

        // ----------------------------------------------
        // Deactivate current view
        // ----------------------------------------------
        if (this.currentView) {

            this.currentView.deactivate();

        }

        // ----------------------------------------------
        // Identify requested view
        // ----------------------------------------------
        let nextView = null;

        switch (level) {

            case 0:

                nextView = PondGridView;
                break;

            case 1:

                nextView = CellView;
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

        // ----------------------------------------------
// Show requested DOM layer
// ----------------------------------------------
this.updateVisibleLayer(level);

        // ----------------------------------------------
// Initialize view if necessary
// ----------------------------------------------
nextView.initialize();

// ----------------------------------------------
// Activate requested view
// ----------------------------------------------
nextView.activate();

// ----------------------------------------------
// Record current zoom in GameState
// ----------------------------------------------
GameStateManager.setCurrentZoom(level);

// ----------------------------------------------
// Update breadcrumb button state
// ----------------------------------------------
this.updateButtons(level);

// ----------------------------------------------
// Record current view
// ----------------------------------------------
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
        0: document.getElementById("btn-pond-grid"),
        1: document.getElementById("btn-cell"),
        2: document.getElementById("btn-organelle")
    };


        Object.entries(buttons).forEach(([level, button]) => {

            if (!button) return;

            const isActive = Number(level) === activeLevel;

            button.classList.toggle("active", isActive);

        });

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
                document.getElementById(layerId);

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
},

};

export default PondNavigation;