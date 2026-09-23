export default Object.freeze({
    id: "smooth_er_lipid_composition",
    organelleId: "smooth_endoplasmic_reticulum",
    releaseStatus: "active",
    title: "Membrane Fluidity Workshop: Tail Packing",
    summary:
        "Prototype a membrane by changing one variable: saturated versus unsaturated fatty-acid tails.",
    objective:
        "Construct a complete membrane patch and observe how tail saturation changes one live fluidity measurement.",
    catalogReward:
        "+250 XP • Achievement: Membrane Analyst • Acyltransferase recipe",
    stage: {
        template: "smooth_er_lipid_composition",
        materials: [],
        labels: [],
        controls: []
    },
    assessment: {
        rubricVersion: "smooth-er-lipid-composition-v1",
        scoreMaximum: 100,
        completionThresholdPercent: 80
    },
    requirements: {
        discoveries: [],
        completedExperiments: []
    },
    grants: {
        xp: 250,
        discoveries: [
            "smooth_er_lipid_composition",
            "glycerol_3_phosphate_acyltransferase_recipe"
        ],
        achievements: [
            "ser_membrane_analyst"
        ],
        metricEffects: []
    },
    observation: {
        title: "Membrane Properties Emerge from Composition",
        description:
            "Phospholipid head groups, fatty-acid saturation, sterols, and temperature work together. No single lipid ratio is optimal for every membrane task.",
        takeaway:
            "The smooth ER changes membrane composition by assembling phospholipids and modifying lipids; the resulting mixture influences fluidity, stability, curvature, and signaling capacity."
    }
});
