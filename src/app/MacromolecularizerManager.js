// --------------------------------------------------
// MacromolecularizerManager.js
// Domain authority for Macromolecularizer progression
// and persistent-state normalization
// --------------------------------------------------

import GameStateManager from "./GameStateManager.js";
import GameStateObserver from "./GameStateObserver.js";

const ZONE_ID = "macromolecularizer";
const DEFAULT_CATEGORY = "motifs";
const FIRST_MOTIF_ID = "H_helix";

function isRecord(value) {

    return Boolean(
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
    );

}

function safeInteger(value) {

    return Number.isFinite(value)
        ? Math.max(0, Math.floor(value))
        : 0;

}

function safeTimestamp(value) {

    return Number.isFinite(value)
        ? value
        : null;

}

const MacromolecularizerManager = {

    initialized: false,
    active: false,
    subscribed: false,

    // --------------------------------------------------
    // Initialize domain state once
    // --------------------------------------------------
    initialize() {

        if (this.initialized) {
            this.ensureState();

            return true;
        }

        this.ensureState();
        this.subscribe();

        this.initialized = true;

        console.log(
            "[MacromolecularizerManager] Initialized with persistent state."
        );

        return true;

    },

    // --------------------------------------------------
    // Activate domain behavior for the visible zone
    // --------------------------------------------------
    activate() {

        if (!this.initialized) {
            this.initialize();
        }

        this.active = true;
        this.ensureState();
        this.notifyStateChange(
            "activated"
        );

        return true;

    },

    // --------------------------------------------------
    // Deactivate visible-zone domain behavior
    // --------------------------------------------------
    deactivate() {

        this.active = false;

        return true;

    },

    // --------------------------------------------------
    // Normalize additive state after any save load
    // --------------------------------------------------
    ensureState() {

        const state =
            GameStateManager.ensureZoneState(
                ZONE_ID
            );

        if (!state) {
            throw new Error(
                "MacromolecularizerManager: unable to create zone state"
            );
        }

        if (state.activeCategory !== DEFAULT_CATEGORY) {
            state.activeCategory =
                DEFAULT_CATEGORY;
        }

        if (
            typeof state.selectedMotifId !== "string" ||
            state.selectedMotifId.trim() === ""
        ) {
            state.selectedMotifId =
                FIRST_MOTIF_ID;
        } else {
            state.selectedMotifId =
                state.selectedMotifId.trim();
        }

        if (
            state.activeSynthesis !== null &&
            !isRecord(state.activeSynthesis)
        ) {
            state.activeSynthesis = null;
        }

        if (!isRecord(state.synthesized)) {
            state.synthesized = {};
        }

        Object.entries(
            state.synthesized
        ).forEach(
            ([motifId, record]) => {

                if (!isRecord(record)) {
                    state.synthesized[motifId] = {
                        count: 0,
                        firstCompletedAtMs: null,
                        lastCompletedAtMs: null
                    };

                    return;
                }

                record.count =
                    safeInteger(record.count);

                record.firstCompletedAtMs =
                    safeTimestamp(
                        record.firstCompletedAtMs
                    );

                record.lastCompletedAtMs =
                    safeTimestamp(
                        record.lastCompletedAtMs
                    );

            }
        );

        if (!isRecord(state.motifInventory)) {
            state.motifInventory = {};
        }

        Object.entries(
            state.motifInventory
        ).forEach(
            ([motifId, count]) => {
                state.motifInventory[motifId] =
                    safeInteger(count);
            }
        );

        return state;

    },

    // --------------------------------------------------
    // Read a safe development snapshot
    // --------------------------------------------------
    getStatus() {

        const state =
            this.ensureState();

        const zone =
            GameStateManager.getZoneSnapshot(
                ZONE_ID
            );

        return {
            initialized:
                this.initialized,
            active:
                this.active,
            unlocked:
                Boolean(zone?.unlocked),
            completed:
                Boolean(zone?.completed),
            activeCategory:
                state.activeCategory,
            selectedMotifId:
                state.selectedMotifId,
            activeSynthesis:
                state.activeSynthesis
                    ? structuredClone(
                        state.activeSynthesis
                    )
                    : null,
            synthesized:
                structuredClone(
                    state.synthesized
                ),
            motifInventory:
                structuredClone(
                    state.motifInventory
                )
        };

    },

    // --------------------------------------------------
    // Publish domain changes for future UI observers
    // --------------------------------------------------
    notifyStateChange(reason, detail = {}) {

        GameStateObserver.notify(
            "macromolecularizer-state-changed",
            {
                reason,
                ...detail
            }
        );

    },

    // --------------------------------------------------
    // Subscribe once for future manual save loads
    // --------------------------------------------------
    subscribe() {

        if (this.subscribed) {
            return;
        }

        GameStateObserver.on(
            "game-state-loaded",
            () => {
                this.ensureState();
                this.notifyStateChange(
                    "state-loaded"
                );
            }
        );

        this.subscribed = true;

    }

};

export default MacromolecularizerManager;
