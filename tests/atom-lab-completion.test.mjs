import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import AtomLabProgress from "../src/app/AtomLabProgress.js";
import AtomLabManager from "../src/app/AtomLabManager.js";
import ZoneStatusResolver from "../src/app/ZoneStatusResolver.js";
import { elementLibrary } from "../src/data/elementLibrary.js";

const original = structuredClone({
    discoveries: gameState.discoveries,
    atomLab: gameState.zones.atomLab
});

try {
    const entries = Object.entries(elementLibrary);
    const representatives = [...new Map(entries.map(([id, element]) => [element.p, [id, element]])).values()];
    assert.equal(representatives.length, 120);
    assert.equal(elementLibrary.E119.name, "Harmonium-295");
    assert.equal(elementLibrary.E119.symbol, "Hr");
    assert.equal(AtomLabManager.getRepresentativeIsotope("Hr").id, "E119");

    gameState.discoveries.atoms = Object.fromEntries(
        representatives.filter(([, element]) => element.p !== 119)
            .map(([, element]) => [element.symbol, { discoveredAt: 1, count: 1 }])
    );
    gameState.discoveries.isotopes = {};
    gameState.zones.atomLab.completed = false;
    assert.deepEqual(AtomLabProgress.reconcile(), { count: 119, total: 120, changed: false });
    assert.equal(gameState.zones.atomLab.completed, false);

    // A released save has a padded element 119 discovery and an isotope record.
    gameState.discoveries.atoms[" Uue "] = { discoveredAt: 2, count: 3 };
    gameState.discoveries.isotopes.E119 = { discoveredAt: 2, count: 3 };
    assert.deepEqual(AtomLabProgress.reconcile(), { count: 120, total: 120, changed: true });
    assert.equal(gameState.discoveries.atoms.Hr.count, 3);
    assert.equal(gameState.discoveries.atoms[" Uue "], undefined);
    assert.equal(gameState.zones.atomLab.completed, true);

    // A real released report counted two spellings of the same 119 isotope.
    gameState.discoveries.isotopes = {
        " Uue 295": { discoveredAt: 5, count: 1 },
        "Uue 295": { discoveredAt: 6, count: 2 },
        "Ubn 298": { discoveredAt: 7, count: 1 }
    };
    const normalized = AtomLabProgress.reconcile();
    assert.equal(normalized.changed, true);
    assert.deepEqual(Object.keys(gameState.discoveries.isotopes).sort(), ["E119", "E120"]);
    assert.equal(gameState.discoveries.isotopes.E119.count, 2);
    assert.equal(gameState.discoveries.isotopes.E119.discoveredAt, 5);
    assert.equal(AtomLabProgress.reconcile().changed, false);

    assert.equal(ZoneStatusResolver.getStatus("atomLab").label, "Completed");
    assert.equal(AtomLabProgress.reconcile().changed, false);

    // Missing atom discovery is restored only when an isotope proves synthesis.
    delete gameState.discoveries.atoms.Hr;
    gameState.zones.atomLab.completed = false;
    assert.equal(AtomLabProgress.reconcile().count, 120);
    assert.equal(gameState.zones.atomLab.completed, true);
} finally {
    gameState.discoveries = original.discoveries;
    gameState.zones.atomLab = original.atomLab;
}
