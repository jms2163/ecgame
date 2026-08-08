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

        switch (zoneName) {

            case "pond":
                this.currentZone = "pond";
                Pond.initialize();
                break;

            default:
                console.warn(`ZoneManager: unknown zone "${zoneName}"`);

        }

    }

};

export default ZoneManager;