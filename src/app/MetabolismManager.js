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
import MetabolismSystemsCatalog
    from "../data/MetabolismSystemsCatalog.js";
import ATPManager from "./ATPManager.js";

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
        ...(pathway.coreSlots ?? []),
        ...(pathway.regenerationBranches ?? [])
            .flatMap(branch =>
                branch.slots ?? []
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

    /**
     * Resolve one catalog requirement against its authoritative owner. This
     * keeps pathway definitions data-driven while avoiding copied cofactor or
     * enzyme inventories inside Metabolism state.
     */
    getRequirementStatus(requirement) {

        const minimumCount = Math.max(
            1,
            safeCount(
                requirement?.minimumCount ?? 1
            )
        );
        let currentCount = 0;

        if (
            requirement?.type ===
                "polymerizer-product"
        ) {
            currentCount = this.getProductCount(
                requirement.productId
            );
        } else if (
            requirement?.type ===
                "macromolecularizer-product"
        ) {
            currentCount =
                this.getMacromolecularizerProductCount(
                    requirement.productId
                );
        } else if (
            requirement?.type ===
                "molecule-discovery"
        ) {
            currentCount = GameStateManager
                .hasDiscoveryInCategory(
                    "molecules",
                    requirement.productId
                )
                    ? 1
                    : 0;
        } else if (
            requirement?.type ===
                "metabolism-output"
        ) {
            currentCount =
                this.isMetabolismOutputAvailable(
                    requirement.sources
                )
                    ? 1
                    : 0;
        }

        return {
            ...requirement,
            minimumCount,
            currentCount,
            missing: Math.max(
                0,
                minimumCount - currentCount
            ),
            complete:
                currentCount >= minimumCount
        };

    },

    /**
     * Metabolic outputs such as NADH and FADH2 are derived capabilities, not
     * stored consumable inventories. A source becomes available from an
     * already completed module or a fully reconstructed pathway.
     */
    isMetabolismOutputAvailable(
        sources = []
    ) {

        if (!Array.isArray(sources)) {
            return false;
        }

        return sources.some(source => {
            if (
                source?.type ===
                    "completed-module"
            ) {
                return Boolean(
                    this.ensureState()
                        .completedModules?.[
                            source.moduleId
                        ]?.completed
                );
            }

            if (
                source?.type ===
                    "completed-pathway"
            ) {
                return this
                    .isPathwayReconstructionComplete(
                        source.pathwayId
                    );
            }

            return false;
        });

    },

    isPathwayReconstructionComplete(
        pathwayId
    ) {

        const pathway =
            MetabolismPathwayCatalog.get(
                pathwayId
            );

        if (
            !pathway ||
            pathway.mapType === "network" ||
            (pathway.coreSlots ?? [])
                .length === 0
        ) {
            return false;
        }

        const placements =
            this.ensureState()
                .pathwayPlacements?.[
                    pathwayId
                ] ?? {};
        const coreComplete =
            pathway.coreSlots.every(slot =>
                placements[
                    String(slot.slot)
                ] === slot.enzymeId
            );
        const requiredBranchId =
            pathway.completionRule
                ?.requiredRegenerationBranchId;

        if (!coreComplete) return false;
        if (!requiredBranchId) return true;

        const requiredBranch =
            (pathway.regenerationBranches ?? [])
                .find(branch =>
                    branch.id ===
                        requiredBranchId
                );

        return Boolean(
            requiredBranch &&
            (requiredBranch.slots ?? [])
                .every(slot =>
                    placements[
                        String(slot.slot)
                    ] === slot.enzymeId
                )
        );

    },

    /**
     * Resolve a read-only network map in catalog order. Dependencies point to
     * earlier nodes, allowing readiness to flow through converging branches
     * without adding a second saved activation graph.
     */
    getNetworkStatus(pathway) {

        if (
            pathway?.mapType !== "network" ||
            !pathway.network
        ) {
            return null;
        }

        const resolvedById = new Map();
        const nodes = pathway.network.nodes.map(
            node => {
                const requirements =
                    (node.activationRequirements ?? [])
                        .map(requirement =>
                            this.getRequirementStatus(
                                requirement
                            )
                        );
                const productCount =
                    node.productId
                        ? this.getProductCount(
                            node.productId
                        )
                        : null;
                const productReady =
                    !node.productId ||
                    productCount >= 1;
                const dependencies =
                    (node.dependencies ?? [])
                        .map(dependency => {
                            const states =
                                dependency.nodeIds.map(
                                    nodeId => Boolean(
                                        resolvedById.get(
                                            nodeId
                                        )?.functionReady
                                    )
                                );
                            const complete =
                                dependency.mode === "any"
                                    ? states.some(Boolean)
                                    : states.every(Boolean);

                            return {
                                ...dependency,
                                complete
                            };
                        });
                const requirementsMet =
                    requirements.every(
                        requirement =>
                            requirement.complete
                    );
                const dependenciesMet =
                    dependencies.every(
                        dependency =>
                            dependency.complete
                    );
                const resolved = {
                    ...node,
                    productCount,
                    productReady,
                    activationRequirements:
                        requirements,
                    dependencies,
                    requirementsMet,
                    dependenciesMet,
                    functionReady:
                        productReady &&
                        requirementsMet &&
                        dependenciesMet
                };

                resolvedById.set(
                    node.id,
                    resolved
                );
                return resolved;
            }
        );
        const connections =
            pathway.network.connections.map(
                connection => ({
                    ...connection,
                    active: Boolean(
                        resolvedById.get(
                            connection.from
                        )?.functionReady &&
                        resolvedById.get(
                            connection.to
                        )?.functionReady
                    )
                })
            );

        return {
            nodes,
            connections,
            complete:
                nodes.length > 0 &&
                nodes.every(node =>
                    node.functionReady
                )
        };

    },

    getCoreModuleStatus(pathway) {

        const module = pathway.coreModule;

        if (!module) return null;

        const requirements =
            (module.requirements ?? []).map(
                requirement =>
                    this.getRequirementStatus(
                        requirement
                    )
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
                !Boolean(record?.completed) &&
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

        const unlockRequirements =
            (pathway.unlockRequirements ?? [])
                .map(requirement =>
                    this.getRequirementStatus(
                        requirement
                    )
                );
        const requirementsMet =
            unlockRequirements.every(
                requirement =>
                    requirement.complete
            );
        const released =
            pathway.releaseState !==
                "coming-soon";
        const placements = {
            ...(this.ensureState()
                .pathwayPlacements[
                    pathwayId
                ] ?? {})
        };
        const resolveSlot = slot => {
            const activationRequirements =
                (slot.activationRequirements ?? [])
                    .map(requirement =>
                        this.getRequirementStatus(
                            requirement
                        )
                    );

            return {
                ...slot,
                activationRequirements,
                functionReady:
                    activationRequirements.every(
                        requirement =>
                            requirement.complete
                    )
            };
        };
        const resolvedCoreSlots =
            (pathway.coreSlots ?? [])
                .map(resolveSlot);
        const resolvedBranches =
            (pathway.regenerationBranches ?? [])
                .map(branch => ({
                    ...branch,
                    slots:
                        (branch.slots ?? [])
                            .map(resolveSlot)
                }));
        const allSlots = [
            ...resolvedCoreSlots,
            ...resolvedBranches.flatMap(
                branch => branch.slots
            )
        ];
        const corePlacedCount =
            (pathway.coreSlots ?? []).reduce(
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
            allSlots.map(slot => {
                return {
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
                        (pathway.coreSlots ?? [])
                            .some(coreSlot =>
                                coreSlot.slot ===
                                    slot.slot
                            )
                };
            }).filter(enzyme =>
                enzyme.productCount > 0
            );
        const requiredCoreEnzymes =
            (pathway.coreSlots ?? []).length;
        const rewardPerPlacement =
            pathway.reward?.implemented
                ? Number(
                    pathway.reward
                        .amountPerCorrectCoreEnzyme
                ) || 0
                : 0;

        return {
            ...pathway,
            coreSlots: resolvedCoreSlots,
            regenerationBranches:
                resolvedBranches,
            available:
                released && requirementsMet,
            selectable: released,
            unlockRequirements,
            unlockStatus: {
                ...(unlockRequirements[0] ?? {}),
                complete: requirementsMet,
                requirements:
                    unlockRequirements
            },
            placements,
            placedEnzymeIds,
            availableEnzymes,
            reconstruction: {
                placedCoreEnzymes:
                    corePlacedCount,
                requiredCoreEnzymes:
                    requiredCoreEnzymes,
                percent:
                    requiredCoreEnzymes > 0
                        ? Math.round(
                            corePlacedCount /
                            requiredCoreEnzymes *
                            100
                        )
                        : 0,
                atpPerMinute:
                    corePlacedCount *
                    rewardPerPlacement,
                complete:
                    requiredCoreEnzymes > 0 &&
                    corePlacedCount ===
                        requiredCoreEnzymes
            },
            regenerationComplete:
                (pathway
                    .regenerationBranches ?? [])
                    .every(branch =>
                        (branch.slots ?? []).every(
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
                ),
            networkStatus:
                this.getNetworkStatus(
                    pathway
                )
        };

    },

    getStatus() {

        const pathways =
            MetabolismPathwayCatalog
                .getAll()
                .map(pathway =>
                    this.getPathwayStatus(
                        pathway.id
                    )
                );

        const energyBalance =
            ATPManager.getBalanceStatus();

        return {
            pathways,
            systems:
                this.getSystemsStatus(
                    pathways,
                    energyBalance
                ),
            polymerizerInventory:
                this.getPolymerizerInventory()
        };

    },

    /**
     * Builds a read-only map-of-maps status. It intentionally reports
     * readiness and reconstruction progress, not pathway activity. Regulation
     * controls and active flux are deferred and therefore create no state.
     */
    getSystemsStatus(
        pathways = [],
        energyBalance =
            ATPManager.getBalanceStatus()
    ) {

        const system =
            MetabolismSystemsCatalog.get();
        const pathwayById = new Map(
            pathways.map(pathway => [
                pathway.id,
                pathway
            ])
        );
        const nodes = system.nodes.map(node => {
            if (
                node.type !== "pathway" ||
                !node.pathwayId
            ) {
                return {
                    ...node,
                    interactive: false,
                    statusLabel:
                        node.type ===
                            "flow-signal"
                            ? "Flow signal"
                            : "Planned",
                    progressLabel: null
                };
            }

            const pathway =
                pathwayById.get(
                    node.pathwayId
                );
            const isNetwork =
                pathway?.mapType ===
                    "network";
            const readyNetworkNodes =
                pathway?.networkStatus
                    ?.nodes.filter(
                        networkNode =>
                            networkNode
                                .functionReady
                    ).length ?? 0;
            const totalNetworkNodes =
                pathway?.networkStatus
                    ?.nodes.length ?? 0;

            return {
                ...node,
                interactive:
                    Boolean(
                        pathway?.selectable
                    ),
                available:
                    Boolean(
                        pathway?.available
                    ),
                statusLabel:
                    !pathway?.selectable
                        ? "Coming Soon"
                        : pathway.available
                            ? "Open detail"
                            : "Locked",
                progressLabel: isNetwork
                    ? `${readyNetworkNodes} / ${totalNetworkNodes} functional nodes ready`
                    : `${pathway?.reconstruction?.placedCoreEnzymes ?? 0} / ${pathway?.reconstruction?.requiredCoreEnzymes ?? 0} enzyme cards placed`
            };
        });

        return {
            ...system,
            nodes,
            // Edges are conceptual during this milestone. They do not claim
            // that metabolite flux or pathway activity has been calculated.
            connections:
                system.connections.map(
                    connection => ({
                        ...connection,
                        conceptual: true
                    })
                ),
            regulationImplemented: false,
            energyBalance
        };

    },

    // Permanently activate the black-box pathway module after all of its
    // non-consuming products are available. ATPManager derives its ongoing
    // production reward from this saved completion record.
    completeCoreModule(
        pathwayId,
        nowMs = Date.now()
    ) {

        const pathway =
            MetabolismPathwayCatalog.get(
                pathwayId
            );

        if (!pathway?.coreModule) {
            return {
                success: false,
                reason:
                    "unknown-core-module"
            };
        }

        const status =
            this.getCoreModuleStatus(
                pathway
            );

        if (status.completed) {
            return {
                success: false,
                reason:
                    "core-module-already-completed"
            };
        }

        if (!status.implemented) {
            return {
                success: false,
                reason:
                    "core-module-not-implemented"
            };
        }

        if (!status.requirementsMet) {
            return {
                success: false,
                reason:
                    "core-module-requirements-missing",
                requirements:
                    status.requirements
            };
        }

        const state = this.ensureState();
        const previousModules =
            structuredClone(
                state.completedModules
            );
        const completedAtMs =
            Number.isFinite(nowMs) &&
            nowMs >= 0
                ? nowMs
                : Date.now();

        state.completedModules[
            status.id
        ] = {
            completed: true,
            completedAtMs
        };

        const saved = SaveManager.save({
            reason:
                "metabolism-core-module-completed"
        });

        if (!saved) {
            state.completedModules =
                previousModules;

            return {
                success: false,
                reason: "save-failed"
            };
        }

        this.notifyStateChange(
            "core-module-completed",
            {
                pathwayId,
                moduleId: status.id,
                completedAtMs
            }
        );

        return {
            success: true,
            reason:
                "core-module-completed",
            pathwayId,
            moduleId: status.id,
            completedAtMs,
            atpPerMinute:
                status.reward
                    .amountPerMinute
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

        const activationRequirements =
            (expectedSlot.activationRequirements ?? [])
                .map(requirement =>
                    this.getRequirementStatus(
                        requirement
                    )
                );
        const missingRequirements =
            activationRequirements.filter(
                requirement =>
                    !requirement.complete
            );

        if (missingRequirements.length > 0) {
            return {
                success: false,
                reason:
                    "enzyme-requirements-missing",
                missingRequirements
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
