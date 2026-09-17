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
import { proteinLibrary }
    from "../src/data/proteinLibrary.js";

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
assert.equal(recipe.discoveryId, "aquaporin");
assert.equal(recipe.motifCount, 15);

const glucoseTransporterRecipe =
    PolymerizerRecipeCatalog.get(
        "GlucoseTransporter"
    );
assert.equal(
    glucoseTransporterRecipe.motifCount,
    6
);
assert.equal(
    glucoseTransporterRecipe.valid,
    true
);
assert.equal(
    glucoseTransporterRecipe
        .simplifiedStructure,
    "HBLLHB"
);
assert.deepEqual(
    glucoseTransporterRecipe
        .motifRequirements
        .map(requirement => ({
            symbol: requirement.symbol,
            productId:
                requirement.productId,
            quantity: requirement.quantity
        })),
    [
        {
            symbol: "B",
            productId: "B_sheet",
            quantity: 2
        },
        {
            symbol: "L",
            productId: "L_loop",
            quantity: 2
        },
        {
            symbol: "H",
            productId: "H_helix",
            quantity: 2
        }
    ]
);

const hexokinaseRecipe =
    PolymerizerRecipeCatalog.get(
        "Hexokinase"
    );
assert.equal(hexokinaseRecipe.valid, true);
assert.equal(
    hexokinaseRecipe.structureOrderKnown,
    false
);
assert.equal(
    hexokinaseRecipe.recipeMatchesPPC,
    null
);
assert.equal(hexokinaseRecipe.motifCount, 95);
assert.equal(hexokinaseRecipe.atpCost, 95);
assert.equal(
    hexokinaseRecipe.discoveryId,
    null
);
assert.deepEqual(
    hexokinaseRecipe.motifRequirements
        .map(({ productId, quantity }) => ({
            productId,
            quantity
        })),
    [
        { productId: "H_helix", quantity: 22 },
        { productId: "B_sheet", quantity: 25 },
        { productId: "L_loop", quantity: 48 }
    ]
);

const pgiRecipe =
    PolymerizerRecipeCatalog.get(
        "PhosphoglucoseIsomerase"
    );
assert.equal(pgiRecipe.valid, true);
assert.equal(pgiRecipe.structureOrderKnown, false);
assert.equal(pgiRecipe.recipeMatchesPPC, null);
assert.equal(pgiRecipe.motifCount, 49);
assert.equal(pgiRecipe.atpCost, 49);
assert.equal(pgiRecipe.discoveryId, null);
assert.deepEqual(
    pgiRecipe.motifRequirements
        .map(({ productId, quantity }) => ({
            productId,
            quantity
        })),
    [
        { productId: "H_helix", quantity: 14 },
        { productId: "B_sheet", quantity: 10 },
        { productId: "L_loop", quantity: 25 }
    ]
);

Object.values(proteinLibrary)
    .forEach(protein => {
        assert.doesNotMatch(
            protein.PPC,
            /C/
        );
        assert.equal(
            Object.hasOwn(
                protein.Recipe,
                "C"
            ),
            false
        );
    });

const visual =
    PolymerizerVisualCatalog.get(
        "Aquaporin"
    );
assert(visual.imageUrl.endsWith(
    "/public/assets/polymerizer/proteins/1RC2-0.png"
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

// A legacy save can omit the future zone. Initialization creates the
// zone envelope and the now-authoritative empty product inventory.
delete gameState.zones.polymerizer;
PolymerizerManager.initialize();
assert.deepEqual(
    gameState.zones.polymerizer,
    {
        unlocked: false,
        completed: false,
        state: {
            productInventory: {},
            activeAssembly: null
        }
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
assert.equal(ready.canStart, true);
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

const productViewSource = fs.readFileSync(
    new URL(
        "../src/app/PolymerizerProductView.js",
        import.meta.url
    ),
    "utf8"
);
assert.match(
    productViewSource,
    /Lvl:\s*\$\{product\.definition\.motifCount\}/
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
