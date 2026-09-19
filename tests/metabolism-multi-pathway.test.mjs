// Run with: node tests/metabolism-multi-pathway.test.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import gameState from "../src/app/GameState.js";
import MetabolismManager
    from "../src/app/MetabolismManager.js";
import MetabolismPathwayCatalog
    from "../src/data/MetabolismPathwayCatalog.js";

const storage = new Map();
globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) =>
        storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
};

const backup = structuredClone(gameState);

try {
    const pathways =
        MetabolismPathwayCatalog.getAll();
    assert.deepEqual(
        pathways.map(pathway => pathway.id),
        [
            "glycolysis",
            "tcaCycle",
            "electronTransportChain"
        ]
    );
    assert(
        pathways.every(pathway =>
            pathway.valid
        )
    );

    const tca =
        MetabolismPathwayCatalog.get(
            "tcaCycle"
        );
    assert.equal(tca.themeId, "blue");
    assert.equal(tca.coreSlots.length, 8);
    assert.deepEqual(
        tca.coreSlots.map(slot =>
            slot.abbreviation
        ),
        [
            "CS",
            "ACO",
            "IDH",
            "AKGDH",
            "SCS",
            "SDH",
            "FUM",
            "MDH"
        ]
    );
    assert.equal(
        new Set(
            pathways.flatMap(pathway =>
                pathway.coreSlots.map(
                    slot => slot.abbreviation
                )
            )
        ).size,
        pathways.flatMap(pathway =>
            pathway.coreSlots
        ).length,
        "core enzyme abbreviations must not clash"
    );

    const citrateSynthase =
        tca.coreSlots[0];
    assert.equal(
        citrateSynthase
            .activationRequirements[0]
            .productId,
        "AcetylCoA"
    );
    assert.equal(
        tca.coreSlots[2]
            .activationRequirements[0]
            .productId,
        "NADPlus"
    );
    assert.equal(
        tca.coreSlots[5]
            .activationRequirements[0]
            .productId,
        "FAD"
    );
    assert.deepEqual(
        tca.coreSlots[4]
            .activationRequirements.map(
                requirement =>
                    requirement.productId
            ),
        ["ADP", "PO4"]
    );
    assert.equal(tca.chemistry.atpNet, 1);
    assert.equal(tca.reward.implemented, false);

    const etc =
        MetabolismPathwayCatalog.get(
            "electronTransportChain"
        );
    assert.equal(etc.themeId, "purple");
    assert.equal(
        etc.releaseState,
        "development"
    );
    assert.equal(etc.coreSlots.length, 0);
    assert.doesNotMatch(
        JSON.stringify(etc),
        /CoQ|ubiquinone/i
    );

    gameState.zones.metabolism.state = {};
    gameState.zones.polymerizer.state = {
        productInventory: {
            CitrateSynthase: { count: 1 }
        },
        activeAssembly: null
    };
    gameState.zones.macromolecularizer
        .state.motifInventory = {};
    MetabolismManager.initialize();

    let status =
        MetabolismManager.getPathwayStatus(
            "tcaCycle"
        );
    assert.equal(status.available, true);
    assert.equal(
        status.availableEnzymes[0]
            .functionReady,
        false
    );
    assert.equal(
        status.availableEnzymes[0]
            .activationRequirements[0]
            .label,
        "Acetyl-CoA"
    );

    let placement =
        MetabolismManager.placeEnzyme(
            "tcaCycle",
            1,
            "CitrateSynthase"
        );
    assert.equal(
        placement.reason,
        "enzyme-requirements-missing"
    );
    assert.equal(
        placement.missingRequirements[0]
            .productId,
        "AcetylCoA"
    );

    gameState.zones.macromolecularizer
        .state.motifInventory.AcetylCoA = {
            count: 1
        };
    placement = MetabolismManager.placeEnzyme(
        "tcaCycle",
        1,
        "CitrateSynthase"
    );
    assert.equal(placement.success, true);
    assert.equal(
        placement.reconstruction
            .atpPerMinute,
        0,
        "TCA must not invent an ATP rate reward"
    );

    status = MetabolismManager.getPathwayStatus(
        "electronTransportChain"
    );
    assert.equal(status.available, true);
    assert.equal(status.selectable, true);
    assert.equal(status.mapType, "network");
    assert.equal(
        status.networkStatus.nodes.length,
        9
    );

    const uiSource = fs.readFileSync(
        new URL(
            "../src/app/MetabolismUI.js",
            import.meta.url
        ),
        "utf8"
    );
    const cssSource = fs.readFileSync(
        new URL(
            "../public/css/metabolism.css",
            import.meta.url
        ),
        "utf8"
    );
    assert.match(
        uiSource,
        /metabolism-pathway-card--theme-/
    );
    assert.match(
        cssSource,
        /metabolism-pathway-card--theme-blue/
    );
    assert.match(
        cssSource,
        /metabolism-pathway-card--theme-purple/
    );
} finally {
    for (const key of Object.keys(gameState)) {
        delete gameState[key];
    }
    Object.assign(gameState, backup);
}

console.log(
    "PASS: Metabolism supports multiple data-driven pathway cards, a blue eight-step TCA preview with non-consuming cofactor gates, and a selectable purple ETC network without new save state."
);
