export default Object.freeze({
    id: "photosystem_ii_assembly",
    organelleId: "symbiosomes",
    releaseStatus: "active",
    title: "Inside the Alga: Assemble Photosystem II",
    summary: "Build Photosystem II in a thylakoid membrane, then answer three questions to unlock excitation.",
    objective: "Place the components and identify chlorophyll, the PSII protein complex, and the stroma.",
    catalogReward: "+150 XP • Discovery: Photosystem II Assembly • 3/3 required",
    stage: {
        template: "photosystem_ii_assembly",
        materials: [], labels: [], controls: []
    },
    assessment: {
        rubricVersion: "photosystem-ii-assembly-v1",
        scoreMaximum: 3,
        completionThresholdPercent: 100,
        questions: [
            {
                id: "chlorophyll_identity",
                prompt: "What do the separate green dots represent?",
                options: [
                    { id: "pigment", text: "Chlorophyll pigment molecules" },
                    { id: "protein", text: "Proteins" },
                    { id: "chloroplast", text: "Chloroplasts" },
                    { id: "dna", text: "DNA" }
                ],
                correctOptionId: "pigment"
            },
            {
                id: "psii_identity",
                prompt: "What does the large purple Photosystem II structure represent?",
                options: [
                    { id: "pigment", text: "Individual chlorophyll pigment molecules" },
                    { id: "protein", text: "A protein complex that holds pigments and other components" },
                    { id: "chloroplast", text: "An entire chloroplast" },
                    { id: "dna", text: "DNA" }
                ],
                correctOptionId: "protein"
            },
            {
                id: "stroma_location",
                prompt: "Where is the stroma located?",
                options: [
                    { id: "chloroplast", text: "Inside the chloroplast, outside the thylakoids" },
                    { id: "lumen", text: "Inside a thylakoid" },
                    { id: "outside_chloroplast", text: "Outside the chloroplast" },
                    { id: "outside_cell", text: "Outside the cell" }
                ],
                correctOptionId: "chloroplast"
            }
        ]
    },
    requirements: { discoveries: [], completedExperiments: [] },
    grants: {
        xp: 150,
        discoveries: ["photosystem_ii_assembly"],
        achievements: [],
        metricEffects: []
    }
});
