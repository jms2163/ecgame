// Run with: node tests/polymerizer-quest-completion.test.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import gameState from "../src/app/GameState.js";
import PolymerizerManager
    from "../src/app/PolymerizerManager.js";
import PolymerizerRecipeCatalog
    from "../src/data/PolymerizerRecipeCatalog.js";
import ResourceManager
    from "../src/app/ResourceManager.js";

const backup = structuredClone(gameState);

try {
    const recipe =
        PolymerizerRecipeCatalog.get(
            "Aquaporin"
        );
    assert.equal(
        recipe.completionQuestId,
        "protein_building_blocks"
    );

    const polymerizerState =
        gameState.zones.polymerizer.state;
    polymerizerState.productInventory = {};
    polymerizerState.activeAssembly = null;

    gameState.registry.quests ??= {};
    gameState.registry.quests
        .protein_building_blocks = {
            status: "claimed",
            readyAtMs: 100,
            claimedAtMs: 200,
            viewedAtMs: 200,
            activatedAtMs: 50,
            objectiveBaselines: {}
        };

    const questCompleted =
        PolymerizerManager
            .getProductEligibility(
                "Aquaporin"
            );

    assert.equal(
        questCompleted.completion.completed,
        true
    );
    assert.equal(
        questCompleted.completion.source,
        "quest"
    );
    assert.equal(
        questCompleted.completion.label,
        "Quest completed"
    );
    assert.equal(
        questCompleted.completion
            .completedAtMs,
        200
    );
    assert.equal(questCompleted.canStart, false);
    assert.equal(questCompleted.output.quantity, 0);
    assert.deepEqual(
        polymerizerState.productInventory,
        {},
        "quest completion must not fabricate synthesized inventory"
    );

    gameState.zones.macromolecularizer.state.motifInventory = {
        H_helix: 8,
        L_loop: 7
    };
    ResourceManager.setATPStatus(
        { current: 20, maximum: 50 },
        "quest-completion-test-setup"
    );
    assert.equal(
        PolymerizerManager.getProductEligibility("Aquaporin").canStart,
        false,
        "quest-completed Aquaporin must not require another synthesis"
    );
    assert.equal(
        PolymerizerManager.startAssembly("Aquaporin").reason,
        "product-completed-by-quest"
    );

    // A discovery alone does not impersonate the named quest claim.
    gameState.registry.quests
        .protein_building_blocks.status =
        "in-progress";
    gameState.registry.discoveries ??= [];
    if (!gameState.registry.discoveries
        .includes("aquaporin")) {
        gameState.registry.discoveries.push(
            "aquaporin"
        );
    }

    const discoveryOnly =
        PolymerizerManager
            .getProductEligibility(
                "Aquaporin"
            );
    assert.equal(
        discoveryOnly.completion.completed,
        false
    );

    // A real stored product remains authoritative if both paths exist.
    gameState.registry.quests
        .protein_building_blocks.status =
        "claimed";
    polymerizerState.productInventory.Aquaporin = {
        count: 1,
        firstCompletedAtMs: 300,
        lastCompletedAtMs: 300
    };

    const synthesized =
        PolymerizerManager
            .getProductEligibility(
                "Aquaporin"
            );
    assert.equal(
        synthesized.completion.source,
        "synthesized"
    );
    assert.equal(synthesized.output.quantity, 1);

    const viewSource = fs.readFileSync(
        new URL(
            "../src/app/PolymerizerProductView.js",
            import.meta.url
        ),
        "utf8"
    );
    assert.match(viewSource, /Quest completed/);
    assert.match(viewSource, /Completed by Protein Building Blocks quest/);
    assert.match(viewSource, /product\.completion\?\.completed/);
} finally {
    for (const key of Object.keys(gameState)) {
        delete gameState[key];
    }
    Object.assign(gameState, backup);
}

console.log(
    "PASS: the Protein Building Blocks quest completes Aquaporin without a second assembly or invented inventory."
);
