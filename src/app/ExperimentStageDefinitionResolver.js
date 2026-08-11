// --------------------------------------------------
// ExperimentStageDefinitionResolver.js
// Resolves reusable material, label, and action IDs
// into complete stage definitions
// --------------------------------------------------

import ExperimentActionLibrary from
    "./ExperimentActionLibrary.js";

import ExperimentLabelLibrary from
    "./ExperimentLabelLibrary.js";

import ExperimentMaterialLibrary from
    "./ExperimentMaterialLibrary.js";

const ExperimentStageDefinitionResolver = {

    // --------------------------------------------------
    // Resolve one reusable library definition
    // --------------------------------------------------
    resolveDefinition(
        reference,
        library,
        referenceType
    ) {

        const referenceId =
            typeof reference === "string"
                ? reference
                : reference?.id;

        const baseDefinition =
            library?.[referenceId];

        if (!baseDefinition) {
            console.warn(
                `ExperimentStageDefinitionResolver: unknown ${referenceType} "${referenceId}"`
            );

            return null;
        }

        const overrides =
            typeof reference === "object"
                ? reference
                : {};

        return {
            ...baseDefinition,
            ...overrides,
            id: baseDefinition.id
        };

    },

    // --------------------------------------------------
    // Resolve reusable stage materials
    // --------------------------------------------------
    resolveMaterials(materialReferences = []) {

        return materialReferences
            .map(reference =>
                this.resolveDefinition(
                    reference,
                    ExperimentMaterialLibrary,
                    "material"
                )
            )
            .filter(Boolean);

    },

    // --------------------------------------------------
    // Resolve reusable stage labels
    // --------------------------------------------------
    resolveLabels(labelReferences = []) {

        return labelReferences
            .map(reference =>
                this.resolveDefinition(
                    reference,
                    ExperimentLabelLibrary,
                    "label"
                )
            )
            .filter(Boolean);

    },

    // --------------------------------------------------
    // Resolve reusable stage actions
    // --------------------------------------------------
    resolveControls(controlReferences = []) {

        return controlReferences
            .map(reference =>
                this.resolveDefinition(
                    reference,
                    ExperimentActionLibrary,
                    "control"
                )
            )
            .filter(Boolean);

    },

    // --------------------------------------------------
    // Build a safe, complete stage definition
    // --------------------------------------------------
    resolveStage(stage = {}) {

        return {

            ...stage,

            materials:
                this.resolveMaterials(
                    stage.materials
                ),

            labels:
                this.resolveLabels(
                    stage.labels
                ),

            controls:
                this.resolveControls(
                    stage.controls
                )

        };

    }

};

export default ExperimentStageDefinitionResolver;