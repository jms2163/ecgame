// --------------------------------------------------
// MoleculeLab.js
// Zone controller shell for Molecule Lab
// --------------------------------------------------

import MoleculeLabUI from "./MoleculeLabUI.js";
import MoleculeLabManager from "./MoleculeLabManager.js";

const MoleculeLab = {

    initialized: false,
    active: false,

    // --------------------------------------------------
    // Initialize Molecule Lab
    // --------------------------------------------------
    initialize() {
        if (this.initialized) {
            return true;
        }

        MoleculeLabManager.initialize();
        MoleculeLabUI.initialize();

        console.log("MoleculeLab.initialize() called");

        this.initialized = true;
        return true;
    },

    // --------------------------------------------------
    // Activate Molecule Lab
    // --------------------------------------------------
    activate() {
        if (this.active) {
            console.log("MoleculeLab already active");
            return;
        }

        this.active = true;
        console.log("MoleculeLab.activate() called");
    },

    // --------------------------------------------------
    // Deactivate Molecule Lab
    // --------------------------------------------------
    deactivate() {
        if (!this.active) {
            return;
        }

        this.active = false;
        console.log("MoleculeLab.deactivate() called");
    }
};

window.ECGame = window.ECGame || {};
window.ECGame.MoleculeLab = MoleculeLab;

export default MoleculeLab;