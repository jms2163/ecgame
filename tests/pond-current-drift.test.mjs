// Run with: node tests/pond-current-drift.test.mjs
// Uses an in-memory save store and a controlled clock.

import assert from "node:assert/strict";
import fs from "node:fs";
import gameState from "../src/app/GameState.js";
import GameStateManager
    from "../src/app/GameStateManager.js";
import GameStateObserver
    from "../src/app/GameStateObserver.js";
import PondCurrentManager, {
    SHIFT_INTERVAL_MS,
    DIRECTION_INTERVAL_MS,
    DIRECTIONS
} from "../src/app/PondCurrentManager.js";

const backup = structuredClone(gameState);
const storage = new Map();
let saveWrites = 0;

globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => {
        saveWrites += 1;
        storage.set(key, String(value));
    },
    removeItem: key => storage.delete(key)
};

try {
    const startedAtMs = 1_000_000;
    const pondState =
        gameState.zones.pond.state;

    pondState.worldSeed = 42;
    pondState.player.anchored = false;
    pondState.world.tiles = {
        "0,0": { biome: "cached-before-drift" }
    };
    pondState.discoveredMicrobiomes = {
        algae_patch: {
            firstDiscoveredAtMs: 10,
            firstPosition: { x: 1, y: 1 },
            discoveryMethod: "manual-movement"
        }
    };
    delete pondState.current;

    let shiftEvents = 0;
    let directionEvents = 0;
    let discoveryEvents = 0;

    GameStateObserver.on(
        "pond-current-shifted",
        () => {
            shiftEvents += 1;
        }
    );
    GameStateObserver.on(
        "pond-current-direction-changed",
        () => {
            directionEvents += 1;
        }
    );
    GameStateObserver.on(
        "microbiome-discovered",
        () => {
            discoveryEvents += 1;
        }
    );

    PondCurrentManager.initialize(startedAtMs);

    assert.equal(saveWrites, 0);
    assert.deepEqual(
        {
            fieldOffsetX:
                pondState.current.fieldOffsetX,
            fieldOffsetY:
                pondState.current.fieldOffsetY,
            lastShiftAtMs:
                pondState.current.lastShiftAtMs,
            lastDirectionChangedAtMs:
                pondState.current
                    .lastDirectionChangedAtMs
        },
        {
            fieldOffsetX: 0,
            fieldOffsetY: 0,
            lastShiftAtMs: startedAtMs,
            lastDirectionChangedAtMs:
                startedAtMs
        },
        "legacy saves must normalize without being written immediately"
    );

    DIRECTIONS.forEach(direction => {
        assert.ok(
            Math.abs(
                Math.hypot(
                    direction.dx,
                    direction.dy
                ) - 1
            ) < 1e-12,
            `${direction.label} must move the field exactly one unit`
        );
    });

    const initialDirection =
        PondCurrentManager.getStatus(
            startedAtMs
        ).direction;

    assert.equal(
        initialDirection.index,
        42 % DIRECTIONS.length,
        "a new current direction must derive from the persistent Pond seed"
    );

    assert.equal(
        PondCurrentManager.processTime(
            startedAtMs +
                SHIFT_INTERVAL_MS - 1
        ).changed,
        false
    );
    assert.equal(shiftEvents, 0);

    const firstShift =
        PondCurrentManager.processTime(
            startedAtMs +
                SHIFT_INTERVAL_MS
        );

    assert.equal(firstShift.shifted, true);
    assert.equal(firstShift.directionChanged, false);
    assert.equal(shiftEvents, 1);
    assert.equal(directionEvents, 0);
    assert.equal(discoveryEvents, 0);
    assert.deepEqual(
        pondState.world.tiles,
        {},
        "a drift step must invalidate only the deterministic tile cache"
    );
    assert.ok(
        Math.abs(
            Math.hypot(
                pondState.current.fieldOffsetX,
                pondState.current.fieldOffsetY
            ) - 1
        ) < 1e-6
    );
    assert.deepEqual(
        pondState.discoveredMicrobiomes,
        {
            algae_patch: {
                firstDiscoveredAtMs: 10,
                firstPosition: { x: 1, y: 1 },
                discoveryMethod:
                    "manual-movement"
            }
        },
        "passive drift must neither add nor consume discoveries"
    );

    const sample =
        PondCurrentManager
            .getFieldSamplePosition(10, 20);

    assert.equal(
        sample.x,
        10 - pondState.current.fieldOffsetX
    );
    assert.equal(
        sample.y,
        20 - pondState.current.fieldOffsetY
    );

    const offsetBeforeAnchoring = {
        x: pondState.current.fieldOffsetX,
        y: pondState.current.fieldOffsetY
    };

    GameStateManager.setPondPlayerAnchored(true);

    const hourlyUpdate =
        PondCurrentManager.processTime(
            startedAtMs +
                DIRECTION_INTERVAL_MS
        );

    assert.equal(
        hourlyUpdate.directionChanged,
        true
    );
    assert.equal(hourlyUpdate.shifted, false);
    assert.notEqual(
        hourlyUpdate.status.direction.index,
        initialDirection.index,
        "an hourly update must select a different direction"
    );
    assert.deepEqual(
        {
            x: pondState.current.fieldOffsetX,
            y: pondState.current.fieldOffsetY
        },
        offsetBeforeAnchoring,
        "anchoring must stop relative field movement"
    );
    assert.equal(directionEvents, 1);
    assert.equal(shiftEvents, 1);

    const anchoredWait =
        PondCurrentManager.processTime(
            startedAtMs +
                DIRECTION_INTERVAL_MS +
                (SHIFT_INTERVAL_MS * 2)
        );

    assert.equal(anchoredWait.shifted, undefined);
    assert.equal(anchoredWait.reason, "anchored");

    GameStateManager.setPondPlayerAnchored(false);

    const justUnanchored =
        PondCurrentManager.processTime(
            startedAtMs +
                DIRECTION_INTERVAL_MS +
                (SHIFT_INTERVAL_MS * 2) +
                1
        );

    assert.equal(justUnanchored.changed, false);
    assert.equal(
        justUnanchored.reason,
        "not-due",
        "unanchoring must start a fresh five-minute interval"
    );

    pondState.current.directionIndex = 1;
    const beforeDiagonal = {
        x: pondState.current.fieldOffsetX,
        y: pondState.current.fieldOffsetY
    };
    const diagonalShift =
        PondCurrentManager.processTime(
            pondState.current.lastShiftAtMs +
                SHIFT_INTERVAL_MS
        );
    const diagonalDelta = {
        x:
            pondState.current.fieldOffsetX -
            beforeDiagonal.x,
        y:
            pondState.current.fieldOffsetY -
            beforeDiagonal.y
    };

    assert.equal(diagonalShift.shifted, true);
    assert.ok(
        Math.abs(
            Math.hypot(
                diagonalDelta.x,
                diagonalDelta.y
            ) - 1
        ) < 1e-6,
        "diagonal drift must not move faster than cardinal drift"
    );

    const offsetBeforeReload = {
        x: pondState.current.fieldOffsetX,
        y: pondState.current.fieldOffsetY
    };
    const reloadAtMs =
        startedAtMs +
        (DIRECTION_INTERVAL_MS * 10);

    PondCurrentManager.beginSession(
        reloadAtMs
    );

    assert.deepEqual(
        {
            x: pondState.current.fieldOffsetX,
            y: pondState.current.fieldOffsetY
        },
        offsetBeforeReload,
        "this milestone performs no offline drift catch-up"
    );
    assert.equal(
        pondState.current.lastShiftAtMs,
        reloadAtMs
    );

    const pondWorldSource = fs.readFileSync(
        new URL(
            "../src/app/PondWorld.js",
            import.meta.url
        ),
        "utf8"
    );
    const gridSource = fs.readFileSync(
        new URL(
            "../src/app/PondGridView.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        pondWorldSource,
        /getFieldSamplePosition/
    );
    assert.match(
        gridSource,
        /["']pond-current-shifted["']/
    );
} finally {
    for (const key of Object.keys(gameState)) {
        delete gameState[key];
    }
    Object.assign(gameState, backup);
}

console.log(
    "PASS: online Pond current shifts the field every five minutes at equal speed, changes direction hourly, pauses while anchored, restarts after unanchoring, and records no passive discoveries."
);
