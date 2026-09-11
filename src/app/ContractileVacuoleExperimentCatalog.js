import Membrane from './PlasmaMembraneVisualCatalog.js';

export default {
    id: 'contractile_vacuole_filling', organelleId: 'contractile_vacuole',
    title: 'Filling the Contractile Vacuole',
    summary: 'Guided investigation: establish a proton gradient, load Na⁺ and Cl⁻, then draw water into the contractile-vacuole lumen through aquaporin.',
    objective: 'Build the conditions that allow water to enter the contractile-vacuole complex.',
    catalogReward: '1200 XP after all four stages are completed',
    requirements: { discoveries: [], completedExperiments: ['aquaporin_facilitated_diffusion'] },
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
            {
                id: 'chloride_entry', title: 'Stage 3: Cl⁻ Entry', playable: true,
                objective: 'Use the positive charge established by lumen Na⁺ to move six cytosolic Cl⁻ through a chloride channel into the contractile-vacuole lumen.',
                stage: { template: 'membrane_transport', materials: [
                    { id: 'chloride_ion_sample', maxPlacements: 1 },
                    { id: 'chloride_channel', maxPlacements: 1 }
                ], labels: [], controls: ['rotate', 'simulate', 'reset'] },
                simulation: {
                    modelId: 'particle_membrane_transport', modelVariant: 'chloride_channel_entry', stageId: 'chloride_entry',
                    zoneIds: ['side_a', 'membrane', 'side_b'],
                    membraneGeometry: { ...Membrane.geometry },
                    particleMaterialIds: ['chloride_ion_sample', 'sodium_ion'],
                    fixedStructureMaterialIds: ['chloride_channel'],
                    carryForward: { fromStageId: 'sodium_exchange', materialIds: ['sodium_ion'], targetZoneId: 'side_b' },
                    poreRule: { materialId: 'chloride_channel', allowedRotationDeg: [0], radius: 0.13, speedMultiplier: 4 },
                    movementSpeedMultiplier: 2,
                    selectiveTransportRule: {
                        allowedMaterialIds: ['chloride_ion'],
                        sourceZoneId: 'side_a', targetZoneId: 'side_b'
                    }
                },
                goal: { transfers: 6 },
                guidedUi: {
                    predictionPrompt: 'Before you simulate: predict what Cl⁻ will do after Na⁺ has accumulated in the CV lumen.',
                    predictionChoices: [
                        { id: 'chloride_enters_lumen', text: 'Cl⁻ moves through its channel from the cytosol into the CV lumen.' },
                        { id: 'chloride_stays_cytosol', text: 'Cl⁻ stays in the cytosol because ions can never cross a membrane.' },
                        { id: 'sodium_leaves_lumen', text: 'Na⁺ leaves the CV lumen through the chloride channel.' },
                        { id: 'atp_pumps_chloride', text: 'ATP directly pumps Cl⁻ into the CV lumen.' }
                    ],
                    transportedLabel: 'Cl⁻ moved into lumen',
                    hint: 'Put Cl⁻ in the cytosol. Rotate the chloride channel until its green arrow points RIGHT, toward the Na⁺ already in the CV lumen.',
                    modelNote: 'Stage 3 begins with Na⁺ retained in the CV lumen from Stage 2. The accumulated positive charge favors Cl⁻ entry through a selective channel. The model simplifies the full electrochemical gradient while preserving the direction and channel requirement.'
                }
            },
            {
                id: 'water_entry', title: 'Stage 4: Osmotic Water Entry', playable: true,
                objective: 'Use the NaCl accumulated in the contractile-vacuole lumen to draw water from the cytosol through aquaporin. Place water in the cytosol, place aquaporin in the membrane, orient the channel correctly, and simulate.',
                stage: { template: 'membrane_transport', materials: [
                    { id: 'water', maxPlacements: 1 },
                    { id: 'aquaporin', maxPlacements: 1 }
                ], labels: [], controls: ['rotate', 'simulate', 'reset'] },
                simulation: {
                    modelId: 'particle_membrane_transport', modelVariant: 'contractile_vacuole_osmosis', stageId: 'water_entry',
                    zoneIds: ['side_a', 'membrane', 'side_b'],
                    membraneGeometry: { ...Membrane.geometry },
                    particleMaterialIds: ['water', 'sodium_ion', 'chloride_ion'],
                    fixedStructureMaterialIds: ['aquaporin'],
                    carryForward: {
                        fromStageId: 'chloride_entry',
                        materialIds: ['sodium_ion', 'chloride_ion'],
                        targetZoneId: 'side_b'
                    },
                    poreRule: { materialId: 'aquaporin', allowedRotationDeg: [90, 270], radius: 0.10, speedMultiplier: 5 }
                },
                goal: { waterTransfers: 6 },
                guidedUi: {
                    predictionPrompt: 'Before you simulate: predict how water will move after Na⁺ and Cl⁻ have accumulated in the CV lumen.',
                    predictionChoices: [
                        { id: 'water_enters_lumen', text: 'Water moves from the cytosol through aquaporin into the CV lumen.' },
                        { id: 'water_leaves_lumen', text: 'Water moves from the CV lumen into the cytosol.' },
                        { id: 'ions_cross_aquaporin', text: 'Na⁺ and Cl⁻ leave the CV lumen through aquaporin.' },
                        { id: 'atp_pumps_water', text: 'ATP directly pumps water into the CV lumen.' }
                    ],
                    transportedLabel: 'Water moved into lumen',
                    hint: 'Put water in the cytosol. Place aquaporin in the membrane and rotate it until the channel spans across the membrane.',
                    modelNote: 'Stage 4 begins with equal numbers of Na⁺ and Cl⁻ retained in the CV lumen from Stage 3. Water moves toward this higher solute concentration by osmosis, and aquaporin provides a rapid passive pathway without ATP. The model does not yet represent expansion or contraction of the whole vacuole.'
                }
            }
        ]
    }
};
