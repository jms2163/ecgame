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

    const smoothStatus =
        OrganelleProgressionManager
            .getStatus(
                "smooth_endoplasmic_reticulum"
            );

    assert.equal(smoothStatus.available, true);
    assert.equal(
        smoothStatus.previewAvailable,
        false
    );
    assert.equal(
        smoothStatus.progressionState,
        "available"
    );
    assert.equal(
        organelleLibrary
            .smooth_endoplasmic_reticulum
            .components
            .find(component =>
                component.id === "lumen"
            )
            .description,
        "The internal, fluid-filled space inside the smooth ER that primarily stores and buffers calcium."
    );
    assert.match(
        OrganelleProgressionManager
            .getUnlockMessage(
                organelleLibrary[
                    "smooth_endoplasmic_reticulum"
                ],
                smoothStatus
            ),
        /select an available experiment/i
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
    "PASS: membrane lipids unlock the playable Smooth ER sequence, Glucose Transporter unlocks the playable Rough ER lab, ER targeting previews Golgi, and Lysosome retains its dual future prerequisite."
);
