// --------------------------------------------------
// PondQuestCatalog.js
// Quests unlocked through intentional Pond exploration.
// --------------------------------------------------

const PondQuestCatalog = Object.freeze({

    unlock_signaling: {
        id: "unlock_signaling",
        title: "Signals in the Water",
        category: "main",
        releaseState: "playable",

        description:
            "Actively enter a Bacterial Bloom and identify its strong bacterial signal, then claim this quest to unlock Signaling.",

        prerequisites: [
            "unlock_macromolecularizer"
        ],

        objectives: [
            {
                type: "microbiome-discovery",
                biomeIds: [
                    "bacterial_bloom"
                ],
                label:
                    "Bacterial Bloom entered",
                target: 1
            }
        ],

        rewards: {
            xp: 500,
            discoveries: [],
            zoneUnlocks: ["signaling"],
            collectorUnlocks: []
        }
    }

});

export { PondQuestCatalog };
