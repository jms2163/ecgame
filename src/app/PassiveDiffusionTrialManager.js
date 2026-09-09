import gameState from "./GameState.js";
import SaveManager from "./SaveManager.js";
import ResearchManager from "./ResearchManager.js";
import experiment, { substances, predictions } from "./PassiveDiffusionCatalog.js";
import Engine from "./PassiveDiffusionEngine.js";

// Only this module writes exploration records. Prediction accuracy never
// contributes to a score, star, or eligibility for the completion reward.
const Manager = {
    records() {
        return structuredClone(gameState.registry?.research?.passiveDiffusionTrials ?? []);
    },

    progress() {
        const explored = new Set(this.records().map(trial => trial.substanceId));
        return Object.keys(substances).filter(id => explored.has(id));
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
            const allExplored = this.progress().length === Object.keys(substances).length;
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
            return { ok: true, completed: allExplored, xpAwarded: completion?.xpAwarded ?? 0 };
        } catch (error) {
            // Restore the live save object, including any attempted XP reward.
            for (const key of Object.keys(gameState)) delete gameState[key];
            Object.assign(gameState, backup);
            return { ok: false, reason: "save-failed" };
        }
    }
};

export default Manager;
