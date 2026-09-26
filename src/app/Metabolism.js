// --------------------------------------------------
// Metabolism.js
// Zone lifecycle controller for student-accessible pathways.
// --------------------------------------------------

import MetabolismManager
    from "./MetabolismManager.js";
import MetabolismUI
    from "./MetabolismUI.js";

const Metabolism = {

    initialized: false,
    active: false,

    initialize() {

        if (this.initialized) return true;

        MetabolismManager.initialize();

        if (!MetabolismUI.initialize()) {
            return false;
        }

        const root = document.getElementById(
            "metabolism-zone"
        );

        if (root && !this.active) {
            root.classList.add("hidden");
        }

        this.initialized = true;
        return true;

    },

    activate() {

        if (
            !this.initialized &&
            !this.initialize()
        ) {
            throw new Error(
                "Metabolism could not initialize"
            );
        }

        if (this.active) return true;

        this.active = true;
        MetabolismManager.activate();
        MetabolismUI.activate();
        return true;

    },

    deactivate() {

        if (!this.active) return true;

        this.active = false;
        MetabolismUI.deactivate();
        MetabolismManager.deactivate();
        return true;

    },

    showView() {
        return false;
    }

};

export default Metabolism;
