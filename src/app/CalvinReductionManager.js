import GameStateManager from "./GameStateManager.js";
import GameStateObserver from "./GameStateObserver.js";
import SaveManager from "./SaveManager.js";
import MetabolismManager from "./MetabolismManager.js";
import PracticeProgress from "./MetabolismPracticeProgress.js";
import { FIXATION_ACTIVITY_ID } from "./CalvinFixationModel.js";
import { createReductionSession, REDUCTION_ACTIVITY_ID, REDUCTION_ENZYMES, reductionScore } from "./CalvinReductionModel.js";

const CalvinReductionManager = {
    session:null, practice:false,
    getStatus() {
        const state = GameStateManager.getZoneSnapshot("metabolism")?.state;
        const pathway = MetabolismManager.getPathwayStatus("calvinCycle");
        const c1 = state?.guidedActivities?.[FIXATION_ACTIVITY_ID]?.completed === true;
        const available = this.practice || Boolean(c1 && pathway?.available &&
            pathway.placements?.["2"] === REDUCTION_ENZYMES[0] && pathway.placements?.["3"] === REDUCTION_ENZYMES[1]);
        return { available, completed:this.practice ? this.session?.saved === true :
            state?.guidedActivities?.[REDUCTION_ACTIVITY_ID]?.completed === true };
    },
    start(practice=false) {
        this.practice=practice;
        if (!this.getStatus().available) { this.practice=false; return false; }
        this.session=createReductionSession(); return true;
    },
    reset() { this.session=null; this.practice=false; },
    complete(nowMs=Date.now()) {
        const s=this.session;
        if (!s || s.phase !== "complete" || s.stored !== 6 || s.pgkRuns !== 6 || s.gapdhRuns !== 6 ||
            s.allocation?.regeneration.length !== 5 || s.allocation?.net.length !== 1)
            return {success:false,reason:"activity-incomplete"};
        if (!this.getStatus().available) return {success:false,reason:"activity-locked"};
        const scorePercent=reductionScore(s);
        if (this.practice) {
            const result=scorePercent===100 ? PracticeProgress.recordPerfectPractices(REDUCTION_ENZYMES,REDUCTION_ACTIVITY_ID,nowMs) :
                {success:true,reason:"practice-complete"};
            if(result.success)s.saved=true;
            return {...result,scorePercent};
        }
        if(this.getStatus().completed)return {success:true,reason:"replay-complete",scorePercent};
        const state=GameStateManager.ensureZoneState("metabolism"), previous=state.guidedActivities;
        state.guidedActivities={...previous,[REDUCTION_ACTIVITY_ID]:{completed:true,completedAtMs:nowMs,definitionVersion:1}};
        if(!SaveManager.save({reason:"calvin-reduction-completed"})) {
            if(previous===undefined)delete state.guidedActivities;else state.guidedActivities=previous;
            return {success:false,reason:"save-failed"};
        }
        GameStateObserver.notify("metabolism-state-changed",{reason:"guided-activity-completed",activityId:REDUCTION_ACTIVITY_ID});
        return {success:true,reason:"activity-completed",scorePercent};
    }
};
export default CalvinReductionManager;
