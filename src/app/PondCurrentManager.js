// --------------------------------------------------
// PondCurrentManager.js
// Owns online Pond-current timing and persistent field offsets.
// Offline reconciliation, passive-hazard protection, and anchoring
// ATP costs belong to later milestones.
// --------------------------------------------------

import gameState from "./GameState.js";
import GameStateManager
    from "./GameStateManager.js";
import GameStateObserver
    from "./GameStateObserver.js";
import SaveManager from "./SaveManager.js";

const SHIFT_INTERVAL_MS = 5 * 60 * 1000;
const DIRECTION_INTERVAL_MS = 60 * 60 * 1000;
const TICK_CHECK_INTERVAL_SEC = 1;
const DIAGONAL_COMPONENT = Math.SQRT1_2;

const DIRECTIONS = Object.freeze([
    Object.freeze({ index: 0, label: "N", degrees: 0, dx: 0, dy: -1 }),
    Object.freeze({ index: 1, label: "NE", degrees: 45, dx: DIAGONAL_COMPONENT, dy: -DIAGONAL_COMPONENT }),
    Object.freeze({ index: 2, label: "E", degrees: 90, dx: 1, dy: 0 }),
    Object.freeze({ index: 3, label: "SE", degrees: 135, dx: DIAGONAL_COMPONENT, dy: DIAGONAL_COMPONENT }),
    Object.freeze({ index: 4, label: "S", degrees: 180, dx: 0, dy: 1 }),
    Object.freeze({ index: 5, label: "SW", degrees: 225, dx: -DIAGONAL_COMPONENT, dy: DIAGONAL_COMPONENT }),
    Object.freeze({ index: 6, label: "W", degrees: 270, dx: -1, dy: 0 }),
    Object.freeze({ index: 7, label: "NW", degrees: 315, dx: -DIAGONAL_COMPONENT, dy: -DIAGONAL_COMPONENT })
]);

function safeTimestamp(value, fallback) {
    return Number.isFinite(value) && value >= 0
        ? value
        : fallback;
}

function safeOffset(value) {
    return Number.isFinite(value)
        ? value
        : 0;
}

function roundOffset(value) {
    return Math.round(value * 1e6) / 1e6;
}

function mixDirectionSeed(seed, directionChangeCount) {
    let mixed = seed >>> 0;

    mixed ^= Math.imul(
        (directionChangeCount + 1) | 0,
        0x9e3779b1
    );
    mixed ^= mixed >>> 16;
    mixed = Math.imul(mixed, 0x7feb352d);
    mixed ^= mixed >>> 15;

    return mixed >>> 0;
}

const PondCurrentManager = {

    initialized: false,
    tickAccumulatorSec: 0,
    wasAnchored: false,
    gameTickHandler: null,
    gameStateLoadedHandler: null,

    ensureWorldSeed() {
        let seed =
            GameStateManager.getPondWorldSeed();

        if (!Number.isSafeInteger(seed)) {
            seed = Math.floor(
                Math.random() * 0x100000000
            );
            GameStateManager.setPondWorldSeed(seed);
        }

        return seed >>> 0;
    },

    ensureState(nowMs = Date.now()) {
        gameState.zones ??= {};
        gameState.zones.pond ??= {
            unlocked: true,
            completed: false,
            state: {}
        };
        gameState.zones.pond.state ??= {};

        const pondState =
            gameState.zones.pond.state;

        if (
            !pondState.current ||
            typeof pondState.current !== "object" ||
            Array.isArray(pondState.current)
        ) {
            pondState.current = {};
        }

        const current = pondState.current;
        const seed = this.ensureWorldSeed();

        current.fieldOffsetX =
            safeOffset(current.fieldOffsetX);
        current.fieldOffsetY =
            safeOffset(current.fieldOffsetY);
        current.directionChangeCount =
            Number.isSafeInteger(current.directionChangeCount) &&
            current.directionChangeCount >= 0
                ? current.directionChangeCount
                : 0;
        current.directionIndex =
            Number.isSafeInteger(current.directionIndex) &&
            current.directionIndex >= 0 &&
            current.directionIndex < DIRECTIONS.length
                ? current.directionIndex
                : seed % DIRECTIONS.length;
        current.lastShiftAtMs =
            safeTimestamp(current.lastShiftAtMs, nowMs);
        current.lastDirectionChangedAtMs =
            safeTimestamp(
                current.lastDirectionChangedAtMs,
                nowMs
            );

        return current;
    },

    beginSession(nowMs = Date.now()) {
        const current = this.ensureState(nowMs);

        // Timers deliberately restart on page load. Offline
        // catch-up is deferred to its own safety milestone.
        current.lastShiftAtMs = nowMs;
        current.lastDirectionChangedAtMs = nowMs;
        this.wasAnchored =
            GameStateManager.isPondPlayerAnchored();
        this.tickAccumulatorSec = 0;

        return current;
    },

    initialize(nowMs = Date.now()) {
        this.beginSession(nowMs);

        if (this.initialized) {
            return true;
        }

        this.gameTickHandler = event => {
            const deltaSec =
                Number(event?.deltaSec) || 0;

            this.tickAccumulatorSec +=
                Math.max(0, deltaSec);

            if (
                this.tickAccumulatorSec <
                    TICK_CHECK_INTERVAL_SEC
            ) {
                return;
            }

            this.tickAccumulatorSec = 0;
            this.processTime(Date.now());
        };

        this.gameStateLoadedHandler = () => {
            this.beginSession(Date.now());
        };

        GameStateObserver.on(
            "game-tick",
            this.gameTickHandler
        );
        GameStateObserver.on(
            "game-state-loaded",
            this.gameStateLoadedHandler
        );

        this.initialized = true;
        return true;
    },

    getDirection(directionIndex) {
        return DIRECTIONS[directionIndex] ??
            DIRECTIONS[0];
    },

    chooseNextDirection(
        currentDirectionIndex,
        directionChangeCount,
        seed
    ) {
        const alternatives = DIRECTIONS.filter(
            direction =>
                direction.index !==
                    currentDirectionIndex
        );
        const mixed = mixDirectionSeed(
            seed,
            directionChangeCount
        );

        return alternatives[
            mixed % alternatives.length
        ];
    },

    getFieldSamplePosition(x, y) {
        const current = this.ensureState();

        return {
            x: x - current.fieldOffsetX,
            y: y - current.fieldOffsetY
        };
    },

    processTime(nowMs = Date.now()) {
        if (!Number.isFinite(nowMs)) {
            return {
                changed: false,
                reason: "invalid-time"
            };
        }

        const current = this.ensureState(nowMs);
        const pondState =
            gameState.zones.pond.state;
        const world = pondState.world;
        const previousCurrent =
            structuredClone(current);
        const previousTiles = world?.tiles;
        const anchored =
            GameStateManager.isPondPlayerAnchored();
        let directionChanged = false;
        let shifted = false;

        if (
            nowMs - current.lastDirectionChangedAtMs >=
                DIRECTION_INTERVAL_MS
        ) {
            const nextDirection =
                this.chooseNextDirection(
                    current.directionIndex,
                    current.directionChangeCount,
                    this.ensureWorldSeed()
                );

            current.directionIndex =
                nextDirection.index;
            current.directionChangeCount += 1;
            current.lastDirectionChangedAtMs = nowMs;
            directionChanged = true;
        }

        if (anchored !== this.wasAnchored) {
            // Neither anchoring nor unanchoring carries a backlog.
            current.lastShiftAtMs = nowMs;
            this.wasAnchored = anchored;
        }

        if (
            !anchored &&
            nowMs - current.lastShiftAtMs >=
                SHIFT_INTERVAL_MS
        ) {
            const direction =
                this.getDirection(current.directionIndex);

            current.fieldOffsetX = roundOffset(
                current.fieldOffsetX + direction.dx
            );
            current.fieldOffsetY = roundOffset(
                current.fieldOffsetY + direction.dy
            );
            current.lastShiftAtMs = nowMs;
            shifted = true;

            if (world) {
                world.tiles = {};
            }
        }

        if (!directionChanged && !shifted) {
            return {
                changed: false,
                reason: anchored
                    ? "anchored"
                    : "not-due",
                status: this.getStatus(nowMs)
            };
        }

        if (!SaveManager.save({
            reason: shifted
                ? "pond-current-shift"
                : "pond-current-direction"
        })) {
            pondState.current = previousCurrent;

            if (world) {
                world.tiles = previousTiles;
            }

            return {
                changed: false,
                reason: "save-failed",
                status: this.getStatus(nowMs)
            };
        }

        const status = this.getStatus(nowMs);

        if (directionChanged) {
            GameStateObserver.notify(
                "pond-current-direction-changed",
                status
            );
        }

        if (shifted) {
            GameStateObserver.notify(
                "pond-current-shifted",
                status
            );
        }

        return {
            changed: true,
            directionChanged,
            shifted,
            status
        };
    },

    getStatus(nowMs = Date.now()) {
        const current = this.ensureState(nowMs);
        const direction =
            this.getDirection(current.directionIndex);
        const anchored =
            GameStateManager.isPondPlayerAnchored();

        return {
            fieldOffsetX: current.fieldOffsetX,
            fieldOffsetY: current.fieldOffsetY,
            direction: { ...direction },
            directionChangeCount:
                current.directionChangeCount,
            lastShiftAtMs: current.lastShiftAtMs,
            lastDirectionChangedAtMs:
                current.lastDirectionChangedAtMs,
            shiftIntervalMs: SHIFT_INTERVAL_MS,
            directionIntervalMs:
                DIRECTION_INTERVAL_MS,
            millisecondsUntilShift:
                anchored
                    ? null
                    : Math.max(
                        0,
                        SHIFT_INTERVAL_MS -
                        (nowMs - current.lastShiftAtMs)
                    ),
            millisecondsUntilDirectionChange:
                Math.max(
                    0,
                    DIRECTION_INTERVAL_MS -
                    (
                        nowMs -
                        current.lastDirectionChangedAtMs
                    )
                ),
            anchored,
            relativeDriftActive: !anchored
        };
    }

};

export {
    SHIFT_INTERVAL_MS,
    DIRECTION_INTERVAL_MS,
    DIRECTIONS,
    mixDirectionSeed
};

export default PondCurrentManager;
