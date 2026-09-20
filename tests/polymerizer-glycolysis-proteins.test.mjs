// Run with: node tests/polymerizer-glycolysis-proteins.test.mjs

import assert from "node:assert/strict";
import { proteinLibrary }
    from "../src/data/proteinLibrary.js";
import MetabolismPathwayCatalog
    from "../src/data/MetabolismPathwayCatalog.js";
import PolymerizerRecipeCatalog
    from "../src/data/PolymerizerRecipeCatalog.js";
import PolymerizerVisualCatalog
    from "../src/data/PolymerizerVisualCatalog.js";

const glycolysis =
    MetabolismPathwayCatalog.get("glycolysis");
const coreIds = glycolysis.coreSlots.map(
    slot => slot.enzymeId
);
const expectedCoreIds = [
    "Hexokinase",
    "PhosphoglucoseIsomerase",
    "Phosphofructokinase",
    "Aldolase",
    "TriosePhosphateIsomerase",
    "Glyceraldehyde3PhosphateDehydrogenase",
    "PhosphoglycerateKinase",
    "PhosphoglycerateMutase",
    "Enolase",
    "PyruvateKinase"
];

assert.deepEqual(coreIds, expectedCoreIds);

const releasedIds = [
    ...coreIds,
    "LactateDehydrogenase",
    "FormateAcetyltransferase1"
];

releasedIds.forEach(id => {
    const protein = proteinLibrary[id];
    const recipe =
        PolymerizerRecipeCatalog.get(id);
    const visual =
        PolymerizerVisualCatalog.get(id);

    assert.ok(protein, `${id} requires protein data`);
    assert.equal(
        protein.PPC,
        "",
        `${id} must use counts-only structure data`
    );
    assert.equal(
        protein.Location,
        "Cytosol"
    );
    assert.ok(recipe, `${id} requires a recipe card`);
    assert.equal(recipe.implemented, true);
    assert.equal(recipe.valid, true);
    assert.equal(recipe.structureOrderKnown, false);
    assert.equal(recipe.consumesMotifs, false);
    assert.equal(
        recipe.atpCost,
        Object.values(protein.Recipe)
            .reduce((total, count) => total + count, 0)
    );
    assert.ok(visual, `${id} requires assembly visuals`);
    assert.equal(
        visual.firstFrameNumber,
        0,
        `${id} must use frame 0 as its idle image`
    );
    assert.match(
        visual.idleImageUrl,
        /-0\.png$/
    );
    assert.ok(
        recipe.functionDisplay?.badgeText,
        `${id} requires a concise purpose badge`
    );
});

assert.equal(
    PolymerizerRecipeCatalog.get(
        "Phosphofructokinase1"
    ),
    null
);
assert.equal(
    PolymerizerRecipeCatalog.get(
        "FructoseBisphosphateAldolase"
    ),
    null
);

assert.deepEqual(
    proteinLibrary.PhosphoglycerateKinase.Recipe,
    { H: 13, B: 14, L: 28 }
);
assert.deepEqual(
    proteinLibrary.Enolase.Recipe,
    { H: 11, B: 15, L: 27 }
);

const pgkVisual =
    PolymerizerVisualCatalog.get(
        "PhosphoglycerateKinase"
    );
assert.equal(pgkVisual.firstFrameNumber, 0);
assert.equal(pgkVisual.lastFrameNumber, 26);
assert.equal(pgkVisual.frameCount, 27);
assert.match(
    pgkVisual.frameUrls[0],
    /3pgk_motifs\/3pgk-0\.png$/
);
assert.match(
    pgkVisual.finalImageUrl,
    /3pgk_motifs\/3pgk-26\.png$/
);

const enolaseVisual =
    PolymerizerVisualCatalog.get("Enolase");
assert.equal(enolaseVisual.firstFrameNumber, 0);
assert.equal(enolaseVisual.lastFrameNumber, 22);
assert.equal(enolaseVisual.frameCount, 23);
assert.match(
    enolaseVisual.frameUrls[0],
    /4a3r_motifs\/4a3r-0\.png$/
);
assert.match(
    enolaseVisual.finalImageUrl,
    /4a3r_motifs\/4a3r-22\.png$/
);

const pyruvateKinaseVisual =
    PolymerizerVisualCatalog.get(
        "PyruvateKinase"
    );
assert.equal(
    pyruvateKinaseVisual.firstFrameNumber,
    0
);
assert.equal(
    pyruvateKinaseVisual.lastFrameNumber,
    29
);
assert.equal(
    pyruvateKinaseVisual.assemblyFrameCount,
    29
);
assert.match(
    pyruvateKinaseVisual.finalImageUrl,
    /1pkl_motifs\/1pkl-29\.png$/
);
assert.doesNotMatch(
    pyruvateKinaseVisual.finalImageUrl,
    /1pkl-30\.png$/
);

console.log(
    "PASS: all ten glycolysis enzymes, LDH, and formate acetyltransferase have canonical Polymerizer recipes and visuals."
);
