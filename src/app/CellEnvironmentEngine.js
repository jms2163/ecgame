// --------------------------------------------------
// CellEnvironmentEngine.js
// Calculates temporary environmental conditions from one Pond tile
// --------------------------------------------------

import CellEnvironmentBalanceConfig
    from "./CellEnvironmentBalanceConfig.js";

const CellEnvironmentEngine = {

    // --------------------------------------------------
    // Keep a normalized value within 0.00 to 1.00
    // --------------------------------------------------
    clamp(
        value,
        minimum = 0,
        maximum = 1
    ) {

        return Math.min(
            Math.max(value, minimum),
            maximum
        );

    },

    // --------------------------------------------------
    // Read one required numeric tile value
    // --------------------------------------------------
    getTileValue(
        tile,
        path
    ) {

        const value =
            path.reduce(
                (currentValue, key) =>
                    currentValue?.[key],
                tile
            );

        if (!Number.isFinite(value)) {
            throw new Error(
                `CellEnvironmentEngine: missing tile value "${path.join(".")}"`
            );
        }

        return value;

    },

    // --------------------------------------------------
    // Temperature suitability
    // --------------------------------------------------
    calculateTemperatureSuitability(
        temperature
    ) {

        const {
            optimum,
            gaussianWidth
        } =
            CellEnvironmentBalanceConfig
                .temperature;

        return Math.exp(
            -Math.pow(
                temperature - optimum,
                2
            ) /
            (
                2 *
                Math.pow(
                    gaussianWidth,
                    2
                )
            )
        );

    },

    // --------------------------------------------------
    // pH suitability
    // --------------------------------------------------
    calculatePhSuitability(ph) {

        const {
            optimum,
            gaussianWidth
        } =
            CellEnvironmentBalanceConfig.ph;

        return Math.exp(
            -Math.pow(
                ph - optimum,
                2
            ) /
            (
                2 *
                Math.pow(
                    gaussianWidth,
                    2
                )
            )
        );

    },

    // --------------------------------------------------
    // Oxygen availability
    // --------------------------------------------------
    calculateOxygenAvailability(
        oxygen
    ) {

        const {
            minimumModifier,
            availableRange,
            midpoint,
            steepness
        } =
            CellEnvironmentBalanceConfig
                .oxygen;

        return (
            minimumModifier +
            (
                availableRange /
                (
                    1 +
                    Math.exp(
                        -steepness *
                        (
                            oxygen - midpoint
                        )
                    )
                )
            )
        );

    },

    // --------------------------------------------------
    // Flow suitability
    // Flow data is available but intentionally inactive.
    // --------------------------------------------------
    calculateFlowSuitability(
        flowRate
    ) {

        const flowConfig =
            CellEnvironmentBalanceConfig.flow;

        if (!flowConfig.enabled) {
            return 1;
        }

        const excessFlow =
            Math.max(
                0,
                flowRate -
                flowConfig.safeMaximum
            );

        return this.clamp(
            1 -
            (
                excessFlow *
                flowConfig.penaltyPerFlowUnit
            ),
            flowConfig.minimumModifier
        );

    },

    // --------------------------------------------------
    // Chemical toxicity penalty
    // --------------------------------------------------
    calculateChemicalToxicityPenalty({
        ammonia,
        cyanotoxins,
        toxicBacteria
    }) {

        const toxicity =
            CellEnvironmentBalanceConfig
                .toxicity;

        const ammoniaStress =
            this.clamp(
                ammonia *
                toxicity.ammoniaScale
            );

        const cyanotoxinStress =
            this.clamp(
                cyanotoxins *
                toxicity.cyanotoxinScale
            );

        const toxicBacteriaStress =
            this.clamp(
                toxicBacteria /
                toxicity.toxicBacteriaMaximum
            );

        return this.clamp(
            (
                ammoniaStress *
                toxicity.ammoniaWeight
            ) +
            (
                cyanotoxinStress *
                toxicity.cyanotoxinWeight
            ) +
            (
                toxicBacteriaStress *
                toxicity.toxicBacteriaWeight
            ),
            0,
            toxicity.maximumPenalty
        );

    },

    // --------------------------------------------------
    // Slippiness penalty for phagocytosis
    // --------------------------------------------------
    calculateCapsularRatio({
        greenAlgae,
        heterotrophicBacteria,
        capsularBacteria
    }) {

        const totalPrey =
            greenAlgae +
            heterotrophicBacteria +
            1;

        return this.clamp(
            capsularBacteria /
            totalPrey,
            0,
            CellEnvironmentBalanceConfig
                .capsularBacteria
                .maximumPenalty
        );

    },

    // --------------------------------------------------
    // General stress and encystment pressure
    // --------------------------------------------------
    calculateStressIndex({
        salinity,
        oxygen,
        chemicalToxicityPenalty,
        phSuitability
    }) {

        const stress =
            CellEnvironmentBalanceConfig
                .stress;

        const salinityStress =
            salinity >
            stress.elevatedSalinityThreshold
                ? stress.elevatedSalinityStress
                : 0;

        const hypoxiaStress =
            oxygen <
            stress.hypoxiaThreshold
                ? stress.hypoxiaStress
                : 0;

        const phStress =
            phSuitability <
            stress.lowPhSuitabilityThreshold
                ? stress.lowPhSuitabilityStress
                : 0;

        return Math.min(
            stress.maximumIndex,

            salinityStress +
            hypoxiaStress +
            (
                chemicalToxicityPenalty *
                stress.toxicityWeight
            ) +
            phStress
        );

    },

    // --------------------------------------------------
    // Calculate environmental modifier report for one tile
    // --------------------------------------------------
    calculate(tile) {

        const temperature =
            this.getTileValue(
                tile,
                [
                    "physics",
                    "temperature"
                ]
            );

        const ph =
            this.getTileValue(
                tile,
                [
                    "physics",
                    "ph"
                ]
            );

        const oxygen =
            this.getTileValue(
                tile,
                [
                    "physics",
                    "oxygen"
                ]
            );

        const flowRate =
            this.getTileValue(
                tile,
                [
                    "physics",
                    "flow_rate"
                ]
            );

        const salinity =
            this.getTileValue(
                tile,
                [
                    "physics",
                    "salinity"
                ]
            );

        const doc =
            this.getTileValue(
                tile,
                [
                    "chemistry",
                    "nutrients",
                    "doc"
                ]
            );

        const ammonia =
            this.getTileValue(
                tile,
                [
                    "chemistry",
                    "signals",
                    "ammonia"
                ]
            );

        const cyanotoxins =
            this.getTileValue(
                tile,
                [
                    "chemistry",
                    "signals",
                    "cyanotoxins"
                ]
            );

        const greenAlgae =
            this.getTileValue(
                tile,
                [
                    "populations",
                    "green_algae"
                ]
            );

        const heterotrophicBacteria =
            this.getTileValue(
                tile,
                [
                    "populations",
                    "heterotrophic_bacteria"
                ]
            );

        const toxicBacteria =
            this.getTileValue(
                tile,
                [
                    "populations",
                    "toxic_bacteria"
                ]
            );

        const capsularBacteria =
            this.getTileValue(
                tile,
                [
                    "populations",
                    "capsular_bacteria"
                ]
            );

        const temperatureSuitability =
            this.calculateTemperatureSuitability(
                temperature
            );

        const phSuitability =
            this.calculatePhSuitability(
                ph
            );

        const oxygenAvailability =
            this.calculateOxygenAvailability(
                oxygen
            );

        const flowSuitability =
            this.calculateFlowSuitability(
                flowRate
            );

        const chemicalToxicityPenalty =
            this.calculateChemicalToxicityPenalty({
                ammonia,
                cyanotoxins,
                toxicBacteria
            });

        const capsularRatio =
            this.calculateCapsularRatio({
                greenAlgae,
                heterotrophicBacteria,
                capsularBacteria
            });

        const stressIndex =
            this.calculateStressIndex({
                salinity,
                oxygen,
                chemicalToxicityPenalty,
                phSuitability
            });

        return {

            conditions: {
                temperature,
                ph,
                oxygen,
                flowRate,
                salinity,
                doc
            },

            modifiers: {
                temperatureSuitability,
                phSuitability,
                oxygenAvailability,
                flowSuitability,
                chemicalToxicityPenalty,
                capsularRatio
            },

            stress: {
                stressIndex,

                encystmentPressure:
                    this.clamp(
                        stressIndex /
                        CellEnvironmentBalanceConfig
                            .stress
                            .maximumIndex
                    )
            }

        };

    }

};

export default CellEnvironmentEngine;