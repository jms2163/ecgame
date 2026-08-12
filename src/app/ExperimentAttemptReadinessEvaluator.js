// --------------------------------------------------
// ExperimentAttemptReadinessEvaluator.js
// Determines whether an experiment attempt is complete
// enough to run its simulation. It does not grade science.
// --------------------------------------------------

const ExperimentAttemptReadinessEvaluator = {

    // --------------------------------------------------
    // Read IDs from string or object references
    // --------------------------------------------------
    getDefinitionIds(references = []) {

        return references
            .map(reference =>
                typeof reference === "string"
                    ? reference
                    : reference?.id
            )
            .filter(Boolean);

    },

    // --------------------------------------------------
    // Find all placed IDs for one placement collection
    // --------------------------------------------------
    getPlacedIds(placements = []) {

        return new Set(
            placements
                .map(placement =>
                    placement.id
                )
                .filter(Boolean)
        );

    },

    // --------------------------------------------------
    // Determine whether the reflection contains text
    // --------------------------------------------------
    hasReflectionResponse(
        experiment,
        attemptSnapshot
    ) {

        const reflectionId =
            experiment.assessment
                ?.reflection
                ?.id;

        if (!reflectionId) {
            return true;
        }

        const response =
            attemptSnapshot
                ?.reflectionResponses
                ?.[reflectionId] ?? "";

        return response.trim().length > 0;

    },

    // --------------------------------------------------
    // Evaluate temporary attempt completeness
    // --------------------------------------------------
    evaluate({
        experiment,
        placementSnapshot,
        attemptSnapshot
    } = {}) {

        if (!experiment) {
            return {
                ready: false,
                missingMaterials: [],
                missingLabels: [],
                reflectionComplete: false,
                errors: [
                    "Experiment definition is unavailable"
                ]
            };
        }

        const requiredMaterialIds =
            this.getDefinitionIds(
                experiment.stage?.materials
            );

        const requiredLabelIds =
            this.getDefinitionIds(
                experiment.stage?.labels
            );

        const placedMaterialIds =
            this.getPlacedIds(
                placementSnapshot?.components
            );

        const placedLabelIds =
            this.getPlacedIds(
                placementSnapshot?.labels
            );

        const missingMaterials =
            requiredMaterialIds.filter(materialId =>
                !placedMaterialIds.has(
                    materialId
                )
            );

        const missingLabels =
            requiredLabelIds.filter(labelId =>
                !placedLabelIds.has(
                    labelId
                )
            );

        const reflectionComplete =
            this.hasReflectionResponse(
                experiment,
                attemptSnapshot
            );

        const ready =
            missingMaterials.length === 0 &&
            missingLabels.length === 0 &&
            reflectionComplete;

        return {

            ready,

            missingMaterials,

            missingLabels,

            reflectionComplete,

            errors: []

        };

    }

};

export default ExperimentAttemptReadinessEvaluator;