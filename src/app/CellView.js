// --------------------------------------------------
// CellView.js
// Zoom Level 1 of the Pond zone
// Represents the individual cell view
// --------------------------------------------------

const CellView = {

    active: false,
    initialized: false,

    // --------------------------------------------------
    // Initialize the view
    // Called once when the view is first prepared
    // --------------------------------------------------
    initialize() {

    if (this.initialized) {
        return;
    }

    console.log("CellView.initialize() called");

    this.initialized = true;

},

    // --------------------------------------------------
    // Activate the view
    // Called whenever Zoom Level 1 becomes active
    // --------------------------------------------------
    activate() {

        if (this.active) {
            return;
        }

        const element = document.getElementById("cell-view");

        if (!element) {
            console.warn("CellView: DOM element #cell-view not found");
            return;
        }

        element.style.display = "block";

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

    const element = document.getElementById("cell-view");

    if (element) {
        element.style.display = "none";
    }

    this.active = false;

    console.log("CellView.deactivate() called");
}


};

export default CellView;