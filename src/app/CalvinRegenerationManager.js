import GameStateManager from "./GameStateManager.js";
import GameStateObserver from "./GameStateObserver.js";
import SaveManager from "./SaveManager.js";
import MetabolismManager from "./MetabolismManager.js";
import PracticeProgress from "./MetabolismPracticeProgress.js";
import { REDUCTION_ACTIVITY_ID } from "./CalvinReductionModel.js";
import { createRegenerationSession, REGENERATION_ACTIVITY_ID, REGENERATION_ENZYMES, regenerationScore } from "./CalvinRegenerationModel.js";

const CalvinRegenerationManager = {
    session:null, practice:false,
    getStatus() {
        const state = GameStateManager.getZoneSnapshot("metabolism")?.state;
        const pathway = MetabolismManager.getPathwayStatus("calvinCycle");
        const c2 = state?.guidedActivities?.[REDUCTION_ACTIVITY_ID]?.completed === true;
        const available = this.practice || Boolean(c2 && pathway?.available && REGENERATION_ENZYMES.every((id,i)=>pathway.placements?.[String(i+4)]===id));
        return { available, completed:this.practice ? this.session?.saved === true :
            state?.guidedActivities?.[REGENERATION_ACTIVITY_ID]?.completed === true };
    },
    start(practice=false) {
        this.practice=practice;
        if (!this.getStatus().available) { this.practice=false; return false; }
        this.session=createRegenerationSession(); return true;
    },
    reset() { this.session=null; this.practice=false; },
    complete(nowMs=Date.now()) {
        const s=this.session;
        if (!s || s.phase !== "complete" || s.storedRuBP !== 3 || s.atp !== 3 || s.adp !== 3 || s.pi !== 2 || s.history.length !== 12)
            return {success:false,reason:"activity-incomplete"};
        if (!this.getStatus().available) return {success:false,reason:"activity-locked"};
        const scorePercent=regenerationScore(s);
        if (this.practice) {
            const result=scorePercent===100 ? PracticeProgress.recordPerfectPractices(REGENERATION_ENZYMES,REGENERATION_ACTIVITY_ID,nowMs) :
                {success:true,reason:"practice-complete"};
            if(result.success)s.saved=true;
            return {...result,scorePercent};
        }
        if(this.getStatus().completed)return {success:true,reason:"replay-complete",scorePercent};
        const state=GameStateManager.ensureZoneState("metabolism"), previous=state.guidedActivities;
        state.guidedActivities={...previous,[REGENERATION_ACTIVITY_ID]:{completed:true,completedAtMs:nowMs,definitionVersion:1}};
        if(!SaveManager.save({reason:"calvin-regeneration-completed"})) {
            if(previous===undefined)delete state.guidedActivities;else state.guidedActivities=previous;
            return {success:false,reason:"save-failed"};
        }
        GameStateObserver.notify("metabolism-state-changed",{reason:"guided-activity-completed",activityId:REGENERATION_ACTIVITY_ID});
        return {success:true,reason:"activity-completed",scorePercent};
    }
};
export default CalvinRegenerationManager;
