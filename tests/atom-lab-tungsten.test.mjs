import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import GameStateManager from "../src/app/GameStateManager.js";
import AtomLabManager from "../src/app/AtomLabManager.js";
import AtomLabProgress from "../src/app/AtomLabProgress.js";
import PeriodicTableUI from "../src/app/PeriodicTableUI.js";

const storage = new Map();
globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
};
const original = structuredClone({
    discoveries: gameState.discoveries,
    registry: gameState.registry,
    atomLab: gameState.zones.atomLab
});

try {
    gameState.discoveries.atoms = {};
    gameState.discoveries.isotopes = {};
    gameState.discoveries.molecules.W = { discoveredAt: 100, count: 1 };
    gameState.registry.discoveries = [];
    gameState.zones.atomLab.completed = false;
    const state = gameState.zones.atomLab.state;
    state.buildMode = "free-build";
    state.activeTargetIsotope = "Hf180";
    state.freeBuildBuffer = { targetElement: "W", protons: 74, neutrons: 106, electrons: 74 };
    state.selectedElement = "W";
    state.targetElement = "W";
    state.nextPrompt = "Viewing Structure: Tungsten-184";

    assert.equal(GameStateManager.getIsotopeForElement("W").id, "W184");
    assert.deepEqual(GameStateManager.getParticleCountsForElement("W"),
        { protons: 74, neutrons: 110, electrons: 74 });
    assert.equal(AtomLabProgress.reconcile().changed, false,
        "selecting W or holding 74/106 in the workspace is not synthesis proof");
    assert.equal(GameStateManager.hasDiscovery("W"), true,
        "W also identifies the amino acid tryptophan");
    assert.equal(GameStateManager.hasDiscoveryInCategory("atoms", "W"), false);
    AtomLabManager.initialize();
    assert.equal(state.activeTargetIsotope, "W180");
    assert.equal(state.nextPrompt, "Synthesize Tungsten-180");
    assert.equal(gameState.discoveries.atoms.W, undefined);
    assert.equal(gameState.discoveries.isotopes.W180, undefined);
    const resumed = AtomLabManager.handleFreeBuildAction(state, "synthesize");
    assert.equal(resumed.reason, "synthesis-success");
    assert.ok(gameState.discoveries.atoms.W);
    assert.ok(gameState.discoveries.isotopes.W180);
    assert.equal(gameState.discoveries.isotopes.W184, undefined);

    gameState.discoveries.atoms = {};
    gameState.discoveries.isotopes = {};
    const processAction = AtomLabManager.processAction;
    let tileAction;
    AtomLabManager.processAction = (action, symbol) => {
        tileAction = [action, symbol];
        return { accepted: true };
    };
    try { PeriodicTableUI.handleElementClick("W"); }
    finally { AtomLabManager.processAction = processAction; }
    assert.deepEqual(tileAction, ["select_element", "W"],
        "a discovered tryptophan must not send tungsten to View mode");

    gameState.registry.discoveries.push("W");
    assert.equal(AtomLabProgress.reconcile().changed, true);
    assert.ok(gameState.discoveries.atoms.W,
        "legacy discovered tile restores the atom record");
    assert.equal(AtomLabProgress.reconcile().changed, false);
    const viewed = AtomLabManager.handleFreeBuildAction(state, "view_element", "W");
    assert.equal(viewed.accepted, true);
    assert.equal(state.activeTargetIsotope, "W184");
    assert.deepEqual(state.freeBuildBuffer,
        { targetElement: "W", protons: 74, neutrons: 110, electrons: 74 });
    assert.equal(state.nextPrompt, "Viewing Structure: Tungsten-184");

    delete gameState.discoveries.atoms.W;
    gameState.registry.discoveries = [];
    gameState.discoveries.isotopes.W180 = { discoveredAt: 123, count: 1 };
    assert.equal(AtomLabProgress.reconcile().changed, true);
    assert.equal(gameState.discoveries.atoms.W.discoveredAt, 123);
    AtomLabManager.handleFreeBuildAction(state, "view_element", "W");
    assert.equal(state.activeTargetIsotope, "W180");
    assert.equal(state.freeBuildBuffer.neutrons, 106);
    assert.equal(state.nextPrompt, "Viewing Structure: Tungsten-180");

    // A stale active isotope from hafnium must not validate or name tungsten.
    gameState.discoveries.atoms = {};
    gameState.discoveries.isotopes = {};
    state.targetElement = "W";
    state.activeTargetIsotope = "Hf180";
    state.freeBuildBuffer = { targetElement: "W", protons: 74, neutrons: 110, electrons: 74 };
    const synthesis = AtomLabManager.handleFreeBuildAction(state, "synthesize");
    assert.equal(synthesis.reason, "synthesis-success");
    assert.ok(gameState.discoveries.atoms.W);
    assert.ok(gameState.discoveries.isotopes.W184);
    assert.equal(gameState.discoveries.isotopes.Hf180, undefined);
    assert.equal(state.activeTargetIsotope, "W184");
} finally {
    gameState.discoveries = original.discoveries;
    gameState.registry = original.registry;
    gameState.zones.atomLab = original.atomLab;
}
