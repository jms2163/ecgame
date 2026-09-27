import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import Manager from "../src/app/MetabolismManager.js";
import Catalog from "../src/data/MetabolismPathwayCatalog.js";
import { pathwayCardState, sortPathwayCards } from "../src/app/MetabolismUI.js";

const backup = structuredClone(gameState);
try {
    gameState.zones.metabolism.state = { pathwayPlacements: {}, completedModules: {} };
    gameState.zones.polymerizer.state.productInventory = {};
    Manager.initialize();
    let glycolysis = Manager.getPathwayStatus("glycolysis");
    let tca = Manager.getPathwayStatus("tcaCycle");
    const etc = Manager.getPathwayStatus("electronTransportChain");
    assert.equal(pathwayCardState(glycolysis), "locked");
    assert.equal(pathwayCardState(tca), "available");
    assert.equal(pathwayCardState(etc), "available",
        "the ETC preview is inspectable, never completed by readiness alone");

    gameState.zones.polymerizer.state.productInventory.GlucoseTransporter = { count: 1 };
    glycolysis = Manager.getPathwayStatus("glycolysis");
    assert.equal(pathwayCardState(glycolysis), "available");
    const allGlycolysisSlots = [
        ...Catalog.get("glycolysis").coreSlots,
        ...Catalog.get("glycolysis").regenerationBranches.flatMap(branch => branch.slots)
    ];
    gameState.zones.metabolism.state.pathwayPlacements.glycolysis =
        Object.fromEntries(allGlycolysisSlots.map(slot => [String(slot.slot), slot.enzymeId]));
    glycolysis = Manager.getPathwayStatus("glycolysis");
    assert.equal(pathwayCardState(glycolysis), "completed");
    delete gameState.zones.metabolism.state.pathwayPlacements.glycolysis["11"];
    glycolysis = Manager.getPathwayStatus("glycolysis");
    assert.equal(pathwayCardState(glycolysis), "available",
        "LDH remains part of the published completion rule");
    gameState.zones.metabolism.state.pathwayPlacements.tcaCycle =
        Object.fromEntries(Catalog.get("tcaCycle").coreSlots.map(slot => [String(slot.slot), slot.enzymeId]));
    tca = Manager.getPathwayStatus("tcaCycle");
    assert.equal(pathwayCardState(tca), "completed");
    const sorted = sortPathwayCards([
        tca, { id: "new", available: false, releaseState: "development" },
        glycolysis, etc
    ]);
    assert.deepEqual(sorted.map(pathway => pathway.id),
        ["glycolysis", "electronTransportChain", "new", "tcaCycle"]);
} finally {
    for (const key of Object.keys(gameState)) delete gameState[key];
    Object.assign(gameState, backup);
}
console.log("PASS: pathway cards sort Available, Locked, Completed and show completion only for saved full reconstructions.");
