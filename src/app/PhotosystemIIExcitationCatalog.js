export default Object.freeze({
    id: "photosystem_ii_excitation",
    organelleId: "symbiosomes",
    releaseStatus: "active",
    title: "Excite Photosystem II",
    summary: "Place assembled Photosystem II and a photon, then trace energy transfer to P680 and the primary electron acceptor.",
    objective: "Observe excitation of antenna chlorophylls and electron transfer, then answer four questions.",
    catalogReward: "+150 XP • Discovery: Photosystem II Excitation",
    stage: {
        template: "photosystem_ii_excitation",
        materials: [], labels: [], controls: []
    },
    assessment: {
        rubricVersion: "photosystem-ii-excitation-v1",
        scoreMaximum: 4,
        completionThresholdPercent: 80,
        questions: [
            {
                id: "green_absorption",
                prompt: "Chlorophyll is green, so it absorbs green light. True or false?",
                options: [
                    { id: "true", text: "True" },
                    { id: "false", text: "False" }
                ],
                correctOptionId: "false"
            },
            {
                id: "light_target",
                prompt: "Which chlorophyll can be excited by light in this model?",
                options: [
                    { id: "top_left", text: "Only the top-left chlorophyll" },
                    { id: "top_right", text: "Only the top-right chlorophyll" },
                    { id: "any", text: "Any chlorophyll in the antenna" },
                    { id: "none", text: "Chlorophyll does not absorb light" }
                ],
                correctOptionId: "any"
            },
            {
                id: "energy_destination",
                prompt: "In this model, where is excitation energy directed from the antenna chlorophylls?",
                options: [
                    { id: "upward", text: "Upward, away from the reaction center" },
                    { id: "protein", text: "Into the PSII protein complex itself" },
                    { id: "chain", text: "Directly into the electron transport chain" },
                    { id: "p680", text: "Toward the P680 reaction-center pair" }
                ],
                correctOptionId: "p680"
            },
            {
                id: "acceptor_role",
                prompt: "What does the primary electron acceptor do?",
                options: [
                    { id: "absorb_light", text: "Absorb the incoming photon" },
                    { id: "accept_electron", text: "Accept an electron from the reaction center" },
                    { id: "excite", text: "Become excited directly by light" },
                    { id: "none", text: "None of these" }
                ],
                correctOptionId: "accept_electron"
            }
        ]
    },
    requirements: {
        discoveries: [],
        completedExperiments: [],
        perfectScoreExperiments: ["photosystem_ii_assembly"]
    },
    grants: {
        xp: 150,
        discoveries: ["photosystem_ii_excitation"],
        achievements: [],
        metricEffects: []
    }
});
