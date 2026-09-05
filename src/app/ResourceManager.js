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

    // --------------------------------------------------
    // Notify observers after an ATP balance change
    // --------------------------------------------------
    notifyATPChanged(
        delta,
        reason,
        detail = {}
    ) {

        const status =
            this.getATPStatus();

        const payload = {
            ...status,
            ...detail,
            delta,
            reason
        };

        GameStateObserver.notify(
            "atp-changed",
            payload
        );

        return payload;

    },

    // --------------------------------------------------
    // Permanently increase ATP storage without refilling it
    // --------------------------------------------------
    increaseATPCapacity(
        amount,
        reason = "atp-capacity-increased"
    ) {

        if (
            !Number.isInteger(amount) ||
            amount <= 0
        ) {
            console.warn(
                "ResourceManager: ATP capacity increase must be a positive integer"
            );

            return false;
        }

        const atp =
            this.ensureATPResource();

        atp.maximum +=
            amount;

        this.notifyATPChanged(
            0,
            reason,
            {
                capacityDelta:
                    amount
            }
        );

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
    spendATP(
        amount,
        reason = "resource-spend"
    ) {

        if (!this.canSpendATP(amount)) {
            return false;
        }

        const atp =
            this.ensureATPResource();

        atp.current -= amount;

        this.notifyATPChanged(
            -amount,
            reason
        );

        return true;

    },

    // --------------------------------------------------
    // Add ATP up to its maximum reserve
    // --------------------------------------------------
    addATP(
        amount,
        reason = "resource-gain"
    ) {

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

        if (actualGain <= 0) {
            return 0;
        }

        atp.current += actualGain;

        this.notifyATPChanged(
            actualGain,
            reason
        );

        return actualGain;

    }

};

export default ResourceManager;
