// --------------------------------------------------
// ObjectiveRegistry.js
// Pluggable objective evaluation for QuestManager
// --------------------------------------------------

import gameState from "./GameState.js";
import ParticleInventoryManager from "./ParticleInventoryManager.js";
import MoleculeRecipeCatalog
    from "../data/MoleculeRecipeCatalog.js";
import MacromolecularRecipeCatalog
    from "../data/MacromolecularRecipeCatalog.js";


const handlers = new Map();

function createBaselineKey(
    objective,
    objectiveIndex
) {
    return [
        objective.type,
        objective.particleId ??
            objective.atomId ??
            "objective",
        objectiveIndex
    ].join(":");
}

function normalizeProgress(
    current,
    target
) {
    const safeTarget =
        Number.isFinite(target) &&
        target > 0
            ? target
            : 1;
    const safeCurrent =
        Number.isFinite(current) &&
        current >= 0
            ? Math.min(
                current,
                safeTarget
            )
            : 0;

    return {
        current: safeCurrent,
        target: safeTarget,
        complete:
            safeCurrent >= safeTarget
    };
}

const ObjectiveRegistry = {

    register(type, handler) {

        if (
            typeof type !== "string" ||
            type.trim() === ""
        ) {
            throw new Error(
                "ObjectiveRegistry: objective type must be a non-empty string"
            );
        }

        if (
            !handler ||
            typeof handler.evaluate !==
                "function"
        ) {
            throw new Error(
                `ObjectiveRegistry: "${type}" requires an evaluate function`
            );
        }

        handlers.set(
            type,
            Object.freeze({
                ...handler
            })
        );

        return true;

    },

    has(type) {
        return handlers.has(type);
    },

    get(type) {
        return handlers.get(type) ?? null;
    },

    getRegisteredTypes() {
        return [...handlers.keys()];
    },

    getObservedEvents() {
        return [
            ...new Set(
                [...handlers.values()]
                    .flatMap(
                        handler =>
                            handler.events ?? []
                    )
            )
        ];
    },

    evaluate({
        questId,
        objective,
        objectiveIndex = 0,
        record
    }) {

        const handler =
            this.get(objective?.type);

        if (!handler) {
            console.error(
                `ObjectiveRegistry: no handler is registered for "${objective?.type}"`
            );

            return {
                current: 0,
                target:
                    objective?.target ?? 1,
                complete: false,
                error:
                    "unregistered-objective-type"
            };
        }

        return handler.evaluate({
            questId,
            objective,
            objectiveIndex,
            record
        });

    },

    captureBaseline({
        questId,
        objective,
        objectiveIndex = 0,
        record
    }) {

        const handler =
            this.get(objective?.type);

        if (
            !handler ||
            typeof handler.captureBaseline !==
                "function"
        ) {
            return false;
        }

        handler.captureBaseline({
            questId,
            objective,
            objectiveIndex,
            record
        });

        return true;

    }

};

// --------------------------------------------------
// Atom Inventory (Atomizer State)
//
// This objective deliberately uses the currently available whole-atom count.
// Earlier versions captured a quest-activation baseline and required two more
// atoms. That could never complete at a full Atomizer because its cap prevented
// any additional production.
// --------------------------------------------------

ObjectiveRegistry.register(
    "atom-harvest",
    {
        events: [
            "atom-harvested",
            "atomizer-produce",
            "inventory-updated",
            "atomizer-updated"
        ],

        evaluate({ objective }) {
            const targetAtom = objective.atomId || "H";

            const rawCount =
                gameState.zones?.atomizer?.state?.atoms?.[targetAtom]?.count ??
                gameState.inventory?.atoms?.[targetAtom] ??
                0;

            const currentCount = Math.floor(rawCount);

            const progress = normalizeProgress(
                currentCount,
                objective.target
            );

            return {
                ...progress,
                baseline: null,
                currentCount
            };
        }
    }
);

// --------------------------------------------------
// Atom Discovery Count
// --------------------------------------------------

ObjectiveRegistry.register(
    "atom-discovery-count",
    {
        events: [
            "discovery-made"
        ],

        evaluate({ objective }) {
            const currentCount =
                Object.keys(
                    gameState.discoveries?.atoms || {}
                ).length;

            const progress =
                normalizeProgress(
                    currentCount,
                    objective.target
                );

            return {
                ...progress,
                baseline: null,
                currentCount
            };
        }
    }
);

// A fixed set of distinct synthesized elements. Current categorized atom
// discovery records are authoritative; isotopes and repeated syntheses do not
// add extra progress. Historical syntheses count immediately.
ObjectiveRegistry.register(
    "atom-synthesis-set",
    {
        events: [
            "atom-synthesis-changed",
            "discovery-made"
        ],

        evaluate({ objective }) {
            const atomIds = [
                ...new Set(
                    objective.atomIds ?? []
                )
            ];

            if (
                atomIds.length === 0 ||
                atomIds.length !== objective.target ||
                atomIds.some(atomId =>
                    typeof atomId !== "string" ||
                    atomId.trim() === ""
                )
            ) {
                return {
                    current: 0,
                    target: objective.target ?? 1,
                    complete: false,
                    error: "invalid-atom-set"
                };
            }

            const discoveries =
                gameState.discoveries?.atoms ?? {};
            const completedIds = atomIds.filter(
                atomId =>
                    Number.isFinite(
                        discoveries[atomId]?.count
                    ) &&
                    discoveries[atomId].count >= 1
            );

            return {
                ...normalizeProgress(
                    completedIds.length,
                    atomIds.length
                ),
                completedIds,
                missingIds: atomIds.filter(
                    atomId =>
                        !completedIds.includes(atomId)
                )
            };
        }
    }
);

// --------------------------------------------------
// Guided Quantum Identification
// --------------------------------------------------

ObjectiveRegistry.register(
    "guided-particle-collection",
    {
        events: [
            "subatomic-assembly-changed"
        ],

        evaluate({ objective }) {
            const current =
                gameState.zones?.quantum
                    ?.state
                    ?.subatomicAssembly
                    ?.guidedCollected
                    ?.[objective.particleId] ??
                0;

            return normalizeProgress(
                current,
                objective.target
            );
        }
    }
);

// --------------------------------------------------
// Particle Collection After Quest Activation
// --------------------------------------------------

ObjectiveRegistry.register(
    "post-activation-particle-collection",
    {
        events: [
            "particle-inventory-changed"
        ],

        captureBaseline({
            objective,
            objectiveIndex,
            record
        }) {
            const key =
                createBaselineKey(
                    objective,
                    objectiveIndex
                );
            const inventory =
                ParticleInventoryManager
                    .getStatus();

            record.objectiveBaselines[key] =
                inventory
                    .lifetimeCollected[
                        objective.particleId
                    ] ?? 0;
        },

        evaluate({
            objective,
            objectiveIndex,
            record
        }) {
            const key =
                createBaselineKey(
                    objective,
                    objectiveIndex
                );
            const baseline =
                record?.objectiveBaselines?.[
                    key
                ];
            const lifetime =
                ParticleInventoryManager
                    .getStatus()
                    .lifetimeCollected[
                        objective.particleId
                    ] ?? 0;
            const progress =
                normalizeProgress(
                    Number.isFinite(baseline)
                        ? lifetime - baseline
                        : 0,
                    objective.target
                );

            return {
                ...progress,
                baseline:
                    Number.isFinite(baseline)
                        ? baseline
                        : null,
                lifetime
            };
        }
    }
);

// --------------------------------------------------
// Atom Lab Synthesis Objective
// --------------------------------------------------

ObjectiveRegistry.register(
    "atom-synthesis",
    {
        events: [
            "atom-synthesis-changed",
            "discovery-made"
        ],

        evaluate({ objective }) {
            const current =
                gameState.discoveries
                    ?.atoms
                    ?.[objective.atomId]
                    ?.count ?? 0;

            return normalizeProgress(
                current,
                objective.target
            );
        }
    }
);

// Counts distinct, completed Molecule Lab recipes in one category.
// Existing synthesis history counts; repeated copies do not.
// #TODO CHECK added 9/7/26 3:28 p.m.
ObjectiveRegistry.register(
    "molecule-category-synthesis",
    {
        events: ["molecule-synthesized"],

        evaluate({ objective }) {
            const categoryId =
                objective.categoryId;

            const validCategory =
                MoleculeRecipeCatalog.categories
                    .some(category =>
                        category.id === categoryId
                    );

            if (!validCategory) {
                return {
                    current: 0,
                    target:
                        objective.target ?? 1,
                    complete: false,
                    error:
                        "invalid-molecule-category"
                };
            }

            const history =
                gameState.zones
                    ?.moleculeLab
                    ?.state
                    ?.synthesized ?? {};

            const completedIds =
                Object.entries(history)
                    .filter(([id, record]) => {
                        const definition =
                            MoleculeRecipeCatalog.get(id);

                        return (
                            Number.isFinite(
                                record?.count
                            ) &&
                            record.count >= 1 &&
                            definition?.type !== "link" &&
                            definition?.category ===
                                categoryId
                        );
                    })
                    .map(([id]) => id);

            return {
                ...normalizeProgress(
                    completedIds.length,
                    objective.target
                ),
                completedIds
            };
        }
    }
);

// --------------------------------------------------
// First-time Pond microbiome arrivals
// --------------------------------------------------
ObjectiveRegistry.register(
    "microbiome-discovery",
    {
        events: [
            "microbiome-discovered"
        ],

        evaluate({ objective }) {
            const eligibleBiomeIds =
                Array.isArray(
                    objective.biomeIds
                )
                    ? [
                        ...new Set(
                            objective.biomeIds
                                .filter(
                                    biomeId =>
                                        typeof biomeId ===
                                            "string"
                                )
                        )
                    ]
                    : [];
            const discoveries =
                gameState.zones?.pond
                    ?.state
                    ?.discoveredMicrobiomes ??
                {};
            const completedIds =
                eligibleBiomeIds.filter(
                    biomeId =>
                        Boolean(
                            discoveries[biomeId]
                        )
                );

            return {
                ...normalizeProgress(
                    completedIds.length,
                    objective.target
                ),
                completedIds,
                eligibleBiomeIds,
                consumed: false
            };
        }
    }
);

// A fixed set of distinct, completed Molecule Lab recipes. This intentionally
// reads synthesis history, not discovery flags or counts of repeated copies.
ObjectiveRegistry.register("molecule-synthesis-set", {
    events: ["molecule-synthesized"],

    evaluate({ objective }) {
        const ids = [...new Set(objective.moleculeIds ?? [])];
        if (ids.length === 0 || ids.length !== objective.target) {
            return { current: 0, target: objective.target ?? 1, complete: false,
                error: "invalid-molecule-set" };
        }
        const history = gameState.zones?.moleculeLab?.state?.synthesized ?? {};
        const completed = ids.filter(id =>
            Number.isFinite(history[id]?.count) && history[id].count >= 1
        );
        return {
            ...normalizeProgress(completed.length, ids.length),
            missingIds: ids.filter(id => !completed.includes(id))
        };
    }
});

// Counts a completed Macromolecularizer product from its authoritative
// inventory. Existing synthesis counts qualify, and evaluation is read-only:
// motifs remain permanent levels and are never consumed by this quest.
ObjectiveRegistry.register(
    "macromolecular-product-synthesis",
    {
        events: [
            "motif-synthesized",
            "macromolecularizer-state-changed"
        ],

        evaluate({ objective }) {
            const definition =
                MacromolecularRecipeCatalog.get(
                    objective.productId
                );

            if (
                !definition?.implemented ||
                definition.category !== "motifs"
            ) {
                return {
                    current: 0,
                    target: objective.target ?? 1,
                    complete: false,
                    error:
                        "invalid-macromolecular-product"
                };
            }

            const count =
                gameState.zones
                    ?.macromolecularizer
                    ?.state
                    ?.motifInventory
                    ?.[objective.productId] ?? 0;

            return {
                ...normalizeProgress(
                    Math.floor(
                        Number.isFinite(count)
                            ? Math.max(0, count)
                            : 0
                    ),
                    objective.target
                ),
                productId: objective.productId,
                inventoryCount:
                    Number.isFinite(count)
                        ? Math.max(0, Math.floor(count))
                        : 0,
                consumed: false
            };
        }
    }
);

// Counts distinct completed products in one Macromolecularizer category.
// An optional productIds allowlist narrows a broad catalog category to a
// pedagogically meaningful group, such as membrane phospholipids or
// canonical RNA/DNA monomers. Existing products count and remain unconsumed.
ObjectiveRegistry.register(
    "macromolecular-category-synthesis",
    {
        events: [
            "carbohydrate-synthesized",
            "lipid-synthesized",
            "motif-synthesized",
            "macromolecularizer-state-changed"
        ],

        evaluate({ objective }) {
            const allowedProductIds =
                Array.isArray(
                    objective.productIds
                )
                    ? [...new Set(
                        objective.productIds
                    )]
                    : MacromolecularRecipeCatalog
                        .getImplemented()
                        .filter(definition =>
                            definition.category ===
                                objective.categoryId
                        )
                        .map(definition =>
                            definition.id
                        );

            const validProductIds =
                allowedProductIds.filter(
                    productId => {
                        const definition =
                            MacromolecularRecipeCatalog
                                .get(productId);

                        return Boolean(
                            definition?.implemented &&
                            definition.category ===
                                objective.categoryId
                        );
                    }
                );

            if (validProductIds.length === 0) {
                return {
                    current: 0,
                    target:
                        objective.target ?? 1,
                    complete: false,
                    error:
                        "invalid-macromolecular-category"
                };
            }

            const inventory =
                gameState.zones
                    ?.macromolecularizer
                    ?.state
                    ?.motifInventory ?? {};

            const completedIds =
                validProductIds.filter(
                    productId => {
                        const count =
                            inventory[productId];

                        return Number.isFinite(
                            count
                        ) && count >= 1;
                    }
                );

            return {
                ...normalizeProgress(
                    completedIds.length,
                    objective.target
                ),
                categoryId:
                    objective.categoryId,
                completedIds,
                eligibleProductIds:
                    validProductIds,
                consumed: false
            };
        }
    }
);

export {
    createBaselineKey,
    normalizeProgress
};

export default ObjectiveRegistry;
