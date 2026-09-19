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
    /PDB-based motif recipe/
);

const hexokinaseVisual =
    PolymerizerVisualCatalog.get(
        "Hexokinase"
    );
assert.equal(hexokinaseVisual.source, "1BG3");
assert.equal(hexokinaseVisual.firstFrameNumber, 1);
assert.equal(hexokinaseVisual.lastFrameNumber, 65);
assert.equal(hexokinaseVisual.frameCount, 65);
assert.equal(
    hexokinaseVisual.assemblyFrameCount,
    64
);
assert(hexokinaseVisual.idleImageUrl.endsWith(
    "/public/assets/polymerizer/proteins/1bg3_motifs/1bg3-1.png"
));
assert(hexokinaseVisual.finalImageUrl.endsWith(
    "/public/assets/polymerizer/proteins/1bg3_motifs/1bg3-65.png"
));

const energyVisual =
    PolymerizerVisualCatalog.get(
        "EnergyKinase"
    );
assert.equal(energyVisual.source, "1EI0");
assert.equal(energyVisual.frameCount, 2);
assert.equal(
    energyVisual.finalFrameOnlyOnCompletion,
    true
);

const pgiVisual =
    PolymerizerVisualCatalog.get(
        "PhosphoglucoseIsomerase"
    );
assert.equal(pgiVisual.source, "2PGI");
assert.equal(pgiVisual.firstFrameNumber, 1);
assert.equal(pgiVisual.lastFrameNumber, 29);
assert.equal(pgiVisual.frameCount, 29);
assert.equal(pgiVisual.assemblyFrameCount, 28);
assert(pgiVisual.idleImageUrl.endsWith(
    "/public/assets/polymerizer/proteins/2pgi_motifs/2pgi-1.png"
));
assert(pgiVisual.finalImageUrl.endsWith(
    "/public/assets/polymerizer/proteins/2pgi_motifs/2pgi-29.png"
));
assert(
    PolymerizerVisualCatalog
        .resolveImageUrl(
            "PhosphoglucoseIsomerase",
            { progress: 0 }
        )
        .endsWith(
            "/2pgi_motifs/2pgi-2.png"
        )
);

ResourceManager.initialize();
PolymerizerManager.initialize();
const status =
    PolymerizerManager.getStatus(
        "GlucoseTransporter"
    );
assert.equal(status.products.length, 5);
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
