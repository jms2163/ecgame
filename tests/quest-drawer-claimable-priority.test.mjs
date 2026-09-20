// Run with: node tests/quest-drawer-claimable-priority.test.mjs

import assert from "node:assert/strict";
import { prioritizeClaimableQuests }
    from "../src/app/QuestDrawerOrdering.js";

const quests = [
    { id: "active-a", claimable: false },
    { id: "claimable-a", claimable: true },
    { id: "active-b", claimable: false },
    { id: "claimable-b", claimable: true },
    { id: "active-c", claimable: false }
];

const prioritized =
    prioritizeClaimableQuests(quests);

assert.deepEqual(
    prioritized.map(quest => quest.id),
    [
        "claimable-a",
        "claimable-b",
        "active-a",
        "active-b",
        "active-c"
    ],
    "claimable quests must lead while both groups preserve their existing order"
);

assert.deepEqual(
    quests.map(quest => quest.id),
    [
        "active-a",
        "claimable-a",
        "active-b",
        "claimable-b",
        "active-c"
    ],
    "prioritizing the drawer must not mutate QuestManager's result"
);

assert.deepEqual(
    prioritizeClaimableQuests([]),
    []
);

console.log(
    "PASS: the Quest drawer places every claimable quest first while preserving the normal order within each group."
);
