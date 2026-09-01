// --------------------------------------------------
// ObjectiveRegistry.js
// Pluggable objective evaluation for QuestManager
// --------------------------------------------------

import gameState from "./GameState.js";
import ParticleInventoryManager from "./ParticleInventoryManager.js";

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
// Atom Harvest (Atomizer State)
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

        captureBaseline({
            objective,
            objectiveIndex,
            record
        }) {
            const key = createBaselineKey(objective, objectiveIndex);
            const targetAtom = objective.atomId || "H";

            const rawCount =
                gameState.zones?.atomizer?.state?.atoms?.[targetAtom]?.count ??
                gameState.inventory?.atoms?.[targetAtom] ??
                0;

            record.objectiveBaselines[key] = Math.floor(rawCount);
        },

        evaluate({
            objective,
            objectiveIndex,
            record
        }) {
            const key = createBaselineKey(objective, objectiveIndex);
            const baseline = record?.objectiveBaselines?.[key]; // <-- Retreive baseline from record
            const targetAtom = objective.atomId || "H";

            const rawCount =
                gameState.zones?.atomizer?.state?.atoms?.[targetAtom]?.count ??
                gameState.inventory?.atoms?.[targetAtom] ??
                0;

            const currentCount = Math.floor(rawCount);

            const progress = normalizeProgress(
                Number.isFinite(baseline)
                    ? Math.max(0, currentCount - baseline)
                    : currentCount,
                objective.target
            );

            return {
                ...progress,
                baseline: Number.isFinite(baseline) ? baseline : null,
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

export {
    createBaselineKey,
    normalizeProgress
};

export default ObjectiveRegistry;