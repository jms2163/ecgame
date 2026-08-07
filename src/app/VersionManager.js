// --------------------------------------------------
// VersionManager.js
// Handles save-version detection and upgrades
// --------------------------------------------------

const VersionManager = {

    // --------------------------------------------------
    // Current save format
    // --------------------------------------------------

    getCurrentVersion() {

        return "1.1";

    },


    // --------------------------------------------------
    // Read version from save
    // --------------------------------------------------

    getSaveVersion(saveData) {

        return saveData.saveVersion;

    },


    // --------------------------------------------------
    // Check compatibility
    // --------------------------------------------------

    isCompatible(saveVersion, currentVersion) {

        return saveVersion === currentVersion;

    },


    // --------------------------------------------------
    // Upgrade save
    // --------------------------------------------------

    upgrade(saveData) {

        let version =
            this.getSaveVersion(saveData);

        const currentVersion =
            this.getCurrentVersion();


        // --------------------------------------------------
        // Already current
        // --------------------------------------------------

        if (version === currentVersion) {

            console.log(
                "Save version is current:",
                currentVersion
            );

            return saveData;
        }


        // --------------------------------------------------
        // Upgrade pipeline
        // --------------------------------------------------

        while (version !== currentVersion) {

            if (version === "1.0") {

                saveData =
                    this.upgrade_1_0_to_1_1(
                        saveData
                    );

            } else {

                throw new Error(
                    `No upgrade path exists for save version ${version}`
                );

            }


            version =
                this.getSaveVersion(saveData);

        }


        console.log(
            `Save upgraded successfully to ${currentVersion}`
        );


        return saveData;

    },


    // --------------------------------------------------
    // 1.0 → 1.1
    // --------------------------------------------------

    upgrade_1_0_to_1_1(saveData) {

        saveData.player.displayName =
            saveData.player.name;

        saveData.saveVersion = "1.1";

        return saveData;

    }

};


// --------------------------------------------------
// Development testing only
// --------------------------------------------------


export default VersionManager;