// --------------------------------------------------
// SignalingManager.js
// Minimal state authority for the console-locked Signaling foundation.
// No pathway progress is persisted until its activities are designed.
// --------------------------------------------------

import GameStateManager
    from "./GameStateManager.js";

const ZONE_ID = "signaling";

const SignalingManager = {

    initialized: false,
    active: false,

    initialize() {
        this.ensureState();
        this.initialized = true;
        return true;
    },

    ensureState() {
        const state =
            GameStateManager.ensureZoneState(
                ZONE_ID
            );

        if (!state) {
            throw new Error(
                "SignalingManager: unable to ensure zone state"
            );
        }

        // Intentionally empty. The foundation owns no speculative
        // selections, activities, or completion records.
        return state;
    },

    activate() {
        if (!this.initialized) {
            this.initialize();
        }

        this.active = true;
        return true;
    },

    deactivate() {
        this.active = false;
        return true;
    },

    getStatus() {
        const zone =
            GameStateManager.getZoneSnapshot(
                ZONE_ID
            );

        return {
            initialized: this.initialized,
            active: this.active,
            unlocked: Boolean(
                zone?.unlocked
            ),
            completed: Boolean(
                zone?.completed
            ),
            state:
                structuredClone(
                    zone?.state ?? {}
                )
        };
    }

};

export default SignalingManager;
