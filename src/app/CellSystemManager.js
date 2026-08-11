// --------------------------------------------------
// CellSystemManager.js
// Reads and updates the player's biological cell systems
// --------------------------------------------------

import gameState from "./GameState.js";

const CellSystemManager = {

    // --------------------------------------------------
    // Read all player cell systems
    // --------------------------------------------------
    getAllSystems() {

        return structuredClone(
            gameState.cellSystems
        );

    },

    // --------------------------------------------------
    // Read one player cell system
    // --------------------------------------------------
    getSystem(systemId) {

        const system =
            gameState.cellSystems?.[systemId];

        if (!system) {
            console.warn(
                `CellSystemManager: unknown system "${systemId}"`
            );

            return null;
        }

        return {
            ...system
        };

    },

    // --------------------------------------------------
    // Update one player cell-system metric
    // --------------------------------------------------
    setMetric(
        systemId,
        metricId,
        value
    ) {

        const system =
            gameState.cellSystems?.[systemId];

        if (!system) {
            console.warn(
                `CellSystemManager: unknown system "${systemId}"`
            );

            return false;
        }

        if (!Object.hasOwn(system, metricId)) {
            console.warn(
                `CellSystemManager: unknown metric "${metricId}" for "${systemId}"`
            );

            return false;
        }

        if (!Number.isFinite(value)) {
            console.warn(
                "CellSystemManager: metric value must be a finite number"
            );

            return false;
        }

        system[metricId] =
            Math.min(
                Math.max(value, 0),
                1
            );

        return true;

    }

};

export default CellSystemManager;