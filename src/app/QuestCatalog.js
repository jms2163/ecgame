// --------------------------------------------------
// QuestCatalog.js
// Declarative definitions for released quests only
// --------------------------------------------------

const QUEST_DEFINITIONS = Object.freeze([
    Object.freeze({
        id: "q1_particles",
        title: "Subatomic Assembly",
        category: "main",
        prerequisites: Object.freeze([]),
        description:
            "Identify and collect five protons, five neutrons, and five electrons in the Quantum Field.",
        objectives: Object.freeze([
            Object.freeze({
                type:
                    "guided-particle-collection",
                particleId: "proton",
                label: "Protons identified",
                target: 5
            }),
            Object.freeze({
                type:
                    "guided-particle-collection",
                particleId: "neutron",
                label: "Neutrons identified",
                target: 5
            }),
            Object.freeze({
                type:
                    "guided-particle-collection",
                particleId: "electron",
                label: "Electrons identified",
                target: 5
            })
        ]),
        rewards: Object.freeze({
            xp: 50,
            particleCapacity: 2,
            zoneUnlocks: Object.freeze([
                "atomLab"
            ])
        })
    })
]);

const DEFINITIONS_BY_ID =
    new Map(
        QUEST_DEFINITIONS.map(
            definition => [
                definition.id,
                definition
            ]
        )
    );

function cloneDefinition(definition) {

    if (!definition) {
        return null;
    }

    return {
        ...definition,
        prerequisites: [
            ...definition.prerequisites
        ],
        objectives:
            definition.objectives.map(
                objective => ({
                    ...objective
                })
            ),
        rewards: {
            ...definition.rewards,
            zoneUnlocks: [
                ...definition.rewards
                    .zoneUnlocks
            ]
        }
    };

}

const QuestCatalog = Object.freeze({

    has(questId) {
        return DEFINITIONS_BY_ID.has(
            questId
        );
    },

    get(questId) {
        return cloneDefinition(
            DEFINITIONS_BY_ID.get(
                questId
            )
        );
    },

    getAll() {
        return QUEST_DEFINITIONS.map(
            cloneDefinition
        );
    }

});

export default QuestCatalog;
