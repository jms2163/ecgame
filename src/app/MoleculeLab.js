// --------------------------------------------------
// MoleculeLab.js
// Zone lifecycle controller for Molecule Lab.
// --------------------------------------------------

import MoleculeLabManager from "./MoleculeLabManager.js";
import MoleculeLabUI from "./MoleculeLabUI.js";

const MoleculeLab = {
    initialized: false,
    active: false,

    initialize() {
        if (this.initialized) return true;

        MoleculeLabManager.initialize();

        if (!MoleculeLabUI.initialize()) {
            return false;
        }

        const root = document.getElementById("molecule-lab-zone");
        if (root && !this.active) root.classList.add("hidden");

        this.initialized = true;
        console.log("MoleculeLab.initialize() called");
        return true;
    },

    activate() {
        if (!this.initialized && !this.initialize()) {
            throw new Error("MoleculeLab could not initialize");
        }
        if (this.active) return true;

        this.active = true;
        MoleculeLabManager.activate();
        MoleculeLabUI.activate();
        console.log("MoleculeLab.activate() called");
        return true;
    },

    deactivate() {
        if (!this.active) return true;

        this.active = false;
        MoleculeLabUI.deactivate();
        MoleculeLabManager.deactivate();
        console.log("MoleculeLab.deactivate() called");
        return true;
    },

    showView() {
        return false;
    }
};

window.ECGame = window.ECGame || {};
window.ECGame.MoleculeLab = MoleculeLab;

export default MoleculeLab;
