export default Object.freeze({
    id: "photosynthetic_atp_synthase",
    organelleId: "symbiosomes",
    organelleIds: ["symbiosomes", "mitochondria"],
    releaseStatus: "locked",
    title: "Assemble F-ATPase",
    summary: "One shared F-type ATP synthase lab for chloroplasts and mitochondria. In synthesis mode, H⁺ flows from the thylakoid lumen to the stroma, or from the intermembrane space to the matrix; the arrows in the reference figure show the reverse, proton-pumping mode.",
    figure: "./public/assets/organelles/f-atpase-reference.png",
    lockedMessage: "Activity in development. Symbiosomes require 100% on every preceding symbiosome experiment. Mitochondria require discoveries of glycolysis, pyruvate oxidation, and the citric acid cycle. Both locations share one score and submission history.",
    objective: "Trace proton flow through thylakoid ATP synthase and form two ATP in a simplified ten-proton model.",
    catalogReward: "+600 XP • Discovery: ATP Synthesis • 5/5 earns a star",
    stage: { template: "photosynthetic_atp_synthase", materials: [], labels: [], controls: [] },
    assessment: {
        rubricVersion: "photosynthetic-atp-synthase-v1",
        scoreMaximum: 5,
        completionThresholdPercent: 80,
        questions: [
            { id: "direction", prompt: "Which way do H⁺ ions move through ATP synthase in this model?",
                options: [{ id: "lumen_stroma", text: "From the thylakoid lumen to the stroma" }, { id: "stroma_lumen", text: "From the stroma to the lumen" },
                    { id: "within_lumen", text: "Only within the lumen" }, { id: "outside", text: "Out of the cell" }], correctOptionId: "lumen_stroma" },
            { id: "inputs", prompt: "Which two materials combine to make ATP?",
                options: [{ id: "adp_pi", text: "ADP and Pi" }, { id: "nadp_h", text: "NADP⁺ and H⁺" },
                    { id: "oxygen_water", text: "O₂ and H₂O" }, { id: "pq_pc", text: "PQ and PC" }], correctOptionId: "adp_pi" },
            { id: "location", prompt: "On which side of the thylakoid is ATP released?",
                options: [{ id: "stroma", text: "Stroma" }, { id: "lumen", text: "Thylakoid lumen" },
                    { id: "membrane", text: "Inside the membrane" }, { id: "pond", text: "Pond water" }], correctOptionId: "stroma" },
            { id: "gradient", prompt: "What provides energy for ATP synthase to operate?",
                options: [{ id: "h_gradient", text: "H⁺ moving down its concentration gradient" }, { id: "pc", text: "PC carrying ATP" },
                    { id: "light", text: "A photon directly striking ADP" }, { id: "oxygen", text: "O₂ entering the enzyme" }], correctOptionId: "h_gradient" },
            { id: "model_count", prompt: "In this simplified model, what do ten H⁺ make?",
                options: [{ id: "one", text: "One ATP" }, { id: "two", text: "Two ATP" },
                    { id: "three", text: "Three ATP" }, { id: "ten", text: "Ten ATP" }], correctOptionId: "two" }
        ]
    },
    requirements: { discoveries: [], completedExperiments: [], perfectScoreExperiments: ["photosystem_ii_assembly", "photosystem_ii_excitation", "photosystem_ii_water_splitting", "photosystem_ii_electron_transport", "photosystem_i_excitation"] },
    requirementsByOrganelle: {
        symbiosomes: { perfectScoreExperiments: ["photosystem_ii_assembly", "photosystem_ii_excitation", "photosystem_ii_water_splitting", "photosystem_ii_electron_transport", "photosystem_i_excitation"] },
        mitochondria: { discoveries: ["glycolysis", "pyruvate_oxidation", "citric_acid_cycle"] }
    },
    grants: { xp: 600, discoveries: ["photosynthetic_atp_synthase"], achievements: [], metricEffects: [] }
});
