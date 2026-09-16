// Optional sequencing layer. Existing single-stage experiments are unchanged.
import gameState from './GameState.js';
import SaveManager from './SaveManager.js';
import ResearchManager from './ResearchManager.js';
import OrganelleExperimentSubmissionManager from './OrganelleExperimentSubmissionManager.js';

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
        if (goal.waterTransfers !== undefined && (state.totalWaterTransfers ?? 0) < goal.waterTransfers) return false;
        if (goal.atpConsumed !== undefined && (state.atpConsumed ?? 0) < goal.atpConsumed) return false;
        if (goal.exchangeCycles !== undefined && (state.exchangeCycles ?? 0) < goal.exchangeCycles) return false;
        return true;
    },
    score(experiment, progress = this.read(experiment.id)) {
        const stages = (experiment.sequence?.stages ?? [])
            .filter(stage => stage.playable);
        const completionPoints =
            experiment.assessment?.guidedStageCompletionPoints ?? 0;
        const predictionPoints =
            experiment.assessment?.guidedStagePredictionPoints ?? 0;
        const stageScores = stages.map(stage => {
            const checkpoint = progress.checkpoints?.[stage.id] ?? null;
            const predictionCorrect = Boolean(
                checkpoint &&
                stage.guidedUi?.correctPredictionId &&
                checkpoint.predictionId === stage.guidedUi.correctPredictionId
            );
            return {
                stageId: stage.id,
                title: stage.title,
                completed: Boolean(checkpoint),
                predictionId: checkpoint?.predictionId ?? null,
                predictionCorrect,
                scorePoints: checkpoint
                    ? completionPoints + (predictionCorrect ? predictionPoints : 0)
                    : 0,
                scoreMaximum: completionPoints + predictionPoints
            };
        });
        const scorePoints = stageScores.reduce((sum, item) => sum + item.scorePoints, 0);
        const calculatedMaximum = stageScores.reduce((sum, item) => sum + item.scoreMaximum, 0);
        const scoreMaximum = experiment.assessment?.scoreMaximum ?? calculatedMaximum;
        const scorePercent = scoreMaximum > 0
            ? Math.round(scorePoints / scoreMaximum * 10000) / 100
            : 0;
        return {
            scorePoints,
            scoreMaximum,
            scorePercent,
            isPerfect: scoreMaximum > 0 && scorePoints === scoreMaximum,
            stageScores
        };
    },
    synchronizeScore(experiment, progress = this.read(experiment.id)) {
        if (!experiment?.assessment || !experiment?.sequence?.stages) {
            return { changed: false, score: null, starAwarded: false };
        }
        const score = this.score(experiment, progress);
        const hasAnyCheckpoint = score.stageScores.some(stage => stage.completed);
        if (!hasAnyCheckpoint) return { changed: false, score, starAwarded: false };

        OrganelleExperimentSubmissionManager.ensureRegistryStructures();
        const research = gameState.registry.research;
        const currentBest = research.bestExperimentScores[experiment.id];
        let changed = false;
        if (!currentBest || score.scorePoints > currentBest.scorePoints) {
            research.bestExperimentScores[experiment.id] = {
                submissionId: null,
                scorePoints: score.scorePoints,
                scoreMaximum: score.scoreMaximum,
                scorePercent: score.scorePercent,
                isPerfect: score.isPerfect,
                achievedAtMs: Date.now(),
                rubricVersion: experiment.assessment.rubricVersion,
                source: 'guided-checkpoints'
            };
            changed = true;
        }
        let starAwarded = false;
        if (score.isPerfect && !research.stars[experiment.id]) {
            research.stars[experiment.id] = {
                awardedAtMs: Date.now(),
                sourceSubmissionId: null,
                reason: 'perfect-guided-score',
                scorePoints: score.scorePoints,
                scoreMaximum: score.scoreMaximum
            };
            changed = true;
            starAwarded = true;
        }
        return { changed, score, starAwarded };
    },
    checkpoint(experiment, stage, state, { sandbox = false, predictionId = null } = {}) {
        if (sandbox) return { ok: false, reason: 'sandbox' };
        if (!this.meetsGoal(stage, state)) return { ok: false, reason: 'goal-not-met' };
        const progress = this.read(experiment.id);
        const existing = progress.checkpoints[stage.id] ?? null;
        if (existing && (!predictionId || predictionId === existing.predictionId)) {
            return { ok: true, duplicate: true, score: this.score(experiment, progress) };
        }
        const index = experiment.sequence.stages.findIndex(item => item.id === stage.id);
        if (index < 0 || experiment.sequence.stages.slice(0, index).some(item => !progress.checkpoints[item.id])) {
            return { ok: false, reason: 'prior-stage-incomplete' };
        }
        const before = structuredClone(gameState);
        gameState.registry ??= {};
        gameState.registry.research ??= {};
        const research = gameState.registry.research;
        research.guidedExperiments ??= {};
        progress.checkpoints[stage.id] = { completedAtMs: Date.now(),
            transfers: state.totalMembraneTransfers, atpConsumed: state.atpConsumed,
            waterTransfers: state.totalWaterTransfers ?? 0,
            exchangeCycles: state.exchangeCycles ?? 0,
            predictionId,
            particles: state.particles.map(p => ({ materialId: p.materialId, zoneId: p.zoneId })) };
        research.guidedExperiments[experiment.id] = progress;

        const isFinalStage = index === experiment.sequence.stages.length - 1;
        const completion = isFinalStage && !existing
            ? ResearchManager.completeExperiment(experiment.id)
            : null;
        if (isFinalStage && !existing && !completion?.completed) {
            for (const key of Object.keys(gameState)) delete gameState[key];
            Object.assign(gameState, before);
            return { ok: false, reason: completion?.reason ?? 'completion-failed' };
        }

        const scoreResult = this.synchronizeScore(experiment, progress);

        if (!SaveManager.save({ reason: 'guided-stage-checkpoint' })) {
            for (const key of Object.keys(gameState)) delete gameState[key];
            Object.assign(gameState, before);
            return { ok: false, reason: 'save-failed' };
        }
        return {
            ok: true,
            completion,
            revised: Boolean(existing),
            score: scoreResult.score,
            starAwarded: scoreResult.starAwarded
        };
    }
};
export default GuidedExperimentManager;
