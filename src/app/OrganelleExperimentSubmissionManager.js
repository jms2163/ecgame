// --------------------------------------------------
// OrganelleExperimentSubmissionManager.js
// Persists scored experiment submissions, best scores,
// and concise Journal records in GameState.
// --------------------------------------------------

import gameState from "./GameState.js";

const OrganelleExperimentSubmissionManager = {

    // --------------------------------------------------
    // Ensure older saves receive every required registry.
    // --------------------------------------------------
    ensureRegistryStructures() {

        gameState.registry ??= {};

        gameState.registry.journal ??= [];

        gameState.registry.research ??= {};

        gameState.registry.research
            .experimentSubmissions ??= {};

        gameState.registry.research
            .bestExperimentScores ??= {};

        gameState.registry.research
            .stars ??= {};

    },

    // --------------------------------------------------
    // Create a submission identifier unique within a save.
    // --------------------------------------------------
    createSubmissionId(
        experimentId,
        submittedAtMs
    ) {

        const records =
            gameState.registry.research
                .experimentSubmissions[
                    experimentId
                ] ?? [];

        return `${experimentId}-submission-${submittedAtMs}-${records.length + 1}`;

    },

    // --------------------------------------------------
    // Match optional technical vocabulary without making
    // it part of the score required for completion.
    // --------------------------------------------------
    getTechnicalVocabularyMatches(
        experiment,
        attemptSnapshot
    ) {

        const reflection =
            experiment?.assessment?.reflection;

        const response =
            attemptSnapshot?.reflectionResponses?.[
                reflection?.id
            ] ?? "";

        const normalizedResponse =
            String(response).toLowerCase();

        return (
            reflection?.technicalVocabulary ?? []
        ).filter(term => {

            const escapedTerm = String(term)
                .replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                );

            return new RegExp(
                `(^|[^a-z0-9])${escapedTerm.toLowerCase()}([^a-z0-9]|$)`,
                "i"
            ).test(normalizedResponse);

        });

    },

    // --------------------------------------------------
    // Store one scored submission and update the best score.
    // A submission is recorded whether or not it is perfect.
    // --------------------------------------------------
    recordSubmission({
        experiment,
        report,
        placementSnapshot,
        attemptSnapshot,
        completion
    }) {

        const experimentId =
            experiment?.id;

        if (
            !experimentId ||
            !Number.isFinite(report?.scorePoints) ||
            !Number.isFinite(report?.scoreMaximum)
        ) {
            console.warn(
                "OrganelleExperimentSubmissionManager: complete submission data is required"
            );

            return null;
        }

        this.ensureRegistryStructures();

        const submittedAtMs =
            Date.now();

        const submission = {
            id: this.createSubmissionId(
                experimentId,
                submittedAtMs
            ),

            experimentId,
            experimentTitle:
                experiment.title ??
                experimentId,

            submittedAtMs,

            scorePoints:
                report.scorePoints,

            scoreMaximum:
                report.scoreMaximum,

            scorePercent:
                report.scorePercent,

            isPerfect:
                Boolean(report.isPerfect),

            technicalVocabularyMatches:
                this.getTechnicalVocabularyMatches(
                    experiment,
                    attemptSnapshot
                ),

            placementSnapshot:
                structuredClone(
                    placementSnapshot ?? {}
                ),

            attemptSnapshot:
                structuredClone(
                    attemptSnapshot ?? {}
                ),

            researchCompletion:
                completion
                    ? structuredClone(completion)
                    : null
        };

        const research =
            gameState.registry.research;

        research.experimentSubmissions[
            experimentId
        ] ??= [];

        research.experimentSubmissions[
            experimentId
        ].push(submission);

        const earnsStar =
            submission.isPerfect &&
            submission.technicalVocabularyMatches
                .length > 0;

        const wasStarAwarded =
            earnsStar &&
            !research.stars[experimentId];

        if (wasStarAwarded) {
            research.stars[experimentId] = {
                awardedAtMs: submittedAtMs,
                sourceSubmissionId: submission.id,
                reason: "technical-vocabulary",
                matchedTerms:
                    structuredClone(
                        submission
                            .technicalVocabularyMatches
                    )
            };
        }

        const currentBest =
            research.bestExperimentScores[
                experimentId
            ];

        if (
            !currentBest ||
            submission.scorePoints >
                currentBest.scorePoints
        ) {
            research.bestExperimentScores[
                experimentId
            ] = {
                submissionId: submission.id,
                scorePoints: submission.scorePoints,
                scoreMaximum: submission.scoreMaximum,
                scorePercent: submission.scorePercent,
                isPerfect: submission.isPerfect,
                achievedAtMs: submittedAtMs
            };
        }

        gameState.registry.journal.push(
            {
                id: `journal-${submission.id}`,
                type: "organelle-experiment-submission",
                createdAtMs: submittedAtMs,
                experimentId,
                submissionId: submission.id,
                title:
                    `${submission.experimentTitle}: ${submission.scorePoints} / ${submission.scoreMaximum}`,
                scorePoints: submission.scorePoints,
                scoreMaximum: submission.scoreMaximum,
                isPerfect: submission.isPerfect,
                completedResearch:
                    Boolean(completion?.completed),
                earnedStar: wasStarAwarded
            }
        );

        return structuredClone(submission);

    },

    // --------------------------------------------------
    // Read persistent submission history for one lab.
    // --------------------------------------------------
    getSubmissions(experimentId) {

        this.ensureRegistryStructures();

        return structuredClone(
            gameState.registry.research
                .experimentSubmissions[
                    experimentId
                ] ?? []
        );

    },

    // --------------------------------------------------
    // Read the highest persisted score for one lab.
    // --------------------------------------------------
    getBestScore(experimentId) {

        this.ensureRegistryStructures();

        const score =
            gameState.registry.research
                .bestExperimentScores[
                    experimentId
                ] ?? null;

        return score
            ? structuredClone(score)
            : null;

    }

    ,

    // --------------------------------------------------
    // Read the persisted exceptional-work star, if earned.
    // --------------------------------------------------
    getStar(experimentId) {

        this.ensureRegistryStructures();

        const star =
            gameState.registry.research.stars[
                experimentId
            ] ?? null;

        return star
            ? structuredClone(star)
            : null;

    }

};

export default OrganelleExperimentSubmissionManager;
