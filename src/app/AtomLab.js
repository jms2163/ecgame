// --------------------------------------------------
// AtomLab.js
// Zone controller shell for Atom Lab
// --------------------------------------------------

import AtomLabUI from "./AtomLabUI.js";
import AtomLabManager from "./AtomLabManager.js";


const AtomLab = {

    initialized: false,
    active: false,

    // --------------------------------------------------
    // Initialize Atom Lab
    // --------------------------------------------------
    initialize() {

        if (this.initialized) {
            return true;
        }

        AtomLabManager.initialize();
        AtomLabUI.initialize();

        console.log("AtomLab.initialize() called");

        // UI will be created later in AtomLabUI.initialize()
        // Gameplay will be added later in AtomLabManager.initialize()

        this.initialized = true;
        return true;
    },

    // --------------------------------------------------
    // Activate Atom Lab
    // --------------------------------------------------
    activate() {

        if (this.active) {
            console.log("AtomLab already active");
            return;
        }

        this.active = true;

        console.log("AtomLab.activate() called");

        // UI activation will be added later
        // Rendering activation will be added later
        // Gameplay activation will be added later
    },

    // --------------------------------------------------
    // Deactivate Atom Lab
    // --------------------------------------------------
    deactivate() {

        if (!this.active) {
            return;
        }

        this.active = false;
        


        console.log("AtomLab.deactivate() called");

        // UI teardown will be added later
        // Rendering teardown will be added later
        // Gameplay teardown will be added later
    }

};

export default AtomLab;
