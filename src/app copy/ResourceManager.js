// --------------------------------------------------
// ResourceManager.js
// Manages global spendable game resources
// --------------------------------------------------

import gameState from "./GameState.js";

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