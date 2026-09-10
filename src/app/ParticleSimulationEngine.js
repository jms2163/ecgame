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

const DEFAULT_MEMBRANE_START = 0.44;
const DEFAULT_MEMBRANE_END = 0.56;

const MEMBRANE_CLEARANCE = 0.012;
const PARTICLE_CLUSTER_SPACING =
    PARTICLE_RADIUS * 2.5;

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

    // --------------------------------------------------
    // Give solution particles visually random but fully
    // deterministic directions for repeatable testing.
    // --------------------------------------------------
    createSolutionMixingVelocity(index) {

        const goldenAngle =
            Math.PI * (3 - Math.sqrt(5));

        const angle =
            (index + 1) * goldenAngle;

        const speedVariation =
            0.82 +
            (index % 5) * 0.045;

        return {
            x:
                Math.cos(angle) *
                DEFAULT_SPEED *
                speedVariation,

            y:
                Math.sin(angle) *
                DEFAULT_SPEED *
                speedVariation
        };

    },

    getVisualId(materialId) {

        return ExperimentMaterialLibrary[
            materialId
        ]?.visualId ??
            "unknown";

    },

    // --------------------------------------------------
    // Resolve the shared material count, with an optional
    // experiment-level override for future simulations.
    // --------------------------------------------------
    getParticlesPerPlacement(
        materialId,
        simulation
    ) {

        const experimentOverride =
            simulation?.particlesPerPlacement?.[
                materialId
            ];

        const materialDefault =
            ExperimentMaterialLibrary[
                materialId
            ]?.particlesPerPlacement;

        const count =
            experimentOverride ??
            materialDefault ??
            1;

        return Number.isInteger(count) &&
            count > 0
            ? count
            : 1;

    },

    // --------------------------------------------------
    // A compound sample can dissociate into constituent
    // particles when its simulation begins.
    // --------------------------------------------------
    getParticleMaterialIds(
        materialId,
        simulation
    ) {

        const composition =
            simulation?.particleCompositions?.[
                materialId
            ] ??
            ExperimentMaterialLibrary[
                materialId
            ]?.particleComposition;

        if (
            composition &&
            typeof composition === "object"
        ) {
            const expanded =
                Object.entries(composition)
                    .flatMap(([particleMaterialId, count]) =>
                        Number.isInteger(count) && count > 0
                            ? Array(count).fill(particleMaterialId)
                            : []
                    );

            if (expanded.length > 0) {
                return expanded;
            }
        }

        return Array(
            this.getParticlesPerPlacement(
                materialId,
                simulation
            )
        ).fill(materialId);

    },

    // --------------------------------------------------
    // Build a centered deterministic grid. Unlike the old
    // repeating Y-only pattern, every particle receives a
    // distinct two-dimensional starting position.
    // --------------------------------------------------
    createParticleClusterOffsets(count) {

        const columns =
            Math.ceil(
                Math.sqrt(count)
            );

        const rows =
            Math.ceil(
                count / columns
            );

        return Array.from(
            {
                length: count
            },
            (_, index) => {

                const column =
                    index % columns;

                const row =
                    Math.floor(
                        index / columns
                    );

                return {
                    x:
                        (
                            column -
                            (columns - 1) / 2
                        ) *
                        PARTICLE_CLUSTER_SPACING,

                    y:
                        (
                            row -
                            (rows - 1) / 2
                        ) *
                        PARTICLE_CLUSTER_SPACING
                };

            }
        );

    },

    // --------------------------------------------------
    // Place a complete particle cluster inside its starting
    // zone without flattening edge particles onto one point.
    // --------------------------------------------------
    positionParticleCluster(
        particles,
        component,
        simulation
    ) {

        if (particles.length === 0) {
            return particles;
        }

        const offsets =
            this.createParticleClusterOffsets(
                particles.length
            );

        const xValues =
            offsets.map(offset => offset.x);

        const yValues =
            offsets.map(offset => offset.y);

        const zone =
            this.getZoneBounds(
                component.zoneId,
                simulation
            );

        const centerX =
            this.clamp(
                particles[0].position.x,
                zone.start +
                    PARTICLE_RADIUS -
                    Math.min(...xValues),
                zone.end -
                    PARTICLE_RADIUS -
                    Math.max(...xValues)
            );

        const centerY =
            this.clamp(
                particles[0].position.y,
                MIN_POSITION +
                    PARTICLE_RADIUS -
                    Math.min(...yValues),
                MAX_POSITION -
                    PARTICLE_RADIUS -
                    Math.max(...yValues)
            );

        particles.forEach(
            (particle, index) => {

                particle.position.x =
                    centerX +
                    offsets[index].x;

                particle.position.y =
                    centerY +
                    offsets[index].y;

            }
        );

        return particles;

    },

    getMembraneBounds(simulation) {

        const configured =
            simulation?.membraneGeometry ??
            {};

        const start =
            Number.isFinite(configured.start)
                ? configured.start
                : DEFAULT_MEMBRANE_START;

        const end =
            Number.isFinite(configured.end)
                ? configured.end
                : DEFAULT_MEMBRANE_END;

        return start > MIN_POSITION &&
            end < MAX_POSITION &&
            start < end
            ? { start, end }
            : {
                start: DEFAULT_MEMBRANE_START,
                end: DEFAULT_MEMBRANE_END
            };

    },

    getZoneBounds(
        zoneId,
        simulation
    ) {

        if (zoneId === "solution") {
            return {
                start: MIN_POSITION,
                end: MAX_POSITION
            };
        }

        const membrane =
            this.getMembraneBounds(simulation);

        if (zoneId === "side_a") {
            return {
                start: MIN_POSITION,
                end:
                    membrane.start -
                    MEMBRANE_CLEARANCE
            };
        }

        if (zoneId === "side_b") {
            return {
                start:
                    membrane.end +
                    MEMBRANE_CLEARANCE,

                end:
                    MAX_POSITION
            };
        }

        return {
            start:
                membrane.start,

            end:
                membrane.end
        };

    },

    convertLocalXToWorldX(
        zoneId,
        localX,
        simulation
    ) {

        const zone =
            this.getZoneBounds(
                zoneId,
                simulation
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
        index,
        simulation,
        particleMaterialId = component.id
    ) {

        return {
            particleId:
                `particle-${index + 1}`,

            materialId:
                particleMaterialId,

            sourceMaterialId:
                component.id,

            visualId:
                this.getVisualId(
                    particleMaterialId
                ),

            zoneId:
                component.zoneId,

            position: {
                x:
                    this.convertLocalXToWorldX(
                        component.zoneId,
                        component.position?.x ??
                        0.5,

                        simulation
                    ),

                y:
                    this.clamp(
                        component.position?.y ??
                        0.5
                    )
            },

            velocity: (() => {
                const baseVelocity =
                    simulation?.modelId === "particle_solution_mixing"
                        ? this.createSolutionMixingVelocity(index)
                        : this.createInitialVelocity(index);
                const multiplier =
                    Number.isFinite(simulation?.movementSpeedMultiplier)
                        ? simulation.movementSpeedMultiplier
                        : 1;
                return {
                    x: baseVelocity.x * multiplier,
                    y: baseVelocity.y * multiplier
                };
            })(),

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

        const supportedModelIds =
            new Set([
                "particle_membrane_transport",
                "particle_solution_mixing"
            ]);

        if (
            !supportedModelIds.has(
                simulation?.modelId
            )
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

        // Structures such as aquaporins participate in
        // simulation rules but are not moving particles.
        // Each experiment may explicitly choose the materials
        // that the particle renderer should animate.
        const particleMaterialIds =
            Array.isArray(
                simulation.particleMaterialIds
            )
                ? simulation.particleMaterialIds
                : null;

        const particleComponents =
            particleMaterialIds
                ? components.filter(
                    component =>
                        particleMaterialIds.includes(
                            component.id
                        )
                )
                : components;

        return {
            modelId:
                simulation.modelId,

            modelVariant:
                simulation.modelVariant ??
                "default",

            simulation:
                structuredClone(simulation),

            particles: (() => {
                let particleIndex = 0;

                return particleComponents.flatMap(
                    component => {

                        const materialIds =
                            this.getParticleMaterialIds(
                                component.id,
                                simulation
                            );

                        const particles =
                            materialIds.map(
                                particleMaterialId =>
                                    this.createParticle(
                                        component,
                                        particleIndex++,
                                        simulation,
                                        particleMaterialId
                                    )
                            );

                        return this.positionParticleCluster(
                            particles,
                            component,
                            simulation
                        );

                    }
                );
            })(),

            pore: this.resolvePore(components, simulation),

            // ATP is represented by moving particles. The pump begins
            // unenergized and can hold one activation at a time.
            atpRemaining: 0,
            atpConsumed: 0,
            pumpActivated: false,
            pumpActivationDelayRemainingMs: 0,

            elapsedMs: 0,

            totalWaterTransfers: 0,

            totalMembraneTransfers: 0,

            isRunning: true
        };

    },

    resolvePore(components, simulation) {
        const rule = simulation?.poreRule;
        const protein = components.find(component => component.id === rule?.materialId && component.zoneId === "membrane");
        const rotation = ((protein?.rotationDeg ?? 0) % 360 + 360) % 360;
        if (!protein || !(rule?.allowedRotationDeg ?? []).includes(rotation)) return null;
        return { y: this.clamp(protein.position?.y ?? .5), radius: rule.radius ?? .09, speedMultiplier: rule.speedMultiplier ?? 4 };
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
        gradient,
        simulation
    ) {

        const selectiveRule =
            simulation?.selectiveTransportRule;

        if (selectiveRule) {
            const sourceZoneId =
                selectiveRule.sourceZoneId;

            const targetZoneId =
                selectiveRule.targetZoneId;

            const allowedMaterialIds =
                selectiveRule.allowedMaterialIds ?? [];

            if (
                particle.membraneCrossingLocked ||
                particle.zoneId !== sourceZoneId ||
                !allowedMaterialIds.includes(
                    particle.materialId
                )
            ) {
                return null;
            }

            if (
                sourceZoneId === "side_a" &&
                targetZoneId === "side_b"
            ) {
                return 1;
            }

            if (
                sourceZoneId === "side_b" &&
                targetZoneId === "side_a"
            ) {
                return -1;
            }

            return null;
        }

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

    getMembraneTargetZoneId(
        gradient,
        simulation
    ) {

        if (simulation?.selectiveTransportRule) {
            return simulation
                .selectiveTransportRule
                .targetZoneId ?? null;
        }

        return gradient?.higherSoluteZoneId ??
            null;

    },

    shouldStartMembraneTransit(
        particle,
        gradient,
        simulation
    ) {

        const membrane =
            this.getMembraneBounds(simulation);

        const direction =
            this.getExpectedCrossingDirection(
                particle,
                gradient,
                simulation
            );

        if (!direction) {
            return false;
        }

        if (direction > 0) {
            return (
                particle.velocity.x > 0 &&
                particle.position.x >=
                membrane.start -
                MEMBRANE_CLEARANCE
            );
        }

        return (
            particle.velocity.x < 0 &&
            particle.position.x <=
            membrane.end +
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
        direction,
        simulation
    ) {

        const membrane =
            this.getMembraneBounds(simulation);

        if (direction > 0) {
            nextParticle.position.x =
                membrane.start -
                MEMBRANE_CLEARANCE;

            nextParticle.velocity.x =
                -Math.abs(
                    nextParticle.velocity.x
                );

            return;
        }

        nextParticle.position.x =
            membrane.end +
            MEMBRANE_CLEARANCE;

        nextParticle.velocity.x =
            Math.abs(
                nextParticle.velocity.x
            );

    },

    // After a failed approach in an energy-coupled teaching model,
    // change the vertical component so the next pass can encounter
    // the visible pump instead of repeating one specular path forever.
    guideNextPumpApproach(nextParticle, pore) {
        if (!pore) return;
        const direction = Math.sign(pore.y - nextParticle.position.y) || 1;
        nextParticle.velocity.y =
            direction * Math.max(Math.abs(nextParticle.velocity.y), DEFAULT_SPEED * 0.55);
    },

    advanceParticle(
        particle,
        elapsedMilliseconds,
        gradient,
        pore,
        simulation,
        energy = null
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

        const membrane =
            this.getMembraneBounds(simulation);

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
                membrane.end +
                MEMBRANE_CLEARANCE;

            const exitedIntoSideA =
                !movingRight &&
                nextParticle.position.x <=
                membrane.start -
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

                if (nextParticle.postPoreVelocity) {
                    nextParticle.velocity =
                        nextParticle.postPoreVelocity;

                    delete nextParticle.postPoreVelocity;
                }

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
        // ATP must physically contact the correctly oriented
        // pump. The ATP particle is then consumed and the pump
        // stores one visible activation for the next H+.
        // --------------------------------------------------
        const energyRule =
            simulation?.energyRule;

        const isEnergyParticle =
            energyRule &&
            nextParticle.materialId === energyRule.materialId;

        if (
            isEnergyParticle &&
            nextParticle.zoneId === energyRule.zoneId &&
            nextParticle.velocity.x > 0 &&
            nextParticle.position.x >= membrane.start - MEMBRANE_CLEARANCE
        ) {
            const nearPore =
                pore &&
                (
                    nextParticle.pumpApproachGuided ||
                    Math.abs(nextParticle.position.y - pore.y) <= pore.radius
                );

            if (nearPore && energy && energy.remaining === 0) {
                nextParticle.position.y = pore.y;
                energy.remaining = 1;
                energy.consumed += 1;
                energy.activationDelayRemainingMs =
                    energyRule.activationDelayMs ?? 0;
                nextParticle.isConsumed = true;
                return nextParticle;
            }

            this.reflectFromMembrane(nextParticle, 1, simulation);
            nextParticle.pumpApproachGuided = true;
            this.guideNextPumpApproach(nextParticle, pore);
            return nextParticle;
        }

        // --------------------------------------------------
        // A lower-solute water molecule may pass through
        // when it physically reaches the membrane.
        // --------------------------------------------------
        if (
            this.shouldStartMembraneTransit(
                nextParticle,
                gradient,
                simulation
            )
        ) {
            if (pore) {
                const effectivePoreRadius =
                    energyRule && energy?.remaining > 0
                        ? energyRule.activatedPoreRadius ?? pore.radius
                        : pore.radius;
                const nearPore =
                    nextParticle.pumpApproachGuided ||
                    Math.abs(nextParticle.position.y - pore.y) <= effectivePoreRadius;
                if (!nearPore) {
                    this.reflectFromMembrane(nextParticle, nextParticle.velocity.x > 0 ? 1 : -1, simulation);
                    if (energyRule) {
                        nextParticle.pumpApproachGuided = true;
                        this.guideNextPumpApproach(nextParticle, pore);
                    }
                    return nextParticle;
                }
                if (energyRule && nextParticle.pumpApproachGuided) {
                    nextParticle.position.y = pore.y;
                    delete nextParticle.pumpApproachGuided;
                }
                nextParticle.postPoreVelocity = {
                    ...nextParticle.velocity
                };

                const direction =
                    nextParticle.velocity.x > 0
                        ? 1
                        : -1;

                nextParticle.velocity.x =
                    direction *
                    DEFAULT_SPEED *
                    pore.speedMultiplier;

                nextParticle.velocity.y = 0;
                nextParticle.position.y = pore.y;
            } else if (simulation?.poreRule) {
                this.reflectFromMembrane(nextParticle, nextParticle.velocity.x > 0 ? 1 : -1, simulation);
                return nextParticle;
            }
            if (energyRule) {
                const cost = energyRule.unitsPerTransfer;
                if (
                    !energy ||
                    energy.remaining < cost ||
                    energy.activationDelayRemainingMs > 0
                ) {
                    // Do not retain the boosted pore velocity when ATP is absent.
                    if (nextParticle.postPoreVelocity) {
                        nextParticle.velocity = nextParticle.postPoreVelocity;
                        delete nextParticle.postPoreVelocity;
                    }
                    this.reflectFromMembrane(nextParticle, nextParticle.velocity.x > 0 ? 1 : -1, simulation);
                    nextParticle.pumpApproachGuided = true;
                    return nextParticle;
                }
                energy.remaining -= cost;
            }
            nextParticle.isMembraneTransit =
                true;

            nextParticle.membraneTargetZoneId =
                this.getMembraneTargetZoneId(
                    gradient,
                    simulation
                );

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
            membrane.start -
            MEMBRANE_CLEARANCE
        ) {
            this.reflectFromMembrane(
                nextParticle,
                1,
                simulation
            );
        }

        if (
            nextParticle.zoneId === "side_b" &&
            nextParticle.velocity.x < 0 &&
            nextParticle.position.x <=
            membrane.end +
            MEMBRANE_CLEARANCE
        ) {
            this.reflectFromMembrane(
                nextParticle,
                -1,
                simulation
            );
        }

        return nextParticle;

    },

    advanceParticles(
        particles,
        elapsedMilliseconds,
        gradient,
        pore,
        simulation,
        energy = null
    ) {

        return particles.map(
            particle =>
                this.advanceParticle(
                    particle,
                    elapsedMilliseconds,
                gradient,
                pore,
                simulation,
                energy
                )
        ).filter(particle => !particle.isConsumed);

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
            nextState.modelId ===
            "particle_membrane_transport"
                ? this.getOsmoticGradient(
                    nextState.particles,
                    nextState.simulation
                )
                : null;

        nextState.elapsedMs +=
            safeElapsedMilliseconds;

        const energy = {
            remaining: nextState.atpRemaining ?? 0,
            consumed: nextState.atpConsumed ?? 0,
            activationDelayRemainingMs: Math.max(
                0,
                (nextState.pumpActivationDelayRemainingMs ?? 0) - safeElapsedMilliseconds
            )
        };

        nextState.particles =
            this.resolveParticleCollisions(
                this.advanceParticles(
                    nextState.particles,
                    safeElapsedMilliseconds,
                    gradient,
                    nextState.pore,
                    nextState.simulation,
                    energy
                )
            );

        nextState.atpRemaining = energy.remaining;
        nextState.atpConsumed = energy.consumed;
        nextState.pumpActivated = energy.remaining > 0;
        nextState.pumpActivationDelayRemainingMs =
            energy.activationDelayRemainingMs;

        const completedTransfers =
            nextState.particles.filter(
                particle =>
                    particle.completedCrossing
            );

        nextState.totalMembraneTransfers ??=
            0;

        nextState.totalWaterTransfers ??=
            0;

        nextState.totalMembraneTransfers +=
            completedTransfers.length;

        nextState.totalWaterTransfers +=
            completedTransfers.filter(
                particle =>
                    particle.materialId === "water"
            ).length;

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
