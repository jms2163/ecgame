// --------------------------------------------------
// CellView.js
// Zoom Level 1 of the Pond zone
// Represents the individual cell view
// --------------------------------------------------

const CellView = {

    active: false,

    // --------------------------------------------------
    // Initialize the view
    // Called once when the view is first prepared
    // --------------------------------------------------
    initialize() {

        console.log("CellView.initialize() called");

    },

    // --------------------------------------------------
    // Activate the view
    // Called whenever Zoom Level 1 becomes active
    // --------------------------------------------------
    activate() {

        if (this.active) {
            return;
        }

        this.active = true;

        console.log("CellView.activate() called");

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

        console.log("CellView.deactivate() called");

    }

};

export default CellView;