// --------------------------------------------------
// ATPManager.js
// Produces the guaranteed base ATP regeneration rate
// --------------------------------------------------

import GameStateObserver from "./GameStateObserver.js";
import ResourceManager from "./ResourceManager.js";

const BASE_ATP_INTERVAL_SEC = 60;

let initialized = false;
let accumulatedSeconds = 0;
let gameTickHandler = null;

const ATPManager = {

    // --------------------------------------------------
    // Initialize ATP production once
    // --------------------------------------------------
    initialize() {

        if (initialized) {
            return false;
        }

        ResourceManager.initialize();

        gameTickHandler = payload => {
            this.handleGameTick(payload);
        };

        GameStateObserver.on(
            "game-tick",
            gameTickHandler
        );

        initialized = true;

        return true;

    },

    // --------------------------------------------------
    // Read the guaranteed base production rate
    // --------------------------------------------------
    getProductionRatePerSecond() {

        return 1 / BASE_ATP_INTERVAL_SEC;

    },

    // --------------------------------------------------
    // Process one central game tick
    // --------------------------------------------------
    handleGameTick(payload = {}) {

        const deltaSec =
            payload.deltaSec;

        if (
            !Number.isFinite(deltaSec) ||
            deltaSec <= 0
        ) {
            return 0;
        }

        const atpStatus =
            ResourceManager.getATPStatus();

        // Time spent at full capacity is intentionally
        // discarded rather than banked for later use.
        if (
            atpStatus.current >=
            atpStatus.maximum
        ) {
            accumulatedSeconds = 0;

            return 0;
        }

        accumulatedSeconds += deltaSec;

        const wholeATP =
            Math.floor(
                accumulatedSeconds /
                BASE_ATP_INTERVAL_SEC
            );

        if (wholeATP < 1) {
            return 0;
        }

        accumulatedSeconds -=
            wholeATP *
            BASE_ATP_INTERVAL_SEC;

        const actualGain =
            ResourceManager.addATP(
                wholeATP,
                "base-metabolism"
            );

        const updatedStatus =
            ResourceManager.getATPStatus();

        if (
            actualGain < wholeATP ||
            updatedStatus.current >=
                updatedStatus.maximum
        ) {
            accumulatedSeconds = 0;
        }

        return actualGain;

    },

    // --------------------------------------------------
    // Development-console status
    // --------------------------------------------------
    getStatus() {

        return {
            initialized,
            secondsPerATP:
                BASE_ATP_INTERVAL_SEC,
            baseATPPerSecond:
                this.getProductionRatePerSecond(),
            accumulatedSeconds
        };

    }

};

export default ATPManager;
