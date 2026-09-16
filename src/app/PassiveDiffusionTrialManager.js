import gameState from "./GameState.js";
import SaveManager from "./SaveManager.js";
import ResearchManager from "./ResearchManager.js";
import experiment, { substances, predictions } from "./PassiveDiffusionCatalog.js";
import Engine from "./PassiveDiffusionEngine.js";

// Only this module writes exploration records. Each uniquely explored
// substance earns one of eleven completion points. Prediction accuracy remains
// ungraded and never changes the score.
const Manager = {
    records() {
        return structuredClone(gameState.registry?.research?.passiveDiffusionTrials ?? []);
    },

    progress() {
        const explored = new Set(this.records().map(trial => trial.substanceId));
        return Object.keys(substances).filter(id => explored.has(id));
    },

    // --------------------------------------------------
    // Derive the new 11-point score from observations saved by older builds.
    // The caller decides when to persist the reconciled state.
    // --------------------------------------------------
    synchronizeProgressScore() {
        ResearchManager.ensureRegistryStructures();
        const research = gameState.registry.research;
        const records = Array.isArray(
            research.passiveDiffusionTrials
        )
            ? research.passiveDiffusionTrials
            : [];
        const validIds = new Set(
            records
                .map(trial => trial?.substanceId)
                .filter(id => Object.hasOwn(substances, id))
        );
        const scorePoints = validIds.size;
        const scoreMaximum = Object.keys(substances).length;

        if (scorePoints === 0) {
            return {
                changed: false,
                score: null,
                starAwarded: false
            };
        }

        const scorePercent = Number(
            (scorePoints / scoreMaximum * 100).toFixed(2)
        );
        const isPerfect =
            scorePoints === scoreMaximum;
        const existing =
            research.bestExperimentScores[experiment.id];
        let changed = false;

        if (
            !existing ||
            scorePoints > existing.scorePoints ||
            existing.scoreMaximum !== scoreMaximum
        ) {
            research.bestExperimentScores[experiment.id] = {
                submissionId: null,
                scorePoints,
                scoreMaximum,
                scorePercent,
                isPerfect,
                achievedAtMs: Date.now(),
                rubricVersion:
                    experiment.assessment.rubricVersion,
                source: "saved-substance-observations"
            };
            changed = true;
        }

        let starAwarded = false;
        research.stars ??= {};
        if (
            isPerfect &&
            !research.stars[experiment.id]
        ) {
            research.stars[experiment.id] = {
                awardedAtMs: Date.now(),
                sourceTrialId:
                    records.at(-1)?.id ?? null,
                reason:
                    "retroactive-perfect-score",
                scorePoints,
                scoreMaximum
            };
            changed = true;
            starAwarded = true;
        }

        return {
            changed,
            score:
                structuredClone(
                    research.bestExperimentScores[
                        experiment.id
                    ]
                ),
            starAwarded
        };
    },

    feedback(state, prediction) {
        const material = substances[state.substanceId];
        const correct = prediction === material.behavior;
        const prefix = prediction === "unsure" ? "You chose “Not sure.”" :
            `Your hypothesis was ${correct ? "correct" : "incorrect"}: “${predictions[prediction]}”`;
        const explanation = material.behavior === "embeds"
            ? "Cholesterol partitions into the lipid region and remains embedded in this simplified model."
            : material.permeability === 1
                ? "These particles can cross the bilayer in both directions without a transport protein."
                : material.permeability > 0
                    ? "Some encounters lead to crossing; others bounce. Crossing is possible in both directions. The 33% chance per encounter is a teaching setting, not a measured biological constant."
                    : "This substance does not cross the bare lipid bilayer in this model. No transport proteins are present.";
        return { correct, text: `${prefix} ${explanation}` };
    },

    record({ id, state, prediction, reflection = "", sandbox = false }) {
        if (sandbox) return { ok: false, reason: "sandbox" };
        if (!id || !substances[state?.substanceId] || !Object.hasOwn(predictions, prediction) || !Engine.ready(state)) {
            return { ok: false, reason: "trial-incomplete" };
        }
        if (this.records().some(trial => trial.id === id)) return { ok: true, duplicate: true };
        const status = ResearchManager.getExperimentStatus(experiment.id);
        if (!status.available && !status.completed) return { ok: false, reason: "requirements-not-met" };
        const backup = structuredClone(gameState);
        try {
            ResearchManager.ensureRegistryStructures();
            const research = gameState.registry.research;
            research.passiveDiffusionTrials ??= [];
            const feedback = this.feedback(state, prediction);
            research.passiveDiffusionTrials.push({
                id, experimentId: experiment.id, substanceId: state.substanceId,
                substanceName: substances[state.substanceId].name,
                startingSide: state.side, prediction, predictionText: predictions[prediction],
                predictionCorrect: feedback.correct, feedback: feedback.text,
                observation: Engine.summary(state), reflection: String(reflection).slice(0, 1500),
                recordedAtMs: Date.now(), modelVersion: "passive-diffusion-v1"
            });
            const scorePoints = this.progress().length;
            const scoreMaximum = Object.keys(substances).length;
            const scorePercent = Number(
                (scorePoints / scoreMaximum * 100).toFixed(2)
            );
            const allExplored = scorePoints === scoreMaximum;
            const previousBest =
                research.bestExperimentScores[experiment.id];

            if (
                !previousBest ||
                scorePoints > previousBest.scorePoints
            ) {
                research.bestExperimentScores[experiment.id] = {
                    submissionId: null,
                    scorePoints,
                    scoreMaximum,
                    scorePercent,
                    isPerfect: allExplored,
                    achievedAtMs: Date.now(),
                    rubricVersion:
                        experiment.assessment.rubricVersion,
                    source: "saved-substance-observations"
                };
            }

            let starAwarded = false;
            research.stars ??= {};
            if (
                allExplored &&
                !research.stars[experiment.id]
            ) {
                research.stars[experiment.id] = {
                    awardedAtMs: Date.now(),
                    sourceTrialId: id,
                    reason: "perfect-score",
                    scorePoints,
                    scoreMaximum
                };
                starAwarded = true;
            }

            let completion = null;
            if (allExplored && !status.completed) {
                completion = ResearchManager.completeExperiment(experiment.id);
                if (!completion.completed) throw new Error("Completion could not be recorded");
                gameState.registry.journal ??= [];
                gameState.registry.journal.push({
                    id: `journal-${id}`, type: "organelle-exploration-completed",
                    experimentId: experiment.id, createdAtMs: Date.now(),
                    title: "Passive Diffusion: all substances explored (ungraded)", xpAwarded: completion.xpAwarded
                });
            }
            if (!SaveManager.save({ reason: "passive-diffusion-trial" })) throw new Error("Save failed");
            return {
                ok: true,
                completed: allExplored,
                xpAwarded: completion?.xpAwarded ?? 0,
                scorePoints,
                scoreMaximum,
                scorePercent,
                starAwarded
            };
        } catch (error) {
            // Restore the live save object, including any attempted XP reward.
            for (const key of Object.keys(gameState)) delete gameState[key];
            Object.assign(gameState, backup);
            return { ok: false, reason: "save-failed" };
        }
    }
};

export default Manager;
