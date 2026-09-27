export default Object.freeze({
    id: "photosystem_ii_electron_transport",
    organelleId: "symbiosomes",
    releaseStatus: "active",
    title: "Electron Transport Chain",
    summary: "Assemble the ETC and move electrons from PQ to cytochrome b₆f to PC to reach PSI.",
    objective: "Place PSII, PQ, cytochrome b₆f, and PC; trace water and PQH₂ proton release and one-electron PC transfers.",
    catalogReward: "+600 XP • Discovery: Electron Transport Chain • 5/5 earns a star",
    stage: {
        template: "photosystem_ii_electron_transport",
        materials: [], labels: [], controls: []
    },
    assessment: {
        rubricVersion: "photosystem-ii-electron-transport-v2",
        scoreMaximum: 5,
        completionThresholdPercent: 80,
        questions: [
            { id: "pq_electrons", prompt: "How many electrons can one plastoquinone (PQ) carry?",
                options: [{ id: "one", text: "1" }, { id: "two", text: "2" }, { id: "four", text: "4" }, { id: "zero", text: "0" }], correctOptionId: "two" },
            { id: "pq_protons", prompt: "When PQ becomes PQH₂, where do the protons it carries come from?",
                options: [{ id: "lumen", text: "Thylakoid lumen" }, { id: "stroma", text: "Stroma" }, { id: "cytosol", text: "Cytosol" }, { id: "psi", text: "PSI" }], correctOptionId: "stroma" },
            { id: "last_carrier", prompt: "Which molecule takes an electron from cytochrome f to PSI?",
                options: [{ id: "f", text: "Cytochrome f" }, { id: "pq", text: "PQ" }, { id: "pc", text: "Plastocyanin (PC)" }, { id: "fd", text: "Ferredoxin" }], correctOptionId: "pc" },
            { id: "gradient", prompt: "Where do protons increase in concentration?",
                options: [{ id: "stroma", text: "Stroma" }, { id: "cytosol", text: "Cytosol" }, { id: "lumen", text: "Thylakoid lumen" }, { id: "matrix", text: "Mitochondrial matrix" }], correctOptionId: "lumen" },
            { id: "lumen_total", prompt: "In this complete model, how many H⁺ enter the lumen from two waters and three PQH₂ deliveries combined?",
                options: [{ id: "two", text: "2" }, { id: "four", text: "4" }, { id: "six", text: "6" }, { id: "ten", text: "10" }], correctOptionId: "ten" }
        ]
    },
    requirements: {
        discoveries: [],
        completedExperiments: [],
        perfectScoreExperiments: ["photosystem_ii_water_splitting"]
    },
    grants: {
        xp: 600,
        discoveries: ["photosystem_ii_electron_transport"],
        achievements: [],
        metricEffects: []
    }
});
