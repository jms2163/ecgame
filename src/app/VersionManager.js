// --------------------------------------------------
// VersionManager.js
// Under-construction save policy
//
// ECGame is not published yet. During active development,
// every local save is accepted without running migrations.
// Managers normalize the state they own when initialized.
//
// Before the first public release, replace this policy with
// explicit numbered migrations and a compatibility check.
// --------------------------------------------------

const DEVELOPMENT_VERSION =
    "under-construction";

const VersionManager = {

    getCurrentVersion() {
        return DEVELOPMENT_VERSION;
    },

    getSaveVersion(saveData) {
        return saveData?.saveVersion ??
            DEVELOPMENT_VERSION;
    },

    isCompatible() {
        // All development saves are accepted. If a schema
        // change becomes incompatible while building, clear
        // the local test save instead of adding a migration.
        return true;
    },

    upgrade(saveData) {
        // SaveManager will not call this while the game is
        // under construction because isCompatible() is true.
        return saveData;
    }

};

export default VersionManager;
