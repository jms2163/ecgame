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

// One shared mastery threshold controls scored Organelle Lab completion,
// downstream experiment access, and the requirement text shown in the UI.
const DEFAULT_COMPLETION_THRESHOLD_PERCENT = 80;
const DEFAULT_RETRY_THRESHOLD_PERCENT = 60;
const DEFAULT_RETRY_ATTEMPT_COUNT = 3;

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

        gameState.registry.research
            .bestExperimentScores ??= {};

        gameState.registry.research
            .experimentSubmissions ??= {};

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

    // Reconcile older saves after a lab's completion threshold changes.
    // Previously earned scores stay intact; the completion reward is
    // applied and saved only once.
    promoteSavedCompletion(experimentId) {

        if (this.isExperimentCompleted(experimentId)) return null;

        const experiment = this.getExperiment(experimentId);
        if (!Number.isFinite(
            experiment?.assessment?.completionThresholdPercent
        )) return null;

        if (!this.meetsRecordedCompletionRequirement(experiment)) {
            return null;
        }

        const previousState = structuredClone(gameState);
        const completion = this.completeExperiment(experimentId);

        if (!completion.completed) return completion;

        if (!SaveManager.save({ reason: `${experimentId}-progression-threshold` })) {
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
    // Scored labs use the shared mastery percentage. Ungraded activities
    // continue to require their normal completion/checkpoint record.
    getCompletionThresholdPercent(experimentOrId) {
        const experiment = typeof experimentOrId === "string"
            ? this.getExperiment(experimentOrId)
            : experimentOrId;

        if (!experiment?.assessment ||
            !Number.isFinite(experiment.assessment.scoreMaximum)) {
            return null;
        }

        const configured = experiment.assessment.completionThresholdPercent;
        return Number.isFinite(configured) && configured >= 0 && configured <= 100
            ? configured
            : DEFAULT_COMPLETION_THRESHOLD_PERCENT;
    },

    meetsCompletionThreshold(experiment, report) {
        const threshold = this.getCompletionThresholdPercent(experiment);
        return Number.isFinite(threshold) &&
            Number.isFinite(report?.scorePoints) &&
            Number.isFinite(report?.scoreMaximum) &&
            report.scoreMaximum > 0 &&
            report.scorePoints / report.scoreMaximum * 100 >= threshold;
    },

    getBestScorePercent(experimentId) {
        this.ensureRegistryStructures();
        const best = gameState.registry.research.bestExperimentScores[experimentId];
        if (Number.isFinite(best?.scorePercent)) return best.scorePercent;
        if (Number.isFinite(best?.scorePoints) &&
            Number.isFinite(best?.scoreMaximum) && best.scoreMaximum > 0) {
            return best.scorePoints / best.scoreMaximum * 100;
        }
        return null;
    },

    // Count submitted, scored attempts without adding another save field.
    // Existing student saves already keep these records in this array.
    getSubmissionCount(experimentId) {
        this.ensureRegistryStructures();
        const submissions = gameState.registry.research
            .experimentSubmissions[experimentId];
        return Array.isArray(submissions)
            ? submissions.length
            : 0;
    },

    // Scored Organelle Lab progression has two paths:
    // 1. reach the normal mastery threshold on any submission; or
    // 2. after three genuine submissions, reach at least 60% as the
    //    highest score. A perfect score is still required for a star.
    getProgressionPolicy(experimentOrId) {
        const experiment = typeof experimentOrId === "string"
            ? this.getExperiment(experimentOrId)
            : experimentOrId;
        const primaryThresholdPercent =
            this.getCompletionThresholdPercent(experiment);

        if (!Number.isFinite(primaryThresholdPercent)) return null;

        return {
            primaryThresholdPercent,
            retryThresholdPercent: DEFAULT_RETRY_THRESHOLD_PERCENT,
            retryAttemptCount: DEFAULT_RETRY_ATTEMPT_COUNT
        };
    },

    getReportScorePercent(report) {
        if (Number.isFinite(report?.scorePercent)) {
            return report.scorePercent;
        }
        if (Number.isFinite(report?.scorePoints) &&
            Number.isFinite(report?.scoreMaximum) &&
            report.scoreMaximum > 0) {
            return report.scorePoints / report.scoreMaximum * 100;
        }
        return null;
    },

    // Evaluate a submission before it is recorded. The projected attempt
    // count includes this submission, and the projected best preserves a
    // higher score earned on an earlier attempt.
    meetsSubmissionCompletionRequirement(experiment, report) {
        if (this.meetsCompletionThreshold(experiment, report)) return true;

        const policy = this.getProgressionPolicy(experiment);
        const reportPercent = this.getReportScorePercent(report);
        const savedBestPercent = this.getBestScorePercent(experiment?.id);
        const projectedBestPercent = Math.max(
            Number.isFinite(savedBestPercent) ? savedBestPercent : 0,
            Number.isFinite(reportPercent) ? reportPercent : 0
        );
        const projectedAttemptCount =
            this.getSubmissionCount(experiment?.id) + 1;

        return Boolean(policy) &&
            projectedAttemptCount >= policy.retryAttemptCount &&
            projectedBestPercent >= policy.retryThresholdPercent;
    },

    // Evaluate attempts that are already stored. This supports existing
    // saves immediately and also keeps rubric regrading consistent.
    meetsRecordedCompletionRequirement(experimentOrId, reports = null) {
        const experiment = typeof experimentOrId === "string"
            ? this.getExperiment(experimentOrId)
            : experimentOrId;
        if (!experiment) return false;

        const storedSubmissions = gameState.registry?.research
            ?.experimentSubmissions?.[experiment.id] ?? [];
        const evaluatedReports = Array.isArray(reports)
            ? reports
            : storedSubmissions;
        const scorePercents = evaluatedReports
            .map(report => this.getReportScorePercent(report))
            .filter(Number.isFinite);
        const bestPercent = scorePercents.length > 0
            ? Math.max(...scorePercents)
            : this.getBestScorePercent(experiment.id);
        const attemptCount = Array.isArray(reports)
            ? reports.length
            : this.getSubmissionCount(experiment.id);
        const policy = this.getProgressionPolicy(experiment);

        return Boolean(policy) && Number.isFinite(bestPercent) && (
            bestPercent >= policy.primaryThresholdPercent ||
            (
                attemptCount >= policy.retryAttemptCount &&
                bestPercent >= policy.retryThresholdPercent
            )
        );
    },

    hasMetExperimentRequirement(experimentId) {
        if (this.isExperimentCompleted(experimentId)) return true;
        return this.meetsRecordedCompletionRequirement(experimentId);
    },


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
                    !this.hasMetExperimentRequirement(
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
