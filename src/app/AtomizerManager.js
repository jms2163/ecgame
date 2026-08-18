// --------------------------------------------------
// AtomizerManager.js
// Domain manager and zone controller for automated atom production
// --------------------------------------------------

import GameStateObserver from "./GameStateObserver.js";
import AtomizerUI from "./AtomizerUI.js";
import GameStateManager from "./GameStateManager.js";

const AtomizerManager = {
    active: false,
    isSubscribed: false,
    state: null,

    initialize() {
        this.ensureState();
        GameStateManager.syncAtomizerUnlocks();
        this.subscribe();
        return true;
    },

    activate() {
        this.active = true;
        this.ensureState();

        // 1. Sync global discoveries with local atomizer unlock state
        GameStateManager.syncAtomizerUnlocks();

        // 2. Ensure live state reference is up to date
        this.state = GameStateManager.getZoneSnapshot("atomizer")?.state;

        this.processOfflineGeneration();
        
        if (typeof AtomizerUI !== "undefined") {
            AtomizerUI.initialize();
        }

        const zoneEl = document.getElementById("atomizer-zone");
        if (zoneEl) zoneEl.classList.remove("hidden");

        if (typeof AtomizerUI !== "undefined") {
            AtomizerUI.renderAll(this.state);
        }
    },

    deactivate() {
        this.active = false;
        const zoneEl = document.getElementById("atomizer-zone");
        if (zoneEl) zoneEl.classList.add("hidden");
    },

/**
 * Retrieves the central GameState reference for the Atomizer zone
 */
/**
 * Retrieves the central GameState reference for the Atomizer zone
 */
ensureState() {
    const snapshot = typeof GameStateManager.getZoneSnapshot === 'function'
        ? GameStateManager.getZoneSnapshot('atomizer')
        : null;

    const state = snapshot?.state;

    if (!state) {
        throw new Error("AtomizerManager: Atomizer zone state is missing from GameStateManager");
    }

    this.state = state;
    return this.state;
},

getStatus() {
    this.ensureState();
    return this.state;
},

notifyStateChange() {
    GameStateObserver.notify("atom-inventory-changed", this.state);
},

/**
 * Calculates Skill Points directly against global discoveries in GameStateManager
 */
getSkillPointData() {
    if (!this.state) this.ensureState();

    // Query global discoveries registered across the entire game
    const discoveriesState = typeof GameStateManager.getState === 'function'
        ? GameStateManager.getState('discoveries')
        : (GameStateManager.state && GameStateManager.state.discoveries);

    const totalDiscoveries = discoveriesState 
        ? Object.keys(discoveriesState).length 
        : (this.state?.totalDiscoveries || 0);

    const totalSP = Math.floor(totalDiscoveries / 5);
    const spentSP = Object.values(this.state?.spAllocated || {}).reduce((a, b) => a + b, 0);

    return {
        total: totalSP,
        spent: spentSP,
        available: Math.max(0, totalSP - spentSP)
    };
},

    processOfflineGeneration() {
        if (!this.state || !this.state.atoms) return;

        const now = Date.now();
        const elapsedSeconds = Math.min((now - (this.state.lastActiveTimestamp || now)) / 1000, 86400);

        if (elapsedSeconds >= 5) {
            Object.keys(this.state.atoms).forEach(symbol => {
                const atom = this.state.atoms[symbol];
                if (atom.unlocked) {
                    const spBoost = (this.state.spAllocated?.[symbol] || 0) * 0.10;
                    const speedMult = 1 + (atom.boost || 0) + spBoost;
                    const effectiveInterval = Math.max(1, atom.baseRate / speedMult);
                    const generated = elapsedSeconds / effectiveInterval;

                    atom.count = Math.min(atom.cap, atom.count + generated);
                }
            });
        }

        this.state.lastActiveTimestamp = now;
        this.notifyStateChange();
    },

    spendSkillPoint(symbol) {
        const spData = this.getSkillPointData();
        const atom = this.state.atoms[symbol];

        if (spData.available <= 0 || !atom || !atom.unlocked) return false;

        this.state.spAllocated[symbol] = (this.state.spAllocated[symbol] || 0) + 1;
        this.notifyStateChange();
        return true;
    },

    resetSkillPoints() {
        if ((this.state.atp || 0) < 10) {
            return { success: false, reason: "Insufficient ATP (Requires 10 ATP)." };
        }

        this.state.atp -= 10;
        Object.keys(this.state.spAllocated).forEach(sym => this.state.spAllocated[sym] = 0);
        this.notifyStateChange();
        return { success: true };
    },

    subscribe() {
    if (this.isSubscribed) return;

    // 1. Existing tick listener for atom generation
    GameStateObserver.on("game-tick", ({ deltaSec }) => this.tick(deltaSec));

    // 2. Listener for atom synthesis unlocks (C, N, O, P, S)
    GameStateObserver.on("discovery-made", (payload) => {
        if (payload?.category === "atoms" && payload?.symbol) {
            GameStateManager.unlockAtomizerAtom(payload.symbol);

            // Re-render UI if Atomizer zone is currently active
            if (this.active && typeof AtomizerUI !== "undefined") {
                AtomizerUI.render();
            }
        }
    });

    this.isSubscribed = true;
},

// 2. Update tick event emit line inside tick()
tick(deltaSec) {
    if (!this.state || !this.state.atoms) return;

    Object.entries(this.state.atoms).forEach(([symbol, atom]) => {
        if (!atom.unlocked) return;

        const spBoost = (this.state.spAllocated?.[symbol] || 0) * 0.10;
        const speedMult = 1 + (atom.boost || 0) + spBoost;
        const effectiveInterval = Math.max(1, atom.baseRate / speedMult);

        atom.progress = (atom.progress || 0) + deltaSec;

        if (atom.progress >= effectiveInterval) {
            const generated = Math.floor(atom.progress / effectiveInterval);
            atom.count = Math.min(atom.cap, atom.count + generated);
            atom.progress %= effectiveInterval;

            // Updated from .emit to .notify
            GameStateObserver.notify("atom-synthesized", { symbol });
        }
    });

    this.notifyStateChange();
},

    unlockAtom(symbol) {
        this.ensureState();
        if (this.state.atoms[symbol] && !this.state.atoms[symbol].unlocked) {
            this.state.atoms[symbol].unlocked = true;
            this.notifyStateChange();
            return true;
        }
        return false;
    },

    setBoost(symbol, boostPercent) {
        this.ensureState();
        if (this.state.atoms[symbol]) {
            this.state.atoms[symbol].boost = Math.max(0, boostPercent);
            this.notifyStateChange();
        }
    }
};

export default AtomizerManager;