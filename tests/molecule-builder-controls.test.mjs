import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

// Stub WebGL objects so the real view's camera and animation behavior can run
// under Node without a GPU or the browser-only Three.js CDN import.
class Vector {}
class Group {
    constructor() { this.rotation = { y: 0, z: 0 }; }
    add() {}
}
globalThis.__moleculeControlsThree = {
    Vector3: Vector, Vector2: Vector, Plane: Vector, Raycaster: Vector, Group,
    MathUtils: { clamp: (value, min, max) => Math.min(max, Math.max(min, value)) }
};
const source = (await readFile(new URL('../src/app/MoleculeBuilderView.js', import.meta.url), 'utf8'))
    .replace(/import \* as THREE from\s*"[^"]+";/,
        'const THREE = globalThis.__moleculeControlsThree;');
const { default: view } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('zoom survives assembly progress and completion; a different molecule fits anew', () => {
    view.initialized = true;
    view.scene = { add() {} };
    view.camera = { position: { z: 12 } };
    view.currentDefinition = null;
    view.clearScene = () => { view.moleculeGroup = null; };
    view.normalizeAtoms = () => [];
    let fits = 0;
    view.fitCamera = () => { fits++; view.camera.position.z = 8; };
    const molecule = { id: 'first', atoms: [{ type: 'C' }], bonds: [] };
    assert.equal(view.loadAssembly(molecule), true);
    view.zoom(-1);
    assert.equal(view.camera.position.z, 7);
    view.loadAssembly(molecule, [0]);
    assert.equal(view.camera.position.z, 7);
    view.showCompleted(molecule);
    assert.equal(view.camera.position.z, 7);
    assert.equal(fits, 1);
    view.loadAssembly({ ...molecule, id: 'second' });
    assert.equal(view.camera.position.z, 8);
    assert.equal(fits, 2);
});

test('pause stops automatic rotation, still renders and allows manual rotation, then resumes', () => {
    let frame;
    let renders = 0;
    globalThis.requestAnimationFrame = callback => { frame = callback; return 1; };
    globalThis.cancelAnimationFrame = () => {};
    view.renderer = { render() { renders++; } };
    view.active = true;
    view.analysisMode = null;
    view.rotationPaused = false;
    view.startAnimation();
    frame(0);
    frame(50);
    const initial = view.moleculeGroup.rotation.y;
    assert.ok(initial > 0);
    assert.equal(view.toggleRotation(), true);
    frame(100);
    assert.equal(view.moleculeGroup.rotation.y, initial);
    view.rotate(0.25);
    assert.equal(view.moleculeGroup.rotation.y, initial + 0.25);
    assert.equal(view.toggleRotation(), false);
    frame(150);
    assert.ok(view.moleculeGroup.rotation.y > initial + 0.25);
    assert.equal(renders, 4);

    view.analysisMode = 'dipole';
    view.dipoleRotationActive = true;
    frame(200);
    const dipoleRotation = view.moleculeGroup.rotation.z;
    assert.ok(dipoleRotation < 0);
    view.toggleRotation();
    frame(250);
    assert.equal(view.moleculeGroup.rotation.z, dipoleRotation);
    view.stopAnimation();
    delete globalThis.requestAnimationFrame;
    delete globalThis.cancelAnimationFrame;
});
