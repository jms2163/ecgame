// --------------------------------------------------
// VersionManager.js
// Handles save-version detection and upgrades
// --------------------------------------------------

const CURRENT_VERSION = "1.3";

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

    }

};

export default VersionManager;
