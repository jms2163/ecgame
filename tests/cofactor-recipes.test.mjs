// Run with: node tests/cofactor-recipes.test.mjs

import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import MacromolecularizerManager
    from "../src/app/MacromolecularizerManager.js";
import NucleotideRecipeCatalog
    from "../src/data/NucleotideRecipeCatalog.js";
import {
    getRecipeCardClassLabel,
    getRecipeCardIconLabel
}
    from "../src/app/MacromolecularizerRecipeCardsView.js";

const storage = new Map();

globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => {
        storage.set(key, String(value));
    },
    removeItem: key => storage.delete(key)
};

const expectedRecipes = {
    NADPPlus: {
        abbreviation: "NADP+",
        atpCost: 1,
        baseDurationSeconds: 30,
        components: [
            ["NADPlus", 1, "macromolecularizer"],
            ["PO4", 1, "moleculeLab"]
        ]
    },
    FAD: {
        abbreviation: "FAD",
        atpCost: 2,
        baseDurationSeconds: 60,
        components: [
            ["AMP", 1, "macromolecularizer"],
            ["Riboflavin", 1, "moleculeLab"],
            ["PO4", 1, "moleculeLab"]
        ]
    },
    CoA: {
        abbreviation: "CoA",
        atpCost: 4,
        baseDurationSeconds: 120,
        components: [
            ["AMP", 1, "macromolecularizer"],
            ["PantothenicAcid", 1, "moleculeLab"],
            ["C", 1, "moleculeLab"],
            ["PO4", 2, "moleculeLab"]
        ]
    }
};

Object.entries(expectedRecipes)
    .forEach(([id, expected]) => {
        const definition =
            NucleotideRecipeCatalog.get(id);

        assert.ok(definition);
        assert.equal(definition.implemented, true);
        assert.equal(definition.compositionValid, true);
        assert.equal(definition.consumesComponents, false);
        assert.equal(definition.atpCost, expected.atpCost);
        assert.equal(
            definition.baseDurationSeconds,
            expected.baseDurationSeconds
        );
        assert.equal(
            getRecipeCardClassLabel(definition),
            "COF"
        );
        assert.equal(
            getRecipeCardIconLabel(definition),
            expected.abbreviation
        );
        assert.deepEqual(
            definition.components.map(component => [
                component.id,
                component.quantity,
                component.sourceZoneId
            ]),
            expected.components
        );
    });

gameState.discoveries.reactions = {
    dehydration: {
        discoveredAt: 1
    }
};
gameState.registry.resources.atp = {
    current: 50,
    maximum: 50
};
gameState.zones.moleculeLab.state = {
    synthesized: {
        PO4: { count: 1 },
        Riboflavin: { count: 1 },
        PantothenicAcid: { count: 1 },
        C: { count: 1 }
    }
};
gameState.zones.macromolecularizer.state = {};

MacromolecularizerManager.initialize();

const macromolecularInventory =
    gameState.zones.macromolecularizer
        .state.motifInventory;

macromolecularInventory.AMP = 1;
macromolecularInventory.NADPlus = 1;

Object.keys(expectedRecipes)
    .forEach(id => {
        const eligibility =
            MacromolecularizerManager
                .getMotifEligibility(id);

        assert.ok(eligibility);
        assert.equal(eligibility.eligible, true);
        assert.equal(eligibility.canStart, true);
        assert.equal(
            eligibility.monomers.every(
                component => component.synthesized
            ),
            true
        );
    });

const coenzymeAEligibility =
    MacromolecularizerManager
        .getMotifEligibility("CoA");
const coenzymeAPhosphate =
    coenzymeAEligibility.monomers
        .find(component => component.id === "PO4");

assert.deepEqual(
    {
        quantity: coenzymeAPhosphate.quantity,
        synthesisCount:
            coenzymeAPhosphate.synthesisCount,
        synthesized:
            coenzymeAPhosphate.synthesized
    },
    {
        quantity: 2,
        synthesisCount: 1,
        synthesized: true
    }
);

console.log(
    "PASS: NADP+, FAD, and CoA use oxidized COF cards, the planned precursor recipes, and permanent Molecule Lab synthesis knowledge."
);
