import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import ResearchManager from "../src/app/ResearchManager.js";
import Library from "../src/app/OrganelleExperimentLibrary.js";
import Catalog from "../src/app/PhotosystemIIElectronTransportCatalog.js";
import View, { excitationPath } from "../src/app/PhotosystemIIElectronTransportView.js";

assert.equal(Library.photosystem_ii_electron_transport, Catalog);
assert.deepEqual(Catalog.requirements.perfectScoreExperiments, ["photosystem_ii_water_splitting"]);
assert.deepEqual([0, .25, .5, .75].map(n => excitationPath(() => n)), [
    [0, 1, 2], [1, 2], [3, 4, 5], [4, 5]
]);

const backup = structuredClone(gameState);
const oldMove = View.move;
const oldPause = View.pause;
const oldAnimateFrames = View.animateFrames;
const oldRotateAndDock = View.rotateAndDock;
try {
    ResearchManager.ensureRegistryStructures();
    gameState.registry.research.bestExperimentScores.photosystem_ii_water_splitting = {
        scorePoints: 3, scoreMaximum: 4, scorePercent: 75
    };
    assert.equal(ResearchManager.getExperimentStatus(Catalog.id).available, false);
    gameState.registry.research.bestExperimentScores.photosystem_ii_water_splitting = {
        scorePoints: 4, scoreMaximum: 4, scorePercent: 100
    };
    assert.equal(ResearchManager.getExperimentStatus(Catalog.id).available, true);

    const nodes = new Map();
    let boardBox = null;
    const mockNode = () => ({
        style: {}, innerHTML: "", textContent: "", attrs: {},
        classList: { add() {}, remove() {} },
        setAttribute(key, value) { this.attrs[key] = value; },
        querySelector: () => null
    });
    View.root = {
        innerHTML: "",
        querySelector(selector) {
            if (selector === "[data-etc-board]") return boardBox;
            if (!nodes.has(selector)) nodes.set(selector, mockNode());
            return nodes.get(selector);
        }
    };
    View.controls = { innerHTML: "" };
    View.psii = false;
    View.pq = false;
    View.cytochrome = false;
    View.loaded = 0;
    View.cycle = 0;
    View.donorVisible = true;
    View.donorDocked = false;
    View.donorProtonsVisible = true;
    View.donorElectronsUsed = [false, false];
    View.qiElectrons = 0;
    View.qiProtons = 0;
    View.fElectrons = 0;
    View.lumenProtons = 0;
    View.waterSplits = 0;
    View.oxygenStage = "water";
    View.photonVisible = true;
    View.phase = "setup";
    View.animationStep = null;
    View.generation = 0;
    const moves = [];
    let loadedFrame = "";
    let electronDrawnAbovePQ = false;
    const animations = [];
    const rotations = [];
    View.rotateAndDock = async node => { rotations.push(node); return true; };
    View.animateFrames = async (node, frames) => {
        animations.push({ node, frames, html: View.root.innerHTML });
        return true;
    };
    View.move = async (node, dx, dy) => {
        if (node === nodes.get("[data-etc-accepted]")) {
            const frame = View.root.innerHTML;
            electronDrawnAbovePQ = frame.indexOf("data-etc-pq") < frame.indexOf("data-etc-accepted");
        }
        moves.push({ node, dx, dy });
        return true;
    };
    View.pause = async () => {
        if (View.phase === "pq-loaded") loadedFrame = View.root.innerHTML;
        return true;
    };
    const xp = gameState.player.xp;

    View.render();
    assert.match(View.root.innerHTML, /STROMA/);
    assert.match(View.root.innerHTML, /THYLAKOID LUMEN/);
    assert.match(View.root.innerHTML, /PQ TARGET/);
    assert.match(View.root.innerHTML, /transform="translate\(-100 0\)"/);
    assert.match(View.root.innerHTML, /data-etc-photon cx="170" cy="85"/);
    assert.doesNotMatch(View.root.innerHTML, /data-etc-accepted/);
    View.place("pq");
    assert.equal(View.pq, false);
    View.place("psii");
    assert.match(View.root.innerHTML, /data-etc-water="0"/);
    assert.match(View.root.innerHTML, /data-etc-water="1"/);
    assert.match(View.root.innerHTML, /data-etc-water-bond-electron="0"/);
    View.place("pq");
    assert.equal(View.phase, "ready-excite");
    assert.match(View.root.innerHTML, /PRIMARY ACCEPTOR/);
    assert.match(View.root.innerHTML, /data-etc-photon/);
    assert.match(View.root.innerHTML, /data-etc-proton="0"/);
    assert.match(View.root.innerHTML, /data-etc-proton="1"/);
    assert.match(View.root.innerHTML, /width="136" height="100"/);
    assert.match(View.controls.innerHTML, /Excite/);
    assert.match(View.root.innerHTML, /data-etc-material="cytochrome"[^>]*disabled/);

    for (let cycle = 0; cycle < 2; cycle++) {
        await View.excite();
        assert.equal(View.phase, "ready-split");
        assert.match(View.root.innerHTML, /P680\+/);
        assert.match(View.root.innerHTML, /data-etc-accepted class="psii-electron-shake"/);
        assert.match(View.controls.innerHTML, /Split H₂O/);
        await View.splitWater();
        assert.equal(View.waterSplits, cycle + 1);
        assert.match(View.root.innerHTML, new RegExp(`data-etc-water-proton="${cycle}"`));
        assert.equal(View.loaded, cycle + 1);
        assert.equal(View.phase, cycle === 0 ? "ready-excite" : "await-cytochrome");
        assert.match(View.root.innerHTML, new RegExp(`data-etc-bound-proton="${cycle}"`));
        if (cycle === 0) assert.match(View.root.innerHTML, /data-etc-photon/);
    }
    assert.match(loadedFrame, /PQH₂/);
    assert.match(loadedFrame, /data-etc-bound-proton="1"/);
    assert.match(loadedFrame, /x="380" y="130"/);
    assert.match(loadedFrame, /cx="415" cy="169"/);
    assert.match(loadedFrame, /x="448" y="214"/);
    assert.equal(electronDrawnAbovePQ, true);
    assert.ok(moves.some(move => move.node === nodes.get("[data-etc-pq]") && move.dx === 50 && move.dy === 105));
    assert.match(View.root.innerHTML, /PQH₂/);
    assert.match(View.root.innerHTML, /x="430" y="235"/);
    assert.match(View.root.innerHTML, /translate\(551 156\)/);
    assert.match(View.root.innerHTML, /data-etc-cytochrome-target/);
    assert.doesNotMatch(View.root.innerHTML, /data-etc-material="cytochrome"[^>]*disabled/);
    boardBox = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 700 }) };
    View.place("cytochrome", 300, 300);
    assert.equal(View.phase, "await-cytochrome");
    View.place("cytochrome", 650, 300);
    assert.equal(View.phase, "ready-qcycle");
    assert.equal(View.cytochrome, true);
    assert.match(View.root.innerHTML, /data-etc-cytochrome role="img"/);
    assert.match(View.root.innerHTML, /Fe-S/);
    assert.match(View.root.innerHTML, /cyt f|>f</);
    assert.match(View.root.innerHTML, /data-etc-qi role="img"/);
    assert.match(View.root.innerHTML, /x="428" y="95" width="108"/);
    assert.match(View.controls.innerHTML, /Run Q cycle · 1\/2/);
    await View.runQCycle();
    assert.equal(View.phase, "await-second-pq");
    assert.equal(View.cycle, 1);
    assert.equal(View.lumenProtons, 2);
    assert.equal(View.qiElectrons, 1);
    assert.equal(View.qiProtons, 1);
    assert.equal(View.fElectrons, 1);
    assert.match(View.root.innerHTML, /data-etc-qi-bound-electron="0"/);
    assert.doesNotMatch(View.root.innerHTML, /data-etc-qi-bound-electron="1"/);
    assert.match(View.root.innerHTML, /data-etc-material="pq"(?![^>]*disabled)/);
    assert.match(View.root.innerHTML, /x="380" y="255" width="136"/);
    assert.match(View.root.innerHTML, /data-etc-cytochrome role="img"/);
    View.place("pq", 390, 145);
    assert.equal(View.phase, "await-second-pq");
    View.place("pq", 440, 295);
    assert.equal(View.phase, "ready-excite");
    assert.equal(View.loaded, 0);
    assert.equal(View.qiElectrons, 1);
    assert.equal(View.qiProtons, 1);
    assert.match(View.root.innerHTML, /data-etc-qi-bound-electron="0"/);
    assert.match(View.root.innerHTML, /data-etc-photon/);
    assert.match(View.root.innerHTML, /data-etc-proton="0"/);
    for (let slot = 0; slot < 2; slot++) {
        await View.excite();
        assert.equal(View.phase, "ready-split");
        await View.splitWater();
        assert.equal(View.waterSplits, slot + 3);
        assert.equal(View.loaded, slot + 1);
        assert.equal(View.phase, slot === 0 ? "ready-excite" : "ready-second");
        assert.equal(View.qiElectrons, 1);
        assert.equal(View.qiProtons, 1);
    }
    assert.ok(moves.some(move => move.node === nodes.get("[data-etc-pq]") && move.dx === 50 && move.dy === -20));
    assert.equal(View.oxygenStage, "done");
    assert.equal((View.root.innerHTML.match(/data-etc-water-proton=/g) ?? []).length, 4);
    assert.doesNotMatch(View.root.innerHTML, /data-etc-water="0"/);
    assert.ok(moves.some(move => move.node === nodes.get("[data-etc-o2]") && move.dy === -575));
    assert.ok(animations.some(animation => animation.node === nodes.get("[data-etc-o-pair-electrons]")));
    assert.match(View.controls.innerHTML, /Run Q cycle · 2\/2/);
    await View.runQCycle();
    assert.equal(View.phase, "ready-recycle");
    assert.equal(View.cycle, 2);
    assert.equal(View.lumenProtons, 4);
    assert.equal(View.fElectrons, 2);
    assert.equal(View.qiElectrons, 2);
    assert.equal(View.qiProtons, 2);
    assert.match(View.controls.innerHTML, /Recycle Qi PQH₂/);
    assert.match(View.root.innerHTML, /data-etc-qi-bound-electron="1"/);
    assert.match(View.root.innerHTML, /data-etc-qi-bound-proton="1"/);
    await View.runQCycle();
    assert.equal(View.phase, "done");
    assert.equal(View.cycle, 3);
    assert.equal(View.lumenProtons, 6);
    assert.equal(View.fElectrons, 3);
    assert.equal(View.qiElectrons, 1);
    assert.equal(View.qiProtons, 1);
    assert.ok(moves.some(move => move.node === nodes.get("[data-etc-qi]") && move.dx === 2 && move.dy === 140));
    assert.match(View.root.innerHTML, /data-etc-qi role="img" aria-label="Qi-side PQ, 1 of two electrons loaded"/);
    assert.equal((View.root.innerHTML.match(/data-etc-lumen-proton=/g) ?? []).length, 6);
    assert.equal((View.root.innerHTML.match(/data-etc-water-proton=/g) ?? []).length, 4);
    assert.equal(rotations.length, 3);
    assert.doesNotMatch(View.root.innerHTML, /data-etc-proton="0"/);
    assert.doesNotMatch(View.root.innerHTML, /data-etc-proton="1"/);
    assert.equal(gameState.player.xp, xp);
    assert.equal(ResearchManager.isExperimentCompleted(Catalog.id), false);
} finally {
    View.move = oldMove;
    View.pause = oldPause;
    View.animateFrames = oldAnimateFrames;
    View.rotateAndDock = oldRotateAndDock;
    View.root = null;
    View.controls = null;
    for (const key of Object.keys(gameState)) delete gameState[key];
    Object.assign(gameState, backup);
}

console.log("PASS: ETC preview shows four O–H electron replacements, O₂ release, and three PQH₂ deliveries with ten lumen protons.");
