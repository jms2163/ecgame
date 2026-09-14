// --------------------------------------------------
// ResearchManager.js
// Completes organelle experiments and applies rewards
// --------------------------------------------------

import gameState from "./GameState.js";
import GameStateManager from "./GameStateManager.js";
import XPManager from "./XPManager.js";
import CellSystemManager from "./CellSystemManager.js";
import SaveManager from "./SaveManager.js";
import OrganelleExperimentLibrary
    from "./OrganelleExperimentLibrary.js";

const ResearchManager = {

    // --------------------------------------------------
    // Ensure saved research structures exist
    // --------------------------------------------------
    ensureRegistryStructures() {

        gameState.registry ??= {};

        gameState.registry.discoveries ??= [];

        gameState.registry.achievements ??= {};

        gameState.registry.research ??= {};

        gameState.registry.research
            .completedExperiments ??= {};

    },

    // --------------------------------------------------
    // Read a safe experiment definition copy
    // --------------------------------------------------
    getExperiment(experimentId) {

        const experiment =
            OrganelleExperimentLibrary[
                experimentId
            ];

        return experiment
            ? structuredClone(experiment)
            : null;

    },

    // --------------------------------------------------
    // Check whether a discovery is known.
    //
    // Transitional compatibility rule:
    // - New scientific discoveries (atoms, isotopes, and molecules)
    //   are stored in the categorized gameState.discoveries buckets.
    // - Existing organelle/research discoveries are still stored in
    //   the legacy gameState.registry.discoveries array.
    //
    // Read both structures so released student saves remain valid.
    // This method intentionally does not migrate, copy, or rewrite data.
    // --------------------------------------------------
    hasDiscovery(discoveryId) {

        this.ensureRegistryStructures();

        return (
            GameStateManager.hasDiscovery(
                discoveryId
            ) ||
            gameState.registry.discoveries.includes(
                discoveryId
            )
        );

    },

    // --------------------------------------------------
    // Check whether an experiment is complete
    // --------------------------------------------------
    isExperimentCompleted(experimentId) {

        this.ensureRegistryStructures();

        return Boolean(
            gameState.registry.research
                .completedExperiments[
                    experimentId
                ]
        );

    },

    // Use an experiment-specific threshold when one is defined.
    // All other labs continue to require a perfect submission.
    meetsCompletionThreshold(experiment, report) {

        const threshold = experiment?.assessment
            ?.completionThresholdPercent ?? 100;

        return Number.isFinite(report?.scorePoints) &&
            Number.isFinite(report?.scoreMaximum) &&
            report.scoreMaximum > 0 &&
            report.scorePoints / report.scoreMaximum * 100 >= threshold;

    },

    // Reconcile older saves after a lab's completion threshold changes.
    // Previously earned scores stay intact; the completion reward is
    // applied and saved only once.
    promoteSavedCompletion(experimentId) {

        if (this.isExperimentCompleted(experimentId)) return null;

        const experiment = this.getExperiment(experimentId);
        if (!Number.isFinite(
            experiment?.assessment?.completionThresholdPercent
        )) return null;

        const submissions = gameState.registry?.research
            ?.experimentSubmissions?.[experimentId] ?? [];

        if (!Array.isArray(submissions) || !submissions.some(
            submission => this.meetsCompletionThreshold(
                experiment, submission
            )
        )) return null;

        const previousState = structuredClone(gameState);
        const completion = this.completeExperiment(experimentId);

        if (!completion.completed) return completion;

        if (!SaveManager.save({ reason: `${experimentId}-80-percent` })) {
            for (const key of Object.keys(gameState)) delete gameState[key];
            Object.assign(gameState, previousState);
            return { completed: false, reason: "save-failed" };
        }

        return completion;

    },

    promoteSavedDynamicMovement() {
        return this.promoteSavedCompletion("dynamic_movement");
    },

    promoteSavedWaterDiffusion() {
        return this.promoteSavedCompletion("water_passive_diffusion");
    },

    promoteSavedAquaporinDiffusion() {
        return this.promoteSavedCompletion("aquaporin_facilitated_diffusion");
    },

    // --------------------------------------------------
    // Describe whether an experiment can run
    // --------------------------------------------------
    getExperimentStatus(experimentId) {

        const experiment =
            this.getExperiment(experimentId);

        if (!experiment) {
            return {
                exists: false,
                completed: false,
                available: false,
                missingDiscoveries: [],
                incompleteExperiments: []
            };
        }

        const requiredDiscoveries =
            experiment.requirements?.discoveries ?? [];

        const requiredExperiments =
            experiment.requirements
                ?.completedExperiments ?? [];

        const missingDiscoveries =
            requiredDiscoveries.filter(
                discoveryId =>
                    !this.hasDiscovery(
                        discoveryId
                    )
            );

        const incompleteExperiments =
            requiredExperiments.filter(
                requiredExperimentId =>
                    !this.isExperimentCompleted(
                        requiredExperimentId
                    )
            );

        const completed =
            this.isExperimentCompleted(
                experimentId
            );

        return {
            exists: true,
            completed,

            available:
                !completed &&
                missingDiscoveries.length === 0 &&
                incompleteExperiments.length === 0,

            missingDiscoveries,
            incompleteExperiments
        };

    },

    // --------------------------------------------------
    // Confirm metric effects reference real metrics
    // --------------------------------------------------
    validateMetricEffects(metricEffects) {

        return metricEffects.every(effect => {

            if (effect.operation !== "add") {
                return false;
            }

            if (!Number.isFinite(effect.amount)) {
                return false;
            }

            const system =
                CellSystemManager.getSystem(
                    effect.systemId
                );

            return Number.isFinite(
                system?.[effect.metricId]
            );

        });

    },

    // --------------------------------------------------
    // Complete one experiment exactly once
    // --------------------------------------------------
    completeExperiment(experimentId) {

        this.ensureRegistryStructures();

        const experiment =
            this.getExperiment(experimentId);

        if (!experiment) {
            console.warn(
                `ResearchManager: unknown experiment "${experimentId}"`
            );

            return {
                completed: false,
                reason: "unknown-experiment"
            };
        }

        const status =
            this.getExperimentStatus(
                experimentId
            );

        // A preview cannot accidentally grant full-experiment rewards.
        if (experiment.sequence?.stages?.some(stage => !stage.playable)) {
            return { completed: false, reason: 'experiment-in-development' };
        }

        if (status.completed) {
            return {
                completed: false,
                reason: "already-completed"
            };
        }

        if (!status.available) {
            return {
                completed: false,
                reason: "requirements-not-met",

                missingDiscoveries:
                    status.missingDiscoveries,

                incompleteExperiments:
                    status.incompleteExperiments
            };
        }

        if (experiment.sequence?.stages) {
            const checkpoints =
                gameState.registry.research.guidedExperiments?.[experimentId]?.checkpoints ?? {};
            const incompleteStageIds = experiment.sequence.stages
                .filter(stage => !checkpoints[stage.id])
                .map(stage => stage.id);
            if (incompleteStageIds.length > 0) {
                return {
                    completed: false,
                    reason: 'guided-stages-incomplete',
                    incompleteStageIds
                };
            }
        }

        const grants =
            experiment.grants ?? {};

        const metricEffects =
            grants.metricEffects ?? [];

        if (
            !this.validateMetricEffects(
                metricEffects
            )
        ) {
            console.warn(
                `ResearchManager: invalid metric effects for "${experimentId}"`
            );

            return {
                completed: false,
                reason: "invalid-metric-effects"
            };
        }

        const completedAtMs =
            Date.now();

        const appliedMetricEffects =
            metricEffects.map(effect => {

                const before =
                    CellSystemManager.getSystem(
                        effect.systemId
                    )[effect.metricId];

                CellSystemManager.adjustMetric(
                    effect.systemId,
                    effect.metricId,
                    effect.amount
                );

                const after =
                    CellSystemManager.getSystem(
                        effect.systemId
                    )[effect.metricId];

                return {
                    systemId:
                        effect.systemId,

                    metricId:
                        effect.metricId,

                    before,
                    after
                };

            });

        const grantedDiscoveries =
            (grants.discoveries ?? []).filter(
                discoveryId => {

                    if (
                        this.hasDiscovery(
                            discoveryId
                        )
                    ) {
                        return false;
                    }

                    gameState.registry.discoveries.push(
                        discoveryId
                    );

                    return true;

                }
            );

        const unlockedAchievements =
            (grants.achievements ?? []).filter(
                achievementId => {

                    if (
                        gameState.registry.achievements[
                            achievementId
                        ]
                    ) {
                        return false;
                    }

                    gameState.registry.achievements[
                        achievementId
                    ] = {
                        unlockedAtMs:
                            completedAtMs,

                        sourceExperimentId:
                            experimentId
                    };

                    return true;

                }
            );

        const xpAwarded =
            Number.isFinite(grants.xp) &&
            grants.xp > 0
                ? grants.xp
                : 0;

        if (xpAwarded > 0) {
            XPManager.addXP(xpAwarded);
        }

        gameState.registry.research
            .completedExperiments[
                experimentId
            ] = {
                completedAtMs
            };

        return {
            completed: true,

            experimentId,

            completedAtMs,

            xpAwarded,

            grantedDiscoveries,

            unlockedAchievements,

            appliedMetricEffects
        };

    }

};

export default ResearchManager;
