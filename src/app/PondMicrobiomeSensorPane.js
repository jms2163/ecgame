// --------------------------------------------------
// PondMicrobiomeSensorPane.js
// Updates Microbiome sensor-pane readouts
// --------------------------------------------------

import MicrobiomeLibrary from "./MicrobiomeLibrary.js";

const PondMicrobiomeSensorPane = {

    microbiomeElement: null,

    // --------------------------------------------------
    // Find sensor-pane display elements
    // --------------------------------------------------
    initialize() {

        if (this.microbiomeElement) {
            return;
        }

        this.microbiomeElement =
            document.getElementById(
                "pond-current-microbiome"
            );

        if (!this.microbiomeElement) {
            console.warn(
                "PondMicrobiomeSensorPane: current microbiome display not found"
            );
        }

    },

    // --------------------------------------------------
    // Update current microbiome readout
    // --------------------------------------------------
    render(tile) {

        this.initialize();

        if (!this.microbiomeElement) {
            return;
        }

        const profile =
            tile?.biome
                ? MicrobiomeLibrary[tile.biome]
                : null;

        this.microbiomeElement.textContent =
            profile?.name ?? "Undetermined";

    }

};

export default PondMicrobiomeSensorPane;