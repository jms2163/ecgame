// --------------------------------------------------
// SPManager.js
// Owns Atomizer Skill Point (SP) state
// --------------------------------------------------

import gameState from "./GameState.js";
import GameStateObserver from "./GameStateObserver.js";

const SPManager = {

    // --------------------------------------------------
    // Read current available SP
    // --------------------------------------------------
    getSP() {

        const sp =
            gameState.zones?.atomizer?.state?.availableSp;

        return Number.isFinite(sp) &&
            sp >= 0
            ? sp
            : 0;

    },

    // --------------------------------------------------
    // Award SP
    // --------------------------------------------------
    addSP(amount) {

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            console.warn(
                "SPManager: SP award must be a positive number"
            );

            return false;
        }

        const atomizerState =
            gameState.zones?.atomizer?.state;

        if (!atomizerState) {
            console.warn(
                "SPManager: Atomizer zone state is unavailable"
            );

            return false;
        }

        const updatedSP =
            this.getSP() + amount;

        atomizerState.availableSp =
            updatedSP;

        GameStateObserver.notify(
            "sp-changed",
            { availableSp: updatedSP }
        );

        return updatedSP;

    },

    // Used by transactional reward rollback.
    setSP(amount) {

        if (
            !Number.isFinite(amount) ||
            amount < 0
        ) {
            return false;
        }

        const atomizerState =
            gameState.zones?.atomizer?.state;

        if (!atomizerState) {
            return false;
        }

        atomizerState.availableSp = amount;

        GameStateObserver.notify(
            "sp-changed",
            { availableSp: amount }
        );

        return atomizerState.availableSp;

    }

};

export default SPManager;