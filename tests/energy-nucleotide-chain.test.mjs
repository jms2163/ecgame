// Run with: node tests/energy-nucleotide-chain.test.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import gameState from "../src/app/GameState.js";
import MacromolecularizerManager
    from "../src/app/MacromolecularizerManager.js";
import MacromolecularizerReactionExploration
    from "../src/app/MacromolecularizerReactionExploration.js";
import ResourceManager
    from "../src/app/ResourceManager.js";
import NucleotideRecipeCatalog
    from "../src/data/NucleotideRecipeCatalog.js";
import {
    getRecipeCardClassLabel,
    getRecipeCardIconLabel
}
    from "../src/app/MacromolecularizerRecipeCardsView.js";

const storage = new Map();

globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => {
        storage.set(key, String(value));
    },
    removeItem: key => storage.delete(key)
};

globalThis.window = {
    addEventListener() {},
    removeEventListener() {}
};

class ExplorationElement {
    constructor() {
        this.innerHTML = "";
    }

    addEventListener() {}

    contains() {
        return true;
    }

    querySelector() {
        return null;
    }

    querySelectorAll() {
        return [];
    }
}

const expectedRecipes = {
    ADP: {
        name: "Adenosine Diphosphate",
        components: [
            ["AMP", 1, "macromolecularizer"],
            ["PO4", 1, "moleculeLab"]
        ]
    },
    ATP: {
        name: "Adenosine Triphosphate",
        components: [
            ["ADP", 1, "macromolecularizer"],
            ["PO4", 1, "moleculeLab"]
        ]
    }
};

Object.entries(expectedRecipes)
    .forEach(([id, expected]) => {
        const definition =
            NucleotideRecipeCatalog.get(id);

        assert.ok(definition);
        assert.equal(definition.name, expected.name);
        assert.equal(definition.implemented, true);
        assert.equal(definition.compositionValid, true);
        assert.equal(definition.consumesComponents, false);
        assert.equal(definition.atpCost, 1);
        assert.equal(definition.baseDurationSeconds, 30);
        assert.equal(definition.bondType, "phosphoanhydride");
        assert.equal(
            getRecipeCardClassLabel(definition),
            "RNA"
        );
        assert.equal(
            getRecipeCardIconLabel(definition),
            id
        );
        assert.deepEqual(
            definition.components.map(component => [
                component.id,
                component.quantity,
                component.sourceZoneId
            ]),
            expected.components
        );
    });

gameState.discoveries.reactions = {};
gameState.registry.resources.atp = {
    current: 50,
    maximum: 50
};
gameState.zones.moleculeLab.state = {
    synthesized: {
        PO4: { count: 1 }
    }
};
gameState.zones.macromolecularizer.state = {};

MacromolecularizerManager.initialize();

const explorationElement =
    new ExplorationElement();

MacromolecularizerReactionExploration
    .initialize(
        explorationElement,
        {
            onComplete: category =>
                MacromolecularizerManager
                    .completeDehydrationExploration(
                        category
                    ),
            onExit() {}
        }
    );
MacromolecularizerReactionExploration
    .open("nucleotides");

assert.match(
    explorationElement.innerHTML,
    /Drag ADP to the left dotted template/
);

[
    ["left", "left"],
    ["right", "right"]
].forEach(([token, target]) => {
    assert.equal(
        MacromolecularizerReactionExploration
            .accept(token, target),
        true
    );
});

const placedReactionMarkup =
    explorationElement.innerHTML;
const terminalPhosphateIndex =
    placedReactionMarkup.indexOf(
        "macro-exp-adp-terminal-phosphate"
    );
const terminalOxygenIndex =
    placedReactionMarkup.indexOf(
        "macro-exp-terminal-oxygen"
    );
const terminalHydrogenIndex =
    placedReactionMarkup.indexOf(
        "macro-exp-terminal-hydrogen"
    );
const incomingHydroxylIndex =
    placedReactionMarkup.indexOf(
        'class="macro-exp-free-phosphate-oh"'
    );
const incomingPhosphorusIndex =
    placedReactionMarkup.indexOf(
        'class="macro-exp-free-phosphate-p"'
    );
const incomingOxygenIndex =
    placedReactionMarkup.indexOf(
        'class="macro-exp-free-phosphate-o"'
    );

assert(
    terminalPhosphateIndex < terminalOxygenIndex &&
    terminalOxygenIndex < terminalHydrogenIndex,
    "ADP must display its terminal P-O-H group in one horizontal sequence"
);
assert(
    incomingHydroxylIndex < incomingPhosphorusIndex &&
    incomingPhosphorusIndex < incomingOxygenIndex,
    "incoming phosphate must face ADP as OH-P-O"
);
assert.match(
    placedReactionMarkup,
    /macro-exp-nucleotide-link--short/
);
assert.match(
    placedReactionMarkup,
    /class="macro-exp-terminal-oxygen" data-explore-drop="terminal"/
);
assert.match(placedReactionMarkup, /data-explore-drag="energy"/);
assert.match(placedReactionMarkup, /data-explore-drop="energy-slot"/);
assert.equal(
    MacromolecularizerReactionExploration.accept("oh", "waste"),
    false,
    "energy must be placed before the reaction proceeds"
);
const explorationReserve = ResourceManager.getATPStatus().current;
assert.equal(
    MacromolecularizerReactionExploration.accept("energy", "energy-slot"),
    true
);
assert.match(explorationElement.innerHTML, /macro-exp-nucleotide-energy-placed/);
assert.doesNotMatch(explorationElement.innerHTML, /data-explore-drag="energy"/);
assert.equal(ResourceManager.getATPStatus().current, explorationReserve);

[
    ["oh", "waste"],
    ["h", "waste"],
    ["bond", "terminal"]
].forEach(([token, target]) => {
    assert.equal(
        MacromolecularizerReactionExploration
            .accept(token, target),
        true
    );
});

assert.match(
    explorationElement.innerHTML,
    /ADP REACTS WITH PHOSPHATE TO PRODUCE ATP AND WATER\./
);
assert.match(
    explorationElement.innerHTML,
    /ADP \+ phosphate → ATP \+ H₂O/
);
assert.doesNotMatch(
    explorationElement.innerHTML,
    /stored molecule|spendable ATP reserve|phosphoanhydride/i
);
assert.match(
    explorationElement.innerHTML,
    /macro-exp-terminal-oxygen--leaving/
);
assert.match(
    explorationElement.innerHTML,
    /macro-exp-nucleotide-bond/
);
assert.match(explorationElement.innerHTML, /macro-exp-nucleotide-energy--absorbed/);
assert.equal(ResourceManager.getATPStatus().current, explorationReserve);

const macromolecularizerCSS =
    fs.readFileSync(
        new URL(
            "../public/css/macromolecularizer.css",
            import.meta.url
        ),
        "utf8"
    );

assert.match(
    macromolecularizerCSS,
    /macro-exp-terminal-oxygen-leave 380ms/
);
assert.match(
    macromolecularizerCSS,
    /macro-exp-nucleotide-bond-reveal 650ms 420ms/
);
assert.match(
    macromolecularizerCSS,
    /macro-exp-nucleotide-energy--absorbed[\s\S]*?macro-exp-nucleotide-energy-absorb 1\.15s 420ms/
);
assert.match(macromolecularizerCSS, /translate\(-50%, 95px\)/);
assert.equal(
    MacromolecularizerManager
        .hasReactionDiscovery("dehydration-4"),
    true
);
assert.equal(
    MacromolecularizerManager
        .hasReactionDiscovery("dehydration"),
    true
);

const inventory =
    gameState.zones.macromolecularizer
        .state.motifInventory;
inventory.AMP = 1;

let adpEligibility =
    MacromolecularizerManager
        .getMotifEligibility("ADP");
let atpEligibility =
    MacromolecularizerManager
        .getMotifEligibility("ATP");

assert.equal(adpEligibility.eligible, true);
assert.equal(atpEligibility.eligible, false);
assert.deepEqual(
    atpEligibility.missingMonomerIds,
    ["ADP"]
);

inventory.ADP = 1;
atpEligibility =
    MacromolecularizerManager
        .getMotifEligibility("ATP");

assert.equal(atpEligibility.eligible, true);

const reserveBefore =
    ResourceManager.getATPStatus();
const started =
    MacromolecularizerManager
        .startSynthesis("ATP", 10_000);

assert.equal(started.success, true);
assert.equal(
    ResourceManager.getATPStatus().current,
    reserveBefore.current - 1,
    "the one-ATP game assembly cost is spent when synthesis starts"
);

const finished =
    MacromolecularizerManager
        .finishSynthesis(
            started.synthesis.jobId,
            started.synthesis.completesAtMs
        );

assert.equal(finished.success, true);
assert.equal(inventory.ATP, 1);
assert.equal(
    MacromolecularizerManager
        .getStatus()
        .synthesized.ATP.count,
    1
);
assert.equal(
    ResourceManager.getATPStatus().current,
    reserveBefore.current - 1,
    "stored ATP synthesis must not credit the spendable ATP reserve"
);

console.log(
    "PASS: ADP and phosphate require a dragged energy bolt before bonding, the bolt descends and fades during bond formation, dehydration-4 records without spending ATP, and stored ATP stays separate from the reserve."
);
