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

let saveStatus = {
    state: "idle",
    ok: null,
    message: "No save action has run yet.",
    lastAttemptAtMs: null,
    lastSuccessfulSaveAtMs: null,
    reason: null,
    errorName: null
};

const SaveManager = {

    initialize() {

        this.ensureSaveMetadata();

        saveStatus = {
            ...saveStatus,
            lastSuccessfulSaveAtMs:
                gameState.saveMetadata
                    .lastSavedAtMs
        };

        return true;

    },

    ensureSaveMetadata() {

        if (
            !gameState.saveMetadata ||
            typeof gameState.saveMetadata !== "object" ||
            Array.isArray(gameState.saveMetadata)
        ) {
            gameState.saveMetadata = {};
        }

        if (
            !Number.isFinite(
                gameState.saveMetadata
                    .lastSavedAtMs
            )
        ) {
            gameState.saveMetadata
                .lastSavedAtMs = null;
        }

        return gameState.saveMetadata;

    },

    publishStatus(nextStatus) {

        saveStatus = {
            ...saveStatus,
            ...nextStatus
        };

        GameStateObserver.notify(
            "save-status-changed",
            this.getStatus()
        );

    },

    getStatus() {

        return {
            ...saveStatus
        };

    },

    hasSave() {

        try {
            return localStorage.getItem(
                SAVE_KEY
            ) !== null;
        } catch (error) {
            console.error(
                "Unable to inspect local game save:",
                error
            );

            return false;
        }

    },

    save(options = {}) {

        const reason =
            typeof options.reason === "string"
                ? options.reason
                : "unspecified";

        const attemptedAtMs = Date.now();

        this.ensureSaveMetadata();

        const previousSavedAtMs =
            gameState.saveMetadata
                .lastSavedAtMs;

        try {
            gameState.saveVersion =
                VersionManager
                    .getCurrentVersion();

            gameState.saveMetadata
                .lastSavedAtMs =
                    attemptedAtMs;

            const serializedState =
                JSON.stringify(gameState);

            localStorage.setItem(
                SAVE_KEY,
                serializedState
            );

            const storedState =
                localStorage.getItem(
                    SAVE_KEY
                );

            if (storedState !== serializedState) {
                throw new Error(
                    "The saved data could not be read back exactly."
                );
            }

            JSON.parse(storedState);

            this.publishStatus({
                state: "saved",
                ok: true,
                message: "Game saved in this browser.",
                lastAttemptAtMs:
                    attemptedAtMs,
                lastSuccessfulSaveAtMs:
                    attemptedAtMs,
                reason,
                errorName: null
            });

            console.log(
                "Game saved."
            );

            return true;

        } catch (error) {
            gameState.saveMetadata
                .lastSavedAtMs =
                    previousSavedAtMs;

            this.publishStatus({
                state: "save-failed",
                ok: false,
                message:
                    "The game could not be saved in this browser.",
                lastAttemptAtMs:
                    attemptedAtMs,
                lastSuccessfulSaveAtMs:
                    previousSavedAtMs,
                reason,
                errorName:
                    error?.name || "Error"
            });

            console.error(
                "Failed to save game:",
                error
            );

            return false;
        }

    },

    load() {

        const attemptedAtMs = Date.now();

        try {
            const data =
                localStorage.getItem(
                    SAVE_KEY
                );

            if (!data) {
                this.publishStatus({
                    state: "no-save",
                    ok: null,
                    message:
                        "No local game save was found.",
                    lastAttemptAtMs:
                        attemptedAtMs,
                    lastSuccessfulSaveAtMs:
                        null,
                    reason: "startup-load",
                    errorName: null
                });

                console.warn(
                    "No save found."
                );

                return false;
            }

            let saveData =
                JSON.parse(data);

            if (
                !saveData ||
                typeof saveData !== "object" ||
                Array.isArray(saveData)
            ) {
                throw new Error(
                    "The local save does not contain a game-state object."
                );
            }

            if (
                !Object.prototype.hasOwnProperty.call(
                    saveData,
                    "saveMetadata"
                )
            ) {
                saveData.saveMetadata = {
                    lastSavedAtMs: null
                };
            }

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

            this.ensureSaveMetadata();

            GameStateObserver.notify(
                "game-state-loaded",
                {
                    source: "local-storage"
                }
            );

            this.publishStatus({
                state: "loaded",
                ok: true,
                message:
                    "Local game save loaded.",
                lastAttemptAtMs:
                    attemptedAtMs,
                lastSuccessfulSaveAtMs:
                    gameState.saveMetadata
                        .lastSavedAtMs,
                reason: "startup-load",
                errorName: null
            });

            console.log(
                "Game loaded:",
                gameState
            );

            return true;

        } catch (error) {
            this.publishStatus({
                state: "load-failed",
                ok: false,
                message:
                    "The local game save could not be loaded.",
                lastAttemptAtMs:
                    attemptedAtMs,
                reason: "startup-load",
                errorName:
                    error?.name || "Error"
            });

            console.error(
                "Failed to load game save:",
                error
            );

            return false;
        }

    },

    backup() {

        try {
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

        } catch (error) {
            console.error(
                "Failed to back up game save:",
                error
            );

            return false;
        }

    },

    restoreBackup() {

        try {
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

            JSON.parse(backup);

            localStorage.setItem(
                SAVE_KEY,
                backup
            );

            console.log(
                "Previous save restored. Call SaveManager.load() to hydrate it."
            );

            return true;

        } catch (error) {
            console.error(
                "Failed to restore game save backup:",
                error
            );

            return false;
        }

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

        try {
            localStorage.removeItem(
                SAVE_KEY
            );

            this.publishStatus({
                state: "no-save",
                ok: null,
                message:
                    "No local game save exists.",
                lastAttemptAtMs:
                    Date.now(),
                lastSuccessfulSaveAtMs:
                    null,
                reason: "save-cleared",
                errorName: null
            });

            console.log(
                "Game save cleared."
            );

            return true;

        } catch (error) {
            console.error(
                "Failed to clear game save:",
                error
            );

            return false;
        }

    }

};

export default SaveManager;
