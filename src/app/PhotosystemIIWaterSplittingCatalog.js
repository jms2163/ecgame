export default Object.freeze({
    id: "photosystem_ii_water_splitting",
    organelleId: "symbiosomes",
    releaseStatus: "active",
    title: "Water Splitting",
    summary: "Restore P680 four times with electrons from two water molecules, then release oxygen and protons.",
    objective: "Track four electron replacements, four H⁺ ions, and the formation of O₂.",
    catalogReward: "+150 XP • Discovery: Water Splitting • 4/4 required",
    stage: {
        template: "photosystem_ii_water_splitting",
        materials: [], labels: [], controls: []
    },
    assessment: {
        rubricVersion: "photosystem-ii-water-splitting-v1",
        scoreMaximum: 4,
        completionThresholdPercent: 80,
        questions: [
            {
                id: "electron_source",
                prompt: "Where do the replacement electrons come from in this model?",
                options: [
                    { id: "bonds", text: "The covalent bonds in H₂O" },
                    { id: "protons", text: "H⁺ ions" },
                    { id: "oxygen", text: "O₂ molecules" },
                    { id: "both_products", text: "Both H⁺ ions and O₂ molecules" }
                ],
                correctOptionId: "bonds"
            },
            {
                id: "electron_attractor",
                prompt: "What attracts replacement electrons from water when it splits?",
                options: [
                    { id: "etc", text: "The electron transport chain" },
                    { id: "p680_plus", text: "P680+" },
                    { id: "p680", text: "P680" },
                    { id: "photons", text: "Photons" }
                ],
                correctOptionId: "p680_plus"
            },
            {
                id: "electron_count",
                prompt: "How many electrons are pulled from two H₂O molecules in this net process?",
                options: [
                    { id: "one", text: "1" },
                    { id: "two", text: "2" },
                    { id: "three", text: "3" },
                    { id: "four", text: "4" }
                ],
                correctOptionId: "four"
            },
            {
                id: "byproduct",
                prompt: "What byproduct forms in this photochemical step?",
                options: [
                    { id: "o2", text: "O₂" },
                    { id: "co2", text: "CO₂" },
                    { id: "h2o", text: "H₂O" },
                    { id: "ch4", text: "CH₄" }
                ],
                correctOptionId: "o2"
            }
        ]
    },
    requirements: {
        discoveries: [],
        completedExperiments: [],
        perfectScoreExperiments: ["photosystem_ii_excitation"]
    },
    grants: {
        xp: 150,
        discoveries: ["photosystem_ii_water_splitting"],
        achievements: [],
        metricEffects: []
    }
});
