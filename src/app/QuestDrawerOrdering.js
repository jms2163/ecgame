// --------------------------------------------------
// QuestDrawerOrdering.js
// Stable active-quest ordering for the Quest drawer.
// --------------------------------------------------

function prioritizeClaimableQuests(
    quests = []
) {
    return [
        ...quests.filter(
            quest => quest.claimable
        ),
        ...quests.filter(
            quest => !quest.claimable
        )
    ];
}

export { prioritizeClaimableQuests };
