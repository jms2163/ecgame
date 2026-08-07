const VersionManager = {

    // --------------------------------------------------
    // Version Detection
    // --------------------------------------------------

    getCurrentVersion() {
        // TODO: return current game version (e.g., "1.5")
    },

    getSaveVersion(saveData) {
        // TODO: read version from saveData (e.g., saveData.version)
    },

    isCompatible(saveVersion, currentVersion) {
        // TODO: return true if saveVersion matches currentVersion
    },


    // --------------------------------------------------
    // Upgrade Pipeline
    // --------------------------------------------------

    upgrade(saveData) {
        // TODO: read version
        const version = this.getSaveVersion(saveData);

        // Example upgrade chain (blank stubs)
        if (version === "1.0") {
            saveData = this.upgrade_1_0_to_1_1(saveData);
        }

        if (version === "1.1") {
            saveData = this.upgrade_1_1_to_1_2(saveData);
        }

        if (version === "1.2") {
            saveData = this.upgrade_1_2_to_1_3(saveData);
        }

        // TODO: continue chain until currentVersion

        return saveData;
    },


    // --------------------------------------------------
    // Individual Upgrade Steps
    // --------------------------------------------------

    upgrade_1_0_to_1_1(saveData) {
        // Example:
        // - add Registry.Journal
        // - convert ATP
        // - rename fields
        return saveData;
    },

    upgrade_1_1_to_1_2(saveData) {
        // Example:
        // - restructure inventory
        // - add new settings defaults
        return saveData;
    },

    upgrade_1_2_to_1_3(saveData) {
        // Example:
        // - normalize zone state
        // - add missing fields
        return saveData;
    }
};

export default VersionManager;
