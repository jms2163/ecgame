// --------------------------------------------------
// SaveManager.js
// Handles saving, loading, exporting, importing,
// and backup/restore of game saves.
// --------------------------------------------------

import gameState from "./GameState.js";
import VersionManager from "./VersionManager.js";

const SAVE_KEY = "ECGame_Save";
const BACKUP_KEY = "ECGame_Save_Backup";

const SaveManager = {

    // --------------------------------------------------
    // Initialize
    // --------------------------------------------------
    initialize() {
        // Reserved for initial setup if needed later
    },


    // --------------------------------------------------
    // Save
    // --------------------------------------------------
    save() {
        localStorage.setItem(
            SAVE_KEY,
            JSON.stringify(gameState)
        );
        console.log("Game saved.");
    },


    // --------------------------------------------------
    // Load
    // --------------------------------------------------
    load() {

    const data = localStorage.getItem(SAVE_KEY);

    if (!data) {
        console.warn("No save found.");
        return;
    }

    try {

        let saveData = JSON.parse(data);

        const saveVersion =
            VersionManager.getSaveVersion(saveData);

        const currentVersion =
            VersionManager.getCurrentVersion();


        // --------------------------------------------------
        // Check whether an upgrade is required
        // --------------------------------------------------

        if (
            !VersionManager.isCompatible(
                saveVersion,
                currentVersion
            )
        ) {

            console.log(
                `Save requires upgrade: ${saveVersion} → ${currentVersion}`
            );


            // Preserve the original save
            this.backup();


            // Upgrade the save
            saveData =
                VersionManager.upgrade(saveData);


            // Save the upgraded version
            localStorage.setItem(
                SAVE_KEY,
                JSON.stringify(saveData)
            );

        }


        // --------------------------------------------------
        // Hydrate live GameState
        // --------------------------------------------------

        Object.assign(
            gameState,
            saveData
        );


        console.log(
            "Game loaded:",
            gameState
        );

    } catch (error) {

        console.error(
            "Failed to load game save:",
            error
        );

    }

},


    // --------------------------------------------------
    // Backup
    // --------------------------------------------------
    backup() {
        const data = localStorage.getItem(SAVE_KEY);

        if (!data) {
            console.warn("No save exists to back up.");
            return;
        }

        localStorage.setItem(BACKUP_KEY, data);
        console.log("Previous save backed up.");
    },


    // --------------------------------------------------
    // Restore Backup
    // --------------------------------------------------
    restoreBackup() {
        const backup = localStorage.getItem(BACKUP_KEY);

        if (!backup) {
            console.warn("No save backup exists.");
            return;
        }

        localStorage.setItem(SAVE_KEY, backup);
        console.log("Previous save restored.");
    },


    // --------------------------------------------------
    // Export
    // --------------------------------------------------
    export() {
        return JSON.stringify(gameState, null, 2);
    },


    // --------------------------------------------------
    // Import
    // --------------------------------------------------
    import(data) {
        // TODO: Load external save data into gameState once structure is finalized
        console.log("Import not implemented yet.");
    },


    // --------------------------------------------------
    // Clear
    // --------------------------------------------------
    clear() {
        localStorage.removeItem(SAVE_KEY);
        console.log("Game save cleared.");
    }

};

export default SaveManager;
