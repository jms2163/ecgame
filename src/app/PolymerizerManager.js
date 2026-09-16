// --------------------------------------------------
// PolymerizerManager.js
// Read-only Milestone 1 domain authority.
//
// This milestone evaluates permanent Macromolecularizer motif levels.
// It does not consume motifs, spend ATP, create jobs, grant discoveries,
// or add Polymerizer-owned persistent fields.
// --------------------------------------------------

import GameStateManager from "./GameStateManager.js";
import GameStateObserver from "./GameStateObserver.js";
import ResourceManager from "./ResourceManager.js";
import PolymerizerRecipeCatalog
    from "../data/PolymerizerRecipeCatalog.js";

const ZONE_ID = "polymerizer";
const DEFAULT_PRODUCT_ID = "Aquaporin";

function safeCount(value) {

    return Number.isFinite(value)
        ? Math.max(0, Math.floor(value))
        : 0;

}

const PolymerizerManager = {

    initialized: false,
    active: false,
    subscribed: false,

    initialize() {

        // Older saves may not contain the future zone. Creating only the
        // established empty zone envelope is additive and needs no migration.
        const state =
            GameStateManager.ensureZoneState(
                ZONE_ID
            );

        if (!state) {
            throw new Error(
                "PolymerizerManager: unable to ensure zone state"
            );
        }

        if (!this.subscribed) {
            this.subscribe();
        }

        this.initialized = true;
        return true;

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

    getMacromolecularizerInventory() {

        return GameStateManager
            .getZoneSnapshot(
                "macromolecularizer"
            )
            ?.state
            ?.motifInventory ?? {};

    },

    getProductInventory() {

        // productInventory is intentionally not created in Milestone 1.
        // This read path is ready for the later functional milestone.
        return GameStateManager
            .getZoneSnapshot(ZONE_ID)
            ?.state
            ?.productInventory ?? {};

    },

    getProductEligibility(
        productId = DEFAULT_PRODUCT_ID
    ) {

        const definition =
            PolymerizerRecipeCatalog.get(
                productId
            );

        if (!definition?.implemented) {
            return null;
        }

        const inventory =
            this.getMacromolecularizerInventory();

        const motifs =
            definition.motifRequirements.map(
                requirement => {

                    const owned = safeCount(
                        inventory[
                            requirement.productId
                        ]
                    );

                    return {
                        ...requirement,
                        owned,
                        missing:
                            Math.max(
                                0,
                                requirement.quantity -
                                    owned
                            ),
                        complete:
                            owned >=
                            requirement.quantity,
                        consumed: false,
                        sourceZoneId:
                            "macromolecularizer"
                    };

                }
            );

        const atp =
            ResourceManager.getATPStatus();

        const motifLevelsMet =
            motifs.every(
                motif => motif.complete
            );

        const canAffordATP =
            atp.current >=
            definition.atpCost;

        const outputRecord =
            this.getProductInventory()[
                productId
            ];

        return {
            id: productId,
            definition:
                structuredClone(
                    definition
                ),
            motifs,
            motifLevelsMet,
            atp: {
                current: atp.current,
                maximum: atp.maximum,
                cost: definition.atpCost,
                canAfford: canAffordATP,
                missing:
                    Math.max(
                        0,
                        definition.atpCost -
                            atp.current
                    )
            },
            eligible:
                definition.valid &&
                motifLevelsMet &&
                canAffordATP,
            canStart: false,
            implementationStatus:
                "milestone-1-preview",
            output: {
                quantity:
                    safeCount(
                        outputRecord?.count
                    ),
                firstCompletedAtMs:
                    Number.isFinite(
                        outputRecord
                            ?.firstCompletedAtMs
                    )
                        ? outputRecord
                            .firstCompletedAtMs
                        : null,
                lastCompletedAtMs:
                    Number.isFinite(
                        outputRecord
                            ?.lastCompletedAtMs
                    )
                        ? outputRecord
                            .lastCompletedAtMs
                        : null
            }
        };

    },

    getStatus() {

        const zone =
            GameStateManager.getZoneSnapshot(
                ZONE_ID
            );

        return {
            initialized: this.initialized,
            active: this.active,
            unlocked:
                Boolean(zone?.unlocked),
            completed:
                Boolean(zone?.completed),
            selectedProductId:
                DEFAULT_PRODUCT_ID,
            products:
                PolymerizerRecipeCatalog
                    .getImplemented()
                    .map(definition =>
                        this.getProductEligibility(
                            definition.id
                        )
                    ),
            selectedProduct:
                this.getProductEligibility(
                    DEFAULT_PRODUCT_ID
                ),
            productInventory:
                structuredClone(
                    this.getProductInventory()
                )
        };

    },

    startSynthesis() {

        return {
            success: false,
            reason:
                "milestone-1-preview",
            message:
                "Aquaporin assembly is not enabled in this development milestone."
        };

    },

    notifyStateChange(reason) {

        GameStateObserver.notify(
            "polymerizer-state-changed",
            { reason }
        );

    },

    subscribe() {

        GameStateObserver.on(
            "game-state-loaded",
            () => {
                GameStateManager.ensureZoneState(
                    ZONE_ID
                );

                if (this.active) {
                    this.notifyStateChange(
                        "game-state-loaded"
                    );
                }
            }
        );

        [
            "macromolecularizer-state-changed",
            "atp-changed"
        ].forEach(eventName => {
            GameStateObserver.on(
                eventName,
                () => {
                    if (this.active) {
                        this.notifyStateChange(
                            eventName
                        );
                    }
                }
            );
        });

        this.subscribed = true;

    }

};

export default PolymerizerManager;
