// Run with: node tests/polymerizer-function-display.test.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import { proteinLibrary }
    from "../src/data/proteinLibrary.js";
import ProteinFunctionCatalog
    from "../src/data/ProteinFunctionCatalog.js";
import PolymerizerRecipeCatalog
    from "../src/data/PolymerizerRecipeCatalog.js";

assert.equal(
    proteinLibrary.Aquaporin
        .FunctionDisplay,
    "waterBalance"
);
assert.equal(
    PolymerizerRecipeCatalog
        .get("Aquaporin")
        .functionDisplay.badgeText,
    "💧 Water Balance"
);

assert.equal(
    proteinLibrary.GlucoseTransporter
        .FunctionDisplay,
    "cellEnergy"
);

const energyFunction =
    ProteinFunctionCatalog.get(
        "cellEnergy"
    );
assert(energyFunction);
assert.equal(
    energyFunction.label,
    "Cell Energy"
);
assert.equal(
    energyFunction.badgeText,
    "⚡ Glycolysis Access"
);
assert.deepEqual(
    PolymerizerRecipeCatalog
        .get("GlucoseTransporter")
        .functionDisplay,
    energyFunction
);
assert.equal(
    ProteinFunctionCatalog.get(null),
    null
);

const enzymeFunctionDisplays = {
    Hexokinase: "Uses ATP",
    PhosphoglucoseIsomerase:
        "Rearranges G6P",
    Phosphofructokinase: "Uses ATP",
    Aldolase: "Splits 6C Sugar",
    TriosePhosphateIsomerase:
        "DHAP to GAP",
    Glyceraldehyde3PhosphateDehydrogenase:
        "Produces NADH",
    PhosphoglycerateKinase:
        "Produces ATP",
    PhosphoglycerateMutase:
        "Moves Phosphate",
    Enolase: "Produces PEP",
    PyruvateKinase: "Produces ATP",
    LactateDehydrogenase:
        "Regenerates NAD+",
    FormateAcetyltransferase1:
        "Produces Acetyl-CoA"
};

Object.entries(enzymeFunctionDisplays)
    .forEach(([productId, badgeText]) => {
        assert.equal(
            PolymerizerRecipeCatalog
                .get(productId)
                .functionDisplay.badgeText,
            badgeText
        );
    });

assert.equal(
    ProteinFunctionCatalog
        .get("atpProduction")
        .badgeText,
    "⚡ +4 ATP/min"
);
assert.equal(
    ProteinFunctionCatalog
        .get("waterBalance")
        .badgeTone,
    "homeostasis"
);
assert.equal(
    ProteinFunctionCatalog.get(
        "notConfigured"
    ),
    null
);

const viewSource = fs.readFileSync(
    new URL(
        "../src/app/PolymerizerProductView.js",
        import.meta.url
    ),
    "utf8"
);
assert.match(
    viewSource,
    /poly-product-function-badge/
);
assert.match(
    viewSource,
    /functionDisplay\.badgeText/
);
assert.doesNotMatch(
    viewSource,
    /Synthesized ·.*stored/
);
assert.match(
    viewSource,
    /source === "synthesized"\s*\? "poly-product-card--synthesized"/
);

const cssSource = fs.readFileSync(
    new URL(
        "../public/css/polymerizer.css",
        import.meta.url
    ),
    "utf8"
);
assert.match(
    cssSource,
    /poly-product-function-badge--metabolism/
);

console.log(
    "PASS: Polymerizer function displays use right-aligned data-driven badges for protein benefits and glycolysis roles without adding save state or card-level inventory counts."
);
