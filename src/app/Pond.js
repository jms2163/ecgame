// --------------------------------------------------
// Pond.js
// Entry point and lifecycle for the Pond zone
// --------------------------------------------------

import PondNavigation from "./PondNavigation.js";
import gameState from "./GameState.js";

const Pond = {

    active: false,

    // --------------------------------------------------
    // Initialize Pond
    // --------------------------------------------------
    initialize() {


        PondNavigation.initialize();

    },

    // --------------------------------------------------
    // Activate Pond
    // --------------------------------------------------
    activate() {

    if (this.active) {
        console.log("Pond already active");
        return;
    }

    this.active = true;

    console.log("Pond.activate() called");

    const currentZoom = gameState.player.currentZoom ?? 0;

    PondNavigation.showView(currentZoom);

},

    // --------------------------------------------------
    // Deactivate Pond
    // --------------------------------------------------
    deactivate() {

        if (!this.active) {
            return;
        }

        this.active = false;

        console.log("Pond.deactivate() called");

        if (PondNavigation.currentView) {

            PondNavigation.currentView.deactivate();

            PondNavigation.currentView = null;

        }

    }

};

export default Pond;