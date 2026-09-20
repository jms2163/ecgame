// --------------------------------------------------
// PondDiscoveryManager.js
// Records microbiomes reached through intentional Pond movement.
// Passive world updates, current drift, and anchoring never call this API.
// --------------------------------------------------

import gameState from "./GameState.js";
import GameStateObserver
    from "./GameStateObserver.js";
import MicrobiomeLibrary
    from "./MicrobiomeLibrary.js";
import SaveManager from "./SaveManager.js";

const MANUAL_MOVEMENT_SOURCE =
    "manual-movement";

function clone(value) {
    return structuredClone(value);
}

const PondDiscoveryManager = {

    initialized: false,

    initialize() {
        this.ensureState();
        this.initialized = true;
        return true;
    },

    ensureState() {
        gameState.zones ??= {};
        gameState.zones.pond ??= {
            unlocked: true,
            completed: false,
            state: {}
        };
        gameState.zones.pond.state ??= {};

        const pondState =
            gameState.zones.pond.state;

        if (
            !pondState.discoveredMicrobiomes ||
            typeof pondState
                .discoveredMicrobiomes !==
                "object" ||
            Array.isArray(
                pondState.discoveredMicrobiomes
            )
        ) {
            pondState.discoveredMicrobiomes = {};
        }

        return pondState.discoveredMicrobiomes;
    },

    getDiscoveries() {
        return clone(this.ensureState());
    },

    hasDiscovered(biomeId) {
        return Object.prototype.hasOwnProperty.call(
            this.ensureState(),
            biomeId
        );
    },

    recordArrival(
        tile,
        position,
        source = MANUAL_MOVEMENT_SOURCE
    ) {
        if (source !== MANUAL_MOVEMENT_SOURCE) {
            return {
                discovered: false,
                reason: "non-manual-arrival"
            };
        }

        const biomeId = tile?.biome;

        if (
            typeof biomeId !== "string" ||
            !Object.prototype.hasOwnProperty.call(
                MicrobiomeLibrary,
                biomeId
            )
        ) {
            return {
                discovered: false,
                reason: "unknown-microbiome"
            };
        }

        const discoveries =
            this.ensureState();

        if (discoveries[biomeId]) {
            return {
                discovered: false,
                reason: "already-discovered",
                biomeId,
                record: clone(
                    discoveries[biomeId]
                )
            };
        }

        const firstPosition = {
            x: Number.isFinite(position?.x)
                ? position.x
                : null,
            y: Number.isFinite(position?.y)
                ? position.y
                : null
        };
        const record = {
            firstDiscoveredAtMs: Date.now(),
            firstPosition,
            discoveryMethod:
                MANUAL_MOVEMENT_SOURCE
        };

        discoveries[biomeId] = record;

        if (!SaveManager.save({
            reason:
                "pond-microbiome-discovered"
        })) {
            delete discoveries[biomeId];

            return {
                discovered: false,
                reason: "save-failed",
                biomeId
            };
        }

        GameStateObserver.notify(
            "microbiome-discovered",
            {
                biomeId,
                record: clone(record)
            }
        );

        return {
            discovered: true,
            reason: "first-discovery",
            biomeId,
            record: clone(record)
        };
    }

};

export {
    MANUAL_MOVEMENT_SOURCE
};

export default PondDiscoveryManager;
