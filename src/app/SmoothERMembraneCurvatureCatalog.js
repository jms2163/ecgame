export default Object.freeze({
    id: "smooth_er_membrane_curvature",
    organelleId: "smooth_endoplasmic_reticulum",
    releaseStatus: "active",
    title: "Membrane Curvature: Shape the Leaflets",
    summary:
        "Hold the extracellular leaflet constant and change one variable—the number of curvature-promoting lipids in the cytosolic leaflet—to shape destination plasma-membrane patches.",
    objective:
        "Match an inward pinocytosis pit and an outward waste-export bulge while observing how leaflet asymmetry contributes to opposite membrane curvatures.",
    catalogReward:
        "+250 XP • Achievement: Membrane Sculptor • Opens SER Detox Network",
    stage: {
        template: "smooth_er_membrane_curvature",
        materials: [],
        labels: [],
        controls: []
    },
    assessment: {
        rubricVersion: "smooth-er-membrane-curvature-v1",
        scoreMaximum: 100,
        completionThresholdPercent: 80
    },
    requirements: {
        discoveries: [],
        completedExperiments: [
            "smooth_er_sterol_buffer"
        ]
    },
    grants: {
        xp: 250,
        discoveries: [
            "smooth_er_membrane_curvature"
        ],
        achievements: [
            "ser_membrane_sculptor"
        ],
        metricEffects: []
    },
    observation: {
        title: "Leaflet Asymmetry Can Favor Curvature",
        description:
            "Different proportions of molecular shapes in the two leaflets can favor a flat membrane, a shallow pit, or a deeper cup.",
        takeaway:
            "Lipids contribute to membrane curvature, while membrane-shaping proteins and the cytoskeleton provide additional forces in living cells."
    }
});
