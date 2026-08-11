// --------------------------------------------------
// CellEnvironmentBalanceConfig.js
// Central biological balance settings for pond conditions
// --------------------------------------------------

const CellEnvironmentBalanceConfig = {

    // --------------------------------------------------
    // Temperature suitability
    // Cold-water amoeba optimum: 14 °C
    // --------------------------------------------------
    temperature: {

        optimum: 14.0,

        gaussianWidth: 5.0

    },

    // --------------------------------------------------
    // pH suitability
    // --------------------------------------------------
    ph: {

        optimum: 7.2,

        gaussianWidth: 0.8

    },

    // --------------------------------------------------
    // Oxygen availability
    // Relative saturation ratio: 1.00 = 100%
    // --------------------------------------------------
    oxygen: {

        minimumModifier: 0.15,

        availableRange: 0.85,

        midpoint: 0.35,

        steepness: 12.0

    },

    // --------------------------------------------------
    // Flow / shear stress
    // Present in tile data, but not yet applied.
    // --------------------------------------------------
    flow: {

        enabled: false,

        safeMaximum: 0.10,

        minimumModifier: 0.05,

        penaltyPerFlowUnit: 2.5

    },

    // --------------------------------------------------
    // Chemical toxicity
    // Ammonia is sensed through chemistry.signals.
    // --------------------------------------------------
    toxicity: {

        ammoniaScale: 15.0,

        cyanotoxinScale: 50.0,

        toxicBacteriaMaximum: 300.0,

        ammoniaWeight: 0.40,

        cyanotoxinWeight: 0.30,

        toxicBacteriaWeight: 0.30,

        maximumPenalty: 0.95

    },

    // --------------------------------------------------
    // Capsule slippiness during phagocytosis
    // --------------------------------------------------
    capsularBacteria: {

        maximumPenalty: 0.80

    },

    // --------------------------------------------------
    // Environmental stress and encystment pressure
    // --------------------------------------------------
    stress: {

        maximumIndex: 2.0,

        elevatedSalinityThreshold: 0.02,

        elevatedSalinityStress: 0.50,

        hypoxiaThreshold: 0.20,

        hypoxiaStress: 0.50,

        toxicityWeight: 0.80,

        lowPhSuitabilityThreshold: 0.40,

        lowPhSuitabilityStress: 0.40

    },

    // --------------------------------------------------
    // Nutrient-processing opportunity
    // --------------------------------------------------
    doc: {

        maximumBonus: 0.50,

        scale: 2.0

    }

};

export default CellEnvironmentBalanceConfig;