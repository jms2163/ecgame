// --------------------------------------------------
// ResearchManager.js
// Completes organelle experiments and applies rewards
// --------------------------------------------------

import gameState from "./GameState.js";
import XPManager from "./XPManager.js";
import CellSystemManager from "./CellSystemManager.js";
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
    // Check whether a discovery is known
    // --------------------------------------------------
    hasDiscovery(discoveryId) {

        this.ensureRegistryStructures();

        return gameState.registry.discoveries.includes(
            discoveryId
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