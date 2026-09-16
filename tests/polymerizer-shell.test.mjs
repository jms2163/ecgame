// Run with: node tests/polymerizer-shell.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import gameState from "../src/app/GameState.js";
import ZoneCatalog from "../src/app/ZoneCatalog.js";
import ZoneStatusResolver from "../src/app/ZoneStatusResolver.js";
import PolymerizerRecipeCatalog
    from "../src/data/PolymerizerRecipeCatalog.js";
import PolymerizerVisualCatalog
    from "../src/data/PolymerizerVisualCatalog.js";
import PolymerizerManager
    from "../src/app/PolymerizerManager.js";

let saveWrites = 0;
globalThis.localStorage = {
    getItem() { return null; },
    setItem() { saveWrites += 1; },
    removeItem() {}
};

const recipe =
    PolymerizerRecipeCatalog.get(
        "Aquaporin"
    );

assert(recipe);
assert.equal(recipe.valid, true);
assert.equal(recipe.recipeMatchesPPC, true);
assert.equal(recipe.simplifiedStructure, "HLHLHLHLHLHLHLH");
assert.deepEqual(
    recipe.motifRequirements.map(
        ({ productId, quantity }) => ({
            productId,
            quantity
        })
    ),
    [
        { productId: "H_helix", quantity: 8 },
        { productId: "L_loop", quantity: 7 }
    ]
);
assert.equal(recipe.motifCount, 15);
assert.equal(recipe.atpCost, 15);
assert.equal(recipe.consumesMotifs, false);

const visual =
    PolymerizerVisualCatalog.get(
        "Aquaporin"
    );
assert(visual.imageUrl.endsWith(
    "/public/assets/experiments/proteins/aquaporin.png"
));

assert.equal(
    ZoneCatalog.get("polymerizer")
        .releaseState,
    ZoneCatalog.RELEASE_STATE.COMING_SOON
);
assert.equal(
    ZoneStatusResolver.getStatus(
        "polymerizer"
    ).interactive,
    false
);
assert.equal(
    Object.hasOwn(
        gameState.zones,
        "signaling"
    ),
    false
);

// A legacy save can omit the future zone. Initialization creates only
// the empty zone envelope and does not add speculative state fields.
delete gameState.zones.polymerizer;
PolymerizerManager.initialize();
assert.deepEqual(
    gameState.zones.polymerizer,
    {
        unlocked: false,
        completed: false,
        state: {}
    }
);

gameState.zones.macromolecularizer
    .state.motifInventory = {
        H_helix: 8,
        L_loop: 6
    };
gameState.registry.resources.atp = {
    current: 15,
    maximum: 50
};

const before = structuredClone(
    gameState.zones.macromolecularizer
        .state.motifInventory
);
const blocked =
    PolymerizerManager
        .getProductEligibility(
            "Aquaporin"
        );

assert.equal(blocked.eligible, false);
assert.equal(blocked.motifs[0].complete, true);
assert.equal(blocked.motifs[1].missing, 1);
assert.deepEqual(
    gameState.zones.macromolecularizer
        .state.motifInventory,
    before
);

gameState.zones.macromolecularizer
    .state.motifInventory.L_loop = 7;
const ready =
    PolymerizerManager
        .getProductEligibility(
            "Aquaporin"
        );
assert.equal(ready.eligible, true);
assert.equal(ready.canStart, false);
assert(ready.motifs.every(
    motif => motif.consumed === false
));
assert.deepEqual(
    PolymerizerManager.getProductInventory(),
    {}
);
assert.equal(saveWrites, 0);

const zoneManagerSource = fs.readFileSync(
    new URL(
        "../src/app/ZoneManager.js",
        import.meta.url
    ),
    "utf8"
);
assert.match(
    zoneManagerSource,
    /["']polymerizer["']\s*,\s*\{/
);

const signaling =
    ZoneCatalog.get("signaling");
assert.equal(
    signaling.releaseState,
    ZoneCatalog.RELEASE_STATE.COMING_SOON
);
assert.equal(
    ZoneStatusResolver.getStatus(
        "signaling"
    ).interactive,
    false
);

console.log(
    "PASS: Polymerizer Milestone 1 derives Aquaporin's 8/7 permanent motif levels and 15 ATP cost from project data, renders as a locked preview contract, accepts legacy saves, performs read-only preflight, and leaves Signaling unchanged."
);
