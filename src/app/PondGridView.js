// --------------------------------------------------
// PondGridView.js
// Renders the Pond microbiome / grid view
// --------------------------------------------------

import gameState from "./GameState.js";

const PondGridView = {

    initialized: false,
    active: false,

    // --------------------------------------------------
    // Initialize
    // --------------------------------------------------
    initialize() {

        if (this.initialized) {
            return;
        }

        console.log("PondGridView.initialize() called");

        this.initialized = true;

    },

    // --------------------------------------------------
    // Activate
    // --------------------------------------------------
    activate() {

        if (this.active) {
            return;
        }

        this.active = true;

        console.log("PondGridView.activate() called");

        this.render();

    },

    // --------------------------------------------------
    // Deactivate
    // --------------------------------------------------
    deactivate() {

        if (!this.active) {
            return;
        }

        this.active = false;

        console.log("PondGridView.deactivate() called");

    },

    // --------------------------------------------------
    // Render Pond
    // --------------------------------------------------
    render() {

    const pondState = gameState.zones.pond.state;

    const { playerX, playerY } = pondState;

    console.log(
        `PondGridView: rendering player at (${playerX}, ${playerY})`
    );

    // Actual canvas/grid rendering will go here.

}

};

export default PondGridView;