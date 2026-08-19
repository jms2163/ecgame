// --------------------------------------------------
// MolecularLabManager.js
// Central coordinator for the Molecule Lab UI, Tech Tree,
// and synthesis workflows.
// --------------------------------------------------

import gameState from "./GameState.js";
import DiscoveryManager from "./DiscoveryManager.js";
import GameStateManager from "./GameStateManager.js";

const MolecularLabManager = {
    /**
     * Module initialization shell
     */
    initialize() {
        console.log("[MolecularLabManager] Shell initialized.");
    },

    /**
     * Safely inspects current count for a specific atom symbol from Atomizer state.
     * @param {string} symbol - e.g., "H", "C", "O", "N", "P", "S"
     * @returns {number} Current atom count
     */
    getAtomCount(symbol) {
        return gameState.zones?.atomizer?.state?.atoms?.[symbol]?.count ?? 0;
    },

    /**
     * Gets a list of all discovered molecule IDs from DiscoveryManager state.
     * @returns {string[]} Array of discovered molecule IDs (e.g., ["H2O", "CO2"])
     */
    getDiscoveredMolecules() {
        return Object.keys(gameState.discoveries?.molecules || {});
    },

    /**
     * Checks if a specific molecule ID has been discovered.
     * @param {string} moleculeId - e.g., "H2O"
     * @returns {boolean}
     */
    isMoleculeDiscovered(moleculeId) {
        return !!gameState.discoveries?.molecules?.[moleculeId];
    },

    /**
     * Records a newly discovered molecule using DiscoveryManager authority.
     * @param {string} moleculeId - e.g., "H2O"
     * @returns {boolean} Success status of the recording
     */
    recordMoleculeDiscovery(moleculeId) {
        if (!moleculeId) return false;
        return DiscoveryManager.record("molecules", moleculeId);
    },

    /**
     * Consumes one atom of the specified symbol from the Atomizer inventory.
     * @param {string} symbol - e.g., "H", "O"
     * @returns {boolean} True if successfully consumed, false if insufficient resources
     */
    consumeAtom(symbol) {
        const atom = gameState.zones?.atomizer?.state?.atoms?.[symbol];
        if (!atom || atom.count <= 0) {
            console.warn(`[MolecularLabManager] Insufficient atom count for symbol: ${symbol}`);
            return false;
        }

        atom.count -= 1;

        // Persist update via GameStateManager if save/notification handling is needed
        if (GameStateManager && typeof GameStateManager.save === "function") {
            GameStateManager.save();
        }

        return true;
    }
};



export default MolecularLabManager;