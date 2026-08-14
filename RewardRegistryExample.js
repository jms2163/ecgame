// RewardRegistry.js
const rewardHandlers = new Map();

export const registerReward = (key, handler) => {
    rewardHandlers.set(key, handler);
};

export const getRewardHandler = (key) => rewardHandlers.get(key);

// --- Register Built-in Handlers ---

registerReward("xp", {
    apply: (amount) => {
        const previous = XPManager.getXP();
        if (!XPManager.addXP(amount)) throw new Error("XP add failed");
        return { previous }; // Snapshot for rollback
    },
    revert: (snapshot) => {
        XPManager.setXP(snapshot.previous);
    }
});

registerReward("particleCapacity", {
    apply: (amount) => {
        const previous = ParticleInventoryManager.getStatus().capacity;
        if (!ParticleInventoryManager.increaseCapacity(amount)) throw new Error("Capacity update failed");
        return { previous };
    },
    revert: (snapshot) => {
        ParticleInventoryManager.setCapacity(snapshot.previous);
    }
});

registerReward("zoneUnlocks", {
    apply: (zoneIds) => {
        const previous = {};
        zoneIds.forEach(zoneId => {
            previous[zoneId] = GameStateManager.isZoneUnlocked(zoneId);
            if (!GameStateManager.setZoneUnlocked(zoneId, true)) {
                throw new Error(`Failed to unlock zone: ${zoneId}`);
            }
        });
        return { previous };
    },
    revert: (snapshot) => {
        Object.entries(snapshot.previous).forEach(([zoneId, state]) => {
            GameStateManager.setZoneUnlocked(zoneId, state);
        });
    }
});

registerReward("collectorUnlocks", {
    apply: (particleIds) => {
        const previous = {};
        particleIds.forEach(particleId => {
            previous[particleId] = QuantumAutoCollectorManager.getCollectorStatus(particleId);
            if (!QuantumAutoCollectorManager.unlockCollector(particleId, { save: false, notify: false })) {
                throw new Error(`Collector unlock failed: ${particleId}`);
            }
        });
        return { previous };
    },
    revert: (snapshot) => {
        Object.entries(snapshot.previous).forEach(([particleId, status]) => {
            QuantumAutoCollectorManager.setCollectorUnlocked(particleId, status.unlocked, { save: false, notify: false });
        });
    }
});