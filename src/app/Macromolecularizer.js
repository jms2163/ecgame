// --------------------------------------------------
// Macromolecularizer.js
// Zone lifecycle controller for the Macromolecularizer
// --------------------------------------------------

import MacromolecularizerManager
    from "./MacromolecularizerManager.js";
import MacromolecularizerUI
    from "./MacromolecularizerUI.js";

const Macromolecularizer = {

    initialized: false,
    active: false,

    // --------------------------------------------------
    // Initialize manager and UI once
    // --------------------------------------------------
    initialize() {

        if (this.initialized) {
            return true;
        }

        MacromolecularizerManager.initialize();

        if (!MacromolecularizerUI.initialize()) {
            return false;
        }

        const root =
            document.getElementById(
                "macromolecularizer-zone"
            );

        if (root && !this.active) {
            root.classList.add(
                "hidden"
            );
        }

        this.initialized = true;

        console.log(
            "Macromolecularizer.initialize() called"
        );

        return true;

    },

    // --------------------------------------------------
    // Activate the zone
    // --------------------------------------------------
    activate() {

        if (
            !this.initialized &&
            !this.initialize()
        ) {
            throw new Error(
                "Macromolecularizer could not initialize"
            );
        }

        if (this.active) {
            return true;
        }

        this.active = true;
        MacromolecularizerManager.activate();
        MacromolecularizerUI.activate();

        console.log(
            "Macromolecularizer.activate() called"
        );

        return true;

    },

    // --------------------------------------------------
    // Deactivate the zone
    // --------------------------------------------------
    deactivate() {

        if (!this.active) {
            return true;
        }

        this.active = false;
        MacromolecularizerUI.deactivate();
        MacromolecularizerManager.deactivate();

        console.log(
            "Macromolecularizer.deactivate() called"
        );

        return true;

    },

    showView() {

        return false;

    }

};

export default Macromolecularizer;
