// --------------------------------------------------
// VitaminQuestCatalog.js
// Small-molecule vitamin quests completed through Molecule Lab synthesis.
// Existing synthesis history counts, and completed molecules are not consumed.
// --------------------------------------------------

const VitaminQuestCatalog = Object.freeze({
    synthesize_b3: Object.freeze({
        id: "synthesize_b3",
        title: "Synthesize B3",
        category: "vitamins",
        releaseState: "playable",

        description:
            "Synthesize Nicotinamide, the active amide form of vitamin B3, in Molecule Lab. Earlier synthesis counts.",

        prerequisites: Object.freeze([
            "unlock_molecule_lab"
        ]),

        objectives: Object.freeze([
            Object.freeze({
                type:
                    "molecule-synthesis-set",
                label:
                    "Nicotinamide synthesized",
                moleculeIds:
                    Object.freeze([
                        "Nicotinamide"
                    ]),
                target: 1
            })
        ]),

        rewards: Object.freeze({
            xp: 100,
            zoneUnlocks:
                Object.freeze([]),
            collectorUnlocks:
                Object.freeze([])
        })
    })
});

export { VitaminQuestCatalog };
