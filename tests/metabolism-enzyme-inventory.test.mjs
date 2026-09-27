import assert from "node:assert/strict";
import Tray from "../src/app/MetabolismEnzymeTrayView.js";
import UI from "../src/app/MetabolismUI.js";
import Manager from "../src/app/MetabolismManager.js";

const originalDocument = globalThis.document;
const originalPlace = Manager.placeEnzyme;
const originalRender = UI.render;
function element() {
    return {
        children: [], dataset: {}, events: {}, hidden: false,
        append(...nodes) { this.children.push(...nodes); },
        appendChild(node) { this.children.push(node); },
        replaceChildren(...nodes) { this.children = nodes; },
        addEventListener(type, handler) { this.events[type] = handler; },
        showModal() { this.open = true; },
        close() { this.open = false; }
    };
}

try {
    globalThis.document = { createElement: element };
    const pathway = {
        id: "glycolysis", available: true,
        coreSlots: [
            { slot: 1, enzymeId: "Hexokinase", label: "Hexokinase" },
            { slot: 2, enzymeId: "PhosphoglucoseIsomerase", label: "Phosphoglucose Isomerase" },
            { slot: 3, enzymeId: "Phosphofructokinase", label: "Phosphofructokinase-1" }
        ],
        regenerationBranches: [],
        availableEnzymes: [
            { slot: 1, enzymeId: "Hexokinase", placed: true },
            { slot: 2, enzymeId: "PhosphoglucoseIsomerase", placed: false }
        ]
    };
    const tray = element();
    let inspected;
    Tray.render(tray, pathway, (slot, state) => { inspected = { slot, state }; });
    assert.deepEqual(tray.children.map(card => card.children[1].textContent),
        ["Enzyme activated", "Enzyme unactivated", "Enzyme required"]);
    assert.deepEqual(tray.children.map(card => card.draggable), [false, true, false]);
    tray.children[2].events.click();
    assert.equal(inspected.slot.enzymeId, "Phosphofructokinase");
    assert.equal(inspected.state.synthesized, false);
    const dialog = element();
    UI.rootElement = { querySelector: () => dialog };
    UI.inspectEnzyme(pathway, pathway.coreSlots[2], inspected.state);
    assert.match(dialog.children[2].textContent, /synthesized in the Polymerizer/);
    assert.equal(dialog.children[1].children.at(-1).src.endsWith("/4y8v_motifs/4y8v-0.png"), true);
    assert.equal(dialog.children[3].children.length, 1);
    dialog.close();

    tray.children[1].events.click();
    UI.inspectEnzyme(pathway, inspected.slot, inspected.state);
    assert.match(dialog.children[2].textContent, /Drag .* to its pathway card/);
    assert.equal(dialog.children[1].children.at(-1).src.endsWith("/2pgi_motifs/2pgi-29.png"), true);
    let called = null;
    Manager.placeEnzyme = (...args) => {
        called = args;
        return { success: true };
    };
    UI.render = () => true;
    dialog.children[3].children[0].events.click();
    assert.deepEqual(called, ["glycolysis", 2, "PhosphoglucoseIsomerase"]);
    assert.equal(dialog.open, false);
    tray.children[0].events.click();
    UI.inspectEnzyme(pathway, inspected.slot, inspected.state);
    assert.match(dialog.children[2].textContent, /functioning/);
} finally {
    globalThis.document = originalDocument;
    Manager.placeEnzyme = originalPlace;
    UI.render = originalRender;
    UI.rootElement = null;
}
console.log("PASS: the compact inventory shows all enzyme states and the protein dialog activates synthesized enzymes.");
