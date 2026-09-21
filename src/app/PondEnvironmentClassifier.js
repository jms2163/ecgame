// --------------------------------------------------
// PondEnvironmentClassifier.js
// Shared classification for sensed and passive Pond environments.
// --------------------------------------------------

const CHEMICAL_SIGNAL_THRESHOLDS = Object.freeze({
    abioticOxygenMaximum: 0.05,
    abioticPhMinimum: 6.4,
    bacterialFolateMinimum: 0.05,
    bacterialPeptideMinimum: 0.05,
    fermentationScfaMinimum: 0.07,
    bloomLightMinimum: 0.75,
    bloomOxygenMinimum: 1.20,
    mixedRiskCyanotoxinMinimum: 0.01,
    hazardCyanotoxinMinimum: 0.02
});

const PASSIVE_UNSAFE_CODES = Object.freeze([
    "ABIOTIC_HAZARD",
    "HAZARD_SIGNAL",
    "MIXED_RISK"
]);

const PondEnvironmentClassifier = {

    classifyTile(tile) {
        const physics = tile?.physics ?? {};
        const signals =
            tile?.chemistry?.signals ?? {};

        const oxygen =
            Number(physics.oxygen) || 0;
        const ph = Number(physics.ph) || 0;
        const light = Number(physics.light) || 0;
        const folate =
            Number(signals.folate) || 0;
        const peptides =
            Number(signals.n_formyl_peptides) || 0;
        const scfa = Number(signals.scfa) || 0;
        const cyanotoxins =
            Number(signals.cyanotoxins) || 0;

        const bacterialActivity =
            folate >=
                CHEMICAL_SIGNAL_THRESHOLDS
                    .bacterialFolateMinimum ||
            peptides >=
                CHEMICAL_SIGNAL_THRESHOLDS
                    .bacterialPeptideMinimum;

        const severeHazard =
            cyanotoxins >=
                CHEMICAL_SIGNAL_THRESHOLDS
                    .hazardCyanotoxinMinimum;

        const mixedRisk =
            bacterialActivity &&
            cyanotoxins >=
                CHEMICAL_SIGNAL_THRESHOLDS
                    .mixedRiskCyanotoxinMinimum;

        if (
            oxygen <=
                CHEMICAL_SIGNAL_THRESHOLDS
                    .abioticOxygenMaximum ||
            ph <=
                CHEMICAL_SIGNAL_THRESHOLDS
                    .abioticPhMinimum
        ) {
            return {
                code: "ABIOTIC_HAZARD",
                label: "Abiotic Hazard"
            };
        }

        if (severeHazard) {
            return {
                code: "HAZARD_SIGNAL",
                label: "Hazard Signal"
            };
        }

        if (mixedRisk) {
            return {
                code: "MIXED_RISK",
                label: "Mixed Risk"
            };
        }

        if (
            light >=
                CHEMICAL_SIGNAL_THRESHOLDS
                    .bloomLightMinimum &&
            oxygen >=
                CHEMICAL_SIGNAL_THRESHOLDS
                    .bloomOxygenMinimum
        ) {
            return {
                code: "PHOTOSYNTHETIC_BLOOM",
                label: "Photosynthetic Bloom"
            };
        }

        if (
            scfa >=
                CHEMICAL_SIGNAL_THRESHOLDS
                    .fermentationScfaMinimum
        ) {
            return {
                code: "FERMENTATION_SIGNALS",
                label: "Fermentation Signals"
            };
        }

        if (bacterialActivity) {
            return {
                code: "BACTERIAL_ACTIVITY",
                label: "Bacterial Activity"
            };
        }

        return {
            code: "QUIET",
            label: "Quiet"
        };
    },

    isPassiveArrivalSafe(tile) {
        const classification =
            this.classifyTile(tile);

        return {
            safe:
                !PASSIVE_UNSAFE_CODES.includes(
                    classification.code
                ),
            classification
        };
    }

};

export {
    CHEMICAL_SIGNAL_THRESHOLDS,
    PASSIVE_UNSAFE_CODES
};

export default PondEnvironmentClassifier;
