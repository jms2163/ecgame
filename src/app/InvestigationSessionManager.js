// --------------------------------------------------
// InvestigationSessionManager.js
// Generic in-memory investigation state transitions
// --------------------------------------------------

import PopulationModel
    from "./PopulationModel.js";

const clone = value =>
    structuredClone(value);

const defaultSessionIdFactory = () =>
    globalThis.crypto?.randomUUID?.() ??
    `investigation-${Date.now()}`;

const requirePositiveInteger = (
    value,
    label
) => {

    if (
        !Number.isInteger(value) ||
        value <= 0
    ) {
        throw new TypeError(
            `${label} must be a positive integer.`
        );
    }

};

const createSelectionRecord = (
    targetSuccessfulCaptures,
    phenotypeOrder,
    setup
) => ({
    selectivePressureId:
        setup.selectivePressure.id,
    strategyId:
        setup.selectivePressure
            .strategyId,
    interactionMode:
        setup.interactionMode,
    status: "active",
    targetSuccessfulOutcomes:
        Number.isInteger(
            targetSuccessfulCaptures
        )
            ? targetSuccessfulCaptures
            : null,
    events: [],
    outcomeSummary: null,
    strategyMetrics:
        setup.selectivePressure
            .strategyId ===
            "student_visual_predation"
            ? {
                captureAttempts: 0,
                successfulCaptures: 0,
                capturedByPhenotype:
                    Object.fromEntries(
                        phenotypeOrder.map(
                            phenotypeId => [
                                phenotypeId,
                                0
                            ]
                        )
                    )
            }
            : {}
});

const createGenerationRecord = ({
    generation,
    population,
    targetSuccessfulCaptures,
    setup,
    isFinalObservation = false
}) => ({
    generation,
    isFinalObservation,
    startPopulation:
        PopulationModel.summarize(
            population
        ),
    selection:
        isFinalObservation
            ? null
            : createSelectionRecord(
                targetSuccessfulCaptures,
                population.phenotypeOrder,
                setup
            ),
    survivors: null,
    reproduction: null
});

const validateSetupSnapshot = setup => {

    if (
        !setup?.investigationId ||
        !setup?.activityId ||
        !setup?.selectivePressure
            ?.strategyId ||
        !setup?.population
    ) {
        throw new TypeError(
            "A complete investigation setup snapshot is required."
        );
    }

    requirePositiveInteger(
        setup.population.carryingCapacity,
        "Carrying capacity"
    );

    if (
        setup.selectivePressure
            .strategyId ===
            "student_visual_predation"
    ) {
        requirePositiveInteger(
            setup.population
                .successfulCapturesPerGeneration,
            "Successful captures per generation"
        );
    }

    requirePositiveInteger(
        setup.parameters?.finalGeneration,
        "Final generation"
    );

    if (
        !setup.population
            .reproductionStrategy
    ) {
        throw new TypeError(
            "A reproduction strategy is required."
        );
    }

    if (
        !PopulationModel
            .supportsReproductionStrategy(
                setup.population
                    .reproductionStrategy
            )
    ) {
        throw new RangeError(
            `Unsupported reproduction strategy: ${setup.population.reproductionStrategy}`
        );
    }

    const population =
        PopulationModel.createPopulation({
            phenotypeOrder:
                setup.population
                    .phenotypeOrder,
            phenotypeCounts:
                setup.population
                    .phenotypeCounts
        });

    const total =
        PopulationModel.getTotal(
            population
        );

    if (
        total !==
        setup.population.carryingCapacity
    ) {
        throw new RangeError(
            "Starting population must equal carrying capacity."
        );
    }

    if (
        Number.isInteger(
            setup.population
                .successfulCapturesPerGeneration
        ) &&
        setup.population
            .successfulCapturesPerGeneration >=
            total
    ) {
        throw new RangeError(
            "Successful captures must leave at least one survivor."
        );
    }

    return population;

};

const createInvestigationSessionManager = ({
    sessionIdFactory =
        defaultSessionIdFactory
} = {}) => {

    let activeSession = null;

    const requireActiveSession = () => {

        if (!activeSession) {
            throw new Error(
                "No investigation session is active."
            );
        }

        return activeSession;

    };

    const getCurrentGenerationRecord = () => {

        const session =
            requireActiveSession();

        return session.generationRecords[
            session.generationRecords.length - 1
        ];

    };

    const completeSelectionPhase = ({
        survivorPopulation,
        outcomeSummary = null,
        events = null
    }) => {

        const session =
            requireActiveSession();

        if (
            session.phase !==
            "selection_interaction"
        ) {
            throw new Error(
                "Selection can only be completed during the selection interaction."
            );
        }

        const survivors =
            PopulationModel.createPopulation({
                phenotypeOrder:
                    survivorPopulation
                        .phenotypeOrder,
                phenotypeCounts:
                    survivorPopulation
                        .phenotypeCounts
            });

        if (
            survivors.phenotypeOrder.length !==
                session.currentPopulation
                    .phenotypeOrder.length ||
            survivors.phenotypeOrder
                .some(
                    (
                        phenotypeId,
                        index
                    ) =>
                        phenotypeId !==
                        session.currentPopulation
                            .phenotypeOrder[index]
                )
        ) {
            throw new RangeError(
                "Survivor phenotypes must match the starting phenotypes and order."
            );
        }

        survivors.phenotypeOrder.forEach(
            phenotypeId => {
                if (
                    survivors.phenotypeCounts[
                        phenotypeId
                    ] >
                    session.currentPopulation
                        .phenotypeCounts[
                            phenotypeId
                        ]
                ) {
                    throw new RangeError(
                        "Selection cannot add individuals or change their phenotype."
                    );
                }
            }
        );

        if (
            PopulationModel.getTotal(
                survivors
            ) === 0
        ) {
            throw new RangeError(
                "Selection must leave at least one survivor."
            );
        }

        if (
            events !== null &&
            !Array.isArray(events)
        ) {
            throw new TypeError(
                "Selection events must be null or an array."
            );
        }

        const generationRecord =
            getCurrentGenerationRecord();

        if (events !== null) {
            generationRecord.selection
                .events = clone(events);
        }

        generationRecord.selection
            .status = "complete";
        generationRecord.selection
            .outcomeSummary = clone(
                outcomeSummary
            );

        session.currentPopulation =
            survivors;
        generationRecord.survivors =
            PopulationModel.summarize(
                survivors
            );
        session.phase =
            "survivor_review";

        return clone(activeSession);

    };

    return {

        startSession(setupSnapshot) {

            if (activeSession) {
                throw new Error(
                    "Reset the active investigation before starting another."
                );
            }

            const setup =
                clone(setupSnapshot);

            const startingPopulation =
                validateSetupSnapshot(
                    setup
                );

            activeSession = {
                sessionId:
                    sessionIdFactory(),
                investigationId:
                    setup.investigationId,
                activityId:
                    setup.activityId,
                definitionVersion:
                    setup.definitionVersion,
                modelVersion:
                    setup.modelVersion,
                status: "running",
                phase:
                    "selection_interaction",
                currentGeneration: 0,
                finalGeneration:
                    setup.parameters
                        .finalGeneration,
                setup,
                currentPopulation:
                    startingPopulation,
                generationRecords: [
                    createGenerationRecord({
                        generation: 0,
                        population:
                            startingPopulation,
                        targetSuccessfulCaptures:
                            setup.population
                                .successfulCapturesPerGeneration,
                        setup
                    })
                ]
            };

            return this.getSnapshot();

        },

        recordCaptureAttempt({
            successful,
            phenotypeId = null,
            elapsedMs = null,
            targetId = null
        }) {

            const session =
                requireActiveSession();

            if (
                session.phase !==
                "selection_interaction"
            ) {
                throw new Error(
                    "Capture attempts are only allowed during the selection interaction."
                );
            }

            if (
                typeof successful !==
                "boolean"
            ) {
                throw new TypeError(
                    "Capture attempt success must be true or false."
                );
            }

            if (
                elapsedMs !== null &&
                (
                    !Number.isFinite(elapsedMs) ||
                    elapsedMs < 0
                )
            ) {
                throw new TypeError(
                    "elapsedMs must be null or a non-negative number."
                );
            }

            const generationRecord =
                getCurrentGenerationRecord();

            if (
                generationRecord.selection
                    .strategyId !==
                "student_visual_predation"
            ) {
                throw new Error(
                    "Capture attempts require the student_visual_predation strategy."
                );
            }

            let nextPopulation =
                session.currentPopulation;

            if (successful) {
                nextPopulation =
                    PopulationModel.capture(
                        session.currentPopulation,
                        phenotypeId
                    );
            } else if (
                phenotypeId !== null
            ) {
                throw new TypeError(
                    "Unsuccessful attempts cannot identify a captured phenotype."
                );
            }

            generationRecord.selection
                .strategyMetrics
                .captureAttempts += 1;

            if (successful) {
                generationRecord.selection
                    .strategyMetrics
                    .successfulCaptures += 1;

                generationRecord.selection
                    .strategyMetrics
                    .capturedByPhenotype[
                        phenotypeId
                    ] += 1;

                session.currentPopulation =
                    nextPopulation;
            }

            const attempt = {
                attemptNumber:
                    generationRecord.selection
                        .strategyMetrics
                        .captureAttempts,
                successful,
                phenotypeId:
                    successful
                        ? phenotypeId
                        : null,
                elapsedMs,
                targetId,
                successfulCaptureNumber:
                    successful
                        ? generationRecord
                            .selection
                            .strategyMetrics
                            .successfulCaptures
                        : null,
                remainingPopulation:
                    PopulationModel.summarize(
                        session.currentPopulation
                    )
            };

            generationRecord.selection
                .events.push(
                    attempt
                );

            if (
                generationRecord.selection
                    .strategyMetrics
                    .successfulCaptures ===
                generationRecord.selection
                    .targetSuccessfulOutcomes
            ) {
                completeSelectionPhase({
                    survivorPopulation:
                        session.currentPopulation,
                    outcomeSummary:
                        generationRecord
                            .selection
                            .strategyMetrics
                });
            }

            return this.getSnapshot();

        },

        recordSuccessfulCapture(
            phenotypeId,
            metadata = {}
        ) {

            return this.recordCaptureAttempt({
                ...metadata,
                successful: true,
                phenotypeId
            });

        },

        completeSelection({
            survivorPopulation,
            outcomeSummary = null,
            events = null
        }) {

            return completeSelectionPhase({
                survivorPopulation,
                outcomeSummary,
                events
            });

        },

        advanceGeneration() {

            const session =
                requireActiveSession();

            if (
                session.phase !==
                "survivor_review"
            ) {
                throw new Error(
                    "Finish the generation's selection interaction before reproduction."
                );
            }

            const generationRecord =
                getCurrentGenerationRecord();

            const nextPopulation =
                PopulationModel.reproduce({
                    survivors:
                        session.currentPopulation,
                    carryingCapacity:
                        session.setup.population
                            .carryingCapacity,
                    strategyId:
                        session.setup.population
                            .reproductionStrategy
                });

            generationRecord.reproduction = {
                strategyId:
                    session.setup.population
                        .reproductionStrategy,
                carryingCapacity:
                    session.setup.population
                        .carryingCapacity,
                offspringPopulation:
                    PopulationModel.summarize(
                        nextPopulation
                    )
            };

            session.currentGeneration += 1;
            session.currentPopulation =
                nextPopulation;

            const reachedFinalGeneration =
                session.currentGeneration ===
                session.finalGeneration;

            session.generationRecords.push(
                createGenerationRecord({
                    generation:
                        session.currentGeneration,
                    population:
                        nextPopulation,
                    targetSuccessfulCaptures:
                        session.setup.population
                            .successfulCapturesPerGeneration,
                    setup:
                        session.setup,
                    isFinalObservation:
                        reachedFinalGeneration
                })
            );

            if (reachedFinalGeneration) {
                session.status =
                    "population_complete";
                session.phase =
                    "population_complete";
            } else {
                session.phase =
                    "selection_interaction";
            }

            return this.getSnapshot();

        },

        hasActiveSession() {

            return activeSession !== null;

        },

        getSnapshot() {

            return activeSession
                ? clone(activeSession)
                : null;

        },

        resetSession() {

            activeSession = null;

        }

    };

};

const InvestigationSessionManager =
    createInvestigationSessionManager();

export {
    createInvestigationSessionManager
};

export default InvestigationSessionManager;
