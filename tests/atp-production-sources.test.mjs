// Run with: node tests/atp-production-sources.test.mjs

import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import ATPManager from "../src/app/ATPManager.js";
import ResourceManager
    from "../src/app/ResourceManager.js";

gameState.zones.polymerizer.state.productInventory = {};
gameState.zones.metabolism.state = {
    pathwayPlacements: {},
    completedModules: {}
};
ResourceManager.setATPStatus(
    { current: 0, maximum: 1000 },
    "atp-source-test-setup"
);

let production = ATPManager.getProductionStatus();
assert.equal(production.totalATPPerMinute, 1);

gameState.zones.polymerizer.state
    .productInventory.EnergyKinase = {
        count: 1,
        firstCompletedAtMs: 1,
        lastCompletedAtMs: 1
    };
production = ATPManager.getProductionStatus();
assert.equal(production.totalATPPerMinute, 3);

gameState.zones.metabolism.state
    .completedModules.glycolysisCore = {
        completed: true,
        completedAtMs: 2
    };
production = ATPManager.getProductionStatus();
assert.equal(production.totalATPPerMinute, 7);

const coreEnzymes = [
    "Hexokinase",
    "PhosphoglucoseIsomerase",
    "Phosphofructokinase",
    "Aldolase",
    "TriosePhosphateIsomerase",
    "Glyceraldehyde3PhosphateDehydrogenase",
    "PhosphoglycerateKinase",
    "PhosphoglycerateMutase",
    "Enolase",
    "PyruvateKinase"
];
gameState.zones.metabolism.state
    .pathwayPlacements.glycolysis =
        Object.fromEntries(
            coreEnzymes.map(
                (enzymeId, index) => [
                    String(index + 1),
                    enzymeId
                ]
            )
        );

production = ATPManager.getProductionStatus();
assert.equal(production.totalATPPerMinute, 10);
assert.equal(
    production.sources.find(source =>
        source.id === "glycolysisReconstruction"
    ).progress.percent,
    100
);
assert.equal(production.increasesCapacity, false);

const gained = ATPManager.handleGameTick({
    deltaSec: 60
});
assert.equal(gained, 10);
assert.deepEqual(
    ResourceManager.getATPStatus(),
    { current: 10, maximum: 1000 }
);

// Wrong slot references never earn production.
gameState.zones.metabolism.state
    .pathwayPlacements.glycolysis[1] =
        "PyruvateKinase";
assert.equal(
    ATPManager.getProductionStatus()
        .totalATPPerMinute,
    9.7
);

const balance = ATPManager.getBalanceStatus();
assert.equal(balance.totalProductionATPPerMinute, 9.7);
assert.equal(balance.totalDemandATPPerMinute, 0);
assert.equal(balance.netATPPerMinute, 9.7);
assert.deepEqual(balance.demands, []);
assert.equal(
    balance.demandModelStatus,
    "deferred-milestone-5"
);
assert.equal(balance.increasesCapacity, false);

console.log(
    "PASS: ATP production stacks base 1, Energy Kinase 2, Glycolysis Core 4, and a fixed 0.3 ATP/min for each correctly placed core enzyme, with a save-neutral zero-demand ledger and no capacity increase."
);
