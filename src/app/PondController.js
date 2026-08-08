// --------------------------------------------------
// PondController.js
// Coordinates Pond gameplay behavior
// --------------------------------------------------

import GameStateManager from "./GameStateManager.js";
import PondWorld from "./PondWorld.js";

const SENSING_RADIUS = 4;

const PondController = {

    // --------------------------------------------------
    // Ensure local Pond world exists around player
    // --------------------------------------------------
    initializeLocalWorld() {

        const world =
            GameStateManager.getPondWorld();

        const position =
            GameStateManager.getPondPosition();

        if (!world || !position) {

            console.warn(
                "PondController: Pond world or player position unavailable"
            );

            return;

        }

        PondWorld.ensureRegion(
            world,
            position.x,
            position.y,
            SENSING_RADIUS
        );

    },

    // --------------------------------------------------
    // Move Pond player
    // --------------------------------------------------
    movePlayer(dx, dy) {

        GameStateManager.movePondPlayer(
            dx,
            dy
        );

        this.initializeLocalWorld();

    }

};

export default PondController;