// --------------------------------------------------
// CellHealthCalculator.js
// Calculates biological cell health from cell-system state
// --------------------------------------------------

const LETHAL_THRESHOLD = 0.05;

const CellHealthCalculator = {

    // --------------------------------------------------
    // Keep a normalized value within 0.00 to 1.00
    // --------------------------------------------------
    clamp(value) {

        return Math.min(
            Math.max(value, 0),
            1
        );

    },

    // --------------------------------------------------
    // Read one required metric from supplied cell state
    // --------------------------------------------------
    getMetric(
        cellSystems,
        systemId,
        metricId
    ) {

        const value =
            cellSystems?.[systemId]?.[metricId];

        if (!Number.isFinite(value)) {
            throw new Error(
                `CellHealthCalculator: missing metric ` +
                `"${systemId}.${metricId}"`
            );
        }

        return this.clamp(value);

    },

    // --------------------------------------------------
    // Calculate one organelle/system average
    // --------------------------------------------------
    getSystemEfficiency(
        cellSystems,
        systemId
    ) {

        const system =
            cellSystems?.[systemId];

        if (!system) {
            console.warn(
                `CellHealthCalculator: unknown system "${systemId}"`
            );

            return null;
        }

        const values =
            Object.values(system);

        if (
            values.length === 0 ||
            !values.every(Number.isFinite)
        ) {
            console.warn(
                `CellHealthCalculator: invalid metrics for "${systemId}"`
            );

            return null;
        }

        const total =
            values.reduce(
                (sum, value) =>
                    sum + this.clamp(value),
                0
            );

        return total / values.length;

    },

    // --------------------------------------------------
    // Calculate the complete biological health report
    // --------------------------------------------------
    calculate(cellSystems) {

        // --------------------------------------------------
        // Core survival pillars
        // --------------------------------------------------

        const geneticIntegrity =
            (0.70 *
                this.getMetric(
                    cellSystems,
                    "nucleus",
                    "genomicStability"
                )) +
            (0.30 *
                this.getMetric(
                    cellSystems,
                    "ribosomes",
                    "fidelity"
                ));

        const atpProduction =
            (0.60 *
                this.getMetric(
                    cellSystems,
                    "mitochondria",
                    "atpSynthesisRate"
                )) +
            (0.40 *
                this.getMetric(
                    cellSystems,
                    "mitochondria",
                    "membranePotential"
                ));

        const membraneHealth =
            (0.40 *
                this.getMetric(
                    cellSystems,
                    "plasma_membrane",
                    "barrierIntegrity"
                )) +
            (0.30 *
                this.getMetric(
                    cellSystems,
                    "plasma_membrane",
                    "flexibility"
                )) +
            (0.30 *
                this.getMetric(
                    cellSystems,
                    "plasma_membrane",
                    "transportEfficiency"
                ));

        // --------------------------------------------------
        // Genetic Integrity
        // --------------------------------------------------

        const dnaProtection =
            (0.75 *
                this.getMetric(
                    cellSystems,
                    "nucleus",
                    "genomicStability"
                )) +
            (0.25 *
                this.getMetric(
                    cellSystems,
                    "smooth_endoplasmic_reticulum",
                    "detoxificationCapacity"
                ));

        // --------------------------------------------------
        // Metabolic Activity
        // --------------------------------------------------

        const nutrientProcessing =
            (0.40 *
                this.getMetric(
                    cellSystems,
                    "food_vacuole",
                    "digestiveEfficiency"
                )) +
            (0.40 *
                this.getMetric(
                    cellSystems,
                    "lysosomes",
                    "enzymaticActivity"
                )) +
            (0.20 *
                this.getMetric(
                    cellSystems,
                    "symbiosomes",
                    "nutrientExchange"
                ));

        const autophagy =
            (0.40 *
                this.getMetric(
                    cellSystems,
                    "autophagosome",
                    "sequestrationEfficiency"
                )) +
            (0.30 *
                this.getMetric(
                    cellSystems,
                    "autophagosome",
                    "lysosomeFusion"
                )) +
            (0.30 *
                this.getMetric(
                    cellSystems,
                    "lysosomes",
                    "enzymaticActivity"
                ));

        // --------------------------------------------------
        // Structural Integrity
        // --------------------------------------------------

        const cytoskeletonHealth =
            (0.60 *
                this.getMetric(
                    cellSystems,
                    "cytoskeleton",
                    "structuralSupportEfficiency"
                )) +
            (0.40 *
                this.getMetric(
                    cellSystems,
                    "cytoskeleton",
                    "intracellularTransportEfficiency"
                ));

        // --------------------------------------------------
        // Functional Activity
        // --------------------------------------------------

        const motility =
            (0.45 *
                this.getMetric(
                    cellSystems,
                    "cytoskeleton",
                    "pseudopodEfficiency"
                )) +
            (0.35 *
                this.getMetric(
                    cellSystems,
                    "plasma_membrane",
                    "flexibility"
                )) +
            (0.20 *
                this.getMetric(
                    cellSystems,
                    "smooth_endoplasmic_reticulum",
                    "calciumStorage"
                ));

        const phagocytosis =
            (0.40 *
                this.getMetric(
                    cellSystems,
                    "plasma_membrane",
                    "flexibility"
                )) +
            (0.30 *
                this.getMetric(
                    cellSystems,
                    "cytoskeleton",
                    "pseudopodEfficiency"
                )) +
            (0.30 *
                this.getMetric(
                    cellSystems,
                    "food_vacuole",
                    "vesicleFusion"
                ));

        const reproduction =
            (0.50 *
                this.getMetric(
                    cellSystems,
                    "nucleus",
                    "replicationEfficiency"
                )) +
            (0.25 *
                this.getMetric(
                    cellSystems,
                    "rough_endoplasmic_reticulum",
                    "proteinFolding"
                )) +
            (0.25 *
                this.getMetric(
                    cellSystems,
                    "mitochondria",
                    "atpSynthesisRate"
                ));

        // --------------------------------------------------
        // Environmental Response
        // --------------------------------------------------

        const pseudopodFormation =
            (0.40 *
                this.getMetric(
                    cellSystems,
                    "pseudopodia",
                    "extensionRate"
                )) +
            (0.30 *
                this.getMetric(
                    cellSystems,
                    "cytoskeleton",
                    "pseudopodEfficiency"
                )) +
            (0.30 *
                this.getMetric(
                    cellSystems,
                    "plasma_membrane",
                    "flexibility"
                ));

        const cellAdhesion =
            (0.50 *
                this.getMetric(
                    cellSystems,
                    "plasma_membrane",
                    "barrierIntegrity"
                )) +
            (0.50 *
                this.getMetric(
                    cellSystems,
                    "pseudopodia",
                    "adhesionStrength"
                ));

        const anchoring =
            (0.40 *
                this.getMetric(
                    cellSystems,
                    "cytoskeleton",
                    "structuralSupportEfficiency"
                )) +
            (0.30 *
                this.getMetric(
                    cellSystems,
                    "plasma_membrane",
                    "barrierIntegrity"
                )) +
            (0.30 *
                this.getMetric(
                    cellSystems,
                    "pseudopodia",
                    "adhesionStrength"
                ));

        const contractileVacuoleFunction =
            (0.40 *
                this.getMetric(
                    cellSystems,
                    "contractile_vacuole",
                    "pumpingEfficiency"
                )) +
            (0.40 *
                this.getMetric(
                    cellSystems,
                    "contractile_vacuole",
                    "osmoregulationCapacity"
                )) +
            (0.20 *
                this.getMetric(
                    cellSystems,
                    "smooth_endoplasmic_reticulum",
                    "calciumStorage"
                ));

        const encystmentAbility =
            (0.40 *
                this.getMetric(
                    cellSystems,
                    "plasma_membrane",
                    "barrierIntegrity"
                )) +
            (0.40 *
                this.getMetric(
                    cellSystems,
                    "cytoskeleton",
                    "structuralSupportEfficiency"
                )) +
            (0.20 *
                this.getMetric(
                    cellSystems,
                    "smooth_endoplasmic_reticulum",
                    "detoxificationCapacity"
                ));

        // --------------------------------------------------
        // Secondary operational average
        // --------------------------------------------------

        const secondaryMetrics = [
            nutrientProcessing,
            autophagy,
            cytoskeletonHealth,
            motility,
            phagocytosis,
            reproduction,
            pseudopodFormation,
            cellAdhesion,
            anchoring,
            contractileVacuoleFunction,
            encystmentAbility
        ];

        const operationalEfficiency =
            secondaryMetrics.reduce(
                (sum, value) => sum + value,
                0
            ) / secondaryMetrics.length;

        // --------------------------------------------------
        // Safety gate
        // --------------------------------------------------

        const lethalSystems = [];

        if (geneticIntegrity <= LETHAL_THRESHOLD) {
            lethalSystems.push(
                "genetic_integrity"
            );
        }

        if (atpProduction <= LETHAL_THRESHOLD) {
            lethalSystems.push(
                "atp_production"
            );
        }

        if (membraneHealth <= LETHAL_THRESHOLD) {
            lethalSystems.push(
                "membrane_health"
            );
        }

        const viable =
            lethalSystems.length === 0;

        // --------------------------------------------------
        // Composite Health Score
        // 75% core survival + 25% operations
        // --------------------------------------------------

        const compositeHealth =
            viable
                ? (
                    (0.25 * geneticIntegrity) +
                    (0.25 * atpProduction) +
                    (0.25 * membraneHealth) +
                    (0.25 * operationalEfficiency)
                )
                : 0;

        return {

            viable,

            lethalSystems,

            compositeHealth:
                this.clamp(compositeHealth),

            core: {
                geneticIntegrity,
                atpProduction,
                membraneHealth
            },

            geneticIntegrity: {

                // These are inverse risk values:
                // more integrity/protection means less damage.
                mutationRate:
                    1 - geneticIntegrity,

                dnaDamage:
                    1 - dnaProtection
            },

            metabolicActivity: {
                atpProduction,
                nutrientProcessing,
                autophagy
            },

            structuralIntegrity: {
                cellMembraneHealth:
                    membraneHealth,

                cytoskeleton:
                    cytoskeletonHealth
            },

            functionalActivity: {
                motility,
                phagocytosis,
                reproduction
            },

            environmentalResponse: {
                pseudopodFormation,
                cellAdhesion,
                anchoring,
                contractileVacuoleFunction,
                encystmentAbility
            }

        };

    }

};

export default CellHealthCalculator;