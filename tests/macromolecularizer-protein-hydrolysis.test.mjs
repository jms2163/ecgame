// Run with: node --test tests/macromolecularizer-protein-hydrolysis.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import gameState from "../src/app/GameState.js";
import MacromolecularizerManager from "../src/app/MacromolecularizerManager.js";
import exploration from "../src/app/MacromolecularizerReactionExploration.js";
import SynthesisPointManager from "../src/app/SynthesisPointManager.js";

const storage = new Map();
globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
};
globalThis.window = { addEventListener() {}, removeEventListener() {} };

class Element {
    innerHTML = "";
    addEventListener() {}
    querySelector() { return null; }
    querySelectorAll() { return []; }
}

gameState.discoveries.reactions = { hydrolysis: { discovered: true } };
gameState.zones.macromolecularizer.state = {
    motifInventory: { H_helix: 3 }
};
gameState.registry.resources.atp = { current: 32, maximum: 50 };
gameState.registry.resources.synthesisPoints = { current: 5, lifetimeEarned: 9 };
MacromolecularizerManager.initialize();
const inventory = structuredClone(gameState.zones.macromolecularizer.state.motifInventory);
const atp = structuredClone(gameState.registry.resources.atp);
const element = new Element();
let completions = 0;
exploration.initialize(element, {
    onComplete(category, reactionId) {
        assert.equal(category, "motifs");
        assert.equal(reactionId, "hydrolysis");
        completions++;
        return MacromolecularizerManager.completeHydrolysisExploration(category);
    },
    onExit() {}
});

exploration.open("motifs", "hydrolysis");
assert.match(element.innerHTML, /Residue 1/);
assert.match(element.innerHTML, /Residue 2/);
assert.match(element.innerHTML, /macro-exp-peptide-bond--target" data-explore-drop="peptide-bond"/);
assert.match(element.innerHTML, /data-explore-drag="water"/);
assert(element.innerHTML.indexOf("macro-exp-protein-water-oh") < element.innerHTML.indexOf("macro-exp-protein-water-h"));
assert.equal(exploration.accept("water", "carbon"), false);
assert.equal(exploration.accept("bond", "peptide-bond"), false);
assert.equal(completions, 0);
assert.equal(exploration.accept("water", "peptide-bond"), true);
assert.match(element.innerHTML, /macro-exp-peptide-bond--breaking/);
assert.match(element.innerHTML, /macro-exp-protein-water-animation/);
assert.match(element.innerHTML, /macro-exp-protein-added-oh/);
assert.match(element.innerHTML, /macro-exp-protein-added-h/);
assert.match(element.innerHTML, /Hydrolysis discovered: water breaks a peptide bond\./);
assert.match(element.innerHTML, /\+1 Synthesis Point/);
assert.match(element.innerHTML, /Two amino acids after peptide bond cleavage/);
assert.match(element.innerHTML, /bearing OH/);
assert.equal(completions, 1);
assert.equal(exploration.accept("water", "peptide-bond"), false);
assert.equal(MacromolecularizerManager.hasReactionDiscovery("hydrolysis-2"), true);
assert.equal(MacromolecularizerManager.hasReactionDiscovery("hydrolysis"), true);
assert.equal(gameState.discoveries.reactions["hydrolysis-2"].synthesisPointAwarded, true);
assert.deepEqual(SynthesisPointManager.getStatus(), { current: 6, lifetimeEarned: 10 });
assert.deepEqual(gameState.zones.macromolecularizer.state.motifInventory, inventory);
assert.deepEqual(gameState.registry.resources.atp, atp);

exploration.open("motifs", "hydrolysis");
assert.equal(exploration.step, 0);
assert.match(element.innerHTML, /H₂O/);
assert.equal(exploration.accept("water", "peptide-bond"), true);
assert.equal(completions, 2);
assert.doesNotMatch(element.innerHTML, /\+1 Synthesis Point/);
assert.deepEqual(SynthesisPointManager.getStatus(), { current: 6, lifetimeEarned: 10 });

// An older save can already know hydrolysis-2 without the new reward marker.
delete gameState.discoveries.reactions["hydrolysis-2"].synthesisPointAwarded;
assert.equal(MacromolecularizerManager.completeHydrolysisExploration("motifs").synthesisPointsAwarded, 1);
assert.deepEqual(SynthesisPointManager.getStatus(), { current: 7, lifetimeEarned: 11 });
assert.equal(MacromolecularizerManager.completeHydrolysisExploration("motifs").synthesisPointsAwarded, 0);
assert.deepEqual(SynthesisPointManager.getStatus(), { current: 7, lifetimeEarned: 11 });
delete gameState.discoveries.reactions.hydrolysis;
assert.equal(MacromolecularizerManager.hasReactionDiscovery("hydrolysis"), false);
assert.equal(MacromolecularizerManager.completeHydrolysisExploration("motifs").saved, true);
assert.equal(MacromolecularizerManager.hasReactionDiscovery("hydrolysis"), true);

exploration.open("motifs", "dehydration");
assert.match(element.innerHTML, /Drag the first amino acid/);
assert.match(element.innerHTML, /data-explore-drop="left"/);
assert.equal(exploration.accept("left", "left"), true);
assert.match(element.innerHTML, /data-explore-drop="right"/);

const ui = fs.readFileSync(new URL("../src/app/MacromolecularizerUI.js", import.meta.url), "utf8");
assert.match(ui, /motifs: "hydrolysis-2"/);
assert.match(ui, /category === "nucleotides" \|\| category === "motifs"/);
const css = fs.readFileSync(new URL("../public/css/macromolecularizer.css", import.meta.url), "utf8");
assert.match(css, /macro-exp-protein-bond-break/);
assert.match(css, /macro-exp-protein-oh-to-carbon/);
assert.match(css, /macro-exp-protein-h-to-nitrogen/);
assert.match(css, /macro-exp-protein-left-separate/);
console.log("PASS: one water drag to the C—N bond awards one synthesis point, supports prior saves, prevents replay farming, and leaves inventory and ATP intact.");
