// --------------------------------------------------
// PondGridView.js
// Zoom Level 0 of the Pond zone
// Represents the microbiome / ecosystem view
// --------------------------------------------------

const PondGridView = {

    active: false,

    // --------------------------------------------------
    // Initialize the view
    // Called once when the view is first prepared
    // --------------------------------------------------
    initialize() {

        console.log("PondGridView.initialize() called");

    },

    // --------------------------------------------------
    // Activate the view
    // Called whenever Zoom Level 0 becomes active
    // --------------------------------------------------
    activate() {

        if (this.active) {
            return;
        }

        this.active = true;

        console.log("PondGridView.activate() called");

    },

    // --------------------------------------------------
    // Deactivate the view
    // Called whenever another semantic view becomes active
    // --------------------------------------------------
    deactivate() {

        if (!this.active) {
            return;
        }

        this.active = false;

        console.log("PondGridView.deactivate() called");

    }

};

export default PondGridView;