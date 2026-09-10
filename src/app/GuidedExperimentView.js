import Manager from './GuidedExperimentManager.js';

// UI adapter for the standard organelle stage, not another lab renderer.
const GuidedExperimentView = {
    mount(host, experiment, { sandbox = false } = {}) {
        const stage = experiment.sequence.stages.find(item => item.id === experiment.guidedStageId);
        const stored = Manager.read(experiment.id).checkpoints[stage.id];
        const panel = document.createElement('section');
        panel.className = 'organelle-experiment-simulation-result guided-experiment-panel';
        const heading = document.createElement('h3');
        heading.textContent = stage.title;
        const steps = document.createElement('p');
        steps.textContent = experiment.sequence.stages.map(item => `${Manager.read(experiment.id).checkpoints[item.id] ? '✓ ' : ''}${item.title}${item.playable ? '' : ' (coming next)'}`).join(' · ');

        const prediction = document.createElement('fieldset');
        prediction.className = 'guided-experiment-prediction';
        prediction.tabIndex = -1;
        const legend = document.createElement('legend');
        legend.textContent = 'Before you simulate: predict which side will accumulate H⁺ and which side the ATP-binding head should face.';
        prediction.append(legend);
        const choices = [
            ['lumen_head_cytosol', 'H⁺ accumulates in the CV lumen; the ATP-binding head faces the cytosol.'],
            ['cytosol_head_lumen', 'H⁺ accumulates in the cytosol; the ATP-binding head faces the CV lumen.'],
            ['lumen_head_lumen', 'H⁺ accumulates in the CV lumen; the ATP-binding head faces the CV lumen.'],
            ['cytosol_head_cytosol', 'H⁺ accumulates in the cytosol; the ATP-binding head faces the cytosol.']
        ];
        choices.forEach(([value, text]) => {
            const label = document.createElement('label');
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = `${experiment.id}-${stage.id}-prediction`;
            input.value = value;
            input.checked = stored?.predictionId === value;
            label.append(input, document.createTextNode(text));
            prediction.append(label);
        });

        const status = document.createElement('p');
        status.setAttribute('role', 'status');
        status.textContent = stored ? '✓ Stage 1 checkpoint saved. Replay freely; no additional reward is granted.' : 'Place the materials, then simulate. H⁺ must actually cross to complete the stage.';

        const record = document.createElement('button');
        record.type = 'button'; record.textContent = 'Save'; record.title = 'Save Stage 1 after the proton-pumping goal is reached'; record.disabled = true;
        const next = document.createElement('button');
        next.type = 'button'; next.textContent = 'Next'; next.title = 'Stage 2 will be available in the next milestone'; next.disabled = true;
        const hint = document.createElement('button');
        hint.type = 'button'; hint.textContent = 'Hint'; hint.title = 'Show one setup hint';
        hint.onclick = () => { status.textContent = 'Put ATP and H⁺ in the cytosol. Select the pump and rotate until its large ATP head points LEFT and its orange transport arrow points RIGHT.'; };

        const buttons = document.createElement('div');
        buttons.className = 'guided-experiment-actions';
        buttons.append(hint);
        if (!sandbox) buttons.append(record);
        buttons.append(next);

        const modelNote = document.createElement('details');
        modelNote.className = 'guided-experiment-model-note';
        const modelSummary = document.createElement('summary');
        modelSummary.textContent = 'Model note';
        const modelText = document.createElement('p');
        modelText.textContent = 'This zoomed view shows cytosol on the left and contractile-vacuole lumen on the right. It is an internal vacuole membrane, not the cell surface. Lab ATP does not spend game ATP. One ATP per H⁺ is an illustrative count, not biological stoichiometry.';
        modelNote.append(modelSummary, modelText);

        const selectedPrediction = () =>
            prediction.querySelector('input:checked')?.value ?? null;

        let completedState = null;
        record.onclick = () => {
            const result = Manager.checkpoint(experiment, stage, completedState, {
                sandbox,
                predictionId: selectedPrediction()
            });
            status.textContent = result.ok ? '✓ Stage 1 Complete — proton gradient established and checkpoint saved. Stage 2 is not yet available.' : 'Checkpoint could not be saved. Keep this page open and retry.';
            if (result.ok) { record.disabled = true; steps.textContent = '✓ Proton gradient established · Na⁺/H⁺ exchange → Cl⁻ entry → Water entry (coming next)'; }
        };
        panel.append(heading, steps);
        if (!sandbox) panel.append(prediction);
        panel.append(status, buttons);
        host.prepend(panel);
        host.append(modelNote);
        for (const [zoneId, text] of [['side_a', 'CYTOSOL'], ['side_b', 'CV LUMEN']]) {
            const zone = host.querySelector(`[data-experiment-drop-zone="${zoneId}"]`);
            if (zone) {
                const label = document.createElement('span');
                label.textContent = text;
                label.className = `guided-zone-label guided-zone-label--${zoneId}`;
                zone.append(label);
            }
        }

        return {
            canSimulate() {
                if (sandbox || selectedPrediction()) return true;
                status.textContent = 'Choose a prediction before starting the simulation.';
                prediction.focus();
                return false;
            },
            onStateChanged(state) {
                if (completedState) return false;
                const availableAtp = state.particles.filter(particle => particle.materialId === 'lab_atp_supply').length;
                const pump = state.pumpActivated ? 'energized' : 'not energized';
                const text = `ATP available: ${availableAtp} · ATP used: ${state.atpConsumed} · Pump: ${pump} · H⁺ pumped into lumen: ${state.totalMembraneTransfers} / ${stage.goal.transfers}`;
                if (status.textContent !== text) status.textContent = text;
                if (!Manager.meetsGoal(stage, state)) return false;
                completedState = structuredClone(state);
                status.textContent = sandbox ? 'Stage 1 observed. Re-examine does not save or reward.' : 'Stage 1 goal reached — save your checkpoint to retain this result.';
                record.disabled = sandbox;
                return true;
            }
        };
    }
};
export default GuidedExperimentView;
