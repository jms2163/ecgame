// --------------------------------------------------
// XPManager.js
// Owns player experience-point state
// --------------------------------------------------

import gameState from "./GameState.js";

const XPManager = {

    // --------------------------------------------------
    // Read current player XP
    // --------------------------------------------------
    getXP() {

        const xp =
            gameState.player?.xp;

        return Number.isFinite(xp) &&
            xp >= 0
            ? xp
            : 0;

    },

    // --------------------------------------------------
    // Award XP
    // --------------------------------------------------
    addXP(amount) {

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            console.warn(
                "XPManager: XP award must be a positive number"
            );

            return false;
        }

        const updatedXP =
            this.getXP() + amount;

        gameState.player.xp =
            updatedXP;

        return updatedXP;

    },

    // Used by transactional reward rollback.
    setXP(amount) {

        if (
            !Number.isFinite(amount) ||
            amount < 0
        ) {
            return false;
        }

        gameState.player.xp = amount;

        return gameState.player.xp;

    }

};

export default XPManager;
