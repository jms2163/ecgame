import assert from "node:assert/strict";
import { proteinLibrary } from "../src/data/proteinLibrary.js";
import Recipes from "../src/data/PolymerizerRecipeCatalog.js";
import Visuals from "../src/data/PolymerizerVisualCatalog.js";

for (const entry of [
    ["TriosePhosphateTranslocator", "5Y78", { H: 10, B: 0, L: 11 }, 12],
    ["SucroseSynthase1", "3S27", { H: 24, B: 28, L: 53 }, 51],
    ["GranuleBoundStarchSynthase1", "3VUF", { H: 15, B: 19, L: 36 }, 32],
    ["Isoamylase", "1BF2", { H: 12, B: 22, L: 33 }, 44],
    ["Ferredoxin", "1A70", { H: 1, B: 5, L: 6 }, 8],
    ["FerredoxinNADPReductase", "1FND", { H: 6, B: 12, L: 19 }, 23],
    ["Plastocyanin", "1PLC", { H: 1, B: 7, L: 9 }, 10]
]) {
    const [id, pdb, motifs, last] = entry;
    const recipe = Recipes.get(id);
    const visual = Visuals.get(id);
    assert.equal(proteinLibrary[id].Source, pdb);
    assert.deepEqual(proteinLibrary[id].Recipe, motifs);
    assert.equal(recipe.valid, true);
    assert.equal(recipe.implemented, true);
    assert.equal(recipe.structureOrderKnown, false);
    assert.equal(recipe.atpCost, Object.values(motifs).reduce((sum, n) => sum + n, 0));
    assert.equal(visual.firstFrameNumber, 0);
    assert.equal(visual.lastFrameNumber, last);
    assert.match(visual.idleImageUrl, new RegExp(`${pdb.toLowerCase()}-0\\.png$`));
    assert.match(visual.finalImageUrl, new RegExp(`${pdb.toLowerCase()}-${last}\\.png$`));
}
assert.match(proteinLibrary.TriosePhosphateTranslocator.Info, /Galdieria sulphuraria/);
console.log("PASS: seven photosynthesis and starch-related proteins have valid recipes and visual sequences.");
