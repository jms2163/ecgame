// --------------------------------------------------
// PondController.js
// Coordinates Pond gameplay behavior
// --------------------------------------------------

import GameStateManager from "./GameStateManager.js";
import PondWorld from "./PondWorld.js";
import PondWorldGenerator from "./PondWorldGenerator.js";

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



    let seed =
    GameStateManager.getPondWorldSeed();

if (seed === null || seed === undefined) {

    seed =
        Math.floor(
            Math.random() * 0xFFFFFFFF
        );

    GameStateManager.setPondWorldSeed(seed);

}

PondWorldGenerator.configure(seed);

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
// Get Tile Currently Occupied by Player
// --------------------------------------------------
getCurrentTile() {

    const world =
        GameStateManager.getPondWorld();

    const position =
        GameStateManager.getPondPosition();

    if (!world || !position) {

        console.warn(
            "PondController: Pond world or player position unavailable"
        );

        return null;

    }

    return PondWorld.getOrCreateTile(
        world,
        position.x,
        position.y
    );

},

// --------------------------------------------------
// Get Current Environmental Readings
// --------------------------------------------------
getCurrentEnvironment() {

    const tile = this.getCurrentTile();

    if (!tile) {
        return null;
    }

    return {

        biome: tile.biome,

        physics: {
            temperature: tile.physics.temperature,
            light: tile.physics.light,
            oxygen: tile.physics.oxygen,
            ph: tile.physics.ph,
            osmolarity: 0.1,
            pressure: tile.physics.pressure,
            uv: tile.physics.uv
        },

        chemistry: {
            nutrients: {
                glucose: tile.chemistry.nutrients.glucose,
                nitrates: tile.chemistry.nutrients.nitrates,
                phosphates: tile.chemistry.nutrients.phosphates
            },

            toxins: {
                h2o2: tile.chemistry.toxins.h2o2,
                ammonia: tile.chemistry.toxins.ammonia
            },

            buffers: {
                bicarbonate: tile.chemistry.buffers.bicarbonate
            }
        }

    };

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