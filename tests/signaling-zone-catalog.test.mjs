import assert from 'node:assert/strict';
import fs from 'node:fs';
import ZoneCatalog from '../src/app/ZoneCatalog.js';
import ZoneStatusResolver from '../src/app/ZoneStatusResolver.js';
import gameState from '../src/app/GameState.js';

const definitions = ZoneCatalog.getAll();
const ids = definitions.map(definition => definition.id);
const signalingIndex = ids.indexOf('signaling');

assert.ok(signalingIndex > ids.indexOf('polymerizer'));
assert.ok(signalingIndex < ids.indexOf('metabolism'));

const signaling = ZoneCatalog.get('signaling');
assert.equal(signaling.label, 'Signaling');
assert.equal(signaling.releaseState, ZoneCatalog.RELEASE_STATE.COMING_SOON);

const status = ZoneStatusResolver.getStatus('signaling');
assert.equal(status.status, ZoneStatusResolver.STATUS.COMING_SOON);
assert.equal(status.label, 'Coming Soon');
assert.equal(status.interactive, false);

const zoneManagerSource = fs.readFileSync(
    new URL('../src/app/ZoneManager.js', import.meta.url),
    'utf8'
);
assert.doesNotMatch(zoneManagerSource, /["']signaling["']\s*,\s*\{/,
    'the placeholder must not register an active zone module');
assert.equal(Object.hasOwn(gameState.zones, 'signaling'), false,
    'the placeholder must not add persistent signaling state');

console.log('PASS: Signaling appears after Polymerizer and before Metabolism as a noninteractive Coming Soon navigation tab with no zone module or saved state.');
