// --------------------------------------------------
// OrganelleView.js
// Zoom Level 2 of the Pond zone
// Represents the organelle view and study workspace
// --------------------------------------------------

const OrganelleView = {

    active: false,

    // --------------------------------------------------
    // Initialize the view
    // Called once when the view is first prepared
    // --------------------------------------------------
    initialize() {

        console.log("OrganelleView.initialize() called");

    },

    // --------------------------------------------------
    // Activate the view
    // Called whenever Zoom Level 2 becomes active
    // --------------------------------------------------
    activate() {

        if (this.active) {
            return;
        }

        this.active = true;

        console.log("OrganelleView.activate() called");

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

        console.log("OrganelleView.deactivate() called");

    }

};

export default OrganelleView;