import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import OrganelleProgressionManager from "../src/app/OrganelleProgressionManager.js";
import ResearchManager from "../src/app/ResearchManager.js";
import MetabolismPathwayCatalog from "../src/data/MetabolismPathwayCatalog.js";
import { proteinLibrary } from "../src/data/proteinLibrary.js";

const originalDateNow = Date.now;
const originalDiscoveries = [...gameState.registry.discoveries];
const originalAlgae = gameState.zones.pond.state.discoveredMicrobiomes;
const originalCompleted = structuredClone(gameState.registry.research.completedExperiments);
try {
    gameState.registry.discoveries = [];
    gameState.zones.pond.state.discoveredMicrobiomes = {};
    const statusAt = timestamp => {
        Date.now = () => Date.parse(timestamp);
        return OrganelleProgressionManager.getStatus("symbiosomes");
    };
    assert.equal(statusAt("2026-09-27T03:59:59Z").available, false);
    assert.equal(statusAt("2026-09-27T04:00:00Z").source, "temporary-class-access");
    gameState.registry.research.completedExperiments.photosystem_ii_assembly = true;
    assert.equal(statusAt("2026-10-05T03:59:59Z").available, true);
    assert.equal(statusAt("2026-10-05T04:00:00Z").available, false);
    assert.equal(ResearchManager.isExperimentCompleted("photosystem_ii_assembly"), true,
        "earned lab progress survives temporary access ending");
    assert.deepEqual(gameState.registry.discoveries, [], "temporary access is not a permanent unlock");
    gameState.zones.pond.state.discoveredMicrobiomes.algae_patch = true;
    assert.equal(statusAt("2026-10-05T04:00:00Z").available, true,
        "the normal algae-patch unlock survives the window");

    const calvin = MetabolismPathwayCatalog.get("calvinCycle");
    assert.equal(calvin.valid, true);
    assert.equal(calvin.coreSlots.length, 11);
    assert.equal(new Set(calvin.coreSlots.map(slot => slot.enzymeId)).size, 11);
    for (const slot of calvin.coreSlots) {
        assert.ok(proteinLibrary[slot.enzymeId], `${slot.label} has a protein record`);
    }
    assert.equal(calvin.reward.implemented, false);
} finally {
    Date.now = originalDateNow;
    gameState.registry.discoveries = originalDiscoveries;
    gameState.zones.pond.state.discoveredMicrobiomes = originalAlgae;
    gameState.registry.research.completedExperiments = originalCompleted;
}
