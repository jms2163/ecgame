// --------------------------------------------------
// PondCurrentManager.js
// Owns Pond-current timing, persistent field offsets, one-step
// offline reconciliation, and passive-arrival hazard protection.
// Anchoring ATP costs belong to a later milestone.
// --------------------------------------------------

import gameState from "./GameState.js";
import GameStateManager
    from "./GameStateManager.js";
import GameStateObserver
    from "./GameStateObserver.js";
import SaveManager from "./SaveManager.js";
import PondWorldGenerator
    from "./PondWorldGenerator.js";
import PondEnvironmentClassifier
    from "./PondEnvironmentClassifier.js";

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
        current.safetyHoldCount =
            Number.isSafeInteger(
                current.safetyHoldCount
            ) && current.safetyHoldCount >= 0
                ? current.safetyHoldCount
                : 0;
        current.lastSafetyHoldAtMs =
            Number.isFinite(
                current.lastSafetyHoldAtMs
            )
                ? current.lastSafetyHoldAtMs
                : null;
        current.lastBlockedBiome =
            typeof current.lastBlockedBiome ===
                "string"
                ? current.lastBlockedBiome
                : null;
        current.lastBlockedClassification =
            typeof current
                .lastBlockedClassification === "string"
                ? current
                    .lastBlockedClassification
                : null;

        return current;
    },

    beginSession(nowMs = Date.now()) {
        const existingCurrent =
            gameState.zones?.pond?.state?.current;
        const hasPersistedCurrentClock = Boolean(
            existingCurrent &&
            typeof existingCurrent === "object" &&
            Number.isFinite(
                existingCurrent.lastShiftAtMs
            ) &&
            Number.isFinite(
                existingCurrent
                    .lastDirectionChangedAtMs
            )
        );
        const current = this.ensureState(nowMs);
        this.wasAnchored =
            GameStateManager.isPondPlayerAnchored();
        this.tickAccumulatorSec = 0;

        if (!hasPersistedCurrentClock) {
            // New and legacy saves begin with no surprise movement.
            current.lastShiftAtMs = nowMs;
            current.lastDirectionChangedAtMs = nowMs;

            return {
                changed: false,
                reason: "new-current-clock",
                status: this.getStatus(nowMs)
            };
        }

        return this.reconcileOfflineSession(nowMs);
    },

    reconcileOfflineSession(nowMs = Date.now()) {
        if (!Number.isFinite(nowMs)) {
            return {
                changed: false,
                reason: "invalid-time"
            };
        }

        const current = this.ensureState(nowMs);
        const pondState = gameState.zones.pond.state;
        const world = pondState.world;
        const previousCurrent = structuredClone(current);
        const previousTiles = world?.tiles;
        const anchored =
            GameStateManager.isPondPlayerAnchored();
        let directionChanged = false;
        let shifted = false;
        let safetyBlocked = false;
        let blockedDestination = null;

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
            directionChanged = true;
        }

        // A reload represents at most one current step. We never
        // simulate every five-minute interval missed while offline.
        if (!anchored) {
            const attempt =
                this.attemptPassiveShift(
                    current,
                    nowMs
                );

            shifted = attempt.shifted;
            safetyBlocked =
                attempt.safetyBlocked;
            blockedDestination =
                safetyBlocked
                    ? attempt.destination
                    : null;

            if (shifted && world) {
                world.tiles = {};
            }
        }

        // Every loaded session starts fresh online timers. Anchored
        // players retain their relative surroundings during absence.
        current.lastShiftAtMs = nowMs;
        current.lastDirectionChangedAtMs = nowMs;
        this.wasAnchored = anchored;

        if (
            !directionChanged &&
            !shifted &&
            !safetyBlocked
        ) {
            return {
                changed: false,
                reason: "anchored-offline",
                offlineReconciled: true,
                status: this.getStatus(nowMs)
            };
        }

        if (!SaveManager.save({
            reason: "pond-current-offline-reconcile"
        })) {
            pondState.current = previousCurrent;

            if (world) {
                world.tiles = previousTiles;
            }

            return {
                changed: false,
                reason: "save-failed",
                offlineReconciled: false,
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

        if (safetyBlocked) {
            GameStateObserver.notify(
                "pond-current-safety-blocked",
                {
                    source: "offline-reconcile",
                    destination:
                        blockedDestination,
                    status
                }
            );
        }

        GameStateObserver.notify(
            "pond-current-offline-reconciled",
            {
                directionChanged,
                shifted,
                safetyBlocked,
                status
            }
        );

        return {
            changed: true,
            reason: safetyBlocked
                ? "safety-hold"
                : "offline-reconciled",
            directionChanged,
            shifted,
            safetyBlocked,
            blockedDestination,
            offlineReconciled: true,
            status
        };
    },

    initialize(nowMs = Date.now()) {
        if (this.initialized) {
            return true;
        }

        this.beginSession(nowMs);

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

    evaluatePassiveDestination(
        fieldOffsetX,
        fieldOffsetY
    ) {
        const position =
            GameStateManager.getPondPosition();

        if (
            !Number.isFinite(position?.x) ||
            !Number.isFinite(position?.y)
        ) {
            return {
                safe: false,
                biome: null,
                classification: {
                    code: "POSITION_UNAVAILABLE",
                    label: "Position Unavailable"
                }
            };
        }

        PondWorldGenerator.configure(
            this.ensureWorldSeed()
        );

        const generated =
            PondWorldGenerator.generate(
                position.x - fieldOffsetX,
                position.y - fieldOffsetY
            );
        const safety =
            PondEnvironmentClassifier
                .isPassiveArrivalSafe({
                    physics:
                        generated.environment
                            .physics,
                    chemistry: {
                        signals:
                            generated.environment
                                .signals
                    }
                });

        return {
            ...safety,
            biome:
                generated.dominantMicrobiome
        };
    },

    attemptPassiveShift(current, nowMs) {
        const direction =
            this.getDirection(
                current.directionIndex
            );
        const candidateOffsetX = roundOffset(
            current.fieldOffsetX + direction.dx
        );
        const candidateOffsetY = roundOffset(
            current.fieldOffsetY + direction.dy
        );
        const destination =
            this.evaluatePassiveDestination(
                candidateOffsetX,
                candidateOffsetY
            );

        if (!destination.safe) {
            current.safetyHoldCount += 1;
            current.lastSafetyHoldAtMs = nowMs;
            current.lastBlockedBiome =
                destination.biome;
            current.lastBlockedClassification =
                destination.classification.code;

            return {
                shifted: false,
                safetyBlocked: true,
                destination
            };
        }

        current.fieldOffsetX = candidateOffsetX;
        current.fieldOffsetY = candidateOffsetY;

        return {
            shifted: true,
            safetyBlocked: false,
            destination
        };
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
        let safetyBlocked = false;
        let blockedDestination = null;

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
            const attempt =
                this.attemptPassiveShift(
                    current,
                    nowMs
                );

            current.lastShiftAtMs = nowMs;
            shifted = attempt.shifted;
            safetyBlocked =
                attempt.safetyBlocked;
            blockedDestination =
                safetyBlocked
                    ? attempt.destination
                    : null;

            if (shifted && world) {
                world.tiles = {};
            }
        }

        if (
            !directionChanged &&
            !shifted &&
            !safetyBlocked
        ) {
            return {
                changed: false,
                reason: anchored
                    ? "anchored"
                    : "not-due",
                status: this.getStatus(nowMs)
            };
        }

        if (!SaveManager.save({
            reason: safetyBlocked
                ? "pond-current-safety-hold"
                : shifted
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

        if (safetyBlocked) {
            GameStateObserver.notify(
                "pond-current-safety-blocked",
                {
                    source: "online-drift",
                    destination:
                        blockedDestination,
                    status
                }
            );
        }

        return {
            changed: true,
            reason: safetyBlocked
                ? "safety-hold"
                : shifted
                    ? "shifted"
                    : "direction-changed",
            directionChanged,
            shifted,
            safetyBlocked,
            blockedDestination,
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
            safetyHoldCount:
                current.safetyHoldCount,
            lastSafetyHoldAtMs:
                current.lastSafetyHoldAtMs,
            lastBlockedBiome:
                current.lastBlockedBiome,
            lastBlockedClassification:
                current.lastBlockedClassification,
            safetyHoldActive:
                Number.isFinite(
                    current.lastSafetyHoldAtMs
                ) &&
                current.lastSafetyHoldAtMs ===
                    current.lastShiftAtMs,
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
