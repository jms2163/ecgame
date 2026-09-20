// Run with: node tests/gtp-nucleotide-chain.test.mjs

import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import MacromolecularizerManager
    from "../src/app/MacromolecularizerManager.js";
import ResourceManager
    from "../src/app/ResourceManager.js";
import MoleculeRecipeCatalog
    from "../src/data/MoleculeRecipeCatalog.js";
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
    GDP: {
        name: "Guanosine Diphosphate",
        components: [
            ["GMP", 1, "macromolecularizer"],
            ["PO4", 1, "moleculeLab"]
        ]
    },
    GTP: {
        name: "Guanosine Triphosphate",
        components: [
            ["GDP", 1, "macromolecularizer"],
            ["PO4", 1, "moleculeLab"]
        ]
    }
};

Object.entries(expectedRecipes)
    .forEach(([id, expected]) => {
        const definition =
            NucleotideRecipeCatalog.get(id);

        assert.ok(definition);
        assert.equal(definition.name, expected.name);
        assert.equal(definition.implemented, true);
        assert.equal(definition.compositionValid, true);
        assert.equal(definition.consumesComponents, false);
        assert.equal(definition.atpCost, 1);
        assert.equal(definition.baseDurationSeconds, 30);
        assert.equal(
            definition.bondType,
            "phosphoanhydride"
        );
        assert.equal(
            getRecipeCardClassLabel(definition),
            "RNA"
        );
        assert.equal(
            getRecipeCardIconLabel(definition),
            id
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

assert.equal(
    MoleculeRecipeCatalog.get("GDP"),
    null,
    "GDP belongs in the Macromolecularizer, not Molecule Lab"
);
assert.equal(
    MoleculeRecipeCatalog.get("GTP"),
    null,
    "GTP belongs in the Macromolecularizer, not Molecule Lab"
);

gameState.discoveries.reactions = {
    dehydration: {
        discoveredAt: 1
    },
    "dehydration-4": {
        discoveredAt: 1
    }
};
gameState.registry.resources.atp = {
    current: 50,
    maximum: 50
};
gameState.zones.moleculeLab.state = {
    synthesized: {
        PO4: { count: 1 }
    }
};
gameState.zones.macromolecularizer.state = {};

MacromolecularizerManager.initialize();

const inventory =
    gameState.zones.macromolecularizer
        .state.motifInventory;
inventory.GMP = 1;

let gdpEligibility =
    MacromolecularizerManager
        .getMotifEligibility("GDP");
let gtpEligibility =
    MacromolecularizerManager
        .getMotifEligibility("GTP");

assert.equal(gdpEligibility.eligible, true);
assert.equal(gtpEligibility.eligible, false);
assert.deepEqual(
    gtpEligibility.missingMonomerIds,
    ["GDP"]
);
assert.deepEqual(
    gdpEligibility.monomers.find(
        component => component.id === "PO4"
    ),
    {
        id: "PO4",
        name: "Phosphate",
        quantity: 1,
        sourceZoneId: "moleculeLab",
        sourceLabel: "Molecule Lab",
        sourceImplemented: true,
        synthesisCount: 1,
        synthesized: true
    }
);

const reserveBefore =
    ResourceManager.getATPStatus();
const startedGDP =
    MacromolecularizerManager
        .startSynthesis("GDP", 10_000);

assert.equal(startedGDP.success, true);

const finishedGDP =
    MacromolecularizerManager
        .finishSynthesis(
            startedGDP.synthesis.jobId,
            startedGDP.synthesis.completesAtMs
        );

assert.equal(finishedGDP.success, true);
assert.equal(inventory.GDP, 1);
assert.equal(inventory.GMP, 1);

gtpEligibility =
    MacromolecularizerManager
        .getMotifEligibility("GTP");

assert.equal(gtpEligibility.eligible, true);

const startedGTP =
    MacromolecularizerManager
        .startSynthesis("GTP", 50_000);

assert.equal(startedGTP.success, true);

const finishedGTP =
    MacromolecularizerManager
        .finishSynthesis(
            startedGTP.synthesis.jobId,
            startedGTP.synthesis.completesAtMs
        );

assert.equal(finishedGTP.success, true);
assert.equal(inventory.GTP, 1);
assert.equal(
    inventory.GDP,
    1,
    "GTP synthesis must not consume permanent GDP inventory"
);
assert.equal(
    ResourceManager.getATPStatus().current,
    reserveBefore.current - 2,
    "GDP and GTP each spend one game-assembly ATP without crediting a new global resource"
);

const synthesisHistory =
    MacromolecularizerManager
        .getStatus()
        .synthesized;

assert.deepEqual(
    synthesisHistory.GDP,
    {
        count: 1,
        firstCompletedAtMs:
            startedGDP.synthesis.completesAtMs,
        lastCompletedAtMs:
            startedGDP.synthesis.completesAtMs
    }
);
assert.deepEqual(
    synthesisHistory.GTP,
    {
        count: 1,
        firstCompletedAtMs:
            startedGTP.synthesis.completesAtMs,
        lastCompletedAtMs:
            startedGTP.synthesis.completesAtMs
    }
);

console.log(
    "PASS: GDP and GTP form a timestamped GMP-to-GDP-to-GTP chain using permanent PO4 knowledge, RNA card labels, non-consuming products, and no new Molecule Lab or global energy resource."
);
