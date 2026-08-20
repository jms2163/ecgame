// --------------------------------------------------
// QuantumAudioManager.js
// Owns Quantum-only sound preference and playback
// --------------------------------------------------

import gameState from "./GameState.js";
import GameStateObserver
    from "./GameStateObserver.js";
import SaveManager from "./SaveManager.js";

const ICON_PATHS = Object.freeze({
    on: "./public/assets/ui/sound_on.png",
    off: "./public/assets/ui/sound_off.png"
});

const SOUND_PATHS = Object.freeze({
    // Place particle-collect.ogg in:
    // public/assets/sounds/quantum/
    // Then set this value to:
    // "./public/assets/sounds/quantum/particle-collect.ogg"
    collect: "",

    // Place particle-spawn.ogg in:
    // public/assets/sounds/quantum/
    // Then set this value to:
    // "./public/assets/sounds/quantum/particle-spawn.ogg"
    spawn: ""
});

const DEFAULT_VOLUME = 0.42;

const QuantumAudioManager = {

    initialize() {

        this.ensureState();
        return true;

    },

    ensureState() {

        const quantum =
            gameState.zones?.quantum;

        if (!quantum) {
            throw new Error(
                "QuantumAudioManager: Quantum zone state is missing"
            );
        }

        quantum.state ??= {};

        if (
            !quantum.state.audio ||
            typeof quantum.state.audio !==
                "object" ||
            Array.isArray(
                quantum.state.audio
            )
        ) {
            quantum.state.audio = {
                enabled: true
            };
        }

        if (
            typeof quantum.state.audio
                .enabled !== "boolean"
        ) {
            quantum.state.audio.enabled =
                true;
        }

        return quantum.state.audio;

    },

    isEnabled() {

        return this.ensureState().enabled;

    },

    setEnabled(
        enabled,
        {
            save = true
        } = {}
    ) {

        const state = this.ensureState();
        const normalizedEnabled =
            Boolean(enabled);

        if (
            state.enabled ===
            normalizedEnabled
        ) {
            return this.getStatus();
        }

        state.enabled =
            normalizedEnabled;

        const saveSucceeded =
            save
                ? SaveManager.save()
                : true;

        GameStateObserver.notify(
            "quantum-audio-changed",
            {
                enabled:
                    state.enabled,
                saveSucceeded
            }
        );

        return this.getStatus();

    },

    toggle(options = {}) {

        return this.setEnabled(
            !this.isEnabled(),
            options
        );

    },

    getIconPath() {

        return this.isEnabled()
            ? ICON_PATHS.on
            : ICON_PATHS.off;

    },

    getSoundPath(soundId) {

        return SOUND_PATHS[soundId] ?? "";

    },

    play(soundId) {

        if (!this.isEnabled()) {
            return {
                played: false,
                soundId,
                reason: "quantum-sound-muted"
            };
        }

        const soundPath =
            this.getSoundPath(soundId);

        // Sound paths intentionally remain blank until
        // the matching audio files are added. This guard
        // prevents missing-file requests and console 404s.
        if (!soundPath) {
            return {
                played: false,
                soundId,
                reason: "sound-not-configured"
            };
        }

        if (typeof Audio !== "function") {
            return {
                played: false,
                soundId,
                reason: "audio-api-unavailable"
            };
        }

        try {
            const audio =
                new Audio(soundPath);

            audio.volume = DEFAULT_VOLUME;
            audio.preload = "auto";

            const playRequest =
                audio.play();

            playRequest?.catch?.(
                error => {
                    console.warn(
                        `QuantumAudioManager: unable to play ${soundId}`,
                        error
                    );
                }
            );

            return {
                played: true,
                soundId,
                reason: "play-requested"
            };

        } catch (error) {
            console.warn(
                `QuantumAudioManager: unable to create ${soundId} audio`,
                error
            );

            return {
                played: false,
                soundId,
                reason: "audio-error"
            };
        }

    },

    playCollectSound() {
        return this.play("collect");
    },

    playSpawnSound() {
        return this.play("spawn");
    },

    getStatus() {

        return {
            enabled: this.isEnabled(),
            iconPath: this.getIconPath(),
            soundsConfigured: {
                collect:
                    Boolean(
                        SOUND_PATHS.collect
                    ),
                spawn:
                    Boolean(
                        SOUND_PATHS.spawn
                    )
            }
        };

    }

};

export default QuantumAudioManager;
