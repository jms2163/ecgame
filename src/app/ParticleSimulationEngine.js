// --------------------------------------------------
// ParticleSimulationEngine.js
// Reusable particle model for membrane-transport labs
// --------------------------------------------------

import ExperimentMaterialLibrary from
    "./ExperimentMaterialLibrary.js";

const MIN_POSITION = 0.04;
const MAX_POSITION = 0.96;

const DEFAULT_SPEED = 0.18;
const PARTICLE_RADIUS = 0.035;

const ParticleSimulationEngine = {

    // --------------------------------------------------
    // Utility
    // --------------------------------------------------
    clamp(
        value,
        minimum = MIN_POSITION,
        maximum = MAX_POSITION
    ) {

        return Math.min(
            Math.max(value, minimum),
            maximum
        );

    },

    // --------------------------------------------------
    // Stable initial velocities for repeatable tests
    // --------------------------------------------------
    createInitialVelocity(index) {

        const directions = [
            { x: 0.85, y: 0.35 },
            { x: -0.75, y: 0.55 },
            { x: 0.45, y: -0.85 },
            { x: -0.55, y: -0.75 }
        ];

        const direction =
            directions[
                index % directions.length
            ];

        return {
            x:
                direction.x *
                DEFAULT_SPEED,

            y:
                direction.y *
                DEFAULT_SPEED
        };

    },

    // --------------------------------------------------
    // Read a material visual safely
    // --------------------------------------------------
    getVisualId(materialId) {

        return ExperimentMaterialLibrary[
            materialId
        ]?.visualId ??
            "unknown";

    },

    // --------------------------------------------------
    // Build one particle from a placed component
    // --------------------------------------------------
    createParticle(
        component,
        index
    ) {

        return {
            particleId:
                `particle-${index + 1}`,

            materialId:
                component.id,

            visualId:
                this.getVisualId(
                    component.id
                ),

            zoneId:
                component.zoneId,

            position: {
                x:
                    this.clamp(
                        component.position?.x ??
                        0.5
                    ),

                y:
                    this.clamp(
                        component.position?.y ??
                        0.5
                    )
            },

            velocity:
                this.createInitialVelocity(
                    index
                ),

            radius:
                PARTICLE_RADIUS,

            // Water that crosses during the osmosis
            // model remains on its new side.
            membraneCrossingLocked:
                false
        };

    },

    // --------------------------------------------------
    // Create a reusable simulation state
    // --------------------------------------------------
    createInitialState({
        simulation,
        snapshot
    } = {}) {

        if (
            simulation?.modelId !==
            "particle_membrane_transport"
        ) {
            throw new Error(
                "ParticleSimulationEngine: unsupported simulation model"
            );
        }

        const components =
            Array.isArray(
                snapshot?.components
            )
                ? snapshot.components
                : [];

        return {
            modelId:
                simulation.modelId,

            modelVariant:
                simulation.modelVariant ??
                "default",

            simulation:
                structuredClone(simulation),

            particles:
                components.map(
                    (component, index) =>
                        this.createParticle(
                            component,
                            index
                        )
                ),

            elapsedMs: 0,

            waterTransferAccumulatorMs: 0,

            totalWaterTransfers: 0,

            isRunning: true
        };

    },

    // --------------------------------------------------
    // Move one particle and bounce it off its compartment
    // walls.
    // --------------------------------------------------
    advanceParticle(
        particle,
        elapsedMilliseconds
    ) {

        const elapsedSeconds =
            elapsedMilliseconds / 1000;

        const nextParticle = {
            ...particle,

            position: {
                ...particle.position
            },

            velocity: {
                ...particle.velocity
            }
        };

        nextParticle.position.x +=
            nextParticle.velocity.x *
            elapsedSeconds;

        nextParticle.position.y +=
            nextParticle.velocity.y *
            elapsedSeconds;

        if (
            nextParticle.position.x <
            MIN_POSITION
        ) {
            nextParticle.position.x =
                MIN_POSITION;

            nextParticle.velocity.x =
                Math.abs(
                    nextParticle.velocity.x
                );
        }

        if (
            nextParticle.position.x >
            MAX_POSITION
        ) {
            nextParticle.position.x =
                MAX_POSITION;

            nextParticle.velocity.x =
                -Math.abs(
                    nextParticle.velocity.x
                );
        }

        if (
            nextParticle.position.y <
            MIN_POSITION
        ) {
            nextParticle.position.y =
                MIN_POSITION;

            nextParticle.velocity.y =
                Math.abs(
                    nextParticle.velocity.y
                );
        }

        if (
            nextParticle.position.y >
            MAX_POSITION
        ) {
            nextParticle.position.y =
                MAX_POSITION;

            nextParticle.velocity.y =
                -Math.abs(
                    nextParticle.velocity.y
                );
        }

        return nextParticle;

    },

    // --------------------------------------------------
    // Move every particle
    // --------------------------------------------------
    advanceParticles(
        particles,
        elapsedMilliseconds
    ) {

        return particles.map(
            particle =>
                this.advanceParticle(
                    particle,
                    elapsedMilliseconds
                )
        );

    },

    // --------------------------------------------------
    // Soft particle collision response within one zone.
    // This is visual motion only; it models no chemistry.
    // --------------------------------------------------
    resolveParticleCollisions(
        particles
    ) {

        const resolvedParticles =
            particles.map(
                particle => ({
                    ...particle,

                    position: {
                        ...particle.position
                    },

                    velocity: {
                        ...particle.velocity
                    }
                })
            );

        for (
            let firstIndex = 0;
            firstIndex <
            resolvedParticles.length;
            firstIndex += 1
        ) {

            for (
                let secondIndex =
                    firstIndex + 1;
                secondIndex <
                resolvedParticles.length;
                secondIndex += 1
            ) {

                const first =
                    resolvedParticles[
                        firstIndex
                    ];

                const second =
                    resolvedParticles[
                        secondIndex
                    ];

                if (
                    first.zoneId !==
                    second.zoneId
                ) {
                    continue;
                }

                const deltaX =
                    second.position.x -
                    first.position.x;

                const deltaY =
                    second.position.y -
                    first.position.y;

                const distance =
                    Math.hypot(
                        deltaX,
                        deltaY
                    );

                const minimumDistance =
                    first.radius +
                    second.radius;

                if (
                    distance === 0 ||
                    distance >=
                    minimumDistance
                ) {
                    continue;
                }

                const normalX =
                    deltaX / distance;

                const normalY =
                    deltaY / distance;

                const overlap =
                    minimumDistance -
                    distance;

                first.position.x =
                    this.clamp(
                        first.position.x -
                        normalX *
                        overlap / 2
                    );

                first.position.y =
                    this.clamp(
                        first.position.y -
                        normalY *
                        overlap / 2
                    );

                second.position.x =
                    this.clamp(
                        second.position.x +
                        normalX *
                        overlap / 2
                    );

                second.position.y =
                    this.clamp(
                        second.position.y +
                        normalY *
                        overlap / 2
                    );

                const firstNormalVelocity =
                    first.velocity.x *
                    normalX +
                    first.velocity.y *
                    normalY;

                const secondNormalVelocity =
                    second.velocity.x *
                    normalX +
                    second.velocity.y *
                    normalY;

                const velocityDifference =
                    secondNormalVelocity -
                    firstNormalVelocity;

                first.velocity.x +=
                    velocityDifference *
                    normalX;

                first.velocity.y +=
                    velocityDifference *
                    normalY;

                second.velocity.x -=
                    velocityDifference *
                    normalX;

                second.velocity.y -=
                    velocityDifference *
                    normalY;

            }

        }

        return resolvedParticles;

    },

    // --------------------------------------------------
    // Count material instances in a zone
    // --------------------------------------------------
    getMaterialCount(
        particles,
        zoneId,
        materialId
    ) {

        return particles.filter(
            particle =>
                particle.zoneId ===
                zoneId &&
                particle.materialId ===
                materialId
        ).length;

    },

    // --------------------------------------------------
    // A valid dissolved NaCl population has equal Na+ and
    // Cl− counts. An unbalanced side creates no osmotic
    // driving force in this simplified teaching model.
    // --------------------------------------------------
    getBalancedSaltPairCount(
        particles,
        zoneId
    ) {

        const sodiumCount =
            this.getMaterialCount(
                particles,
                zoneId,
                "sodium_ion"
            );

        const chlorideCount =
            this.getMaterialCount(
                particles,
                zoneId,
                "chloride_ion"
            );

        if (
            sodiumCount !==
            chlorideCount
        ) {
            return 0;
        }

        return sodiumCount;

    },

    // --------------------------------------------------
    // Determine the lower- and higher-solute sides.
    // Labels are intentionally irrelevant: side_a and
    // side_b remain neutral internal identifiers.
    // --------------------------------------------------
    getOsmoticGradient(
        particles,
        simulation
    ) {

        const zoneIds =
            simulation?.zoneIds?.filter(
                zoneId =>
                    zoneId !== "membrane"
            ) ?? [];

        if (zoneIds.length !== 2) {
            return null;
        }

        const [
            firstZoneId,
            secondZoneId
        ] = zoneIds;

        const firstPairs =
            this.getBalancedSaltPairCount(
                particles,
                firstZoneId
            );

        const secondPairs =
            this.getBalancedSaltPairCount(
                particles,
                secondZoneId
            );

        if (firstPairs === secondPairs) {
            return null;
        }

        if (firstPairs > secondPairs) {
            return {
                higherSoluteZoneId:
                    firstZoneId,

                lowerSoluteZoneId:
                    secondZoneId
            };
        }

        return {
            higherSoluteZoneId:
                secondZoneId,

            lowerSoluteZoneId:
                firstZoneId
        };

    },

    // --------------------------------------------------
    // Move one water particle across the membrane.
    // Ions are never moved by this rule.
    // --------------------------------------------------
    transferOneWaterParticle(
        state,
        gradient
    ) {

        const sourceWater =
            state.particles.find(
                particle =>
                    particle.materialId ===
                    "water" &&
                    particle.zoneId ===
                    gradient.lowerSoluteZoneId &&
                    !particle.membraneCrossingLocked
            );

        if (!sourceWater) {
            return false;
        }

        sourceWater.zoneId =
            gradient.higherSoluteZoneId;

        sourceWater.membraneCrossingLocked =
            true;

        const [
            firstZoneId
        ] =
            state.simulation.zoneIds.filter(
                zoneId =>
                    zoneId !== "membrane"
            );

        const movedToFirstZone =
            gradient.higherSoluteZoneId ===
            firstZoneId;

        sourceWater.position.x =
            movedToFirstZone
                ? 0.92
                : 0.08;

        sourceWater.position.y =
            0.3 +
            (
                (
                    state.totalWaterTransfers %
                    5
                ) * 0.1
            );

        sourceWater.velocity.x =
            movedToFirstZone
                ? -Math.abs(
                    sourceWater.velocity.x
                )
                : Math.abs(
                    sourceWater.velocity.x
                );

        state.totalWaterTransfers += 1;

        return true;

    },

    // --------------------------------------------------
    // Apply simplified net osmosis at a steady interval.
    // Water moves lower solute -> higher solute and
    // remains on the higher-solute side.
    // --------------------------------------------------
    applyMembraneTransport(
        state,
        elapsedMilliseconds
    ) {

        if (
            state.simulation
                ?.waterCrossingRule !==
            "lower_to_higher_trap"
        ) {
            return;
        }

        const intervalMs =
            state.simulation
                .waterCrossingIntervalMs ??
            700;

        state.waterTransferAccumulatorMs +=
            elapsedMilliseconds;

        while (
            state.waterTransferAccumulatorMs >=
            intervalMs
        ) {

            state.waterTransferAccumulatorMs -=
                intervalMs;

            const gradient =
                this.getOsmoticGradient(
                    state.particles,
                    state.simulation
                );

            if (!gradient) {
                continue;
            }

            this.transferOneWaterParticle(
                state,
                gradient
            );

        }

    },

    // --------------------------------------------------
    // Advance one simulation frame
    // --------------------------------------------------
    step(
        state,
        elapsedMilliseconds
    ) {

        if (!state?.isRunning) {
            return structuredClone(state);
        }

        const safeElapsedMilliseconds =
            Math.min(
                Math.max(
                    elapsedMilliseconds,
                    0
                ),
                100
            );

        const nextState =
            structuredClone(state);

        nextState.elapsedMs +=
            safeElapsedMilliseconds;

        const movedParticles =
            this.advanceParticles(
                nextState.particles,
                safeElapsedMilliseconds
            );

        nextState.particles =
            this.resolveParticleCollisions(
                movedParticles
            );

        this.applyMembraneTransport(
            nextState,
            safeElapsedMilliseconds
        );

        return nextState;

    },

    // --------------------------------------------------
    // Stop without destroying the current state
    // --------------------------------------------------
    stop(state) {

        return {
            ...structuredClone(state),

            isRunning: false
        };

    },

    // --------------------------------------------------
    // Useful for tests and future status displays
    // --------------------------------------------------
    createZoneSummary(
        particles,
        zoneIds = []
    ) {

        return Object.fromEntries(
            zoneIds.map(
                zoneId => [

                    zoneId,

                    {
                        water:
                            this.getMaterialCount(
                                particles,
                                zoneId,
                                "water"
                            ),

                        sodium:
                            this.getMaterialCount(
                                particles,
                                zoneId,
                                "sodium_ion"
                            ),

                        chloride:
                            this.getMaterialCount(
                                particles,
                                zoneId,
                                "chloride_ion"
                            )
                    }

                ]
            )
        );

    }

};

export default ParticleSimulationEngine;