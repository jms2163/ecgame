// Run with: node tests/metabolism-etc-network.test.mjs

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
    const etc =
        MetabolismPathwayCatalog.get(
            "electronTransportChain"
        );
    const nodeById = Object.fromEntries(
        etc.network.nodes.map(node => [
            node.id,
            node
        ])
    );

    assert.equal(etc.valid, true);
    assert.equal(etc.themeId, "purple");
    assert.equal(etc.mapType, "network");
    assert.equal(
        etc.placementImplemented,
        false
    );
    assert.equal(
        nodeById.complexI.productId,
        "NADH_Dehydrogenase"
    );
    assert.equal(
        nodeById.complexII.productId,
        "SuccinateDehydrogenase",
        "ETC Complex II must reuse the TCA protein product"
    );
    assert.equal(
        nodeById.cytochromeC.productId,
        "CytochromeC"
    );
    assert.equal(
        nodeById.atpSynthase.productId,
        "ATP_Synthase"
    );
    assert.equal(
        nodeById.complexII.effect.includes(
            "does not pump H+"
        ),
        true
    );
    assert.deepEqual(
        nodeById.atpSynthase
            .activationRequirements.map(
                requirement =>
                    requirement.productId
            ),
        ["ADP", "PO4"]
    );
    assert.doesNotMatch(
        JSON.stringify(etc),
        /CoQ|ubiquinone/i
    );
    assert.equal(etc.reward.implemented, false);
    assert.match(
        etc.chemistry.energyAccounting[0],
        /deferred/i
    );

    gameState.zones.metabolism.state = {};
    gameState.zones.polymerizer.state = {
        productInventory: {},
        activeAssembly: null
    };
    gameState.zones.macromolecularizer
        .state.motifInventory = {};
    gameState.discoveries.molecules = {};
    MetabolismManager.initialize();

    const stateBefore = structuredClone(
        gameState.zones.metabolism.state
    );
    const atpBefore = structuredClone(
        gameState.registry.resources.atp
    );
    let status =
        MetabolismManager.getPathwayStatus(
            "electronTransportChain"
        );

    assert.equal(status.available, true);
    assert.equal(status.selectable, true);
    assert.equal(
        status.networkStatus.complete,
        false
    );
    assert.equal(
        status.networkStatus.nodes.find(
            node => node.id === "complexI"
        ).productReady,
        false
    );
    assert.deepEqual(
        gameState.zones.metabolism.state,
        stateBefore,
        "reading ETC status must not add pathway state"
    );
    assert.deepEqual(
        gameState.registry.resources.atp,
        atpBefore,
        "ETC preview must not alter ATP"
    );

    const inventory =
        gameState.zones.polymerizer
            .state.productInventory;
    [
        "NADH_Dehydrogenase",
        "SuccinateDehydrogenase",
        "CytochromeBC1Complex",
        "CytochromeC",
        "CytochromeCOxidase",
        "ATP_Synthase"
    ].forEach(productId => {
        inventory[productId] = { count: 1 };
    });

    gameState.zones.metabolism
        .state.completedModules
        .glycolysisCore = {
            completed: true,
            completedAtMs: 1
        };
    const tca =
        MetabolismPathwayCatalog.get(
            "tcaCycle"
        );
    gameState.zones.metabolism
        .state.pathwayPlacements
        .tcaCycle = Object.fromEntries(
            tca.coreSlots.map(slot => [
                String(slot.slot),
                slot.enzymeId
            ])
        );
    gameState.zones.macromolecularizer
        .state.motifInventory.ADP = {
            count: 1
        };
    gameState.discoveries.molecules.O2 = {
        discoveredAtMs: 1
    };
    gameState.discoveries.molecules.PO4 = {
        discoveredAtMs: 1
    };

    status = MetabolismManager.getPathwayStatus(
        "electronTransportChain"
    );
    assert.equal(
        status.networkStatus.complete,
        true
    );
    assert(
        status.networkStatus.nodes.every(
            node => node.functionReady
        )
    );
    assert(
        status.networkStatus.connections
            .every(connection =>
                connection.active
            )
    );
    assert.deepEqual(
        gameState.registry.resources.atp,
        atpBefore,
        "a ready ETC network still grants no ATP in this milestone"
    );

    const viewSource = fs.readFileSync(
        new URL(
            "../src/app/MetabolismPathwayView.js",
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
    assert.match(viewSource, /renderNetwork/);
    assert.match(
        viewSource,
        /mobile lipid electron carrier is abstracted/
    );
    assert.match(
        cssSource,
        /metabolism-network-track/
    );
    assert.match(
        cssSource,
        /data-pathway-theme="purple"/
    );
} finally {
    for (const key of Object.keys(gameState)) {
        delete gameState[key];
    }
    Object.assign(gameState, backup);
}

console.log(
    "PASS: ETC renders a purple data-driven dependency network, reuses TCA Complex II, derives NADH/FADH2 readiness, gates oxygen and ATP synthase inputs, abstracts the mobile lipid carrier, and awards no ATP."
);
