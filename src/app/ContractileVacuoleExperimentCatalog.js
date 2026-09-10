import Membrane from './PlasmaMembraneVisualCatalog.js';

export default {
    id: 'contractile_vacuole_filling', organelleId: 'contractile_vacuole',
    title: 'Filling the Contractile Vacuole',
    summary: 'Guided investigation: use ATP to establish a proton gradient. Stage 1 preview; later stages are not yet available.',
    objective: 'Build the conditions that allow water to enter the contractile-vacuole complex.',
    catalogReward: '1200 XP after all four stages are completed',
    requirements: { discoveries: [], completedExperiments: ['aquaporin_facilitated_diffusion'] },
    // No experiment completion or reward until all four stages ship.
    grants: { xp: 1200, discoveries: ['contractile_vacuole_filling'], achievements: [], metricEffects: [] },
    sequence: {
        stages: [
            {
                id: 'proton_gradient', title: 'Stage 1: Proton Pump', playable: true,
                objective: 'Place one H⁺ sample and one ATP supply in the cytosol (left). Place V-ATPase in the vacuole membrane and rotate its ATP-binding head toward the cytosol. Simulate to pump six H⁺ into the lumen (right).',
                stage: { template: 'membrane_transport', materials: [
                    { id: 'hydrogen_ion_sample', maxPlacements: 1 },
                    { id: 'lab_atp_supply', maxPlacements: 1 },
                    { id: 'v_atpase', maxPlacements: 1 }
                ], labels: [], controls: ['rotate', 'simulate', 'reset'] },
                simulation: {
                    modelId: 'particle_membrane_transport', stageId: 'proton_gradient',
                    zoneIds: ['side_a', 'membrane', 'side_b'],
                    membraneGeometry: { ...Membrane.geometry },
                    particleMaterialIds: ['hydrogen_ion_sample', 'lab_atp_supply'], fixedStructureMaterialIds: ['v_atpase'],
                    poreRule: { materialId: 'v_atpase', allowedRotationDeg: [270], radius: 0.12, speedMultiplier: 5 },
                    movementSpeedMultiplier: 2,
                    selectiveTransportRule: { allowedMaterialIds: ['hydrogen_ion'], sourceZoneId: 'side_a', targetZoneId: 'side_b' },
                    energyRule: {
                        materialId: 'lab_atp_supply', zoneId: 'side_a',
                        unitsPerTransfer: 1, activationDelayMs: 450,
                        activatedPoreRadius: 0.22
                    }
                },
                goal: { transfers: 6, atpConsumed: 6 }
            },
            { id: 'sodium_exchange', title: 'Stage 2: Na⁺/H⁺ Exchange', playable: false },
            { id: 'chloride_entry', title: 'Stage 3: Cl⁻ Entry', playable: false },
            { id: 'water_entry', title: 'Stage 4: Osmotic Water Entry', playable: false }
        ]
    }
};
