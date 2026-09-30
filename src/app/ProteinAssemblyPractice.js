// Read-only catalogs + activity-local state. No game-state, save, or reward imports.
import RecipeCatalog from '../data/PolymerizerRecipeCatalog.js';
import VisualCatalog from '../data/PolymerizerVisualCatalog.js';
import {componentPlan} from './ProteinComponentPlan.js';
export class ProteinAssemblyPractice {
    constructor(productId) {
        this.definition=RecipeCatalog.get(productId);
        if (!this.definition) throw new Error('Unknown practice protein');
        this.completedIds=[]; this.full=false; this.job=null;
    }
    start(number=null, nowMs=Date.now()) {
        if (this.job || this.full || !Number.isFinite(nowMs) || nowMs<0) return false;
        const components=this.definition.components;
        if (number!==null && (!components.length || number!==components[this.completedIds.length]?.number)) return false;
        const ids=number===null ? components.slice(this.completedIds.length).map(c=>c.number) : [number];
        const plan=components.length ? componentPlan(this.definition,ids) : null;
        if (components.length && !plan) return false;
        this.job={startedAtMs:nowMs,durationMs:8000,ids,plan};
        return true;
    }
    tick(nowMs=Date.now()) {
        if (!this.job) return;
        if (nowMs>=this.job.startedAtMs+this.job.durationMs) {
            this.completedIds.push(...this.job.ids);
            this.full=!this.definition.components.length || this.completedIds.length===this.definition.components.length;
            this.job=null;
        }
    }
    imageUrl(nowMs=Date.now()) {
        const visual=VisualCatalog.get(this.definition.id);
        if (!visual) return null;
        if (this.full) return visual.finalImageUrl;
        if (this.job?.plan) {
            const p=Math.max(0,Math.min(1,(nowMs-this.job.startedAtMs)/this.job.durationMs));
            const start=this.job.plan.firstFrame-1, end=this.job.plan.lastFrame;
            return visual.frameUrls[Math.min(end,Math.floor(start+(end-start)*p))];
        }
        if (this.job) return VisualCatalog.resolveImageUrl(this.definition.id,{progress:Math.max(0,Math.min(1,(nowMs-this.job.startedAtMs)/8000))});
        const end=this.definition.components[this.completedIds.length-1]?.lastFrame;
        return end===undefined ? visual.idleImageUrl : visual.frameUrls[end];
    }
}
