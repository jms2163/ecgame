// --------------------------------------------------
// VisualPredationModel.js
// Seeded, phenotype-neutral movement and hit testing
// --------------------------------------------------

const hashString = value => {

    let hash = 2166136261;

    for (
        let index = 0;
        index < value.length;
        index += 1
    ) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(
            hash,
            16777619
        );
    }

    return hash >>> 0;

};

const createRandom = seed => {

    let state =
        hashString(String(seed));

    return () => {

        state += 0x6D2B79F5;

        let value = state;

        value = Math.imul(
            value ^ value >>> 15,
            value | 1
        );

        value ^=
            value +
            Math.imul(
                value ^ value >>> 7,
                value | 61
            );

        return (
            (
                value ^ value >>> 14
            ) >>> 0
        ) / 4294967296;

    };

};

const shuffle = (
    values,
    random
) => {

    const shuffled = [...values];

    for (
        let index =
            shuffled.length - 1;
        index > 0;
        index -= 1
    ) {
        const swapIndex =
            Math.floor(
                random() *
                (index + 1)
            );

        [
            shuffled[index],
            shuffled[swapIndex]
        ] = [
            shuffled[swapIndex],
            shuffled[index]
        ];
    }

    return shuffled;

};

const requirePositiveNumber = (
    value,
    label
) => {

    if (
        !Number.isFinite(value) ||
        value <= 0
    ) {
        throw new TypeError(
            `${label} must be a positive number.`
        );
    }

};

const createPhenotypeSequence =
    populationSummary => {

        const phenotypeIds = [];

        populationSummary.phenotypeOrder
            .forEach(
                phenotypeId => {

                    const count =
                        populationSummary
                            .phenotypeCounts[
                                phenotypeId
                            ];

                    if (
                        !Number.isInteger(count) ||
                        count < 0
                    ) {
                        throw new TypeError(
                            `Invalid count for ${phenotypeId}.`
                        );
                    }

                    for (
                        let index = 0;
                        index < count;
                        index += 1
                    ) {
                        phenotypeIds.push(
                            phenotypeId
                        );
                    }

                }
            );

        return phenotypeIds;

    };

const createPositionSlots = ({
    width,
    height,
    margin,
    minimumCenterDistance
}) => {

    const availableWidth =
        width - margin * 2;
    const availableHeight =
        height - margin * 2;

    const columns =
        Math.floor(
            availableWidth /
            minimumCenterDistance
        ) + 1;

    const rows =
        Math.floor(
            availableHeight /
            minimumCenterDistance
        ) + 1;

    const horizontalSpacing =
        columns === 1
            ? 0
            : availableWidth /
                (columns - 1);

    const verticalSpacing =
        rows === 1
            ? 0
            : availableHeight /
                (rows - 1);

    const slots = [];

    for (
        let row = 0;
        row < rows;
        row += 1
    ) {
        for (
            let column = 0;
            column < columns;
            column += 1
        ) {
            slots.push({
                x:
                    margin +
                    column *
                        horizontalSpacing,
                y:
                    margin +
                    row *
                        verticalSpacing
            });
        }
    }

    return slots;

};

const VisualPredationModel = {

    createTrial({
        seed,
        generation,
        populationSummary,
        width,
        height,
        displaySize,
        minimumCenterDistance,
        movementSpeed
    }) {

        [
            [width, "Field width"],
            [height, "Field height"],
            [displaySize, "Display size"],
            [
                minimumCenterDistance,
                "Minimum center distance"
            ],
            [movementSpeed, "Movement speed"]
        ].forEach(
            ([value, label]) => {
                requirePositiveNumber(
                    value,
                    label
                );
            }
        );

        const random =
            createRandom(
                `${seed}|${generation}`
            );

        const phenotypeIds =
            shuffle(
                createPhenotypeSequence(
                    populationSummary
                ),
                random
            );

        const margin =
            displaySize / 2 + 3;

        const slots =
            shuffle(
                createPositionSlots({
                    width,
                    height,
                    margin,
                    minimumCenterDistance
                }),
                random
            );

        if (
            phenotypeIds.length >
            slots.length
        ) {
            throw new RangeError(
                "The predation field is too small for this population."
            );
        }

        const individuals =
            phenotypeIds.map(
                (
                    phenotypeId,
                    index
                ) => {

                    const angle =
                        random() *
                        Math.PI * 2;

                    const slot = slots[index];

                    return {
                        id:
                            `g${generation}-amoeba-${index + 1}`,
                        phenotypeId,
                        x: slot.x,
                        y: slot.y,
                        velocityX:
                            Math.cos(angle) *
                            movementSpeed,
                        velocityY:
                            Math.sin(angle) *
                            movementSpeed,
                        rotation:
                            random() *
                            Math.PI * 2,
                        alive: true
                    };

                }
            );

        return {
            seed: String(seed),
            generation,
            width,
            height,
            displaySize,
            minimumCenterDistance,
            movementSpeed,
            individuals
        };

    },

    step(
        trial,
        elapsedSeconds
    ) {

        if (
            !Number.isFinite(
                elapsedSeconds
            ) ||
            elapsedSeconds < 0
        ) {
            throw new TypeError(
                "Elapsed time must be a non-negative number."
            );
        }

        const margin =
            trial.displaySize / 2 + 3;

        trial.individuals.forEach(
            individual => {

                if (!individual.alive) {
                    return;
                }

                individual.x +=
                    individual.velocityX *
                    elapsedSeconds;

                individual.y +=
                    individual.velocityY *
                    elapsedSeconds;

                if (
                    individual.x < margin
                ) {
                    individual.x = margin;
                    individual.velocityX =
                        Math.abs(
                            individual.velocityX
                        );
                } else if (
                    individual.x >
                    trial.width - margin
                ) {
                    individual.x =
                        trial.width - margin;
                    individual.velocityX =
                        -Math.abs(
                            individual.velocityX
                        );
                }

                if (
                    individual.y < margin
                ) {
                    individual.y = margin;
                    individual.velocityY =
                        Math.abs(
                            individual.velocityY
                        );
                } else if (
                    individual.y >
                    trial.height - margin
                ) {
                    individual.y =
                        trial.height - margin;
                    individual.velocityY =
                        -Math.abs(
                            individual.velocityY
                        );
                }

            }
        );

        return trial;

    },

    findCaptureTarget(
        trial,
        x,
        y,
        hitRadius
    ) {

        requirePositiveNumber(
            hitRadius,
            "Hit radius"
        );

        let closestTarget = null;
        let closestDistanceSquared =
            hitRadius * hitRadius;

        trial.individuals.forEach(
            individual => {

                if (!individual.alive) {
                    return;
                }

                const distanceX =
                    individual.x - x;
                const distanceY =
                    individual.y - y;
                const distanceSquared =
                    distanceX * distanceX +
                    distanceY * distanceY;

                if (
                    distanceSquared <=
                    closestDistanceSquared
                ) {
                    closestTarget =
                        individual;
                    closestDistanceSquared =
                        distanceSquared;
                }

            }
        );

        return closestTarget;

    },

    capture(
        trial,
        targetId
    ) {

        const target =
            trial.individuals.find(
                individual =>
                    individual.id ===
                    targetId
            );

        if (!target?.alive) {
            throw new RangeError(
                `Active target not found: ${targetId}`
            );
        }

        target.alive = false;

        return target;

    },

    countLivingByPhenotype(trial) {

        return trial.individuals
            .filter(
                individual =>
                    individual.alive
            )
            .reduce(
                (
                    counts,
                    individual
                ) => {
                    counts[
                        individual.phenotypeId
                    ] ??= 0;

                    counts[
                        individual.phenotypeId
                    ] += 1;

                    return counts;
                },
                {}
            );

    }

};

export default VisualPredationModel;
