// --------------------------------------------------
// QuestStatusResolver.js
// Derives the student-facing global Quest card state
// --------------------------------------------------

import QuestManager from "./QuestManager.js";

const STATUS = Object.freeze({
    CLAIM: "claim",
    NEW_QUEST: "new-quest",
    IN_PROGRESS: "in-progress",
    ALL_CAUGHT_UP: "all-caught-up"
});

const QuestStatusResolver = Object.freeze({

    STATUS,

    getStatus() {

        const activeQuests =
            QuestManager
                .getVisibleQuestStatuses();

        const completedQuests =
            QuestManager
                .getCompletedQuestStatuses();

        const claimableCount =
            activeQuests.filter(
                quest => quest.claimable
            ).length;

        const newQuestCount =
            activeQuests.filter(
                quest => !quest.viewed
            ).length;

        const counts = {
            activeCount:
                activeQuests.length,
            claimableCount,
            newQuestCount,
            completedCount:
                completedQuests.length
        };

        if (claimableCount > 0) {
            return {
                status: STATUS.CLAIM,
                label: "Claim",
                message:
                    `${claimableCount} quest reward${claimableCount === 1 ? " is" : "s are"} ready to claim.`,
                ...counts
            };
        }

        if (newQuestCount > 0) {
            return {
                status: STATUS.NEW_QUEST,
                label: "New Quest",
                message:
                    `${newQuestCount} new quest${newQuestCount === 1 ? " is" : "s are"} ready to read.`,
                ...counts
            };
        }

        if (activeQuests.length > 0) {
            return {
                status: STATUS.IN_PROGRESS,
                label: "In Progress",
                message:
                    `${activeQuests.length} quest${activeQuests.length === 1 ? " is" : "s are"} in progress.`,
                ...counts
            };
        }

        return {
            status: STATUS.ALL_CAUGHT_UP,
            label: "All Caught Up",
            message:
                completedQuests.length > 0
                    ? "No active quests. Completed quest history is available."
                    : "No active quests are currently available.",
            ...counts
        };

    }

});

export default QuestStatusResolver;
