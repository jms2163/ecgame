// Run with: node tests/organelle-coming-soon-progression.test.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import gameState from "../src/app/GameState.js";
import organelleLibrary
    from "../src/data/organelleLibrary.js";
import OrganelleProgressionManager
    from "../src/app/OrganelleProgressionManager.js";

const backup = structuredClone(gameState);

try {
    gameState.registry ??= {};
    gameState.registry.discoveries = [];
    gameState.registry.research ??= {};
    gameState.registry.research
        .completedExperiments = {};

    gameState.zones.macromolecularizer
        .state.motifInventory = {};
    gameState.zones.polymerizer
        .state.productInventory = {};

    for (const organelleId of [
        "smooth_endoplasmic_reticulum",
        "rough_endoplasmic_reticulum",
        "golgi_apparatus"
    ]) {
        assert.equal(
            OrganelleProgressionManager
                .getStatus(organelleId)
                .progressionState,
            "locked"
        );
    }

    gameState.zones.macromolecularizer
        .state.motifInventory
        .ErgosterolOleate = 2;
    assert.equal(
        OrganelleProgressionManager
            .getStatus(
                "smooth_endoplasmic_reticulum"
            )
            .requirementsMet,
        false,
        "a sterol ester must not satisfy the membrane-lipid gate"
    );

    gameState.zones.macromolecularizer
        .state.motifInventory.PE = 1;

    const smoothPreview =
        OrganelleProgressionManager
            .getStatus(
                "smooth_endoplasmic_reticulum"
            );

    assert.equal(smoothPreview.available, false);
    assert.equal(
        smoothPreview.previewAvailable,
        true
    );
    assert.equal(
        smoothPreview.progressionState,
        "coming-soon"
    );
    assert.match(
        OrganelleProgressionManager
            .getUnlockMessage(
                organelleLibrary[
                    "smooth_endoplasmic_reticulum"
                ],
                smoothPreview
            ),
        /coming soon/i
    );

    gameState.zones.polymerizer
        .state.productInventory
        .GlucoseTransporter = {
            count: 1,
            firstCompletedAtMs: 10,
            lastCompletedAtMs: 10
        };

    const roughERStatus =
        OrganelleProgressionManager
            .getStatus(
                "rough_endoplasmic_reticulum"
            );

    assert.equal(roughERStatus.available, true);
    assert.equal(
        roughERStatus.progressionState,
        "available"
    );

    assert.equal(
        OrganelleProgressionManager
            .getStatus("golgi_apparatus")
            .progressionState,
        "locked",
        "Glucose Transporter reveals the playable Rough ER lab, not the Golgi preview directly"
    );

    gameState.registry.research
        .completedExperiments
        .rough_er_protein_targeting = {
            completedAtMs: 15
        };

    const golgiPreview =
        OrganelleProgressionManager
            .getStatus("golgi_apparatus");

    assert.equal(golgiPreview.available, false);
    assert.equal(golgiPreview.previewAvailable, true);
    assert.equal(
        golgiPreview.progressionState,
        "coming-soon"
    );

    assert.equal(
        OrganelleProgressionManager
            .getStatus("lysosomes")
            .progressionState,
        "locked"
    );

    gameState.registry.research
        .completedExperiments
        .golgi_protein_routing = {
            completedAtMs: 20
        };
    gameState.registry.discoveries.push(
        "food_vacuole"
    );

    const lysosomePreview =
        OrganelleProgressionManager
            .getStatus("lysosomes");

    assert.equal(
        lysosomePreview.requirementsMet,
        true
    );
    assert.equal(
        lysosomePreview.progressionState,
        "coming-soon"
    );
    assert.equal(lysosomePreview.available, false);

    const mapSource = fs.readFileSync(
        new URL(
            "../src/app/CellMapView.js",
            import.meta.url
        ),
        "utf8"
    );
    const overviewSource = fs.readFileSync(
        new URL(
            "../src/app/OrganelleOverviewView.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        mapSource,
        /cell-map-feature--\$\{progressionState\}/
    );
    assert.match(
        overviewSource,
        /organelle-overview-status--\$\{availability\}/
    );
} finally {
    for (const key of Object.keys(gameState)) {
        delete gameState[key];
    }
    Object.assign(gameState, backup);
}

console.log(
    "PASS: membrane lipids preview Smooth ER, Glucose Transporter unlocks the playable Rough ER lab, ER targeting previews Golgi, and Lysosome retains its dual future prerequisite."
);
