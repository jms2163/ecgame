// --------------------------------------------------
// MacromolecularQuestCatalog.js
// Quest definitions for completed Macromolecularizer products.
// --------------------------------------------------

const MacromolecularQuestCatalog = Object.freeze({
    protein_building_blocks: Object.freeze({
        id: "protein_building_blocks",
        title: "Protein Building Blocks",
        category: "proteins",
        releaseState: "playable",

        description:
            "Synthesize at least one alpha helix, one beta sheet, and one loop in the Macromolecularizer. Earlier syntheses count and the motifs are not consumed.",

        prerequisites: [
            "unlock_macromolecularizer"
        ],

        objectives: [
            {
                type: "macromolecular-product-synthesis",
                productId: "H_helix",
                label: "Alpha helix synthesized",
                target: 1
            },
            {
                type: "macromolecular-product-synthesis",
                productId: "B_sheet",
                label: "Beta sheet synthesized",
                target: 1
            },
            {
                type: "macromolecular-product-synthesis",
                productId: "L_loop",
                label: "Loop synthesized",
                target: 1
            }
        ],

        rewards: {
            xp: 1000,
            discoveries: [
                "aquaporin"
            ],
            zoneUnlocks: [],
            collectorUnlocks: []
        }
    })
});

export { MacromolecularQuestCatalog };
