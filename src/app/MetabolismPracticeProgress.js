import GameStateManager from "./GameStateManager.js";
import GameStateObserver from "./GameStateObserver.js";
import SaveManager from "./SaveManager.js";

// Educational practice markers only; no protein or pathway completion events.
const MetabolismPracticeProgress = {
    hasPerfectPractice(enzymeId) {
        return GameStateManager.getZoneSnapshot("metabolism")?.state
            ?.practiceMastery?.[enzymeId]?.scorePercent === 100;
    },
    recordPerfectPractice(enzymeId, activityId, nowMs = Date.now()) {
        return this.recordPerfectPractices([enzymeId], activityId, nowMs);
    },
    recordPerfectPractices(enzymeIds, activityId, nowMs = Date.now()) {
        const missing = [...new Set(enzymeIds)].filter(id => !this.hasPerfectPractice(id));
        if (!missing.length) return { success: true, reason: "already-practiced" };
        const state = GameStateManager.ensureZoneState("metabolism");
        const previous = state.practiceMastery;
        state.practiceMastery = {
            ...(previous && typeof previous === "object" && !Array.isArray(previous) ? previous : {}),
            ...Object.fromEntries(missing.map(id => [id, { activityId, scorePercent: 100, completedAtMs: nowMs }]))
        };
        if (!SaveManager.save({ reason: "metabolism-perfect-practice" })) {
            if (previous === undefined) delete state.practiceMastery;
            else state.practiceMastery = previous;
            return { success: false, reason: "save-failed" };
        }
        GameStateObserver.notify("metabolism-state-changed", { reason: "practice-marker", enzymeId: missing[0], enzymeIds: missing });
        return { success: true, reason: "practice-marker-saved" };
    }
};
export default MetabolismPracticeProgress;
