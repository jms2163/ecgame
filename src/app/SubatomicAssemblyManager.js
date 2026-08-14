// --------------------------------------------------
// SubatomicAssemblyManager.js
// Owns guided Q1 identification and free harvesting
// --------------------------------------------------

import gameState from "./GameState.js";
import GameStateManager
    from "./GameStateManager.js";
import GameStateObserver
    from "./GameStateObserver.js";
import ParticleInventoryManager
    from "./ParticleInventoryManager.js";
import QuestManager from "./QuestManager.js";
import SaveManager from "./SaveManager.js";

const ACTIVITY_ID = "q1_particles";
const STAR_ID = "q1_particles";
const TARGET_PER_PARTICLE = 5;

const PARTICLE_ORDER = Object.freeze([
    "proton",
    "neutron",
    "electron"
]);

const PARTICLE_DEFINITIONS = Object.freeze({
    proton: Object.freeze({
        id: "proton",
        name: "Proton",
        symbol: Object.freeze({
            base: "p",
            charge: "+"
        }),
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
        symbol: Object.freeze({
            base: "n",
            charge: "0"
        }),
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
        symbol: Object.freeze({
            base: "e",
            charge: "-"
        }),
        charge: "-1",
        location: "Electron cloud",
        relativeMass: "about 1/1836 amu",
        prompt:
            "Select the -1 particle found in the electron cloud with much less mass than a proton.",
        correction:
            "An electron has a -1 charge and occupies the electron cloud outside the nucleus."
    })
});

const SubatomicAssemblyManager = {

    initialize() {

        ParticleInventoryManager
            .initialize();
        QuestManager.initialize();

        this.ensureState();
        this.reconcileQuestState();

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

        if (
            !quantumZone.state
                .subatomicAssembly ||
            typeof quantumZone.state
                .subatomicAssembly !==
                "object"
        ) {
            quantumZone.state
                .subatomicAssembly = {};
        }

        const state =
            quantumZone.state
                .subatomicAssembly;

        const legacyCollected =
            state.guidedCollected ??
            state.totalCollected ??
            {};

        state.activityId = ACTIVITY_ID;
        state.guidedCollected ??= {};

        PARTICLE_ORDER.forEach(
            particleId => {

                const total =
                    legacyCollected[
                        particleId
                    ];

                state.guidedCollected[
                    particleId
                ] =
                    Number.isInteger(total) &&
                    total >= 0
                        ? Math.min(
                            total,
                            TARGET_PER_PARTICLE
                        )
                        : 0;

            }
        );

        const guidanceComplete =
            this.isGuidanceComplete(
                state
            );

        const totalProgress =
            PARTICLE_ORDER.reduce(
                (sum, particleId) =>
                    sum +
                    state.guidedCollected[
                        particleId
                    ],
                0
            );

        const eligibilityWasRecorded =
            typeof state
                .perfectGuidanceEligible ===
                "boolean";

        state
            .incorrectGuidedSelections =
                Number.isInteger(
                    state
                        .incorrectGuidedSelections
                ) &&
                state
                    .incorrectGuidedSelections >= 0
                    ? state
                        .incorrectGuidedSelections
                    : 0;

        if (!eligibilityWasRecorded) {
            // A partially completed older save has no
            // trustworthy mistake history, so do not award
            // its star retroactively.
            state.perfectGuidanceEligible =
                totalProgress === 0;
        }

        if (
            state
                .incorrectGuidedSelections > 0
        ) {
            state.perfectGuidanceEligible =
                false;
        }

        const legacyCompletedAtMs =
            Number.isFinite(
                state.completedAtMs
            )
                ? state.completedAtMs
                : null;

        state.guidanceCompletedAtMs =
            guidanceComplete
                ? (
                    Number.isFinite(
                        state
                            .guidanceCompletedAtMs
                    )
                        ? state
                            .guidanceCompletedAtMs
                        : legacyCompletedAtMs
                )
                : null;

        delete state.totalCollected;
        delete state.completed;
        delete state.completedAtMs;

        return state;

    },

    ensureStarRegistry() {

        gameState.registry ??= {};
        gameState.registry.research ??= {};

        if (
            !gameState.registry.research
                .stars ||
            typeof gameState.registry.research
                .stars !== "object" ||
            Array.isArray(
                gameState.registry.research
                    .stars
            )
        ) {
            gameState.registry.research
                .stars = {};
        }

        return gameState.registry.research
            .stars;

    },

    getStarRecord() {

        const star =
            this.ensureStarRegistry()[
                STAR_ID
            ] ?? null;

        return star
            ? { ...star }
            : null;

    },

    awardPerfectGuidanceStar(
        awardedAtMs = Date.now()
    ) {

        const stars =
            this.ensureStarRegistry();

        if (stars[STAR_ID]) {
            return {
                awarded: false,
                star: {
                    ...stars[STAR_ID]
                }
            };
        }

        stars[STAR_ID] = {
            awardedAtMs,
            sourceActivityId:
                ACTIVITY_ID,
            reason:
                "perfect-guided-identification",
            correctSelections:
                TARGET_PER_PARTICLE *
                PARTICLE_ORDER.length,
            incorrectSelections: 0
        };

        GameStateObserver.notify(
            "game-star-awarded",
            {
                starId: STAR_ID,
                activityId: ACTIVITY_ID,
                star: {
                    ...stars[STAR_ID]
                }
            }
        );

        return {
            awarded: true,
            star: {
                ...stars[STAR_ID]
            }
        };

    },

    reconcileQuestState() {

        const state = this.ensureState();

        if (
            this.isGuidanceComplete(state)
        ) {
            QuestManager.markQuestClaimable(
                ACTIVITY_ID,
                state.guidanceCompletedAtMs ??
                    Date.now()
            );
        }

        // The released Q1 activity never completes the
        // whole repeatable Quantum resource zone.
        GameStateManager.setZoneCompleted(
            "quantum",
            false
        );

        return true;

    },

    getParticleDefinitions() {

        return PARTICLE_ORDER.map(
            particleId => {
                const definition =
                    PARTICLE_DEFINITIONS[
                        particleId
                    ];

                return {
                    ...definition,
                    symbol: {
                        ...definition.symbol
                    }
                };
            }
        );

    },

    getNextParticleId(state) {

        if (
            this.isGuidanceComplete(state)
        ) {
            return null;
        }

        const totalProgress =
            PARTICLE_ORDER.reduce(
                (sum, particleId) =>
                    sum +
                    state.guidedCollected[
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
                    totalProgress + offset
                ) % PARTICLE_ORDER.length;

            const particleId =
                PARTICLE_ORDER[index];

            if (
                state.guidedCollected[
                    particleId
                ] < TARGET_PER_PARTICLE
            ) {
                return particleId;
            }
        }

        return null;

    },

    isGuidanceComplete(state) {

        return PARTICLE_ORDER.every(
            particleId =>
                state.guidedCollected[
                    particleId
                ] >= TARGET_PER_PARTICLE
        );

    },

    getStatus() {

        const state = this.ensureState();
        const guidanceComplete =
            this.isGuidanceComplete(state);
        const nextParticleId =
            this.getNextParticleId(state);
        const totalProgress =
            PARTICLE_ORDER.reduce(
                (sum, particleId) =>
                    sum +
                    state.guidedCollected[
                        particleId
                    ],
                0
            );

        const star =
            this.getStarRecord();

        return {
            activityId: ACTIVITY_ID,
            mode: guidanceComplete
                ? "free-harvest"
                : "guided",
            targetPerParticle:
                TARGET_PER_PARTICLE,
            targetTotal:
                TARGET_PER_PARTICLE *
                PARTICLE_ORDER.length,
            totalProgress,
            guidedCollected: {
                ...state.guidedCollected
            },
            guidanceComplete,
            guidanceCompletedAtMs:
                state
                    .guidanceCompletedAtMs,
            perfectGuidance: {
                eligible:
                    state
                        .perfectGuidanceEligible,
                incorrectSelections:
                    state
                        .incorrectGuidedSelections,
                starEarned:
                    Boolean(star),
                star
            },
            inventory:
                ParticleInventoryManager
                    .getStatus(),
            quest:
                QuestManager.getQuestStatus(
                    ACTIVITY_ID
                ),
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

    collectParticle(selectedParticleId) {

        const definition =
            PARTICLE_DEFINITIONS[
                selectedParticleId
            ];

        if (!definition) {
            return {
                accepted: false,
                correct: false,
                collected: false,
                reason: "unknown-particle",
                message:
                    "Choose a proton, neutron, or electron.",
                status: this.getStatus()
            };
        }

        const state = this.ensureState();
        const guidanceComplete =
            this.isGuidanceComplete(state);

        if (!guidanceComplete) {
            return this.collectGuidedParticle(
                state,
                selectedParticleId
            );
        }

        return this.collectFreeParticle(
            selectedParticleId
        );

    },

    collectGuidedParticle(
        state,
        selectedParticleId
    ) {

        const expectedParticleId =
            this.getNextParticleId(state);

        if (
            selectedParticleId !==
            expectedParticleId
        ) {

            state
                .incorrectGuidedSelections +=
                    1;
            state.perfectGuidanceEligible =
                false;

            const saveSucceeded =
                SaveManager.save();

            GameStateObserver.notify(
                "subatomic-assembly-changed",
                {
                    activityId:
                        ACTIVITY_ID,
                    mode: "guided",
                    reason:
                        "incorrect-selection",
                    saveSucceeded
                }
            );

            return {
                accepted: true,
                correct: false,
                collected: false,
                reason: "incorrect",
                expectedParticleId,
                message:
                    PARTICLE_DEFINITIONS[
                        expectedParticleId
                    ].correction,
                saveSucceeded,
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
                correct: true,
                collected: false,
                reason:
                    inventoryResult.reason,
                message:
                    `${PARTICLE_DEFINITIONS[expectedParticleId].name} storage is full (${inventoryResult.current} / ${inventoryResult.capacity}).`,
                status: this.getStatus()
            };
        }

        state.guidedCollected[
            expectedParticleId
        ] += 1;

        let reason = "particle-collected";
        let message =
            `${PARTICLE_DEFINITIONS[expectedParticleId].name} collected: ${PARTICLE_DEFINITIONS[expectedParticleId].charge} charge, ${PARTICLE_DEFINITIONS[expectedParticleId].location.toLowerCase()}.`;

        if (this.isGuidanceComplete(state)) {
            state.guidanceCompletedAtMs =
                Date.now();

            const starResult =
                state
                    .perfectGuidanceEligible &&
                state
                    .incorrectGuidedSelections ===
                    0
                    ? this
                        .awardPerfectGuidanceStar(
                            state
                                .guidanceCompletedAtMs
                        )
                    : {
                        awarded: false,
                        star: null
                    };

            QuestManager.markQuestClaimable(
                ACTIVITY_ID,
                state.guidanceCompletedAtMs
            );

            reason = "quest-ready";
            message =
                starResult.awarded
                    ? "Perfect guided collection! You earned a star. Open the Quests drawer and claim the activity reward."
                    : "Subatomic Assembly objectives complete. Open the Quests drawer and claim the reward.";

            GameStateObserver.notify(
                "subatomic-guidance-completed",
                {
                    activityId: ACTIVITY_ID,
                    completedAtMs:
                        state
                            .guidanceCompletedAtMs,
                    starAwarded:
                        starResult.awarded
                }
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
                mode:
                    this.isGuidanceComplete(
                        state
                    )
                        ? "free-harvest"
                        : "guided",
                saveSucceeded
            }
        );

        return {
            accepted: true,
            correct: true,
            collected: true,
            reason,
            particleId:
                expectedParticleId,
            message,
            saveSucceeded,
            status: this.getStatus()
        };

    },

    collectFreeParticle(particleId) {

        const definition =
            PARTICLE_DEFINITIONS[
                particleId
            ];

        const inventoryResult =
            ParticleInventoryManager
                .addParticle(
                    particleId,
                    1
                );

        if (inventoryResult.added !== 1) {
            return {
                accepted: false,
                correct: true,
                collected: false,
                reason:
                    inventoryResult.reason,
                particleId,
                message:
                    `${definition.name} storage is full (${inventoryResult.current} / ${inventoryResult.capacity}). Spend particles in Atom Lab before collecting more.`,
                status: this.getStatus()
            };
        }

        const saveSucceeded =
            SaveManager.save();

        GameStateObserver.notify(
            "subatomic-assembly-changed",
            {
                activityId: ACTIVITY_ID,
                particleId,
                mode: "free-harvest",
                saveSucceeded
            }
        );

        return {
            accepted: true,
            correct: true,
            collected: true,
            reason: "particle-harvested",
            particleId,
            message:
                `${definition.name} harvested (${inventoryResult.current} / ${inventoryResult.capacity}).`,
            saveSucceeded,
            status: this.getStatus()
        };

    },

    // Retained as a compatibility alias for existing
    // console tests and the current UI callback.
    submitAnswer(particleId) {
        return this.collectParticle(
            particleId
        );
    }

};

export default SubatomicAssemblyManager;
