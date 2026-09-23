import assert from "node:assert/strict";
import { groupPolymerizerProducts }
    from "../src/app/PolymerizerProductView.js";

const products = [
    { id: "synthesizedA", completion: { source: "synthesized" } },
    { id: "missingA", canStart: false },
    { id: "questA", completion: { source: "quest" } },
    { id: "readyA", canStart: true },
    { id: "lockedA", locked: true, canStart: false },
    { id: "readyB", canStart: true },
    { id: "synthesizedB", completion: { source: "synthesized" } }
];

const groups = groupPolymerizerProducts(products);
assert.deepEqual(
    groups.map(({ label, products: items }) => [
        label,
        items.map(item => item.id)
    ]),
    [
        ["Ready", ["readyA", "readyB"]],
        ["Incomplete", ["missingA", "lockedA"]],
        ["Quest Completed", ["questA"]],
        ["Synthesis Completed", ["synthesizedA", "synthesizedB"]]
    ]
);

// An assembling protein stays visible in Ready after ATP is spent.
const assembling = groupPolymerizerProducts(
    [{ id: "active", canStart: false }, ...products],
    { productId: "active" }
);
assert.deepEqual(
    assembling[0].products.map(item => item.id),
    ["active", "readyA", "readyB"]
);
assert.equal(groupPolymerizerProducts([]).length, 0);

console.log("PASS: Polymerizer cards group by readiness and completion, preserve catalog order, and keep the active job visible.");
