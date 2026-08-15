// --------------------------------------------------
// DiscoveryManager.js
// Records discoveries of atoms, isotopes, and molecules
// --------------------------------------------------

import gameState from "./GameState.js";
import GameStateObserver from "./GameStateObserver.js";

const DiscoveryManager = {
    
    /**
     * Records a discovery without triggering inventory changes, XP, or quests.
     * 
     * @param {string} type - Must be "atoms", "isotopes", or "molecules".
     * @param {string} id - The exact string identifier (e.g., "H", "He4", "H2O").
     */
    record(type, id) {
        
        const validTypes = ["atoms", "isotopes", "molecules"];
        
        if (!validTypes.includes(type)) {
            console.error(`DiscoveryManager: Invalid discovery type "${type}". Must be one of: ${validTypes.join(", ")}`);
            return false;
        }

        // Safely ensure the top-level structure exists
        gameState.discoveries ??= {};
        gameState.discoveries.atoms ??= {};
        gameState.discoveries.isotopes ??= {};
        gameState.discoveries.molecules ??= {};

        const targetBucket = gameState.discoveries[type];

        // Create or update the discovery record
        if (!targetBucket[id]) {
            targetBucket[id] = {
                discoveredAt: Date.now(),
                count: 1
            };
        } else {
            targetBucket[id].count += 1;
        }

        // Emit notification
        GameStateObserver.notify("discovery-made", { type, id });

        return true;
    }
};

export default DiscoveryManager;