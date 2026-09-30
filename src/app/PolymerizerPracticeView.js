import {ProteinAssemblyPractice} from './ProteinAssemblyPractice.js';
import {activityElement as el,activityButton as button} from './GuidedReactionView.js';
const PolymerizerPracticeView = {
    dialog:null, session:null, timer:null,
    close() {
        clearInterval(this.timer);this.timer=null;this.session=null;
        if (this.dialog?.open) this.dialog.close();
    },
    open(productId) {
        this.close();
        if (!this.dialog) {
            this.dialog=el('dialog','poly-practice-dialog');
            this.dialog.setAttribute('aria-label','Protein assembly practice');
            this.dialog.addEventListener('close',()=>{clearInterval(this.timer);this.timer=null;this.session=null;});
            document.body.append(this.dialog);
        }
        this.session=new ProteinAssemblyPractice(productId);
        this.render();this.dialog.showModal();
        this.timer=setInterval(()=>{
            if (!this.session?.job) return;
            this.session.tick();
            if (!this.session.job) this.render();
            else {
                const image=this.dialog.querySelector('.poly-practice-image');
                const url=this.session.imageUrl();
                if (image && url && image.src!==url) image.src=url;
            }
        },200);
    },
    render() {
        if (!this.session) return;
        const s=this.session;
        const heading=el('h2','',`${s.definition.name} · Practice`);
        const note=el('p','','Borrowed motifs and ATP. Practice creates no protein, rewards, discoveries, or saved progress.');
        const image=this.dialog.querySelector('.poly-practice-image') ?? el('img','poly-practice-image');
        image.alt=`Practice assembly of ${s.definition.name}`;
        const url=s.imageUrl();image.hidden=!url;if(url)image.src=url;
        image.onerror=()=>{image.hidden=true;};
        image.onload=()=>{image.hidden=false;};
        const status=el('p','',s.full?'Practice assembly complete':s.job?'Practice assembly running…':s.definition.components.length?`Practice components ${s.completedIds.length}/${s.definition.components.length}`:'Explore the assembly sequence.');
        status.setAttribute('role','status');
        const actions=el('div','poly-component-actions');
        actions.append(button('Simulate full complex',()=>{s.start();this.render();},Boolean(s.job||s.full)));
        for(const c of s.definition.components) actions.append(button(`Simulate component ${c.number}`,()=>{s.start(c.number);this.render();},Boolean(s.job||s.full||c.number!==s.definition.components[s.completedIds.length]?.number)));
        actions.append(button('Restart practice',()=>{this.session=new ProteinAssemblyPractice(s.definition.id);this.render();}),button('Close practice',()=>this.close()));
        this.dialog.replaceChildren(heading,note,image,status,actions);
    }
};
export default PolymerizerPracticeView;
