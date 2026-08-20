// --------------------------------------------------
// CellCapabilityEvaluator.js
// Evaluates player cell capabilities from discoveries
// --------------------------------------------------

import GameStateManager from "./GameStateManager.js";

const CellCapabilityEvaluator = {

    // --------------------------------------------------
    // Read current cell capability availability
    // --------------------------------------------------
    evaluate() {

        const pseudopodsAvailable =
            GameStateManager.hasDiscovery(
                "cytoskeleton"
            );

        const cellAdhesionAvailable =
            GameStateManager.hasDiscovery(
                "glycoproteins"
            );

        return {

            pseudopodFormation: {
                available:
                    pseudopodsAvailable,

                requiredDiscovery:
                    "cytoskeleton"
            },

            manualMovement: {
                available:
                    pseudopodsAvailable,

                requiredDiscovery:
                    "cytoskeleton"
            },

            cellAdhesion: {
                available:
                    cellAdhesionAvailable,

                requiredDiscovery:
                    "glycoproteins"
            },

            anchoring: {
                available:
                    cellAdhesionAvailable,

                requiredDiscovery:
                    "glycoproteins"
            }

        };

    }

};

export default CellCapabilityEvaluator;