// --------------------------------------------------
// MacromolecularizerManager.js
// Domain authority for Macromolecularizer progression
// and persistent-state normalization
// --------------------------------------------------

import GameStateManager from "./GameStateManager.js";
import GameStateObserver from "./GameStateObserver.js";
import DiscoveryManager from "./DiscoveryManager.js";
import SaveManager from "./SaveManager.js";
import ResourceManager from "./ResourceManager.js";
import SynthesisPointManager
    from "./SynthesisPointManager.js";
import MoleculeRecipeCatalog
    from "../data/MoleculeRecipeCatalog.js";
import MotifRecipeCatalog
    from "../data/MotifRecipeCatalog.js";

const ZONE_ID = "macromolecularizer";
const DEFAULT_CATEGORY = "motifs";
const FIRST_MOTIF_ID = "H_helix";
const BASE_SECONDS_PER_PEPTIDE_BOND = 30;
const DEHYDRATION_SPEED_BONUS_PER_LEVEL = 1;
const SYNTHESIS_POINT_COST_PER_LEVEL = 1;
const PROGRESS_EVENT_INTERVAL_MS = 250;
const REACTION_DISCOVERY_IDS = Object.freeze([
    "dehydration",
    "hydrolysis"
]);

function isRecord(value) {

    return Boolean(
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
    );

}

function safeInteger(value) {

    return Number.isFinite(value)
        ? Math.max(0, Math.floor(value))
        : 0;

}

function safeTimestamp(value) {

    return (
        Number.isFinite(value) &&
        value >= 0
    )
        ? value
        : null;

}

function getBaseDurationMs(definition) {

    return Math.max(
        1,
        definition.peptideBondCount *
            BASE_SECONDS_PER_PEPTIDE_BOND *
            1000
    );

}

function getSpeedMultiplier(level) {

    return 1 +
        safeInteger(level) *
        DEHYDRATION_SPEED_BONUS_PER_LEVEL;

}

function calculateDurationMs(
    definition,
    speedUpgradeLevel
) {

    return Math.max(
        1,
        Math.round(
            getBaseDurationMs(
                definition
            ) /
            getSpeedMultiplier(
                speedUpgradeLevel
            )
        )
    );

}

function createJobId(
    motifId,
    startedAtMs
) {

    if (
        globalThis.crypto &&
        typeof globalThis.crypto
            .randomUUID === "function"
    ) {
        return globalThis.crypto
            .randomUUID();
    }

    return [
        motifId,
        startedAtMs,
        Math.random()
            .toString(36)
            .slice(2)
    ].join("-");

}

function normalizeActiveSynthesis(job) {

    if (!isRecord(job)) {
        return null;
    }

    const definition =
        MotifRecipeCatalog.get(
            job.motifId
        );

    const speedUpgradeLevel =
        safeInteger(
            job.speedUpgradeLevel
        );

    if (
        !definition
            ?.implemented ||
        typeof job.jobId !== "string" ||
        job.jobId.trim() === "" ||
        !Number.isFinite(
            job.startedAtMs
        ) ||
        job.startedAtMs < 0
    ) {
        return null;
    }

    const baseDurationMs =
        getBaseDurationMs(
            definition
        );

    const durationMs =
        calculateDurationMs(
            definition,
            speedUpgradeLevel
        );

    const speedMultiplier =
        getSpeedMultiplier(
            speedUpgradeLevel
        );

    const expectedCompletesAtMs =
        job.startedAtMs +
        durationMs;

    if (
        job.baseDurationMs !==
            baseDurationMs ||
        job.durationMs !==
            durationMs ||
        job.completesAtMs !==
            expectedCompletesAtMs ||
        job.atpCost !==
            definition.atpCost ||
        job.peptideBondCount !==
            definition.peptideBondCount ||
        job.secondsPerPeptideBond !==
            BASE_SECONDS_PER_PEPTIDE_BOND ||
        job.speedMultiplier !==
            speedMultiplier
    ) {
        return null;
    }

    return {
        jobId:
            job.jobId.trim(),
        motifId:
            definition.id,
        startedAtMs:
            job.startedAtMs,
        completesAtMs:
            expectedCompletesAtMs,
        durationMs,
        baseDurationMs,
        atpCost:
            definition.atpCost,
        peptideBondCount:
            definition.peptideBondCount,
        secondsPerPeptideBond:
            BASE_SECONDS_PER_PEPTIDE_BOND,
        speedUpgradeLevel,
        speedMultiplier
    };

}

const MacromolecularizerManager = {

    initialized: false,
    active: false,
    subscribed: false,
    lastProgressEventAtMs: 0,

    // --------------------------------------------------
    // Initialize domain state once
    // --------------------------------------------------
    initialize() {

        if (this.initialized) {
            this.ensureState();

            return true;
        }

        this.ensureState();
        SynthesisPointManager
            .initialize();
        this.subscribe();

        this.initialized = true;
        this.reconcileSynthesis();

        console.log(
            "[MacromolecularizerManager] Initialized with persistent state."
        );

        return true;

    },

    // --------------------------------------------------
    // Activate domain behavior for the visible zone
    // --------------------------------------------------
    activate() {

        if (!this.initialized) {
            this.initialize();
        }

        this.active = true;
        this.ensureState();
        this.reconcileSynthesis();
        this.notifyStateChange(
            "activated"
        );

        return true;

    },

    // --------------------------------------------------
    // Deactivate visible-zone domain behavior
    // --------------------------------------------------
    deactivate() {

        this.active = false;

        return true;

    },

    // --------------------------------------------------
    // Normalize additive state after any save load
    // --------------------------------------------------
    ensureState() {

        const state =
            GameStateManager.ensureZoneState(
                ZONE_ID
            );

        if (!state) {
            throw new Error(
                "MacromolecularizerManager: unable to create zone state"
            );
        }

        if (state.activeCategory !== DEFAULT_CATEGORY) {
            state.activeCategory =
                DEFAULT_CATEGORY;
        }

        if (
            typeof state.selectedMotifId !== "string" ||
            state.selectedMotifId.trim() === "" ||
            !MotifRecipeCatalog.has(
                state.selectedMotifId.trim()
            ) ||
            !MotifRecipeCatalog.get(
                state.selectedMotifId.trim()
            )?.implemented
        ) {
            state.selectedMotifId =
                FIRST_MOTIF_ID;
        } else {
            state.selectedMotifId =
                state.selectedMotifId.trim();
        }

        if (state.activeSynthesis !== null) {
            state.activeSynthesis =
                normalizeActiveSynthesis(
                    state.activeSynthesis
                );
        }

        if (!isRecord(state.synthesized)) {
            state.synthesized = {};
        }

        Object.entries(
            state.synthesized
        ).forEach(
            ([motifId, record]) => {

                if (!isRecord(record)) {
                    state.synthesized[motifId] = {
                        count: 0,
                        firstCompletedAtMs: null,
                        lastCompletedAtMs: null
                    };

                    return;
                }

                record.count =
                    safeInteger(record.count);

                record.firstCompletedAtMs =
                    safeTimestamp(
                        record.firstCompletedAtMs
                    );

                record.lastCompletedAtMs =
                    safeTimestamp(
                        record.lastCompletedAtMs
                    );

                if (record.count === 0) {
                    record.firstCompletedAtMs =
                        null;
                    record.lastCompletedAtMs =
                        null;
                } else if (
                    record.firstCompletedAtMs ===
                        null &&
                    record.lastCompletedAtMs !==
                        null
                ) {
                    record.firstCompletedAtMs =
                        record.lastCompletedAtMs;
                } else if (
                    record.lastCompletedAtMs ===
                        null &&
                    record.firstCompletedAtMs !==
                        null
                ) {
                    record.lastCompletedAtMs =
                        record.firstCompletedAtMs;
                } else if (
                    record.firstCompletedAtMs >
                    record.lastCompletedAtMs
                ) {
                    const firstCompletedAtMs =
                        record.lastCompletedAtMs;

                    record.lastCompletedAtMs =
                        record.firstCompletedAtMs;
                    record.firstCompletedAtMs =
                        firstCompletedAtMs;
                }

            }
        );

        if (!isRecord(state.motifInventory)) {
            state.motifInventory = {};
        }

        Object.entries(
            state.motifInventory
        ).forEach(
            ([motifId, count]) => {
                state.motifInventory[motifId] =
                    safeInteger(count);
            }
        );

        // Completion history and inventory quantity describe the
        // same earned motifs. Preserve the highest valid count when
        // an older or partially written save contains only one side.
        const recordedMotifIds =
            new Set([
                ...Object.keys(
                    state.synthesized
                ),
                ...Object.keys(
                    state.motifInventory
                )
            ]);

        recordedMotifIds.forEach(
            motifId => {
                const synthesisRecord =
                    state.synthesized[
                        motifId
                    ];

                const reconciledCount =
                    Math.max(
                        safeInteger(
                            synthesisRecord
                                ?.count
                        ),
                        safeInteger(
                            state.motifInventory[
                                motifId
                            ]
                        )
                    );

                state.motifInventory[
                    motifId
                ] = reconciledCount;

                if (!isRecord(synthesisRecord)) {
                    state.synthesized[
                        motifId
                    ] = {
                        count:
                            reconciledCount,
                        firstCompletedAtMs:
                            null,
                        lastCompletedAtMs:
                            null
                    };

                    return;
                }

                synthesisRecord.count =
                    reconciledCount;
            }
        );

        if (!isRecord(state.upgrades)) {
            state.upgrades = {};
        }

        if (
            !isRecord(
                state.upgrades
                    .dehydrationSynthesisSpeed
            )
        ) {
            state.upgrades
                .dehydrationSynthesisSpeed = {};
        }

        const speedUpgrade =
            state.upgrades
                .dehydrationSynthesisSpeed;

        speedUpgrade.level =
            safeInteger(
                speedUpgrade.level
            );

        // One Synthesis Point purchases one +100%-speed level.
        speedUpgrade.synthesisPointsSpent =
            speedUpgrade.level;

        return state;

    },

    // --------------------------------------------------
    // Read a Molecule Lab synthesis-history snapshot
    // --------------------------------------------------
    getMoleculeSynthesisHistory() {

        return GameStateManager
            .getZoneSnapshot(
                "moleculeLab"
            )
            ?.state
            ?.synthesized ??
            {};

    },

    // --------------------------------------------------
    // Calculate non-consuming motif eligibility
    // --------------------------------------------------
    getMotifEligibility(motifId) {

        const definition =
            MotifRecipeCatalog.get(
                motifId
            );

        if (
            !definition ||
            !definition.implemented
        ) {
            return null;
        }

        const synthesisHistory =
            this.getMoleculeSynthesisHistory();

        const aminoAcids =
            definition.aminoAcids.map(
                requirement => {

                    const synthesisCount =
                        safeInteger(
                            synthesisHistory[
                                requirement.id
                            ]?.count
                        );

                    return {
                        id:
                            requirement.id,
                        name:
                            MoleculeRecipeCatalog
                                .get(
                                    requirement.id
                                )?.name ??
                            requirement.id,
                        quantity:
                            requirement.quantity,
                        synthesisCount,
                        synthesized:
                            synthesisCount > 0
                    };

                }
            );

        const missingAminoAcidIds =
            aminoAcids
                .filter(
                    requirement =>
                        !requirement
                            .synthesized
                )
                .map(
                    requirement =>
                        requirement.id
                );

        const reactionDiscoveries =
            Object.fromEntries(
                definition
                    .requiredReactionIds
                    .map(
                        reactionId => [
                            reactionId,
                            this.hasReactionDiscovery(
                                reactionId
                            )
                        ]
                    )
            );

        const missingReactionIds =
            definition
                .requiredReactionIds
                .filter(
                    reactionId =>
                        !reactionDiscoveries[
                            reactionId
                        ]
                );

        const atp =
            ResourceManager
                .getATPStatus();

        const canAffordATP =
            ResourceManager
                .canSpendATP(
                    definition.atpCost
                );

        const speed =
            this.getDehydrationSpeedStatus();

        const eligible =
            definition
                .compositionValid &&
            missingAminoAcidIds
                .length === 0 &&
            missingReactionIds
                .length === 0 &&
            canAffordATP;

        const state =
            this.ensureState();

        const inventoryQuantity =
            safeInteger(
                state.motifInventory[
                    motifId
                ]
            );

        const synthesisRecord =
            state.synthesized[
                motifId
            ];

        const activeSynthesis =
            state.activeSynthesis
                ?.motifId === motifId;

        const blockingReasons = [];

        if (
            !definition
                .compositionValid
        ) {
            blockingReasons.push({
                type:
                    "invalid-composition"
            });
        }

        if (
            missingReactionIds.length > 0
        ) {
            blockingReasons.push({
                type:
                    "reaction-discovery",
                ids:
                    [...missingReactionIds]
            });
        }

        if (
            missingAminoAcidIds.length > 0
        ) {
            blockingReasons.push({
                type:
                    "amino-acids",
                ids:
                    [...missingAminoAcidIds]
            });
        }

        if (!canAffordATP) {
            blockingReasons.push({
                type: "atp",
                missingAmount:
                    Math.max(
                        0,
                        definition.atpCost -
                        atp.current
                    )
            });
        }

        return {
            id: definition.id,
            definition:
                structuredClone(
                    definition
                ),
            aminoAcids,
            missingAminoAcidIds,
            reactionDiscoveries,
            missingReactionIds,
            atp: {
                current:
                    atp.current,
                maximum:
                    atp.maximum,
                cost:
                    definition.atpCost,
                canAfford:
                    canAffordATP
            },
            timing: {
                baseSecondsPerPeptideBond:
                    BASE_SECONDS_PER_PEPTIDE_BOND,
                baseDurationMs:
                    getBaseDurationMs(
                        definition
                    ),
                durationMs:
                    calculateDurationMs(
                        definition,
                        speed.level
                    ),
                speedUpgradeLevel:
                    speed.level,
                speedMultiplier:
                    speed.speedMultiplier
            },
            requirements: {
                reactionDiscovery: {
                    complete:
                        missingReactionIds
                            .length === 0,
                    required:
                        definition
                            .requiredReactionIds
                            .length,
                    discovered:
                        definition
                            .requiredReactionIds
                            .length -
                        missingReactionIds
                            .length
                },
                aminoAcids: {
                    complete:
                        missingAminoAcidIds
                            .length === 0,
                    requiredTypes:
                        aminoAcids.length,
                    synthesizedTypes:
                        aminoAcids.length -
                        missingAminoAcidIds
                            .length
                },
                atp: {
                    complete:
                        canAffordATP,
                    missingAmount:
                        Math.max(
                            0,
                            definition.atpCost -
                            atp.current
                        )
                }
            },
            blockingReasons,
            eligible,
            canStart:
                eligible &&
                !state.activeSynthesis,
            lifecycleStatus:
                activeSynthesis
                    ? "synthesizing"
                    : eligible
                        ? "ready"
                        : "blocked",
            inventory: {
                quantity:
                    inventoryQuantity,
                discovered:
                    GameStateManager
                        .hasDiscoveryInCategory(
                            "motifs",
                            motifId
                        ),
                synthesisCount:
                    safeInteger(
                        synthesisRecord
                            ?.count
                    ),
                firstCompletedAtMs:
                    safeTimestamp(
                        synthesisRecord
                            ?.firstCompletedAtMs
                    ),
                lastCompletedAtMs:
                    safeTimestamp(
                        synthesisRecord
                            ?.lastCompletedAtMs
                    )
            }
        };

    },

    // --------------------------------------------------
    // Build inventory rows for all enabled motif recipes
    // --------------------------------------------------
    getMotifInventoryStatus() {

        const items =
            MotifRecipeCatalog
                .getImplemented()
                .map(
                    definition => {
                        const motif =
                            this.getMotifEligibility(
                                definition.id
                            );

                        return {
                            id:
                                definition.id,
                            name:
                                definition.name,
                            quantity:
                                motif.inventory
                                    .quantity,
                            discovered:
                                motif.inventory
                                    .discovered,
                            lifecycleStatus:
                                motif.lifecycleStatus,
                            canStart:
                                motif.canStart,
                            lastCompletedAtMs:
                                motif.inventory
                                    .lastCompletedAtMs
                        };
                    }
                );

        return {
            items,
            storedTypes:
                items.filter(
                    item =>
                        item.quantity > 0
                ).length,
            totalQuantity:
                items.reduce(
                    (total, item) =>
                        total +
                        item.quantity,
                    0
                )
        };

    },

    // --------------------------------------------------
    // Read the dehydration-speed upgrade and currency
    // --------------------------------------------------
    getDehydrationSpeedStatus() {

        const state =
            this.ensureState();

        const level =
            state.upgrades
                .dehydrationSynthesisSpeed
                .level;

        const speedMultiplier =
            getSpeedMultiplier(
                level
            );

        return {
            level,
            synthesisPointsSpent:
                level,
            synthesisPointCost:
                SYNTHESIS_POINT_COST_PER_LEVEL,
            bonusPercentPerLevel:
                DEHYDRATION_SPEED_BONUS_PER_LEVEL *
                100,
            speedMultiplier,
            effectiveSecondsPerPeptideBond:
                BASE_SECONDS_PER_PEPTIDE_BOND /
                speedMultiplier,
            points:
                SynthesisPointManager
                    .getStatus()
        };

    },

    // --------------------------------------------------
    // Spend one point on future-job synthesis speed
    // --------------------------------------------------
    spendSynthesisPointOnDehydrationSpeed() {

        const state =
            this.ensureState();

        const speedUpgrade =
            state.upgrades
                .dehydrationSynthesisSpeed;

        const previousLevel =
            speedUpgrade.level;

        const previousPointStatus =
            SynthesisPointManager
                .getStatus();

        const updatedPoints =
            SynthesisPointManager
                .spendPoints(
                    SYNTHESIS_POINT_COST_PER_LEVEL,
                    "dehydration-synthesis-speed"
                );

        if (updatedPoints === false) {
            return {
                success: false,
                reason:
                    "insufficient-synthesis-points",
                message:
                    "A Synthesis Point is required for this upgrade."
            };
        }

        speedUpgrade.level =
            previousLevel + 1;
        speedUpgrade.synthesisPointsSpent =
            speedUpgrade.level;

        const saved =
            SaveManager.save({
                reason:
                    "dehydration-synthesis-speed-upgraded"
            });

        if (!saved) {
            speedUpgrade.level =
                previousLevel;
            speedUpgrade.synthesisPointsSpent =
                previousLevel;

            SynthesisPointManager
                .restoreStatus(
                    previousPointStatus
                );

            return {
                success: false,
                reason: "save-failed",
                message:
                    "The speed upgrade could not be saved."
            };
        }

        const speed =
            this.getDehydrationSpeedStatus();

        this.notifyStateChange(
            "dehydration-speed-upgraded",
            {
                level:
                    speed.level,
                speedMultiplier:
                    speed.speedMultiplier
            }
        );

        return {
            success: true,
            reason: "speed-upgraded",
            speed,
            appliesToActiveJob: false,
            message:
                `Dehydration synthesis speed is now ${speed.speedMultiplier}×. Active jobs keep their original duration.`
        };

    },

    // --------------------------------------------------
    // Read timestamp-derived active-job progress
    // --------------------------------------------------
    getActiveSynthesisProgress(
        nowMs = Date.now()
    ) {

        const job =
            this.ensureState()
                .activeSynthesis;

        if (!job) {
            return null;
        }

        const elapsedMs =
            Math.max(
                0,
                Math.min(
                    job.durationMs,
                    nowMs -
                        job.startedAtMs
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
    // Start one ATP-funded motif synthesis job
    // --------------------------------------------------
    startSynthesis(
        motifId = FIRST_MOTIF_ID,
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
                    "The synthesis job requires a valid start time."
            };
        }

        this.reconcileSynthesis(
            nowMs
        );

        const state =
            this.ensureState();

        if (state.activeSynthesis) {
            return {
                success: false,
                reason:
                    "synthesis-already-active",
                message:
                    `Finish ${state.activeSynthesis.motifId} before starting another motif.`
            };
        }

        const definition =
            MotifRecipeCatalog.get(
                motifId
            );

        const eligibility =
            this.getMotifEligibility(
                motifId
            );

        if (
            !definition ||
            !definition.implemented ||
            !eligibility
        ) {
            return {
                success: false,
                reason: "unknown-motif",
                message:
                    "That motif is not available for synthesis."
            };
        }

        if (
            eligibility.missingReactionIds
                .length > 0
        ) {
            return {
                success: false,
                reason:
                    "missing-reaction-discovery",
                missingReactionIds:
                    eligibility
                        .missingReactionIds,
                message:
                    "Discover dehydration before beginning motif synthesis."
            };
        }

        if (
            eligibility.missingAminoAcidIds
                .length > 0
        ) {
            return {
                success: false,
                reason:
                    "missing-amino-acids",
                missingAminoAcidIds:
                    eligibility
                        .missingAminoAcidIds,
                message:
                    `Synthesize these amino-acid types first: ${eligibility.missingAminoAcidIds.join(", ")}.`
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

        if (
            !definition.compositionValid
        ) {
            return {
                success: false,
                reason:
                    "invalid-recipe-composition",
                message:
                    "This motif recipe has an invalid amino-acid composition."
            };
        }

        const speed =
            this.getDehydrationSpeedStatus();

        const durationMs =
            calculateDurationMs(
                definition,
                speed.level
            );

        const job = {
            jobId:
                createJobId(
                    motifId,
                    nowMs
                ),
            motifId,
            startedAtMs:
                nowMs,
            completesAtMs:
                nowMs +
                durationMs,
            durationMs,
            baseDurationMs:
                getBaseDurationMs(
                    definition
                ),
            atpCost:
                definition.atpCost,
            peptideBondCount:
                definition.peptideBondCount,
            secondsPerPeptideBond:
                BASE_SECONDS_PER_PEPTIDE_BOND,
            speedUpgradeLevel:
                speed.level,
            speedMultiplier:
                speed.speedMultiplier
        };

        const atpSpent =
            ResourceManager.spendATP(
                definition.atpCost,
                "macromolecularizer-synthesis-started"
            );

        if (!atpSpent) {
            return {
                success: false,
                reason: "insufficient-atp",
                message:
                    "ATP changed before the synthesis job could start."
            };
        }

        state.activeSynthesis =
            job;

        const saved =
            SaveManager.save({
                reason:
                    "macromolecularizer-synthesis-started"
            });

        if (!saved) {
            state.activeSynthesis =
                null;

            ResourceManager.addATP(
                definition.atpCost,
                "macromolecularizer-synthesis-start-rollback"
            );

            return {
                success: false,
                reason: "save-failed",
                message:
                    "The synthesis job could not be saved. ATP was restored."
            };
        }

        this.lastProgressEventAtMs =
            nowMs;

        this.notifyStateChange(
            "synthesis-started",
            {
                jobId:
                    job.jobId,
                motifId
            }
        );

        return {
            success: true,
            reason: "synthesis-started",
            synthesis:
                this.getActiveSynthesisProgress(
                    nowMs
                ),
            message:
                `${definition.name} synthesis started.`
        };

    },

    // --------------------------------------------------
    // Complete one job exactly once when its time elapses
    // --------------------------------------------------
    finishSynthesis(
        jobId,
        completedAtMs = Date.now()
    ) {

        if (
            !Number.isFinite(
                completedAtMs
            ) ||
            completedAtMs < 0
        ) {
            return {
                success: false,
                reason:
                    "invalid-completion-time"
            };
        }

        const state =
            this.ensureState();

        const job =
            state.activeSynthesis;

        if (
            !job ||
            job.jobId !== jobId
        ) {
            return {
                success: false,
                reason: "active-job-mismatch"
            };
        }

        if (
            completedAtMs <
            job.completesAtMs
        ) {
            return {
                success: false,
                reason: "synthesis-not-complete"
            };
        }

        state.activeSynthesis =
            null;

        const previous =
            state.synthesized[
                job.motifId
            ];

        const nextCount =
            safeInteger(
                previous?.count
            ) + 1;

        state.synthesized[
            job.motifId
        ] = {
            count:
                nextCount,
            firstCompletedAtMs:
                previous
                    ?.firstCompletedAtMs ??
                completedAtMs,
            lastCompletedAtMs:
                completedAtMs
        };

        state.motifInventory[
            job.motifId
        ] =
            safeInteger(
                state.motifInventory[
                    job.motifId
                ]
            ) + 1;

        const atpCapacity =
            ResourceManager
                .increaseATPCapacity(
                    1,
                    "macromolecularizer-motif-synthesized"
                );

        if (
            !GameStateManager
                .hasDiscoveryInCategory(
                    "motifs",
                    job.motifId
                )
        ) {
            DiscoveryManager.record(
                "motifs",
                job.motifId
            );
        }

        const saved =
            SaveManager.save({
                reason:
                    "macromolecularizer-synthesis-completed"
            });

        GameStateObserver.notify(
            "motif-synthesized",
            {
                jobId:
                    job.jobId,
                motifId:
                    job.motifId,
                completedAtMs,
                count:
                    nextCount,
                atpCapacity,
                saved
            }
        );

        this.notifyStateChange(
            "synthesis-completed",
            {
                jobId:
                    job.jobId,
                motifId:
                    job.motifId,
                count:
                    nextCount,
                atpCapacity,
                saved
            }
        );

        return {
            success: saved,
            completed: true,
            saved,
            reason: saved
                ? "synthesis-completed"
                : "save-failed",
            motifId:
                job.motifId,
            count:
                nextCount,
            atpCapacity,
            message: saved
                ? `${job.motifId} synthesis completed and saved. ATP capacity increased to ${atpCapacity.maximum}.`
                : `${job.motifId} synthesis completed, but the browser save failed.`
        };

    },

    // --------------------------------------------------
    // Reconcile active work from wall-clock timestamps
    // --------------------------------------------------
    reconcileSynthesis(
        nowMs = Date.now()
    ) {

        if (
            !Number.isFinite(nowMs) ||
            nowMs < 0
        ) {
            return false;
        }

        const progress =
            this.getActiveSynthesisProgress(
                nowMs
            );

        if (!progress) {
            return false;
        }

        if (progress.complete) {
            return this.finishSynthesis(
                progress.jobId,
                nowMs
            );
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
                "synthesis-progress",
                {
                    jobId:
                        progress.jobId
                }
            );
        }

        return false;

    },

    // --------------------------------------------------
    // Read reaction knowledge from categorized discoveries
    // --------------------------------------------------
    hasReactionDiscovery(reactionId) {

        if (
            typeof reactionId !== "string" ||
            !REACTION_DISCOVERY_IDS.includes(
                reactionId.trim()
            )
        ) {
            return false;
        }

        return GameStateManager
            .hasDiscoveryInCategory(
                "reactions",
                reactionId.trim()
            );

    },

    // --------------------------------------------------
    // Record one temporary reaction-discovery gate
    // --------------------------------------------------
    discoverReaction(reactionId) {

        if (typeof reactionId !== "string") {
            return {
                success: false,
                discovered: false,
                saved: false,
                reason: "unknown-reaction",
                message: "That reaction is not available for discovery."
            };
        }

        const normalizedId =
            reactionId.trim();

        if (
            !REACTION_DISCOVERY_IDS.includes(
                normalizedId
            )
        ) {
            return {
                success: false,
                discovered: false,
                saved: false,
                reason: "unknown-reaction",
                reactionId: normalizedId,
                message: "That reaction is not available for discovery."
            };
        }

        if (
            this.hasReactionDiscovery(
                normalizedId
            )
        ) {
            return {
                success: true,
                discovered: false,
                saved: true,
                reason: "already-discovered",
                reactionId: normalizedId,
                message:
                    `${normalizedId} is already discovered.`
            };
        }

        const recorded =
            DiscoveryManager.record(
                "reactions",
                normalizedId
            );

        if (!recorded) {
            return {
                success: false,
                discovered: false,
                saved: false,
                reason: "record-failed",
                reactionId: normalizedId,
                message: "The reaction discovery could not be recorded."
            };
        }

        const saved =
            SaveManager.save({
                reason:
                    "macromolecularizer-reaction-discovered"
            });

        this.notifyStateChange(
            "reaction-discovered",
            {
                reactionId: normalizedId,
                saved
            }
        );

        return {
            success: saved,
            discovered: true,
            saved,
            reason: saved
                ? "reaction-discovered"
                : "save-failed",
            reactionId: normalizedId,
            message: saved
                ? `${normalizedId} discovered and saved.`
                : `${normalizedId} was discovered, but the browser save failed.`
        };

    },

    // --------------------------------------------------
    // Read a safe development snapshot
    // --------------------------------------------------
    getStatus() {

        const state =
            this.ensureState();

        const zone =
            GameStateManager.getZoneSnapshot(
                ZONE_ID
            );

        const reactionDiscoveries =
            Object.fromEntries(
                REACTION_DISCOVERY_IDS.map(
                    reactionId => [
                        reactionId,
                        this.hasReactionDiscovery(
                            reactionId
                        )
                    ]
                )
            );

        const selectedMotif =
            this.getMotifEligibility(
                state.selectedMotifId
            );

        const dehydrationSpeed =
            this.getDehydrationSpeedStatus();

        const motifInventoryStatus =
            this.getMotifInventoryStatus();

        return {
            initialized:
                this.initialized,
            active:
                this.active,
            unlocked:
                Boolean(zone?.unlocked),
            completed:
                Boolean(zone?.completed),
            activeCategory:
                state.activeCategory,
            selectedMotifId:
                state.selectedMotifId,
            selectedMotif,
            reactionDiscoveries,
            activeSynthesis:
                this.getActiveSynthesisProgress(),
            dehydrationSpeed,
            motifInventoryStatus,
            synthesized:
                structuredClone(
                    state.synthesized
                ),
            motifInventory:
                structuredClone(
                    state.motifInventory
                )
        };

    },

    // --------------------------------------------------
    // Publish domain changes for future UI observers
    // --------------------------------------------------
    notifyStateChange(reason, detail = {}) {

        GameStateObserver.notify(
            "macromolecularizer-state-changed",
            {
                reason,
                ...detail
            }
        );

    },

    // --------------------------------------------------
    // Subscribe once for future manual save loads
    // --------------------------------------------------
    subscribe() {

        if (this.subscribed) {
            return;
        }

        GameStateObserver.on(
            "game-tick",
            () => {
                this.reconcileSynthesis(
                    Date.now()
                );
            }
        );

        GameStateObserver.on(
            "game-state-loaded",
            () => {
                this.ensureState();
                this.reconcileSynthesis();
                this.notifyStateChange(
                    "state-loaded"
                );
            }
        );

        GameStateObserver.on(
            "molecule-synthesized",
            ({ moleculeId } = {}) => {

                const definition =
                    MotifRecipeCatalog.get(
                        FIRST_MOTIF_ID
                    );

                if (
                    this.active &&
                    definition
                        ?.aminoAcids
                        .some(
                            requirement =>
                                requirement.id ===
                                moleculeId
                        )
                ) {
                    this.notifyStateChange(
                        "amino-acid-prerequisite-changed",
                        {
                            moleculeId
                        }
                    );
                }

            }
        );

        GameStateObserver.on(
            "atp-changed",
            () => {

                if (this.active) {
                    this.notifyStateChange(
                        "atp-eligibility-changed"
                    );
                }

            }
        );

        GameStateObserver.on(
            "synthesis-points-changed",
            () => {

                if (this.active) {
                    this.notifyStateChange(
                        "synthesis-points-eligibility-changed"
                    );
                }

            }
        );

        this.subscribed = true;

    }

};

export default MacromolecularizerManager;
