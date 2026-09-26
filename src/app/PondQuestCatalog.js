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
    },

    photosynthetic_partner: {
        id: "photosynthetic_partner",
        title: "A Cell in the Light",
        category: "main",
        releaseState: "playable",
        // The quest appears only after an intentional arrival in algae_patch.
        activationBiomeIds: ["algae_patch"],
        description:
            "In the algae patch, your amoeba engulfed a single-celled green alga (Chlorella-like) by phagocytosis. The cell is still intact inside a host-derived compartment. Explore whether it can persist in light rather than being digested.",
        prerequisites: [],
        objectives: [{
            type: "microbiome-discovery",
            biomeIds: ["algae_patch"],
            label: "Photosynthetic algae patch discovered",
            target: 1
        }],
        rewards: {
            xp: 500,
            discoveries: [],
            zoneUnlocks: [],
            collectorUnlocks: []
        }
    }

});

export { PondQuestCatalog };
