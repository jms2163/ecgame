// --------------------------------------------------
// MoleculeDipoleCatalog.js
// Curated dipole measurement data for Molecule Lab.
//
// Three.js coordinates are presentation geometry, not a
// quantum-chemistry calculation. Measured/accepted values
// and partial-charge sites therefore live in pure data.
// --------------------------------------------------

const RAW_DIPOLE_MODELS = {
    H2: {
        momentDebye: 0.0,
        negativeAtomIndexes: [],
        positiveAtomIndexes: [],
        orientationRequired: false
    },
    O2: {
        momentDebye: 0.0,
        negativeAtomIndexes: [],
        positiveAtomIndexes: [],
        orientationRequired: false
    },
    N2: {
        momentDebye: 0.0,
        negativeAtomIndexes: [],
        positiveAtomIndexes: [],
        orientationRequired: false
    },
    CH4: {
        momentDebye: 0.0,
        negativeAtomIndexes: [],
        positiveAtomIndexes: [],
        orientationRequired: false
    },
    NH3: {
        momentDebye: 1.47,
        negativeAtomIndexes: [0],
        positiveAtomIndexes: [1, 2, 3],
        orientationRequired: true
    },
    CO2: {
        momentDebye: 0.0,
        negativeAtomIndexes: [0, 2],
        positiveAtomIndexes: [1],
        orientationRequired: false
    },
    H2O: {
        momentDebye: 1.855,
        negativeAtomIndexes: [0],
        positiveAtomIndexes: [1, 2],
        orientationRequired: true
    },
    PO4: {
        // Educational ionic-range result. A permanent molecular
        // dipole for an isolated ion is not interpreted like a
        // neutral molecule, so orientation is intentionally off.
        momentDebye: 4.5,
        displayValue: ">4.0",
        negativeAtomIndexes: [1, 2, 3, 4],
        positiveAtomIndexes: [0],
        orientationRequired: false,
        ionicProxy: true
    },
    H2S: {
        momentDebye: 0.977,
        negativeAtomIndexes: [0],
        positiveAtomIndexes: [1, 2],
        orientationRequired: true
    },
    AceticAcid: {
        momentDebye: 1.74,
        negativeAtomIndexes: [2, 3],
        positiveAtomIndexes: [1],
        orientationRequired: true
    }
};

function classifyDipole(momentDebye) {
    if (!Number.isFinite(momentDebye)) return "Unknown";
    if (momentDebye < 0.5) return "Nonpolar";
    if (momentDebye < 1.0) return "Weakly polar";
    if (momentDebye < 2.0) return "Moderately polar";
    if (momentDebye <= 4.0) return "Highly polar";
    return "Ionic / extremely polar";
}

const MODELS = Object.freeze(
    Object.fromEntries(
        Object.entries(RAW_DIPOLE_MODELS).map(([id, model]) => [
            id,
            Object.freeze({
                ...model,
                classification: classifyDipole(model.momentDebye),
                negativeAtomIndexes: Object.freeze([
                    ...model.negativeAtomIndexes
                ]),
                positiveAtomIndexes: Object.freeze([
                    ...model.positiveAtomIndexes
                ])
            })
        ])
    )
);

const MoleculeDipoleCatalog = Object.freeze({
    has(moleculeId) {
        return Boolean(MODELS[moleculeId]);
    },

    get(moleculeId) {
        return MODELS[moleculeId] ?? null;
    },

    classify(momentDebye) {
        return classifyDipole(momentDebye);
    }
});

export default MoleculeDipoleCatalog;
