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
            : stages.find(item => item.playable && !progress.checkpoints[item.id]) ?? stages.filter(item => item.playable).at(-1);
        if (!stage?.playable) throw new Error('Guided stage is not available');
        const index = stages.indexOf(stage);
        if (stages.slice(0, index).some(item => !progress.checkpoints[item.id])) throw new Error('Prior stage incomplete');
        return { ...experiment, ...stage, id: experiment.id, sequence: experiment.sequence,
            title: `${experiment.title} — ${stage.title}`, guidedStageId: stage.id };
    },
    prepareSimulationSnapshot(experiment, snapshot = { components: [] }) {
        const carryRule = experiment?.simulation?.carryForward;
        if (!carryRule) return structuredClone(snapshot);

        const checkpoint =
            this.read(experiment.id)
                .checkpoints[carryRule.fromStageId];
        const materialIds = new Set(carryRule.materialIds ?? []);
        const carried = (checkpoint?.particles ?? [])
            .filter(particle =>
                materialIds.has(particle.materialId) &&
                (!carryRule.targetZoneId || particle.zoneId === carryRule.targetZoneId))
            .map((particle, index, particles) => ({
                id: particle.materialId,
                zoneId: particle.zoneId,
                position: {
                    x: 0.5 + ((index % 3) - 1) * 0.10,
                    y: 0.5 + (Math.floor(index / 3) - (Math.ceil(particles.length / 3) - 1) / 2) * 0.14
                },
                carriedFromStageId: carryRule.fromStageId
            }));

        return {
            ...structuredClone(snapshot),
            components: [
                ...(snapshot.components ?? []).map(component => structuredClone(component)),
                ...carried
            ]
        };
    },
    meetsGoal(stage, state) {
        const goal = stage.goal;
        if (!goal || state?.simulation?.stageId !== stage.id) return false;
        if (goal.transfers !== undefined && (state.totalMembraneTransfers ?? 0) < goal.transfers) return false;
        if (goal.atpConsumed !== undefined && (state.atpConsumed ?? 0) < goal.atpConsumed) return false;
        if (goal.exchangeCycles !== undefined && (state.exchangeCycles ?? 0) < goal.exchangeCycles) return false;
        return true;
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
            exchangeCycles: state.exchangeCycles ?? 0,
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
