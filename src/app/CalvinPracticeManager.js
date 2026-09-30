import {createFixationSession} from './CalvinFixationModel.js';
// This controller deliberately has no connection to player state or saves.
export default {
    session:null,
    getStatus(){return {available:true,completed:this.session?.phase==='complete'};},
    start(){this.session=createFixationSession();return true;},
    reset(){this.session=null;},
    complete(){return {success:this.session?.phase==='complete' && this.session?.reactions===3 && this.session?.carbonSource==='CO2',reason:'practice-complete'};}
};
