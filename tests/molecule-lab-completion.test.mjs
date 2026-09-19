// Run with: node tests/molecule-lab-completion.test.mjs

import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import MoleculeRecipeCatalog
    from "../src/data/MoleculeRecipeCatalog.js";

globalThis.window = globalThis;

const { default: MoleculeLabManager } =
    await import(
        "../src/app/MoleculeLabManager.js"
    );

const backup = structuredClone(gameState);

function synthesisRecord() {
    return {
        count: 1,
        firstCompletedAtMs: 1,
        lastCompletedAtMs: 1
    };
}

try {
    const moleculeLab = gameState.zones.moleculeLab;
    const state = moleculeLab.state;
    const recipes = MoleculeRecipeCatalog
        .getAll()
        .filter(definition =>
            definition.type !== "link" &&
            definition.implemented
        );

    const completionCategoryIds = new Set(
        MoleculeRecipeCatalog.categories
            .filter(category =>
                category.countsTowardLabCompletion
            )
            .map(category => category.id)
    );
    const requiredRecipes = recipes.filter(
        definition =>
            completionCategoryIds.has(
                definition.category
            )
    );

    assert.equal(recipes.length, 83);
    assert.equal(requiredRecipes.length, 80);

    // Compatibility check: repair the old H2 milestone behavior. A save that
    // says the zone is complete but only contains H2 must become Available.
    moleculeLab.unlocked = true;
    moleculeLab.completed = true;
    state.synthesized = {
        H2: synthesisRecord()
    };

    let completion =
        MoleculeLabManager.reconcileZoneCompletion();
    assert.equal(completion.completed, false);
    assert.equal(completion.changed, true);
    assert.equal(moleculeLab.completed, false);
    assert.equal(moleculeLab.unlocked, true);

    // Every recipe except one is still insufficient.
    state.synthesized = Object.fromEntries(
        requiredRecipes.slice(0, -1).map(definition => [
            definition.id,
            synthesisRecord()
        ])
    );
    completion = MoleculeLabManager.reconcileZoneCompletion();
    assert.equal(completion.completed, false);
    assert.equal(moleculeLab.completed, false);

    // The final unique synthesis completes the whole Molecule Lab.
    const finalRecipe = requiredRecipes.at(-1);
    state.synthesized[finalRecipe.id] = synthesisRecord();
    completion = MoleculeLabManager.reconcileZoneCompletion();
    assert.equal(completion.completed, true);
    assert.equal(completion.changed, true);
    assert.equal(moleculeLab.completed, true);
    const vitaminCategory = completion.categories
        .find(category =>
            category.id === "vitamins"
        );
    assert.equal(
        vitaminCategory.countsTowardLabCompletion,
        false
    );
    assert.equal(
        vitaminCategory.synthesisComplete,
        false
    );
    assert(
        completion.categories
            .filter(category =>
                category.countsTowardLabCompletion
            )
            .every(category =>
                category.synthesisComplete
            )
    );

    // The flag remains derived and can be repaired in either direction.
    delete state.synthesized[
        requiredRecipes[0].id
    ];
    completion = MoleculeLabManager.reconcileZoneCompletion();
    assert.equal(completion.completed, false);
    assert.equal(moleculeLab.completed, false);
} finally {
    for (const key of Object.keys(gameState)) {
        delete gameState[key];
    }
    Object.assign(gameState, backup);
}

console.log(
    "PASS: Molecule Lab completion requires all released M/C/P/L/N recipes, excludes the mid-term V expansion, and repairs legacy completion flags."
);
