// --------------------------------------------------
// AtomizerManager.js
// Domain manager and zone controller for automated atom production
// --------------------------------------------------

import GameStateObserver from "./GameStateObserver.js";
import AtomizerUI from "./AtomizerUI.js";
import GameStateManager from "./GameStateManager.js";
import SaveManager from "./SaveManager.js";
import ResourceManager from "./ResourceManager.js";
import SPManager from "./SPManager.js";

function safeDisplayedCount(value) {
    return Number.isFinite(Number(value))
        ? Math.max(0, Math.floor(Number(value)))
        : 0;
}

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
    this.ensureState(); // Directly hooks into live GameStateManager state

    // 1. Sync global discoveries with local atomizer unlock state
    GameStateManager.syncAtomizerUnlocks();

    // 2. Process offline generation using live state
    this.processOfflineGeneration();
    
    // 3. Initialize and render UI
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




ensureState() {
    const liveState = GameStateManager.getZoneState('atomizer');

    if (!liveState) {
        throw new Error("AtomizerManager: Atomizer zone state missing from GameStateManager");
    }

    this.state = liveState;
    return this.state;
},

getStatus() {
    this.ensureState();
    return this.state;
},

notifyStateChange(reason = "state-changed", detail = {}) {
    // Keep the historical top-level state shape expected by AtomizerUI while
    // identifying the producer for other zone managers.
    GameStateObserver.notify("atom-inventory-changed", {
        ...this.state,
        source: "atomizer",
        reason,
        ...detail
    });
},

/**
 * Calculates Skill Points using SPManager / Atomizer state
 */
getSkillPointData() {
    if (!this.state) this.ensureState();

    // 1. Read available SP directly from state / SPManager
    const availableSP = typeof SPManager !== 'undefined'
        ? SPManager.getSP()
        : (this.state?.availableSp || 0);

    // 2. Calculate SP already spent on upgrades
    const spentSP = Object.values(this.state?.spAllocated || {}).reduce((a, b) => a + b, 0);

    // 3. Total SP earned is available + spent
    const totalSP = availableSP + spentSP;

    return {
        total: totalSP,
        spent: spentSP,
        available: availableSP
    };
},

    processOfflineGeneration() {
        if (!this.state || !this.state.atoms) return;

        const now = Date.now();
        const elapsedSeconds = Math.min((now - (this.state.lastActiveTimestamp || now)) / 1000, 86400);
        const changedSymbols = [];

        if (elapsedSeconds >= 5) {
            Object.keys(this.state.atoms).forEach(symbol => {
                const atom = this.state.atoms[symbol];
                if (atom.unlocked) {
                    const previousDisplayedCount = safeDisplayedCount(atom.count);
                    const spBoost = (this.state.spAllocated?.[symbol] || 0) * 0.10;
                    const speedMult = 1 + (atom.boost || 0) + spBoost;
                    const effectiveInterval = Math.max(1, atom.baseRate / speedMult);
                    const generated = elapsedSeconds / effectiveInterval;

                    atom.count = Math.min(atom.cap, atom.count + generated);
                    if (safeDisplayedCount(atom.count) !== previousDisplayedCount) {
                        changedSymbols.push(symbol);
                    }
                }
            });
        }

        this.state.lastActiveTimestamp = now;
        if (changedSymbols.length > 0) {
            changedSymbols.forEach(symbol => {
                GameStateObserver.notify("atomizer-updated", {
                    symbol,
                    count: this.state.atoms[symbol].count,
                    source: "offline-generation"
                });
            });
            this.notifyStateChange("offline-generation", { changedSymbols });
        }
    },

/**
 * Allocates 1 available Skill Point to an atom element
 */
spendSkillPoint(symbol) {
    const state = this.ensureState();
    const availableSp = SPManager.getSP();
    const atom = state?.atoms?.[symbol];

    if (availableSp <= 0 || !atom || !atom.unlocked) {
        return false;
    }

    // 1. Deduct 1 SP via SPManager (updates live state & notifies "sp-changed")
    SPManager.setSP(availableSp - 1);

    // 2. Increment allocation on the exact same live state reference
    if (!state.spAllocated) state.spAllocated = {};
    state.spAllocated[symbol] = (state.spAllocated[symbol] || 0) + 1;

    // 3. Notify zone observer & trigger SaveManager
    this.notifyStateChange("skill-point-spent", { symbol });
    if (typeof SaveManager !== "undefined" && SaveManager.save) {
        SaveManager.save();
    }

    return true;
},

syncBoostsFromSP() {
    // No-op: SP boost is calculated dynamically on-the-fly in AtomizerUI 
    // and tick() via spAllocated to prevent double-counting in atom.boost.
},

/**
 * Resets all allocated Skill Points back to available balance for 10 ATP
 */
resetSkillPoints() {
    const state = this.ensureState();
    const rm = typeof ResourceManager !== "undefined" ? ResourceManager : window.ECGame?.ResourceManager;

    // 1. Check ATP cost
    if (rm && typeof rm.canSpendATP === "function") {
        if (!rm.canSpendATP(10)) {
            return { success: false, reason: "Insufficient ATP (Requires 10 ATP)." };
        }
    }

    // 2. Calculate refund amount from live allocations
    const totalAllocated = Object.values(state.spAllocated || {}).reduce((a, b) => a + b, 0);

    // 3. Deduct ATP
    if (rm && typeof rm.spendATP === "function") {
        rm.spendATP(10);
    }

    // 4. Refund points to live state via SPManager
    const currentSp = SPManager.getSP();
    SPManager.setSP(currentSp + totalAllocated);

    // 5. Reset allocations on live state
    Object.keys(state.spAllocated || {}).forEach((sym) => {
        state.spAllocated[sym] = 0;
    });

    // 6. Notify zone observer & save
    this.notifyStateChange("skill-points-reset");
    if (typeof SaveManager !== "undefined" && SaveManager.save) {
        SaveManager.save();
    }

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

    const changedSymbols = [];

    Object.entries(this.state.atoms).forEach(([symbol, atom]) => {
        if (!atom.unlocked) return;

        const spBoost = (this.state.spAllocated?.[symbol] || 0) * 0.10;
        const speedMult = 1 + (atom.boost || 0) + spBoost;
        const effectiveInterval = Math.max(1, atom.baseRate / speedMult);

        atom.progress = (atom.progress || 0) + deltaSec;

        if (atom.progress >= effectiveInterval) {
            const generated = Math.floor(atom.progress / effectiveInterval);
            const previousDisplayedCount = safeDisplayedCount(atom.count);
            atom.count = Math.min(atom.cap, atom.count + generated);
            atom.progress %= effectiveInterval;

            // Counts are displayed and consumed as whole atoms. Only publish
            // when that observable integer quantity changes. Progress still
            // advances every tick, including while the Atomizer is off-screen.
            if (safeDisplayedCount(atom.count) !== previousDisplayedCount) {
                changedSymbols.push(symbol);
                GameStateObserver.notify("atomizer-updated", {
                    symbol,
                    count: atom.count,
                    source: "timed-generation"
                });
            }
        }
    });

    if (changedSymbols.length > 0) {
        this.notifyStateChange("timed-generation", { changedSymbols });
    }
},

    unlockAtom(symbol) {
        this.ensureState();
        if (this.state.atoms[symbol] && !this.state.atoms[symbol].unlocked) {
            this.state.atoms[symbol].unlocked = true;
            this.notifyStateChange("atom-unlocked", { symbol });
            return true;
        }
        return false;
    },

    setBoost(symbol, boostPercent) {
        this.ensureState();
        if (this.state.atoms[symbol]) {
            this.state.atoms[symbol].boost = Math.max(0, boostPercent);
            this.notifyStateChange("boost-changed", { symbol });
        }
    }
};

export default AtomizerManager;
