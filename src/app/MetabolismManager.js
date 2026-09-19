// --------------------------------------------------
// MetabolismManager.js
// Metabolism pathway domain authority.
//
// This manager reads completed Polymerizer products through GameStateManager
// snapshots. It never keeps a second inventory and never consumes products.
// Correct enzyme placements are saved here, while completed proteins remain
// owned by Polymerizer. ATPManager derives rewards from these placements.
// --------------------------------------------------

import GameStateManager
    from "./GameStateManager.js";
import GameStateObserver
    from "./GameStateObserver.js";
import SaveManager from "./SaveManager.js";
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

function isRecord(value) {

    return Boolean(
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
    );

}

function getAllSlots(pathway) {

    return [
        ...pathway.coreSlots,
        ...pathway.regenerationBranches
            .flatMap(branch =>
                branch.slots
            )
    ];

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

    // Normalize only fields with active gameplay purposes. Empty objects are
    // compatible with legacy saves and require no VersionManager migration.
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

        if (!isRecord(
            state.pathwayPlacements
        )) {
            state.pathwayPlacements = {};
        }

        if (!isRecord(
            state.completedModules
        )) {
            state.completedModules = {};
        }

        Object.entries(
            state.pathwayPlacements
        ).forEach(([
            pathwayId,
            placements
        ]) => {
            const pathway =
                MetabolismPathwayCatalog.get(
                    pathwayId
                );

            if (!pathway || !isRecord(
                placements
            )) {
                delete state
                    .pathwayPlacements[
                        pathwayId
                    ];
                return;
            }

            const validBySlot = new Map(
                getAllSlots(pathway).map(
                    slot => [
                        String(slot.slot),
                        slot.enzymeId
                    ]
                )
            );

            Object.entries(placements)
                .forEach(([
                    slotNumber,
                    enzymeId
                ]) => {
                    if (
                        validBySlot.get(
                            slotNumber
                        ) !== enzymeId
                    ) {
                        delete placements[
                            slotNumber
                        ];
                    }
                });

            if (
                Object.keys(placements)
                    .length === 0
            ) {
                delete state
                    .pathwayPlacements[
                        pathwayId
                    ];
            }
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

    getMacromolecularizerProductCount(
        productId
    ) {

        if (
            typeof productId !== "string" ||
            productId.trim() === ""
        ) {
            return 0;
        }

        return safeCount(
            GameStateManager
                .getZoneSnapshot(
                    "macromolecularizer"
                )?.state
                ?.motifInventory?.[
                    productId.trim()
                ]
        );

    },

    getCoreModuleStatus(pathway) {

        const module = pathway.coreModule;

        if (!module) return null;

        const requirements =
            module.requirements.map(
                requirement => {
                    const currentCount =
                        requirement.type ===
                            "polymerizer-product"
                            ? this.getProductCount(
                                requirement
                                    .productId
                            )
                            : this
                                .getMacromolecularizerProductCount(
                                    requirement
                                        .productId
                                );

                    return {
                        ...requirement,
                        currentCount,
                        missing:
                            Math.max(
                                0,
                                requirement
                                    .minimumCount -
                                currentCount
                            ),
                        complete:
                            currentCount >=
                            requirement
                                .minimumCount
                    };
                }
            );
        const record = this.ensureState()
            .completedModules[
                module.id
            ];

        return {
            ...module,
            requirements,
            requirementsMet:
                requirements.every(
                    requirement =>
                        requirement.complete
                ),
            completed:
                Boolean(record?.completed),
            completedAtMs:
                Number.isFinite(
                    record?.completedAtMs
                )
                    ? record.completedAtMs
                    : null,
            canComplete:
                module.implemented &&
                requirements.every(
                    requirement =>
                        requirement.complete
                )
        };

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
        const placements = {
            ...(this.ensureState()
                .pathwayPlacements[
                    pathwayId
                ] ?? {})
        };
        const allSlots =
            getAllSlots(pathway);
        const corePlacedCount =
            pathway.coreSlots.reduce(
                (count, slot) =>
                    placements[
                        String(slot.slot)
                    ] === slot.enzymeId
                        ? count + 1
                        : count,
                0
            );
        const placedEnzymeIds =
            Object.values(placements);
        const availableEnzymes =
            allSlots.map(slot => ({
                ...slot,
                productCount:
                    this.getProductCount(
                        slot.enzymeId
                    ),
                placed:
                    placements[
                        String(slot.slot)
                    ] === slot.enzymeId,
                isCore:
                    pathway.coreSlots
                        .some(coreSlot =>
                            coreSlot.slot ===
                                slot.slot
                        )
            })).filter(enzyme =>
                enzyme.productCount > 0
            );

        return {
            ...pathway,
            available: missing === 0,
            unlockStatus: {
                ...requirement,
                currentCount,
                missing,
                complete: missing === 0
            },
            placements,
            placedEnzymeIds,
            availableEnzymes,
            reconstruction: {
                placedCoreEnzymes:
                    corePlacedCount,
                requiredCoreEnzymes:
                    pathway.coreSlots
                        .length,
                percent:
                    Math.round(
                        corePlacedCount /
                        pathway.coreSlots
                            .length *
                        100
                    ),
                atpPerMinute:
                    corePlacedCount *
                    pathway.reward
                        .amountPerCorrectCoreEnzyme,
                complete:
                    corePlacedCount ===
                    pathway.coreSlots
                        .length
            },
            regenerationComplete:
                pathway
                    .regenerationBranches
                    .every(branch =>
                        branch.slots.every(
                            slot =>
                                placements[
                                    String(
                                        slot.slot
                                    )
                                ] ===
                                    slot.enzymeId
                        )
                    ),
            coreModuleStatus:
                this.getCoreModuleStatus(
                    pathway
                )
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

    // --------------------------------------------------
    // Lock one synthesized enzyme into its matching pathway slot
    // --------------------------------------------------
    placeEnzyme(
        pathwayId,
        slotNumber,
        enzymeId
    ) {

        const pathway =
            MetabolismPathwayCatalog.get(
                pathwayId
            );

        if (!pathway) {
            return {
                success: false,
                reason: "unknown-pathway"
            };
        }

        const status =
            this.getPathwayStatus(
                pathwayId
            );

        if (!status.available) {
            return {
                success: false,
                reason: "pathway-locked"
            };
        }

        const normalizedSlot =
            String(slotNumber);
        const expectedSlot =
            getAllSlots(pathway).find(
                slot =>
                    String(slot.slot) ===
                    normalizedSlot
            );

        if (!expectedSlot) {
            return {
                success: false,
                reason: "unknown-slot"
            };
        }

        if (
            expectedSlot.enzymeId !==
                enzymeId
        ) {
            return {
                success: false,
                reason:
                    "incorrect-enzyme-for-slot",
                expectedEnzymeId:
                    expectedSlot.enzymeId
            };
        }

        if (
            this.getProductCount(
                enzymeId
            ) < 1
        ) {
            return {
                success: false,
                reason:
                    "enzyme-not-synthesized"
            };
        }

        const state = this.ensureState();
        const previousPlacements =
            structuredClone(
                state.pathwayPlacements
            );
        const placements =
            state.pathwayPlacements[
                pathwayId
            ] ??= {};

        if (
            placements[normalizedSlot] ===
                enzymeId
        ) {
            return {
                success: false,
                reason: "enzyme-already-placed"
            };
        }

        if (
            Object.values(placements)
                .includes(enzymeId)
        ) {
            return {
                success: false,
                reason:
                    "enzyme-already-used"
            };
        }

        placements[normalizedSlot] =
            enzymeId;

        const saved = SaveManager.save({
            reason:
                "metabolism-enzyme-placed"
        });

        if (!saved) {
            state.pathwayPlacements =
                previousPlacements;
            return {
                success: false,
                reason: "save-failed"
            };
        }

        const updated =
            this.getPathwayStatus(
                pathwayId
            );

        this.notifyStateChange(
            "enzyme-placed",
            {
                pathwayId,
                slotNumber:
                    Number(slotNumber),
                enzymeId
            }
        );

        return {
            success: true,
            reason: "enzyme-placed",
            pathwayId,
            slotNumber:
                Number(slotNumber),
            enzymeId,
            reconstruction:
                updated.reconstruction,
            regenerationComplete:
                updated
                    .regenerationComplete
        };

    },

    notifyStateChange(reason, detail = {}) {

        GameStateObserver.notify(
            "metabolism-state-changed",
            { reason, ...detail }
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
