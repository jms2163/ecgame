// One derived mastery gate for the shared chloroplast light-reactions labs.
// No extra save version or cached production-rate field is needed.
import gameState from "./GameState.js";

export const LIGHT_REACTION_EXPERIMENT_IDS = Object.freeze([
    "photosystem_ii_assembly",
    "photosystem_ii_excitation",
    "photosystem_ii_water_splitting",
    "photosystem_ii_electron_transport",
    "photosystem_i_excitation",
    "photosynthetic_atp_synthase"
]);

export function hasPerfectLightReactions() {
    const scores = gameState.registry?.research?.bestExperimentScores ?? {};
    return LIGHT_REACTION_EXPERIMENT_IDS.every(id => {
        const score = scores[id];
        return Boolean(score?.isPerfect) ||
            (Number.isFinite(score?.scorePoints) &&
                Number.isFinite(score?.scoreMaximum) &&
                score.scoreMaximum > 0 &&
                score.scorePoints === score.scoreMaximum);
    });
}

export function ensureLightReactionsAchievement() {
    if (!hasPerfectLightReactions()) return false;
    gameState.registry ??= {};
    gameState.registry.achievements ??= {};
    if (gameState.registry.achievements.light_reactions) return false;
    gameState.registry.achievements.light_reactions = {
        unlockedAtMs: Date.now(),
        sourceExperimentId: "photosynthetic_atp_synthase",
        title: "Light Reactions"
    };
    return true;
}
