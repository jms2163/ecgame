// --------------------------------------------------
// ParticleInventoryManager.js
// Owns persistent subatomic-particle inventory
// --------------------------------------------------

import gameState from "./GameState.js";
import GameStateObserver
    from "./GameStateObserver.js";

const PARTICLE_TYPES = Object.freeze([
    "proton",
    "neutron",
    "electron"
]);

const DEFAULT_CAPACITY = 5;

const ParticleInventoryManager = {

    initialize() {

        this.ensureState();

        return true;

    },

    isParticleType(particleId) {

        return PARTICLE_TYPES.includes(
            particleId
        );

    },

    ensureState() {

        gameState.registry ??= {};
        gameState.registry.resources ??= {};

        const resources =
            gameState.registry.resources;

        if (
            !resources.particles ||
            typeof resources.particles !==
                "object"
        ) {
            resources.particles = {
                capacity: DEFAULT_CAPACITY,
                proton: 0,
                neutron: 0,
                electron: 0,
                lifetimeCollected: {
                    proton: 0,
                    neutron: 0,
                    electron: 0
                }
            };
        }

        const particles =
            resources.particles;

        if (
            !particles.lifetimeCollected ||
            typeof particles
                .lifetimeCollected !==
                "object"
        ) {
            particles.lifetimeCollected = {};
        }

        if (
            !Number.isInteger(
                particles.capacity
            ) ||
            particles.capacity <
                DEFAULT_CAPACITY
        ) {
            particles.capacity =
                DEFAULT_CAPACITY;
        }

        PARTICLE_TYPES.forEach(
            particleId => {

                const current =
                    particles[particleId];

                if (
                    !Number.isInteger(current) ||
                    current < 0
                ) {
                    particles[particleId] = 0;
                } else if (
                    current >
                    particles.capacity
                ) {
                    particles[particleId] =
                        particles.capacity;
                }

                const lifetime =
                    particles
                        .lifetimeCollected[
                            particleId
                        ];

                particles
                    .lifetimeCollected[
                        particleId
                    ] =
                        Number.isInteger(
                            lifetime
                        ) &&
                        lifetime >= 0
                            ? Math.max(
                                lifetime,
                                particles[
                                    particleId
                                ]
                            )
                            : particles[
                                particleId
                            ];

            }
        );

        return particles;

    },

    getStatus() {

        const particles =
            this.ensureState();

        return {
            capacity: particles.capacity,
            proton: particles.proton,
            neutron: particles.neutron,
            electron: particles.electron,
            lifetimeCollected: {
                ...particles
                    .lifetimeCollected
            }
        };

    },

    getCount(particleId) {

        if (!this.isParticleType(particleId)) {
            return null;
        }

        return this.ensureState()[
            particleId
        ];

    },

    addParticle(
        particleId,
        amount = 1
    ) {

        if (!this.isParticleType(particleId)) {
            return {
                added: 0,
                reason: "unknown-particle"
            };
        }

        if (
            !Number.isInteger(amount) ||
            amount <= 0
        ) {
            return {
                added: 0,
                reason: "invalid-amount"
            };
        }

        const particles =
            this.ensureState();

        const availableSpace =
            particles.capacity -
            particles[particleId];

        const added =
            Math.min(
                amount,
                availableSpace
            );

        if (added <= 0) {
            return {
                added: 0,
                current:
                    particles[particleId],
                capacity:
                    particles.capacity,
                reason: "capacity-reached"
            };
        }

        particles[particleId] += added;
        particles.lifetimeCollected[
            particleId
        ] += added;

        GameStateObserver.notify(
            "particle-inventory-changed",
            {
                particleId,
                added,
                current:
                    particles[particleId],
                capacity:
                    particles.capacity,
                lifetimeCollected:
                    particles
                        .lifetimeCollected[
                            particleId
                        ]
            }
        );

        return {
            added,
            current:
                particles[particleId],
            capacity:
                particles.capacity,
            lifetimeCollected:
                particles
                    .lifetimeCollected[
                        particleId
                    ],
            reason: "added"
        };

    },

    increaseCapacity(amount) {

        if (
            !Number.isInteger(amount) ||
            amount <= 0
        ) {
            return false;
        }

        const particles =
            this.ensureState();

        particles.capacity += amount;

        GameStateObserver.notify(
            "particle-inventory-changed",
            {
                particleId: null,
                added: 0,
                capacity:
                    particles.capacity,
                reason: "capacity-increased"
            }
        );

        return particles.capacity;

    }

};

export default ParticleInventoryManager;
