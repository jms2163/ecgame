// --------------------------------------------------
// PlayerProfileManager.js
// Owns player identity setup and profile normalization
// --------------------------------------------------

import gameState from "./GameState.js";
import GameStateObserver
    from "./GameStateObserver.js";
import SaveManager from "./SaveManager.js";

const PROFILE_SCHEMA_VERSION = "1.0";
const GAMERTAG_MIN_LENGTH = 3;
const GAMERTAG_MAX_LENGTH = 20;
const NAME_PART_MAX_LENGTH = 50;

const PlayerProfileManager = {

    initialized: false,

    initialize() {

        this.normalizePlayerState();

        if (!this.initialized) {
            GameStateObserver.on(
                "game-state-loaded",
                () => {
                    const changed =
                        this.normalizePlayerState();

                    if (changed) {
                        this.notifyProfileChanged(
                            "profile-normalized"
                        );
                    }
                }
            );

            this.initialized = true;
        }

        return true;

    },

    normalizePlayerState() {

        let changed = false;

        if (
            !gameState.player ||
            typeof gameState.player !== "object" ||
            Array.isArray(gameState.player)
        ) {
            gameState.player = {};
            changed = true;
        }

        const player = gameState.player;

        if (
            typeof player.id !== "string" ||
            player.id.trim() === ""
        ) {
            if (player.id !== null) {
                changed = true;
            }

            player.id = null;
        } else {
            const normalizedId =
                player.id.trim();

            if (player.id !== normalizedId) {
                player.id = normalizedId;
                changed = true;
            }
        }

        if (typeof player.name !== "string") {
            player.name = "";
            changed = true;
        } else {
            const normalizedName =
                this.normalizeSpacing(
                    player.name
                );

            if (player.name !== normalizedName) {
                player.name = normalizedName;
                changed = true;
            }
        }

        if (typeof player.displayName !== "string") {
            player.displayName = "";
            changed = true;
        } else {
            const normalizedGamertag =
                this.normalizeSpacing(
                    player.displayName
                );

            if (
                player.displayName !==
                normalizedGamertag
            ) {
                player.displayName =
                    normalizedGamertag;
                changed = true;
            }
        }

        if (
            player.profileSchemaVersion !==
            PROFILE_SCHEMA_VERSION
        ) {
            player.profileSchemaVersion =
                PROFILE_SCHEMA_VERSION;
            changed = true;
        }

        [
            "profileCreatedAtMs",
            "nameLockedAtMs",
            "gamertagUpdatedAtMs"
        ].forEach(fieldName => {
            if (
                !Number.isFinite(
                    player[fieldName]
                )
            ) {
                if (player[fieldName] !== null) {
                    changed = true;
                }

                player[fieldName] = null;
            }
        });

        return changed;

    },

    normalizeSpacing(value) {

        if (typeof value !== "string") {
            return "";
        }

        return value
            .trim()
            .replace(/\s+/g, " ");

    },

    countCharacters(value) {

        return Array.from(value).length;

    },

    validateNamePart(value, label) {

        const normalizedValue =
            this.normalizeSpacing(value);

        if (normalizedValue === "") {
            return {
                ok: false,
                value: normalizedValue,
                code: "required",
                message: `${label} is required.`
            };
        }

        if (
            this.countCharacters(
                normalizedValue
            ) > NAME_PART_MAX_LENGTH
        ) {
            return {
                ok: false,
                value: normalizedValue,
                code: "too-long",
                message:
                    `${label} must be ${NAME_PART_MAX_LENGTH} characters or fewer.`
            };
        }

        const allowedNamePattern =
            /^[\p{L}\p{M}][-\p{L}\p{M} .'’]*$/u;

        if (!allowedNamePattern.test(normalizedValue)) {
            return {
                ok: false,
                value: normalizedValue,
                code: "invalid-characters",
                message:
                    `${label} contains unsupported characters.`
            };
        }

        return {
            ok: true,
            value: normalizedValue,
            code: null,
            message: ""
        };

    },

    validateGamertag(value) {

        const normalizedValue =
            this.normalizeSpacing(value);

        const length =
            this.countCharacters(
                normalizedValue
            );

        if (length < GAMERTAG_MIN_LENGTH) {
            return {
                ok: false,
                value: normalizedValue,
                code: "too-short",
                message:
                    `Gamertag must be at least ${GAMERTAG_MIN_LENGTH} characters.`
            };
        }

        if (length > GAMERTAG_MAX_LENGTH) {
            return {
                ok: false,
                value: normalizedValue,
                code: "too-long",
                message:
                    `Gamertag must be ${GAMERTAG_MAX_LENGTH} characters or fewer.`
            };
        }

        const allowedGamertagPattern =
            /^[\p{L}\p{N} ._-]+$/u;

        if (!allowedGamertagPattern.test(normalizedValue)) {
            return {
                ok: false,
                value: normalizedValue,
                code: "invalid-characters",
                message:
                    "Use letters, numbers, spaces, periods, hyphens, or underscores."
            };
        }

        return {
            ok: true,
            value: normalizedValue,
            code: null,
            message: ""
        };

    },

    validateProfileInput({
        firstName,
        lastName,
        gamertag
    } = {}) {

        const firstNameResult =
            this.validateNamePart(
                firstName,
                "First name"
            );

        const lastNameResult =
            this.validateNamePart(
                lastName,
                "Last name"
            );

        const gamertagResult =
            this.validateGamertag(
                gamertag
            );

        return {
            ok:
                firstNameResult.ok &&
                lastNameResult.ok &&
                gamertagResult.ok,
            values: {
                firstName:
                    firstNameResult.value,
                lastName:
                    lastNameResult.value,
                gamertag:
                    gamertagResult.value
            },
            errors: {
                firstName:
                    firstNameResult.ok
                        ? ""
                        : firstNameResult.message,
                lastName:
                    lastNameResult.ok
                        ? ""
                        : lastNameResult.message,
                gamertag:
                    gamertagResult.ok
                        ? ""
                        : gamertagResult.message
            }
        };

    },

    generatePlayerId() {

        if (
            globalThis.crypto &&
            typeof globalThis.crypto
                .randomUUID === "function"
        ) {
            return globalThis.crypto
                .randomUUID();
        }

        if (
            !globalThis.crypto ||
            typeof globalThis.crypto
                .getRandomValues !== "function"
        ) {
            throw new Error(
                "Secure player ID generation is unavailable."
            );
        }

        const bytes = new Uint8Array(16);

        globalThis.crypto
            .getRandomValues(bytes);

        bytes[6] =
            (bytes[6] & 0x0f) | 0x40;
        bytes[8] =
            (bytes[8] & 0x3f) | 0x80;

        const hex = [...bytes]
            .map(value =>
                value
                    .toString(16)
                    .padStart(2, "0")
            )
            .join("");

        return [
            hex.slice(0, 8),
            hex.slice(8, 12),
            hex.slice(12, 16),
            hex.slice(16, 20),
            hex.slice(20)
        ].join("-");

    },

    hasProfile() {

        this.normalizePlayerState();

        const player = gameState.player;

        return Boolean(
            player.id &&
            player.name &&
            player.displayName &&
            player.nameLockedAtMs
        );

    },

    createProfile(profileInput) {

        if (this.hasProfile()) {
            return {
                ok: false,
                saved: false,
                code: "profile-exists",
                message:
                    "A confirmed player profile already exists."
            };
        }

        const validation =
            this.validateProfileInput(
                profileInput
            );

        if (!validation.ok) {
            return {
                ok: false,
                saved: false,
                code: "validation-failed",
                message:
                    "Correct the profile information and try again.",
                validation
            };
        }

        const nowMs = Date.now();
        const player = gameState.player;

        try {
            player.id =
                this.generatePlayerId();
        } catch (error) {
            console.error(
                "Player profile ID generation failed:",
                error
            );

            return {
                ok: false,
                saved: false,
                code: "id-generation-failed",
                message:
                    "The player profile could not be created in this browser."
            };
        }

        player.name = [
            validation.values.firstName,
            validation.values.lastName
        ].join(" ");

        player.displayName =
            validation.values.gamertag;

        player.profileSchemaVersion =
            PROFILE_SCHEMA_VERSION;
        player.profileCreatedAtMs = nowMs;
        player.nameLockedAtMs = nowMs;
        player.gamertagUpdatedAtMs = nowMs;

        this.notifyProfileChanged(
            "profile-created"
        );

        const saved = SaveManager.save({
            reason: "profile-created"
        });

        return {
            ok: true,
            saved,
            code:
                saved
                    ? "profile-created"
                    : "profile-created-save-failed",
            message:
                saved
                    ? "Player profile created and saved."
                    : "Player profile created, but it was not saved in this browser.",
            profile:
                this.getProfileSnapshot()
        };

    },

    updateGamertag(gamertag) {

        if (!this.hasProfile()) {
            return {
                ok: false,
                saved: false,
                code: "profile-missing",
                message:
                    "Create a player profile first."
            };
        }

        const validation =
            this.validateGamertag(
                gamertag
            );

        if (!validation.ok) {
            return {
                ok: false,
                saved: false,
                code: validation.code,
                message: validation.message
            };
        }

        if (
            validation.value ===
            gameState.player.displayName
        ) {
            return {
                ok: true,
                saved: true,
                changed: false,
                code: "unchanged",
                message: "Gamertag is unchanged.",
                profile:
                    this.getProfileSnapshot()
            };
        }

        gameState.player.displayName =
            validation.value;
        gameState.player.gamertagUpdatedAtMs =
            Date.now();

        this.notifyProfileChanged(
            "gamertag-updated"
        );

        const saved = SaveManager.save({
            reason: "gamertag-updated"
        });

        return {
            ok: true,
            saved,
            changed: true,
            code:
                saved
                    ? "gamertag-updated"
                    : "gamertag-updated-save-failed",
            message:
                saved
                    ? "Gamertag updated and saved."
                    : "Gamertag updated, but it was not saved in this browser.",
            profile:
                this.getProfileSnapshot()
        };

    },

    getProfileSnapshot() {

        this.normalizePlayerState();

        const player = gameState.player;

        return {
            playerId: player.id,
            fullName: player.name,
            gamertag: player.displayName,
            profileSchemaVersion:
                player.profileSchemaVersion,
            profileCreatedAtMs:
                player.profileCreatedAtMs,
            nameLockedAtMs:
                player.nameLockedAtMs,
            gamertagUpdatedAtMs:
                player.gamertagUpdatedAtMs,
            nameLocked:
                Boolean(player.nameLockedAtMs),
            complete:
                this.hasProfile()
        };

    },

    getInitials() {

        const nameParts =
            this.normalizeSpacing(
                gameState.player?.name
            )
                .split(" ")
                .filter(Boolean);

        if (nameParts.length === 0) {
            return "?";
        }

        const firstInitial =
            Array.from(nameParts[0])[0];

        const lastInitial =
            nameParts.length > 1
                ? Array.from(
                    nameParts[
                        nameParts.length - 1
                    ]
                )[0]
                : "";

        return `${firstInitial}${lastInitial}`
            .toLocaleUpperCase();

    },

    notifyProfileChanged(reason) {

        GameStateObserver.notify(
            "player-profile-changed",
            {
                reason,
                profile:
                    this.getProfileSnapshot()
            }
        );

    }

};

export default PlayerProfileManager;
