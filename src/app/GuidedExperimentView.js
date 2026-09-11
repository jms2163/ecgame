import Manager from './GuidedExperimentManager.js';
import ExperimentMaterialLibrary from './ExperimentMaterialLibrary.js';
import ExperimentMaterialVisualLibrary from './ExperimentMaterialVisualLibrary.js';

// UI adapter for multi-stage investigations that reuse the standard organelle
// stage, placement controller, membrane scene, and particle renderer.
const GuidedExperimentView = {
    stageProgressText(experiment) {
        const checkpoints = Manager.read(experiment.id).checkpoints;
        return experiment.sequence.stages
            .map(item => `${checkpoints[item.id] ? '✓ ' : ''}${item.title}${item.playable ? '' : ' (coming next)'}`)
            .join(' · ');
    },

    mountCarriedParticles(host, experiment) {
        if (!experiment.simulation?.carryForward) return;
        const carried = Manager.prepareSimulationSnapshot(experiment, { components: [] })
            .components.filter(component => component.carriedFromStageId);
        const zone = host.querySelector(
            `[data-experiment-drop-zone="${experiment.simulation.carryForward.targetZoneId}"]`
        );
        if (!zone || carried.length === 0) return;

        const cluster = document.createElement('div');
        cluster.className = 'guided-carried-particle-cluster';
        cluster.setAttribute('role', 'img');
        cluster.setAttribute('aria-label', `${carried.length} ions carried forward from the prior stage`);
        carried.forEach(component => {
            const visualId = ExperimentMaterialLibrary[component.id]?.visualId ?? null;
            const visual = visualId
                ? ExperimentMaterialVisualLibrary.create(visualId, { decorative: true })
                : null;
            if (visual) cluster.append(visual);
        });
        zone.append(cluster);
    },

    statusText(stage, state) {
        if (stage.goal.exchangeCycles !== undefined) {
            return `Na⁺ exchanged into lumen: ${state.exchangeCycles ?? 0} / ${stage.goal.exchangeCycles} · H⁺ returned to cytosol: ${state.exchangeCycles ?? 0} / ${stage.goal.exchangeCycles}`;
        }
        if (stage.guidedUi?.transportedLabel) {
            const tracksWater = stage.goal.waterTransfers !== undefined;
            const current = tracksWater ? state.totalWaterTransfers : state.totalMembraneTransfers;
            const target = tracksWater ? stage.goal.waterTransfers : stage.goal.transfers;
            return `${stage.guidedUi.transportedLabel}: ${current ?? 0} / ${target}`;
        }
        const availableAtp = state.particles
            .filter(particle => particle.materialId === 'lab_atp_supply').length;
        const pump = state.pumpActivated ? 'energized' : 'not energized';
        return `ATP available: ${availableAtp} · ATP used: ${state.atpConsumed} · Pump: ${pump} · H⁺ pumped into lumen: ${state.totalMembraneTransfers} / ${stage.goal.transfers}`;
    },

    mount(host, experiment, { sandbox = false, onNextStage = null } = {}) {
        const stage = experiment.sequence.stages.find(item => item.id === experiment.guidedStageId);
        const stageIndex = experiment.sequence.stages.indexOf(stage);
        const nextStage = experiment.sequence.stages[stageIndex + 1] ?? null;
        const stored = Manager.read(experiment.id).checkpoints[stage.id];
        const ui = stage.guidedUi ?? {};

        const panel = document.createElement('section');
        panel.className = 'organelle-experiment-simulation-result guided-experiment-panel';
        const heading = document.createElement('h3');
        heading.textContent = stage.title;
        const steps = document.createElement('p');
        steps.textContent = this.stageProgressText(experiment);

        const prediction = document.createElement('fieldset');
        prediction.className = 'guided-experiment-prediction';
        prediction.tabIndex = -1;
        const legend = document.createElement('legend');
        legend.textContent = ui.predictionPrompt ?? 'Before you simulate, make a prediction.';
        prediction.append(legend);
        (ui.predictionChoices ?? []).forEach(choice => {
            const label = document.createElement('label');
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = `${experiment.id}-${stage.id}-prediction`;
            input.value = choice.id;
            input.checked = stored?.predictionId === choice.id;
            label.append(input, document.createTextNode(choice.text));
            prediction.append(label);
        });

        const status = document.createElement('p');
        status.setAttribute('role', 'status');
        status.textContent = stored
            ? `✓ ${stage.title} checkpoint saved. Replay freely; no additional reward is granted.`
            : 'Place the materials, then simulate. The particles must actually move through the membrane to complete this stage.';

        const record = document.createElement('button');
        record.type = 'button';
        record.textContent = 'Save';
        record.title = `Save ${stage.title} after its simulation goal is reached`;
        record.disabled = true;

        const next = document.createElement('button');
        next.type = 'button';
        next.textContent = 'Next';
        next.title = nextStage?.playable
            ? `Continue to ${nextStage.title}`
            : `${nextStage?.title ?? 'The next stage'} will be available in a later milestone`;
        next.disabled = !stored || !nextStage?.playable;
        next.onclick = () => onNextStage?.();

        const hint = document.createElement('button');
        hint.type = 'button';
        hint.textContent = 'Hint';
        hint.title = 'Show one setup hint';
        hint.onclick = () => { status.textContent = ui.hint ?? 'Check each material, side, and protein orientation.'; };

        const buttons = document.createElement('div');
        buttons.className = 'guided-experiment-actions';
        buttons.append(hint);
        if (!sandbox) buttons.append(record);
        if (nextStage) buttons.append(next);

        const modelNote = document.createElement('details');
        modelNote.className = 'guided-experiment-model-note';
        const modelSummary = document.createElement('summary');
        modelSummary.textContent = 'Model note';
        const modelText = document.createElement('p');
        modelText.textContent = ui.modelNote ?? '';
        modelNote.append(modelSummary, modelText);

        const selectedPrediction = () =>
            prediction.querySelector('input:checked')?.value ?? null;

        let completedState = null;
        record.onclick = () => {
            const result = Manager.checkpoint(experiment, stage, completedState, {
                sandbox,
                predictionId: selectedPrediction()
            });
            const rewardText = result.completion?.completed
                ? ` Investigation complete — ${result.completion.xpAwarded.toLocaleString()} XP awarded.`
                : '';
            status.textContent = result.ok
                ? `✓ ${stage.title} complete — checkpoint saved.${rewardText}${nextStage?.playable ? ' Select Next to continue.' : ''}`
                : 'Checkpoint could not be saved. Keep this page open and retry.';
            if (result.ok) {
                record.disabled = true;
                next.disabled = !nextStage?.playable;
                steps.textContent = this.stageProgressText(experiment);
            }
        };

        panel.append(heading, steps);
        if (!sandbox) panel.append(prediction);
        panel.append(status, buttons);
        host.prepend(panel);
        if (ui.modelNote) host.append(modelNote);

        for (const [zoneId, text] of [['side_a', 'CYTOSOL'], ['side_b', 'CV LUMEN']]) {
            const zone = host.querySelector(`[data-experiment-drop-zone="${zoneId}"]`);
            if (zone) {
                const label = document.createElement('span');
                label.textContent = text;
                label.className = `guided-zone-label guided-zone-label--${zoneId}`;
                zone.append(label);
            }
        }
        this.mountCarriedParticles(host, experiment);

        return {
            canSimulate() {
                if (sandbox || selectedPrediction()) return true;
                status.textContent = 'Choose a prediction before starting the simulation.';
                prediction.focus();
                return false;
            },
            onStateChanged: state => {
                if (completedState) return false;
                const text = this.statusText(stage, state);
                if (status.textContent !== text) status.textContent = text;
                if (!Manager.meetsGoal(stage, state)) return false;
                completedState = structuredClone(state);
                status.textContent = sandbox
                    ? `${stage.title} observed. Re-examine does not save or reward.`
                    : `${stage.title} goal reached — save your checkpoint to retain this result.`;
                record.disabled = sandbox;
                return true;
            }
        };
    }
};

export default GuidedExperimentView;
