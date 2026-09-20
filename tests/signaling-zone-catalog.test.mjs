import assert from 'node:assert/strict';
import fs from 'node:fs';
import ZoneCatalog from '../src/app/ZoneCatalog.js';
import ZoneStatusResolver from '../src/app/ZoneStatusResolver.js';
import gameState from '../src/app/GameState.js';
import testGameState from '../src/app/TestGameState.js';
import SignalingManager from '../src/app/SignalingManager.js';

let saveWrites = 0;
globalThis.localStorage = {
    getItem() { return null; },
    setItem() { saveWrites += 1; },
    removeItem() {}
};

const definitions = ZoneCatalog.getAll();
const ids = definitions.map(definition => definition.id);
const signalingIndex = ids.indexOf('signaling');

assert.ok(signalingIndex > ids.indexOf('polymerizer'));
assert.ok(signalingIndex < ids.indexOf('metabolism'));

const signaling = ZoneCatalog.get('signaling');
assert.equal(signaling.label, 'Signaling');
assert.equal(signaling.releaseState, ZoneCatalog.RELEASE_STATE.PLAYABLE);

const status = ZoneStatusResolver.getStatus('signaling');
assert.equal(status.status, ZoneStatusResolver.STATUS.LOCKED);
assert.equal(status.label, 'Locked');
assert.equal(status.interactive, false);
assert.match(status.message, /Bacterial Bloom/);

const zoneManagerSource = fs.readFileSync(
    new URL('../src/app/ZoneManager.js', import.meta.url),
    'utf8'
);
assert.match(zoneManagerSource, /["']signaling["']\s*,\s*\{/,
    'the console-locked foundation must register a zone module');
assert.deepEqual(gameState.zones.signaling, {
    unlocked: false,
    completed: false,
    state: {}
});
assert.deepEqual(testGameState.zones.signaling, {
    unlocked: false,
    state: {}
});

// Existing saves can omit Signaling. Initialization repairs only the generic
// zone envelope and does not invent pathway progress or write a save.
delete gameState.zones.signaling;
SignalingManager.initialize();
assert.deepEqual(gameState.zones.signaling, {
    unlocked: false,
    completed: false,
    state: {}
});
assert.equal(saveWrites, 0);
assert.deepEqual(
    SignalingManager.getStatus().state,
    {}
);

const uiSource = fs.readFileSync(
    new URL('../src/app/SignalingUI.js', import.meta.url),
    'utf8'
);
const indexSource = fs.readFileSync(
    new URL('../index.html', import.meta.url),
    'utf8'
);
const bootstrapSource = fs.readFileSync(
    new URL('../src/app/Bootstrap.js', import.meta.url),
    'utf8'
);
assert.match(uiSource, /Extracellular Signal/);
assert.match(uiSource, /Second Messengers/);
assert.match(uiSource, /cAMP and cGMP activities remain locked/);
assert.match(uiSource, /The encounter is recorded/);
assert.match(indexSource, /public\/css\/signaling\.css/);
assert.match(
    bootstrapSource,
    /SignalingManager\.initialize\(\)/,
    'bootstrap must restore the Signaling envelope after loading legacy saves'
);
assert.ok(
    bootstrapSource.indexOf('SaveManager.load()') <
        bootstrapSource.indexOf('SignalingManager.initialize()'),
    'Signaling normalization must occur after the saved game replaces defaults'
);

console.log('PASS: Signaling is a quest-locked playable tab with an empty save-compatible state and static pathway foundation shell.');
