export default Object.freeze({
    id: "photosynthetic_atp_synthase",
    organelleId: "symbiosomes",
    organelleIds: ["symbiosomes", "mitochondria"],
    releaseStatus: "active",
    title: "Assemble F-ATPase",
    summary: "One shared F-type ATP synthase lab for chloroplasts and mitochondria. In synthesis mode, H⁺ flows from the thylakoid lumen to the stroma, or from the intermembrane space to the matrix; the arrows in the reference figure show the reverse, proton-pumping mode.",
    figure: "./public/assets/organelles/f-atpase-reference.png",
    objective: "Assemble the shared F-type ATP synthase model and trace proton-driven ATP production in the chloroplast or mitochondrion.",
    catalogReward: "+600 XP • Discovery: ATP Synthesis • 5/5 earns a star",
    stage: { template: "photosynthetic_atp_synthase", materials: [], labels: [], controls: [] },
    assessment: {
        rubricVersion: "f-atp-synthase-shared-v2",
        scoreMaximum: 5,
        completionThresholdPercent: 80,
        questions: [
            { id: "direction", prompt: "During ATP synthesis, which way do H⁺ ions flow?",
                options: [{ id: "high_low", text: "Lumen → stroma, or intermembrane space → matrix" }, { id: "low_high", text: "Stroma → lumen, or matrix → intermembrane space" },
                    { id: "within_lumen", text: "Only within the high-H⁺ compartment" }, { id: "outside", text: "Out of the cell" }], correctOptionId: "high_low" },
            { id: "inputs", prompt: "Which two materials combine to make ATP?",
                options: [{ id: "adp_pi", text: "ADP and Pi" }, { id: "nadp_h", text: "NADP⁺ and H⁺" },
                    { id: "oxygen_water", text: "O₂ and H₂O" }, { id: "pq_pc", text: "PQ and PC" }], correctOptionId: "adp_pi" },
            { id: "location", prompt: "Where is ATP released in this model?",
                options: [{ id: "head_side", text: "At the catalytic head: stroma or matrix" }, { id: "high_side", text: "Into the lumen or intermembrane space" },
                    { id: "membrane", text: "Inside the membrane" }, { id: "pond", text: "Into pond water" }], correctOptionId: "head_side" },
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
