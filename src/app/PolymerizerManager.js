// --------------------------------------------------
// PolymerizerManager.js
// Milestone 4 domain authority and complete assembly lifecycle.
//
// This milestone evaluates permanent Macromolecularizer motif levels and
// owns completed Polymerizer products. It starts one reload-safe 15-second
// assembly job, spends ATP at start, and atomically grants output plus the
// existing Aquaporin discovery when the elapsed job completes.
// --------------------------------------------------

import GameStateManager from "./GameStateManager.js";
import GameStateObserver from "./GameStateObserver.js";
import ResourceManager from "./ResourceManager.js";
import SaveManager from "./SaveManager.js";
import PolymerizerRecipeCatalog
    from "../data/PolymerizerRecipeCatalog.js";

const ZONE_ID = "polymerizer";
const DEFAULT_PRODUCT_ID = "Aquaporin";
const ASSEMBLY_DURATION_MS = 15_000;
const PROGRESS_EVENT_INTERVAL_MS = 100;
const COMPLETION_RETRY_INTERVAL_MS = 1_000;
const AQUAPORIN_DISCOVERY_ID = "aquaporin";

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

function createJobId(productId, startedAtMs) {

    if (
        globalThis.crypto &&
        typeof globalThis.crypto
            .randomUUID === "function"
    ) {
        return globalThis.crypto.randomUUID();
    }

    return [
        productId,
        startedAtMs,
        Math.random()
            .toString(36)
            .slice(2)
    ].join("-");

}

function normalizeActiveAssembly(job) {

    if (!isRecord(job)) return null;

    const definition =
        PolymerizerRecipeCatalog.get(
            job.productId
        );

    if (
        !definition?.implemented ||
        typeof job.jobId !== "string" ||
        job.jobId.trim() === "" ||
        safeTimestamp(job.startedAtMs) ===
            null ||
        job.durationMs !==
            ASSEMBLY_DURATION_MS ||
        job.completesAtMs !==
            job.startedAtMs +
                ASSEMBLY_DURATION_MS ||
        job.atpCost !==
            definition.atpCost ||
        !Array.isArray(
            job.motifRequirements
        )
    ) {
        return null;
    }

    const requiredMotifs =
        definition.motifRequirements.map(
            requirement => ({
                productId:
                    requirement.productId,
                quantity:
                    requirement.quantity
            })
        );

    const savedMotifs =
        job.motifRequirements.map(
            requirement => ({
                productId:
                    requirement?.productId,
                quantity:
                    safeCount(
                        requirement?.quantity
                    )
            })
        );

    if (
        JSON.stringify(savedMotifs) !==
        JSON.stringify(requiredMotifs)
    ) {
        return null;
    }

    return {
        jobId: job.jobId.trim(),
        productId: definition.id,
        startedAtMs: job.startedAtMs,
        completesAtMs:
            job.completesAtMs,
        durationMs:
            ASSEMBLY_DURATION_MS,
        atpCost: definition.atpCost,
        motifRequirements:
            requiredMotifs
    };

}

const PolymerizerManager = {

    initialized: false,
    active: false,
    subscribed: false,
    lastProgressEventAtMs: 0,
    lastCompletionAttempt: null,

    initialize() {

        this.ensureState();

        if (!this.subscribed) {
            this.subscribe();
        }

        this.initialized = true;

        // Bootstrap initializes this manager after the save is loaded. An
        // expired job can therefore complete immediately, even if the
        // player has not opened the Polymerizer development zone.
        this.reconcileAssembly();
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

        state.activeAssembly =
            normalizeActiveAssembly(
                state.activeAssembly
            );

        return state;

    },

    activate() {

        if (!this.initialized) {
            this.initialize();
        }

        this.active = true;
        this.reconcileAssembly();
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
            canStart:
                definition.valid &&
                motifLevelsMet &&
                canAffordATP &&
                !this.ensureState()
                    .activeAssembly,
            implementationStatus:
                "milestone-4-completion",
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
            activeAssembly:
                this.getActiveAssemblyProgress(),
            productInventory:
                this.getProductInventory(),
            productInventoryStatus:
                this.getProductInventoryStatus()
        };

    },

    // --------------------------------------------------
    // Derive short-job progress from persisted timestamps
    // --------------------------------------------------
    getActiveAssemblyProgress(
        nowMs = Date.now()
    ) {

        if (
            !Number.isFinite(nowMs) ||
            nowMs < 0
        ) {
            return null;
        }

        const job =
            this.ensureState()
                .activeAssembly;

        if (!job) return null;

        const elapsedMs = Math.max(
            0,
            Math.min(
                job.durationMs,
                nowMs - job.startedAtMs
            )
        );

        return {
            ...structuredClone(job),
            elapsedMs,
            remainingMs:
                Math.max(
                    0,
                    job.durationMs -
                        elapsedMs
                ),
            progress:
                elapsedMs /
                job.durationMs,
            complete:
                nowMs >=
                job.completesAtMs
        };

    },

    // --------------------------------------------------
    // Spend ATP and persist exactly one active assembly
    // --------------------------------------------------
    startAssembly(
        productId = DEFAULT_PRODUCT_ID,
        nowMs = Date.now()
    ) {

        if (
            !Number.isFinite(nowMs) ||
            nowMs < 0
        ) {
            return {
                success: false,
                reason: "invalid-start-time",
                message:
                    "Assembly requires a valid start time."
            };
        }

        const state = this.ensureState();

        if (state.activeAssembly) {
            return {
                success: false,
                reason:
                    "assembly-already-active",
                activeAssembly:
                    this.getActiveAssemblyProgress(
                        nowMs
                    ),
                message:
                    "Finish the active assembly before starting another protein."
            };
        }

        const definition =
            PolymerizerRecipeCatalog.get(
                productId
            );
        const eligibility =
            this.getProductEligibility(
                productId
            );

        if (!definition?.implemented ||
            !eligibility) {
            return {
                success: false,
                reason: "unknown-product",
                message:
                    "That protein is not available for assembly."
            };
        }

        if (!eligibility.motifLevelsMet) {
            return {
                success: false,
                reason:
                    "insufficient-motif-levels",
                missingMotifs:
                    eligibility.motifs
                        .filter(motif =>
                            !motif.complete
                        )
                        .map(motif => ({
                            productId:
                                motif.productId,
                            missing:
                                motif.missing
                        })),
                message:
                    "Increase the missing motif levels in Macromolecularizer first."
            };
        }

        if (!eligibility.atp.canAfford) {
            return {
                success: false,
                reason: "insufficient-atp",
                requiredATP:
                    eligibility.atp.cost,
                availableATP:
                    eligibility.atp.current,
                message:
                    `Requires ${eligibility.atp.cost} ATP; ${eligibility.atp.current} ATP is available.`
            };
        }

        const previousATP =
            ResourceManager.getATPStatus();

        const job = {
            jobId:
                createJobId(
                    productId,
                    nowMs
                ),
            productId,
            startedAtMs: nowMs,
            completesAtMs:
                nowMs +
                ASSEMBLY_DURATION_MS,
            durationMs:
                ASSEMBLY_DURATION_MS,
            atpCost:
                definition.atpCost,
            motifRequirements:
                definition
                    .motifRequirements
                    .map(requirement => ({
                        productId:
                            requirement.productId,
                        quantity:
                            requirement.quantity
                    }))
        };

        const spent =
            ResourceManager.spendATP(
                definition.atpCost,
                "polymerizer-assembly-started"
            );

        if (!spent) {
            return {
                success: false,
                reason: "insufficient-atp",
                message:
                    "ATP changed before assembly could start."
            };
        }

        state.activeAssembly = job;

        const saved = SaveManager.save({
            reason:
                "polymerizer-assembly-started"
        });

        if (!saved) {
            state.activeAssembly = null;
            ResourceManager.setATPStatus(
                previousATP,
                "polymerizer-assembly-start-rollback"
            );

            return {
                success: false,
                reason: "save-failed",
                message:
                    "Assembly could not be saved. ATP was restored."
            };
        }

        this.lastProgressEventAtMs =
            nowMs;
        this.notifyStateChange(
            "assembly-started"
        );

        return {
            success: true,
            reason: "assembly-started",
            saved: true,
            activeAssembly:
                this.getActiveAssemblyProgress(
                    nowMs
                ),
            message:
                `${definition.name} assembly started. 15 ATP spent; motif levels were not consumed.`
        };

    },

    // Compatibility name for development-console callers.
    startSynthesis(
        productId = DEFAULT_PRODUCT_ID,
        nowMs = Date.now()
    ) {

        return this.startAssembly(
            productId,
            nowMs
        );

    },

    // --------------------------------------------------
    // Atomically award one completed product and its discovery
    // --------------------------------------------------
    finishAssembly(
        jobId,
        nowMs = Date.now()
    ) {

        if (
            !Number.isFinite(nowMs) ||
            nowMs < 0
        ) {
            return {
                success: false,
                reason: "invalid-completion-time"
            };
        }

        const state = this.ensureState();
        const job = state.activeAssembly;

        if (
            !job ||
            typeof jobId !== "string" ||
            job.jobId !== jobId
        ) {
            return {
                success: false,
                reason: "active-job-mismatch"
            };
        }

        if (nowMs < job.completesAtMs) {
            return {
                success: false,
                reason: "assembly-not-complete",
                activeAssembly:
                    this.getActiveAssemblyProgress(
                        nowMs
                    )
            };
        }

        const productId = job.productId;
        const hadProductRecord =
            Object.prototype.hasOwnProperty.call(
                state.productInventory,
                productId
            );
        const previousProductRecord =
            hadProductRecord
                ? structuredClone(
                    state.productInventory[
                        productId
                    ]
                )
                : null;
        const completionTimestamp =
            job.completesAtMs;
        const previousCount = safeCount(
            previousProductRecord?.count
        );

        state.activeAssembly = null;
        state.productInventory[productId] = {
            count: previousCount + 1,
            firstCompletedAtMs:
                previousProductRecord
                    ?.firstCompletedAtMs ??
                completionTimestamp,
            lastCompletedAtMs:
                completionTimestamp
        };

        const discoveryAlreadyKnown =
            GameStateManager.hasDiscovery(
                AQUAPORIN_DISCOVERY_ID
            );
        const discoveryGranted =
            discoveryAlreadyKnown
                ? false
                : GameStateManager.addDiscovery(
                    AQUAPORIN_DISCOVERY_ID
                );

        // A failed grant must not leave a completed product whose required
        // progression flag was never recorded.
        if (
            !discoveryAlreadyKnown &&
            !discoveryGranted
        ) {
            state.activeAssembly = job;

            if (hadProductRecord) {
                state.productInventory[
                    productId
                ] = previousProductRecord;
            } else {
                delete state.productInventory[
                    productId
                ];
            }

            return {
                success: false,
                reason: "discovery-grant-failed"
            };
        }

        const saved = SaveManager.save({
            reason:
                "polymerizer-assembly-completed"
        });

        if (!saved) {
            state.activeAssembly = job;

            if (hadProductRecord) {
                state.productInventory[
                    productId
                ] = previousProductRecord;
            } else {
                delete state.productInventory[
                    productId
                ];
            }

            if (discoveryGranted) {
                GameStateManager.removeDiscovery(
                    AQUAPORIN_DISCOVERY_ID
                );
            }

            return {
                success: false,
                reason: "save-failed",
                message:
                    "Completion could not be saved. The active assembly was preserved for retry."
            };
        }

        this.lastCompletionAttempt = null;
        this.notifyStateChange(
            "assembly-completed"
        );
        GameStateObserver.notify(
            "polymerizer-product-completed",
            {
                productId,
                quantity:
                    previousCount + 1,
                discoveryId:
                    AQUAPORIN_DISCOVERY_ID,
                discoveryGranted,
                completedAtMs:
                    completionTimestamp
            }
        );

        return {
            success: true,
            reason: "assembly-completed",
            saved: true,
            productId,
            quantity: previousCount + 1,
            discoveryId:
                AQUAPORIN_DISCOVERY_ID,
            discoveryGranted,
            completedAtMs:
                completionTimestamp,
            message:
                "Aquaporin assembly complete. Product stored and discovery recorded."
        };

    },

    // Reconcile progress from wall-clock timestamps. Completion runs even
    // while another zone is open because this manager initializes globally.
    reconcileAssembly(
        nowMs = Date.now()
    ) {

        const progress =
            this.getActiveAssemblyProgress(
                nowMs
            );

        if (!progress) return false;

        if (progress.complete) {
            const lastAttempt =
                this.lastCompletionAttempt;
            const retryBlocked =
                lastAttempt?.jobId ===
                    progress.jobId &&
                nowMs >=
                    lastAttempt.attemptedAtMs &&
                nowMs -
                    lastAttempt.attemptedAtMs <
                    COMPLETION_RETRY_INTERVAL_MS;

            if (retryBlocked) {
                return progress;
            }

            this.lastCompletionAttempt = {
                jobId: progress.jobId,
                attemptedAtMs: nowMs
            };

            const completion =
                this.finishAssembly(
                    progress.jobId,
                    nowMs
                );

            if (!completion.success &&
                this.active) {
                this.notifyStateChange(
                    "assembly-completion-pending"
                );
            }

            return completion;
        }

        if (
            this.active &&
            nowMs -
                this.lastProgressEventAtMs >=
                PROGRESS_EVENT_INTERVAL_MS
        ) {
            this.lastProgressEventAtMs =
                nowMs;
            this.notifyStateChange(
                "assembly-progress"
            );
        }

        return progress;

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
                this.lastCompletionAttempt =
                    null;
                this.reconcileAssembly();

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

        GameStateObserver.on(
            "game-tick",
            () => {
                this.reconcileAssembly(
                    Date.now()
                );
            }
        );

        this.subscribed = true;

    }

};

export default PolymerizerManager;
