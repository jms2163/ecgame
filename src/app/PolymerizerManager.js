// --------------------------------------------------
// PolymerizerManager.js
// Milestone 2 domain authority and output-inventory normalizer.
//
// This milestone evaluates permanent Macromolecularizer motif levels and
// owns completed Polymerizer products. It does not consume motifs, spend
// ATP, create jobs, complete products, or grant discoveries.
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

function isRecord(value) {

    return Boolean(
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
    );

}

function safeTimestamp(value) {

    return Number.isFinite(value) &&
        value >= 0
        ? value
        : null;

}

function normalizeProductRecord(value) {

    const source = isRecord(value)
        ? value
        : Number.isFinite(value)
            ? { count: value }
            : null;

    if (!source) return null;

    const count = safeCount(source.count);

    // Zero-count entries are not completed products and do not belong
    // in the authoritative output inventory.
    if (count === 0) return null;

    let firstCompletedAtMs =
        safeTimestamp(
            source.firstCompletedAtMs
        );
    let lastCompletedAtMs =
        safeTimestamp(
            source.lastCompletedAtMs
        );

    if (firstCompletedAtMs === null &&
        lastCompletedAtMs !== null) {
        firstCompletedAtMs =
            lastCompletedAtMs;
    } else if (
        lastCompletedAtMs === null &&
        firstCompletedAtMs !== null
    ) {
        lastCompletedAtMs =
            firstCompletedAtMs;
    } else if (
        firstCompletedAtMs !== null &&
        lastCompletedAtMs !== null &&
        firstCompletedAtMs >
            lastCompletedAtMs
    ) {
        [
            firstCompletedAtMs,
            lastCompletedAtMs
        ] = [
            lastCompletedAtMs,
            firstCompletedAtMs
        ];
    }

    return {
        count,
        firstCompletedAtMs,
        lastCompletedAtMs
    };

}

const PolymerizerManager = {

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

    // --------------------------------------------------
    // Normalize only Polymerizer-owned output inventory
    // --------------------------------------------------
    ensureState() {

        const state =
            GameStateManager.ensureZoneState(
                ZONE_ID
            );

        if (!state) {
            throw new Error(
                "PolymerizerManager: unable to ensure zone state"
            );
        }

        if (!isRecord(
            state.productInventory
        )) {
            state.productInventory = {};
        }

        Object.entries(
            state.productInventory
        ).forEach(([productId, record]) => {

            const normalized =
                normalizeProductRecord(
                    record
                );

            if (!normalized) {
                delete state.productInventory[
                    productId
                ];
                return;
            }

            state.productInventory[
                productId
            ] = normalized;

        });

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

    getMacromolecularizerInventory() {

        return GameStateManager
            .getZoneSnapshot(
                "macromolecularizer"
            )
            ?.state
            ?.motifInventory ?? {};

    },

    getProductInventory() {

        return structuredClone(
            this.ensureState()
                .productInventory
        );

    },

    getProductRecord(productId) {

        if (
            typeof productId !== "string" ||
            productId.trim() === ""
        ) {
            return null;
        }

        const record =
            this.ensureState()
                .productInventory[
                    productId.trim()
                ];

        return record
            ? structuredClone(record)
            : {
                count: 0,
                firstCompletedAtMs: null,
                lastCompletedAtMs: null
            };

    },

    getProductInventoryStatus() {

        const inventory =
            this.getProductInventory();

        const items = Object.entries(
            inventory
        ).map(([productId, record]) => {

            const definition =
                PolymerizerRecipeCatalog.get(
                    productId
                );

            return {
                id: productId,
                name:
                    definition?.name ??
                    productId,
                count: record.count,
                firstCompletedAtMs:
                    record.firstCompletedAtMs,
                lastCompletedAtMs:
                    record.lastCompletedAtMs,
                knownProduct:
                    Boolean(definition)
            };

        });

        return {
            items,
            storedTypes: items.length,
            totalQuantity:
                items.reduce(
                    (total, item) =>
                        total + item.count,
                    0
                )
        };

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
            this.getProductRecord(
                productId
            );

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
                "milestone-2-preview",
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
                this.getProductInventory(),
            productInventoryStatus:
                this.getProductInventoryStatus()
        };

    },

    startSynthesis() {

        return {
            success: false,
            reason:
                "milestone-2-preview",
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
                this.ensureState();

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
