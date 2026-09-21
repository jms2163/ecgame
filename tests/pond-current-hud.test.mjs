// Run with: node tests/pond-current-hud.test.mjs

import assert from "node:assert/strict";

class FakeElement {
    constructor(tagName) {
        this.tagName = tagName;
        this.children = [];
        this.dataset = {};
        this.attributes = {};
        this.id = "";
        this.textContent = "";
    }

    setAttribute(name, value) {
        this.attributes[name] = value;
    }

    append(...children) {
        this.children.push(...children);
    }
}

globalThis.document = {
    createElement: tagName =>
        new FakeElement(tagName)
};

const { default: PondStatusHud } =
    await import(
        "../src/app/PondStatusHud.js"
    );

const hud = PondStatusHud.create();

PondStatusHud.render(
    { x: 28, y: -42 },
    { current: 92, maximum: 155 },
    {
        direction: { label: "SE" },
        anchored: false,
        safetyHoldActive: false,
        millisecondsUntilShift: 290_933,
        millisecondsUntilDirectionChange:
            3_590_933
    }
);

assert.equal(
    PondStatusHud.coordinatesElement.textContent,
    "COORD: 28, -42"
);
assert.equal(
    PondStatusHud.atpElement.textContent,
    "ATP: 92/155"
);
assert.equal(
    PondStatusHud.currentElement.textContent,
    "CURRENT: SE | DRIFT 4:51 | TURN 59:51"
);
assert.equal(
    PondStatusHud.currentElement.dataset.state,
    "drifting"
);

PondStatusHud.renderCurrent({
    direction: { label: "SE" },
    anchored: true,
    safetyHoldActive: false,
    millisecondsUntilShift: null,
    millisecondsUntilDirectionChange:
        3_000_000
});

assert.equal(
    PondStatusHud.currentElement.textContent,
    "CURRENT: SE | ANCHORED (-2 ATP/MIN) | TURN 50:00"
);
assert.equal(
    PondStatusHud.currentElement.dataset.state,
    "anchored"
);

PondStatusHud.renderCurrent({
    direction: { label: "W" },
    anchored: false,
    safetyHoldActive: true,
    lastBlockedBiome: "anaerobic_pocket",
    millisecondsUntilShift: 125_000,
    millisecondsUntilDirectionChange:
        600_000
});

assert.equal(
    PondStatusHud.currentElement.textContent,
    "CURRENT: W | SAFETY HOLD: ANAEROBIC POCKET | RETRY 2:05 | TURN 10:00"
);
assert.equal(
    PondStatusHud.currentElement.dataset.state,
    "safety-hold"
);
assert.equal(
    hud.children.length,
    2,
    "the HUD must render status on two lines"
);

console.log(
    "PASS: the Pond HUD displays coordinates and ATP above a live current line with drift, anchored, and safety-hold states."
);
