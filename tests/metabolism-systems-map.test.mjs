// Run with: node tests/metabolism-systems-map.test.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import gameState from "../src/app/GameState.js";
import MetabolismManager
    from "../src/app/MetabolismManager.js";
import MetabolismSystemsCatalog
    from "../src/data/MetabolismSystemsCatalog.js";

const storage = new Map();
globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) =>
        storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
};

const backup = structuredClone(gameState);

try {
    const system =
        MetabolismSystemsCatalog.get();

    assert.equal(system.valid, true);
    assert.deepEqual(
        system.nodes.map(node => node.id),
        [
            "glycogenBreakdown",
            "glucosePool",
            "glycolysis",
            "pyruvateBridge",
            "fattyAcidOxidation",
            "acetylCoAPool",
            "tcaCycle",
            "electronCarriers",
            "electronTransportChain"
        ]
    );
    assert(
        system.nodes.every(node =>
            node.controlImplemented === false
        ),
        "systems map must not silently implement regulation controls"
    );
    assert.equal(
        system.nodes.find(node =>
            node.id === "fattyAcidOxidation"
        ).themeId,
        "crimson"
    );

    const edges = new Set(
        system.connections.map(
            connection =>
                `${connection.from}->${connection.to}`
        )
    );
    [
        "glycogenBreakdown->glucosePool",
        "glucosePool->glycolysis",
        "glycolysis->pyruvateBridge",
        "pyruvateBridge->acetylCoAPool",
        "fattyAcidOxidation->acetylCoAPool",
        "acetylCoAPool->tcaCycle",
        "tcaCycle->electronCarriers",
        "glycolysis->electronCarriers",
        "fattyAcidOxidation->electronCarriers",
        "electronCarriers->electronTransportChain"
    ].forEach(edge => assert(edges.has(edge)));

    gameState.zones.metabolism.state = {};
    gameState.zones.polymerizer.state = {
        productInventory: {},
        activeAssembly: null
    };
    gameState.zones.macromolecularizer
        .state.motifInventory = {};
    MetabolismManager.initialize();

    const stateBefore = structuredClone(
        gameState.zones.metabolism.state
    );
    const atpBefore = structuredClone(
        gameState.registry.resources.atp
    );
    const status = MetabolismManager.getStatus();

    assert.equal(status.systems.valid, true);
    assert.equal(
        status.systems
            .regulationImplemented,
        false
    );
    assert.equal(
        status.systems.energyBalance
            .totalProductionATPPerMinute,
        1
    );
    assert.equal(
        status.systems.energyBalance
            .totalDemandATPPerMinute,
        0
    );
    assert.deepEqual(
        status.systems.energyBalance
            .demands,
        []
    );
    assert.equal(
        status.systems.nodes.find(node =>
            node.id === "glycolysis"
        ).interactive,
        true
    );
    assert.equal(
        status.systems.nodes.find(node =>
            node.id === "tcaCycle"
        ).interactive,
        true
    );
    assert.equal(
        status.systems.nodes.find(node =>
            node.id ===
                "electronTransportChain"
        ).interactive,
        true
    );
    assert.equal(
        status.systems.nodes.find(node =>
            node.id === "glycogenBreakdown"
        ).interactive,
        false
    );
    assert.deepEqual(
        gameState.zones.metabolism.state,
        stateBefore,
        "systems status must not add control or flow state"
    );
    assert.deepEqual(
        gameState.registry.resources.atp,
        atpBefore,
        "systems view must not change ATP"
    );

    const uiSource = fs.readFileSync(
        new URL(
            "../src/app/MetabolismUI.js",
            import.meta.url
        ),
        "utf8"
    );
    const viewSource = fs.readFileSync(
        new URL(
            "../src/app/MetabolismSystemsView.js",
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

    assert.match(uiSource, /Systems Map/);
    assert.match(uiSource, /Pathway Detail/);
    assert.match(uiSource, /metabolism-back-to-systems/);
    assert.match(uiSource, /MetabolismSystemsView\.render/);
    assert.doesNotMatch(
        uiSource,
        /setPathwayEnabled|pathwayControls/
    );
    assert.match(
        viewSource,
        /controlImplemented|CONTROL_LABELS/
    );
    assert.match(
        viewSource,
        /ATP production and demand ledger/
    );
    assert.match(
        cssSource,
        /metabolism-systems-track/
    );
    assert.match(
        cssSource,
        /metabolism-system-node--theme-crimson/
    );
} finally {
    for (const key of Object.keys(gameState)) {
        delete gameState[key];
    }
    Object.assign(gameState, backup);
}

console.log(
    "PASS: Metabolism provides a save-neutral systems map linking glycogen, Glycolysis, acetyl-CoA, fatty-acid oxidation, TCA, electron carriers, and ETC, with detail navigation and no regulation or ATP side effects."
);
