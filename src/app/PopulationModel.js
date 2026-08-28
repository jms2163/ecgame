// --------------------------------------------------
// PopulationModel.js
// Pure phenotype-count operations for investigations
// --------------------------------------------------

const clone = value =>
    structuredClone(value);

const requireNonNegativeInteger = (
    value,
    label
) => {

    if (
        !Number.isInteger(value) ||
        value < 0
    ) {
        throw new TypeError(
            `${label} must be a non-negative integer.`
        );
    }

};

const validatePopulation = population => {

    if (
        !population ||
        !Array.isArray(
            population.phenotypeOrder
        ) ||
        population.phenotypeOrder.length === 0
    ) {
        throw new TypeError(
            "Population requires a non-empty phenotypeOrder array."
        );
    }

    if (
        !population.phenotypeCounts ||
        typeof population.phenotypeCounts !==
            "object"
    ) {
        throw new TypeError(
            "Population requires phenotypeCounts."
        );
    }

    const uniquePhenotypes =
        new Set(
            population.phenotypeOrder
        );

    if (
        uniquePhenotypes.size !==
            population.phenotypeOrder.length ||
        population.phenotypeOrder.some(
            phenotypeId =>
                typeof phenotypeId !== "string" ||
                phenotypeId.length === 0
        )
    ) {
        throw new TypeError(
            "phenotypeOrder requires unique, non-empty string IDs."
        );
    }

    population.phenotypeOrder.forEach(
        phenotypeId => {
            requireNonNegativeInteger(
                population.phenotypeCounts[
                    phenotypeId
                ],
                `Count for phenotype ${phenotypeId}`
            );
        }
    );

};

const PopulationModel = {

    supportsReproductionStrategy(
        strategyId
    ) {

        return strategyId ===
            "proportional_clonal_largest_remainder";

    },

    createPopulation({
        phenotypeOrder,
        phenotypeCounts
    }) {

        const population = {
            phenotypeOrder: [
                ...phenotypeOrder
            ],
            phenotypeCounts: {
                ...phenotypeCounts
            }
        };

        validatePopulation(
            population
        );

        return population;

    },

    getTotal(population) {

        validatePopulation(
            population
        );

        return population.phenotypeOrder
            .reduce(
                (
                    total,
                    phenotypeId
                ) =>
                    total +
                    population.phenotypeCounts[
                        phenotypeId
                    ],
                0
            );

    },

    summarize(population) {

        validatePopulation(
            population
        );

        const total =
            this.getTotal(
                population
            );

        const phenotypeFrequencies =
            Object.fromEntries(
                population.phenotypeOrder.map(
                    phenotypeId => [
                        phenotypeId,
                        total === 0
                            ? 0
                            : population
                                .phenotypeCounts[
                                    phenotypeId
                                ] / total
                    ]
                )
            );

        return {
            phenotypeOrder: [
                ...population.phenotypeOrder
            ],
            phenotypeCounts: {
                ...population.phenotypeCounts
            },
            total,
            phenotypeFrequencies
        };

    },

    capture(
        population,
        phenotypeId,
        amount = 1
    ) {

        validatePopulation(
            population
        );

        requireNonNegativeInteger(
            amount,
            "Capture amount"
        );

        if (
            !population.phenotypeOrder
                .includes(phenotypeId)
        ) {
            throw new RangeError(
                `Unknown phenotype: ${phenotypeId}`
            );
        }

        if (
            population.phenotypeCounts[
                phenotypeId
            ] < amount
        ) {
            throw new RangeError(
                `Cannot capture ${amount} ${phenotypeId}; too few remain.`
            );
        }

        const nextPopulation =
            clone(population);

        nextPopulation.phenotypeCounts[
            phenotypeId
        ] -= amount;

        return nextPopulation;

    },

    reproduceToCapacity(
        survivors,
        carryingCapacity
    ) {

        validatePopulation(
            survivors
        );

        requireNonNegativeInteger(
            carryingCapacity,
            "Carrying capacity"
        );

        if (carryingCapacity === 0) {
            throw new RangeError(
                "Carrying capacity must be greater than zero."
            );
        }

        const survivorTotal =
            this.getTotal(
                survivors
            );

        if (survivorTotal === 0) {
            throw new RangeError(
                "A population with no survivors cannot reproduce."
            );
        }

        const allocations =
            survivors.phenotypeOrder.map(
                (
                    phenotypeId,
                    phenotypeIndex
                ) => {

                    const exactCount =
                        survivors
                            .phenotypeCounts[
                                phenotypeId
                            ] /
                        survivorTotal *
                        carryingCapacity;

                    const allocatedCount =
                        Math.floor(
                            exactCount
                        );

                    return {
                        phenotypeId,
                        phenotypeIndex,
                        allocatedCount,
                        remainder:
                            exactCount -
                            allocatedCount
                    };

                }
            );

        let unallocated =
            carryingCapacity -
            allocations.reduce(
                (
                    total,
                    allocation
                ) =>
                    total +
                    allocation.allocatedCount,
                0
            );

        const largestRemainders = [
            ...allocations
        ].sort(
            (left, right) =>
                right.remainder -
                    left.remainder ||
                left.phenotypeIndex -
                    right.phenotypeIndex
        );

        for (
            let index = 0;
            unallocated > 0;
            index += 1
        ) {
            largestRemainders[
                index %
                largestRemainders.length
            ].allocatedCount += 1;

            unallocated -= 1;
        }

        return this.createPopulation({
            phenotypeOrder:
                survivors.phenotypeOrder,
            phenotypeCounts:
                Object.fromEntries(
                    allocations.map(
                        allocation => [
                            allocation.phenotypeId,
                            allocation.allocatedCount
                        ]
                    )
                )
        });

    },

    reproduce({
        survivors,
        carryingCapacity,
        strategyId
    }) {

        if (
            !this.supportsReproductionStrategy(
                strategyId
            )
        ) {
            throw new RangeError(
                `Unsupported reproduction strategy: ${strategyId}`
            );
        }

        return this.reproduceToCapacity(
            survivors,
            carryingCapacity
        );

    }

};

export default PopulationModel;
