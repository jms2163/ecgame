// Run with: node tests/macromolecularizer-recipe-cards.test.mjs

import assert from "node:assert/strict";
import MacromolecularRecipeCatalog
    from "../src/data/MacromolecularRecipeCatalog.js";
import {
    renderRecipeCards
} from "../src/app/MacromolecularizerRecipeCardsView.js";

class TestElement {
    constructor(tagName) {
        this.tagName = tagName;
        this.attributes = {};
        this.children = [];
        this.className = "";
        this.dataset = {};
        this.disabled = false;
        this.textContent = "";
        this.type = "";
    }

    setAttribute(name, value) {
        this.attributes[name] = String(value);
    }

    append(...children) {
        this.children.push(...children);
    }

    replaceChildren(...children) {
        this.children = [...children];
    }
}

globalThis.document = {
    createElement(tagName) {
        return new TestElement(tagName);
    }
};

function motifStatus(id, quantity = 0) {
    return {
        definition:
            MacromolecularRecipeCatalog.get(id),
        inventory: { quantity },
        lifecycleStatus:
            quantity > 0 ? "ready" : "blocked",
        timing: { durationMs: 60_000 }
    };
}

const container = new TestElement("section");
const motifs = [
    motifStatus("AMP"),
    motifStatus("dTMP"),
    motifStatus("NADPlus", 1),
    motifStatus("H_helix")
];

const count = renderRecipeCards({
    container,
    motifs,
    selectedMotifId: "NADPlus",
    activeSynthesis: null,
    formatDuration: () => "1m",
    formatLifecycleStatus: (status, quantity) =>
        `${status}:${quantity}`
});

assert.equal(count, 4);
assert.equal(container.children.length, 4);

const cardLabels = container.children.map(card => ({
    icon: card.children[0].children[0].textContent,
    classLabel:
        card.children[0].children[1].textContent,
    selected:
        card.attributes["aria-pressed"]
}));

assert.deepEqual(cardLabels, [
    {
        icon: "A",
        classLabel: "RNA",
        selected: "false"
    },
    {
        icon: "T",
        classLabel: "DNA",
        selected: "false"
    },
    {
        icon: "NAD+",
        classLabel: "COF",
        selected: "true"
    },
    {
        icon: "α",
        classLabel: "H_helix",
        selected: "false"
    }
]);

assert.match(
    container.children[0].children[2]
        .textContent,
    /3 components · 2 ATP · 1m/
);
assert.equal(
    container.children[2].children[3]
        .children[0].textContent,
    "1 stored"
);

console.log(
    "PASS: extracted Macromolecularizer recipe-card rendering preserves nucleotide icons, RNA/DNA/COF class labels, motif visuals, selection state, summaries, and inventory text."
);
