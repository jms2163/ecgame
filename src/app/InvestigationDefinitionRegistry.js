// --------------------------------------------------
// InvestigationDefinitionRegistry.js
// Validates and resolves InvestigationCatalog data
// --------------------------------------------------

import InvestigationCatalog
    from "./InvestigationCatalog.js";

const clone = value =>
    structuredClone(value);

const InvestigationDefinitionRegistry = {

    validate(definition) {

        const errors = [];

        if (!definition?.id) {
            errors.push(
                "Investigation definition requires an id."
            );
        }

        if (!definition?.modelVersion) {
            errors.push(
                "Investigation definition requires a modelVersion."
            );
        }

        if (
            !Array.isArray(
                definition?.trait?.phenotypes
            ) ||
            definition.trait.phenotypes.length < 2
        ) {
            errors.push(
                "Investigation definition requires at least two trait phenotypes."
            );
        }

        if (
            !Number.isInteger(
                definition?.population
                    ?.carryingCapacity
            ) ||
            definition.population
                .carryingCapacity <= 0
        ) {
            errors.push(
                "Investigation population requires a positive carryingCapacity."
            );
        }

        if (
            definition?.selectivePressure
                ?.strategyId ===
                "student_visual_predation" &&
            (
                !Number.isInteger(
                    definition?.population
                        ?.successfulCapturesPerGeneration
                ) ||
                definition.population
                    .successfulCapturesPerGeneration <= 0
            )
        ) {
            errors.push(
                "Visual-predation investigations require a positive successfulCapturesPerGeneration."
            );
        }

        if (
            !definition?.population
                ?.reproductionStrategy
        ) {
            errors.push(
                "Investigation population requires a reproductionStrategy."
            );
        }

        if (!Array.isArray(definition?.parameters)) {
            errors.push(
                "Investigation definition requires a parameters array."
            );

            return errors;
        }

        if (definition?.investigationPlan) {
            const plan =
                definition.investigationPlan;

            if (
                !plan.schemaVersion ||
                !plan.classResearchQuestion ||
                !Number.isInteger(
                    plan.estimatedMinutes
                        ?.minimum
                ) ||
                !Number.isInteger(
                    plan.estimatedMinutes
                        ?.maximum
                ) ||
                plan.estimatedMinutes.minimum <= 0 ||
                plan.estimatedMinutes.maximum <
                    plan.estimatedMinutes.minimum
            ) {
                errors.push(
                    "Investigation plan requires a schema version, class question, and valid time estimate."
                );
            }

            if (
                !Array.isArray(
                    plan.questionChecklist
                ) ||
                plan.questionChecklist.length === 0 ||
                !Array.isArray(
                    plan.hypothesis?.options
                ) ||
                plan.hypothesis.options.length === 0 ||
                !Array.isArray(
                    plan.variableRoles
                ) ||
                plan.variableRoles.length === 0 ||
                !Array.isArray(
                    plan.variableItems
                ) ||
                plan.variableItems.length === 0
            ) {
                errors.push(
                    "Investigation plan requires checklist, hypothesis, and variable-classification data."
                );
            }
        }

        if (definition?.postInvestigationAnalysis) {
            const analysis =
                definition
                    .postInvestigationAnalysis;

            if (
                !analysis.schemaVersion ||
                !Number.isInteger(
                    analysis.estimatedMinutes
                        ?.minimum
                ) ||
                !Number.isInteger(
                    analysis.estimatedMinutes
                        ?.maximum
                ) ||
                analysis.estimatedMinutes.minimum <= 0 ||
                analysis.estimatedMinutes.maximum <
                    analysis.estimatedMinutes.minimum ||
                !Array.isArray(
                    analysis
                        .hypothesisEvaluation
                        ?.options
                ) ||
                analysis.hypothesisEvaluation
                    .options.length !== 3 ||
                !analysis.cer?.claimPrompt ||
                !analysis.cer?.evidencePrompt ||
                !analysis.cer?.reasoningPrompt ||
                !analysis.reflection
                    ?.limitationPrompt ||
                !analysis.reflection
                    ?.variationPrompt ||
                !analysis.reflection
                    ?.improvementPrompt ||
                !analysis.minimumResponseLengths
            ) {
                errors.push(
                    "Post-investigation analysis requires valid timing, hypothesis-evaluation, CER, reflection, and response-length data."
                );
            }
        }

        const parameterIds = new Set();

        definition.parameters.forEach(
            parameter => {

                if (!parameter?.id) {
                    errors.push(
                        "Every investigation parameter requires an id."
                    );

                    return;
                }

                if (parameterIds.has(parameter.id)) {
                    errors.push(
                        `Duplicate investigation parameter id: ${parameter.id}`
                    );
                }

                parameterIds.add(
                    parameter.id
                );

                if (
                    !Array.isArray(parameter.options) ||
                    parameter.options.length === 0
                ) {
                    errors.push(
                        `Parameter ${parameter.id} requires options.`
                    );

                    return;
                }

                const optionIds =
                    new Set(
                        parameter.options.map(
                            option => option.id
                        )
                    );

                if (
                    parameter.defaultOptionId !== null &&
                    !optionIds.has(
                        parameter.defaultOptionId
                    )
                ) {
                    errors.push(
                        `Parameter ${parameter.id} has an invalid default option.`
                    );
                }

                if (
                    parameter.requiresExplicitSelection &&
                    parameter.defaultOptionId !== null
                ) {
                    errors.push(
                        `Parameter ${parameter.id} requires an explicit selection and cannot have a default.`
                    );
                }

            }
        );

        return errors;

    },

    get(investigationId) {

        const definition =
            InvestigationCatalog[
                investigationId
            ];

        if (!definition) {
            console.warn(
                `InvestigationDefinitionRegistry: unknown investigation "${investigationId}"`
            );

            return null;
        }

        const errors =
            this.validate(definition);

        if (errors.length > 0) {
            console.error(
                "InvestigationDefinitionRegistry: invalid definition",
                errors
            );

            return null;
        }

        return clone(definition);

    },

    createDefaultSelection(investigationId) {

        const definition =
            this.get(investigationId);

        if (!definition) {
            return null;
        }

        return Object.fromEntries(
            definition.parameters.map(
                parameter => [
                    parameter.id,
                    parameter.defaultOptionId
                ]
            )
        );

    }

};

export default InvestigationDefinitionRegistry;
