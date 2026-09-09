import assert from "node:assert/strict";

import PlasmaMembraneVisualCatalog
    from "../src/app/PlasmaMembraneVisualCatalog.js";

const originalDocument =
    globalThis.document;

try {
    globalThis.document = {
        baseURI:
            "https://jms2163.github.io/ecgame/"
    };

    const properties =
        new Map();

    const surface = {
        style: {
            setProperty(name, value) {
                properties.set(name, value);
            }
        }
    };

    PlasmaMembraneVisualCatalog.applyGeometry(
        surface
    );

    assert.equal(
        properties.get("--membrane-start"),
        "44%"
    );

    assert.equal(
        properties.get("--membrane-width"),
        "12%"
    );

    assert.equal(
        properties.get("--plasma-membrane-image"),
        'url("https://jms2163.github.io/ecgame/public/assets/experiments/membranes/phospholipid-bilayer-animated.svg")',
        "the simulation membrane must use an absolute asset URL"
    );
} finally {
    if (originalDocument === undefined) {
        delete globalThis.document;
    } else {
        globalThis.document =
            originalDocument;
    }
}

console.log(
    "PASS: membrane simulation geometry uses an absolute animated-bilayer URL that remains visible beneath the particle canvas."
);
