// Run with: node tests/pond-anchor-persistence.test.mjs

import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import CellCapabilityEvaluator
    from "../src/app/CellCapabilityEvaluator.js";
import MicrobiomeLibrary
    from "../src/app/MicrobiomeLibrary.js";
import PondController
    from "../src/app/PondController.js";
import SaveManager
    from "../src/app/SaveManager.js";

const backup = structuredClone(gameState);
const originalEvaluate =
    CellCapabilityEvaluator.evaluate;
const storage = new Map();
let saveWrites = 0;

globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => {
        saveWrites += 1;
        storage.set(key, String(value));
    },
    removeItem: key => storage.delete(key)
};

try {
    CellCapabilityEvaluator.evaluate = () => ({
        anchoring: { available: true },
        manualMovement: { available: true }
    });

    const pondState = gameState.zones.pond.state;

    pondState.player = {
        x: 4,
        y: -2,
        anchored: false
    };
    pondState.world.tiles = {
        "4,-2": {
            biome: "algae_patch",
            microbiomes: {
                substrate: "algae_patch",
                overlay: null
            }
        }
    };

    assert.deepEqual(
        PondController.canToggleAnchor(),
        {
            allowed: true,
            action: "anchor",
            biomeId: "algae_patch"
        }
    );
    assert.equal(PondController.toggleAnchor(), true);
    assert.equal(pondState.player.anchored, true);
    assert.equal(saveWrites, 1);

    const saved = JSON.parse(
        storage.get("ECGame_Save")
    );

    assert.deepEqual(
        saved.zones.pond.state.player,
        {
            x: 4,
            y: -2,
            anchored: true
        },
        "anchoring must persist the occupied coordinates atomically"
    );
    assert.equal(
        saved.zones.pond.state.world
            .tiles["4,-2"].biome,
        "algae_patch",
        "anchoring must persist the occupied microbiome atomically"
    );

    pondState.player.x = 99;
    pondState.player.y = 99;
    pondState.player.anchored = false;
    pondState.world.tiles = {};

    assert.equal(SaveManager.load(), true);
    assert.deepEqual(
        gameState.zones.pond.state.player,
        {
            x: 4,
            y: -2,
            anchored: true
        }
    );
    assert.equal(
        gameState.zones.pond.state.world
            .tiles["4,-2"].biome,
        "algae_patch"
    );

    gameState.zones.pond.state.player.anchored =
        false;
    gameState.zones.pond.state.world.tiles["4,-2"] = {
        biome: "open_water",
        microbiomes: {
            substrate: null,
            overlay: null
        }
    };

    assert.deepEqual(
        PondController.canToggleAnchor(),
        {
            allowed: false,
            reason: "open-water"
        }
    );
    assert.equal(PondController.toggleAnchor(), false);
    assert.equal(
        gameState.zones.pond.state.player.anchored,
        false
    );
    assert.equal(
        saveWrites,
        1,
        "a rejected open-water anchor must not save"
    );

    Object.values(MicrobiomeLibrary).forEach(
        biome => {
            assert.equal(
                biome.anchorable,
                biome.id !== "open_water",
                `${biome.id} has the wrong anchoring rule`
            );
        }
    );
} finally {
    CellCapabilityEvaluator.evaluate =
        originalEvaluate;

    for (const key of Object.keys(gameState)) {
        delete gameState[key];
    }
    Object.assign(gameState, backup);
}

console.log(
    "PASS: anchoring atomically saves the occupied microbiome and position, open water rejects anchoring, and every named microbiome is anchorable."
);
