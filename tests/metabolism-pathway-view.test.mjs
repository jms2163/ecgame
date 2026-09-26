// Run with: node tests/metabolism-pathway-view.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import MetabolismPathwayCatalog
    from "../src/data/MetabolismPathwayCatalog.js";
import {
    CONNECTION_STATE,
    resolveConnectionState
} from "../src/app/MetabolismPathwayView.js";

const glycolysis =
    MetabolismPathwayCatalog.get(
        "glycolysis"
    );
const allSlots = [
    ...glycolysis.coreSlots,
    ...glycolysis.regenerationBranches
        .flatMap(branch => branch.slots)
];

assert.equal(allSlots.length, 11);
assert.deepEqual(
    allSlots.map(slot => slot.slot),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
);
assert.equal(
    resolveConnectionState(),
    CONNECTION_STATE.GAP
);
assert.equal(
    resolveConnectionState({
        leftOccupied: true,
        rightOccupied: true
    }),
    CONNECTION_STATE.ADJACENT
);
assert.equal(
    resolveConnectionState({
        leftOccupied: true,
        rightOccupied: false
    }),
    CONNECTION_STATE.GAP
);
assert.equal(
    resolveConnectionState({
        pathwayComplete: true
    }),
    CONNECTION_STATE.COMPLETE
);

const uiSource = fs.readFileSync(
    new URL(
        "../src/app/MetabolismUI.js",
        import.meta.url
    ),
    "utf8"
);
assert.match(
    uiSource,
    /MetabolismPathwayView\.render/
);
assert.doesNotMatch(
    uiSource,
    /metabolism-map-placeholder/
);
assert.match(
    uiSource,
    /Cellular Energy Systems/
);
assert.match(
    uiSource,
    /MetabolismEnzymeTrayView\.render/
);

const cssSource = fs.readFileSync(
    new URL(
        "../public/css/metabolism.css",
        import.meta.url
    ),
    "utf8"
);
[
    "connection--gap",
    "connection--adjacent",
    "connection--complete"
].forEach(classFragment => {
    assert.match(
        cssSource,
        new RegExp(classFragment)
    );
});

console.log(
    "PASS: Metabolism exposes all 10 Glycolysis slots plus LDH, delegates rendering to focused pathway/tray views, and defines red-gap, yellow-adjacent, and green-complete connection states."
);
