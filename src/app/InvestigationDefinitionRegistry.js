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

        if (!Array.isArray(definition?.parameters)) {
            errors.push(
                "Investigation definition requires a parameters array."
            );

            return errors;
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
