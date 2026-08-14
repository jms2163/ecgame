// --------------------------------------------------
// QuestManager.js
// Owns persistent quest lifecycle and reward claims
// --------------------------------------------------

import gameState from "./GameState.js";
import GameStateManager
    from "./GameStateManager.js";
import GameStateObserver
    from "./GameStateObserver.js";
import ParticleInventoryManager
    from "./ParticleInventoryManager.js";
import QuestCatalog from "./QuestCatalog.js";
import SaveManager from "./SaveManager.js";
import XPManager from "./XPManager.js";

const STATUS = Object.freeze({
    IN_PROGRESS: "in-progress",
    CLAIMABLE: "claimable",
    CLAIMED: "claimed"
});

const VALID_STATUSES =
    new Set(Object.values(STATUS));

const QuestManager = {

    initialized: false,
    gameStateLoadedHandler: null,

    initialize() {

        ParticleInventoryManager
            .initialize();

        this.ensureState();
        this.reconcileAll();

        if (!this.initialized) {
            this.gameStateLoadedHandler =
                () => {
                    this.ensureState();
                    this.reconcileAll();

                    GameStateObserver.notify(
                        "quest-state-changed",
                        {
                            reason:
                                "game-state-loaded"
                        }
                    );
                };

            GameStateObserver.on(
                "game-state-loaded",
                this.gameStateLoadedHandler
            );

            this.initialized = true;
        }

        return true;

    },

    ensureState() {

        gameState.registry ??= {};

        if (
            !gameState.registry.quests ||
            Array.isArray(
                gameState.registry.quests
            ) ||
            typeof gameState.registry
                .quests !== "object"
        ) {
            gameState.registry.quests = {};
        }

        QuestCatalog.getAll().forEach(
            definition => {

                const records =
                    gameState.registry
                        .quests;

                if (
                    !records[definition.id] ||
                    typeof records[
                        definition.id
                    ] !== "object"
                ) {
                    records[definition.id] = {
                        status:
                            STATUS.IN_PROGRESS,
                        readyAtMs: null,
                        claimedAtMs: null,
                        viewedAtMs: null
                    };
                }

                const record =
                    records[definition.id];

                if (
                    !VALID_STATUSES.has(
                        record.status
                    )
                ) {
                    record.status =
                        STATUS.IN_PROGRESS;
                }

                record.readyAtMs =
                    Number.isFinite(
                        record.readyAtMs
                    )
                        ? record.readyAtMs
                        : null;

                record.claimedAtMs =
                    Number.isFinite(
                        record.claimedAtMs
                    )
                        ? record.claimedAtMs
                        : null;

                record.viewedAtMs =
                    Number.isFinite(
                        record.viewedAtMs
                    )
                        ? record.viewedAtMs
                        : null;

                if (
                    record.status ===
                        STATUS.CLAIMED &&
                    record.claimedAtMs === null
                ) {
                    record.claimedAtMs =
                        record.readyAtMs;
                }

                if (
                    record.status ===
                        STATUS.CLAIMED &&
                    record.viewedAtMs === null
                ) {
                    record.viewedAtMs =
                        record.claimedAtMs ??
                        record.readyAtMs;
                }

            }
        );

        return gameState.registry.quests;

    },

    getRecord(questId) {

        if (!QuestCatalog.has(questId)) {
            return null;
        }

        return this.ensureState()[questId];

    },

    evaluateObjective(objective) {

        if (
            objective.type ===
                "guided-particle-collection"
        ) {
            const current =
                gameState.zones?.quantum
                    ?.state
                    ?.subatomicAssembly
                    ?.guidedCollected
                    ?.[objective.particleId] ??
                0;

            const normalizedCurrent =
                Number.isInteger(current) &&
                current >= 0
                    ? Math.min(
                        current,
                        objective.target
                    )
                    : 0;

            return {
                current: normalizedCurrent,
                target: objective.target,
                complete:
                    normalizedCurrent >=
                    objective.target
            };
        }

        return {
            current: 0,
            target: objective.target ?? 1,
            complete: false
        };

    },

    areObjectivesComplete(questId) {

        const definition =
            QuestCatalog.get(questId);

        if (!definition) {
            return false;
        }

        return definition.objectives.every(
            objective =>
                this.evaluateObjective(
                    objective
                ).complete
        );

    },

    arePrerequisitesMet(definition) {

        return definition.prerequisites.every(
            prerequisiteId =>
                this.getRecord(
                    prerequisiteId
                )?.status ===
                    STATUS.CLAIMED
        );

    },

    reconcileQuest(questId) {

        const record =
            this.getRecord(questId);

        if (
            !record ||
            record.status === STATUS.CLAIMED
        ) {
            return false;
        }

        if (
            this.areObjectivesComplete(
                questId
            ) &&
            record.status !==
                STATUS.CLAIMABLE
        ) {
            record.status =
                STATUS.CLAIMABLE;
            record.readyAtMs ??=
                Date.now();

            return true;
        }

        return false;

    },

    reconcileAll() {

        let changed = false;

        QuestCatalog.getAll().forEach(
            definition => {
                changed =
                    this.reconcileQuest(
                        definition.id
                    ) || changed;
            }
        );

        return changed;

    },

    markQuestClaimable(
        questId,
        readyAtMs = Date.now()
    ) {

        const record =
            this.getRecord(questId);

        if (!record) {
            return false;
        }

        if (
            record.status === STATUS.CLAIMED ||
            record.status === STATUS.CLAIMABLE
        ) {
            return true;
        }

        if (
            !this.areObjectivesComplete(
                questId
            )
        ) {
            return false;
        }

        record.status = STATUS.CLAIMABLE;
        record.readyAtMs =
            Number.isFinite(readyAtMs)
                ? readyAtMs
                : Date.now();
        record.claimedAtMs = null;

        GameStateObserver.notify(
            "quest-state-changed",
            {
                questId,
                status: record.status,
                reason: "objectives-complete"
            }
        );

        return true;

    },

    getQuestStatus(questId) {

        const definition =
            QuestCatalog.get(questId);
        const record =
            this.getRecord(questId);

        if (!definition || !record) {
            return null;
        }

        const objectives =
            definition.objectives.map(
                objective => ({
                    ...objective,
                    ...this.evaluateObjective(
                        objective
                    )
                })
            );

        return {
            id: definition.id,
            title: definition.title,
            category:
                definition.category,
            description:
                definition.description,
            prerequisites: [
                ...definition.prerequisites
            ],
            prerequisitesMet:
                this.arePrerequisitesMet(
                    definition
                ),
            objectives,
            rewards: {
                ...definition.rewards,
                zoneUnlocks: [
                    ...definition.rewards
                        .zoneUnlocks
                ]
            },
            status: record.status,
            readyAtMs: record.readyAtMs,
            claimedAtMs:
                record.claimedAtMs,
            viewedAtMs:
                record.viewedAtMs,
            viewed:
                Number.isFinite(
                    record.viewedAtMs
                ),
            claimable:
                record.status ===
                STATUS.CLAIMABLE,
            claimed:
                record.status ===
                STATUS.CLAIMED
        };

    },

    getAllQuestStatuses() {

        return QuestCatalog.getAll()
            .map(
                definition =>
                    this.getQuestStatus(
                        definition.id
                    )
            )
            .filter(Boolean);

    },

    getVisibleQuestStatuses() {

        return this.getAllQuestStatuses()
            .filter(
                quest =>
                    quest.prerequisitesMet &&
                    !quest.claimed
            );

    },

    getCompletedQuestStatuses() {

        return this.getAllQuestStatuses()
            .filter(
                quest => quest.claimed
            )
            .sort(
                (left, right) =>
                    (right.claimedAtMs ?? 0) -
                    (left.claimedAtMs ?? 0)
            );

    },

    getUnviewedVisibleQuestStatuses() {

        return this.getVisibleQuestStatuses()
            .filter(
                quest => !quest.viewed
            );

    },

    markVisibleQuestsViewed(
        viewedAtMs = Date.now()
    ) {

        const timestamp =
            Number.isFinite(viewedAtMs)
                ? viewedAtMs
                : Date.now();

        const quests =
            this.getUnviewedVisibleQuestStatuses();

        if (quests.length === 0) {
            return {
                changed: false,
                questIds: [],
                viewedAtMs: timestamp,
                saved: true
            };
        }

        const previousValues =
            Object.fromEntries(
                quests.map(
                    quest => [
                        quest.id,
                        this.getRecord(
                            quest.id
                        ).viewedAtMs
                    ]
                )
            );

        quests.forEach(quest => {
            this.getRecord(
                quest.id
            ).viewedAtMs = timestamp;
        });

        if (!SaveManager.save()) {
            Object.entries(previousValues)
                .forEach(
                    ([questId, previous]) => {
                        this.getRecord(
                            questId
                        ).viewedAtMs =
                            previous;
                    }
                );

            return {
                changed: false,
                questIds: [],
                viewedAtMs: timestamp,
                saved: false
            };
        }

        const questIds =
            quests.map(
                quest => quest.id
            );

        GameStateObserver.notify(
            "quest-state-changed",
            {
                questIds,
                viewedAtMs: timestamp,
                reason: "quests-viewed"
            }
        );

        return {
            changed: true,
            questIds,
            viewedAtMs: timestamp,
            saved: true
        };

    },

    hasClaimableQuest() {

        return this.getVisibleQuestStatuses()
            .some(
                quest => quest.claimable
            );

    },

    claimQuest(questId) {

        this.reconcileQuest(questId);

        const definition =
            QuestCatalog.get(questId);
        const record =
            this.getRecord(questId);

        if (!definition || !record) {
            return {
                claimed: false,
                questId,
                reason: "unknown-quest",
                message:
                    "That quest is not available."
            };
        }

        if (
            record.status === STATUS.CLAIMED
        ) {
            return {
                claimed: false,
                questId,
                reason: "already-claimed",
                message:
                    "This quest reward was already claimed.",
                status:
                    this.getQuestStatus(
                        questId
                    )
            };
        }

        if (
            record.status !==
                STATUS.CLAIMABLE ||
            !this.areObjectivesComplete(
                questId
            )
        ) {
            return {
                claimed: false,
                questId,
                reason: "not-claimable",
                message:
                    "Complete every quest objective before claiming the reward.",
                status:
                    this.getQuestStatus(
                        questId
                    )
            };
        }

        const previous = {
            xp: XPManager.getXP(),
            capacity:
                ParticleInventoryManager
                    .getStatus()
                    .capacity,
            questRecord:
                structuredClone(record),
            zoneUnlocks:
                Object.fromEntries(
                    definition.rewards
                        .zoneUnlocks.map(
                            zoneId => [
                                zoneId,
                                GameStateManager
                                    .isZoneUnlocked(
                                        zoneId
                                    )
                            ]
                        )
                )
        };

        try {
            const updatedXP =
                definition.rewards.xp
                    ? XPManager.addXP(
                        definition
                            .rewards.xp
                    )
                    : XPManager.getXP();

            if (updatedXP === false) {
                throw new Error(
                    "XP reward was rejected"
                );
            }

            const updatedCapacity =
                definition.rewards
                    .particleCapacity
                    ? ParticleInventoryManager
                        .increaseCapacity(
                            definition.rewards
                                .particleCapacity
                        )
                    : ParticleInventoryManager
                        .getStatus()
                        .capacity;

            if (updatedCapacity === false) {
                throw new Error(
                    "Capacity reward was rejected"
                );
            }

            definition.rewards.zoneUnlocks
                .forEach(zoneId => {
                    if (
                        !GameStateManager
                            .setZoneUnlocked(
                                zoneId,
                                true
                            )
                    ) {
                        throw new Error(
                            `Zone unlock was rejected for ${zoneId}`
                        );
                    }
                });

            // Q1 is only the Quantum introduction.
            GameStateManager.setZoneCompleted(
                "quantum",
                false
            );

            record.status = STATUS.CLAIMED;
            record.claimedAtMs = Date.now();
            record.viewedAtMs ??=
                record.claimedAtMs;

            if (!SaveManager.save()) {
                throw new Error(
                    "The claimed reward could not be saved"
                );
            }

            const payload = {
                questId,
                status: record.status,
                claimedAtMs:
                    record.claimedAtMs,
                xpAwarded:
                    definition.rewards.xp,
                particleCapacityAwarded:
                    definition.rewards
                        .particleCapacity,
                updatedXP,
                updatedCapacity,
                zoneUnlocks: [
                    ...definition.rewards
                        .zoneUnlocks
                ]
            };

            GameStateObserver.notify(
                "quest-state-changed",
                {
                    questId,
                    status: record.status,
                    reason: "reward-claimed"
                }
            );

            GameStateObserver.notify(
                "quest-claimed",
                payload
            );

            return {
                claimed: true,
                questId,
                reason: "reward-claimed",
                message:
                    `Subatomic Assembly reward claimed. Atom Lab is unlocked and particle capacity is now ${updatedCapacity} per particle type.`,
                reward: payload,
                status:
                    this.getQuestStatus(
                        questId
                    )
            };

        } catch (error) {
            gameState.player.xp =
                previous.xp;

            gameState.registry.resources
                .particles.capacity =
                previous.capacity;

            Object.entries(
                previous.zoneUnlocks
            ).forEach(
                ([zoneId, unlocked]) => {
                    GameStateManager
                        .setZoneUnlocked(
                            zoneId,
                            unlocked
                        );
                }
            );

            Object.assign(
                record,
                previous.questRecord
            );

            GameStateObserver.notify(
                "particle-inventory-changed",
                {
                    reason:
                        "quest-claim-rolled-back",
                    capacity:
                        previous.capacity
                }
            );

            GameStateObserver.notify(
                "quest-state-changed",
                {
                    questId,
                    status: record.status,
                    reason:
                        "claim-failed"
                }
            );

            console.error(
                `QuestManager: unable to claim ${questId}`,
                error
            );

            return {
                claimed: false,
                questId,
                reason: "claim-failed",
                message:
                    "The reward could not be claimed safely. Your previous values were restored.",
                status:
                    this.getQuestStatus(
                        questId
                    )
            };
        }

    }

};

QuestManager.STATUS = STATUS;

export default QuestManager;
