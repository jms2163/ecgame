// --------------------------------------------------
// Atomizer.js
// Zone controller shell for Atomizer
// --------------------------------------------------

import AtomizerUI from "./AtomizerUI.js";
import AtomizerManager from "./AtomizerManager.js";

const Atomizer = {
    initialized: false,
    active: false,

    // In Atomizer.js
initialize() {
    if (this.initialized) return true;

    AtomizerManager.initialize();
    AtomizerUI.initialize();

    // Ensure container is hidden on initial boot
    const zoneEl = document.getElementById("atomizer-zone");
    if (zoneEl && !this.active) {
        zoneEl.classList.add("hidden");
    }

    this.initialized = true;
    return true;
},

    activate() {
        if (this.active) return;

        this.active = true;

        // Show zone container and render active state
        const zoneEl = document.getElementById("atomizer-zone");
        if (zoneEl) zoneEl.classList.remove("hidden");

        AtomizerManager.activate();
    },

    deactivate() {
        if (!this.active) return;

        this.active = false;

        // Hide zone container completely on tab switch
        const zoneEl = document.getElementById("atomizer-zone");
        if (zoneEl) zoneEl.classList.add("hidden");

        AtomizerManager.deactivate();
    }
};

export default Atomizer;