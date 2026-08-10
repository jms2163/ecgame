// --------------------------------------------------
// OrganelleView.js
// Zoom Level 2 of the Pond zone
// Represents the organelle view and study workspace
// --------------------------------------------------

const OrganelleView = {

    active: false,
    initialized: false,
    focusedOrganelleId: null,

    // --------------------------------------------------
    // Initialize Organelle Lab
    // --------------------------------------------------
    initialize() {

        if (this.initialized) {
            console.log(
                "OrganelleView.initialize() skipped (already initialized)"
            );

            return;
        }

        const element =
            document.getElementById(
                "organelle-view"
            );

        if (!element) {
            console.warn(
                "OrganelleView: DOM element #organelle-view not found"
            );

            return;
        }

        // PondNavigation owns layer visibility.
        element.style.removeProperty(
            "display"
        );

        console.log(
            "OrganelleView.initialize() called"
        );

        this.initialized = true;

    },

    // --------------------------------------------------
    // Activate Organelle Lab
    // --------------------------------------------------
    activate({
        focusId = null
    } = {}) {

        const element =
            document.getElementById(
                "organelle-view"
            );

        if (!element) {
            console.warn(
                "OrganelleView: DOM element #organelle-view not found"
            );

            return;
        }

        this.focusedOrganelleId =
            focusId;

        // Temporary DOM reflection for inspection.
        element.dataset.focusId =
            focusId ?? "";

        this.active = true;

        console.log(
            "OrganelleView.activate() called"
        );

    },

    // --------------------------------------------------
    // Read current Organelle Lab focus
    // --------------------------------------------------
    getFocusedOrganelleId() {

        return this.focusedOrganelleId;

    },

    // --------------------------------------------------
    // Deactivate Organelle Lab
    // --------------------------------------------------
    deactivate() {

        if (!this.active) {
            return;
        }

        this.active = false;

        console.log(
            "OrganelleView.deactivate() called"
        );

    }

};

export default OrganelleView;