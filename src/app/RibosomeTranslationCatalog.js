export default Object.freeze({
    id: "ribosome_translation_level_1",
    organelleId: "ribosomes",
    title: "Ribosome Level 1: From mRNA to Protein",
    summary: "Assemble a ribosome, give it mRNA instructions, and observe a simple protein chain being constructed.",
    objective: "Join the large and small ribosomal subunits, load mRNA, run the model, and identify the monomers and reaction type used to build a polypeptide.",
    catalogReward: "+250 XP • Discovery: Translation",
    stage: {
        template: "ribosome_translation_basics",
        materials: [],
        labels: [],
        controls: []
    },
    assessment: {
        rubricVersion: "ribosome-translation-basics-v1",
        scoreMaximum: 100,
        completionThresholdPercent: 100
    },
    requirements: {
        discoveries: [],
        completedExperiments: []
    },
    grants: {
        xp: 250,
        discoveries: ["translation", "polypeptide"],
        achievements: [],
        metricEffects: []
    },
    observation: {
        title: "Ribosomes Build Polypeptides",
        description: "In this introductory model, mRNA carries protein-building instructions to a ribosome. The ribosome links amino-acid monomers into a growing polypeptide.",
        takeaway: "mRNA provides instructions, the ribosome is the protein-building machine, and amino acids are joined into a polypeptide."
    }
});
