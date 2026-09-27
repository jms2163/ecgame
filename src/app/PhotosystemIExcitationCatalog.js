export default Object.freeze({
    id: "photosystem_i_excitation",
    organelleId: "symbiosomes",
    releaseStatus: "active",
    title: "Excite PSI",
    summary: "Activate PSI to boost electrons from P700 to ferredoxin for NADPH production.",
    objective: "Assemble PSI, trace two light-driven electron transfers through Fd and FNR, and form NADPH.",
    catalogReward: "+600 XP • Discovery: PSI Excitation • 5/5 earns a star",
    stage: { template: "photosystem_i_excitation", materials: [], labels: [], controls: [] },
    assessment: {
        rubricVersion: "photosystem-i-excitation-v1",
        scoreMaximum: 5,
        completionThresholdPercent: 80,
        questions: [
            { id: "reaction_center", prompt: "What molecule in PSI becomes excited by light?", options: [
                { id: "p680", text: "P680" }, { id: "p700", text: "P700" },
                { id: "pq", text: "PQ" }, { id: "pc", text: "PC" }
            ], correctOptionId: "p700" },
            { id: "replacement", prompt: "When P700 loses an electron, what molecule replaces it?", options: [
                { id: "pqh2", text: "PQH₂" }, { id: "water", text: "Water" },
                { id: "pc", text: "Plastocyanin (PC)" }, { id: "fd", text: "Ferredoxin (Fd)" }
            ], correctOptionId: "pc" },
            { id: "carrier", prompt: "After PSI's primary electron acceptor, which carrier receives the electron?", options: [
                { id: "pq", text: "PQ" }, { id: "cytochrome", text: "Cytochrome b₆f" },
                { id: "fd", text: "Ferredoxin (Fd)" }, { id: "nadp", text: "NADP⁺" }
            ], correctOptionId: "fd" },
            { id: "enzyme", prompt: "What enzyme uses electrons from Fd to make NADPH?", options: [
                { id: "atp", text: "ATP synthase" }, { id: "fnr", text: "NADP⁺ reductase (FNR)" },
                { id: "cytf", text: "Cytochrome f" }, { id: "pc", text: "Plastocyanin (PC)" }
            ], correctOptionId: "fnr" },
            { id: "electron_count", prompt: "How many electrons are needed to reduce NADP⁺ to NADPH?", options: [
                { id: "one", text: "1" }, { id: "two", text: "2" },
                { id: "three", text: "3" }, { id: "four", text: "4" }
            ], correctOptionId: "two" }
        ]
    },
    requirements: { discoveries: [], completedExperiments: [], perfectScoreExperiments: ["photosystem_ii_electron_transport"] },
    grants: { xp: 600, discoveries: ["photosystem_i_excitation"], achievements: [], metricEffects: [] }
});
