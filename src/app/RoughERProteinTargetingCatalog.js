export default Object.freeze({
    id: "rough_er_protein_targeting",
    organelleId: "rough_endoplasmic_reticulum",
    title: "Targeting Proteins to the Rough ER",
    summary: "Follow six coordinated steps that target a growing polypeptide from a free ribosome to the rough ER.",
    objective: "Study the complete SRP-targeting animation, then reconstruct the image sequence and match each image to its description.",
    catalogReward: "+250 XP • Discovery: ER protein targeting",
    stage: {
        template: "rough_er_protein_targeting",
        materials: [],
        labels: [],
        controls: []
    },
    assessment: {
        rubricVersion: "rough-er-protein-targeting-v1",
        scoreMaximum: 100,
        completionThresholdPercent: 80
    },
    requirements: {
        discoveries: [],
        completedExperiments: ["ribosome_translation_level_1"]
    },
    grants: {
        xp: 250,
        discoveries: [
            "er_protein_targeting",
            "signal_recognition_particle",
            "protein_translocation"
        ],
        achievements: [],
        metricEffects: []
    },
    observation: {
        title: "Signals Determine ER Entry and Topology",
        description: "Translation starts on a free ribosome. SRP recognizes the emerging signal peptide, pauses translation, and targets the complex to an ER receptor and translocation pore. Translation resumes through the pore, signal peptidase removes the signal peptide, and the completed polypeptide enters the ER lumen and folds.",
        takeaway: "The signal peptide and SRP couple translation to movement of a growing polypeptide through the rough ER membrane."
    }
});
