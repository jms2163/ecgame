// --------------------------------------------------
// MolecularLabManager.js
// Central coordinator for the Molecule Lab UI, Tech Tree,
// and synthesis workflows.
// --------------------------------------------------

import gameState from "./GameState.js";

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
    }
};

// Expose to global namespace for DevConsole testing
window.ECGame = window.ECGame || {};
window.ECGame.MolecularLabManager = MolecularLabManager;

export default MolecularLabManager;