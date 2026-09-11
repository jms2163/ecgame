import Membrane from './PlasmaMembraneVisualCatalog.js';

export default {
    id: 'contractile_vacuole_filling', organelleId: 'contractile_vacuole',
    title: 'Filling the Contractile Vacuole',
    summary: 'Guided investigation: establish a proton gradient, then use it to exchange H⁺ for Na⁺. Stages 1–2 are available.',
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
                goal: { transfers: 6, atpConsumed: 6 },
                guidedUi: {
                    predictionPrompt: 'Before you simulate: predict which side will accumulate H⁺ and which side the ATP-binding head should face.',
                    predictionChoices: [
                        { id: 'lumen_head_cytosol', text: 'H⁺ accumulates in the CV lumen; the ATP-binding head faces the cytosol.' },
                        { id: 'cytosol_head_lumen', text: 'H⁺ accumulates in the cytosol; the ATP-binding head faces the CV lumen.' },
                        { id: 'lumen_head_lumen', text: 'H⁺ accumulates in the CV lumen; the ATP-binding head faces the CV lumen.' },
                        { id: 'cytosol_head_cytosol', text: 'H⁺ accumulates in the cytosol; the ATP-binding head faces the cytosol.' }
                    ],
                    hint: 'Put ATP and H⁺ in the cytosol. Select the pump and rotate until its large ATP head points LEFT and its orange transport arrow points RIGHT.',
                    modelNote: 'This zoomed view shows cytosol on the left and contractile-vacuole lumen on the right. It is an internal vacuole membrane, not the cell surface. Lab ATP does not spend game ATP. One ATP per H⁺ is an illustrative count, not biological stoichiometry.'
                }
            },
            {
                id: 'sodium_exchange', title: 'Stage 2: Na⁺/H⁺ Exchange', playable: true,
                objective: 'Use the proton gradient from Stage 1 to exchange six lumen H⁺ for six cytosolic Na⁺. Place Na⁺ in the cytosol (left), place the Na⁺/H⁺ exchanger in the membrane, orient it correctly, and simulate.',
                stage: { template: 'membrane_transport', materials: [
                    { id: 'sodium_ion_sample', maxPlacements: 1 },
                    { id: 'sodium_hydrogen_exchanger', maxPlacements: 1 }
                ], labels: [], controls: ['rotate', 'simulate', 'reset'] },
                simulation: {
                    modelId: 'particle_membrane_transport', modelVariant: 'coupled_antiport', stageId: 'sodium_exchange',
                    zoneIds: ['side_a', 'membrane', 'side_b'],
                    membraneGeometry: { ...Membrane.geometry },
                    particleMaterialIds: ['sodium_ion_sample', 'hydrogen_ion'],
                    fixedStructureMaterialIds: ['sodium_hydrogen_exchanger'],
                    carryForward: { fromStageId: 'proton_gradient', materialIds: ['hydrogen_ion'], targetZoneId: 'side_b' },
                    poreRule: { materialId: 'sodium_hydrogen_exchanger', allowedRotationDeg: [0], radius: 0.13, speedMultiplier: 4 },
                    movementSpeedMultiplier: 2,
                    coupledTransportRule: {
                        cycleCounterMaterialId: 'sodium_ion',
                        participants: [
                            { materialId: 'sodium_ion', sourceZoneId: 'side_a', targetZoneId: 'side_b' },
                            { materialId: 'hydrogen_ion', sourceZoneId: 'side_b', targetZoneId: 'side_a' }
                        ]
                    }
                },
                goal: { exchangeCycles: 6 },
                guidedUi: {
                    predictionPrompt: 'Before you simulate: predict how Na⁺ and H⁺ will move through the exchanger.',
                    predictionChoices: [
                        { id: 'sodium_in_proton_out', text: 'Na⁺ moves from cytosol to CV lumen while H⁺ moves from CV lumen to cytosol.' },
                        { id: 'both_into_lumen', text: 'Na⁺ and H⁺ both move into the CV lumen.' },
                        { id: 'sodium_out_proton_in', text: 'Na⁺ moves from CV lumen to cytosol while H⁺ moves into the CV lumen.' },
                        { id: 'neither_moves', text: 'Neither ion moves through the exchanger.' }
                    ],
                    hint: 'Put the Na⁺ sample in the cytosol. Rotate the exchanger until its red Na⁺ arrow points RIGHT and its orange H⁺ arrow points LEFT.',
                    modelNote: 'Stage 2 begins with the H⁺ gradient saved in Stage 1. This simplified antiporter uses the movement of H⁺ back toward the cytosol to couple Na⁺ movement into the contractile-vacuole lumen.'
                }
            },
            { id: 'chloride_entry', title: 'Stage 3: Cl⁻ Entry', playable: false },
            { id: 'water_entry', title: 'Stage 4: Osmotic Water Entry', playable: false }
        ]
    }
};
