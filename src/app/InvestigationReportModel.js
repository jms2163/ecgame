// --------------------------------------------------
// InvestigationReportModel.js
// Pure report snapshot and plain-text formatting
// --------------------------------------------------

const REPORT_SCHEMA_VERSION =
    "natural-selection-report-v1";

const clone = value =>
    structuredClone(value);

const normalizeText = value =>
    typeof value === "string"
        ? value.trim()
        : "";

const formatPercent = value =>
    `${(value * 100).toFixed(1)}%`;

const formatPercentagePoints = value =>
    `${value > 0 ? "+" : ""}${value.toFixed(1)} percentage points`;

const displayText = value =>
    normalizeText(value) || "Not recorded";

const getPhenotypeLabel = (
    data,
    phenotypeId
) => data.phenotypes.find(
    phenotype => phenotype.id === phenotypeId
)?.label ?? phenotypeId;

const getSuccessfulCaptureTimes = record =>
    (record.selection?.events ?? [])
        .filter(event =>
            event.successful &&
            Number.isFinite(event.elapsedMs)
        )
        .map(event =>
            Number((event.elapsedMs / 1000).toFixed(2))
        );

const createGenerationRows = (
    session,
    data
) => data.rows.map(row => {
    const record = session.generationRecords.find(
        item => item.generation === row.generation
    );
    const metrics = record?.selection
        ?.strategyMetrics ?? null;

    return {
        generation: row.generation,
        isFinalObservation:
            row.isFinalObservation,
        startingCounts: clone(
            row.startPopulation.phenotypeCounts
        ),
        startingFrequencies: clone(
            row.startPopulation.phenotypeFrequencies
        ),
        capturedCounts: clone(
            row.selectionOutcomeCounts
        ),
        survivorCounts: row.survivors
            ? clone(row.survivors.phenotypeCounts)
            : null,
        nextGenerationCounts: row.nextGeneration
            ? clone(
                row.nextGeneration.phenotypeCounts
            )
            : null,
        captureAttempts:
            metrics?.captureAttempts ?? null,
        successfulCaptures:
            metrics?.successfulCaptures ?? null,
        successfulCaptureTimesSeconds:
            getSuccessfulCaptureTimes(record ?? {})
    };
});

const createVariableRows = definition =>
    (definition.investigationPlan
        ?.variableItems ?? [])
        .map(item => ({
            id: item.id,
            label: item.label,
            roleId: item.correctRoleId,
            roleLabel:
                definition.investigationPlan
                    .variableRoles.find(
                        role =>
                            role.id ===
                            item.correctRoleId
                    )?.label ??
                item.correctRoleId,
            explanation: item.explanation
        }));

const getParameterLabel = (
    definition,
    parameterId,
    selectedValue
) => definition.parameters.find(
    parameter => parameter.id === parameterId
)?.options.find(option =>
    String(
        option.finalGeneration ?? option.id
    ) === String(selectedValue)
)?.label ?? String(selectedValue);

const requireCompleteInputs = ({
    session,
    data,
    analysis,
    definition
}) => {
    if (
        !session?.sessionId ||
        session.phase !== "population_complete"
    ) {
        throw new Error(
            "A completed population investigation is required."
        );
    }
    if (
        !data?.sessionId ||
        data.sessionId !== session.sessionId ||
        !data.comparison?.isFinal
    ) {
        throw new Error(
            "Final generation data must match the investigation session."
        );
    }
    if (
        !analysis?.sessionId ||
        analysis.sessionId !== session.sessionId ||
        analysis.status !== "complete"
    ) {
        throw new Error(
            "A completed analysis must match the investigation session."
        );
    }
    if (
        !definition?.id ||
        definition.id !== session.investigationId
    ) {
        throw new Error(
            "The investigation definition must match the session."
        );
    }
};

const appendSection = (
    lines,
    title,
    entries
) => {
    lines.push("", title, "-".repeat(title.length));
    entries.forEach(entry => lines.push(entry));
};

const formatCountSet = (
    counts,
    phenotypeOrder
) => {
    if (!counts) {
        return "—";
    }
    return phenotypeOrder.map(
        phenotypeId =>
            `${counts[phenotypeId] ?? "—"}`
    ).join(" | ");
};

const InvestigationReportModel = {

    REPORT_SCHEMA_VERSION,

    createSnapshot({
        session,
        data,
        analysis,
        definition,
        player = {},
        generatedAtMs = Date.now()
    }) {
        requireCompleteInputs({
            session,
            data,
            analysis,
            definition
        });

        const plan = session.setup
            .investigationPlan ?? {};
        const phenotypeOrder =
            data.phenotypes.map(
                phenotype => phenotype.id
            );
        const background =
            session.setup.parameters.background;
        const startingFrequency =
            session.setup.parameters
                .startingPigmentedFrequency;
        const finalGeneration =
            session.setup.parameters
                .finalGeneration;

        return {
            schemaVersion:
                REPORT_SCHEMA_VERSION,
            generatedAtMs,
            identity: {
                playerName: normalizeText(
                    player.displayName ??
                    player.name
                )
            },
            attempt: {
                sessionId: session.sessionId,
                attemptNumber:
                    session.attemptNumber ?? 1,
                priorRestartCount:
                    session.priorRestartCount ?? 0,
                activityId: session.activityId,
                investigationId:
                    session.investigationId,
                definitionVersion:
                    session.definitionVersion,
                modelVersion:
                    session.modelVersion
            },
            scenario: {
                background,
                backgroundLabel:
                    getParameterLabel(
                        definition,
                        "background",
                        background
                    ),
                startingPigmentedFrequency:
                    startingFrequency,
                startingPopulationLabel:
                    getParameterLabel(
                        definition,
                        "startingPigmentedFrequency",
                        startingFrequency
                    ),
                finalGeneration,
                investigationLengthLabel:
                    getParameterLabel(
                        definition,
                        "finalGeneration",
                        finalGeneration
                    ),
                carryingCapacity:
                    session.setup.population
                        .carryingCapacity,
                successfulCapturesPerGeneration:
                    session.setup.population
                        .successfulCapturesPerGeneration,
                reproductionStrategy:
                    session.setup.population
                        .reproductionStrategy,
                inheritanceMode:
                    session.setup.trait
                        .inheritance.mode,
                mutationEnabled:
                    session.setup.trait
                        .inheritance
                        .mutationEnabled,
                interactionMode:
                    session.setup.interactionMode,
                visualCalibration: clone(
                    session.setup.visualCalibration ?? {}
                )
            },
            plan: {
                enabled: Boolean(plan.enabled),
                status: plan.status ?? "bypassed",
                researchQuestion:
                    normalizeText(
                        plan.researchQuestion
                    ),
                hypothesis: {
                    expectedTrendId:
                        plan.hypothesis
                            ?.expectedTrendId ?? "",
                    expectedTrendLabel:
                        normalizeText(
                            plan.hypothesis
                                ?.expectedTrendLabel
                        ),
                    rationale:
                        normalizeText(
                            plan.hypothesis
                                ?.rationale
                        )
                },
                variables:
                    createVariableRows(definition),
                controlsExplanation:
                    normalizeText(
                        plan.variables
                            ?.controlsExplanation
                    )
            },
            data: {
                phenotypes: clone(
                    data.phenotypes
                ),
                phenotypeOrder,
                generations:
                    createGenerationRows(
                        session,
                        data
                    ),
                initialPopulation: clone(
                    data.comparison
                        .initialPopulation
                ),
                finalPopulation: clone(
                    data.comparison
                        .latestPopulation
                ),
                frequencyChanges: clone(
                    data.comparison
                        .frequencyChanges
                ),
                graphReadySeries: clone(
                    data.frequencySeries
                )
            },
            analysis: clone(analysis)
        };
    },

    formatPlainText(report) {
        if (
            report?.schemaVersion !==
            REPORT_SCHEMA_VERSION
        ) {
            throw new TypeError(
                "A compatible investigation report is required."
            );
        }

        const lines = [
            "ECGAME NATURAL SELECTION INVESTIGATION REPORT",
            `Report format: ${report.schemaVersion}`
        ];
        const phenotypeOrder =
            report.data.phenotypeOrder;
        const phenotypeLabels =
            phenotypeOrder.map(
                phenotypeId =>
                    getPhenotypeLabel(
                        report.data,
                        phenotypeId
                    )
            );
        const analysis = report.analysis;

        appendSection(lines, "STUDENT AND ATTEMPT", [
            `Student / player name: ${displayText(report.identity.playerName)}`,
            `Report generated (UTC): ${new Date(report.generatedAtMs).toISOString()}`,
            `Session ID: ${report.attempt.sessionId}`,
            `Attempt number: ${report.attempt.attemptNumber}`,
            `Prior restarts: ${report.attempt.priorRestartCount}`,
            `Activity ID: ${report.attempt.activityId}`,
            `Investigation ID: ${report.attempt.investigationId}`,
            `Definition version: ${report.attempt.definitionVersion}`,
            `Scientific model version: ${report.attempt.modelVersion}`
        ]);

        appendSection(lines, "SCENARIO", [
            `Habitat: ${report.scenario.backgroundLabel}`,
            `Starting population: ${report.scenario.startingPopulationLabel} (carrying capacity ${report.scenario.carryingCapacity})`,
            `Study length: ${report.scenario.investigationLengthLabel}`,
            `Predation: ${report.scenario.successfulCapturesPerGeneration} successful captures per generation`,
            `Reproduction: clonal, proportional return to ${report.scenario.carryingCapacity}`,
            `Mutation: ${report.scenario.mutationEnabled ? "Enabled" : "Disabled"}`,
            `Interaction mode: ${report.scenario.interactionMode}`,
            `Visual calibration: ${report.scenario.visualCalibration.profileId ?? "Not recorded"}; pigmentation ${report.scenario.visualCalibration.pigmentationLevel ?? "—"}; brown background ${report.scenario.visualCalibration.brownBackgroundLevel ?? "—"}`
        ]);

        appendSection(lines, "INVESTIGATION PLAN", [
            `Planning scaffold: ${report.plan.enabled ? "Enabled" : "Bypassed"}`,
            `Research question: ${displayText(report.plan.researchQuestion)}`,
            `Hypothesis: ${displayText(report.plan.hypothesis.expectedTrendLabel)}`,
            `Hypothesis reasoning: ${displayText(report.plan.hypothesis.rationale)}`,
            "Variables:",
            ...report.plan.variables.map(
                variable =>
                    `- ${variable.label}: ${variable.roleLabel}. ${variable.explanation}`
            ),
            `Why controls matter: ${displayText(report.plan.controlsExplanation)}`
        ]);

        appendSection(lines, "GENERATION DATA", [
            `Columns: Generation | ${phenotypeLabels.join(" | ")} starting counts | ${phenotypeLabels.join(" | ")} starting frequencies | ${phenotypeLabels.join(" | ")} captured | ${phenotypeLabels.join(" | ")} survivors | capture attempts | successful captures`
        ]);
        report.data.generations.forEach(row => {
            const frequencies =
                phenotypeOrder.map(
                    phenotypeId =>
                        formatPercent(
                            row.startingFrequencies[
                                phenotypeId
                            ]
                        )
                ).join(" | ");
            lines.push(
                `${row.generation}${row.isFinalObservation ? " (final observation)" : ""} | ${formatCountSet(row.startingCounts, phenotypeOrder)} | ${frequencies} | ${formatCountSet(row.capturedCounts, phenotypeOrder)} | ${formatCountSet(row.survivorCounts, phenotypeOrder)} | ${row.captureAttempts ?? "—"} | ${row.successfulCaptures ?? "—"}`
            );
            if (
                row.successfulCaptureTimesSeconds
                    .length > 0
            ) {
                lines.push(
                    `  Successful capture times (seconds from generation start): ${row.successfulCaptureTimesSeconds.join(", ")}`
                );
            }
        });

        appendSection(lines, "INITIAL–FINAL COMPARISON", [
            ...phenotypeOrder.map(
                phenotypeId => {
                    const label =
                        getPhenotypeLabel(
                            report.data,
                            phenotypeId
                        );
                    const initial =
                        report.data
                            .initialPopulation;
                    const final =
                        report.data
                            .finalPopulation;
                    return `${label}: ${initial.phenotypeCounts[phenotypeId]} (${formatPercent(initial.phenotypeFrequencies[phenotypeId])}) to ${final.phenotypeCounts[phenotypeId]} (${formatPercent(final.phenotypeFrequencies[phenotypeId])}); change ${formatPercentagePoints(report.data.frequencyChanges[phenotypeId])}`;
                }
            )
        ]);

        appendSection(lines, "GRAPH-READY DATA (CSV)", [
            [
                "generation",
                ...phenotypeOrder.map(
                    phenotypeId =>
                        `${phenotypeId}_frequency_percent`
                )
            ].join(","),
            ...report.data.generations.map(row =>
                [
                    row.generation,
                    ...phenotypeOrder.map(
                        phenotypeId =>
                            (
                                row.startingFrequencies[
                                    phenotypeId
                                ] * 100
                            ).toFixed(3)
                    )
                ].join(",")
            )
        ]);

        appendSection(lines, "HYPOTHESIS EVALUATION", [
            `Outcome: ${displayText(analysis.hypothesisEvaluation.outcomeLabel)}`,
            `Explanation: ${displayText(analysis.hypothesisEvaluation.explanation)}`
        ]);

        appendSection(lines, "CLAIM–EVIDENCE–REASONING", [
            `Claim: ${displayText(analysis.cer.claim)}`,
            `Evidence: ${displayText(analysis.cer.evidence)}`,
            `Reasoning: ${displayText(analysis.cer.reasoning)}`
        ]);

        appendSection(lines, "LIMITATIONS AND REFLECTION", [
            `Limitation: ${displayText(analysis.reflection.limitation)}`,
            `Source of variation: ${displayText(analysis.reflection.variation)}`,
            `Possible improvement: ${displayText(analysis.reflection.improvement)}`
        ]);

        appendSection(lines, "VERIFICATION", [
            `Session: ${report.attempt.sessionId}`,
            `Attempt: ${report.attempt.attemptNumber}`,
            `Definition: ${report.attempt.definitionVersion}`,
            `Model: ${report.attempt.modelVersion}`,
            "This readable block identifies the activity attempt; it is not a secure or tamper-proof signature."
        ]);

        return `${lines.join("\n")}\n`;
    },

    createFilename(report) {
        if (!report?.attempt?.sessionId) {
            throw new TypeError(
                "A report with a session id is required."
            );
        }
        const safeSession = String(
            report.attempt.sessionId
        ).replace(/[^a-zA-Z0-9_-]/g, "-")
            .slice(0, 36);
        return `ecgame-natural-selection-${safeSession}.txt`;
    }
};

export default InvestigationReportModel;
