// --------------------------------------------------
// InvestigationClassComparisonModel.js
// Pure anonymous submission and aggregate data model
// --------------------------------------------------

const MATCHING_FIELD_ORDER = [
    "activityId",
    "modelVersion",
    "background",
    "startingPigmentedFrequency",
    "finalGeneration",
    "visualCalibrationProfileId",
    "pigmentationLevel",
    "brownBackgroundLevel",
    "interactionMode"
];

const clone = value =>
    structuredClone(value);

const requireNonEmptyString = (
    value,
    label
) => {
    if (
        typeof value !== "string" ||
        value.trim() === ""
    ) {
        throw new TypeError(
            `${label} is required.`
        );
    }
    return value.trim();
};

const requireFiniteNumber = (
    value,
    label
) => {
    if (!Number.isFinite(value)) {
        throw new TypeError(
            `${label} must be a finite number.`
        );
    }
    return value;
};

const normalizeScenario = report => {
    const visual =
        report.scenario.visualCalibration ?? {};

    return {
        activityId:
            requireNonEmptyString(
                report.attempt.activityId,
                "Activity id"
            ),
        modelVersion:
            requireNonEmptyString(
                report.attempt.modelVersion,
                "Model version"
            ),
        background:
            requireNonEmptyString(
                report.scenario.background,
                "Background"
            ),
        startingPigmentedFrequency:
            requireNonEmptyString(
                String(
                    report.scenario
                        .startingPigmentedFrequency
                ),
                "Starting pigmented frequency"
            ),
        finalGeneration:
            requireFiniteNumber(
                report.scenario.finalGeneration,
                "Final generation"
            ),
        visualCalibrationProfileId:
            requireNonEmptyString(
                visual.profileId,
                "Visual calibration profile"
            ),
        pigmentationLevel:
            requireFiniteNumber(
                visual.pigmentationLevel,
                "Pigmentation level"
            ),
        brownBackgroundLevel:
            requireFiniteNumber(
                visual.brownBackgroundLevel,
                "Brown background level"
            ),
        interactionMode:
            requireNonEmptyString(
                report.scenario.interactionMode,
                "Interaction mode"
            )
    };
};

const createScenarioKey = scenario =>
    MATCHING_FIELD_ORDER.map(
        fieldName =>
            encodeURIComponent(
                String(
                    scenario[fieldName]
                )
            )
    ).join("|");

const requireCompleteReport = report => {
    if (
        !report?.attempt?.sessionId ||
        !report?.scenario ||
        !Array.isArray(
            report?.data?.generations
        ) ||
        report.data.generations.length < 2
    ) {
        throw new TypeError(
            "A complete natural-selection report is required."
        );
    }
};

const createObservations = report =>
    report.data.generations.map(row => {
        const pigmentedCount =
            row.startingCounts?.pigmented;
        const nonPigmentedCount =
            row.startingCounts?.non_pigmented;

        if (
            !Number.isInteger(pigmentedCount) ||
            !Number.isInteger(nonPigmentedCount) ||
            pigmentedCount < 0 ||
            nonPigmentedCount < 0
        ) {
            throw new TypeError(
                `Generation ${row.generation} requires valid phenotype counts.`
            );
        }

        return {
            generation: row.generation,
            pigmentedCount,
            nonPigmentedCount
        };
    });

const createAuditSummary = report => {
    const selectedRows =
        report.data.generations.filter(
            row => !row.isFinalObservation
        );

    return {
        attemptNumber:
            report.attempt.attemptNumber ?? 1,
        priorRestartCount:
            report.attempt.priorRestartCount ?? 0,
        totalCaptureAttempts:
            selectedRows.reduce(
                (
                    total,
                    row
                ) =>
                    total +
                    (row.captureAttempts ?? 0),
                0
            ),
        totalSuccessfulCaptures:
            selectedRows.reduce(
                (
                    total,
                    row
                ) =>
                    total +
                    (row.successfulCaptures ?? 0),
                0
            )
    };
};

const normalizeAggregatePoints = (
    points,
    label,
    finalGeneration
) => {
    if (
        !Array.isArray(points) ||
        points.length !==
            finalGeneration + 1
    ) {
        throw new TypeError(
            `${label} aggregate points are incomplete.`
        );
    }

    return points.map(
        (
            point,
            index
        ) => {
            const generation =
                Number(point.generation);
            const frequency =
                Number(point.frequency);

            if (
                generation !== index ||
                !Number.isFinite(frequency) ||
                frequency < 0 ||
                frequency > 1
            ) {
                throw new TypeError(
                    `${label} aggregate point ${index} is invalid.`
                );
            }

            return {
                generation,
                frequency,
                percentage:
                    frequency * 100
            };
        }
    );
};

const InvestigationClassComparisonModel = {

    MATCHING_FIELD_ORDER,

    createScenario(report) {
        requireCompleteReport(report);
        return normalizeScenario(report);
    },

    createScenarioKey,

    createSubmission({
        report,
        cohortId,
        anonymousParticipantId,
        submissionId,
        schemaVersion,
        submittedAtMs = Date.now()
    }) {
        requireCompleteReport(report);

        const scenario =
            normalizeScenario(report);
        const normalizedCohortId =
            requireNonEmptyString(
                cohortId,
                "Cohort id"
            );

        return {
            action: "submit",
            schemaVersion:
                requireNonEmptyString(
                    schemaVersion,
                    "Submission schema version"
                ),
            cohortId:
                normalizedCohortId,
            submissionId:
                requireNonEmptyString(
                    submissionId,
                    "Submission id"
                ),
            anonymousParticipantId:
                requireNonEmptyString(
                    anonymousParticipantId,
                    "Anonymous participant id"
                ),
            submittedAtMs:
                requireFiniteNumber(
                    submittedAtMs,
                    "Submission time"
                ),
            sourceSessionId:
                requireNonEmptyString(
                    report.attempt.sessionId,
                    "Source session id"
                ),
            scenario,
            scenarioKey:
                createScenarioKey(
                    scenario
                ),
            population: {
                carryingCapacity:
                    report.scenario
                        .carryingCapacity,
                successfulCapturesPerGeneration:
                    report.scenario
                        .successfulCapturesPerGeneration
            },
            observations:
                createObservations(report),
            audit:
                createAuditSummary(report)
        };
    },

    normalizeAggregate({
        response,
        expectedSchemaVersion,
        expectedScenarioKey,
        minimumMatchingTrials
    }) {
        if (
            !response ||
            response.schemaVersion !==
                expectedSchemaVersion
        ) {
            throw new TypeError(
                "The class-average response uses an incompatible schema."
            );
        }

        if (
            response.scenarioKey !==
                expectedScenarioKey
        ) {
            throw new RangeError(
                "The class-average response does not match this scenario."
            );
        }

        const matchingTrialCount =
            Number(
                response.matchingTrialCount
            );
        const requiredMinimum =
            Number(
                response.requiredMinimum ??
                minimumMatchingTrials
            );

        if (
            !Number.isInteger(
                matchingTrialCount
            ) ||
            matchingTrialCount < 0 ||
            !Number.isInteger(
                requiredMinimum
            ) ||
            requiredMinimum < 1
        ) {
            throw new TypeError(
                "The class-average trial counts are invalid."
            );
        }

        if (
            response.status ===
            "insufficient_data"
        ) {
            return {
                status:
                    "insufficient_data",
                scenarioKey:
                    response.scenarioKey,
                matchingTrialCount,
                requiredMinimum,
                scenario:
                    clone(
                        response.scenario ?? {}
                    ),
                series: []
            };
        }

        if (response.status !== "ready") {
            throw new Error(
                response.message ||
                "The class average is unavailable."
            );
        }

        const finalGeneration =
            Number(
                response.scenario
                    ?.finalGeneration
            );
        const seriesById =
            new Map(
                (response.series ?? [])
                    .map(series => [
                        series.phenotypeId,
                        series
                    ])
            );

        if (
            !Number.isInteger(
                finalGeneration
            ) ||
            finalGeneration < 1
        ) {
            throw new TypeError(
                "The class-average generation range is invalid."
            );
        }

        const series = [
            [
                "pigmented",
                "Pigmented"
            ],
            [
                "non_pigmented",
                "Non-pigmented"
            ]
        ].map(
            ([phenotypeId, label]) => ({
                phenotypeId,
                label,
                points:
                    normalizeAggregatePoints(
                        seriesById.get(
                            phenotypeId
                        )?.points,
                        label,
                        finalGeneration
                    )
            })
        );

        return {
            status: "ready",
            scenarioKey:
                response.scenarioKey,
            matchingTrialCount,
            requiredMinimum,
            scenario:
                clone(response.scenario),
            series
        };
    }

};

export {
    MATCHING_FIELD_ORDER,
    createScenarioKey
};

export default InvestigationClassComparisonModel;
