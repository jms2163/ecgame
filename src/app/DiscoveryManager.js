// --------------------------------------------------
// DiscoveryManager.js
// Records categorized scientific discoveries
// --------------------------------------------------

import gameState from "./GameState.js";
import GameStateObserver from "./GameStateObserver.js";
import ParticleInventoryManager from "./ParticleInventoryManager.js";

const DiscoveryManager = {
    
    /**
     * Records a discovery and handles base element progression rewards.
     * 
     * @param {string} type - A supported categorized-discovery bucket.
     * @param {string} id - The exact string identifier (e.g., "H", "He4", "H2O").
     */
    record(type, id) {
        
        const validTypes = [
            "atoms",
            "isotopes",
            "molecules",
            "reactions",
            "motifs"
        ];
        
        if (!validTypes.includes(type)) {
            console.error(`DiscoveryManager: Invalid discovery type "${type}". Must be one of: ${validTypes.join(", ")}`);
            return false;
        }

        if (
            typeof id !== "string" ||
            id.trim() === ""
        ) {
            console.error(
                "DiscoveryManager: Discovery ID must be a non-empty string."
            );

            return false;
        }

        const normalizedId = id.trim();

        // Safely ensure the top-level structure exists
        gameState.discoveries ??= {};
        gameState.discoveries.atoms ??= {};
        gameState.discoveries.isotopes ??= {};
        gameState.discoveries.molecules ??= {};
        gameState.discoveries.reactions ??= {};
        gameState.discoveries.motifs ??= {};

        const targetBucket = gameState.discoveries[type];
        const existingRecord =
            targetBucket[normalizedId];
        const isFirstTimeAtom =
            type === "atoms" &&
            !existingRecord;
        const isUniqueKnowledge =
            type === "reactions" ||
            type === "motifs";

        // Reactions and motifs are knowledge gates, not repeatable
        // collection counters. Re-recording them must be idempotent.
        if (
            isUniqueKnowledge &&
            existingRecord
        ) {
            return false;
        }

        // Create or update the discovery record
        if (!existingRecord) {
            targetBucket[normalizedId] = {
                discoveredAt: Date.now(),
                count: 1
            };
        } else {
            targetBucket[normalizedId].count += 1;
        }

        // Expand inventory capacity by +2 for every newly discovered element
        if (isFirstTimeAtom) {
            ParticleInventoryManager.increaseCapacity(2);
            console.log(`[DiscoveryManager] First-time element discovery (${normalizedId}): Particle capacity expanded by +2.`);
        }

        // Emit notification
        GameStateObserver.notify(
            "discovery-made",
            {
                type,
                id: normalizedId
            }
        );

        return true;
    }
};

export default DiscoveryManager;
