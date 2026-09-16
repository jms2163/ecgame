// --------------------------------------------------
// Polymerizer.js
// Zone lifecycle controller for the locked development preview.
// --------------------------------------------------

import PolymerizerManager
    from "./PolymerizerManager.js";
import PolymerizerUI
    from "./PolymerizerUI.js";

const Polymerizer = {

    initialized: false,
    active: false,

    initialize() {

        if (this.initialized) return true;

        PolymerizerManager.initialize();

        if (!PolymerizerUI.initialize()) {
            return false;
        }

        const root =
            document.getElementById(
                "polymerizer-zone"
            );

        if (root && !this.active) {
            root.classList.add("hidden");
        }

        this.initialized = true;
        return true;

    },

    activate() {

        if (!this.initialized &&
            !this.initialize()) {
            throw new Error(
                "Polymerizer could not initialize"
            );
        }

        if (this.active) return true;

        this.active = true;
        PolymerizerManager.activate();
        PolymerizerUI.activate();
        return true;

    },

    deactivate() {

        if (!this.active) return true;

        this.active = false;
        PolymerizerUI.deactivate();
        PolymerizerManager.deactivate();
        return true;

    },

    showView() {
        return false;
    }

};

export default Polymerizer;
