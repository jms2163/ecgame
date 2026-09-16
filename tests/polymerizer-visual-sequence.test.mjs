// Run with: node tests/polymerizer-visual-sequence.test.mjs
// Verifies data-driven protein image sequences without requiring image files.

import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import { proteinLibrary }
    from "../src/data/proteinLibrary.js";
import PolymerizerRecipeCatalog
    from "../src/data/PolymerizerRecipeCatalog.js";
import PolymerizerVisualCatalog
    from "../src/data/PolymerizerVisualCatalog.js";
import PolymerizerManager
    from "../src/app/PolymerizerManager.js";
import ResourceManager
    from "../src/app/ResourceManager.js";

globalThis.localStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {}
};

assert.equal(
    proteinLibrary.Aquaporin.Source,
    "1RC2"
);
assert.equal(
    proteinLibrary.GlucoseTransporter
        .Source,
    "4LDS"
);

const aquaporin =
    PolymerizerVisualCatalog.get(
        "Aquaporin"
    );
assert.equal(aquaporin.source, "1RC2");
assert.equal(
    aquaporin.assemblyFrameCount,
    8
);
assert.equal(aquaporin.frameUrls.length, 9);
assert(aquaporin.idleImageUrl.endsWith(
    "/public/assets/polymerizer/proteins/1RC2-0.png"
));
assert(aquaporin.finalImageUrl.endsWith(
    "/public/assets/polymerizer/proteins/1RC2-8.png"
));
assert(
    PolymerizerVisualCatalog
        .resolveImageUrl(
            "Aquaporin"
        )
        .endsWith("/1RC2-0.png")
);
assert(
    PolymerizerVisualCatalog
        .resolveImageUrl(
            "Aquaporin",
            { progress: 0 }
        )
        .endsWith("/1RC2-1.png")
);
assert(
    PolymerizerVisualCatalog
        .resolveImageUrl(
            "Aquaporin",
            { progress: 0.5 }
        )
        .endsWith("/1RC2-5.png")
);
assert(
    PolymerizerVisualCatalog
        .resolveImageUrl(
            "Aquaporin",
            { progress: 1 }
        )
        .endsWith("/1RC2-8.png")
);
assert(
    PolymerizerVisualCatalog
        .resolveImageUrl(
            "Aquaporin",
            { completed: true }
        )
        .endsWith("/1RC2-8.png")
);

const glucoseVisual =
    PolymerizerVisualCatalog.get(
        "GlucoseTransporter"
    );
assert.equal(glucoseVisual.source, "4LDS");
assert.equal(
    glucoseVisual.assemblyFrameCount,
    15
);
assert.equal(
    glucoseVisual.frameUrls.length,
    16
);
assert(glucoseVisual.idleImageUrl.endsWith(
    "/public/assets/polymerizer/proteins/4LDS-0.png"
));
assert(glucoseVisual.finalImageUrl.endsWith(
    "/public/assets/polymerizer/proteins/4LDS-15.png"
));

const glucoseRecipe =
    PolymerizerRecipeCatalog.get(
        "GlucoseTransporter"
    );
assert.equal(
    glucoseRecipe.name,
    "Glucose Transporter"
);
assert.equal(glucoseRecipe.implemented, false);
assert.equal(glucoseRecipe.atpCost, null);
assert.equal(glucoseRecipe.discoveryId, null);
assert.match(
    glucoseRecipe.lockedMessage,
    /C and B structural motif mappings/
);

ResourceManager.initialize();
PolymerizerManager.initialize();
const status =
    PolymerizerManager.getStatus(
        "GlucoseTransporter"
    );
assert.equal(status.products.length, 2);
assert.equal(
    status.selectedProduct.locked,
    true
);
assert.equal(
    status.selectedProduct.canStart,
    false
);

const beforeATP = structuredClone(
    ResourceManager.getATPStatus()
);
const beforeState = structuredClone(
    gameState.zones.polymerizer.state
);
const blockedStart =
    PolymerizerManager.startAssembly(
        "GlucoseTransporter",
        1_000
    );
assert.equal(blockedStart.success, false);
assert.equal(
    blockedStart.reason,
    "product-locked"
);
assert.deepEqual(
    ResourceManager.getATPStatus(),
    beforeATP
);
assert.deepEqual(
    gameState.zones.polymerizer.state,
    beforeState
);

console.log(
    "PASS: Polymerizer maps Aquaporin 1RC2 frames 0–8 across assembly, preserves frame 8 after completion, exposes Glucose Transporter 4LDS frames 0–15 as a locked preview, and assigns no unapproved glucose-transporter ATP cost."
);
