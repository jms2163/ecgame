import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Library from "../src/app/OrganelleExperimentLibrary.js";
import Catalog from "../src/app/PhotosystemIExcitationCatalog.js";
import View, { antennaPath, chooseAntenna, scoreAnswers } from "../src/app/PhotosystemIExcitationView.js";

assert.equal(Library.photosystem_i_excitation, Catalog);
assert.deepEqual(Catalog.requirements.perfectScoreExperiments, ["photosystem_ii_electron_transport"]);
assert.equal(Catalog.assessment.scoreMaximum, 5);
assert.equal(scoreAnswers({ reaction_center: "p700", replacement: "pc", carrier: "fd", enzyme: "fnr", electron_count: "two" }).scorePoints, 5);
assert.match(Catalog.assessment.questions[2].prompt, /After PSI's primary electron acceptor/);
assert.deepEqual([0, .2, .4, .6, .8, .999].map(value => chooseAntenna(() => value)), [0, 1, 2, 3, 4, 5]);
assert.deepEqual([0, 1, 2, 3, 4, 5].map(antennaPath), [
    [0, 1, 2], [1, 2], [2], [3, 4, 5], [4, 5], [5]
]);
const stage = readFileSync(new URL("../src/app/OrganelleExperimentStage.js", import.meta.url), "utf8");
assert.match(stage, /PhotosystemIExcitationView\.mount\(this\.contentElement/);
assert.match(stage, /PhotosystemIExcitationView\.clear\(\)/);

const originalPause = View.pause;
const originalRender = View.render;
const originalStep = View.step;
const originalRandom = Math.random;
try {
    const snapshots = [];
    View.render = originalRender;
    View.pause = async (_, token) => token === View.generation;
    View.step = async (motion, _, token) => {
        View.motion = motion;
        View.render();
        snapshots.push({ motion, p700Plus: View.p700Plus,
            acceptorElectron: View.acceptorElectron, pcElectron: View.pcElectron,
            fdElectrons: View.fdElectrons, fnrElectrons: View.fnrElectrons,
            fdDocked: View.fdDocked, nadpApproached: View.nadpApproached,
            markup: View.root.innerHTML });
        return token === View.generation;
    };
    Math.random = () => .8;
    View.generation = 1;
    View.root = { innerHTML: "" };
    View.controls = { innerHTML: "" };
    View.placed = new Set(["psi", "acceptor", "p700", "fd", ...Array.from({ length: 6 }, (_, i) => `chl${i}`)]);
    View.phase = "ready-excite";
    View.cycles = 0; View.fdElectrons = 0; View.fnrElectrons = 0; View.fdDocked = false;
    View.p700Plus = false; View.acceptorElectron = false;
    View.nadph = false; View.nadpApproached = false;
    View.pcElectron = false; View.motion = "";
    View.answers = {}; View.optionOrder = null;
    View.phase = "assembly"; View.render();
    assert.doesNotMatch(View.controls.innerHTML, /water-action-ready/);
    View.phase = "ready-excite";
    View.render();
    assert.match(View.controls.innerHTML, /water-action-ready/);
    assert.match(View.root.innerHTML, /data-psi-target="fd" cx="580" cy="145"/);
    assert.match(View.root.innerHTML, /Blue photon waiting for Excite/);
    await View.excite();
    assert.equal(View.targetAntenna, 4);
    assert.match(snapshots.find(s => s.motion === "photon").markup, /--psi-photon-dx:455px;--psi-photon-dy:220px/);
    assert.deepEqual(snapshots.filter(s => s.motion.startsWith("antenna-")).map(s => s.motion), ["antenna-4", "antenna-5"]);
    assert.match(snapshots.find(s => s.motion === "antenna-4").markup, /data-psi-target="chl4"[^>]*psii-excited/);
    assert.match(snapshots.find(s => s.motion === "antenna-5").markup, /data-psi-target="chl5"[^>]*psii-excited/);
    const flight = snapshots.find(s => s.motion === "acceptor");
    assert.equal(flight.acceptorElectron, false);
    assert.equal(flight.p700Plus, true);
    assert.equal((flight.markup.match(/data-psi-electron="/g) ?? []).length, 1);
    const toFd = snapshots.find(s => s.motion === "to-fd");
    assert.equal(toFd.acceptorElectron, true);
    assert.match(toFd.markup, /data-psi-electron="to-fd"><circle cx="450" cy="240"/);
    assert.doesNotMatch(toFd.markup, /data-psi-electron="acceptor"/);
    assert.ok(snapshots.indexOf(toFd) < snapshots.findIndex(s => s.motion === "pc-approach"));
    const arrival = snapshots.find(s => s.motion === "pc-approach");
    assert.equal(arrival.pcElectron, true);
    assert.equal(arrival.p700Plus, true);
    assert.match(arrival.markup, /P700⁺/);
    assert.match(arrival.markup, /data-psi-electron="pc"/);
    assert.match(arrival.markup, /<ellipse cx="215" cy="480" rx="43" ry="27" class="etc-pc"/);
    assert.equal(snapshots.find(s => s.motion === "pc-donate").p700Plus, true);
    assert.equal(snapshots.find(s => s.motion === "pc-depart").p700Plus, false);
    assert.equal(View.phase, "place-carriers");
    assert.equal(View.cycles, 1);
    assert.equal(View.p700Plus, false);
    assert.equal(View.acceptorElectron, false);
    assert.equal(View.fdElectrons, 1);
    View.place("fnr", "fnr");
    assert.equal(View.phase, "ready-excite");
    snapshots.length = 0;
    await View.excite();
    const fdMove = snapshots.find(s => s.motion === "fd-to-fnr");
    assert.equal(fdMove.fdElectrons, 2);
    assert.match(fdMove.markup, /class="psi-fd-unit psi-fd-to-fnr/);
    assert.equal((fdMove.markup.match(/data-psi-electron="fd-/g) ?? []).length, 2);
    assert.doesNotMatch(fdMove.markup, /data-psi-electron="fnr-to-nadp/);
    const handoff = snapshots.find(s => s.motion === "fd-handoff");
    assert.equal((handoff.markup.match(/data-psi-electron="fd-/g) ?? []).length, 2);
    const fdReturn = snapshots.find(s => s.motion === "fd-return");
    assert.equal(fdReturn.fdDocked, true);
    assert.match(fdReturn.markup, /psi-fd-return/);
    assert.equal((fdReturn.markup.match(/data-psi-electron="fnr-/g) ?? []).length, 2);
    const approach = snapshots.find(s => s.motion === "nadp-approach");
    assert.equal((approach.markup.match(/data-psi-electron="fnr-/g) ?? []).length, 2);
    assert.match(approach.markup, /psi-nadp-approach/);
    const fnrDelivery = snapshots.find(s => s.motion === "fnr-to-nadp");
    assert.equal(fnrDelivery.nadpApproached, true);
    assert.equal((fnrDelivery.markup.match(/data-psi-electron="fd-/g) ?? []).length, 0);
    assert.equal((fnrDelivery.markup.match(/data-psi-electron="fnr-to-nadp/g) ?? []).length, 2);
    assert.equal(View.cycles, 2);
    assert.equal(View.phase, "done");
    assert.equal(View.nadph, true);
    assert.equal(View.fdElectrons, 0);
    assert.equal(View.fdDocked, false);
    assert.equal(View.nadpApproached, false);
    assert.match(snapshots.find(s => s.motion === "nadph-return").markup, /psi-nadph-return/);
    assert.doesNotMatch(View.controls.innerHTML, /water-action-ready/);
    assert.match(View.root.innerHTML, /mask="url\(#psi-nadp-cutout\)"/);
    assert.match(View.root.innerHTML, /width="107" height="62" rx="12" class="psi-nadp"/);
    assert.match(snapshots.find(s => s.motion === "proton").markup, /data-psi-proton><circle cx="704" cy="46" r="16"/);
    assert.match(View.root.innerHTML, /<circle cx="814" cy="25" r="16" class="water-proton"/);
} finally {
    View.pause = originalPause;
    View.render = originalRender;
    View.step = originalStep;
    Math.random = originalRandom;
    View.root = null;
    View.controls = null;
}
console.log("PASS: PSI follows two excitations, PC replacement, Fd transfers, and NADPH formation.");
