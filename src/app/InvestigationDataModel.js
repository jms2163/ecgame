// --------------------------------------------------
// InvestigationDataModel.js
// Pure observation rows and frequency series
// --------------------------------------------------

const clone = value =>
    structuredClone(value);

const requirePopulationSummary = (
    population,
    label
) => {

    if (
        !population ||
        !Array.isArray(
            population.phenotypeOrder
        ) ||
        !population.phenotypeCounts ||
        !population.phenotypeFrequencies ||
        !Number.isInteger(population.total)
    ) {
        throw new TypeError(
            `${label} must be a complete population summary.`
        );
    }

};

const createEmptyPhenotypeValues =
    phenotypeOrder =>
        Object.fromEntries(
            phenotypeOrder.map(
                phenotypeId => [
                    phenotypeId,
                    null
                ]
            )
        );

const getSelectionOutcomeCounts = (
    generationRecord,
    phenotypeOrder
) => {

    if (
        generationRecord.selection
            ?.status !== "complete"
    ) {
        return createEmptyPhenotypeValues(
            phenotypeOrder
        );
    }

    const outcomesByPhenotype =
        generationRecord.selection
            .strategyMetrics
            ?.capturedByPhenotype ??
        generationRecord.selection
            .outcomeSummary
            ?.outcomesByPhenotype ??
        null;

    return Object.fromEntries(
        phenotypeOrder.map(
            phenotypeId => [
                phenotypeId,
                outcomesByPhenotype?.[
                    phenotypeId
                ] ?? 0
            ]
        )
    );

};

const getPhenotypeDefinitions = session => {

    const definitionById =
        new Map(
            session.setup.trait
                .phenotypes.map(
                    phenotype => [
                        phenotype.id,
                        phenotype
                    ]
                )
        );

    return session.generationRecords[0]
        .startPopulation
        .phenotypeOrder.map(
            phenotypeId => {

                const definition =
                    definitionById.get(
                        phenotypeId
                    );

                if (!definition) {
                    throw new RangeError(
                        `Missing phenotype definition: ${phenotypeId}`
                    );
                }

                return {
                    id: phenotypeId,
                    label:
                        definition.label ??
                        phenotypeId
                };

            }
        );

};

const InvestigationDataModel = {

    createSnapshot(session) {

        if (
            !session?.setup?.trait
                ?.phenotypes ||
            !Array.isArray(
                session.generationRecords
            ) ||
            session.generationRecords
                .length === 0
        ) {
            throw new TypeError(
                "A complete investigation session is required."
            );
        }

        const phenotypes =
            getPhenotypeDefinitions(
                session
            );
        const phenotypeOrder =
            phenotypes.map(
                phenotype =>
                    phenotype.id
            );

        const rows =
            session.generationRecords.map(
                generationRecord => {

                    requirePopulationSummary(
                        generationRecord
                            .startPopulation,
                        `Generation ${generationRecord.generation} starting population`
                    );

                    const selectionComplete =
                        generationRecord.selection
                            ?.status ===
                            "complete";

                    return {
                        generation:
                            generationRecord
                                .generation,
                        isFinalObservation:
                            Boolean(
                                generationRecord
                                    .isFinalObservation
                            ),
                        selectionComplete,
                        startPopulation:
                            clone(
                                generationRecord
                                    .startPopulation
                            ),
                        selectionOutcomeCounts:
                            getSelectionOutcomeCounts(
                                generationRecord,
                                phenotypeOrder
                            ),
                        survivors:
                            selectionComplete
                                ? clone(
                                    generationRecord
                                        .survivors
                                )
                                : null,
                        nextGeneration:
                            generationRecord
                                .reproduction
                                ?.offspringPopulation
                                ? clone(
                                    generationRecord
                                        .reproduction
                                        .offspringPopulation
                                )
                                : null
                    };

                }
            );

        const frequencySeries =
            phenotypes.map(
                phenotype => ({
                    phenotypeId:
                        phenotype.id,
                    label:
                        phenotype.label,
                    points:
                        rows.map(
                            row => ({
                                generation:
                                    row.generation,
                                frequency:
                                    row.startPopulation
                                        .phenotypeFrequencies[
                                            phenotype.id
                                        ],
                                percentage:
                                    row.startPopulation
                                        .phenotypeFrequencies[
                                            phenotype.id
                                        ] * 100
                            })
                        )
                })
            );

        const initialPopulation =
            rows[0].startPopulation;
        const latestPopulation =
            rows.at(-1).startPopulation;

        const frequencyChanges =
            Object.fromEntries(
                phenotypeOrder.map(
                    phenotypeId => [
                        phenotypeId,
                        (
                            latestPopulation
                                .phenotypeFrequencies[
                                    phenotypeId
                                ] -
                            initialPopulation
                                .phenotypeFrequencies[
                                    phenotypeId
                                ]
                        ) * 100
                    ]
                )
            );

        return {
            investigationId:
                session.investigationId,
            sessionId:
                session.sessionId,
            status:
                session.status,
            phase:
                session.phase,
            finalGeneration:
                session.finalGeneration,
            presentation: {
                observationLabel:
                    session.setup
                        .dataPresentation
                        ?.observationLabel ??
                    "Generation",
                startingPopulationLabel:
                    session.setup
                        .dataPresentation
                        ?.startingPopulationLabel ??
                    "Starting population",
                selectionOutcomeLabel:
                    session.setup
                        .dataPresentation
                        ?.selectionOutcomeLabel ??
                    "Selection outcomes",
                survivorLabel:
                    session.setup
                        .dataPresentation
                        ?.survivorLabel ??
                    "Survivors",
                nextPopulationLabel:
                    session.setup
                        .dataPresentation
                        ?.nextPopulationLabel ??
                    "Next population",
                frequencyGraphTitle:
                    session.setup
                        .dataPresentation
                        ?.frequencyGraphTitle ??
                    "Phenotype frequency by observation"
            },
            phenotypes,
            rows,
            frequencySeries,
            comparison: {
                initialGeneration:
                    rows[0].generation,
                latestGeneration:
                    rows.at(-1).generation,
                isFinal:
                    session.phase ===
                    "population_complete",
                initialPopulation:
                    clone(
                        initialPopulation
                    ),
                latestPopulation:
                    clone(
                        latestPopulation
                    ),
                frequencyChanges
            }
        };

    }

};

export default InvestigationDataModel;
