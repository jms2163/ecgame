// --------------------------------------------------
// CellView.js
// Zoom Level 1 of the Pond zone
// Represents the individual cell view
// --------------------------------------------------
import CellMapView from "./CellMapView.js";

const CellView = {

    active: false,
    initialized: false,

    // --------------------------------------------------
    // Initialize Cell View
    // --------------------------------------------------
    initialize() {

        if (this.initialized) {
            console.log(
                "CellView.initialize() skipped (already initialized)"
            );

            return;
        }

        console.log(
            "CellView.initialize() called"
        );

        this.initialized = true;

    },

    // --------------------------------------------------
    // Activate Cell View
    // --------------------------------------------------
    activate() {
        this.active = true;
        CellMapView.render();

        if (this.active) {
            return;
        }

        const element =
            document.getElementById(
                "cell-view"
            );

        if (!element) {
            console.warn(
                "CellView: DOM element #cell-view not found"
            );

            return;
        }

        this.active = true;

        console.log(
            "CellView.activate() called"
        );

    },

    // --------------------------------------------------
    // Deactivate Cell View
    // --------------------------------------------------
    deactivate() {

        if (!this.active) {
            return;
        }

        this.active = false;

        console.log(
            "CellView.deactivate() called"
        );

    }

};

export default CellView;