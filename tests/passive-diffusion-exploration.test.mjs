import assert from "node:assert/strict";
import Engine from "../src/app/PassiveDiffusionEngine.js";
import Trials from "../src/app/PassiveDiffusionTrialManager.js";
import experiment, { substances } from "../src/app/PassiveDiffusionCatalog.js";
import gameState from "../src/app/GameState.js";
import SaveManager from "../src/app/SaveManager.js";
import ResearchManager from "../src/app/ResearchManager.js";
import Stage from "../src/app/OrganelleExperimentStage.js";
import View from "../src/app/PassiveDiffusionView.js";
import ExperimentMaterialVisualLibrary from "../src/app/ExperimentMaterialVisualLibrary.js";
import PlasmaMembraneVisualCatalog from "../src/app/PlasmaMembraneVisualCatalog.js";
import { readFileSync } from "node:fs";

assert.deepEqual(
    PlasmaMembraneVisualCatalog.geometry,
    { start: 0.44, end: 0.56 }
);
assert.match(
    PlasmaMembraneVisualCatalog.assets.simulation,
    /phospholipid-bilayer-animated\.svg$/
);
for (const material of Object.values(substances)) {
    assert.ok(
        ExperimentMaterialVisualLibrary.definitions[material.visualId],
        `${material.visualId} must use the shared material visual catalog`
    );
}
assert.equal(
    ExperimentMaterialVisualLibrary.definitions[
        substances.water.visualId
    ].simulationColor,
    "#58b8ff"
);

const viewSource = readFileSync(
    new URL("../src/app/PassiveDiffusionView.js", import.meta.url),
    "utf8"
);
assert.ok(
    viewSource.indexOf('class="pd-record"') <
        viewSource.indexOf('class="pd-reset"'),
    "Record observation appears immediately before New trial / Reset"
);

function observed(id, side = "left", position) {
    const state = Engine.create(id, side, position);
    for (let i = 0; i < 1200 && !Engine.ready(state); i++) Engine.step(state, 0.1);
    assert.ok(Engine.ready(state), `${id} must finish from ${side}`);
    return state;
}

for (const [id, material] of Object.entries(substances)) {
    for (const side of ["left", "right"]) {
        const s = observed(id, side, { x: side === "left" ? 0 : 1, y: 0.99 });
        const summary = Engine.summary(s);
        assert.equal(summary.particles, material.count ?? 12);
        assert.ok(s.particles.every(p => p.x >= 0.04 && p.x <= 0.96 && p.y >= 0.04 && p.y <= 0.96));
        if (material.behavior === "stays") {
            assert.equal(summary.transfers, 0);
            assert.ok(s.particles.every(p => side === "left" ? p.x < 0.44 : p.x > 0.56));
        } else if (material.behavior === "embeds") {
            assert.equal(summary.embedded, 12);
            const positions = s.particles.map(p => [p.x, p.y]);
            Engine.step(s, 0.1);
            assert.deepEqual(s.particles.map(p => [p.x, p.y]), positions);
        } else {
            assert.ok(summary.transfers > 0);
        }
    }
}
const gas = observed("CO2");
assert.ok(gas.particles.every(p => p.transfers >= 2), "gas returns across the membrane, without a one-way lock");
assert.deepEqual(observed("water"), observed("water"), "seeded trials are deterministic");
assert.ok(Engine.summary(observed("water")).transfers < Engine.summary(gas).transfers);
assert.equal(Engine.ready(Engine.create("CO2")), false);

const originalState = structuredClone(gameState);
const originalSave = SaveManager.save;
try {
    gameState.registry ??= {};
    gameState.registry.discoveries = ["H2O"];
    gameState.registry.research = { completedExperiments: {} };
    let result = Trials.record({ id: "locked", state: gas, prediction: "stays" });
    assert.equal(result.reason, "requirements-not-met");
    gameState.registry.research.completedExperiments.dynamic_movement = { completedAtMs: 1 };
    const before = SaveManager.export();
    result = Trials.record({ id: "sandbox", state: gas, prediction: "stays", sandbox: true });
    assert.equal(result.reason, "sandbox");
    assert.equal(SaveManager.export(), before);
    SaveManager.save = () => false;
    result = Trials.record({ id: "failure", state: gas, prediction: "stays" });
    assert.equal(result.reason, "save-failed");
    assert.equal(SaveManager.export(), before, "failed save rolls back trial data");
    SaveManager.save = () => true;
    const startingXP = gameState.player.xp;
    const ids = Object.keys(substances);
    for (const id of ids.slice(0, -1)) {
        // Wrong/unsure predictions still count as exploration.
        assert.equal(Trials.record({ id, state: observed(id), prediction: "unsure", reflection: "I will compare the structures." }).ok, true);
    }
    const beforeCompletion = SaveManager.export();
    SaveManager.save = () => false;
    result = Trials.record({ id: "last", state: observed(ids.at(-1)), prediction: "stays" });
    assert.equal(result.reason, "save-failed");
    assert.equal(SaveManager.export(), beforeCompletion, "failed final save rolls back XP and completion too");
    SaveManager.save = () => true;
    result = Trials.record({ id: "last", state: observed(ids.at(-1)), prediction: "stays" });
    assert.equal(result.xpAwarded, 250);
    assert.equal(gameState.player.xp, startingXP + 250);
    assert.ok(ResearchManager.isExperimentCompleted(experiment.id));
    assert.equal(Trials.progress().length, 11);
    View.select = {
        options: Object.keys(substances).map(value => ({
            value,
            textContent: ""
        }))
    };
    View.refreshSubstanceOptions();
    assert.ok(
        View.select.options.every(option =>
            option.textContent.startsWith("✓ ")),
        "every saved substance receives a dropdown checkmark"
    );
    assert.equal(Trials.record({ id: "last", state: observed(ids.at(-1)), prediction: "stays" }).duplicate, true);
    assert.equal(Trials.record({ id: "repeated", state: gas, prediction: "crosses" }).xpAwarded, 0);
    assert.equal(gameState.player.xp, startingXP + 250);
    assert.equal(gameState.registry.research.bestExperimentScores?.passive_diffusion, undefined);
    assert.equal(gameState.registry.research.stars?.passive_diffusion, undefined);
    const saved = JSON.parse(SaveManager.export());
    Object.assign(gameState, saved);
    assert.equal(Trials.progress().length, 11, "progress survives serialization/reload");
    assert.equal(Trials.records()[0].reflection, "I will compare the structures.");
    assert.equal(Stage.regradeExperiment(experiment), null, "exploration is not regraded");
} finally {
    for (const key of Object.keys(gameState)) delete gameState[key];
    Object.assign(gameState, originalState);
    SaveManager.save = originalSave;
}
console.log("PASS: all 11 substances, both starting sides, bidirectional and limited permeability, embedding, ungraded progress, serialization, duplicate rewards, and save-failure rollback.");
