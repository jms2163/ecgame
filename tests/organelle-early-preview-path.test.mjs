// Run with: node tests/organelle-early-preview-path.test.mjs

import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import OrganelleProgressionManager
    from "../src/app/OrganelleProgressionManager.js";

const backup = structuredClone(gameState);

function expectState(
    organelleId,
    progressionState
) {
    const status =
        OrganelleProgressionManager
            .getStatus(organelleId);

    assert.equal(
        status.progressionState,
        progressionState
    );
    assert.equal(
        status.available,
        progressionState === "available"
    );

    return status;
}

try {
    gameState.registry ??= {};
    gameState.registry.discoveries = [];
    gameState.registry.research ??= {};
    gameState.registry.research
        .completedExperiments = {};
    gameState.zones.polymerizer.unlocked = false;

    expectState("ribosomes", "locked");
    expectState("food_vacuole", "locked");
    expectState("endosome", "locked");

    // Claiming the Polymerizer quest sets this authoritative zone flag.
    gameState.zones.polymerizer.unlocked = true;
    const ribosomeLab =
        expectState(
            "ribosomes",
            "available"
        );
    assert.equal(
        ribosomeLab.ruleIsActive,
        true,
        "Polymerizer access now releases the Ribosome Translation prerequisite lab"
    );

    // These future Pond systems will grant permanent discoveries when
    // their actual interactions are implemented. This milestone only
    // defines the read-only progression contract.
    gameState.registry.discoveries.push(
        "successful_phagocytosis"
    );
    expectState(
        "food_vacuole",
        "coming-soon"
    );

    gameState.registry.discoveries.push(
        "endocytosis_observed"
    );
    expectState(
        "endosome",
        "coming-soon"
    );

    // Either cargo-uptake event satisfies the cargo side of the future
    // Lysosome gate, but Golgi routing remains independently required.
    let lysosomeStatus =
        expectState("lysosomes", "locked");
    assert.equal(
        lysosomeStatus
            .missingRequirements.length,
        1
    );
    assert.equal(
        lysosomeStatus
            .missingRequirements[0].id,
        "golgi_protein_routing"
    );

    gameState.registry.research
        .completedExperiments
        .golgi_protein_routing = {
            completedAtMs: 30
        };

    lysosomeStatus =
        expectState(
            "lysosomes",
            "coming-soon"
        );
    assert.equal(
        lysosomeStatus.requirementsMet,
        true
    );
} finally {
    for (const key of Object.keys(gameState)) {
        delete gameState[key];
    }
    Object.assign(gameState, backup);
}

console.log(
    "PASS: Polymerizer access unlocks the Ribosome Translation lab, future Pond uptake discoveries reveal Food Vacuole and Endosome previews, and Lysosome still requires Golgi routing plus either cargo route."
);
