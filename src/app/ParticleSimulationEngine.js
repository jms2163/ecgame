// --------------------------------------------------
// ParticleSimulationEngine.js
// Reusable particle model for membrane-transport labs
// --------------------------------------------------

import ExperimentMaterialLibrary
    from "./ExperimentMaterialLibrary.js";

const MIN_POSITION = 0.02;
const MAX_POSITION = 0.98;

const DEFAULT_SPEED = 0.18;
const PARTICLE_RADIUS = 0.018;

const MEMBRANE_START = 0.45;
const MEMBRANE_END = 0.55;

const MEMBRANE_CLEARANCE = 0.012;

const ParticleSimulationEngine = {

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

    getVisualId(materialId) {

        return ExperimentMaterialLibrary[
            materialId
        ]?.visualId ??
            "unknown";

    },

    getZoneBounds(zoneId) {

        if (zoneId === "side_a") {
            return {
                start: MIN_POSITION,
                end:
                    MEMBRANE_START -
                    MEMBRANE_CLEARANCE
            };
        }

        if (zoneId === "side_b") {
            return {
                start:
                    MEMBRANE_END +
                    MEMBRANE_CLEARANCE,

                end:
                    MAX_POSITION
            };
        }

        return {
            start:
                MEMBRANE_START,

            end:
                MEMBRANE_END
        };

    },

    convertLocalXToWorldX(
        zoneId,
        localX
    ) {

        const zone =
            this.getZoneBounds(
                zoneId
            );

        const normalizedLocalX =
            this.clamp(
                localX,
                MIN_POSITION,
                MAX_POSITION
            );

        return (
            zone.start +
            (
                (
                    zone.end -
                    zone.start
                ) *
                normalizedLocalX
            )
        );

    },

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
                    this.convertLocalXToWorldX(
                        component.zoneId,
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

            // Once water reaches the higher-solute side,
            // it cannot pass back through this membrane.
            membraneCrossingLocked:
                false,

            // Exists only while a water particle is moving
            // continuously through the membrane region.
            isMembraneTransit:
                false,

            membraneTargetZoneId:
                null
        };

    },

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

            totalWaterTransfers: 0,

            isRunning: true
        };

    },

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

        return sodiumCount === chlorideCount
            ? sodiumCount
            : 0;

    },

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

        return firstPairs > secondPairs
            ? {
                higherSoluteZoneId:
                    firstZoneId,

                lowerSoluteZoneId:
                    secondZoneId
            }
            : {
                higherSoluteZoneId:
                    secondZoneId,

                lowerSoluteZoneId:
                    firstZoneId
            };

    },

    getExpectedCrossingDirection(
        particle,
        gradient
    ) {

        if (
            particle.materialId !== "water" ||
            particle.membraneCrossingLocked ||
            !gradient
        ) {
            return null;
        }

        if (
            particle.zoneId !==
            gradient.lowerSoluteZoneId
        ) {
            return null;
        }

        return gradient.lowerSoluteZoneId ===
            "side_a"
            ? 1
            : -1;

    },

    shouldStartMembraneTransit(
        particle,
        gradient
    ) {

        const direction =
            this.getExpectedCrossingDirection(
                particle,
                gradient
            );

        if (!direction) {
            return false;
        }

        if (direction > 0) {
            return (
                particle.velocity.x > 0 &&
                particle.position.x >=
                MEMBRANE_START -
                MEMBRANE_CLEARANCE
            );
        }

        return (
            particle.velocity.x < 0 &&
            particle.position.x <=
            MEMBRANE_END +
            MEMBRANE_CLEARANCE
        );

    },

    reflectFromOuterWall(nextParticle) {

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

    },

    reflectFromMembrane(
        nextParticle,
        direction
    ) {

        if (direction > 0) {
            nextParticle.position.x =
                MEMBRANE_START -
                MEMBRANE_CLEARANCE;

            nextParticle.velocity.x =
                -Math.abs(
                    nextParticle.velocity.x
                );

            return;
        }

        nextParticle.position.x =
            MEMBRANE_END +
            MEMBRANE_CLEARANCE;

        nextParticle.velocity.x =
            Math.abs(
                nextParticle.velocity.x
            );

    },

    advanceParticle(
        particle,
        elapsedMilliseconds,
        gradient
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

        this.reflectFromOuterWall(
            nextParticle
        );

        // --------------------------------------------------
        // A water molecule already crossing continues at its
        // ordinary speed until it exits the membrane.
        // --------------------------------------------------
        if (
            nextParticle.isMembraneTransit
        ) {

            const movingRight =
                nextParticle.velocity.x > 0;

            const exitedIntoSideB =
                movingRight &&
                nextParticle.position.x >=
                MEMBRANE_END +
                MEMBRANE_CLEARANCE;

            const exitedIntoSideA =
                !movingRight &&
                nextParticle.position.x <=
                MEMBRANE_START -
                MEMBRANE_CLEARANCE;

            if (
                exitedIntoSideA ||
                exitedIntoSideB
            ) {
                nextParticle.zoneId =
                    nextParticle
                        .membraneTargetZoneId;

                nextParticle.isMembraneTransit =
                    false;

                nextParticle.membraneTargetZoneId =
                    null;

                nextParticle.membraneCrossingLocked =
                    true;

                nextParticle.completedCrossing =
                    true;
            }

            return nextParticle;
        }

        // --------------------------------------------------
        // A lower-solute water molecule may pass through
        // when it physically reaches the membrane.
        // --------------------------------------------------
        if (
            this.shouldStartMembraneTransit(
                nextParticle,
                gradient
            )
        ) {
            nextParticle.isMembraneTransit =
                true;

            nextParticle.membraneTargetZoneId =
                gradient.higherSoluteZoneId;

            nextParticle.zoneId =
                "membrane";

            return nextParticle;
        }

        // --------------------------------------------------
        // All other particles bounce from the membrane:
        // ions, high-side water, and water with no valid
        // osmotic gradient.
        // --------------------------------------------------
        if (
            nextParticle.zoneId === "side_a" &&
            nextParticle.velocity.x > 0 &&
            nextParticle.position.x >=
            MEMBRANE_START -
            MEMBRANE_CLEARANCE
        ) {
            this.reflectFromMembrane(
                nextParticle,
                1
            );
        }

        if (
            nextParticle.zoneId === "side_b" &&
            nextParticle.velocity.x < 0 &&
            nextParticle.position.x <=
            MEMBRANE_END +
            MEMBRANE_CLEARANCE
        ) {
            this.reflectFromMembrane(
                nextParticle,
                -1
            );
        }

        return nextParticle;

    },

    advanceParticles(
        particles,
        elapsedMilliseconds,
        gradient
    ) {

        return particles.map(
            particle =>
                this.advanceParticle(
                    particle,
                    elapsedMilliseconds,
                    gradient
                )
        );

    },

    resolveParticleCollisions(particles) {

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
                    first.isMembraneTransit ||
                    second.isMembraneTransit ||
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

        const gradient =
            this.getOsmoticGradient(
                nextState.particles,
                nextState.simulation
            );

        nextState.elapsedMs +=
            safeElapsedMilliseconds;

        nextState.particles =
            this.resolveParticleCollisions(
                this.advanceParticles(
                    nextState.particles,
                    safeElapsedMilliseconds,
                    gradient
                )
            );

        const completedTransfers =
            nextState.particles.filter(
                particle =>
                    particle.completedCrossing
            );

        nextState.totalWaterTransfers +=
            completedTransfers.length;

        completedTransfers.forEach(
            particle => {

                delete particle.completedCrossing;

            }
        );

        return nextState;

    },

    stop(state) {

        return {
            ...structuredClone(state),

            isRunning: false
        };

    },

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