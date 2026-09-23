// Run with: node tests/pseudopodia-membrane-extension.test.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import Catalog from "../src/app/PseudopodiaMembraneExtensionCatalog.js";
import CytoskeletonTransportCatalog
    from "../src/app/CytoskeletonTransportCatalog.js";
import {
    ACTIN_TARGET_COUNT,
    ACTIN_TOLERANCE,
    CURVATURE_TARGET_COUNT,
    CURVATURE_TOLERANCE,
    LIPID_SLOT_COUNT,
    calculatePseudopodTipX,
    calculateTargetScore
} from "../src/app/PseudopodiaMembraneExtensionView.js";

assert.equal(LIPID_SLOT_COUNT, 28);
assert.equal(CURVATURE_TARGET_COUNT, 18);
assert.equal(CURVATURE_TOLERANCE, 2);
assert.equal(ACTIN_TARGET_COUNT, 5);
assert.equal(ACTIN_TOLERANCE, 1);

assert.equal(calculateTargetScore(16, 18, 2), 80);
assert.equal(calculateTargetScore(17, 18, 2), 90);
assert.equal(calculateTargetScore(18, 18, 2), 100);
assert.equal(calculateTargetScore(19, 18, 2), 90);
assert.equal(calculateTargetScore(20, 18, 2), 80);
assert.equal(calculateTargetScore(15, 18, 2), 0);
assert.equal(calculateTargetScore(21, 18, 2), 0);

assert.equal(calculateTargetScore(4, 5, 1), 80);
assert.equal(calculateTargetScore(5, 5, 1), 100);
assert.equal(calculateTargetScore(6, 5, 1), 80);
assert.equal(calculateTargetScore(3, 5, 1), 0);
assert.ok(calculatePseudopodTipX(18) > calculatePseudopodTipX(0));

assert.equal(Catalog.organelleId, "cytoskeleton");
assert.equal(Catalog.releaseStatus, "active");
assert.equal(Catalog.grants.xp, 250);
assert.deepEqual(Catalog.grants.metricEffects, []);
assert.deepEqual(
    Catalog.requirements.perfectScoreExperiments,
    ["cytoskeleton_transport"]
);
assert.equal(
    CytoskeletonTransportCatalog.assessment.completionThresholdPercent,
    100
);

const viewSource = fs.readFileSync(
    new URL("../src/app/PseudopodiaMembraneExtensionView.js", import.meta.url),
    "utf8"
);
const stageSource = fs.readFileSync(
    new URL("../src/app/OrganelleExperimentStage.js", import.meta.url),
    "utf8"
);
const cssEntry = fs.readFileSync(
    new URL("../public/css/organelle-lab.css", import.meta.url),
    "utf8"
);

assert.match(viewSource, /indexOf\(null\)/);
assert.match(viewSource, /Inverted-cone/);
assert.match(viewSource, /Add ATP-Actin/);
assert.match(viewSource, /Actin—not the αβ-tubulin track/);
assert.match(stageSource, /PseudopodiaMembraneExtensionView/);
assert.match(stageSource, /pseudopodia_membrane_extension/);
assert.match(cssEntry, /pseudopodia\.css/);

console.log(
    "PASS: Pseudopod Extension uses a 28-lipid living canvas, proportional 80–100 target scoring, an actin stabilization mission, and a strict perfect-score transport prerequisite."
);
