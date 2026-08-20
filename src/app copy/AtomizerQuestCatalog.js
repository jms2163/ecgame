// AtomizerQuestCatalog.js
export const AtomizerQuestCatalog = {
    a1_elements: {
        id: "a1_elements",
        title: "5 Elements",
        category: "atomizer",
        releaseState: "playable",

        description: "Synthesize 5 unique elements in the Atom Lab to earn a Skill Point.",

        prerequisites: ["q1_particles"],

        objectives: [
            {
                type: "atom-discovery-count",
                label: "Elements Synthesized",
                target: 5
            }
        ],

        rewards: {
            xp: 50,
            sp: 1,
            zoneUnlocks: [],
            collectorUnlocks: []
        }
    }
};