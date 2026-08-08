// --------------------------------------------------
// TestZone.js
// Temporary zone used to test zone lifecycle
// --------------------------------------------------

const TestZone = {

    active: false,

    // --------------------------------------------------
    // Initialize Test Zone
    // --------------------------------------------------
    initialize() {

        console.log("TestZone.initialize() called");

    },

    // --------------------------------------------------
    // Activate Test Zone
    // --------------------------------------------------
    activate() {

        if (this.active) {
            console.log("TestZone already active");
            return;
        }

        this.active = true;

        console.log("TestZone.activate() called");

    },

    // --------------------------------------------------
    // Deactivate Test Zone
    // --------------------------------------------------
    deactivate() {

        if (!this.active) {
            return;
        }

        this.active = false;

        console.log("TestZone.deactivate() called");

    }

};

export default TestZone;