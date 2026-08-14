// --------------------------------------------------
// QuestManager.js
// Generic quest lifecycle and transaction coordinator
// --------------------------------------------------

import gameState from "./GameState.js";
import GameStateObserver
    from "./GameStateObserver.js";
import ObjectiveRegistry
    from "./ObjectiveRegistry.js";
import QuestCatalog from "./QuestCatalog.js";
import RewardRegistry
    from "./RewardRegistry.js";
import SaveManager from "./SaveManager.js";

const STATUS = Object.freeze({
    IN_PROGRESS: "in-progress",
    CLAIMABLE: "claimable",
    CLAIMED: "claimed"
});

const VALID_STATUSES =
    new Set(Object.values(STATUS));

const PLAYABLE_RELEASE_STATE =
    "playable";

function clone(value) {
    return value === undefined
        ? undefined
        : structuredClone(value);
}

const QuestManager = {

    initialized: false,
    gameStateLoadedHandler: null,
    objectiveEventHandlers: new Map(),

    initialize() {

        this.ensureState();

        if (this.reconcileAll()) {
            SaveManager.save();
        }

        if (this.initialized) {
            return true;
        }

        this.gameStateLoadedHandler =
            () => {
                this.ensureState();

                if (this.reconcileAll()) {
                    SaveManager.save();
                }

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

        this.subscribeToObjectiveEvents();
        this.initialized = true;

        return true;

    },

    subscribeToObjectiveEvents() {

        ObjectiveRegistry
            .getObservedEvents()
            .forEach(eventName => {
                if (
                    this.objectiveEventHandlers
                        .has(eventName)
                ) {
                    return;
                }

                const handler = () => {
                    if (!this.reconcileAll()) {
                        return;
                    }

                    SaveManager.save();

                    GameStateObserver.notify(
                        "quest-state-changed",
                        {
                            reason:
                                "objective-progress",
                            sourceEvent:
                                eventName
                        }
                    );
                };

                this.objectiveEventHandlers.set(
                    eventName,
                    handler
                );

                GameStateObserver.on(
                    eventName,
                    handler
                );
            });

        return [
            ...this.objectiveEventHandlers
                .keys()
        ];

    },

    // --------------------------------------------------
    // Catalog access
    // --------------------------------------------------

    hasDefinition(questId) {
        return Object.prototype
            .hasOwnProperty.call(
                QuestCatalog,
                questId
            );
    },

    getDefinition(questId) {
        return this.hasDefinition(questId)
            ? clone(QuestCatalog[questId])
            : null;
    },

    getDefinitions() {
        return Object.values(QuestCatalog)
            .map(clone);
    },

    isReleased(definition) {
        return definition?.releaseState ===
            PLAYABLE_RELEASE_STATE;
    },

    // --------------------------------------------------
    // Persistent quest records
    // --------------------------------------------------

    ensureState() {

        gameState.registry ??= {};

        if (
            !gameState.registry.quests ||
            typeof gameState.registry.quests !==
                "object" ||
            Array.isArray(
                gameState.registry.quests
            )
        ) {
            gameState.registry.quests = {};
        }

        const records =
            gameState.registry.quests;

        this.getDefinitions()
            .forEach(definition => {
                if (
                    !records[definition.id] ||
                    typeof records[
                        definition.id
                    ] !== "object" ||
                    Array.isArray(
                        records[definition.id]
                    )
                ) {
                    records[definition.id] = {};
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
                record.activatedAtMs =
                    Number.isFinite(
                        record.activatedAtMs
                    )
                        ? record.activatedAtMs
                        : null;

                if (
                    !record.objectiveBaselines ||
                    typeof record
                        .objectiveBaselines !==
                        "object" ||
                    Array.isArray(
                        record.objectiveBaselines
                    )
                ) {
                    record.objectiveBaselines = {};
                }

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
            });

        return records;

    },

    getRecord(questId) {

        if (!this.hasDefinition(questId)) {
            return null;
        }

        return this.ensureState()[questId];

    },

    // --------------------------------------------------
    // Objective evaluation and activation
    // --------------------------------------------------

    evaluateObjective(
        questId,
        objective,
        objectiveIndex = 0
    ) {
        return ObjectiveRegistry.evaluate({
            questId,
            objective,
            objectiveIndex,
            record:
                this.getRecord(questId)
        });
    },

    captureObjectiveBaselines(
        definition,
        record
    ) {
        definition.objectives
            .forEach(
                (objective, objectiveIndex) =>
                    ObjectiveRegistry
                        .captureBaseline({
                            questId:
                                definition.id,
                            objective,
                            objectiveIndex,
                            record
                        })
            );

        return record.objectiveBaselines;
    },

    areObjectivesComplete(questId) {

        const definition =
            this.getDefinition(questId);

        if (!definition) {
            return false;
        }

        return definition.objectives.every(
            (objective, objectiveIndex) =>
                this.evaluateObjective(
                    questId,
                    objective,
                    objectiveIndex
                ).complete
        );

    },

    arePrerequisitesMet(definition) {
        return definition.prerequisites
            .every(prerequisiteId =>
                this.getRecord(
                    prerequisiteId
                )?.status ===
                    STATUS.CLAIMED
            );
    },

    activateQuest(
        definition,
        activatedAtMs = Date.now()
    ) {

        const record =
            this.getRecord(definition.id);

        if (
            !record ||
            record.status === STATUS.CLAIMED ||
            record.activatedAtMs !== null ||
            !this.isReleased(definition) ||
            !this.arePrerequisitesMet(
                definition
            )
        ) {
            return false;
        }

        record.activatedAtMs =
            Number.isFinite(activatedAtMs)
                ? activatedAtMs
                : Date.now();
        record.objectiveBaselines = {};

        this.captureObjectiveBaselines(
            definition,
            record
        );

        return true;

    },

    // --------------------------------------------------
    // Lifecycle reconciliation
    // --------------------------------------------------

    reconcileQuest(questId) {

        const definition =
            this.getDefinition(questId);
        const record =
            this.getRecord(questId);

        if (
            !definition ||
            !record ||
            record.status === STATUS.CLAIMED ||
            !this.isReleased(definition) ||
            !this.arePrerequisitesMet(
                definition
            )
        ) {
            return false;
        }

        const activated =
            this.activateQuest(definition);

        if (
            record.status !==
                STATUS.CLAIMABLE &&
            this.areObjectivesComplete(
                questId
            )
        ) {
            record.status = STATUS.CLAIMABLE;
            record.readyAtMs ??= Date.now();

            return true;
        }

        return activated;

    },

    reconcileAll() {

        let changed = false;

        this.getDefinitions()
            .forEach(definition => {
                changed =
                    this.reconcileQuest(
                        definition.id
                    ) || changed;
            });

        return changed;

    },

    markQuestClaimable(
        questId,
        readyAtMs = Date.now()
    ) {

        const definition =
            this.getDefinition(questId);
        const record =
            this.getRecord(questId);

        if (
            !definition ||
            !record ||
            !this.isReleased(definition) ||
            !this.arePrerequisitesMet(
                definition
            )
        ) {
            return false;
        }

        this.activateQuest(definition);

        if (
            record.status === STATUS.CLAIMED ||
            record.status === STATUS.CLAIMABLE
        ) {
            return true;
        }

        if (!this.areObjectivesComplete(questId)) {
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

    // --------------------------------------------------
    // Read models for UI
    // --------------------------------------------------

    getQuestStatus(questId) {

        const definition =
            this.getDefinition(questId);
        const record =
            this.getRecord(questId);

        if (!definition || !record) {
            return null;
        }

        const released =
            this.isReleased(definition);
        const prerequisitesMet =
            this.arePrerequisitesMet(
                definition
            );
        const active =
            released &&
            prerequisitesMet &&
            Number.isFinite(
                record.activatedAtMs
            );
        const objectives =
            definition.objectives.map(
                (objective, objectiveIndex) => ({
                    ...objective,
                    ...this.evaluateObjective(
                        questId,
                        objective,
                        objectiveIndex
                    )
                })
            );

        return {
            ...definition,
            released,
            prerequisitesMet,
            active,
            objectives,
            rewards: clone(
                definition.rewards ?? {}
            ),
            status: record.status,
            readyAtMs: record.readyAtMs,
            claimedAtMs:
                record.claimedAtMs,
            viewedAtMs:
                record.viewedAtMs,
            activatedAtMs:
                record.activatedAtMs,
            objectiveBaselines: clone(
                record.objectiveBaselines
            ),
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
        return this.getDefinitions()
            .map(definition =>
                this.getQuestStatus(
                    definition.id
                )
            )
            .filter(Boolean);
    },

    getVisibleQuestStatuses() {
        return this.getAllQuestStatuses()
            .filter(quest =>
                quest.released &&
                quest.active &&
                !quest.claimed
            );
    },

    getCompletedQuestStatuses() {
        return this.getAllQuestStatuses()
            .filter(quest => quest.claimed)
            .sort(
                (left, right) =>
                    (right.claimedAtMs ?? 0) -
                    (left.claimedAtMs ?? 0)
            );
    },

    getUnviewedVisibleQuestStatuses() {
        return this.getVisibleQuestStatuses()
            .filter(quest => !quest.viewed);
    },

    hasClaimableQuest() {
        return this.getVisibleQuestStatuses()
            .some(quest => quest.claimable);
    },

    // --------------------------------------------------
    // Viewed state
    // --------------------------------------------------

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

        const previous =
            Object.fromEntries(
                quests.map(quest => [
                    quest.id,
                    this.getRecord(quest.id)
                        .viewedAtMs
                ])
            );

        quests.forEach(quest => {
            this.getRecord(quest.id)
                .viewedAtMs = timestamp;
        });

        if (!SaveManager.save()) {
            Object.entries(previous)
                .forEach(
                    ([questId, value]) => {
                        this.getRecord(questId)
                            .viewedAtMs = value;
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
            quests.map(quest => quest.id);

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

    // --------------------------------------------------
    // Transactional reward claim
    // --------------------------------------------------

    claimQuest(questId) {

        this.reconcileQuest(questId);

        const definition =
            this.getDefinition(questId);
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

        if (record.status === STATUS.CLAIMED) {
            return {
                claimed: false,
                questId,
                reason: "already-claimed",
                message:
                    "This quest reward was already claimed.",
                status:
                    this.getQuestStatus(questId)
            };
        }

        if (
            !this.isReleased(definition) ||
            !this.arePrerequisitesMet(
                definition
            ) ||
            !Number.isFinite(
                record.activatedAtMs
            )
        ) {
            return {
                claimed: false,
                questId,
                reason: "quest-inactive",
                message:
                    "That quest is not active yet.",
                status:
                    this.getQuestStatus(questId)
            };
        }

        if (
            record.status !==
                STATUS.CLAIMABLE ||
            !this.areObjectivesComplete(questId)
        ) {
            return {
                claimed: false,
                questId,
                reason: "not-claimable",
                message:
                    "Complete every quest objective before claiming the reward.",
                status:
                    this.getQuestStatus(questId)
            };
        }

        const questRecordsBefore =
            clone(this.ensureState());
        let appliedRewards = [];

        try {
            appliedRewards =
                RewardRegistry.applyAll(
                    definition.rewards
                );

            record.status = STATUS.CLAIMED;
            record.claimedAtMs = Date.now();
            record.viewedAtMs ??=
                record.claimedAtMs;

            // A newly claimed prerequisite may activate
            // later released quests and capture baselines.
            this.reconcileAll();

            if (!SaveManager.save()) {
                throw new Error(
                    "Quest reward could not be saved"
                );
            }

            const rewardResults =
                RewardRegistry.resultsByKey(
                    appliedRewards
                );
            const payload = {
                questId,
                status: record.status,
                claimedAtMs:
                    record.claimedAtMs,
                rewards: clone(
                    definition.rewards
                ),
                rewardResults
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
                    `${definition.title} reward claimed.`,
                reward: payload,
                status:
                    this.getQuestStatus(questId)
            };

        } catch (error) {
            if (appliedRewards.length > 0) {
                RewardRegistry.revertAll(
                    appliedRewards
                );
            }

            gameState.registry.quests =
                questRecordsBefore;

            GameStateObserver.notify(
                "quest-state-changed",
                {
                    questId,
                    reason: "claim-failed"
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
                    "The reward could not be claimed safely. Previous values were restored.",
                status:
                    this.getQuestStatus(questId)
            };
        }

    }

};

QuestManager.STATUS = STATUS;

export default QuestManager;
