// Run with: node tests/atp-hydrolysis-exploration.test.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import gameState from "../src/app/GameState.js";
import MacromolecularizerManager from "../src/app/MacromolecularizerManager.js";
import MacromolecularizerReactionExploration from "../src/app/MacromolecularizerReactionExploration.js";

const storage = new Map();
globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
};
globalThis.window = {
    addEventListener() {},
    removeEventListener() {}
};

class ExplorationElement {
    constructor() { this.innerHTML = ""; }
    addEventListener() {}
    contains() { return true; }
    querySelector() { return null; }
    querySelectorAll() { return []; }
}

gameState.discoveries.reactions = {};
gameState.registry.resources.atp = {
    current: 37,
    maximum: 50
};
gameState.zones.macromolecularizer.state = {
    motifInventory: { ATP: 1 }
};

MacromolecularizerManager.initialize();

const inventoryBefore = structuredClone(
    gameState.zones.macromolecularizer.state.motifInventory
);
const reserveBefore = structuredClone(
    gameState.registry.resources.atp
);
const explorationElement = new ExplorationElement();

MacromolecularizerReactionExploration.initialize(
    explorationElement,
    {
        onComplete: (category, reactionId) => {
            assert.equal(reactionId, "hydrolysis");
            return MacromolecularizerManager
                .completeHydrolysisExploration(category);
        },
        onExit() {}
    }
);
MacromolecularizerReactionExploration.open(
    "nucleotides",
    "hydrolysis"
);

assert.match(
    explorationElement.innerHTML,
    /Drag ATP to the reaction pane\./
);
assert.equal(
    MacromolecularizerReactionExploration.accept(
        "left",
        "left"
    ),
    true
);

const placedATPMarkup = explorationElement.innerHTML;
const waterHIndex = placedATPMarkup.indexOf(
    "macro-exp-hydrolysis-water-h"
);
const waterOHIndex = placedATPMarkup.indexOf(
    "macro-exp-hydrolysis-water-oh"
);

assert.match(
    placedATPMarkup,
    /data-explore-drop="terminal-bond"/
);
assert(
    waterHIndex >= 0 && waterHIndex < waterOHIndex,
    "water must face the activity as H-OH"
);
assert.equal(
    MacromolecularizerReactionExploration.accept(
        "water",
        "terminal-bond"
    ),
    true
);

const productMarkup = explorationElement.innerHTML;
const adpPIndex = productMarkup.indexOf(
    "macro-exp-hydrolysis-adp-terminal-p"
);
const adpOIndex = productMarkup.indexOf(
    "macro-exp-hydrolysis-adp-o"
);
const adpHIndex = productMarkup.indexOf(
    "macro-exp-hydrolysis-adp-h"
);
const phosphateHIndex = productMarkup.indexOf(
    "macro-exp-hydrolysis-phosphate-h"
);
const phosphateOIndex = productMarkup.indexOf(
    "macro-exp-hydrolysis-phosphate-o"
);
const phosphatePIndex = productMarkup.indexOf(
    "macro-exp-hydrolysis-phosphate-p"
);

assert(
    adpPIndex < adpOIndex && adpOIndex < adpHIndex,
    "ADP product must end in P-O-H"
);
assert(
    phosphateHIndex < phosphateOIndex &&
    phosphateOIndex < phosphatePIndex,
    "phosphate product must read H-O-P, never O-H-P"
);
assert.match(
    productMarkup,
    /ATP REACTS WITH WATER TO PRODUCE ADP, PHOSPHATE, AND ENERGY\./
);
assert.match(
    productMarkup,
    /ATP \+ H₂O → ADP \+ phosphate \+ ⚡/
);
assert.equal(
    MacromolecularizerManager.hasReactionDiscovery(
        "hydrolysis-4"
    ),
    true
);
assert.equal(
    MacromolecularizerManager.hasReactionDiscovery(
        "hydrolysis"
    ),
    true
);
assert.deepEqual(
    gameState.zones.macromolecularizer.state.motifInventory,
    inventoryBefore,
    "the teaching exploration must not consume stored ATP"
);
assert.deepEqual(
    gameState.registry.resources.atp,
    reserveBefore,
    "the teaching exploration must not alter the spendable ATP reserve"
);

const cssSource = fs.readFileSync(
    new URL("../public/css/macromolecularizer.css", import.meta.url),
    "utf8"
);
const uiSource = fs.readFileSync(
    new URL("../src/app/MacromolecularizerUI.js", import.meta.url),
    "utf8"
);

assert.match(
    cssSource,
    /macro-exp-hydrolysis-adp-added[\s\S]*260ms/
);
assert.match(
    cssSource,
    /macro-exp-hydrolysis-adp-hydrogen[\s\S]*520ms/
);
assert.match(
    cssSource,
    /macro-exp-hydrolysis-phosphate-slide/
);
assert.match(uiSource, /completeHydrolysisExploration/);
assert.match(uiSource, /hydrolysisExplorationDiscovered/);

console.log(
    "PASS: nucleotide hydrolysis places ATP and H-OH, animates ADP as P-O-H and phosphate as H-O-P, records hydrolysis-4, displays released energy, and changes no inventory or ATP resource."
);
