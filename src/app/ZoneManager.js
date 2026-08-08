// --------------------------------------------------
// ZoneManager.js
// Controls which game zone is currently active
// --------------------------------------------------

import Pond from "./Pond.js";

const ZoneManager = {

    currentZone: null,

    // --------------------------------------------------
    // Initialize Zone Manager
    // --------------------------------------------------
    initialize() {

        console.log("ZoneManager initialized");

    },

    // --------------------------------------------------
    // Enter a game zone
    // --------------------------------------------------
    enterZone(zoneName) {

        console.log(`ZoneManager: entering ${zoneName}`);

        // --------------------------------------------------
        // If another zone is active, deactivate it first
        // --------------------------------------------------
        if (this.currentZone) {

            this.currentZone.deactivate();

        }

        // --------------------------------------------------
        // Identify requested zone
        // --------------------------------------------------
        let nextZone = null;

        switch (zoneName) {

            case "pond":

                nextZone = Pond;
                break;

            default:

                console.warn(`ZoneManager: unknown zone "${zoneName}"`);
                return;

        }

        // --------------------------------------------------
        // Initialize zone if necessary
        // --------------------------------------------------
        if (!nextZone.initialized) {

            nextZone.initialize();

        }

        // --------------------------------------------------
        // Activate requested zone
        // --------------------------------------------------
        nextZone.activate();

        // --------------------------------------------------
        // Record active zone
        // --------------------------------------------------
        this.currentZone = nextZone;

        console.log(`ZoneManager: ${zoneName} is now active`);

    },

    // --------------------------------------------------
    // Change the active view inside the current zone
    // --------------------------------------------------
    showView(level) {

        if (!this.currentZone) {
            console.warn("ZoneManager: no active zone");
            return;
        }

        if (typeof this.currentZone.showView !== "function") {
            console.warn("ZoneManager: current zone does not support internal views");
            return;
        }

        this.currentZone.showView(level);

    }

};

export default ZoneManager;