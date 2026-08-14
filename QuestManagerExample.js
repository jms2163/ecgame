// QuestManager.js
import QuestCatalog from "./QuestCatalog.js";
import SaveManager from "./SaveManager.js";
import GameStateObserver from "./GameStateObserver.js";
import { getObjectiveHandler } from "./ObjectiveRegistry.js";
import { getRewardHandler } from "./RewardRegistry.js";

const QuestManager = {

    evaluateObjective(questId, objective, objectiveIndex = 0) {
        const record = this.getRecord(questId);
        const handler = getObjectiveHandler(objective.type);
        return handler.evaluate(objective, record, objectiveIndex);
    },

    captureObjectiveBaselines(definition, record) {
        definition.objectives.forEach((objective, index) => {
            const handler = getObjectiveHandler(objective.type);
            if (typeof handler.captureBaseline === "function") {
                handler.captureBaseline(objective, record, index);
            }
        });
    },

    claimQuest(questId) {
        const definition = QuestCatalog.get(questId);
        const record = this.getRecord(questId);

        if (!this.canClaim(definition, record)) {
            return { claimed: false, questId, reason: "invalid-claim" };
        }

        const appliedRewards = [];

        try {
            // Dynamically process every reward specified in the QuestCatalog
            for (const [rewardKey, rewardValue] of Object.entries(definition.rewards)) {
                // Skip empty or unused rewards (e.g., empty arrays or 0)
                if (!rewardValue || (Array.isArray(rewardValue) && rewardValue.length === 0)) continue;

                const handler = getRewardHandler(rewardKey);
                if (!handler) {
                    throw new Error(`Unhandled reward type: "${rewardKey}"`);
                }

                // Apply reward and record snapshot for potential rollback
                const snapshot = handler.apply(rewardValue);
                appliedRewards.push({ key: rewardKey, snapshot });
            }

            // Commit state changes
            record.status = "claimed";
            record.claimedAtMs = Date.now();
            record.viewedAtMs ??= record.claimedAtMs;

            if (!SaveManager.save()) {
                throw new Error("Save operation failed after reward application.");
            }

            GameStateObserver.notify("quest-claimed", { questId, rewards: definition.rewards });
            return { claimed: true, questId, status: this.getQuestStatus(questId) };

        } catch (error) {
            // Generic Rollback: Iterate backward through applied rewards
            for (const { key, snapshot } of appliedRewards.reverse()) {
                getRewardHandler(key).revert(snapshot);
            }

            console.error(`[QuestManager] Claim failed for quest ${questId}:`, error);
            return { claimed: false, questId, reason: "claim-failed" };
        }
    }
};

export default QuestManager;