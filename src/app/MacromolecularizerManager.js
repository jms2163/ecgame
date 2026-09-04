// --------------------------------------------------
// MacromolecularizerManager.js
// Domain authority for Macromolecularizer progression
// and persistent-state normalization
// --------------------------------------------------

import GameStateManager from "./GameStateManager.js";
import GameStateObserver from "./GameStateObserver.js";
import DiscoveryManager from "./DiscoveryManager.js";
import SaveManager from "./SaveManager.js";

const ZONE_ID = "macromolecularizer";
const DEFAULT_CATEGORY = "motifs";
const FIRST_MOTIF_ID = "H_helix";
const REACTION_DISCOVERY_IDS = Object.freeze([
    "dehydration",
    "hydrolysis"
]);

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
    // Read reaction knowledge from categorized discoveries
    // --------------------------------------------------
    hasReactionDiscovery(reactionId) {

        if (
            typeof reactionId !== "string" ||
            !REACTION_DISCOVERY_IDS.includes(
                reactionId.trim()
            )
        ) {
            return false;
        }

        return GameStateManager
            .hasDiscoveryInCategory(
                "reactions",
                reactionId.trim()
            );

    },

    // --------------------------------------------------
    // Record one temporary reaction-discovery gate
    // --------------------------------------------------
    discoverReaction(reactionId) {

        if (typeof reactionId !== "string") {
            return {
                success: false,
                discovered: false,
                saved: false,
                reason: "unknown-reaction",
                message: "That reaction is not available for discovery."
            };
        }

        const normalizedId =
            reactionId.trim();

        if (
            !REACTION_DISCOVERY_IDS.includes(
                normalizedId
            )
        ) {
            return {
                success: false,
                discovered: false,
                saved: false,
                reason: "unknown-reaction",
                reactionId: normalizedId,
                message: "That reaction is not available for discovery."
            };
        }

        if (
            this.hasReactionDiscovery(
                normalizedId
            )
        ) {
            return {
                success: true,
                discovered: false,
                saved: true,
                reason: "already-discovered",
                reactionId: normalizedId,
                message:
                    `${normalizedId} is already discovered.`
            };
        }

        const recorded =
            DiscoveryManager.record(
                "reactions",
                normalizedId
            );

        if (!recorded) {
            return {
                success: false,
                discovered: false,
                saved: false,
                reason: "record-failed",
                reactionId: normalizedId,
                message: "The reaction discovery could not be recorded."
            };
        }

        const saved =
            SaveManager.save({
                reason:
                    "macromolecularizer-reaction-discovered"
            });

        this.notifyStateChange(
            "reaction-discovered",
            {
                reactionId: normalizedId,
                saved
            }
        );

        return {
            success: saved,
            discovered: true,
            saved,
            reason: saved
                ? "reaction-discovered"
                : "save-failed",
            reactionId: normalizedId,
            message: saved
                ? `${normalizedId} discovered and saved.`
                : `${normalizedId} was discovered, but the browser save failed.`
        };

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

        const reactionDiscoveries =
            Object.fromEntries(
                REACTION_DISCOVERY_IDS.map(
                    reactionId => [
                        reactionId,
                        this.hasReactionDiscovery(
                            reactionId
                        )
                    ]
                )
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
            reactionDiscoveries,
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
