// --------------------------------------------------
// VersionManager.js
// Handles save-version detection and upgrades
// --------------------------------------------------

const CURRENT_VERSION = "1.5";

const VERSION_1_2_ZONE_DEFAULTS =
    Object.freeze({
        pond: true,
        quantum: false,
        atomLab: false,
        atomizer: false,
        molecularizer: false,
        macromolecularizer: false,
        polymerizer: false,
        metabolism: false,
        genetics: false
    });

const VersionManager = {

    getCurrentVersion() {
        return CURRENT_VERSION;
    },

    getSaveVersion(saveData) {

        return saveData?.saveVersion ??
            "1.0";

    },

    isCompatible(
        saveVersion,
        currentVersion
    ) {

        return saveVersion ===
            currentVersion;

    },

    upgrade(saveData) {

        if (
            !saveData ||
            typeof saveData !== "object"
        ) {
            throw new Error(
                "Save data must be an object"
            );
        }

        let version =
            this.getSaveVersion(
                saveData
            );

        while (version !== CURRENT_VERSION) {

            if (version === "1.0") {
                saveData =
                    this.upgrade_1_0_to_1_1(
                        saveData
                    );
            } else if (version === "1.1") {
                saveData =
                    this.upgrade_1_1_to_1_2(
                        saveData
                    );
            } else if (version === "1.2") {
                saveData =
                    this.upgrade_1_2_to_1_3(
                        saveData
                    );
            } else if (version === "1.3") {
                saveData =
                    this.upgrade_1_3_to_1_4(
                        saveData
                    );
            } else if (version === "1.4") {
                saveData =
                    this.upgrade_1_4_to_1_5(
                        saveData
                    );
            } else {
                throw new Error(
                    `No upgrade path exists for save version ${version}`
                );
            }

            version =
                this.getSaveVersion(
                    saveData
                );

        }

        console.log(
            `Save upgraded successfully to ${CURRENT_VERSION}`
        );

        return saveData;

    },

    // --------------------------------------------------
    // 1.0 -> 1.1
    // --------------------------------------------------
    upgrade_1_0_to_1_1(saveData) {

        saveData.player ??= {};

        saveData.player.displayName ??=
            saveData.player.name ?? "";

        saveData.saveVersion = "1.1";

        return saveData;

    },

    // --------------------------------------------------
    // 1.1 -> 1.2
    // Adds explicit persisted completion state to each
    // canonical zone without altering existing unlocks.
    // --------------------------------------------------
    upgrade_1_1_to_1_2(saveData) {

        saveData.zones ??= {};

        Object.entries(
            VERSION_1_2_ZONE_DEFAULTS
        ).forEach(
            ([zoneId, defaultUnlocked]) => {

                const existingZone =
                    saveData.zones[zoneId];

                if (
                    !existingZone ||
                    typeof existingZone !==
                        "object"
                ) {
                    saveData.zones[zoneId] = {
                        unlocked:
                            defaultUnlocked,
                        completed: false,
                        state: {}
                    };

                    return;
                }

                if (
                    typeof existingZone.unlocked !==
                    "boolean"
                ) {
                    existingZone.unlocked =
                        defaultUnlocked;
                }

                if (
                    typeof existingZone.completed !==
                    "boolean"
                ) {
                    existingZone.completed =
                        false;
                }

                if (
                    !existingZone.state ||
                    typeof existingZone.state !==
                    "object"
                ) {
                    existingZone.state = {};
                }

            }
        );

        saveData.saveVersion = "1.2";

        return saveData;

    },

    // --------------------------------------------------
    // 1.2 -> 1.3
    // Releases q1 Subatomic Assembly, adds its progress
    // record and particle inventory, and restores the old
    // intended beginning-of-path Quantum availability.
    // No later zone is unlocked unless q1 is complete.
    // --------------------------------------------------
    upgrade_1_2_to_1_3(saveData) {

        saveData.registry ??= {};
        saveData.registry.resources ??= {};

        const resources =
            saveData.registry.resources;

        if (
            !resources.particles ||
            typeof resources.particles !==
                "object"
        ) {
            resources.particles = {};
        }

        const particles =
            resources.particles;

        if (
            !Number.isInteger(
                particles.capacity
            ) ||
            particles.capacity < 5
        ) {
            particles.capacity = 5;
        }

        [
            "proton",
            "neutron",
            "electron"
        ].forEach(particleId => {

            if (
                !Number.isInteger(
                    particles[particleId]
                ) ||
                particles[particleId] < 0
            ) {
                particles[particleId] = 0;
            }

            particles[particleId] =
                Math.min(
                    particles[particleId],
                    particles.capacity
                );

        });

        saveData.zones ??= {};

        saveData.zones.quantum ??= {
            unlocked: true,
            completed: false,
            state: {}
        };

        const quantum =
            saveData.zones.quantum;

        quantum.state ??= {};

        if (
            !quantum.state
                .subatomicAssembly ||
            typeof quantum.state
                .subatomicAssembly !==
                "object"
        ) {
            quantum.state
                .subatomicAssembly = {};
        }

        const activity =
            quantum.state
                .subatomicAssembly;

        activity.activityId =
            "q1_particles";
        activity.totalCollected ??= {};

        [
            "proton",
            "neutron",
            "electron"
        ].forEach(particleId => {

            const total =
                activity.totalCollected[
                    particleId
                ];

            activity.totalCollected[
                particleId
            ] =
                Number.isInteger(total) &&
                total >= 0
                    ? Math.min(total, 5)
                    : 0;

        });

        activity.completed =
            Boolean(activity.completed);
        activity.completedAtMs =
            Number.isFinite(
                activity.completedAtMs
            )
                ? activity.completedAtMs
                : null;

        // q1 is now a released entry activity. This is
        // the only unlock deliberately changed by 1.3.
        quantum.unlocked = true;
        quantum.completed =
            activity.completed;

        saveData.zones.atomLab ??= {
            unlocked: false,
            completed: false,
            state: {}
        };

        if (activity.completed) {
            saveData.zones.atomLab
                .unlocked = true;
        }

        saveData.saveVersion = "1.3";

        return saveData;

    },

    // --------------------------------------------------
    // 1.3 -> 1.4
    // Separates guided Q1 progress, manual quest claim,
    // repeatable particle inventory, and Quantum mastery.
    // Existing 1.3 saves that already received the Q1
    // rewards migrate to claimed without another award.
    // --------------------------------------------------
    upgrade_1_3_to_1_4(saveData) {

        const particleIds = [
            "proton",
            "neutron",
            "electron"
        ];

        saveData.registry ??= {};
        saveData.registry.resources ??= {};

        const resources =
            saveData.registry.resources;

        if (
            !resources.particles ||
            typeof resources.particles !==
                "object"
        ) {
            resources.particles = {};
        }

        const particles =
            resources.particles;

        if (
            !Number.isInteger(
                particles.capacity
            ) ||
            particles.capacity < 5
        ) {
            particles.capacity = 5;
        }

        if (
            !particles.lifetimeCollected ||
            typeof particles
                .lifetimeCollected !==
                "object"
        ) {
            particles.lifetimeCollected = {};
        }

        saveData.zones ??= {};
        saveData.zones.quantum ??= {
            unlocked: true,
            completed: false,
            state: {}
        };

        const quantum =
            saveData.zones.quantum;

        quantum.unlocked = true;
        quantum.state ??= {};

        if (
            !quantum.state
                .subatomicAssembly ||
            typeof quantum.state
                .subatomicAssembly !==
                "object"
        ) {
            quantum.state
                .subatomicAssembly = {};
        }

        const activity =
            quantum.state
                .subatomicAssembly;

        const legacyCollected =
            activity.guidedCollected ??
            activity.totalCollected ??
            {};

        const guidedCollected = {};

        particleIds.forEach(
            particleId => {

                const guidedValue =
                    legacyCollected[
                        particleId
                    ];

                guidedCollected[
                    particleId
                ] =
                    Number.isInteger(
                        guidedValue
                    ) &&
                    guidedValue >= 0
                        ? Math.min(
                            guidedValue,
                            5
                        )
                        : 0;

                const inventoryValue =
                    particles[particleId];

                particles[particleId] =
                    Number.isInteger(
                        inventoryValue
                    ) &&
                    inventoryValue >= 0
                        ? Math.min(
                            inventoryValue,
                            particles.capacity
                        )
                        : 0;

                const lifetimeValue =
                    particles
                        .lifetimeCollected[
                            particleId
                        ];

                const normalizedLifetime =
                    Number.isInteger(
                        lifetimeValue
                    ) &&
                    lifetimeValue >= 0
                        ? lifetimeValue
                        : 0;

                particles
                    .lifetimeCollected[
                        particleId
                    ] = Math.max(
                        normalizedLifetime,
                        guidedCollected[
                            particleId
                        ],
                        particles[particleId]
                    );

            }
        );

        const guidanceComplete =
            particleIds.every(
                particleId =>
                    guidedCollected[
                        particleId
                    ] >= 5
            );

        const legacyCompleted =
            Boolean(activity.completed);

        const legacyCompletedAtMs =
            Number.isFinite(
                activity.completedAtMs
            )
                ? activity.completedAtMs
                : null;

        activity.activityId =
            "q1_particles";
        activity.guidedCollected =
            guidedCollected;
        activity.guidanceCompletedAtMs =
            guidanceComplete
                ? (
                    Number.isFinite(
                        activity
                            .guidanceCompletedAtMs
                    )
                        ? activity
                            .guidanceCompletedAtMs
                        : legacyCompletedAtMs
                )
                : null;

        delete activity.totalCollected;
        delete activity.completed;
        delete activity.completedAtMs;

        if (
            !saveData.registry.quests ||
            Array.isArray(
                saveData.registry.quests
            ) ||
            typeof saveData.registry
                .quests !== "object"
        ) {
            saveData.registry.quests = {};
        }

        const questRecords =
            saveData.registry.quests;

        if (
            !questRecords.q1_particles ||
            typeof questRecords
                .q1_particles !== "object"
        ) {
            questRecords.q1_particles = {};
        }

        const q1 =
            questRecords.q1_particles;

        if (legacyCompleted) {
            q1.status = "claimed";
            q1.readyAtMs =
                legacyCompletedAtMs;
            q1.claimedAtMs =
                legacyCompletedAtMs;
        } else if (guidanceComplete) {
            q1.status = "claimable";
            q1.readyAtMs =
                activity
                    .guidanceCompletedAtMs;
            q1.claimedAtMs = null;
        } else {
            q1.status = "in-progress";
            q1.readyAtMs = null;
            q1.claimedAtMs = null;
        }

        // Q1 completion is not Quantum mastery. The zone
        // remains available until all collector upgrades
        // are implemented and unlocked in a later milestone.
        quantum.completed = false;

        saveData.zones.atomLab ??= {
            unlocked: false,
            completed: false,
            state: {}
        };

        // A legacy completed record means the 1.3 code
        // already applied Q1 rewards before saving.
        if (legacyCompleted) {
            saveData.zones.atomLab
                .unlocked = true;
        }

        saveData.saveVersion = "1.4";

        return saveData;

    },

    // --------------------------------------------------
    // 1.4 -> 1.5
    // Adds persistent evidence for the optional perfect
    // guided-identification star. Existing attempts that
    // already have progress are conservatively ineligible
    // because their earlier mistake history is unknown.
    // --------------------------------------------------
    upgrade_1_4_to_1_5(saveData) {

        saveData.registry ??= {};
        saveData.registry.research ??= {};

        if (
            !saveData.registry.research
                .stars ||
            typeof saveData.registry.research
                .stars !== "object" ||
            Array.isArray(
                saveData.registry.research
                    .stars
            )
        ) {
            saveData.registry.research
                .stars = {};
        }

        saveData.zones ??= {};
        saveData.zones.quantum ??= {
            unlocked: true,
            completed: false,
            state: {}
        };

        const quantum =
            saveData.zones.quantum;

        quantum.state ??= {};
        quantum.state.subatomicAssembly ??= {
            activityId: "q1_particles",
            guidedCollected: {
                proton: 0,
                neutron: 0,
                electron: 0
            },
            guidanceCompletedAtMs: null
        };

        const activity =
            quantum.state
                .subatomicAssembly;

        const guidedCollected =
            activity.guidedCollected ?? {};

        const particleIds = [
            "proton",
            "neutron",
            "electron"
        ];

        const totalProgress =
            particleIds.reduce(
                (total, particleId) => {
                    const value =
                        guidedCollected[
                            particleId
                        ];

                    return total + (
                        Number.isInteger(
                            value
                        ) && value >= 0
                            ? Math.min(value, 5)
                            : 0
                    );
                },
                0
            );

        activity
            .incorrectGuidedSelections =
                Number.isInteger(
                    activity
                        .incorrectGuidedSelections
                ) &&
                activity
                    .incorrectGuidedSelections >= 0
                    ? activity
                        .incorrectGuidedSelections
                    : 0;

        if (
            typeof activity
                .perfectGuidanceEligible !==
                "boolean"
        ) {
            activity
                .perfectGuidanceEligible =
                    totalProgress === 0;
        }

        if (
            activity
                .incorrectGuidedSelections > 0
        ) {
            activity
                .perfectGuidanceEligible =
                    false;
        }

        saveData.saveVersion = "1.5";

        return saveData;

    }

};

export default VersionManager;
