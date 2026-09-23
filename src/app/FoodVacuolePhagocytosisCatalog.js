export default Object.freeze({
    id: "food_vacuole_phagocytosis",
    organelleId: "food_vacuole",
    releaseStatus: "coming-soon",
    title: "Phagocytosis: Surround and Seal",
    summary:
        "Extend two curved pseudopod membranes around an extracellular food particle, then constrict and seal the membrane to form a food vacuole.",
    objective:
        "Mission 1 surrounds the food particle with two positive-curvature membrane arms. Mission 2 pinches off and seals the enclosed compartment.",
    catalogReward:
        "Planned: XP • Discovery: Successful Phagocytosis • Food Vacuole Formation",
    requirements: {
        discoveries: [],
        completedExperiments: [
            "pseudopodia_membrane_extension"
        ]
    },
    plannedMissions: [
        {
            id: "surround_food_particle",
            title: "Surround the Food Particle"
        },
        {
            id: "pinch_and_seal",
            title: "Pinch Off and Seal"
        }
    ],
    plannedGrants: {
        discoveries: [
            "successful_phagocytosis",
            "food_vacuole"
        ]
    }
});
