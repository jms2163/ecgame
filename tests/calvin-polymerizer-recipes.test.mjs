import assert from "node:assert/strict";
import PolymerizerRecipeCatalog from "../src/data/PolymerizerRecipeCatalog.js";
import PolymerizerVisualCatalog from "../src/data/PolymerizerVisualCatalog.js";

const expected = [
    ["FructoseBisphosphatase", { H: 20, B: 16, L: 40 }, 20],
    ["Transketolase", { H: 54, B: 34, L: 88 }, 40],
    ["SedoheptuloseBisphosphatase", { H: 22, B: 34, L: 52 }, 22],
    ["Ribose5PhosphateIsomerase", { H: 14, B: 30, L: 44 }, 18],
    ["Ribulose5PhosphateEpimerase", { H: 10, B: 8, L: 17 }, 17],
    ["Phosphoribulokinase", { H: 9, B: 14, L: 21 }, 27]
];
for (const [id, counts, lastFrame] of expected) {
    const recipe = PolymerizerRecipeCatalog.get(id);
    const visual = PolymerizerVisualCatalog.get(id);
    assert.equal(recipe.valid, true, `${id} has a valid recipe`);
    assert.equal(recipe.implemented, true);
    assert.equal(recipe.structureOrderKnown, false, "chain order is not fabricated");
    assert.deepEqual(Object.fromEntries(recipe.motifRequirements.map(
        item => [item.symbol, item.quantity]
    )), counts);
    assert.equal(recipe.atpCost, Object.values(counts).reduce((a, b) => a + b));
    assert.deepEqual([visual.firstFrameNumber, visual.lastFrameNumber], [1, lastFrame]);
    assert.equal(visual.frameCount, lastFrame);
    assert.match(visual.finalImageUrl, new RegExp(`-${lastFrame}\\.png$`));
}
