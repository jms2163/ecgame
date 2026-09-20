// --------------------------------------------------
// Signaling.js
// Zone lifecycle controller for the console-locked foundation shell.
// --------------------------------------------------

import SignalingManager
    from "./SignalingManager.js";
import SignalingUI
    from "./SignalingUI.js";

const Signaling = {

    initialized: false,
    active: false,

    initialize() {
        if (this.initialized) return true;

        SignalingManager.initialize();

        if (!SignalingUI.initialize()) {
            return false;
        }

        const root =
            document.getElementById(
                "signaling-zone"
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
                "Signaling could not initialize"
            );
        }

        if (this.active) return true;

        this.active = true;
        SignalingManager.activate();
        SignalingUI.activate();
        return true;
    },

    deactivate() {
        if (!this.active) return true;

        this.active = false;
        SignalingUI.deactivate();
        SignalingManager.deactivate();
        return true;
    },

    showView() {
        return false;
    }

};

export default Signaling;
