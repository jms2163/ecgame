// A two-stage microtubule transport investigation. Light- and dark-green
// groups represent alpha- and beta-tubulin. They form alpha-beta dimers before
// the dimers assemble into one illustrative protofilament. The completed track
// stays stationary while ATP-powered kinesin transports a cargo vesicle.
export default {
    id: "cytoskeleton_transport",
    organelleId: "cytoskeleton",
    title: "Cytoskeleton Transport",
    summary: "Form αβ-tubulin dimers, assemble a filament track, and observe ATP-powered kinesin transport a vesicle.",
    objective: "Complete two guided stages: assemble an alternating αβ-tubulin track, then use kinesin and ATP to transport a cargo vesicle.",
    catalogReward: "+250 XP • Discovery: Cytoskeleton transport",
    stage: { template: "cytoskeleton_transport", materials: [], labels: [], controls: [] },
    assessment: {
        rubricVersion: "cytoskeleton-transport-v1",
        scoreMaximum: 100,
        completionThresholdPercent: 100
    },
    requirements: { discoveries: [], completedExperiments: [] },
    grants: {
        xp: 250,
        discoveries: ["cytoskeleton_transport"],
        achievements: [],
        metricEffects: []
    },
    observation: {
        title: "Observation",
        description: "α- and β-tubulin first form dimers. Those dimers assemble into a stationary filament. Repeated ATP interactions briefly activate kinesin and produce one cargo-carrying step at a time.",
        takeaway: "Dimer formation, filament assembly, and ATP-powered cargo movement are distinct processes."
    }
};
