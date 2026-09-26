export default Object.freeze({
    id: "photosystem_ii_excitation",
    organelleId: "symbiosomes",
    releaseStatus: "active",
    title: "Excite Photosystem II",
    summary: "The next investigation opens after a perfect Photosystem II assembly score. Its light and electron-flow simulation is being developed.",
    objective: "Explore how light excites P680 and initiates electron transfer.",
    catalogReward: "Next investigation • Simulation coming soon",
    stage: {
        template: "photosystem_ii_excitation",
        preview: true,
        materials: [], labels: [], controls: []
    },
    requirements: {
        discoveries: [],
        completedExperiments: [],
        perfectScoreExperiments: ["photosystem_ii_assembly"]
    },
    grants: { xp: 0, discoveries: [], achievements: [], metricEffects: [] }
});
