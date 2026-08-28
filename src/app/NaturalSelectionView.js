// --------------------------------------------------
// NaturalSelectionView.js
// Pond activity shell for selection investigations
// --------------------------------------------------

import NaturalSelectionSetupPanel
    from "./NaturalSelectionSetupPanel.js";
import NaturalSelectionPrototypeConfig
    from "./NaturalSelectionPrototypeConfig.js";
import NaturalSelectionSessionPanel
    from "./NaturalSelectionSessionPanel.js";

const NaturalSelectionView = {

    active: false,
    initialized: false,

    // --------------------------------------------------
    // Initialize the activity shell once
    // --------------------------------------------------
    initialize() {

        if (this.initialized) {
            console.log(
                "NaturalSelectionView.initialize() skipped (already initialized)"
            );

            return;
        }

        const element =
            document.getElementById(
                "natural-selection-view"
            );

        if (!element) {
            console.warn(
                "NaturalSelectionView: DOM element #natural-selection-view not found"
            );

            return;
        }

        // PondNavigation owns layer visibility.
        element.style.removeProperty(
            "display"
        );

        if (
            !NaturalSelectionSetupPanel
                .initialize()
        ) {
            return;
        }

        if (
            !NaturalSelectionSessionPanel
                .initialize()
        ) {
            return;
        }

        // Temporary prototype diagnostics only. Keep the
        // population/session engine module-private.
        globalThis.ECGame ??= {};
        globalThis.ECGame.NaturalSelection ??= {};

        globalThis.ECGame.NaturalSelection
            .prototypeConfig =
                NaturalSelectionPrototypeConfig;

        globalThis.ECGame.NaturalSelection
            .getSetupSnapshot =
                () => this.getSetupSnapshot();

        globalThis.ECGame.NaturalSelection
            .refreshSetup =
                () => NaturalSelectionSetupPanel
                    .render();

        this.initialized = true;

        console.log(
            "NaturalSelectionView.initialize() called"
        );

    },

    // --------------------------------------------------
    // Activate the Natural Selection activity
    // --------------------------------------------------
    activate() {

        const element =
            document.getElementById(
                "natural-selection-view"
            );

        if (!element) {
            console.warn(
                "NaturalSelectionView: DOM element #natural-selection-view not found"
            );

            return;
        }

        this.active = true;

        NaturalSelectionSetupPanel.render();
        NaturalSelectionSessionPanel.render();

        console.log(
            "NaturalSelectionView.activate() called"
        );

    },

    // --------------------------------------------------
    // Read the currently selected investigation setup
    // --------------------------------------------------
    getSetupSnapshot() {

        return NaturalSelectionSetupPanel
            .getSetupSnapshot();

    },

    // --------------------------------------------------
    // Deactivate the Natural Selection activity
    // --------------------------------------------------
    deactivate() {

        if (!this.active) {
            return;
        }

        this.active = false;

        console.log(
            "NaturalSelectionView.deactivate() called"
        );

    }

};

export default NaturalSelectionView;
