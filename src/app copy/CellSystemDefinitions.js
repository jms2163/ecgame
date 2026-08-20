// --------------------------------------------------
// CellSystemDefinitions.js
// Creates the starting biological systems for a new cell
// --------------------------------------------------

import CellBalanceConfig from "./CellBalanceConfig.js";

const CellSystemDefinitions = {

    // --------------------------------------------------
    // Create a fresh starting cell-system state
    // --------------------------------------------------
    createStartingCellSystems() {

        const base =
            CellBalanceConfig.startingEfficiency;

        return {

            plasma_membrane: {
                transportEfficiency: base,
                flexibility: base,
                barrierIntegrity: base
            },

            nucleus: {
                genomicStability: base,
                replicationEfficiency: base,
                transcriptionRate: base
            },

            contractile_vacuole: {
                pumpingEfficiency: base,
                osmoregulationCapacity: base
            },

            food_vacuole: {
                digestiveEfficiency: base,
                vesicleFusion: base
            },

            mitochondria: {
                atpSynthesisRate: base,
                membranePotential: base
            },

            golgi_apparatus: {
                proteinSorting: base,
                glycosylationEfficiency: base
            },

            rough_endoplasmic_reticulum: {
                proteinFolding: base,
                translationAssistance: base
            },

            smooth_endoplasmic_reticulum: {
                lipidSynthesis: base,
                detoxificationCapacity: base,
                calciumStorage: base
            },

            ribosomes: {
                translationEfficiency: base,
                fidelity: base
            },

            cytoskeleton: {
                pseudopodEfficiency:
                    base * 0.67,

                structuralSupportEfficiency:
                    base * 0.67,

                intracellularTransportEfficiency:
                    base * 0.33
            },

            pseudopodia: {
                extensionRate: base,
                adhesionStrength: base
            },

            lysosomes: {
                enzymaticActivity: base,
                acidificationRate: base
            },

            symbiosomes: {
                symbiontMaintenance: base,
                nutrientExchange: base
            },

            endosome: {
                traffickingEfficiency: base,
                sortingCapacity: base
            },

            autophagosome: {
                sequestrationEfficiency: base,
                lysosomeFusion: base
            }

        };

    }

};

export default CellSystemDefinitions;