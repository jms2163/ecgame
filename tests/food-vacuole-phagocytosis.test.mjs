// Run with: node tests/food-vacuole-phagocytosis.test.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import Catalog from "../src/app/FoodVacuolePhagocytosisCatalog.js";
import {
    MAX_SEAL_COUNT,
    MAX_WRAP_COUNT,
    SEAL_TARGET_COUNT,
    SEAL_TOLERANCE,
    WRAP_TARGET_COUNT,
    WRAP_TOLERANCE,
    armActinPath,
    armFillPath,
    armGeometry,
    calculateTargetScore
} from "../src/app/FoodVacuolePhagocytosisView.js";

assert.equal(WRAP_TARGET_COUNT, 6);
assert.equal(WRAP_TOLERANCE, 1);
assert.equal(MAX_WRAP_COUNT, 8);
assert.equal(SEAL_TARGET_COUNT, 5);
assert.equal(SEAL_TOLERANCE, 1);
assert.equal(MAX_SEAL_COUNT, 6);

assert.equal(calculateTargetScore(5, 6, 1), 80);
assert.equal(calculateTargetScore(6, 6, 1), 100);
assert.equal(calculateTargetScore(7, 6, 1), 80);
assert.equal(calculateTargetScore(4, 6, 1), 0);
assert.equal(calculateTargetScore(8, 6, 1), 0);
assert.equal(calculateTargetScore(4, 5, 1), 80);
assert.equal(calculateTargetScore(5, 5, 1), 100);
assert.equal(calculateTargetScore(6, 5, 1), 80);

const upperStart = armGeometry("upper", 0).end;
const upperTarget = armGeometry("upper", WRAP_TARGET_COUNT).end;
const lowerTarget = armGeometry("lower", WRAP_TARGET_COUNT).end;
const lowerStart = armGeometry("lower", 0).end;
assert.ok(upperTarget.y < upperStart.y);
assert.ok(lowerTarget.y < lowerStart.y);
assert.ok(upperTarget.x < lowerTarget.x);
assert.match(armFillPath("upper", WRAP_TARGET_COUNT), /Q/);
assert.match(armFillPath("upper", WRAP_TARGET_COUNT), /Z$/);
assert.match(armActinPath("upper", WRAP_TARGET_COUNT), /Q/);

assert.equal(Catalog.releaseStatus, "active");
assert.equal(Catalog.stage.template, "food_vacuole_phagocytosis");
assert.deepEqual(
    Catalog.requirements.completedExperiments,
    ["pseudopodia_membrane_extension"]
);
assert.equal(Catalog.grants.xp, 250);
assert.deepEqual(
    Catalog.grants.discoveries,
    ["successful_phagocytosis", "food_vacuole"]
);
assert.deepEqual(Catalog.grants.metricEffects, []);

const viewSource = fs.readFileSync(
    new URL("../src/app/FoodVacuolePhagocytosisView.js", import.meta.url),
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

assert.match(viewSource, /Add to Both Pseudopods/);
assert.match(viewSource, /EXTRACELLULAR SPACE/);
assert.match(viewSource, /phago-pseudopod-fill/);
assert.match(viewSource, /phago-actin-arm/);
assert.match(viewSource, /text-anchor="end"/);
assert.match(viewSource, /phago-cup-base/);
assert.ok(viewSource.includes('innerCircle.classList.add("is-inner")'));
assert.ok(viewSource.includes('translate(450 ${foodY})'));
assert.ok(viewSource.includes('viewBox="45 15 810 468"'));
assert.ok(viewSource.includes('sealing ? ""'));
assert.match(viewSource, /phago-cell-body/);
assert.match(viewSource, /phago-zero-cap/);
assert.match(viewSource, /Advance Engulfment/);
assert.match(viewSource, /activeEngulfmentStep/);
assert.match(viewSource, /foodY/);
assert.match(viewSource, /Engulfment Step/);
assert.match(viewSource, /FOOD VACUOLE/);
assert.match(viewSource, /particleStartedExtracellular: true/);
assert.match(stageSource, /FoodVacuolePhagocytosisView/);
assert.match(stageSource, /food_vacuole_phagocytosis/);
assert.match(cssEntry, /food-vacuole\.css/);

console.log(
    "PASS: Food Vacuole phagocytosis grows paired pseudopods around an extracellular particle, seals the membrane neck, awards proportional 80–100 scores, and grants learning rewards without metric effects."
);
