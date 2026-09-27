import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Library from "../src/app/OrganelleExperimentLibrary.js";
import Catalog from "../src/app/PhotosyntheticATPSynthaseCatalog.js";
import View, { ASSEMBLY_STEPS, TOTAL_PROTONS, PROTONS_PER_ATP, flightAngle, protonPosition, scoreAnswers } from "../src/app/PhotosyntheticATPSynthaseView.js";

assert.equal(Library.photosynthetic_atp_synthase, Catalog);
assert.deepEqual(Catalog.requirements.perfectScoreExperiments, ["photosystem_ii_assembly", "photosystem_ii_excitation", "photosystem_ii_water_splitting", "photosystem_ii_electron_transport", "photosystem_i_excitation"]);
assert.equal(ASSEMBLY_STEPS.length, 8);
assert.deepEqual(ASSEMBLY_STEPS.map(part => part.id), ["c-ring", "a", "epsilon", "gamma", "alpha", "beta", "b-stalk", "delta"]);
assert.equal(TOTAL_PROTONS, 10);
assert.equal(PROTONS_PER_ATP, 5);
assert.deepEqual([0, .5, 1].map(value => flightAngle(() => value)), [-20, 0, 20]);
assert.deepEqual(protonPosition(0), { x: 375, y: 525 });
assert.deepEqual(protonPosition(9), { x: 875, y: 585 });
assert.equal(scoreAnswers({ direction: "lumen_stroma", inputs: "adp_pi", location: "stroma", gradient: "h_gradient", model_count: "two" }).scorePoints, 5);
const stage = readFileSync(new URL("../src/app/OrganelleExperimentStage.js", import.meta.url), "utf8");
assert.match(stage, /PhotosyntheticATPSynthaseView\.mount\(this\.contentElement/);
assert.match(stage, /PhotosyntheticATPSynthaseView\.clear\(\)/);

const oldStep = View.step;
const oldRandom = Math.random;
try {
    const states = [];
    View.root = { innerHTML: "" };
    View.controls = { innerHTML: "" };
    View.phase = "assembly";
    View.assembled = new Set();
    View.assemblyIndex = 0;
    View.showLabels = true;
    View.motion = "";
    View.used = 0;
    View.produced = 0;
    View.currentProton = null;
    View.flightDegrees = 0;
    View.answers = {};
    View.result = null;
    View.generation = 1;
    View.render();
    assert.match(View.root.innerHTML, /NEXT COMPONENT/);
    assert.match(View.root.innerHTML, /c₁₄ rotor ring/);
    assert.match(View.root.innerHTML, /atp-preview-part/);
    assert.match(View.root.innerHTML, /atp-part-label/);
    assert.equal((View.root.innerHTML.match(/data-atp-proton=/g) ?? []).length, 10);
    assert.match(View.controls.innerHTML, /Assemble c₁₄ rotor ring/);
    assert.match(View.controls.innerHTML, /Hide labels/);
    View.showLabels = false;
    View.render();
    assert.doesNotMatch(View.root.innerHTML, /atp-part-label/);
    assert.match(View.controls.innerHTML, /Show labels/);
    View.showLabels = true;
    View.step = async (motion, _, token) => {
        View.motion = motion;
        View.render();
        states.push({ motion, used: View.used, produced: View.produced,
            currentProton: View.currentProton, html: View.root.innerHTML,
            controls: View.controls.innerHTML });
        return token === View.generation;
    };
    for (const part of ASSEMBLY_STEPS) {
        await View.assemble();
        assert.ok(View.assembled.has(part.id));
    }
    assert.deepEqual(states.slice(0, 8).map(state => state.motion), Array(8).fill("glide"));
    assert.match(states[0].html, /atp-part-glide/);
    assert.equal(View.phase, "ready");
    assert.match(View.controls.innerHTML, /Operate/);
    assert.match(View.controls.innerHTML, /water-action-ready/);
    assert.doesNotMatch(View.root.innerHTML, /atp-preview-part/);
    const before = states.length;
    await View.assemble();
    assert.equal(states.length, before);
    Math.random = () => .75;
    await View.operate();
    const running = states.slice(8);
    assert.deepEqual(running.map(state => state.motion), [
        ...Array(2).fill(null).flatMap(() => ["binding", ...Array(5).fill(null).flatMap(() => ["inlet", "bind-c", "rotate", "exit"]), "product"])
    ]);
    assert.deepEqual(running.filter(state => state.motion === "inlet").map(state => state.currentProton),
        Array.from({ length: 10 }, (_, i) => i));
    assert.deepEqual(running.filter(state => state.motion === "product").map(state => state.used), [5, 10]);
    assert.match(running[0].html, /atp-adp-bind/);
    assert.match(running[0].html, /atp-pi-bind/);
    assert.match(running[21].html, /atp-product-flight/);
    assert.equal(View.flightDegrees, 10);
    assert.equal(View.phase, "done");
    assert.equal(View.used, 10);
    assert.equal(View.produced, 2);
    assert.doesNotMatch(View.controls.innerHTML, /water-action-ready/);
    assert.doesNotMatch(View.root.innerHTML, /data-atp-proton=/);
    assert.match(View.root.innerHTML, /All ten H⁺ passed through/);
    const after = states.length;
    await View.operate();
    assert.equal(states.length, after);
} finally {
    View.step = oldStep;
    Math.random = oldRandom;
    View.root = null;
    View.controls = null;
}
console.log("PASS: guided assembly, labels, proton path, ATP release, and shutdown.");
