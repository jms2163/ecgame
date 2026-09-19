// Run with: node tests/vitamin-category.test.mjs

import assert from "node:assert/strict";
import MoleculeRecipeCatalog
    from "../src/data/MoleculeRecipeCatalog.js";
import { vitaminLibrary }
    from "../src/data/vitaminLibrary.js";

function atomCounts(atoms) {
    return atoms.reduce((counts, atom) => {
        counts[atom.type] =
            (counts[atom.type] ?? 0) + 1;
        return counts;
    }, {});
}

function validateStructure(id) {
    const definition =
        MoleculeRecipeCatalog.get(id);
    const structure = vitaminLibrary[id];

    assert(definition);
    assert(structure);
    assert.equal(definition.category, "vitamins");
    assert.equal(definition.implemented, true);
    assert.deepEqual(
        atomCounts(definition.atoms),
        definition.formula
    );

    definition.bonds.forEach(bond => {
        assert(Number.isInteger(bond.a));
        assert(Number.isInteger(bond.b));
        assert(bond.a >= 0);
        assert(bond.b >= 0);
        assert(bond.a < definition.atoms.length);
        assert(bond.b < definition.atoms.length);
        assert([1, 2, 3].includes(bond.order));

        const first =
            definition.atoms[bond.a].position;
        const second =
            definition.atoms[bond.b].position;
        const distance = Math.hypot(
            first[0] - second[0],
            first[1] - second[1],
            first[2] - second[2]
        );

        assert(
            distance >= 0.85 &&
            distance <= 1.70,
            `${id} bond ${bond.a}-${bond.b} has implausible distance ${distance}`
        );
    });

    return definition;
}

const category = MoleculeRecipeCatalog.categories
    .find(candidate =>
        candidate.id === "vitamins"
    );

assert.deepEqual(category, {
    id: "vitamins",
    label: "V",
    title: "Vitamins & Cofactor Precursors",
    countsTowardLabCompletion: false
});
assert.deepEqual(
    MoleculeRecipeCatalog
        .getCategoryRequirements("vitamins"),
    ["CH4", "H2", "N2", "O2"]
);
assert.equal(
    MoleculeRecipeCatalog.get("Nicotinamide")
        .category,
    "vitamins"
);
assert.equal(
    MoleculeRecipeCatalog.get("Nicotinamide")
        .icon,
    "B<sub>3</sub>"
);

const riboflavin = validateStructure("Riboflavin");
assert.equal(riboflavin.icon, "B<sub>2</sub>");
assert.deepEqual(
    riboflavin.formula,
    { C: 17, H: 20, N: 4, O: 6 }
);
assert.equal(riboflavin.atoms.length, 47);
assert.equal(riboflavin.bonds.length, 49);

const pantothenicAcid =
    validateStructure("PantothenicAcid");
assert.equal(
    pantothenicAcid.icon,
    "B<sub>5</sub>"
);
assert.deepEqual(
    pantothenicAcid.formula,
    { C: 9, H: 17, N: 1, O: 5 }
);
assert.equal(pantothenicAcid.atoms.length, 32);
assert.equal(pantothenicAcid.bonds.length, 31);

const portal =
    MoleculeRecipeCatalog.get("VitaminPortal");
assert.equal(portal.type, "link");
assert.equal(portal.targetTab, "vitamins");

console.log(
    "PASS: Molecule Lab exposes a completion-safe V tab with nicotinamide, validated riboflavin and pantothenic-acid structures, and a Vitamins portal."
);
