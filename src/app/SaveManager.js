// --------------------------------------------------
// SaveManager.js
// Handles local saving, loading, export, and backup
// --------------------------------------------------

import gameState from "./GameState.js";
import VersionManager
    from "./VersionManager.js";
import GameStateObserver
    from "./GameStateObserver.js";

const SAVE_KEY = "ECGame_Save";
const BACKUP_KEY = "ECGame_Save_Backup";

const SaveManager = {

    initialize() {
        return true;
    },

    save() {

        try {
            gameState.saveVersion =
                VersionManager
                    .getCurrentVersion();

            localStorage.setItem(
                SAVE_KEY,
                JSON.stringify(gameState)
            );

            console.log(
                "Game saved."
            );

            return true;

        } catch (error) {
            console.error(
                "Failed to save game:",
                error
            );

            return false;
        }

    },

    load() {

        const data =
            localStorage.getItem(
                SAVE_KEY
            );

        if (!data) {
            console.warn(
                "No save found."
            );

            return false;
        }

        try {
            let saveData =
                JSON.parse(data);

            const saveVersion =
                VersionManager
                    .getSaveVersion(
                        saveData
                    );

            const currentVersion =
                VersionManager
                    .getCurrentVersion();

            if (
                !VersionManager.isCompatible(
                    saveVersion,
                    currentVersion
                )
            ) {
                console.log(
                    `Save requires upgrade: ${saveVersion} -> ${currentVersion}`
                );

                this.backup();

                saveData =
                    VersionManager.upgrade(
                        saveData
                    );

                localStorage.setItem(
                    SAVE_KEY,
                    JSON.stringify(saveData)
                );
            }

            Object.assign(
                gameState,
                saveData
            );

            GameStateObserver.notify(
                "game-state-loaded",
                {
                    source: "local-storage"
                }
            );

            console.log(
                "Game loaded:",
                gameState
            );

            return true;

        } catch (error) {
            console.error(
                "Failed to load game save:",
                error
            );

            return false;
        }

    },

    backup() {

        const data =
            localStorage.getItem(
                SAVE_KEY
            );

        if (!data) {
            console.warn(
                "No save exists to back up."
            );

            return false;
        }

        localStorage.setItem(
            BACKUP_KEY,
            data
        );

        console.log(
            "Previous save backed up."
        );

        return true;

    },

    restoreBackup() {

        const backup =
            localStorage.getItem(
                BACKUP_KEY
            );

        if (!backup) {
            console.warn(
                "No save backup exists."
            );

            return false;
        }

        localStorage.setItem(
            SAVE_KEY,
            backup
        );

        console.log(
            "Previous save restored. Call SaveManager.load() to hydrate it."
        );

        return true;

    },

    export() {

        return JSON.stringify(
            gameState,
            null,
            2
        );

    },

    import() {

        console.log(
            "Import not implemented yet."
        );

        return false;

    },

    clear() {

        localStorage.removeItem(
            SAVE_KEY
        );

        console.log(
            "Game save cleared."
        );

        return true;

    }

};

export default SaveManager;
