// --------------------------------------------------
// OrganelleView.js
// Zoom Level 2 of the Pond zone
// Represents the organelle view and study workspace
// --------------------------------------------------

import OrganelleExperimentPanel
    from "./OrganelleExperimentPanel.js";
import OrganelleExperimentStage
    from "./OrganelleExperimentStage.js";

const DEFAULT_ORGANELLE_ID =
    "plasma_membrane";

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

        OrganelleExperimentPanel.initialize();

        OrganelleExperimentStage.initialize();

        console.log(
            "OrganelleView.initialize() called"
        );

        this.initialized = true;

    },

    // --------------------------------------------------
    // Open one experiment on the stage
    // --------------------------------------------------
    openExperiment(experiment) {

        OrganelleExperimentStage.open(
            experiment
        );

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
            focusId ??
            DEFAULT_ORGANELLE_ID;

        // Temporary DOM reflection for inspection.
        element.dataset.focusId =
            this.focusedOrganelleId;

        OrganelleExperimentStage.clear();

        OrganelleExperimentPanel.render(
            this.focusedOrganelleId,
            {
                onOpenExperiment:
                    experiment =>
                        this.openExperiment(
                            experiment
                        )
            }
        );

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