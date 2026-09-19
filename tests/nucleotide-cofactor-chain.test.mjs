// Run with: node tests/nucleotide-cofactor-chain.test.mjs

import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import NucleotideRecipeCatalog
    from "../src/data/NucleotideRecipeCatalog.js";
import MacromolecularizerManager
    from "../src/app/MacromolecularizerManager.js";
import MetabolismManager
    from "../src/app/MetabolismManager.js";
import ATPManager from "../src/app/ATPManager.js";

const storage = new Map();
let rejectWrites = false;

globalThis.localStorage = {
    getItem: key =>
        storage.get(key) ?? null,
    setItem: (key, value) => {
        if (rejectWrites) {
            throw new Error(
                "intentional test save failure"
            );
        }

        storage.set(key, String(value));
    },
    removeItem: key => storage.delete(key)
};

const nmn =
    NucleotideRecipeCatalog.get("NMN");
const nad =
    NucleotideRecipeCatalog.get("NADPlus");

assert.equal(nmn.implemented, true);
assert.equal(nmn.atpCost, 2);
assert.equal(nmn.consumesComponents, false);
assert.deepEqual(
    nmn.components.map(component => [
        component.id,
        component.sourceZoneId
    ]),
    [
        ["Nicotinamide", "moleculeLab"],
        ["Ribose", "moleculeLab"],
        ["PO4", "moleculeLab"]
    ]
);

assert.equal(nad.implemented, true);
assert.equal(nad.atpCost, 1);
assert.equal(nad.consumesComponents, false);
assert.deepEqual(
    nad.components.map(component => [
        component.id,
        component.sourceZoneId
    ]),
    [
        ["AMP", "macromolecularizer"],
        ["NMN", "macromolecularizer"]
    ]
);

gameState.zones.moleculeLab.state = {
    synthesized: {
        Nicotinamide: { count: 1 },
        Ribose: { count: 1 },
        PO4: { count: 1 }
    }
};
gameState.zones.macromolecularizer.state = {};
gameState.zones.polymerizer.state = {
    productInventory: {}
};
gameState.zones.metabolism.state = {};

MacromolecularizerManager.initialize();
MetabolismManager.initialize();

let nadEligibility =
    MacromolecularizerManager
        .getMotifEligibility(
            "NADPlus"
        );

assert.deepEqual(
    nadEligibility.monomers.map(
        component => ({
            id: component.id,
            sourceZoneId:
                component.sourceZoneId,
            synthesized:
                component.synthesized
        })
    ),
    [
        {
            id: "AMP",
            sourceZoneId:
                "macromolecularizer",
            synthesized: false
        },
        {
            id: "NMN",
            sourceZoneId:
                "macromolecularizer",
            synthesized: false
        }
    ]
);

const macromolecularInventory =
    gameState.zones.macromolecularizer
        .state.motifInventory;
macromolecularInventory.AMP = 1;
macromolecularInventory.NMN = 1;

nadEligibility =
    MacromolecularizerManager
        .getMotifEligibility(
            "NADPlus"
        );

assert.equal(
    nadEligibility.monomers.every(
        component =>
            component.synthesized
    ),
    true
);

const polymerizerInventory =
    gameState.zones.polymerizer.state
        .productInventory;
polymerizerInventory.GlucoseTransporter = {
    count: 1
};
polymerizerInventory.EnergyKinase = {
    count: 1
};

let coreStatus =
    MetabolismManager
        .getPathwayStatus("glycolysis")
        .coreModuleStatus;

assert.equal(coreStatus.requirementsMet, false);
assert.equal(coreStatus.canComplete, false);

macromolecularInventory.NADPlus = 1;
coreStatus =
    MetabolismManager
        .getPathwayStatus("glycolysis")
        .coreModuleStatus;

assert.equal(coreStatus.requirementsMet, true);
assert.equal(coreStatus.canComplete, true);

const inventoriesBeforeActivation = {
    polymerizer:
        structuredClone(
            polymerizerInventory
        ),
    macromolecularizer:
        structuredClone(
            macromolecularInventory
        )
};

const activated =
    MetabolismManager.completeCoreModule(
        "glycolysis",
        123456
    );

assert.equal(activated.success, true);
assert.equal(activated.atpPerMinute, 4);
assert.deepEqual(
    gameState.zones.metabolism.state
        .completedModules.glycolysisCore,
    {
        completed: true,
        completedAtMs: 123456
    }
);
assert.deepEqual(
    polymerizerInventory,
    inventoriesBeforeActivation
        .polymerizer
);
assert.deepEqual(
    macromolecularInventory,
    inventoriesBeforeActivation
        .macromolecularizer
);
assert.equal(
    ATPManager.getProductionStatus()
        .sources.find(source =>
            source.id ===
                "glycolysisCore"
        ).atpPerMinute,
    4
);

const duplicate =
    MetabolismManager.completeCoreModule(
        "glycolysis"
    );
assert.equal(
    duplicate.reason,
    "core-module-already-completed"
);

delete gameState.zones.metabolism.state
    .completedModules.glycolysisCore;
rejectWrites = true;
const originalConsoleError = console.error;
console.error = () => {};

const failed =
    MetabolismManager.completeCoreModule(
        "glycolysis",
        654321
    );

console.error = originalConsoleError;
rejectWrites = false;
assert.equal(failed.reason, "save-failed");
assert.equal(
    gameState.zones.metabolism.state
        .completedModules.glycolysisCore,
    undefined
);

console.log(
    "PASS: NMN and NAD+ use non-consuming cross-zone prerequisites, and the Glycolysis Core activates once, preserves inventories, grants +4 ATP/min, and rolls back failed saves."
);
