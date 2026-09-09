// Teaching-scale properties, not measured permeability coefficients.
// The 1/3 probability is per membrane encounter, in either direction.
export const predictions = {
    stays: "Stays in the starting watery side.",
    crosses: "Passes to the other watery side.",
    embeds: "Enters and stays in the inner membrane.",
    unsure: "Not sure."
};

export const substances = {
    CO2: { name: "Carbon dioxide (CO₂)", properties: "Small and nonpolar", behavior: "crosses", permeability: 1, visualId: "carbon_dioxide_molecule" },
    O2: { name: "Oxygen (O₂)", properties: "Small and nonpolar", behavior: "crosses", permeability: 1, visualId: "oxygen_molecule" },
    water: { name: "Water", properties: "Small, uncharged, and polar", behavior: "crosses", permeability: 1 / 3, visualId: "water_sphere" },
    urea: { name: "Urea", properties: "Small, uncharged, and polar", behavior: "crosses", permeability: 1 / 3, visualId: "urea_sphere" },
    glucose: { name: "Glucose", properties: "Larger, uncharged, and polar", behavior: "stays", permeability: 0, visualId: "glucose_ring" },
    fructose: { name: "Fructose", properties: "Larger, uncharged, and polar", behavior: "stays", permeability: 0, visualId: "fructose_ring" },
    calcium: { name: "Calcium ion (Ca²⁺)", properties: "Small and charged (+2)", behavior: "stays", permeability: 0, visualId: "calcium_ion_sphere" },
    sodium: { name: "Sodium ion (Na⁺)", properties: "Small and charged (+1)", behavior: "stays", permeability: 0, visualId: "sodium_ion_sphere" },
    ATP: { name: "ATP", properties: "Large, polar, and charged", behavior: "stays", permeability: 0, visualId: "atp_symbol" },
    protein: { name: "Protein", properties: "Very large; this model protein has polar and charged surfaces", behavior: "stays", permeability: 0, visualId: "protein_sphere", count: 1 },
    cholesterol: { name: "Cholesterol", properties: "Mostly nonpolar, with a small polar hydroxyl group", behavior: "embeds", permeability: 0, visualId: "cholesterol_steroid" }
};

export default {
    id: "passive_diffusion",
    organelleId: "plasma_membrane",
    title: "Passive Diffusion",
    summary: "Predict and explore how molecular size, polarity, and charge affect passage through a lipid bilayer.",
    objective: "Predict how each substance interacts with a lipid bilayer, then test your prediction by observing its movement.",
    catalogReward: "+250 XP for exploring every substance",
    stage: { template: "passive_diffusion_exploration", materials: [], labels: [], controls: [] },
    requirements: { discoveries: ["H2O"], completedExperiments: ["dynamic_movement"] },
    grants: { xp: 250, discoveries: [], achievements: [], metricEffects: [] }
};
