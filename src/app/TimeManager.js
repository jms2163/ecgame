// --------------------------------------------------
// TimeManager.js
// Centralized time delta calculations and game loop
// --------------------------------------------------

import GameStateObserver from "./GameStateObserver.js";

let animationFrameId = null;
let lastTimestamp = 0;
let isRunning = false;

// Prevents huge tick jumps if the player switches browser tabs
const MAX_DELTA_SEC = 1.0; 

const TimeManager = {

    /**
     * Launches the game loop ticker.
     */
    start() {
        if (isRunning) return;
        isRunning = true;
        lastTimestamp = performance.now();
        animationFrameId = requestAnimationFrame(this.loop.bind(this));
    },

    /**
     * Pauses the game loop ticker.
     */
    stop() {
        if (!isRunning) return;
        isRunning = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    },

    /**
     * Core frame handler executed via requestAnimationFrame.
     * @param {number} currentTimestamp
     */
    loop(currentTimestamp) {
        if (!isRunning) return;

        const rawDeltaSec = (currentTimestamp - lastTimestamp) / 1000;
        lastTimestamp = currentTimestamp;

        // Clamp delta to protect state updates during tab throttling
        const deltaSec = Math.min(Math.max(rawDeltaSec, 0), MAX_DELTA_SEC);

        GameStateObserver.notify("game-tick", {
            deltaSec,
            timestamp: currentTimestamp
        });

        animationFrameId = requestAnimationFrame(this.loop.bind(this));
    }
};

export default TimeManager;