// --------------------------------------------------
// InvestigationPlanModel.js
// Pure scientific-method plan state and validation
// --------------------------------------------------

const clone = value =>
    structuredClone(value);

const requireDefinition = definition => {

    if (
        !definition?.schemaVersion ||
        !Array.isArray(
            definition.questionChecklist
        ) ||
        !Array.isArray(
            definition.hypothesis?.options
        ) ||
        !Array.isArray(
            definition.variableItems
        ) ||
        !definition.minimumResponseLengths
    ) {
        throw new TypeError(
            "A complete investigation-plan definition is required."
        );
    }

};

const createBlankChecklist = definition =>
    Object.fromEntries(
        definition.questionChecklist.map(
            item => [
                item.id,
                false
            ]
        )
    );

const createBlankClassifications =
    definition =>
        Object.fromEntries(
            definition.variableItems.map(
                item => [
                    item.id,
                    ""
                ]
            )
        );

const createBlankFeedback = definition =>
    Object.fromEntries(
        definition.variableItems.map(
            item => [
                item.id,
                {
                    correct: null,
                    message: ""
                }
            ]
        )
    );

const getPredictionOption = (
    definition,
    optionId
) =>
    definition.hypothesis.options
        .find(
            option =>
                option.id === optionId
        ) ?? null;

const getTrimmedLength = value =>
    typeof value === "string"
        ? value.trim().length
        : 0;

const InvestigationPlanModel = {

    createDraft({
        enabled,
        definition
    }) {

        requireDefinition(definition);

        const planEnabled =
            Boolean(enabled);
        const rolesProvided =
            planEnabled &&
            definition
                .variableClassificationMode ===
                "provided_by_activity";
        const classifications = rolesProvided
            ? Object.fromEntries(
                definition.variableItems.map(
                    item => [
                        item.id,
                        item.correctRoleId
                    ]
                )
            )
            : createBlankClassifications(
                definition
            );

        return {
            schemaVersion:
                definition.schemaVersion,
            enabled:
                planEnabled,
            status:
                planEnabled
                    ? "draft"
                    : "bypassed",
            classResearchQuestion:
                definition
                    .classResearchQuestion,
            estimatedMinutes: {
                ...definition
                    .estimatedMinutes
            },
            researchQuestion: "",
            researchQuestionGuidanceMode:
                planEnabled
                    ? "activity_scaffolded"
                    : "bypassed",
            researchQuestionChecklist:
                createBlankChecklist(
                    definition
                ),
            hypothesis: {
                expectedTrendId: "",
                expectedTrendLabel: "",
                rationale: ""
            },
            variables: {
                assignmentMode: rolesProvided
                    ? "provided_by_activity"
                    : "student_classification",
                classifications,
                checkAttempts: 0,
                checked: rolesProvided,
                allCorrect: rolesProvided,
                feedback:
                    createBlankFeedback(
                        definition
                    ),
                controlsExplanation: ""
            },
            confirmedSetupSignature: "",
            confirmedAtMs: null,
            reviewRequired: false,
            reviewReason: ""
        };

    },

    createSetupSignature(setup) {

        if (!setup) {
            return "";
        }

        return JSON.stringify({
            activityId:
                setup.activityId,
            modelVersion:
                setup.modelVersion,
            background:
                setup.parameters
                    ?.background,
            startingPigmentedFrequency:
                setup.parameters
                    ?.startingPigmentedFrequency,
            finalGeneration:
                setup.parameters
                    ?.finalGeneration,
            carryingCapacity:
                setup.population
                    ?.carryingCapacity,
            successfulCapturesPerGeneration:
                setup.population
                    ?.successfulCapturesPerGeneration,
            reproductionStrategy:
                setup.population
                    ?.reproductionStrategy,
            visualCalibrationProfileId:
                setup.visualCalibration
                    ?.profileId
        });

    },

    invalidateConfirmation(
        draft,
        reviewReason =
            "response_changed"
    ) {

        const nextDraft =
            clone(draft);
        const wasComplete =
            nextDraft.status ===
            "complete";

        if (!nextDraft.enabled) {
            nextDraft.status =
                "bypassed";

            return nextDraft;
        }

        nextDraft.status = "draft";
        nextDraft.confirmedSetupSignature =
            "";
        nextDraft.confirmedAtMs = null;

        if (wasComplete) {
            nextDraft.reviewRequired =
                true;
            nextDraft.reviewReason =
                reviewReason;
        }

        return nextDraft;

    },

    invalidateVariableCheck(draft) {

        const nextDraft =
            this.invalidateConfirmation(
                draft
            );

        nextDraft.variables.checked = false;
        nextDraft.variables.allCorrect =
            false;

        Object.values(
            nextDraft.variables.feedback
        ).forEach(
            feedback => {
                feedback.correct = null;
                feedback.message = "";
            }
        );

        return nextDraft;

    },

    checkVariables(
        draft,
        definition
    ) {

        requireDefinition(definition);

        const nextDraft =
            this.invalidateConfirmation(
                draft
            );

        nextDraft.variables.checkAttempts += 1;
        nextDraft.variables.checked = true;

        let allCorrect = true;

        definition.variableItems.forEach(
            item => {

                const correct =
                    nextDraft.variables
                        .classifications[
                            item.id
                        ] ===
                    item.correctRoleId;

                nextDraft.variables.feedback[
                    item.id
                ] = {
                    correct,
                    message:
                        correct
                            ? "Correct."
                            : item
                                .correctiveFeedback
                };

                if (!correct) {
                    allCorrect = false;
                }

            }
        );

        nextDraft.variables.allCorrect =
            allCorrect;

        return nextDraft;

    },

    getCompletionState(
        draft,
        definition,
        setup
    ) {

        requireDefinition(definition);

        if (!draft.enabled) {
            return {
                setupComplete: true,
                researchQuestionComplete:
                    true,
                checklistComplete: true,
                hypothesisComplete: true,
                variablesComplete: true,
                controlsExplanationComplete:
                    true,
                canConfirm: true,
                ready: true
            };
        }

        const setupSignature =
            this.createSetupSignature(
                setup
            );
        const setupComplete =
            setupSignature.length > 0;
        const minimumLengths =
            definition
                .minimumResponseLengths;
        const researchQuestionComplete =
            getTrimmedLength(
                draft.researchQuestion
            ) >=
            minimumLengths
                .researchQuestion;
        const checklistComplete =
            draft.researchQuestionGuidanceMode ===
                "activity_scaffolded" ||
            definition.questionChecklist.every(
                item =>
                    draft
                        .researchQuestionChecklist[
                            item.id
                        ] === true
            );
        const prediction =
            getPredictionOption(
                definition,
                draft.hypothesis
                    .expectedTrendId
            );
        const hypothesisComplete =
            prediction !== null &&
            getTrimmedLength(
                draft.hypothesis
                    .rationale
            ) >=
            minimumLengths
                .hypothesisRationale;
        const variablesComplete =
            draft.variables.assignmentMode ===
                "provided_by_activity" ||
            (
                draft.variables.checked &&
                draft.variables.allCorrect
            );
        const controlsExplanationComplete =
            getTrimmedLength(
                draft.variables
                    .controlsExplanation
            ) >=
            minimumLengths
                .controlsExplanation;
        const canConfirm = [
            setupComplete,
            researchQuestionComplete,
            checklistComplete,
            hypothesisComplete,
            variablesComplete,
            controlsExplanationComplete
        ].every(Boolean);
        const ready =
            canConfirm &&
            draft.status === "complete" &&
            draft.confirmedSetupSignature ===
                setupSignature;

        return {
            setupComplete,
            researchQuestionComplete,
            checklistComplete,
            hypothesisComplete,
            variablesComplete,
            controlsExplanationComplete,
            canConfirm,
            ready
        };

    },

    confirm(
        draft,
        definition,
        setup,
        confirmedAtMs = Date.now()
    ) {

        const completion =
            this.getCompletionState(
                draft,
                definition,
                setup
            );

        if (!completion.canConfirm) {
            throw new Error(
                "Complete every investigation-plan requirement before confirmation."
            );
        }

        const nextDraft =
            clone(draft);
        const prediction =
            getPredictionOption(
                definition,
                nextDraft.hypothesis
                    .expectedTrendId
            );

        nextDraft.status = "complete";
        nextDraft.hypothesis
            .expectedTrendLabel =
                prediction?.label ?? "";
        nextDraft.confirmedSetupSignature =
            this.createSetupSignature(
                setup
            );
        nextDraft.confirmedAtMs =
            confirmedAtMs;
        nextDraft.reviewRequired = false;
        nextDraft.reviewReason = "";

        return nextDraft;

    },

    createSnapshot(
        draft,
        definition,
        setup
    ) {

        requireDefinition(definition);

        if (!draft.enabled) {
            return this.createDraft({
                enabled: false,
                definition
            });
        }

        const completion =
            this.getCompletionState(
                draft,
                definition,
                setup
            );

        if (!completion.ready) {
            throw new Error(
                "The investigation plan is not confirmed for the current setup."
            );
        }

        return clone(draft);

    }

};

export default InvestigationPlanModel;
