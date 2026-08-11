// --------------------------------------------------
// CellConditionCalculator.js
// Combines intrinsic cell health with current environment
// --------------------------------------------------

import CellEnvironmentBalanceConfig
    from "./CellEnvironmentBalanceConfig.js";

const LETHAL_THRESHOLD = 0.05;

const CellConditionCalculator = {

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
    // Calculate effective current cell performance
    // --------------------------------------------------
    calculate(
        baseReport,
        environmentReport
    ) {

        if (!baseReport || !environmentReport) {
            throw new Error(
                "CellConditionCalculator: base and environment reports are required"
            );
        }

        const {
            temperatureSuitability,
            phSuitability,
            oxygenAvailability,
            flowSuitability,
            chemicalToxicityPenalty,
            capsularRatio
        } =
            environmentReport.modifiers;

        const {
            stressIndex,
            encystmentPressure
        } =
            environmentReport.stress;

        const {
            salinity,
            doc
        } =
            environmentReport.conditions;

        const toxicityProtection =
            1 - chemicalToxicityPenalty;

        // --------------------------------------------------
        // Core survival pillars
        // --------------------------------------------------

        const geneticIntegrity =
            baseReport.core.geneticIntegrity;

        const atpProduction =
            this.clamp(
                baseReport.core.atpProduction *
                oxygenAvailability *
                temperatureSuitability *
                toxicityProtection
            );

        const membraneHealth =
            this.clamp(
                baseReport.core.membraneHealth *
                phSuitability *
                toxicityProtection
            );

        // --------------------------------------------------
        // Genetic Integrity
        // DNA damage is a displayed current risk, not a
        // component of composite health.
        // --------------------------------------------------

        const mutationRate =
            baseReport.geneticIntegrity
                .mutationRate;

        const dnaDamage =
            this.clamp(
                baseReport.geneticIntegrity
                    .dnaDamage +
                (
                    0.30 *
                    chemicalToxicityPenalty
                ) +
                (
                    0.10 *
                    (
                        1 - phSuitability
                    )
                )
            );

        // --------------------------------------------------
        // Metabolic Activity
        // --------------------------------------------------

        const nutrientProcessingBonus =
            Math.min(
                CellEnvironmentBalanceConfig
                    .doc
                    .maximumBonus,

                doc *
                CellEnvironmentBalanceConfig
                    .doc
                    .scale
            );

        const nutrientProcessing =
            this.clamp(
                baseReport.metabolicActivity
                    .nutrientProcessing *
                temperatureSuitability *
                (
                    1 +
                    nutrientProcessingBonus
                )
            );

        const autophagy =
            this.clamp(
                baseReport.metabolicActivity
                    .autophagy *
                (
                    1 +
                    (
                        0.50 *
                        stressIndex
                    )
                )
            );

        // --------------------------------------------------
        // Structural Integrity
        // --------------------------------------------------

        const cytoskeleton =
            baseReport.structuralIntegrity
                .cytoskeleton;

        // --------------------------------------------------
        // Functional Activity
        // --------------------------------------------------

        const motility =
            this.clamp(
                baseReport.functionalActivity
                    .motility *
                temperatureSuitability *
                flowSuitability *
                (
                    0.30 +
                    (
                        0.70 *
                        atpProduction
                    )
                )
            );

        const phagocytosis =
            this.clamp(
                baseReport.functionalActivity
                    .phagocytosis *
                temperatureSuitability *
                phSuitability *
                (
                    1 - capsularRatio
                )
            );

        const reproduction =
            this.clamp(
                baseReport.functionalActivity
                    .reproduction *
                atpProduction *
                temperatureSuitability *
                phSuitability *
                toxicityProtection
            );

        // --------------------------------------------------
        // Environmental Response
        // --------------------------------------------------

        const pseudopodFormation =
            this.clamp(
                baseReport.environmentalResponse
                    .pseudopodFormation *
                temperatureSuitability *
                flowSuitability
            );

        const cellAdhesion =
            this.clamp(
                baseReport.environmentalResponse
                    .cellAdhesion *
                flowSuitability
            );

        // Anchoring capacity is not set to zero in water.
        // Substrate availability is handled separately.
        const anchoring =
            this.clamp(
                baseReport.environmentalResponse
                    .anchoring *
                flowSuitability
            );

        const salinitySuitability =
            Math.max(
                0,
                1 -
                (
                    salinity * 25
                )
            );

        const contractileVacuoleFunction =
            this.clamp(
                baseReport.environmentalResponse
                    .contractileVacuoleFunction *
                salinitySuitability *
                (
                    0.20 +
                    (
                        0.80 *
                        atpProduction
                    )
                )
            );

        // Stress creates pressure to encyst. It does not
        // improve the cell's permanent encystment ability.
        const encystmentAbility =
            baseReport.environmentalResponse
                .encystmentAbility;

        // --------------------------------------------------
        // Effective composite health score
        // 75% core survival + 25% operations
        // --------------------------------------------------

        const secondaryMetrics = [
            nutrientProcessing,
            autophagy,
            cytoskeleton,
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
                (sum, value) =>
                    sum + value,
                0
            ) / secondaryMetrics.length;

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

        const compositeHealth =
            viable
                ? this.clamp(
                    (0.25 * geneticIntegrity) +
                    (0.25 * atpProduction) +
                    (0.25 * membraneHealth) +
                    (
                        0.25 *
                        operationalEfficiency
                    )
                )
                : 0;

        return {

            viable,

            lethalSystems,

            compositeHealth,

            core: {
                geneticIntegrity,
                atpProduction,
                membraneHealth
            },

            geneticIntegrity: {
                mutationRate,
                dnaDamage
            },

            metabolicActivity: {
                atpProduction,
                nutrientProcessing,
                autophagy
            },

            structuralIntegrity: {
                cellMembraneHealth:
                    membraneHealth,

                cytoskeleton
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
                encystmentAbility,
                encystmentPressure
            }

        };

    }

};

export default CellConditionCalculator;