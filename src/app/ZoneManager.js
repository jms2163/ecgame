// --------------------------------------------------
// ZoneManager.js
// Controls which game zone is currently active
// --------------------------------------------------

import Pond from "./Pond.js";
import GameStateManager from "./GameStateManager.js";
import TestZone from "./TestZone.js";

const ZoneManager = {

    currentZone: null,

    // --------------------------------------------------
    // Initialize Zone Manager
    // --------------------------------------------------
    initialize() {

        console.log("ZoneManager initialized");

    },

    // --------------------------------------------------
// Show active zone and hide inactive zones
// --------------------------------------------------
updateZoneVisibility(zoneId) {

    const zoneElements = {
        pond: document.getElementById("pond-zone"),
        test: document.getElementById("test-zone")
    };

    Object.entries(zoneElements).forEach(
        ([id, element]) => {

            if (!element) {
                console.warn(
                    `ZoneManager: DOM root for "${id}" not found`
                );

                return;
            }

            const isActive =
                id === zoneId;

            element.classList.toggle(
                "hidden",
                !isActive
            );

        }
    );

},

    // --------------------------------------------------
    // Enter a game zone
    // --------------------------------------------------
    enterZone(zoneId) {

        console.log(`ZoneManager: entering ${zoneId}`);

        // --------------------------------------------------
        // Identify requested zone
        // --------------------------------------------------
        let nextZone = null;

        switch (zoneId) {

            case "pond":
                nextZone = Pond;
                break;

            case "test":
                nextZone = TestZone;
                break;
            
            

            default:
                console.warn(`ZoneManager: unknown zone "${zoneId}"`);
                return;
        }

        // --------------------------------------------------
        // Deactivate current zone
        // --------------------------------------------------
        if (this.currentZone) {

            this.currentZone.deactivate();

        }

        // --------------------------------------------------
        // Initialize requested zone
        // --------------------------------------------------
        nextZone.initialize();
        // --------------------------------------------------
// Make requested zone visible
// --------------------------------------------------
this.updateZoneVisibility(zoneId);
        // --------------------------------------------------
        // Activate requested zone
        // --------------------------------------------------
        nextZone.activate();

        // --------------------------------------------------
        // Record active zone
        // --------------------------------------------------
        this.currentZone = nextZone;

        // --------------------------------------------------
        // Record zone in GameState
        // --------------------------------------------------
        GameStateManager.setCurrentZone(zoneId);

        console.log(`ZoneManager: ${zoneId} is now active`);

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
            console.warn(
                "ZoneManager: current zone does not support internal views"
            );
            return;
        }

        this.currentZone.showView(level);

    }

};

export default ZoneManager;