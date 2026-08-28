// --------------------------------------------------
// NaturalSelectionView.js
// Pond activity shell for selection investigations
// --------------------------------------------------

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

        console.log(
            "NaturalSelectionView.activate() called"
        );

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
