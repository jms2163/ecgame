// Optional sequencing layer. Existing single-stage experiments are unchanged.
import gameState from './GameState.js';
import SaveManager from './SaveManager.js';

const GuidedExperimentManager = {
    read(id) {
        return structuredClone(gameState.registry?.research?.guidedExperiments?.[id] ?? { checkpoints: {} });
    },
    resolve(experiment, stageId) {
        const stages = experiment.sequence?.stages ?? [];
        const progress = this.read(experiment.id);
        const stage = stageId ? stages.find(item => item.id === stageId)
            : stages.find(item => item.playable && !progress.checkpoints[item.id]) ?? stages.find(item => item.playable);
        if (!stage?.playable) throw new Error('Guided stage is not available');
        const index = stages.indexOf(stage);
        if (stages.slice(0, index).some(item => !progress.checkpoints[item.id])) throw new Error('Prior stage incomplete');
        return { ...experiment, ...stage, id: experiment.id, sequence: experiment.sequence,
            title: `${experiment.title} — ${stage.title}`, guidedStageId: stage.id };
    },
    meetsGoal(stage, state) {
        const goal = stage.goal;
        return Boolean(goal && state?.simulation?.stageId === stage.id &&
            (state.totalMembraneTransfers ?? 0) >= goal.transfers &&
            (state.atpConsumed ?? 0) >= goal.atpConsumed);
    },
    checkpoint(experiment, stage, state, { sandbox = false, predictionId = null } = {}) {
        if (sandbox) return { ok: false, reason: 'sandbox' };
        if (!this.meetsGoal(stage, state)) return { ok: false, reason: 'goal-not-met' };
        const progress = this.read(experiment.id);
        if (progress.checkpoints[stage.id]) return { ok: true, duplicate: true };
        const index = experiment.sequence.stages.findIndex(item => item.id === stage.id);
        if (index < 0 || experiment.sequence.stages.slice(0, index).some(item => !progress.checkpoints[item.id])) {
            return { ok: false, reason: 'prior-stage-incomplete' };
        }
        gameState.registry ??= {};
        gameState.registry.research ??= {};
        const research = gameState.registry.research;
        const before = structuredClone(research.guidedExperiments);
        research.guidedExperiments ??= {};
        progress.checkpoints[stage.id] = { completedAtMs: Date.now(),
            transfers: state.totalMembraneTransfers, atpConsumed: state.atpConsumed,
            predictionId,
            particles: state.particles.map(p => ({ materialId: p.materialId, zoneId: p.zoneId })) };
        research.guidedExperiments[experiment.id] = progress;
        if (!SaveManager.save({ reason: 'guided-stage-checkpoint' })) {
            if (before === undefined) delete research.guidedExperiments;
            else research.guidedExperiments = before;
            return { ok: false, reason: 'save-failed' };
        }
        return { ok: true };
    }
};
export default GuidedExperimentManager;
