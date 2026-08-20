// --------------------------------------------------
// MoleculeWaterInteractionCatalog.js
// Pure classroom models for the Molecule Lab water-
// interaction investigation.
//
// These scores are intentionally a teaching heuristic,
// not experimental solubility data. Polar O/N sites,
// hydrogen-bond donor groups, molecular dipole, and carbon
// content contribute to the two displayed affinity bars.
// --------------------------------------------------

import MoleculeDipoleCatalog from "./MoleculeDipoleCatalog.js";

const INTERACTION_OVERRIDES = Object.freeze({
    H2: Object.freeze({
        interactionType: "unfavorable",
        acceptorAtomIndexes: Object.freeze([])
    }),
    O2: Object.freeze({
        interactionType: "unfavorable",
        acceptorAtomIndexes: Object.freeze([])
    }),
    N2: Object.freeze({
        interactionType: "unfavorable",
        acceptorAtomIndexes: Object.freeze([])
    }),
    CH4: Object.freeze({
        interactionType: "unfavorable",
        acceptorAtomIndexes: Object.freeze([])
    }),
    NH3: Object.freeze({ targetAtomIndex: 0 }),
    CO2: Object.freeze({ targetAtomIndex: 0 }),
    H2O: Object.freeze({ targetAtomIndex: 0 }),
    PO4: Object.freeze({ targetAtomIndex: 1, ionic: true }),
    H2S: Object.freeze({
        interactionType: "dipole-dipole",
        acceptorAtomIndexes: Object.freeze([]),
        targetAtomIndex: 0
    }),
    AceticAcid: Object.freeze({ targetAtomIndex: 2 })
});

const INTERACTION_LABELS = Object.freeze({
    "hydrogen-bond": "Hydrogen-bonding interaction",
    "dipole-dipole": "Dipole interactions",
    unfavorable: "Unfavorable interactions"
});

function clampScore(value) {
    return Math.max(0, Math.min(100, Math.round(value)));
}

function uniqueIndexes(indexes = []) {
    return [...new Set(indexes.filter(Number.isInteger))];
}

function getDonorAtomIndexes(atoms, bonds) {
    const donorIndexes = new Set();

    bonds.forEach(bond => {
        const atomA = atoms[bond.a];
        const atomB = atoms[bond.b];
        if (!atomA || !atomB) return;

        if (
            (atomA.type === "O" || atomA.type === "N") &&
            atomB.type === "H"
        ) {
            donorIndexes.add(bond.a);
        }

        if (
            (atomB.type === "O" || atomB.type === "N") &&
            atomA.type === "H"
        ) {
            donorIndexes.add(bond.b);
        }
    });

    return [...donorIndexes];
}

function classifyWaterAffinity(affinityIndex) {
    if (affinityIndex >= 45) return "Very water soluble";
    if (affinityIndex >= 20) return "Moderately water soluble";
    if (affinityIndex >= 0) return "Mildly water soluble";
    return "Poorly water soluble";
}

function createModel(moleculeId, structure = {}) {
    const atoms = structure.atoms ?? [];
    const bonds = structure.bonds ?? [];
    const formula = structure.formula ?? {};
    if (!atoms.length) return null;

    const override = INTERACTION_OVERRIDES[moleculeId] ?? {};
    const dipoleModel = structure.dipoleModel ??
        MoleculeDipoleCatalog.get(moleculeId);
    const inferredAcceptors = atoms
        .map((atom, index) => ({ atom, index }))
        .filter(({ atom }) => atom.type === "O" || atom.type === "N")
        .map(({ index }) => index);
    const acceptorAtomIndexes = uniqueIndexes(
        override.acceptorAtomIndexes ?? inferredAcceptors
    );
    const donorAtomIndexes = uniqueIndexes(
        getDonorAtomIndexes(atoms, bonds)
    );

    const carbonCount = Math.max(0, Number(formula.C) || 0);
    const heavyAtomCount = ["C", "N", "O", "P", "S"]
        .reduce((total, symbol) => total +
            Math.max(0, Number(formula[symbol]) || 0), 0);
    const polarSiteCount = acceptorAtomIndexes.length;
    const donorGroupCount = donorAtomIndexes.length;
    const polarSiteDensity = heavyAtomCount
        ? polarSiteCount / heavyAtomCount
        : 0;
    const carbonFraction = heavyAtomCount
        ? carbonCount / heavyAtomCount
        : 0;
    const momentDebye = Number.isFinite(dipoleModel?.momentDebye)
        ? dipoleModel.momentDebye
        : null;
    const ionic = Boolean(override.ionic || dipoleModel?.ionicProxy);

    const dipoleContribution = momentDebye === null
        ? 0
        : Math.min(4, Math.max(0, momentDebye)) / 4 * 18;
    const donorAcceptorSynergy =
        donorGroupCount > 0 && polarSiteCount > 0 && carbonCount <= 2
            ? 10
            : 0;
    const nonpolarBonus =
        polarSiteCount === 0 && (momentDebye ?? 0) < 0.5
            ? 15
            : 0;

    const hydrophilicScore = clampScore(
        10 +
        polarSiteDensity * 48 +
        Math.min(polarSiteCount, 4) * 7 +
        Math.min(donorGroupCount, 2) * 12 +
        dipoleContribution +
        donorAcceptorSynergy +
        (ionic ? 25 : 0)
    );
    const hydrophobicScore = clampScore(
        10 +
        carbonFraction * 55 +
        Math.min(carbonCount, 12) * 4 +
        nonpolarBonus -
        Math.min(polarSiteCount, 4) * 6 -
        Math.min(donorGroupCount, 2) * 8 -
        (ionic ? 25 : 0)
    );
    const affinityIndex = hydrophilicScore - hydrophobicScore;

    let interactionType = override.interactionType;
    if (!interactionType && polarSiteCount > 0) {
        interactionType = "hydrogen-bond";
    }
    if (!interactionType && (momentDebye ?? 0) >= 0.5) {
        interactionType = "dipole-dipole";
    }
    interactionType ??= "unfavorable";

    const targetAtomIndex = Number.isInteger(override.targetAtomIndex)
        ? override.targetAtomIndex
        : acceptorAtomIndexes[0] ?? 0;

    return Object.freeze({
        moleculeId,
        interactionType,
        interactionLabel: INTERACTION_LABELS[interactionType],
        targetAtomIndex,
        acceptorAtomIndexes: Object.freeze(acceptorAtomIndexes),
        donorAtomIndexes: Object.freeze(donorAtomIndexes),
        hydrogenBondPotential: interactionType === "hydrogen-bond",
        carbonCount,
        polarSiteCount,
        donorGroupCount,
        momentDebye,
        ionic,
        hydrophilicScore,
        hydrophobicScore,
        affinityIndex,
        conclusion: classifyWaterAffinity(affinityIndex),
        metricLabel: "Classroom water-affinity estimate"
    });
}

const MoleculeWaterInteractionCatalog = Object.freeze({
    create(moleculeId, structure) {
        return createModel(moleculeId, structure);
    },

    classify(affinityIndex) {
        return classifyWaterAffinity(affinityIndex);
    }
});

export default MoleculeWaterInteractionCatalog;
