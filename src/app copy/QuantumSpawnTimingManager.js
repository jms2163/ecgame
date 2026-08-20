// --------------------------------------------------
// QuantumSpawnTimingManager.js
// Owns particle-respawn timing and upgrade formula
// --------------------------------------------------

import gameState from "./GameState.js";
import GameStateObserver
    from "./GameStateObserver.js";
import SaveManager from "./SaveManager.js";

const BASE_RESPAWN_DELAY_MS = 1500;
const REDUCTION_PER_LEVEL_MS = 100;
const MINIMUM_RESPAWN_DELAY_MS = 300;
const MAXIMUM_UPGRADE_LEVEL =
    Math.floor(
        (
            BASE_RESPAWN_DELAY_MS -
            MINIMUM_RESPAWN_DELAY_MS
        ) /
        REDUCTION_PER_LEVEL_MS
    );

const QuantumSpawnTimingManager = {

    initialize() {

        this.ensureState();
        return true;

    },

    ensureState() {

        const quantum =
            gameState.zones?.quantum;

        if (!quantum) {
            throw new Error(
                "QuantumSpawnTimingManager: Quantum zone state is missing"
            );
        }

        quantum.state ??= {};
        quantum.state.upgrades ??= {};

        const upgrades =
            quantum.state.upgrades;

        if (
            !Number.isInteger(
                upgrades
                    .particleRespawnLevel
            ) ||
            upgrades
                .particleRespawnLevel < 0
        ) {
            upgrades
                .particleRespawnLevel = 0;
        }

        upgrades.particleRespawnLevel =
            Math.min(
                upgrades
                    .particleRespawnLevel,
                MAXIMUM_UPGRADE_LEVEL
            );

        return upgrades;

    },

    getUpgradeLevel() {

        return this.ensureState()
            .particleRespawnLevel;

    },

    getRespawnDelayMs() {

        return Math.max(
            MINIMUM_RESPAWN_DELAY_MS,
            BASE_RESPAWN_DELAY_MS -
                this.getUpgradeLevel() *
                REDUCTION_PER_LEVEL_MS
        );

    },

    setUpgradeLevel(
        level,
        {
            save = true
        } = {}
    ) {

        if (
            !Number.isInteger(level) ||
            level < 0 ||
            level >
                MAXIMUM_UPGRADE_LEVEL
        ) {
            return {
                changed: false,
                reason:
                    "invalid-upgrade-level",
                ...this.getStatus()
            };
        }

        const upgrades =
            this.ensureState();

        if (
            upgrades
                .particleRespawnLevel ===
            level
        ) {
            return {
                changed: false,
                reason: "unchanged",
                ...this.getStatus()
            };
        }

        upgrades.particleRespawnLevel =
            level;

        const saveSucceeded =
            save
                ? SaveManager.save()
                : true;

        const status = this.getStatus();

        GameStateObserver.notify(
            "quantum-spawn-timing-changed",
            {
                ...status,
                saveSucceeded
            }
        );

        return {
            changed: true,
            reason: "upgrade-level-set",
            saveSucceeded,
            ...status
        };

    },

    getStatus() {

        return {
            upgradeLevel:
                this.getUpgradeLevel(),
            respawnDelayMs:
                this.getRespawnDelayMs(),
            baseRespawnDelayMs:
                BASE_RESPAWN_DELAY_MS,
            reductionPerLevelMs:
                REDUCTION_PER_LEVEL_MS,
            minimumRespawnDelayMs:
                MINIMUM_RESPAWN_DELAY_MS,
            maximumUpgradeLevel:
                MAXIMUM_UPGRADE_LEVEL
        };

    }

};

export default QuantumSpawnTimingManager;
