// --------------------------------------------------
// MacromolecularQuestCatalog.js
// Quest definitions for completed Macromolecularizer products.
// --------------------------------------------------

const MacromolecularQuestCatalog = Object.freeze({
    unlock_polymerizer: Object.freeze({
        id: "unlock_polymerizer",
        title: "From Monomers to Proteins",
        category: "main",
        releaseState: "playable",

        description:
            "Demonstrate macromolecular breadth by synthesizing the three protein motifs, one disaccharide, one membrane lipid, and one canonical RNA or DNA nucleotide. Earlier syntheses count and no products are consumed.",

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
            },
            {
                type: "macromolecular-category-synthesis",
                categoryId: "carbs",
                productIds: [
                    "Maltose",
                    "Sucrose",
                    "Lactose"
                ],
                label: "Any disaccharide synthesized",
                target: 1
            },
            {
                type: "macromolecular-category-synthesis",
                categoryId: "lipids",
                productIds: [
                    "PC",
                    "PE",
                    "PS",
                    "PI"
                ],
                label: "Any membrane lipid synthesized",
                target: 1
            },
            {
                type: "macromolecular-category-synthesis",
                categoryId: "nucleotides",
                productIds: [
                    "AMP",
                    "GMP",
                    "CMP",
                    "UMP",
                    "dAMP",
                    "dGMP",
                    "dCMP",
                    "dTMP"
                ],
                label: "Any RNA or DNA nucleotide synthesized",
                target: 1
            }
        ],

        rewards: {
            xp: 1500,
            discoveries: [],
            zoneUnlocks: [
                "polymerizer"
            ],
            collectorUnlocks: []
        }
    }),

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
