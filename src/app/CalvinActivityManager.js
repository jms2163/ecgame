import GameStateManager from "./GameStateManager.js";
import GameStateObserver from "./GameStateObserver.js";
import SaveManager from "./SaveManager.js";
import MetabolismManager from "./MetabolismManager.js";
import { FIXATION_ACTIVITY_ID, createFixationSession } from "./CalvinFixationModel.js";

const CalvinActivityManager = {
    session: null,

    getStatus() {
        const pathway = MetabolismManager.getPathwayStatus("calvinCycle");
        const available = Boolean(pathway?.available && pathway.placements?.["1"] === "RuBisCO");
        const record = GameStateManager.getZoneSnapshot("metabolism")?.state
            ?.guidedActivities?.[FIXATION_ACTIVITY_ID];
        return { available, completed: record?.completed === true,
            completedAtMs: record?.completedAtMs ?? null };
    },

    start() {
        if (!this.getStatus().available) return false;
        this.session = createFixationSession();
        return true;
    },

    reset() { this.session = null; },

    complete(nowMs = Date.now()) {
        if (!this.getStatus().available) return { success: false, reason: "activity-locked" };
        if (this.session?.phase !== "complete" || this.session.reactions !== 3 ||
            this.session.carbonSource !== "CO2") {
            return { success: false, reason: "activity-incomplete" };
        }
        if (this.getStatus().completed) return { success: true, reason: "replay-complete" };
        const state = GameStateManager.ensureZoneState("metabolism");
        const previous = state.guidedActivities;
        state.guidedActivities = {
            ...(previous && typeof previous === "object" && !Array.isArray(previous) ? previous : {}),
            [FIXATION_ACTIVITY_ID]: {
                completed: true,
                completedAtMs: Number.isFinite(nowMs) && nowMs >= 0 ? nowMs : Date.now(),
                definitionVersion: 1
            }
        };
        if (!SaveManager.save({ reason: "calvin-carbon-fixation-completed" })) {
            if (previous === undefined) delete state.guidedActivities;
            else state.guidedActivities = previous;
            return { success: false, reason: "save-failed" };
        }
        GameStateObserver.notify("metabolism-state-changed", {
            reason: "guided-activity-completed", activityId: FIXATION_ACTIVITY_ID
        });
        return { success: true, reason: "activity-completed" };
    }
};

export default CalvinActivityManager;
