const PondGridView = {

    active: false,
    initialized: false,

    initialize() {

    if (this.initialized) {
        return;
    }

    console.log("PondGridView.initialize() called");

    this.initialized = true;

},

    activate() {

        if (this.active) {
            return;
        }

        const element = document.getElementById("pond-grid-view");

        if (!element) {
            console.warn("PondGridView: DOM element #pond-grid-view not found");
            return;
        }

        element.style.display = "block";

        this.active = true;

        console.log("PondGridView.activate() called");

    },

    deactivate() {

        if (!this.active) {
            return;
        }

        const element = document.getElementById("pond-grid-view");

        if (element) {
            element.style.display = "none";
        }

        this.active = false;

        console.log("PondGridView.deactivate() called");

    }

};

export default PondGridView;