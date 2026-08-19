// --------------------------------------------------
// MolecularLab.js
// Zone controller shell for Molecular Lab
// --------------------------------------------------

import MolecularLabUI from "./MolecularLabUI.js";
import MolecularLabManager from "./MolecularLabManager.js";

const MolecularLab = {

    initialized: false,
    active: false,

    // --------------------------------------------------
    // Initialize Molecular Lab
    // --------------------------------------------------
    initialize() {
        if (this.initialized) {
            return true;
        }

        MolecularLabManager.initialize();
        MolecularLabUI.initialize();

        console.log("MolecularLab.initialize() called");

        this.initialized = true;
        return true;
    },

    // --------------------------------------------------
    // Activate Molecular Lab
    // --------------------------------------------------
    activate() {
        if (this.active) {
            console.log("MolecularLab already active");
            return;
        }

        this.active = true;
        console.log("MolecularLab.activate() called");
    },

    // --------------------------------------------------
    // Deactivate Molecular Lab
    // --------------------------------------------------
    deactivate() {
        if (!this.active) {
            return;
        }

        this.active = false;
        console.log("MolecularLab.deactivate() called");
    }
};

window.ECGame = window.ECGame || {};
window.ECGame.MolecularLab = MolecularLab;

export default MolecularLab;