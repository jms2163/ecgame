// --------------------------------------------------
// MetabolismManager.js
// Milestone 1 read-only domain authority.
//
// This manager reads completed Polymerizer products through GameStateManager
// snapshots. It never keeps a second inventory and never consumes products.
// Placement, pathway completion, and ATP generation belong to later work.
// --------------------------------------------------

import GameStateManager
    from "./GameStateManager.js";
import GameStateObserver
    from "./GameStateObserver.js";
import MetabolismPathwayCatalog
    from "../data/MetabolismPathwayCatalog.js";

const ZONE_ID = "metabolism";

function safeCount(value) {

    const rawCount =
        typeof value === "number"
            ? value
            : value?.count;

    return Number.isFinite(rawCount)
        ? Math.max(
            0,
            Math.floor(rawCount)
        )
        : 0;

}

const MetabolismManager = {

    initialized: false,
    active: false,
    subscribed: false,

    initialize() {

        this.ensureState();

        if (!this.subscribed) {
            this.subscribe();
        }

        this.initialized = true;
        return true;

    },

    // GameState already defines an empty Metabolism state. For legacy saves,
    // ensure only the standard zone envelope; do not add speculative fields.
    ensureState() {

        const state =
            GameStateManager.ensureZoneState(
                ZONE_ID
            );

        if (!state) {
            throw new Error(
                "MetabolismManager: unable to ensure zone state"
            );
        }

        return state;

    },

    activate() {

        if (!this.initialized) {
            this.initialize();
        }

        this.active = true;
        this.notifyStateChange("activated");
        return true;

    },

    deactivate() {
        this.active = false;
        return true;
    },

    // Polymerizer remains the sole owner of completed protein products.
    getPolymerizerInventory() {

        return GameStateManager
            .getZoneSnapshot(
                "polymerizer"
            )
            ?.state
            ?.productInventory ?? {};

    },

    getProductCount(productId) {

        if (
            typeof productId !== "string" ||
            productId.trim() === ""
        ) {
            return 0;
        }

        return safeCount(
            this.getPolymerizerInventory()[
                productId.trim()
            ]
        );

    },

    getPathwayStatus(pathwayId) {

        const pathway =
            MetabolismPathwayCatalog.get(
                pathwayId
            );

        if (!pathway) return null;

        const requirement =
            pathway.unlockRequirement;
        const currentCount =
            this.getProductCount(
                requirement.productId
            );
        const missing = Math.max(
            0,
            requirement.minimumCount -
                currentCount
        );

        return {
            ...pathway,
            available: missing === 0,
            unlockStatus: {
                ...requirement,
                currentCount,
                missing,
                complete: missing === 0
            }
        };

    },

    getStatus() {

        return {
            pathways:
                MetabolismPathwayCatalog
                    .getAll()
                    .map(pathway =>
                        this.getPathwayStatus(
                            pathway.id
                        )
                    ),
            polymerizerInventory:
                this.getPolymerizerInventory()
        };

    },

    notifyStateChange(reason) {

        GameStateObserver.notify(
            "metabolism-state-changed",
            { reason }
        );

    },

    subscribe() {

        GameStateObserver.on(
            "game-state-loaded",
            () => {
                this.ensureState();

                if (this.active) {
                    this.notifyStateChange(
                        "game-state-loaded"
                    );
                }
            }
        );

        GameStateObserver.on(
            "polymerizer-product-completed",
            () => {
                if (this.active) {
                    this.notifyStateChange(
                        "polymerizer-product-completed"
                    );
                }
            }
        );

        this.subscribed = true;

    }

};

export default MetabolismManager;
