// --------------------------------------------------
// MoleculeRecipeCatalog.js
// Pure, immutable definitions for Molecule Lab recipes,
// prerequisites, synthesis timing, and 3D structures.
// Runtime state never belongs in this catalog.
// --------------------------------------------------

import { techTreeData } from "./techTree.js";
import { aminoAcids } from "./aminoAcids.js";
import { monosaccharideLibrary }
    from "./monosaccharideLibrary.js";
import MoleculeDipoleCatalog
    from "./MoleculeDipoleCatalog.js";

const STANDARD_STRUCTURES = {
    H2: {
        formula: { H: 2 },
        requiredDiscoveries: ["H"],
        atoms: [
            { type: "H", position: [-0.65, 0, 0] },
            { type: "H", position: [0.65, 0, 0] }
        ],
        bonds: [{ a: 0, b: 1, order: 1 }]
    },
    O2: {
        formula: { O: 2 },
        requiredDiscoveries: ["O"],
        atoms: [
            { type: "O", position: [-0.7, 0, 0] },
            { type: "O", position: [0.7, 0, 0] }
        ],
        bonds: [{ a: 0, b: 1, order: 2 }]
    },
    N2: {
        formula: { N: 2 },
        requiredDiscoveries: ["N"],
        atoms: [
            { type: "N", position: [-0.68, 0, 0] },
            { type: "N", position: [0.68, 0, 0] }
        ],
        bonds: [{ a: 0, b: 1, order: 3 }]
    },
    CH4: {
        formula: { C: 1, H: 4 },
        requiredDiscoveries: ["C", "H"],
        atoms: [
            { type: "C", position: [0, 0, 0] },
            { type: "H", position: [1, 1, 1] },
            { type: "H", position: [-1, -1, 1] },
            { type: "H", position: [-1, 1, -1] },
            { type: "H", position: [1, -1, -1] }
        ],
        bonds: [
            { a: 0, b: 1, order: 1 },
            { a: 0, b: 2, order: 1 },
            { a: 0, b: 3, order: 1 },
            { a: 0, b: 4, order: 1 }
        ]
    },
    NH3: {
        formula: { N: 1, H: 3 },
        requiredDiscoveries: ["N", "H"],
        atoms: [
            { type: "N", position: [0, 0.35, 0] },
            { type: "H", position: [1, -0.55, 0.55] },
            { type: "H", position: [-1, -0.55, 0.55] },
            { type: "H", position: [0, -0.55, -1] }
        ],
        bonds: [
            { a: 0, b: 1, order: 1 },
            { a: 0, b: 2, order: 1 },
            { a: 0, b: 3, order: 1 }
        ]
    },
    CO2: {
        formula: { C: 1, O: 2 },
        requiredDiscoveries: ["C", "O"],
        atoms: [
            { type: "O", position: [-1.35, 0, 0] },
            { type: "C", position: [0, 0, 0] },
            { type: "O", position: [1.35, 0, 0] }
        ],
        bonds: [
            { a: 0, b: 1, order: 2 },
            { a: 1, b: 2, order: 2 }
        ]
    },
    H2O: {
        formula: { H: 2, O: 1 },
        requiredDiscoveries: ["H", "O"],
        atoms: [
            { type: "O", position: [0, 0.25, 0] },
            { type: "H", position: [-0.9, -0.55, 0] },
            { type: "H", position: [0.9, -0.55, 0] }
        ],
        bonds: [
            { a: 0, b: 1, order: 1 },
            { a: 0, b: 2, order: 1 }
        ]
    },
    PO4: {
        formula: { P: 1, O: 4 },
        requiredDiscoveries: ["P", "O"],
        atoms: [
            { type: "P", position: [0, 0, 0] },
            { type: "O", position: [1.05, 1.05, 1.05] },
            { type: "O", position: [-1.05, -1.05, 1.05] },
            { type: "O", position: [-1.05, 1.05, -1.05] },
            { type: "O", position: [1.05, -1.05, -1.05] }
        ],
        bonds: [
            { a: 0, b: 1, order: 1 },
            { a: 0, b: 2, order: 1 },
            { a: 0, b: 3, order: 1 },
            { a: 0, b: 4, order: 1 }
        ]
    },
    H2S: {
        formula: { H: 2, S: 1 },
        requiredDiscoveries: ["H", "S"],
        atoms: [
            { type: "S", position: [0, 0.25, 0] },
            { type: "H", position: [-1, -0.5, 0] },
            { type: "H", position: [1, -0.5, 0] }
        ],
        bonds: [
            { a: 0, b: 1, order: 1 },
            { a: 0, b: 2, order: 1 }
        ]
    },
    AceticAcid: {
        formula: { C: 2, H: 4, O: 2 },
        requiredDiscoveries: ["C", "H", "O"],
        atoms: [
            { type: "C", position: [-0.75, 0, 0] },
            { type: "C", position: [0.75, 0, 0] },
            { type: "O", position: [1.45, 0.95, 0] },
            { type: "O", position: [1.45, -0.95, 0] },
            { type: "H", position: [-1.25, 0.85, 0.65] },
            { type: "H", position: [-1.25, -0.85, 0.65] },
            { type: "H", position: [-1.25, 0, -1] },
            { type: "H", position: [2.35, -0.95, 0] }
        ],
        bonds: [
            { a: 0, b: 1, order: 1 },
            { a: 1, b: 2, order: 2 },
            { a: 1, b: 3, order: 1 },
            { a: 0, b: 4, order: 1 },
            { a: 0, b: 5, order: 1 },
            { a: 0, b: 6, order: 1 },
            { a: 3, b: 7, order: 1 }
        ]
    }
};

const CATEGORY_REQUIREMENTS = Object.freeze({
    molecules: [],
    carbs: ["CO2", "H2O"],
    proteins: ["CH4", "NH3"],
    lipids: ["CH4"]
});

function formulaFromRecord(record = {}) {
    return ["C", "H", "N", "O", "P", "S"]
        .reduce((formula, symbol) => {
            const count = record[symbol];
            if (Number.isFinite(count) && count > 0) {
                formula[symbol] = count;
            }
            return formula;
        }, {});
}

function structureFor(id) {
    if (STANDARD_STRUCTURES[id]) {
        return STANDARD_STRUCTURES[id];
    }

    const aminoAcid = aminoAcids[id];
    if (aminoAcid?.atoms && aminoAcid?.bonds) {
        return {
            formula: formulaFromRecord(aminoAcid),
            requiredDiscoveries:
                Object.keys(formulaFromRecord(aminoAcid)),
            atoms: aminoAcid.atoms,
            bonds: aminoAcid.bonds
        };
    }

    const sugar = monosaccharideLibrary[id];
    if (sugar?.atoms && sugar?.bonds) {
        return {
            formula: formulaFromRecord(sugar),
            requiredDiscoveries:
                Object.keys(formulaFromRecord(sugar)),
            atoms: sugar.atoms,
            bonds: sugar.bonds
        };
    }

    return null;
}

function createDefinition(id, metadata) {
    const structure = structureFor(id);

    return Object.freeze({
        id,
        name: metadata.name ?? metadata.Name ?? id,
        icon: metadata.icon ?? id,
        tier: Number.isFinite(metadata.tier)
            ? metadata.tier
            : 0,
        category: metadata.category ?? "molecules",
        parents: Object.freeze([...(metadata.parents ?? [])]),
        type: metadata.type ?? "recipe",
        targetTab: metadata.targetTab ?? null,
        durationMs:
            Math.max(1, metadata.researchTime ?? 10) * 1000,
        description: metadata.desc ?? "",
        info: metadata.info ?? metadata.desc ?? "",
        formula: Object.freeze({ ...(structure?.formula ?? {}) }),
        requiredDiscoveries: Object.freeze([
            ...(structure?.requiredDiscoveries ?? [])
        ]),
        atoms: Object.freeze(
            (structure?.atoms ?? []).map(atom =>
                Object.freeze({
                    type: atom.type,
                    position: Object.freeze([...atom.position])
                })
            )
        ),
        bonds: Object.freeze(
            (structure?.bonds ?? []).map(bond =>
                Object.freeze({ ...bond })
            )
        ),
        dipoleModel: MoleculeDipoleCatalog.get(id),
        implemented:
            metadata.type === "link" ||
            Boolean(structure?.atoms?.length)
    });
}

const DEFINITIONS = Object.freeze(
    Object.fromEntries(
        Object.entries(techTreeData).map(
            ([id, metadata]) => [
                id,
                createDefinition(id, metadata)
            ]
        )
    )
);

const MoleculeRecipeCatalog = Object.freeze({
    categories: Object.freeze([
        Object.freeze({ id: "molecules", label: "M", title: "Molecules" }),
        Object.freeze({ id: "carbs", label: "C", title: "Carbohydrates" }),
        Object.freeze({ id: "proteins", label: "P", title: "Proteins" }),
        Object.freeze({ id: "lipids", label: "L", title: "Lipids" })
    ]),

    has(id) {
        return Boolean(DEFINITIONS[id]);
    },

    get(id) {
        return DEFINITIONS[id] ?? null;
    },

    getAll() {
        return Object.values(DEFINITIONS);
    },

    getByCategory(categoryId) {
        return this.getAll().filter(
            definition => definition.category === categoryId
        );
    },

    getCategoryRequirements(categoryId) {
        return [...(CATEGORY_REQUIREMENTS[categoryId] ?? [])];
    }
});

export default MoleculeRecipeCatalog;
