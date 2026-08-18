// --------------------------------------------------
// AtomizerManager.js
// Domain manager and zone controller for automated atom production
// --------------------------------------------------

import gameState from "./GameState.js";
import GameStateObserver from "./GameStateObserver.js";

const AtomizerManager = {
    isSubscribed: false,

    /**
     * Initializes manager state and hooks into global game ticks.
     */
    initialize() {
        this.ensureState();
        this.subscribe();
        return true;
    },

    /**
     * Ensures gameState structure exists for atoms.
     */
    ensureState() {
        gameState.registry ??= {};
        gameState.registry.resources ??= {};
        
        // Fallback default definitions if not already initialized
        gameState.registry.resources.atoms ??= {
            H: { count: 0, cap: 10, progress: 0, unlocked: false, boost: 0, baseRate: 30.0 },
            C: { count: 0, cap: 10, progress: 0, unlocked: false, boost: 0, baseRate: 270.0 },
            N: { count: 0, cap: 10, progress: 0, unlocked: false, boost: 0, baseRate: 315.0 },
            O: { count: 0, cap: 10, progress: 0, unlocked: false, boost: 0, baseRate: 360.0 },
            P: { count: 0, cap: 10, progress: 0, unlocked: false, boost: 0, baseRate: 690.0 },
            S: { count: 0, cap: 10, progress: 0, unlocked: false, boost: 0, baseRate: 720.0 }
        };

        return gameState.registry.resources.atoms;
    },

    /**
     * Connects to the global tick observer.
     */
    subscribe() {
        if (this.isSubscribed) return;
        GameStateObserver.on("game-tick", ({ deltaSec }) => this.tick(deltaSec));
        this.isSubscribed = true;
    },

    /**
     * Core update handler called on every frame tick.
     * @param {number} deltaSec - Time elapsed in seconds since last tick
     */
    tick(deltaSec) {
        if (!deltaSec || deltaSec <= 0) return;

        const atoms = this.ensureState();
        let stateChanged = false;

        Object.entries(atoms).forEach(([symbol, atom]) => {
            // Process synthesis only for unlocked elements
            if (!atom.unlocked) return;

            // Stop progress accumulation if capacity is reached
            if (atom.count >= atom.cap) {
                if (atom.progress !== 0) {
                    atom.progress = 0;
                    stateChanged = true;
                }
                return;
            }

            // Calculate effective progression speed multiplier (e.g. 0% boost = 1.0x, 50% boost = 1.5x)
            const speedMultiplier = 1 + (atom.boost || 0);
            atom.progress += deltaSec * speedMultiplier;
            stateChanged = true;

            // Check for cycle completion
            if (atom.progress >= atom.baseRate) {
                const completedCycles = Math.floor(atom.progress / atom.baseRate);
                const spaceAvailable = atom.cap - atom.count;
                const actualAdds = Math.min(completedCycles, spaceAvailable);

                atom.count += actualAdds;
                atom.progress = (atom.count >= atom.cap) 
                    ? 0 
                    : atom.progress % atom.baseRate;

                // Fire event for individual element synthesis animation
                GameStateObserver.notify("atom-synthesized", {
                    symbol,
                    added: actualAdds,
                    count: atom.count,
                    cap: atom.cap
                });
            }
        });

        if (stateChanged) {
            GameStateObserver.notify("atom-inventory-changed", atoms);
        }
    },

    /**
     * Unlocks a specific element for automated synthesis.
     * @param {string} symbol - Element symbol (e.g., 'H', 'C')
     */
    unlockAtom(symbol) {
        const atoms = this.ensureState();
        if (atoms[symbol] && !atoms[symbol].unlocked) {
            atoms[symbol].unlocked = true;
            GameStateObserver.notify("atom-inventory-changed", atoms);
            return true;
        }
        return false;
    },

    /**
     * Applies a production speed boost percentage to an element.
     * @param {string} symbol - Element symbol
     * @param {number} boostPercent - Boost value as decimal (e.g., 0.50 for 50%)
     */
    setBoost(symbol, boostPercent) {
        const atoms = this.ensureState();
        if (atoms[symbol]) {
            atoms[symbol].boost = Math.max(0, boostPercent);
            GameStateObserver.notify("atom-inventory-changed", atoms);
        }
    },

    /**
     * Returns current state for all atom resources.
     */
    getStatus() {
        return this.ensureState();
    },

    mount(rootEl) {
        // Reserved for Zone UI initialization in Milestone 3
    },

    unmount() {
        // Logic continues running globally via TimeManager
    }
};

export default AtomizerManager;