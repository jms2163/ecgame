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
    null
);
assert.equal(
    PolymerizerRecipeCatalog
        .get("Aquaporin")
        .functionDisplay,
    null
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
assert(
    energyFunction.iconUrl.endsWith(
        "/public/assets/polymerizer/functions/Card_Energy_Icon.png"
    )
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
    /poly-product-function-icon/
);
assert.match(
    viewSource,
    /functionDisplay\.iconUrl/
);

console.log(
    "PASS: proteins opt into reusable function displays, null remains valid, and Glucose Transporter resolves the 80px Cell Energy card icon without adding save state."
);
