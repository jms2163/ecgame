// --------------------------------------------------
// Pond.js
// Entry point and lifecycle for the Pond zone
// --------------------------------------------------

const Pond = {

    initialized: false,
    active: false,

    // --------------------------------------------------
    // Initialize Pond
    // Called once when the zone is first prepared
    // --------------------------------------------------
    initialize() {

        if (this.initialized) {
            console.log("Pond already initialized");
            return;
        }

        console.log("Pond.initialize() called");

        this.initialized = true;

    },

    // --------------------------------------------------
    // Activate Pond
    // Called whenever Pond becomes the active zone
    // --------------------------------------------------
    activate() {

        if (this.active) {
            console.log("Pond already active");
            return;
        }

        this.active = true;

        console.log("Pond.activate() called");

    },

    // --------------------------------------------------
    // Deactivate Pond
    // Called whenever another zone becomes active
    // --------------------------------------------------
    deactivate() {

        if (!this.active) {
            return;
        }

        this.active = false;

        console.log("Pond.deactivate() called");

    }

};

export default Pond;