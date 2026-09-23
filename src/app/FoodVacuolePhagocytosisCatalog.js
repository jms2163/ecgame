export default Object.freeze({
    id: "food_vacuole_phagocytosis",
    organelleId: "food_vacuole",
    releaseStatus: "active",
    title: "Phagocytosis: Surround and Seal",
    summary:
        "Extend two curved pseudopod membranes around an extracellular food particle, then constrict and seal the membrane to form a food vacuole.",
    objective:
        "Mission 1 surrounds the food particle with two positive-curvature membrane arms. Mission 2 pinches off and seals the enclosed compartment.",
    catalogReward:
        "+250 XP • Discovery: Successful Phagocytosis • Food Vacuole Formation",
    stage: {
        template: "food_vacuole_phagocytosis",
        materials: [],
        labels: [],
        controls: []
    },
    assessment: {
        rubricVersion: "food-vacuole-phagocytosis-v1",
        scoreMaximum: 100,
        completionThresholdPercent: 80
    },
    requirements: {
        discoveries: [],
        completedExperiments: [
            "pseudopodia_membrane_extension"
        ]
    },
    grants: {
        xp: 250,
        discoveries: [
            "successful_phagocytosis",
            "food_vacuole"
        ],
        achievements: [
            "phagocytosis_specialist"
        ],
        metricEffects: []
    },
    observation: {
        title: "A Food Vacuole Forms from the Plasma Membrane",
        description:
            "Two actin-supported pseudopods surround an extracellular food particle. Their membrane edges then constrict and seal, trapping the particle inside a new intracellular compartment.",
        takeaway:
            "Phagocytosis couples pseudopod extension to membrane closure and produces a food vacuole inside the cell."
    }
});
