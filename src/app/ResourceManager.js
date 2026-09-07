// --------------------------------------------------
// ResourceManager.js
// Manages global spendable game resources
// --------------------------------------------------

import gameState from "./GameState.js";
import GameStateObserver from "./GameStateObserver.js";

const DEFAULT_ATP = {

    current: 50,
    maximum: 50

};

const ResourceManager = {

    // --------------------------------------------------
    // Ensure global resource state exists
    // --------------------------------------------------
    initialize() {

        this.ensureATPResource();

    },

    // --------------------------------------------------
    // Ensure ATP resource exists
    // --------------------------------------------------
    ensureATPResource() {

        if (!gameState.registry) {
            gameState.registry = {};
        }

        if (!gameState.registry.resources) {
            gameState.registry.resources = {};
        }

        if (!gameState.registry.resources.atp) {
            gameState.registry.resources.atp = {
                ...DEFAULT_ATP
            };
        }

        return gameState.registry.resources.atp;

    },

    // --------------------------------------------------
    // Read ATP status
    // --------------------------------------------------
    getATPStatus() {

        const atp =
            this.ensureATPResource();

        return {
            current: atp.current,
            maximum: atp.maximum
        };

    },
    // Atomic resource update used by reward application and rollback.
    // Callers increasing capacity preserve the current balance explicitly.
    setATPStatus(status, reason = "atp-status-restored") {
        if (!Number.isSafeInteger(status?.current) || status.current < 0 ||
            !Number.isSafeInteger(status?.maximum) || status.maximum < status.current) {
            throw new Error("ResourceManager: invalid ATP status");
        }
        const atp = this.ensureATPResource();
        const previous = this.getATPStatus();
        atp.current = status.current;
        atp.maximum = status.maximum;
        try {
            GameStateObserver.notify("atp-changed", {
                ...this.getATPStatus(), delta: status.current - previous.current, reason
            });
        } catch (error) {
            atp.current = previous.current;
            atp.maximum = previous.maximum;
            throw error;
        }
        return this.getATPStatus();
    },
        // --------------------------------------------------
    // Check whether ATP can be spent
    // --------------------------------------------------
    canSpendATP(amount) {

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            return false;
        }

        const atp =
            this.ensureATPResource();

        return atp.current >= amount;

    },

    // --------------------------------------------------
    // Spend ATP if available
    // --------------------------------------------------
    spendATP(amount) {

        if (!this.canSpendATP(amount)) {
            return false;
        }

        const atp =
            this.ensureATPResource();

        atp.current -= amount;

        return true;

    },

    // --------------------------------------------------
    // Add ATP up to its maximum reserve
    // --------------------------------------------------
    addATP(amount) {

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            return 0;
        }

        const atp =
            this.ensureATPResource();

        const availableSpace =
            atp.maximum - atp.current;

        const actualGain =
            Math.min(
                amount,
                availableSpace
            );

        atp.current += actualGain;

        return actualGain;

    }

};

export default ResourceManager;
