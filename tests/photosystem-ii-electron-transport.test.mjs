import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import gameState from "../src/app/GameState.js";
import ResearchManager from "../src/app/ResearchManager.js";
import Library from "../src/app/OrganelleExperimentLibrary.js";
import Catalog from "../src/app/PhotosystemIIElectronTransportCatalog.js";
import View, { excitationPath, scoreAnswers } from "../src/app/PhotosystemIIElectronTransportView.js";
import Panel from "../src/app/OrganelleExperimentPanel.js";
import SubmissionManager from "../src/app/OrganelleExperimentSubmissionManager.js";
import ProgressReportExporter from "../src/app/ProgressReportExporter.js";
import { randomizedOptions } from "../src/app/PhotosystemIIQuizOptions.js";

assert.equal(Library.photosystem_ii_electron_transport, Catalog);
assert.deepEqual(Catalog.requirements.perfectScoreExperiments, ["photosystem_ii_water_splitting"]);
assert.deepEqual([0, .25, .5, .75].map(n => excitationPath(() => n)), [
    [0, 1, 2], [1, 2], [3, 4, 5], [4, 5]
]);
assert.equal(Catalog.grants.xp, 600);
assert.equal(Catalog.assessment.scoreMaximum, 5);
assert.equal(Catalog.assessment.rubricVersion, "photosystem-ii-electron-transport-v2");
assert.equal(Catalog.assessment.questions[0].prompt, "How many electrons can one plastoquinone (PQ) carry?");
assert.equal(Catalog.assessment.questions[2].prompt, "Which molecule takes an electron from cytochrome f to PSI?");
assert.equal(Catalog.assessment.questions[3].prompt, "Where do protons increase in concentration?");
assert.equal(scoreAnswers({ pq_electrons: "two", pq_protons: "stroma", last_carrier: "pc", gradient: "lumen", lumen_total: "ten" }).scorePoints, 5);
const shuffled = randomizedOptions(Catalog.assessment.questions, () => 0);
assert.notDeepEqual(shuffled.get("pq_electrons").map(option => option.id), Catalog.assessment.questions[0].options.map(option => option.id));
assert.deepEqual(randomizedOptions([{ id: "tf", options: [{ id: "true", text: "True" }, { id: "false", text: "False" }] },
    { id: "none", options: [{ id: "a", text: "A" }, { id: "none", text: "None of these" }, { id: "b", text: "B" }] }], () => 0).get("none").map(option => option.id), ["a", "none", "b"]);

const backup = structuredClone(gameState);
const oldMove = View.move;
const oldPause = View.pause;
const oldAnimateFrames = View.animateFrames;
const oldRotateAndDock = View.rotateAndDock;
const oldRefresh = Panel.refresh;
const oldStorage = globalThis.localStorage;
try {
    Panel.refresh = () => true;
    const storage = new Map();
    globalThis.localStorage = { getItem: key => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, String(value)),
        removeItem: key => storage.delete(key) };
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
    View.pc = false;
    View.pcLoaded = false;
    View.pcNearCytochrome = false;
    View.pcTransfers = 0;
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
    View.answers = {};
    View.result = null;
    View.sandbox = false;
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
    View.move = async (node, dx, dy, _duration, _generation, fromX, fromY) => {
        if (node === nodes.get("[data-etc-accepted]")) {
            const frame = View.root.innerHTML;
            electronDrawnAbovePQ = frame.indexOf("data-etc-pq") < frame.indexOf("data-etc-accepted");
        }
        moves.push({ node, dx, dy, fromX, fromY, html: View.root.innerHTML });
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
    assert.equal(View.phase, "await-pc");
    assert.match(View.root.innerHTML, /data-etc-pc-target/);
    assert.match(View.root.innerHTML, /data-etc-material="pc"(?![^>]*disabled)/);
    View.place("pc", 650, 300);
    assert.equal(View.phase, "await-pc");
    View.place("pc", 788, 480);
    assert.equal(View.phase, "ready-qcycle");
    assert.equal(View.cytochrome, true);
    assert.equal(View.pc, true);
    assert.match(View.root.innerHTML, /data-etc-psi/);
    assert.match(View.root.innerHTML, /data-etc-pc role="img"/);
    assert.doesNotMatch(View.root.innerHTML, /toward PC|2 H₂O supply electrons|H⁺ in thylakoid lumen/);
    assert.match(View.root.innerHTML, /data-etc-cytochrome role="img"/);
    assert.match(View.root.innerHTML, /Fe-S/);
    assert.match(View.root.innerHTML, /cyt f|>f</);
    assert.match(View.root.innerHTML, /data-etc-qi role="img"/);
    assert.match(View.root.innerHTML, /x="482" y="95" width="108"/);
    assert.match(View.controls.innerHTML, /Run Q cycle · 1\/2/);
    await View.runQCycle();
    assert.equal(View.phase, "await-second-pq");
    assert.equal(View.cycle, 1);
    assert.equal(View.lumenProtons, 2);
    assert.equal(View.qiElectrons, 1);
    assert.equal(View.qiProtons, 1);
    assert.equal(View.fElectrons, 0);
    assert.equal(View.pcTransfers, 1);
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
    assert.equal(View.fElectrons, 0);
    assert.equal(View.pcTransfers, 2);
    assert.equal(View.qiElectrons, 2);
    assert.equal(View.qiProtons, 2);
    assert.match(View.controls.innerHTML, /Recycle Qi PQH₂/);
    assert.match(View.root.innerHTML, /data-etc-qi-bound-electron="1"/);
    assert.match(View.root.innerHTML, /data-etc-qi-bound-proton="1"/);
    await View.runQCycle();
    assert.equal(View.phase, "done");
    assert.equal(View.cycle, 3);
    assert.equal(View.lumenProtons, 6);
    assert.equal(View.fElectrons, 0);
    assert.equal(View.pcTransfers, 3);
    const pcMoves = moves.filter(move => move.node === nodes.get("[data-etc-pc]"));
    assert.deepEqual(pcMoves.map(move => move.dx), [-85, 125, 0, -85, 125, 0, -85, 125, 0]);
    assert.equal(pcMoves[1].fromX, -85);
    assert.equal(pcMoves[1].fromY, -50);
    assert.match(pcMoves[1].html, /data-etc-pc role="img"[^>]*transform="translate\(-85 -50\)"/);
    assert.equal(View.pcNearCytochrome, false);
    assert.ok(moves.filter(move => move.node === nodes.get("[data-etc-pc-electron]")).length === 3);
    assert.equal(View.qiElectrons, 1);
    assert.equal(View.qiProtons, 1);
    assert.ok(moves.some(move => move.node === nodes.get("[data-etc-qi]") && move.dx === -52 && move.dy === 140));
    assert.match(View.root.innerHTML, /data-etc-qi role="img" aria-label="Qi-side PQ, 1 of two electrons loaded"/);
    assert.equal((View.root.innerHTML.match(/data-etc-lumen-proton=/g) ?? []).length, 6);
    assert.equal((View.root.innerHTML.match(/data-etc-water-proton=/g) ?? []).length, 4);
    assert.equal(rotations.length, 3);
    assert.doesNotMatch(View.root.innerHTML, /data-etc-proton="0"/);
    assert.doesNotMatch(View.root.innerHTML, /data-etc-proton="1"/);
    assert.equal(gameState.player.xp, xp);
    assert.equal(ResearchManager.isExperimentCompleted(Catalog.id), false);
    assert.match(View.root.innerHTML, /data-etc-submit/);
    View.answers = { pq_electrons: "one", pq_protons: "stroma", last_carrier: "pc", gradient: "lumen", lumen_total: "ten" };
    View.submit();
    assert.equal(SubmissionManager.getSubmissions(Catalog.id).length, 1);
    assert.equal(gameState.player.xp, xp + 600);
    assert.equal(SubmissionManager.getBestScore(Catalog.id).scorePercent, 80);
    View.result = null;
    View.answers.pq_electrons = "two";
    View.submit();
    assert.equal(SubmissionManager.getSubmissions(Catalog.id).length, 2);
    assert.equal(gameState.player.xp, xp + 600);
    assert.equal(SubmissionManager.getBestScore(Catalog.id).scorePercent, 100);
    assert.ok(SubmissionManager.getStar(Catalog.id));
    assert.match(View.root.innerHTML, /★ Perfect-score star earned/);
    gameState.player.id = "etc-report-test-player";
    gameState.player.name = "ETC Test";
    gameState.player.displayName = "ETCtester";
    gameState.player.profileCreatedAtMs = Date.now();
    gameState.player.nameLockedAtMs = Date.now();
    const report = (await ProgressReportExporter.createReportFile({
        generatedAtMs: Date.UTC(2026, 8, 26), reportId: "etc-report-test"
    })).payload;
    const best = report.progress.research.bestScores.find(entry => entry.activityId === Catalog.id);
    assert.deepEqual([best.scorePoints, best.scoreMaximum, best.isPerfect], [5, 5, true]);
} finally {
    View.move = oldMove;
    View.pause = oldPause;
    View.animateFrames = oldAnimateFrames;
    View.rotateAndDock = oldRotateAndDock;
    Panel.refresh = oldRefresh;
    if (oldStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = oldStorage;
    View.root = null;
    View.controls = null;
    for (const key of Object.keys(gameState)) delete gameState[key];
    Object.assign(gameState, backup);
}

// The donor's visual rotation must use the SVG canvas coordinates, without
// a second CSS transform origin that makes it fly away and then respawn.
assert.doesNotMatch(readFileSync(new URL("../public/css/photosystem-assembly.css", import.meta.url), "utf8"),
    /\.etc-donor\s*\{[^}]*transform-origin/);
const savedRaf = globalThis.requestAnimationFrame;
const savedRoot = View.root;
const savedGeneration = View.generation;
try {
    const transforms = [];
    const started = performance.now();
    let frameCount = 0;
    globalThis.requestAnimationFrame = callback => callback(started + ++frameCount * 500);
    View.root = {};
    View.generation = 4;
    const rotated = await View.rotateAndDock({ setAttribute(key, value) {
        if (key === "transform") transforms.push(value);
    } }, 4);
    assert.equal(rotated, true);
    assert.equal(transforms.at(-1), "translate(0 58) rotate(180 498 285)");
    assert.ok(transforms.every(transform => !transform.includes("translate(498")));
} finally {
    globalThis.requestAnimationFrame = savedRaf;
    View.root = savedRoot;
    View.generation = savedGeneration;
}

console.log("PASS: ETC preview shows four O–H electron replacements, O₂ release, and three PQH₂ deliveries with ten lumen protons.");
