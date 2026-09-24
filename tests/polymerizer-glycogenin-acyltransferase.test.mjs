import assert from "node:assert/strict";
import { proteinLibrary }
    from "../src/data/proteinLibrary.js";
import PolymerizerRecipeCatalog
    from "../src/data/PolymerizerRecipeCatalog.js";
import PolymerizerVisualCatalog
    from "../src/data/PolymerizerVisualCatalog.js";

const cases = [
    {
        id: "Glycogenin",
        source: "3U2U",
        motifs: { H: 12, B: 12, L: 25 },
        cost: 49,
        lastFrame: 15,
        folder: "3u2u_motifs",
        prefix: "3u2u"
    },
    {
        id: "Glycerol3PhosphateAcyltransferase",
        source: "5XJ6",
        motifs: { H: 10, B: 0, L: 11 },
        cost: 21,
        lastFrame: 10,
        folder: "5xj6_motifs",
        prefix: "5xj6"
    }
];

for (const entry of cases) {
    assert.equal(proteinLibrary[entry.id].Source, entry.source);
    assert.deepEqual(proteinLibrary[entry.id].Recipe, entry.motifs);

    const recipe = PolymerizerRecipeCatalog.get(entry.id);
    assert.equal(recipe.implemented, true);
    assert.equal(recipe.valid, true);
    assert.equal(recipe.motifCount, entry.cost);
    assert.equal(recipe.atpCost, entry.cost);
    assert.equal(recipe.maxCompletions, 1);

    const visual = PolymerizerVisualCatalog.get(entry.id);
    assert.equal(visual.source, entry.source);
    assert.equal(visual.frameCount, entry.lastFrame + 1);
    assert.equal(visual.assemblyFrameCount, entry.lastFrame);
    assert(visual.idleImageUrl.endsWith(
        `/${entry.folder}/${entry.prefix}-0.png`
    ));
    assert(visual.finalImageUrl.endsWith(
        `/${entry.folder}/${entry.prefix}-${entry.lastFrame}.png`
    ));
    assert.equal(
        PolymerizerVisualCatalog.resolveImageUrl(
            entry.id, { completed: true }
        ),
        visual.finalImageUrl
    );
}

assert.equal(
    PolymerizerRecipeCatalog.get(
        "Glycerol3PhosphateAcyltransferase"
    ).unlockDiscoveryId,
    "glycerol_3_phosphate_acyltransferase_recipe"
);

console.log("PASS: Glycogenin and 5XJ6 have one-time recipes and complete 0-based visual sequences without changing the existing acyltransferase unlock.");
