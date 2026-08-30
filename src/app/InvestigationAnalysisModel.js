// --------------------------------------------------
// InvestigationAnalysisModel.js
// Pure post-investigation assessment state and rules
// --------------------------------------------------

const clone = value => structuredClone(value);

const getTrimmedLength = value =>
    typeof value === "string"
        ? value.trim().length
        : 0;

const requireDefinition = definition => {
    if (
        !definition?.schemaVersion ||
        !Array.isArray(
            definition.hypothesisEvaluation
                ?.options
        ) ||
        !definition.cer ||
        !definition.reflection ||
        !definition.minimumResponseLengths
    ) {
        throw new TypeError(
            "A complete post-investigation analysis definition is required."
        );
    }
};

const getEvaluationOption = (
    definition,
    optionId
) => definition.hypothesisEvaluation
    .options.find(
        option => option.id === optionId
    ) ?? null;

const InvestigationAnalysisModel = {

    createDraft({ definition, sessionId }) {
        requireDefinition(definition);

        if (!sessionId) {
            throw new TypeError(
                "A session id is required for post-investigation analysis."
            );
        }

        return {
            schemaVersion: definition.schemaVersion,
            sessionId,
            status: "draft",
            hypothesisEvaluation: {
                outcomeId: "",
                outcomeLabel: "",
                explanation: ""
            },
            cer: {
                claim: "",
                evidence: "",
                reasoning: ""
            },
            reflection: {
                limitation: "",
                variation: "",
                improvement: ""
            },
            completedAtMs: null
        };
    },

    invalidateCompletion(draft) {
        const nextDraft = clone(draft);
        nextDraft.status = "draft";
        nextDraft.completedAtMs = null;
        return nextDraft;
    },

    getCompletionState(
        draft,
        definition,
        sessionId
    ) {
        requireDefinition(definition);

        const minimum =
            definition.minimumResponseLengths;
        const evaluationOption =
            getEvaluationOption(
                definition,
                draft.hypothesisEvaluation
                    .outcomeId
            );
        const sessionMatches =
            Boolean(sessionId) &&
            draft.sessionId === sessionId;
        const hypothesisComplete =
            evaluationOption !== null &&
            getTrimmedLength(
                draft.hypothesisEvaluation
                    .explanation
            ) >= minimum.hypothesisExplanation;
        const claimComplete =
            getTrimmedLength(
                draft.cer.claim
            ) >= minimum.claim;
        const evidenceComplete =
            getTrimmedLength(
                draft.cer.evidence
            ) >= minimum.evidence;
        const reasoningComplete =
            getTrimmedLength(
                draft.cer.reasoning
            ) >= minimum.reasoning;
        const cerComplete =
            claimComplete &&
            evidenceComplete &&
            reasoningComplete;
        const limitationComplete =
            getTrimmedLength(
                draft.reflection.limitation
            ) >= minimum.limitation;
        const variationComplete =
            getTrimmedLength(
                draft.reflection.variation
            ) >= minimum.variation;
        const improvementComplete =
            getTrimmedLength(
                draft.reflection.improvement
            ) >= minimum.improvement;
        const reflectionComplete =
            limitationComplete &&
            variationComplete &&
            improvementComplete;
        const canComplete =
            sessionMatches &&
            hypothesisComplete &&
            cerComplete &&
            reflectionComplete;
        const complete =
            canComplete &&
            draft.status === "complete";

        return {
            sessionMatches,
            hypothesisComplete,
            claimComplete,
            evidenceComplete,
            reasoningComplete,
            cerComplete,
            limitationComplete,
            variationComplete,
            improvementComplete,
            reflectionComplete,
            canComplete,
            complete
        };
    },

    complete(
        draft,
        definition,
        sessionId,
        completedAtMs = Date.now()
    ) {
        const completion = this.getCompletionState(
            draft,
            definition,
            sessionId
        );

        if (!completion.canComplete) {
            throw new Error(
                "Complete every post-investigation analysis response before submission."
            );
        }

        const nextDraft = clone(draft);
        const option = getEvaluationOption(
            definition,
            nextDraft.hypothesisEvaluation
                .outcomeId
        );

        nextDraft.hypothesisEvaluation
            .outcomeLabel = option?.title ?? "";
        nextDraft.status = "complete";
        nextDraft.completedAtMs = completedAtMs;
        return nextDraft;
    },

    createSnapshot(
        draft,
        definition,
        sessionId
    ) {
        const completion = this.getCompletionState(
            draft,
            definition,
            sessionId
        );

        if (!completion.complete) {
            throw new Error(
                "The post-investigation analysis is not complete."
            );
        }

        return clone(draft);
    }
};

export default InvestigationAnalysisModel;
