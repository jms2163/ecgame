import {createFixationSession, FIXATION_ACTIVITY_ID} from './CalvinFixationModel.js';
import PracticeProgress from './MetabolismPracticeProgress.js';
// Reactions are transient. A perfect finish saves only an educational P marker.
export default {
    session:null,
    getStatus(){
        const perfect = this.session?.mistakes === 0;
        return {available:true,completed:this.session?.phase==='complete' &&
            (!perfect || PracticeProgress.hasPerfectPractice('RuBisCO'))};
    },
    start(){this.session=createFixationSession();return true;},
    reset(){this.session=null;},
    complete(nowMs = Date.now()){
        if(this.session?.phase!=='complete' || this.session.reactions!==3 || this.session.carbonSource!=='CO2')
            return {success:false,reason:'activity-incomplete'};
        const scorePercent = this.session.mistakes === 0 ? 100 : 0;
        if(scorePercent!==100) return {success:true,reason:'practice-complete',scorePercent};
        return {...PracticeProgress.recordPerfectPractice('RuBisCO',FIXATION_ACTIVITY_ID,nowMs),scorePercent};
    }
};
