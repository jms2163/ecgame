// --------------------------------------------------
// SubatomicAssemblyManager.js
// Owns Subatomic Assembly progress and rewards
// --------------------------------------------------

import gameState from "./GameState.js";
import GameStateManager
    from "./GameStateManager.js";
import GameStateObserver
    from "./GameStateObserver.js";
import ParticleInventoryManager
    from "./ParticleInventoryManager.js";
import XPManager from "./XPManager.js";
import SaveManager from "./SaveManager.js";

const ACTIVITY_ID = "q1_particles";
const TARGET_PER_PARTICLE = 5;
const XP_REWARD = 50;
const CAPACITY_REWARD = 2;

const PARTICLE_ORDER = Object.freeze([
    "proton",
    "neutron",
    "electron"
]);

const PARTICLE_DEFINITIONS = Object.freeze({
    proton: Object.freeze({
        id: "proton",
        name: "Proton",
        symbol: "pâº",
        charge: "+1",
        location: "Nucleus",
        relativeMass: "about 1 amu",
        prompt:
            "Select the particle in the nucleus with a +1 charge and a relative mass of about 1 amu.",
        correction:
            "A proton has a +1 charge and is located in the nucleus."
    }),

    neutron: Object.freeze({
        id: "neutron",
        name: "Neutron",
        symbol: "nâ°",
        charge: "0",
        location: "Nucleus",
        relativeMass: "about 1 amu",
        prompt:
            "Select the electrically neutral particle in the nucleus with a relative mass of about 1 amu.",
        correction:
            "A neutron has no electric charge and is located in the nucleus."
    }),

    electron: Object.freeze({
        id: "electron",
        name: "Electron",
        symbol: "eâ»",
        charge: "âˆ’1",
        location: "Electron cloud",
        relativeMass: "about 1/1836 amu",
        prompt:
            "Select the âˆ’1 particle found in the electron cloud with much less mass than a proton.",
        correction:
            "An electron has a âˆ’1 charge and occupies the electron cloud outside the nucleus."
    })
});

const SubatomicAssemblyManager = {

    initialize() {

        ParticleInventoryManager
            .initialize();

        this.ensureState();

        return true;

    },

    ensureState() {

        const quantumZone =
            gameState.zones?.quantum;

        if (!quantumZone) {
            throw new Error(
                "SubatomicAssemblyManager: Quantum zone state is missing"
            );
        }

        quantumZone.state ??= {};

        const defaultState = {
            activityId: ACTIVITY_ID,
            totalCollected: {
                proton: 0,
                neutron: 0,
                electron: 0
            },
            completed: false,
            completedAtMs: null
        };

        if (
            !quantumZone.state
                .subatomicAssembly ||
            typeof quantumZone.state
                .subatomicAssembly !==
                "object"
        ) {
            quantumZone.state
                .subatomicAssembly =
                defaultState;
        }

        const state =
            quantumZone.state
                .subatomicAssembly;

        state.activityId = ACTIVITY_ID;

        if (
            !state.totalCollected ||
            typeof state.totalCollected !==
                "object"
        ) {
            state.totalCollected = {
                ...defaultState.totalCollected
            };
        }

        PARTICLE_ORDER.forEach(
            particleId => {

                const total =
                    state.totalCollected[
                        particleId
                    ];

                if (
                    !Number.isInteger(total) ||
                    total < 0
                ) {
                    state.totalCollected[
                        particleId
                    ] = 0;
                } else if (
                    total >
                    TARGET_PER_PARTICLE
                ) {
                    state.totalCollected[
                        particleId
                    ] =
                        TARGET_PER_PARTICLE;
                }

            }
        );

        state.completed =
            Boolean(state.completed);

        if (
            state.completed &&
            !Number.isFinite(
                state.completedAtMs
            )
        ) {
            state.completedAtMs = null;
        }

        return state;

    },

    getParticleDefinitions() {

        return PARTICLE_ORDER.map(
            particleId => ({
                ...PARTICLE_DEFINITIONS[
                    particleId
                ]
            })
        );

    },

    getNextParticleId(state) {

        if (state.completed) {
            return null;
        }

        const totalProgress =
            PARTICLE_ORDER.reduce(
                (sum, particleId) =>
                    sum +
                    state.totalCollected[
                        particleId
                    ],
                0
            );

        for (
            let offset = 0;
            offset < PARTICLE_ORDER.length;
            offset += 1
        ) {
            const index =
                (
                    totalProgress +
                    offset
                ) %
                PARTICLE_ORDER.length;

            const particleId =
                PARTICLE_ORDER[index];

            if (
                state.totalCollected[
                    particleId
                ] < TARGET_PER_PARTICLE
            ) {
                return particleId;
            }
        }

        return null;

    },

    getStatus() {

        const state =
            this.ensureState();

        const nextParticleId =
            this.getNextParticleId(
                state
            );

        const totalProgress =
            PARTICLE_ORDER.reduce(
                (sum, particleId) =>
                    sum +
                    state.totalCollected[
                        particleId
                    ],
                0
            );

        return {
            activityId: ACTIVITY_ID,
            targetPerParticle:
                TARGET_PER_PARTICLE,
            targetTotal:
                TARGET_PER_PARTICLE *
                PARTICLE_ORDER.length,
            totalProgress,
            totalCollected: {
                ...state.totalCollected
            },
            inventory:
                ParticleInventoryManager
                    .getStatus(),
            completed: state.completed,
            completedAtMs:
                state.completedAtMs,
            xpReward: XP_REWARD,
            capacityReward:
                CAPACITY_REWARD,
            nextPrompt: nextParticleId
                ? {
                    particleId:
                        nextParticleId,
                    text:
                        PARTICLE_DEFINITIONS[
                            nextParticleId
                        ].prompt
                }
                : null
        };

    },

    isComplete(state) {

        return PARTICLE_ORDER.every(
            particleId =>
                state.totalCollected[
                    particleId
                ] >= TARGET_PER_PARTICLE
        );

    },

    completeActivity(state) {

        if (state.completed) {
            return {
                completed: false,
                reason: "already-completed"
            };
        }

        state.completed = true;
        state.completedAtMs = Date.now();

        GameStateManager.setZoneCompleted(
            "quantum",
            true
        );

        GameStateManager.setZoneUnlocked(
            "atomLab",
            true
        );

        const updatedXP =
            XPManager.addXP(XP_REWARD);

        const updatedCapacity =
            ParticleInventoryManager
                .increaseCapacity(
                    CAPACITY_REWARD
                );

        GameStateObserver.notify(
            "subatomic-assembly-completed",
            {
                activityId: ACTIVITY_ID,
                completedAtMs:
                    state.completedAtMs,
                xpAwarded: XP_REWARD,
                atomLabUnlocked: true
            }
        );

        return {
            completed: true,
            reason: "completed",
            completedAtMs:
                state.completedAtMs,
            xpAwarded: XP_REWARD,
            updatedXP,
            capacityAwarded:
                CAPACITY_REWARD,
            updatedCapacity,
            atomLabUnlocked: true
        };

    },

    submitAnswer(selectedParticleId) {

        const state =
            this.ensureState();

        if (state.completed) {
            return {
                accepted: false,
                correct: false,
                reason: "already-completed",
                message:
                    "Subatomic Assembly is already complete.",
                status: this.getStatus()
            };
        }

        if (
            !PARTICLE_DEFINITIONS[
                selectedParticleId
            ]
        ) {
            return {
                accepted: false,
                correct: false,
                reason: "unknown-particle",
                message:
                    "Choose a proton, neutron, or electron.",
                status: this.getStatus()
            };
        }

        const expectedParticleId =
            this.getNextParticleId(
                state
            );

        if (
            selectedParticleId !==
            expectedParticleId
        ) {
            return {
                accepted: true,
                correct: false,
                reason: "incorrect",
                expectedParticleId,
                message:
                    PARTICLE_DEFINITIONS[
                        expectedParticleId
                    ].correction,
                status: this.getStatus()
            };
        }

        const inventoryResult =
            ParticleInventoryManager
                .addParticle(
                    expectedParticleId,
                    1
                );

        if (inventoryResult.added !== 1) {
            return {
                accepted: false,
                correct: false,
                reason:
                    inventoryResult.reason,
                message:
                    "Particle storage is full. Reload the page and inspect the saved activity state before continuing.",
                status: this.getStatus()
            };
        }

        state.totalCollected[
            expectedParticleId
        ] += 1;

        let completion = null;

        if (this.isComplete(state)) {
            completion =
                this.completeActivity(
                    state
                );
        }

        const saveSucceeded =
            SaveManager.save();

        GameStateObserver.notify(
            "subatomic-assembly-changed",
            {
                activityId: ACTIVITY_ID,
                particleId:
                    expectedParticleId,
                completed:
                    state.completed,
                saveSucceeded
            }
        );

        const definition =
            PARTICLE_DEFINITIONS[
                expectedParticleId
            ];

        return {
            accepted: true,
            correct: true,
            reason: completion?.completed
                ? "activity-completed"
                : "particle-collected",
            particleId:
                expectedParticleId,
            message: completion?.completed
                ? "Subatomic Assembly complete. Atom Lab is unlocked for the next activity."
                : `${definition.name} collected: ${definition.charge} charge, ${definition.location.toLowerCase()}.`,
            completion,
            saveSucceeded,
            status: this.getStatus()
        };

    }

};

export default SubatomicAssemblyManager;
