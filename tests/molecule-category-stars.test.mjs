// Run with: node tests/molecule-category-stars.test.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import gameState from "../src/app/GameState.js";
import MoleculeRecipeCatalog
    from "../src/data/MoleculeRecipeCatalog.js";

globalThis.window = globalThis;

const { default: MoleculeLabManager } =
    await import(
        "../src/app/MoleculeLabManager.js"
    );

const backup = structuredClone(gameState);

try {
    const expectedCounts = {
        molecules: 11,
        carbs: 26,
        proteins: 19,
        lipids: 20,
        nucleics: 5
    };
    const state =
        gameState.zones.moleculeLab.state;
    state.synthesized = {};

    for (const category of
        MoleculeRecipeCatalog.categories) {
        const recipes =
            MoleculeRecipeCatalog
                .getByCategory(category.id)
                .filter(definition =>
                    definition.type !== "link" &&
                    definition.implemented
                );

        assert.equal(
            recipes.length,
            expectedCounts[category.id]
        );

        let status =
            MoleculeLabManager
                .getCategoryStatus(category.id);
        assert.equal(status.synthesisComplete, false);
        assert.equal(status.synthesizedUniqueCount, 0);

        recipes.forEach(definition => {
            state.synthesized[definition.id] = {
                count: 1,
                firstCompletedAtMs: 1,
                lastCompletedAtMs: 1
            };
        });

        status = MoleculeLabManager
            .getCategoryStatus(category.id);
        assert.equal(status.synthesisComplete, true);
        assert.equal(
            status.synthesizedUniqueCount,
            recipes.length
        );
        assert.equal(
            status.synthesisTargetCount,
            recipes.length
        );
    }

    const uiSource = fs.readFileSync(
        new URL(
            "../src/app/MoleculeLabUI.js",
            import.meta.url
        ),
        "utf8"
    );
    const cssSource = fs.readFileSync(
        new URL(
            "../public/css/molecule-lab/tabs-panel.css",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(uiSource, /molecule-lab-tab-star/);
    assert.match(uiSource, /synthesisComplete/);
    assert.match(uiSource, /all recipes synthesized/);
    assert.match(cssSource, /\.molecule-lab-tab-star/);
} finally {
    for (const key of Object.keys(gameState)) {
        delete gameState[key];
    }
    Object.assign(gameState, backup);
}

console.log(
    "PASS: Molecule Lab derives M/C/P/L/N completion stars from all implemented non-link recipes without adding saved star state."
);
