// Grants the zone after a completed Glucose Transporter assembly.
// Reconciliation also covers products present in older saves.

import GameStateManager from "./GameStateManager.js";
import GameStateObserver from "./GameStateObserver.js";
import SaveManager from "./SaveManager.js";

const MetabolismUnlockManager = {
    initialized: false,

    reconcile() {
        const count = GameStateManager
            .getZoneSnapshot("polymerizer")
            ?.state?.productInventory
            ?.GlucoseTransporter?.count;

        if (!Number.isFinite(count) || count < 1 ||
            GameStateManager.isZoneUnlocked("metabolism")) {
            return false;
        }

        GameStateManager.ensureZoneState("metabolism");
        GameStateManager.setZoneUnlocked("metabolism", true);
        if (!SaveManager.save({
            reason: "glucose-transporter-metabolism-unlock"
        })) {
            GameStateManager.setZoneUnlocked("metabolism", false);
            return false;
        }
        return true;
    },

    initialize() {
        if (this.initialized) return true;

        GameStateObserver.on("polymerizer-product-completed", payload => {
            if (payload?.productId === "GlucoseTransporter") {
                this.reconcile();
            }
        });
        GameStateObserver.on("game-state-loaded", () => this.reconcile());
        this.initialized = true;
        this.reconcile();
        return true;
    }
};

export default MetabolismUnlockManager;
