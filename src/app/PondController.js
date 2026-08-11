// --------------------------------------------------
// PondController.js
// Coordinates Pond gameplay behavior
// --------------------------------------------------

import GameStateManager from "./GameStateManager.js";
import PondWorld from "./PondWorld.js";
import PondWorldGenerator from "./PondWorldGenerator.js";
import ResourceManager from "./ResourceManager.js";
import MicrobiomeLibrary from "./MicrobiomeLibrary.js";
import CellCapabilityEvaluator
    from "./CellCapabilityEvaluator.js";



const MICROSCOPE_VIEWPORT_RADIUS = 6;

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
            MICROSCOPE_VIEWPORT_RADIUS
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
// Check whether anchoring can be toggled
// --------------------------------------------------
canToggleAnchor() {

    if (
        GameStateManager.isPondPlayerAnchored()
    ) {
        return {
            allowed: true,
            action: "unanchor"
        };
    }

    const capabilities =
    CellCapabilityEvaluator.evaluate();

if (!capabilities.anchoring.available) {
    return {
        allowed: false,
        reason: "glycoproteins-locked"
    };
}

    const tile =
        this.getCurrentTile();

    if (!tile) {
        return {
            allowed: false,
            reason: "current-tile-unavailable"
        };
    }

    const substrateId =
        tile.microbiomes?.substrate;

    if (!substrateId) {
        return {
            allowed: false,
            reason: "no-anchorable-substrate"
        };
    }

    const substrate =
        MicrobiomeLibrary[substrateId];

    if (!substrate?.anchorable) {
        return {
            allowed: false,
            reason: "substrate-not-anchorable"
        };
    }

    return {
        allowed: true,
        action: "anchor",
        substrateId
    };

},

// --------------------------------------------------
// Anchor or unanchor the Pond player
// --------------------------------------------------
toggleAnchor() {

    const anchorCheck =
        this.canToggleAnchor();

    if (!anchorCheck.allowed) {

        console.warn(
            `PondController: cannot anchor (${anchorCheck.reason})`
        );

        return false;
    }

    const willAnchor =
        anchorCheck.action === "anchor";

    GameStateManager.setPondPlayerAnchored(
        willAnchor
    );

    console.log(
        willAnchor
            ? `PondController: anchored to ${anchorCheck.substrateId}`
            : "PondController: unanchored"
    );

    return true;

},

    // --------------------------------------------------
// Check whether manual movement is currently allowed
// --------------------------------------------------
canMove() {

    const capabilities =
    CellCapabilityEvaluator.evaluate();

if (!capabilities.manualMovement.available) {
    return {
        allowed: false,
        reason: "cytoskeleton-locked"
    };
}

    if (
        GameStateManager.isPondPlayerAnchored()
    ) {
        return {
            allowed: false,
            reason: "anchored"
        };
    }

    const atpCost =
        GameStateManager.getPondMovementATPCost();

    if (atpCost === null) {
        return {
            allowed: false,
            reason: "atp-cost-unavailable"
        };
    }

    if (
        !ResourceManager.canSpendATP(
            atpCost
        )
    ) {
        return {
            allowed: false,
            reason: "insufficient-atp"
        };
    }

    return {
        allowed: true,
        atpCost
    };

},

        // --------------------------------------------------
    // Move Pond player
    // --------------------------------------------------
    movePlayer(dx, dy) {

    const movementCheck =
        this.canMove();

    if (!movementCheck.allowed) {

        console.warn(
            `PondController: cannot move (${movementCheck.reason})`
        );

        return false;
    }

    const spentATP =
        ResourceManager.spendATP(
            movementCheck.atpCost
        );

    if (!spentATP) {

        console.warn(
            "PondController: ATP spending failed"
        );

        return false;
    }

    GameStateManager.movePondPlayer(
        dx,
        dy
    );

    this.initializeLocalWorld();

    return true;

}

};

export default PondController;