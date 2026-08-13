// --------------------------------------------------
// QuantumZone.js
// Lifecycle entry point for the Quantum Field
// --------------------------------------------------

import SubatomicAssemblyManager
    from "./SubatomicAssemblyManager.js";
import SubatomicAssemblyUI
    from "./SubatomicAssemblyUI.js";

const QuantumZone = {

    initialized: false,
    active: false,

    initialize() {

        if (this.initialized) {
            return true;
        }

        SubatomicAssemblyManager
            .initialize();

        const uiInitialized =
            SubatomicAssemblyUI
                .initialize();

        if (!uiInitialized) {
            throw new Error(
                "QuantumZone: Subatomic Assembly UI failed to initialize"
            );
        }

        this.initialized = true;

        console.log(
            "QuantumZone.initialize() called"
        );

        return true;

    },

    activate() {

        if (this.active) {
            return true;
        }

        this.active = true;

        SubatomicAssemblyUI.activate();

        console.log(
            "QuantumZone.activate() called"
        );

        return true;

    },

    deactivate() {

        if (!this.active) {
            return true;
        }

        this.active = false;

        SubatomicAssemblyUI.deactivate();

        console.log(
            "QuantumZone.deactivate() called"
        );

        return true;

    }

};

export default QuantumZone;
