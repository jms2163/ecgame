export default Object.freeze({
    id: "smooth_er_sterol_buffer",
    organelleId: "smooth_endoplasmic_reticulum",
    releaseStatus: "active",
    title: "Sterol Buffer: Cholesterol and Membrane Stability",
    summary:
        "Hold the phospholipids constant and change only cholesterol to stabilize the same membrane during a cold snap and a warm surge.",
    objective:
        "Determine how cholesterol buffers membrane movement at low and high temperatures.",
    catalogReward:
        "+250 XP • Membrane Buffer • ERG1 and ERG7 recipes • Opens Membrane Curvature",
    stage: {
        template: "smooth_er_sterol_buffer",
        materials: [],
        labels: [],
        controls: []
    },
    assessment: {
        rubricVersion: "smooth-er-sterol-buffer-v1",
        scoreMaximum: 100,
        completionThresholdPercent: 80
    },
    requirements: {
        discoveries: [],
        completedExperiments: [
            "smooth_er_lipid_composition"
        ]
    },
    grants: {
        xp: 250,
        discoveries: [
            "smooth_er_sterol_regulation",
            "erg1_squalene_epoxidase_recipe",
            "erg7_lanosterol_synthase_recipe"
        ],
        achievements: [
            "ser_membrane_buffer"
        ],
        metricEffects: []
    },
    observation: {
        title: "Cholesterol Buffers Membrane Fluidity",
        description:
            "At low temperature, cholesterol interferes with tight phospholipid packing. At high temperature, its rigid rings restrain excessive phospholipid movement.",
        takeaway:
            "Cholesterol does not simply make membranes rigid; it buffers changes in membrane fluidity across temperature conditions."
    }
});
