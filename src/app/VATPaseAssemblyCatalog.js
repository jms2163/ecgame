// One experiment ID across all three organelles: submissions, best score,
// and the eventual 100% result are shared rather than copied between cards.
export default Object.freeze({
    id: "v_atpase_assembly",
    organelleId: "contractile_vacuole",
    organelleIds: ["contractile_vacuole", "lysosomes", "endosome"],
    releaseStatus: "locked",
    title: "Assemble V-ATPase in testing",
    summary: "Assemble the V-type proton pump shared by the vacuole, lysosome, and endosome. This activity is in testing.",
    objective: "Identify the A/B catalytic head, D/F rotor shaft, peripheral stalk, and a/c/c′/c″ membrane sector.",
    lockedMessage: "In testing. This shared V-ATPase assembly is locked until the activity is ready.",
    stage: { template: "v_atpase_assembly", materials: [], labels: [], controls: [] },
    requirements: { discoveries: [], completedExperiments: [] },
    grants: { xp: 600, discoveries: ["v_atpase_assembly"], achievements: [], metricEffects: [] }
});
