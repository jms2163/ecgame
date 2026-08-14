// ObjectiveRegistry.js
const objectiveHandlers = new Map();

export const registerObjective = (type, handler) => {
    objectiveHandlers.set(type, handler);
};

export const getObjectiveHandler = (type) => {
    const handler = objectiveHandlers.get(type);
    if (!handler) {
        throw new Error(`[ObjectiveRegistry] Missing handler for objective type: "${type}"`);
    }
    return handler;
};

// --- Register Built-in Handlers ---

registerObjective("guided-particle-collection", {
    evaluate: (objective) => {
        const current = gameState.zones?.quantum?.state?.subatomicAssembly?.guidedCollected?.[objective.particleId] ?? 0;
        const target = objective.target;
        const normalized = Math.min(Math.max(0, current), target);

        return { current: normalized, target, complete: normalized >= target };
    }
});

registerObjective("post-activation-particle-collection", {
    captureBaseline: (objective, record, objectiveIndex) => {
        const key = `${objective.type}:${objective.particleId}:${objectiveIndex}`;
        const lifetime = ParticleInventoryManager.getStatus().lifetimeCollected[objective.particleId] ?? 0;
        record.objectiveBaselines[key] = lifetime;
    },
    evaluate: (objective, record, objectiveIndex) => {
        const key = `${objective.type}:${objective.particleId}:${objectiveIndex}`;
        const baseline = record?.objectiveBaselines?.[key] ?? 0;
        const lifetime = ParticleInventoryManager.getStatus().lifetimeCollected[objective.particleId] ?? 0;
        const current = Math.max(0, Math.min(objective.target, lifetime - baseline));

        return { current, target: objective.target, complete: current >= objective.target, baseline, lifetime };
    }
});