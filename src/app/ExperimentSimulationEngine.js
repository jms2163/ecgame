// --------------------------------------------------
// ExperimentSimulationEngine.js
// Runs data-defined experiment simulations.
// Simulation reports outcomes; it does not score work.
// --------------------------------------------------

import ExperimentPlacementEvaluator
    from "./ExperimentPlacementEvaluator.js";

const ExperimentSimulationEngine = {

    // --------------------------------------------------
    // Find one criterion in an evaluator report
    // --------------------------------------------------
    getCriterion(
        report,
        criterionId
    ) {

        return (
            report?.criteria ?? []
        ).find(criterion =>
            criterion.id === criterionId
        ) ?? null;

    },

    // --------------------------------------------------
    // Read a human-facing name for one semantic zone
    // --------------------------------------------------
    getZoneLabel(
        semanticZones,
        zoneId
    ) {

        if (
            semanticZones?.assignments?.cytosol ===
            zoneId
        ) {
            return "cytosol";
        }

        if (
            semanticZones?.assignments
                ?.extracellular ===
            zoneId
        ) {
            return "extracellular solution";
        }

        return zoneId ?? "an unidentified region";

    },

    // --------------------------------------------------
    // Simulate osmosis from final student placement
    // --------------------------------------------------
    runOsmosis(
        experiment,
        placementSnapshot
    ) {

        const assessment =
            experiment?.assessment;

        const gradientRuleId =
            experiment?.simulation
                ?.ionGradientRuleId;

        const evaluation =
            ExperimentPlacementEvaluator.evaluate(
                {
                    assessment,

                    snapshot:
                        placementSnapshot,

                    reflectionResponses: {}
                }
            );

        const gradientCriterion =
            this.getCriterion(
                evaluation,
                "sodium_gradient"
            );

        const gradient =
            gradientCriterion?.details;

        const hasBalancedSolute =
            gradient?.eachSideIsBalanced ===
            true;

        const higherZoneId =
            gradient?.higherZoneId ?? null;

        const lowerZoneId =
            gradient?.lowerZoneId ?? null;

        const higherZoneLabel =
            this.getZoneLabel(
                evaluation.semanticZones,
                higherZoneId
            );

        const lowerZoneLabel =
            this.getZoneLabel(
                evaluation.semanticZones,
                lowerZoneId
            );

        if (
            !evaluation.semanticZones?.valid
        ) {
            return {

                modelId:
                    "osmosis",

                simulated:
                    true,

                netDirection:
                    null,

                message:
                    "The simulation cannot identify two distinct solutions because Cytosol and Extracellular Solution must be placed on opposite sides.",

                details: {
                    semanticZones:
                        evaluation.semanticZones
                }

            };
        }

        if (!hasBalancedSolute) {
            return {

                modelId:
                    "osmosis",

                simulated:
                    true,

                netDirection:
                    null,

                message:
                    "No stable osmotic comparison is available because each solution must contain electrically balanced solute.",

                details: {
                    gradient
                }

            };
        }

        if (
            !higherZoneId ||
            !lowerZoneId ||
            higherZoneId === lowerZoneId
        ) {
            return {

                modelId:
                    "osmosis",

                simulated:
                    true,

                netDirection:
                    null,

                message:
                    "No net water direction is produced because the solutions do not have a distinguishable solute difference.",

                details: {
                    gradient
                }

            };
        }

        return {

            modelId:
                "osmosis",

            simulated:
                true,

            netDirection: {
                fromZoneId:
                    lowerZoneId,

                toZoneId:
                    higherZoneId,

                fromLabel:
                    lowerZoneLabel,

                toLabel:
                    higherZoneLabel
            },

            message:
                `Net water movement is from ${lowerZoneLabel} toward ${higherZoneLabel} because water moves toward the side with the greater balanced solute concentration.`,

            details: {
                gradient
            }

        };

    },

    // --------------------------------------------------
    // Run the experiment's configured simulation model
    // --------------------------------------------------
    run({
        experiment,
        placementSnapshot
    } = {}) {

        const modelId =
            experiment?.simulation?.modelId;

        if (modelId === "osmosis") {
            return this.runOsmosis(
                experiment,
                placementSnapshot
            );
        }

        return {

            modelId:
                modelId ?? null,

            simulated:
                false,

            netDirection:
                null,

            message:
                "No simulation model is configured for this experiment.",

            details: {}

        };

    }

};

export default ExperimentSimulationEngine;