// --------------------------------------------------
// RewardRegistry.js
// Transactional reward application for QuestManager
// --------------------------------------------------

import GameStateManager
    from "./GameStateManager.js";
import ParticleInventoryManager
    from "./ParticleInventoryManager.js";
import QuantumAutoCollectorManager
    from "./QuantumAutoCollectorManager.js";
import XPManager from "./XPManager.js";
import SPManager from "./SPManager.js";
import SynthesisPointManager
    from "./SynthesisPointManager.js";

const handlers = new Map();

function hasRewardValue(value) {

    if (
        value === null ||
        value === undefined ||
        value === false ||
        value === 0 ||
        value === ""
    ) {
        return false;
    }

    if (Array.isArray(value)) {
        return value.length > 0;
    }

    return true;

}

const RewardRegistry = {

    register(key, handler) {

        if (
            typeof key !== "string" ||
            key.trim() === ""
        ) {
            throw new Error(
                "RewardRegistry: reward key must be a non-empty string"
            );
        }

        if (
            !handler ||
            typeof handler.apply !==
                "function" ||
            typeof handler.revert !==
                "function"
        ) {
            throw new Error(
                `RewardRegistry: "${key}" requires apply and revert functions`
            );
        }

        handlers.set(
            key,
            Object.freeze({
                ...handler
            })
        );

        return true;

    },

    has(key) {
        return handlers.has(key);
    },

    get(key) {
        return handlers.get(key) ?? null;
    },

    getRegisteredKeys() {
        return [...handlers.keys()];
    },

    applyAll(rewards = {}) {

        const applied = [];

        try {
            Object.entries(rewards)
                .forEach(([key, value]) => {
                    if (!hasRewardValue(value)) {
                        return;
                    }

                    const handler =
                        this.get(key);

                    if (!handler) {
                        throw new Error(
                            `RewardRegistry: no handler is registered for "${key}"`
                        );
                    }

                    const application =
                        handler.apply(value);

                    applied.push({
                        key,
                        handler,
                        snapshot:
                            application?.snapshot,
                        result:
                            application?.result ??
                            null
                    });
                });

            return applied;

        } catch (error) {
            this.revertAll(applied);
            throw error;
        }

    },

    revertAll(applied = []) {

        [...applied]
            .reverse()
            .forEach(application => {
                application.handler.revert(
                    application.snapshot
                );
            });

        return true;

    },

    resultsByKey(applied = []) {
        return Object.fromEntries(
            applied.map(application => [
                application.key,
                application.result
            ])
        );
    }

};

// --------------------------------------------------
// Experience points
// --------------------------------------------------

RewardRegistry.register("xp", {
    apply(amount) {
        const previousXP =
            XPManager.getXP();
        const updatedXP =
            XPManager.addXP(amount);

        if (updatedXP === false) {
            throw new Error(
                "RewardRegistry: XP reward was rejected"
            );
        }

        return {
            snapshot: { previousXP },
            result: {
                awarded: amount,
                updatedXP
            }
        };
    },

    revert({ previousXP }) {
        XPManager.setXP(previousXP);
    }
});

// --------------------------------------------------
// Skill points
// --------------------------------------------------

RewardRegistry.register("sp", {
    apply(amount) {
        const previousSP =
            SPManager.getSP();
        const updatedSP =
            SPManager.addSP(amount);

        if (updatedSP === false) {
            throw new Error(
                "RewardRegistry: SP reward was rejected"
            );
        }

        return {
            snapshot: { previousSP },
            result: {
                awarded: amount,
                updatedSP
            }
        };
    },

    revert({ previousSP }) {
        SPManager.setSP(previousSP);
    }
});

// --------------------------------------------------
// Synthesis points
// --------------------------------------------------

RewardRegistry.register(
    "synthesisPoints",
    {
        apply(amount) {

            const previousStatus =
                SynthesisPointManager
                    .getStatus();

            const updatedPoints =
                SynthesisPointManager
                    .addPoints(
                        amount,
                        "quest-reward"
                    );

            if (updatedPoints === false) {
                throw new Error(
                    "RewardRegistry: Synthesis Point reward was rejected"
                );
            }

            return {
                snapshot: {
                    previousStatus
                },
                result: {
                    awarded: amount,
                    updatedPoints
                }
            };

        },

        revert({ previousStatus }) {

            SynthesisPointManager
                .restoreStatus(
                    previousStatus
                );

        }
    }
);



// --------------------------------------------------
// Per-particle storage capacity
// --------------------------------------------------

RewardRegistry.register(
    "particleCapacity",
    {
        apply(amount) {
            const previousCapacity =
                ParticleInventoryManager
                    .getStatus()
                    .capacity;
            const updatedCapacity =
                ParticleInventoryManager
                    .increaseCapacity(
                        amount
                    );

            if (updatedCapacity === false) {
                throw new Error(
                    "RewardRegistry: particle-capacity reward was rejected"
                );
            }

            return {
                snapshot: {
                    previousCapacity
                },
                result: {
                    added: amount,
                    updatedCapacity
                }
            };
        },

        revert({ previousCapacity }) {
            ParticleInventoryManager
                .setCapacity(
                    previousCapacity
                );
        }
    }
);

// --------------------------------------------------
// Zone unlocks
// --------------------------------------------------

RewardRegistry.register(
    "zoneUnlocks",
    {
        apply(zoneIds) {
            const previous =
                Object.fromEntries(
                    zoneIds.map(zoneId => [
                        zoneId,
                        GameStateManager
                            .isZoneUnlocked(
                                zoneId
                            )
                    ])
                );

            try {
                zoneIds.forEach(zoneId => {
                    if (
                        !GameStateManager
                            .setZoneUnlocked(
                                zoneId,
                                true
                            )
                    ) {
                        throw new Error(
                            `RewardRegistry: zone unlock was rejected for "${zoneId}"`
                        );
                    }
                });
            } catch (error) {
                Object.entries(previous)
                    .forEach(
                        ([zoneId, unlocked]) =>
                            GameStateManager
                                .setZoneUnlocked(
                                    zoneId,
                                    unlocked
                                )
                    );
                throw error;
            }

            return {
                snapshot: { previous },
                result: {
                    unlocked: [...zoneIds]
                }
            };
        },

        revert({ previous }) {
            Object.entries(previous)
                .forEach(
                    ([zoneId, unlocked]) =>
                        GameStateManager
                            .setZoneUnlocked(
                                zoneId,
                                unlocked
                            )
                );
        }
    }
);

// --------------------------------------------------
// Quantum autocollector unlocks
// --------------------------------------------------

RewardRegistry.register(
    "collectorUnlocks",
    {
        apply(particleIds) {
            const previous =
                Object.fromEntries(
                    particleIds.map(
                        particleId => [
                            particleId,
                            QuantumAutoCollectorManager
                                .getCollectorStatus(
                                    particleId
                                )
                        ]
                    )
                );

            try {
                particleIds.forEach(
                    particleId => {
                        if (
                            !QuantumAutoCollectorManager
                                .unlockCollector(
                                    particleId,
                                    {
                                        save: false,
                                        notify: false
                                    }
                                )
                        ) {
                            throw new Error(
                                `RewardRegistry: collector unlock was rejected for "${particleId}"`
                            );
                        }
                    }
                );
            } catch (error) {
                this.revert({ previous });
                throw error;
            }

            return {
                snapshot: { previous },
                result: {
                    unlocked: [
                        ...particleIds
                    ]
                }
            };
        },

        revert({ previous }) {
            Object.entries(previous)
                .forEach(
                    ([particleId, status]) => {
                        QuantumAutoCollectorManager
                            .setCollectorUnlocked(
                                particleId,
                                status.unlocked,
                                {
                                    save: false,
                                    notify: false
                                }
                            );

                        if (!status.unlocked) {
                            return;
                        }

                        QuantumAutoCollectorManager
                            .setCollectionIntervalMs(
                                particleId,
                                status
                                    .collectionIntervalMs,
                                {
                                    save: false,
                                    notify: false
                                }
                            );
                        QuantumAutoCollectorManager
                            .setCollectorEnabled(
                                particleId,
                                status.enabled,
                                {
                                    save: false,
                                    notify: false
                                }
                            );
                    }
                );

            QuantumAutoCollectorManager
                .reconcileZoneCompletion();
        }
    }
);

// --------------------------------------------------
// Feature unlocks (e.g., atom_lab, isotope_mode, sandbox_mode)
// --------------------------------------------------

RewardRegistry.register(
    "featureUnlocks",
    {
        apply(featureIds) {
            const list =
                Array.isArray(featureIds)
                    ? featureIds
                    : [featureIds];

            const previous =
                Object.fromEntries(
                    list.map(featureId => [
                        featureId,
                        GameStateManager
                            .hasFeature(
                                featureId
                            )
                    ])
                );

            try {
                list.forEach(
                    featureId => {
                        const success =
                            GameStateManager
                                .unlockFeature(
                                    featureId
                                );

                        if (success === false) {
                            throw new Error(
                                `RewardRegistry: feature unlock was rejected for "${featureId}"`
                            );
                        }
                    }
                );
            } catch (error) {
                this.revert({ previous });
                throw error;
            }

            return {
                snapshot: { previous },
                result: {
                    unlocked: [...list]
                }
            };
        },

        revert({ previous }) {
            Object.entries(previous)
                .forEach(
                    ([featureId, wasUnlocked]) => {
                        if (wasUnlocked) {
                            GameStateManager
                                .unlockFeature(
                                    featureId
                                );
                        } else if (
                            GameStateManager
                                .lockFeature
                        ) {
                            GameStateManager
                                .lockFeature(
                                    featureId
                                );
                        }
                    }
                );
        }
    }
);

export { hasRewardValue };

export default RewardRegistry;
