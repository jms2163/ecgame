// --------------------------------------------------
// OrganelleView.js
// Zoom Level 2 of the Pond zone
// Represents the organelle view and study workspace
// --------------------------------------------------

const OrganelleView = {

    active: false,
    initialized: false,

    // --------------------------------------------------
    // Initialize the view
    // Called once when the view is first prepared
    // --------------------------------------------------
    initialize() {

    if (this.initialized) {
        console.log("OrganelleView.initialize() skipped (already initialized)");
        return;
    }

    console.log("OrganelleView.initialize() called");

    this.initialized = true;
},

    // --------------------------------------------------
    // Activate the view
    // Called whenever Zoom Level 2 becomes active
    // --------------------------------------------------
    activate() {

        if (this.active) {
            return;
        }

        const element = document.getElementById("organelle-view");

        if (!element) {
            console.warn("OrganelleView: DOM element #organelle-view not found");
            return;
        }

        element.style.display = "block";

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

    const element = document.getElementById("organelle-view");

    if (element) {
        element.style.display = "none";
    }

    this.active = false;

    console.log("OrganelleView.deactivate() called");
}


};

export default OrganelleView;