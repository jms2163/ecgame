// --------------------------------------------------
// SynthesisPointManager.js
// Owns the registry-backed Synthesis Point resource.
// Future quests award these points; zones may spend them.
// --------------------------------------------------

import gameState from "./GameState.js";
import GameStateObserver
    from "./GameStateObserver.js";

const RESOURCE_ID =
    "synthesisPoints";

const DEFAULT_RESOURCE =
    Object.freeze({
        current: 0,
        lifetimeEarned: 0
    });

function isRecord(value) {

    return Boolean(
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
    );

}

function safeInteger(value) {

    return Number.isFinite(value)
        ? Math.max(
            0,
            Math.floor(value)
        )
        : 0;

}

const SynthesisPointManager = {

    initialized: false,

    initialize() {

        this.ensureState();
        this.initialized = true;

        return true;

    },

    ensureState() {

        gameState.registry ??= {};
        gameState.registry.resources ??= {};

        if (
            !isRecord(
                gameState.registry
                    .resources[
                        RESOURCE_ID
                    ]
            )
        ) {
            gameState.registry
                .resources[
                    RESOURCE_ID
                ] = {
                    ...DEFAULT_RESOURCE
                };
        }

        const resource =
            gameState.registry
                .resources[
                    RESOURCE_ID
                ];

        resource.current =
            safeInteger(
                resource.current
            );

        resource.lifetimeEarned =
            Math.max(
                resource.current,
                safeInteger(
                    resource
                        .lifetimeEarned
                )
            );

        return resource;

    },

    getStatus() {

        const resource =
            this.ensureState();

        return {
            current:
                resource.current,
            lifetimeEarned:
                resource.lifetimeEarned
        };

    },

    getPoints() {

        return this.ensureState()
            .current;

    },

    addPoints(
        amount,
        reason = "synthesis-points-awarded"
    ) {

        if (
            !Number.isInteger(amount) ||
            amount <= 0
        ) {
            console.warn(
                "SynthesisPointManager: award must be a positive integer"
            );

            return false;
        }

        const resource =
            this.ensureState();

        resource.current +=
            amount;
        resource.lifetimeEarned +=
            amount;

        this.notifyChange(
            amount,
            reason
        );

        return resource.current;

    },

    spendPoints(
        amount,
        reason = "synthesis-points-spent"
    ) {

        if (
            !Number.isInteger(amount) ||
            amount <= 0
        ) {
            return false;
        }

        const resource =
            this.ensureState();

        if (resource.current < amount) {
            return false;
        }

        resource.current -=
            amount;

        this.notifyChange(
            -amount,
            reason
        );

        return resource.current;

    },

    restoreStatus(snapshot) {

        if (!isRecord(snapshot)) {
            return false;
        }

        const resource =
            this.ensureState();

        resource.current =
            safeInteger(
                snapshot.current
            );

        resource.lifetimeEarned =
            Math.max(
                resource.current,
                safeInteger(
                    snapshot
                        .lifetimeEarned
                )
            );

        this.notifyChange(
            0,
            "synthesis-points-restored"
        );

        return this.getStatus();

    },

    notifyChange(delta, reason) {

        const status =
            this.getStatus();

        GameStateObserver.notify(
            "synthesis-points-changed",
            {
                ...status,
                delta,
                reason
            }
        );

        return status;

    }

};

export default SynthesisPointManager;
