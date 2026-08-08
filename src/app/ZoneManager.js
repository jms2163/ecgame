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
        `≠`≠nextZone.activate();

        // --------------------------------------------------
        // Record active zone
        // --------------------------------------------------
        this.currentZone = nextZone;

        console.log(`ZoneManager: ${zoneName} is now active`);

    }

};

export default ZoneManager;