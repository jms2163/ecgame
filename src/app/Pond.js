// --------------------------------------------------
// Pond.js
// Entry point and lifecycle for the Pond zone
// --------------------------------------------------

const Pond = {

    active: false,
    initialized: false,

    // Pond's default internal view is the microbiome / PondGrid
    currentView: 0,

    // --------------------------------------------------
    // Initialize Pond
    // Called once when Pond is first prepared
    // --------------------------------------------------
    initialize() {

        if (this.initialized) {
            console.log("Pond already initialized");
            return;
        }

        console.log("Pond.initialize() called");

        // Bind Pond's internal semantic zoom navigation
        this.bindZoomNavigation();

        this.initialized = true;

    },

    // --------------------------------------------------
    // Activate Pond
    // Called whenever Pond becomes the active game zone
    // --------------------------------------------------
    activate() {

        if (this.active) {
            console.log("Pond already active");
            return;
        }

        this.active = true;

        console.log("Pond.activate() called");

        // Pond always opens at its default microbiome view
        this.showView(0);

    },

    // --------------------------------------------------
    // Deactivate Pond
    // Called whenever another top-level zone becomes active
    // --------------------------------------------------
    deactivate() {

        if (!this.active) {
            return;
        }

        this.active = false;

        console.log("Pond.deactivate() called");

    },

    // --------------------------------------------------
    // Bind Pond's internal semantic zoom buttons
    // --------------------------------------------------
    bindZoomNavigation() {

        const zoomButtons = document.querySelectorAll(".zoom-tab");

        zoomButtons.forEach(button => {

            button.addEventListener("click", () => {

                const level = Number(button.dataset.level);

                this.showView(level);

            });

        });

    },

    // --------------------------------------------------
    // Change the active Pond semantic zoom level
    // --------------------------------------------------
    showView(level) {

        if (!this.active) {
            return;
        }

        const layers = [
            document.getElementById("zoom-layer-0"),
            document.getElementById("zoom-layer-1"),
            document.getElementById("zoom-layer-2")
        ];

        const buttons = [
            document.getElementById("btn-zoom-0"),
            document.getElementById("btn-zoom-1"),
            document.getElementById("btn-zoom-2")
        ];

        // Validate requested view
        if (!layers[level]) {
            console.warn(`Pond: unknown zoom level ${level}`);
            return;
        }

        // --------------------------------------------------
        // Show only the requested Pond view
        // --------------------------------------------------
        layers.forEach((layer, index) => {

            if (layer) {
                layer.classList.toggle("hidden", index !== level);
            }

        });

        // --------------------------------------------------
        // Update semantic zoom button state
        // --------------------------------------------------
        buttons.forEach((button, index) => {

            if (button) {
                button.classList.toggle("active", index === level);
            }

        });

        this.currentView = level;

        console.log(`Pond: switched to zoom level ${level}`);

    }

};

export default Pond;