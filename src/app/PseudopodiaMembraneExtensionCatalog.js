export default Object.freeze({
    id: "pseudopodia_membrane_extension",
    organelleId: "cytoskeleton",
    releaseStatus: "active",
    title: "Pseudopod Extension: Curve, Push, Stabilize",
    summary:
        "Shape a lipid-rich leading edge, then grow an actin microfilament network that pushes and stabilizes the pseudopod.",
    objective:
        "Mission 1 uses 28 small colored lipids to curve and extend the membrane. Mission 2 grows actin beneath that leading edge to support protrusion.",
    catalogReward:
        "+250 XP • Discovery: Phagocytosis Ready • Reveals Food Vacuole Lab",
    stage: {
        template: "pseudopodia_membrane_extension",
        materials: [],
        labels: [],
        controls: []
    },
    assessment: {
        rubricVersion: "pseudopodia-membrane-extension-v1",
        scoreMaximum: 100,
        completionThresholdPercent: 80
    },
    requirements: {
        discoveries: [],
        completedExperiments: [],
        perfectScoreExperiments: [
            "cytoskeleton_transport"
        ]
    },
    grants: {
        xp: 250,
        discoveries: [
            "phagocytosis_ready"
        ],
        achievements: [
            "pseudopod_architect"
        ],
        metricEffects: []
    },
    observation: {
        title: "Membrane Shape and Actin Work Together",
        description:
            "Curvature-promoting lipids help shape the leading membrane, while actin polymerization supplies an outward pushing force beneath it.",
        takeaway:
            "A pseudopod depends on both a bendable membrane and a dynamic actin cytoskeleton."
    }
});
