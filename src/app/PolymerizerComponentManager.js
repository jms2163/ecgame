import PolymerizerManager from './PolymerizerManager.js';
import PolymerizerRecipeCatalog from '../data/PolymerizerRecipeCatalog.js';
import ResourceManager from './ResourceManager.js';
import SaveManager from './SaveManager.js';
import GameStateManager from './GameStateManager.js';
import GameStateObserver from './GameStateObserver.js';
import gameState from './GameState.js';
import {componentPlan, componentProgress} from './ProteinComponentPlan.js';

const PolymerizerComponentManager = {
    getStatus(productId, number = null) {
        const definition = PolymerizerRecipeCatalog.get(productId);
        if (!definition?.components.length) return null;
        const state = PolymerizerManager.ensureState();
        const full = (state.productInventory[productId]?.count ?? 0) > 0;
        const progress = componentProgress(definition,state.componentAssemblies?.[productId],full);
        const ids = number === null ? definition.components.slice(progress.completedCount).map(c=>c.number) : [number];
        const plan = componentPlan(definition,ids);
        const inventory = PolymerizerManager.getMacromolecularizerInventory();
        const motifs = (plan?.motifRequirements ?? []).map(r=>({...r,owned:inventory[r.productId] ?? 0,
            complete:(inventory[r.productId] ?? 0)>=r.quantity}));
        const atp = ResourceManager.getATPStatus();
        const allowed = number === null || number === progress.nextNumber;
        // Preserve the normal research and quest gates; practice never calls this manager.
        const base = PolymerizerManager.getProductEligibility(productId);
        return {definition,progress,plan,motifs,canStart:Boolean(plan && allowed && !full && definition.implemented &&
            !base.locked && !base.completion?.completed && !state.activeAssembly &&
            motifs.every(r=>r.complete) && atp.current>=plan.atpCost)};
    },
    start(productId, number = null, nowMs = Date.now()) {
        if (!Number.isFinite(nowMs) || nowMs < 0) return {success:false,reason:'invalid-start-time'};
        const status = this.getStatus(productId,number);
        if (!status?.canStart) return {success:false,reason:'component-requirements-incomplete'};
        const state = PolymerizerManager.ensureState();
        const beforeATP = ResourceManager.getATPStatus();
        const plan = status.plan;
        const job = {jobId:globalThis.crypto?.randomUUID?.() ?? `${productId}-${nowMs}-${Math.random()}`,
            productId,componentIds:plan.componentIds,startedAtMs:nowMs,completesAtMs:nowMs+plan.durationMs,
            durationMs:plan.durationMs,atpCost:plan.atpCost,
            motifRequirements:plan.motifRequirements.map(({productId,quantity})=>({productId,quantity}))};
        if (!ResourceManager.spendATP(plan.atpCost,'polymerizer-component-started')) return {success:false,reason:'insufficient-atp'};
        state.activeAssembly = job;
        if (!SaveManager.save({reason:'polymerizer-component-started'})) {
            state.activeAssembly = null;
            ResourceManager.setATPStatus(beforeATP,'polymerizer-component-rollback');
            return {success:false,reason:'save-failed'};
        }
        PolymerizerManager.notifyStateChange('component-started');
        return {success:true,reason:'assembly-started',activeAssembly:PolymerizerManager.getActiveAssemblyProgress(nowMs)};
    },
    finish(job, nowMs) {
        const state = PolymerizerManager.ensureState();
        const definition = PolymerizerRecipeCatalog.get(job.productId);
        if (!definition?.components.length || !state.activeAssembly || state.activeAssembly.jobId !== job.jobId ||
            nowMs < job.completesAtMs) return {success:false,reason:'active-job-mismatch'};
        const oldComponents = state.componentAssemblies;
        const oldInventory = structuredClone(state.productInventory);
        const prior = componentProgress(definition,oldComponents?.[job.productId]);
        if (job.componentIds[0] !== prior.nextNumber) return {success:false,reason:'component-order-mismatch'};
        const completedIds = [...prior.completedIds,...job.componentIds];
        state.componentAssemblies = {...(oldComponents ?? {}),[job.productId]:{completedIds,completedAtMs:job.completesAtMs}};
        const complete = completedIds.length === definition.components.length;
        if (complete) state.productInventory[job.productId] = {count:1,firstCompletedAtMs:job.completesAtMs,lastCompletedAtMs:job.completesAtMs};
        state.activeAssembly = null;
        const discoveryId = complete ? definition.discoveryId : null;
        const alreadyKnown = discoveryId && GameStateManager.hasDiscovery(discoveryId);
        const granted = discoveryId && !alreadyKnown ? GameStateManager.addDiscovery(discoveryId) : false;
        const achievementGranted = complete && job.productId === 'FattyAcidSynthase' &&
            !gameState.registry.achievements.megasynthase;
        if (achievementGranted) gameState.registry.achievements.megasynthase = {
            title:'Megasynthase', sourceProductId:job.productId, unlockedAtMs:job.completesAtMs
        };
        if ((discoveryId && !alreadyKnown && !granted) || !SaveManager.save({reason:complete?'polymerizer-assembly-completed':'polymerizer-component-completed'})) {
            if (oldComponents === undefined) delete state.componentAssemblies;
            else state.componentAssemblies=oldComponents;
            state.productInventory=oldInventory;
            state.activeAssembly=job;
            if (granted) GameStateManager.removeDiscovery(discoveryId);
            if (achievementGranted) delete gameState.registry.achievements.megasynthase;
            return {success:false,reason:'save-failed'};
        }
        PolymerizerManager.lastCompletionAttempt = null;
        PolymerizerManager.notifyStateChange(complete?'assembly-completed':'component-completed');
        if (complete) GameStateObserver.notify('polymerizer-product-completed',{
            productId:job.productId,quantity:1,discoveryId,discoveryGranted:Boolean(granted),completedAtMs:job.completesAtMs});
        return {success:true,reason:complete?'assembly-completed':'component-completed',productId:job.productId,
            quantity:complete?1:0,completedIds,saved:true};
    }
};
export default PolymerizerComponentManager;
