import FixationView from "./CalvinFixationView.js";
import ReductionView from "./CalvinReductionView.js";
import ReductionManager from "./CalvinReductionManager.js";
import RegenerationView from "./CalvinRegenerationView.js";
import RegenerationManager from "./CalvinRegenerationManager.js";
import Overview from "./CalvinOverviewView.js";
import {calvinOverviewSnapshot} from "./CalvinOverviewModel.js";
import Progress from "./MetabolismPracticeProgress.js";

const views={fixation:FixationView,reduction:ReductionView,regeneration:RegenerationView};
// Keeps the cycle visible while a close-up occupies the adjacent lesson panel.
const CalvinActivitiesView = {
    container:null,layout:null,details:null,fixationHost:null,reductionHost:null,regenerationHost:null,
    sync(){
        const active=FixationView.manager.session?"fixation":ReductionManager.session?"reduction":RegenerationManager.session?"regeneration":null;
        for(const name of Object.keys(views))if(this[name+"Host"])this[name+"Host"].hidden=Overview.running||(!!active&&active!==name);
        this.layout?.classList.toggle("is-automating",Overview.running);
        this.container?.closest("#metabolism-zone")?.classList.toggle("metabolism-practice-open",!!active||Overview.running);
        Overview.update(calvinOverviewSnapshot({fixation:FixationView.manager.session,reduction:ReductionManager.session,regeneration:RegenerationManager.session,hasPractice:id=>Progress.hasPerfectPractice(id)}));
    },
    explore(phase){
        Overview.demoComplete=false;
        for(const[name,view]of Object.entries(views)){view.close();view.render(this[name+"Host"]);}
        views[phase]?.start(true);this.sync();
        this[phase+"Host"]?.scrollIntoView({behavior:"smooth",block:"nearest"});
    },
    render(container){
        if(!container)return;this.container=container;
        if(!this.layout||this.layout.parentElement!==container){
            this.layout=document.createElement("div");this.layout.className="calvin-guided-layout";
            const overviewHost=document.createElement("aside");this.details=document.createElement("div");this.details.className="calvin-overview-details";
            for(const name of Object.keys(views)){const host=document.createElement("div");host.className="calvin-activity-section";host.dataset.activity=name;this[name+"Host"]=host;this.details.append(host);}
            this.layout.append(overviewHost,this.details);container.replaceChildren(this.layout);Overview.mount(overviewHost);
        }
        for(const view of Object.values(views)){view.onSessionChange=()=>this.sync();view.onProgress=()=>this.sync();}
        Overview.onExplore=(phase)=>{
            const active={fixation:FixationView.manager.session,reduction:ReductionManager.session,regeneration:RegenerationManager.session}[phase];
            if(active)this[phase+"Host"]?.scrollIntoView({behavior:"smooth",block:"nearest"});else this.explore(phase);
        };
        Overview.onModeChange=playing=>{
            if(playing)for(const[name,view]of Object.entries(views)){view.close();view.render(this[name+"Host"]);}
            this.sync();
        };
        FixationView.onContinuePractice=()=>{FixationView.close();FixationView.render(this.fixationHost);ReductionView.start(true);};
        ReductionView.onContinuePractice=()=>{const practice=ReductionManager.practice;ReductionView.close();ReductionView.render(this.reductionHost);RegenerationView.start(practice);};
        RegenerationView.onContinue=()=>{RegenerationView.close();RegenerationView.render(this.regenerationHost);FixationView.start(true);};
        for(const[name,view]of Object.entries(views))view.render(this[name+"Host"]);this.sync();
    },
    close(){Overview.stop();for(const view of Object.values(views))view.close();this.sync();}
};
export default CalvinActivitiesView;
