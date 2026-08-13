// --------------------------------------------------
// VersionManager.js
// Handles save-version detection and upgrades
// --------------------------------------------------

const CURRENT_VERSION = "1.2";

const ZONE_DEFAULTS = Object.freeze({
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
            ZONE_DEFAULTS
        ).forEach(
            ([zoneId, defaultUnlocked]) => {

                const existingZone =
                    saveData.zones[zoneId];

                if (
                    !existingZone ||
                    typeof existingZone !== "object"
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

    }

};

export default VersionManager;
