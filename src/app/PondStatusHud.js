// --------------------------------------------------
// PondStatusHud.js
// Creates and updates Pond coordinate / ATP display
// --------------------------------------------------

const PondStatusHud = {

    coordinatesElement: null,  // Coordinate display
    atpElement: null,          // ATP display

    // --------------------------------------------------
    // Create Pond HUD
    // --------------------------------------------------
    create() {

        const statusElement =
            document.createElement("div");

        statusElement.id =
            "pond-status-hud";

        statusElement.setAttribute(
            "aria-label",
            "Pond status display"
        );

        this.coordinatesElement =
            document.createElement("span");

        this.coordinatesElement.id =
            "pond-coordinate-readout";

        const separatorElement =
            document.createElement("span");

        separatorElement.id =
            "pond-status-separator";

        separatorElement.textContent =
            "|";

        this.atpElement =
            document.createElement("span");

        this.atpElement.id =
            "pond-atp-readout";

        this.atpElement.textContent =
            "ATP: --/--";

        statusElement.append(
            this.coordinatesElement,
            separatorElement,
            this.atpElement
        );

        return statusElement;

    },

    // --------------------------------------------------
    // Update coordinate display
    // --------------------------------------------------
    render(position) {

        if (!this.coordinatesElement || !position) {
            return;
        }

        this.coordinatesElement.textContent =
            `COORD: ${position.x}, ${position.y}`;

    }

};

export default PondStatusHud;