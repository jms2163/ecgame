// --------------------------------------------------
// QuantumAutoCollectorManager.js
// Global, persistent Quantum particle automation
// --------------------------------------------------

import gameState from "./GameState.js";
import GameStateManager
    from "./GameStateManager.js";
import GameStateObserver
    from "./GameStateObserver.js";
import ParticleInventoryManager
    from "./ParticleInventoryManager.js";
import SaveManager from "./SaveManager.js";

const PARTICLE_IDS = Object.freeze([
    "proton",
    "neutron",
    "electron"
]);

const DEFAULT_COLLECTION_INTERVAL_MS = 2000;
const MINIMUM_COLLECTION_INTERVAL_MS = 100;
const SCHEDULER_POLL_INTERVAL_MS = 100;

function createDefaultCollectorState() {
    return {
        unlocked: false,
        enabled: false,
        collectionIntervalMs:
            DEFAULT_COLLECTION_INTERVAL_MS
    };
}

const QuantumAutoCollectorManager = {

    initialized: false,
    schedulerId: null,
    nextCollectionAtMs: new Map(),
    visibleCollectionHandler: null,
    gameStateLoadedHandler: null,

    initialize() {

        ParticleInventoryManager.initialize();
        this.ensureState();
        this.rescheduleAll(Date.now());
        this.startScheduler();
        this.reconcileZoneCompletion();

        if (!this.initialized) {
            this.gameStateLoadedHandler =
                () => {
                    this.ensureState();
                    this.rescheduleAll(Date.now());
                    this.reconcileZoneCompletion();
                };

            GameStateObserver.on(
                "game-state-loaded",
                this.gameStateLoadedHandler
            );

            this.initialized = true;
        }

        return true;

    },

    isParticleType(particleId) {
        return PARTICLE_IDS.includes(
            particleId
        );
    },

    ensureState() {

        gameState.zones ??= {};
        gameState.zones.quantum ??= {
            unlocked: true,
            completed: false,
            state: {}
        };
        gameState.zones.quantum.state ??= {};

        const quantumState =
            gameState.zones.quantum.state;

        if (
            !quantumState.autoCollectors ||
            typeof quantumState.autoCollectors !==
                "object" ||
            Array.isArray(
                quantumState.autoCollectors
            )
        ) {
            quantumState.autoCollectors = {};
        }

        PARTICLE_IDS.forEach(
            particleId => {
                const existing =
                    quantumState.autoCollectors[
                        particleId
                    ];

                if (
                    !existing ||
                    typeof existing !== "object" ||
                    Array.isArray(existing)
                ) {
                    quantumState.autoCollectors[
                        particleId
                    ] =
                        createDefaultCollectorState();
                    return;
                }

                existing.unlocked =
                    Boolean(existing.unlocked);
                existing.enabled =
                    existing.unlocked &&
                    Boolean(existing.enabled);

                if (
                    !Number.isFinite(
                        existing
                            .collectionIntervalMs
                    ) ||
                    existing
                        .collectionIntervalMs <
                        MINIMUM_COLLECTION_INTERVAL_MS
                ) {
                    existing
                        .collectionIntervalMs =
                            DEFAULT_COLLECTION_INTERVAL_MS;
                }

                existing
                    .collectionIntervalMs =
                        Math.round(
                            existing
                                .collectionIntervalMs
                        );
            }
        );

        return quantumState.autoCollectors;

    },

    getCollectorState(particleId) {

        if (!this.isParticleType(particleId)) {
            return null;
        }

        return this.ensureState()[particleId];

    },

    getCollectorStatus(particleId) {

        const collector =
            this.getCollectorState(particleId);

        if (!collector) {
            return null;
        }

        return {
            particleId,
            unlocked: collector.unlocked,
            enabled: collector.enabled,
            collectionIntervalMs:
                collector.collectionIntervalMs,
            nextCollectionAtMs:
                this.nextCollectionAtMs.get(
                    particleId
                ) ?? null
        };

    },

    getStatus() {

        const collectors =
            Object.fromEntries(
                PARTICLE_IDS.map(
                    particleId => [
                        particleId,
                        this.getCollectorStatus(
                            particleId
                        )
                    ]
                )
            );

        const unlockedCount =
            PARTICLE_IDS.filter(
                particleId =>
                    collectors[particleId]
                        .unlocked
            ).length;

        const enabledCount =
            PARTICLE_IDS.filter(
                particleId =>
                    collectors[particleId]
                        .unlocked &&
                    collectors[particleId]
                        .enabled
            ).length;

        return {
            initialized: this.initialized,
            schedulerRunning:
                this.schedulerId !== null,
            defaultCollectionIntervalMs:
                DEFAULT_COLLECTION_INTERVAL_MS,
            unlockedCount,
            enabledCount,
            allUnlocked:
                unlockedCount ===
                PARTICLE_IDS.length,
            allUnlockedEnabled:
                unlockedCount > 0 &&
                enabledCount === unlockedCount,
            collectors
        };

    },

    setVisibleCollectionHandler(handler) {

        this.visibleCollectionHandler =
            typeof handler === "function"
                ? handler
                : null;

        return Boolean(
            this.visibleCollectionHandler
        );

    },

    scheduleNextCollection(
        particleId,
        nowMs = Date.now()
    ) {

        const collector =
            this.getCollectorState(particleId);

        if (!collector?.enabled) {
            this.nextCollectionAtMs.delete(
                particleId
            );
            return null;
        }

        /*
         * AUTOCOLLECTOR REBALANCE POINT:
         * This line controls the delay before a newly
         * activated collector's first harvest and every
         * later harvest. Change the per-particle persisted
         * collectionIntervalMs value through
         * setCollectionIntervalMs() when balancing upgrades.
         */
        const nextAtMs =
            nowMs +
            collector.collectionIntervalMs;

        this.nextCollectionAtMs.set(
            particleId,
            nextAtMs
        );

        return nextAtMs;

    },

    rescheduleAll(nowMs = Date.now()) {

        this.nextCollectionAtMs.clear();

        PARTICLE_IDS.forEach(
            particleId =>
                this.scheduleNextCollection(
                    particleId,
                    nowMs
                )
        );

        return this.getStatus();

    },

    startScheduler() {

        if (this.schedulerId !== null) {
            return true;
        }

        this.schedulerId = setInterval(
            () =>
                this.processDueCollectors(
                    Date.now()
                ),
            SCHEDULER_POLL_INTERVAL_MS
        );

        this.schedulerId?.unref?.();

        return true;

    },

    stopScheduler() {

        if (this.schedulerId !== null) {
            clearInterval(this.schedulerId);
            this.schedulerId = null;
        }

        return true;

    },

    processDueCollectors(
        nowMs = Date.now()
    ) {

        const results = [];

        PARTICLE_IDS.forEach(
            particleId => {
                const collector =
                    this.getCollectorState(
                        particleId
                    );

                if (!collector?.enabled) {
                    this.nextCollectionAtMs
                        .delete(particleId);
                    return;
                }

                const dueAtMs =
                    this.nextCollectionAtMs
                        .get(particleId);

                if (!Number.isFinite(dueAtMs)) {
                    this.scheduleNextCollection(
                        particleId,
                        nowMs
                    );
                    return;
                }

                if (nowMs < dueAtMs) {
                    return;
                }

                results.push(
                    this.collectParticle(
                        particleId
                    )
                );

                this.scheduleNextCollection(
                    particleId,
                    nowMs
                );
            }
        );

        return results;

    },

    collectParticle(particleId) {

        const inventory =
            ParticleInventoryManager
                .getStatus();

        if (
            inventory[particleId] >=
            inventory.capacity
        ) {
            return {
                particleId,
                collected: false,
                source: "autocollector",
                reason: "capacity-reached"
            };
        }

        const visibleResult =
            this.visibleCollectionHandler?.(
                particleId
            );

        if (visibleResult?.handled) {
            return {
                particleId,
                source:
                    "visible-quantum-field",
                ...visibleResult
            };
        }

        const inventoryResult =
            ParticleInventoryManager.addParticle(
                particleId,
                1
            );

        const collected =
            inventoryResult.added === 1;
        const saveSucceeded = collected
            ? SaveManager.save()
            : true;

        if (collected) {
            GameStateObserver.notify(
                "quantum-auto-collector-harvested",
                {
                    particleId,
                    source: "background",
                    saveSucceeded,
                    inventoryResult
                }
            );
        }

        return {
            particleId,
            collected,
            handled: true,
            source: "background",
            reason: inventoryResult.reason,
            saveSucceeded,
            inventoryResult
        };

    },

    setCollectorUnlocked(
        particleId,
        unlocked,
        {
            save = true,
            notify = true
        } = {}
    ) {

        const collector =
            this.getCollectorState(particleId);

        if (
            !collector ||
            typeof unlocked !== "boolean"
        ) {
            return false;
        }

        collector.unlocked = unlocked;

        if (!unlocked) {
            collector.enabled = false;
            this.nextCollectionAtMs.delete(
                particleId
            );
        }

        this.reconcileZoneCompletion();

        const saveSucceeded =
            !save || SaveManager.save();

        if (notify) {
            GameStateObserver.notify(
                "quantum-auto-collector-changed",
                {
                    particleId,
                    reason: unlocked
                        ? "unlocked"
                        : "locked",
                    saveSucceeded,
                    status:
                        this.getCollectorStatus(
                            particleId
                        )
                }
            );
        }

        return saveSucceeded;

    },

    unlockCollector(
        particleId,
        options = {}
    ) {
        return this.setCollectorUnlocked(
            particleId,
            true,
            options
        );
    },

    setCollectorEnabled(
        particleId,
        enabled,
        {
            save = true,
            notify = true,
            nowMs = Date.now()
        } = {}
    ) {

        const collector =
            this.getCollectorState(particleId);

        if (!collector) {
            return {
                changed: false,
                reason: "unknown-particle"
            };
        }

        if (!collector.unlocked) {
            return {
                changed: false,
                reason: "collector-locked",
                status:
                    this.getCollectorStatus(
                        particleId
                    )
            };
        }

        if (typeof enabled !== "boolean") {
            return {
                changed: false,
                reason: "invalid-enabled-state",
                status:
                    this.getCollectorStatus(
                        particleId
                    )
            };
        }

        const changed =
            collector.enabled !== enabled;

        collector.enabled = enabled;

        if (enabled) {
            this.scheduleNextCollection(
                particleId,
                nowMs
            );
        } else {
            this.nextCollectionAtMs.delete(
                particleId
            );
        }

        const saveSucceeded =
            !save || SaveManager.save();

        if (notify) {
            GameStateObserver.notify(
                "quantum-auto-collector-changed",
                {
                    particleId,
                    reason: enabled
                        ? "activated"
                        : "unactivated",
                    saveSucceeded,
                    status:
                        this.getCollectorStatus(
                            particleId
                        )
                }
            );
        }

        return {
            changed,
            enabled,
            reason: enabled
                ? "activated"
                : "unactivated",
            saveSucceeded,
            status:
                this.getCollectorStatus(
                    particleId
                )
        };

    },

    toggleCollector(particleId) {

        const collector =
            this.getCollectorState(particleId);

        if (!collector?.unlocked) {
            return {
                changed: false,
                reason: "collector-locked",
                status:
                    this.getCollectorStatus(
                        particleId
                    )
            };
        }

        return this.setCollectorEnabled(
            particleId,
            !collector.enabled
        );

    },

    setCollectionIntervalMs(
        particleId,
        intervalMs,
        {
            save = true,
            notify = true,
            nowMs = Date.now()
        } = {}
    ) {

        const collector =
            this.getCollectorState(particleId);

        if (
            !collector ||
            !Number.isFinite(intervalMs) ||
            intervalMs <
                MINIMUM_COLLECTION_INTERVAL_MS
        ) {
            return false;
        }

        collector.collectionIntervalMs =
            Math.round(intervalMs);

        if (collector.enabled) {
            this.scheduleNextCollection(
                particleId,
                nowMs
            );
        }

        const saveSucceeded =
            !save || SaveManager.save();

        if (notify) {
            GameStateObserver.notify(
                "quantum-auto-collector-changed",
                {
                    particleId,
                    reason: "rate-changed",
                    saveSucceeded,
                    status:
                        this.getCollectorStatus(
                            particleId
                        )
                }
            );
        }

        return saveSucceeded;

    },

    reconcileZoneCompletion() {

        const allUnlocked =
            PARTICLE_IDS.every(
                particleId =>
                    this.getCollectorState(
                        particleId
                    ).unlocked
            );

        if (
            GameStateManager
                .isZoneCompleted("quantum") !==
            allUnlocked
        ) {
            GameStateManager.setZoneCompleted(
                "quantum",
                allUnlocked
            );
        }

        return allUnlocked;

    }

};

QuantumAutoCollectorManager.PARTICLE_IDS =
    PARTICLE_IDS;
QuantumAutoCollectorManager
    .DEFAULT_COLLECTION_INTERVAL_MS =
        DEFAULT_COLLECTION_INTERVAL_MS;

export default QuantumAutoCollectorManager;
