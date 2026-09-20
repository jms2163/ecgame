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

const storage = new Map();
globalThis.localStorage = {
    getItem: key =>
        storage.get(key) ?? null,
    setItem: (key, value) =>
        storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
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
    "/public/assets/polymerizer/proteins/1rc2_motifs/1RC2-0.png"
));
assert(aquaporin.finalImageUrl.endsWith(
    "/public/assets/polymerizer/proteins/1rc2_motifs/1RC2-8.png"
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
    "/public/assets/polymerizer/proteins/4lds_motifs/4LDS-0.png"
));
assert(glucoseVisual.finalImageUrl.endsWith(
    "/public/assets/polymerizer/proteins/4lds_motifs/4LDS-15.png"
));

const glucoseRecipe =
    PolymerizerRecipeCatalog.get(
        "GlucoseTransporter"
    );
assert.equal(
    glucoseRecipe.name,
    "Glucose Transporter"
);
assert.equal(glucoseRecipe.implemented, true);
assert.equal(glucoseRecipe.atpCost, 31);
assert.equal(glucoseRecipe.motifCount, 31);
assert.equal(glucoseRecipe.discoveryId, null);
assert.equal(glucoseRecipe.lockedMessage, null);

const hexokinaseVisual =
    PolymerizerVisualCatalog.get(
        "Hexokinase"
    );
assert.equal(hexokinaseVisual.source, "1BG3");
assert.equal(hexokinaseVisual.firstFrameNumber, 0);
assert.equal(hexokinaseVisual.lastFrameNumber, 65);
assert.equal(hexokinaseVisual.frameCount, 66);
assert.equal(
    hexokinaseVisual.assemblyFrameCount,
    65
);
assert(hexokinaseVisual.idleImageUrl.endsWith(
    "/public/assets/polymerizer/proteins/1bg3_motifs/1bg3-0.png"
));
assert(hexokinaseVisual.finalImageUrl.endsWith(
    "/public/assets/polymerizer/proteins/1bg3_motifs/1bg3-65.png"
));

const energyVisual =
    PolymerizerVisualCatalog.get(
        "EnergyKinase"
    );
assert.equal(energyVisual.source, "1EI0");
assert.equal(energyVisual.frameCount, 3);
assert.equal(
    energyVisual.finalFrameOnlyOnCompletion,
    true
);

const pgiVisual =
    PolymerizerVisualCatalog.get(
        "PhosphoglucoseIsomerase"
    );
assert.equal(pgiVisual.source, "2PGI");
assert.equal(pgiVisual.firstFrameNumber, 0);
assert.equal(pgiVisual.lastFrameNumber, 29);
assert.equal(pgiVisual.frameCount, 30);
assert.equal(pgiVisual.assemblyFrameCount, 29);
assert(pgiVisual.idleImageUrl.endsWith(
    "/public/assets/polymerizer/proteins/2pgi_motifs/2pgi-0.png"
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
            "/2pgi_motifs/2pgi-1.png"
        )
);

gameState.zones.polymerizer.state = {
    productInventory: {},
    activeAssembly: null
};
gameState.zones.macromolecularizer
    .state.motifInventory = {
        H_helix: 15,
        B_sheet: 0,
        L_loop: 16
    };
ResourceManager.setATPStatus(
    { current: 50, maximum: 50 },
    "glucose-transporter-test-setup"
);
PolymerizerManager.initialize();
const status =
    PolymerizerManager.getStatus(
        "GlucoseTransporter"
    );
assert.equal(status.products.length, 15);
assert.deepEqual(
    status.products
        .filter(product =>
            [
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
            ].includes(product.id)
        )
        .map(product => product.id),
    [
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
    ]
);
assert.equal(
    status.selectedProduct.locked,
    false
);
assert.equal(
    status.selectedProduct.canStart,
    true
);

const beforeATP = structuredClone(
    ResourceManager.getATPStatus()
);
const started =
    PolymerizerManager.startAssembly(
        "GlucoseTransporter",
        1_000
    );
assert.equal(started.success, true);
assert.equal(
    ResourceManager.getATPStatus().current,
    beforeATP.current - 31
);
assert.deepEqual(
    gameState.zones.macromolecularizer
        .state.motifInventory,
    {
        H_helix: 15,
        B_sheet: 0,
        L_loop: 16
    }
);

const finished =
    PolymerizerManager.finishAssembly(
        started.activeAssembly.jobId,
        started.activeAssembly
            .completesAtMs
    );
assert.equal(finished.success, true);
assert.equal(finished.discoveryGranted, false);
assert.equal(
    gameState.zones.polymerizer.state
        .productInventory
        .GlucoseTransporter.count,
    1
);

console.log(
    "PASS: Polymerizer maps Aquaporin and Glucose Transporter visual sequences, and releases the 4LDS H15/B0/L16 transporter for a non-consuming 31-ATP assembly."
);
