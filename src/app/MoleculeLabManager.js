// --------------------------------------------------
// MoleculeLabManager.js
// Domain authority for Molecule Lab progression,
// atom spending, assembly state, and timed synthesis.
// Contains no DOM or Three.js behavior.
// --------------------------------------------------

import DiscoveryManager from "./DiscoveryManager.js";
import GameStateManager from "./GameStateManager.js";
import GameStateObserver from "./GameStateObserver.js";
import SaveManager from "./SaveManager.js";
import MoleculeRecipeCatalog
    from "../data/MoleculeRecipeCatalog.js";

const ZONE_ID = "moleculeLab";
const FIRST_MILESTONE_ID = "H2";
const PROGRESS_EVENT_INTERVAL_MS = 100;

function safeInteger(value) {
    return Number.isFinite(value)
        ? Math.max(0, Math.floor(value))
        : 0;
}

function cloneRecord(record) {
    return record ? structuredClone(record) : null;
}

const MoleculeLabManager = {
    initialized: false,
    active: false,
    subscribed: false,
    lastProgressEventAtMs: 0,

    initialize() {
        this.ensureState();
        this.subscribe();
        this.reconcileSynthesis();
        this.initialized = true;
        console.log("[MoleculeLabManager] Initialized with persistent state.");
        return true;
    },

    activate() {
        if (!this.initialized) this.initialize();
        this.active = true;
        this.ensureState();
        this.reconcileSynthesis();
        this.notifyStateChange("activated");
        return true;
    },

    deactivate() {
        this.active = false;
        return true;
    },

    ensureState() {
        const state = GameStateManager.getZoneState(ZONE_ID);
        if (!state) {
            throw new Error("MoleculeLabManager: moleculeLab zone state is missing");
        }

        state.activeCategory ??= "molecules";
        state.selectedMoleculeId ??= FIRST_MILESTONE_ID;
        state.assemblies ??= {};
        state.activeSynthesis ??= null;
        state.synthesized ??= {};
        state.investigated ??= {};

        if (!MoleculeRecipeCatalog.categories.some(
            category => category.id === state.activeCategory
        )) {
            state.activeCategory = "molecules";
        }

        if (!MoleculeRecipeCatalog.has(state.selectedMoleculeId)) {
            state.selectedMoleculeId = FIRST_MILESTONE_ID;
        }

        Object.entries(state.assemblies).forEach(([moleculeId, assembly]) => {
            if (!assembly || typeof assembly !== "object") {
                delete state.assemblies[moleculeId];
                return;
            }
            assembly.placedSlots = [...new Set(
                (assembly.placedSlots ?? []).filter(Number.isInteger)
            )].sort((a, b) => a - b);
            assembly.startedAtMs ??= Date.now();
            assembly.readyAtMs ??= null;
        });

        return state;
    },

    getAtomInventory() {
        const atoms = GameStateManager.getZoneState("atomizer")?.atoms ?? {};
        return Object.fromEntries(Object.entries(atoms).map(
            ([symbol, record]) => [symbol, {
                count: safeInteger(record?.count),
                rawCount: Number(record?.count) || 0,
                cap: Number(record?.cap) || 0,
                unlocked: Boolean(record?.unlocked)
            }]
        ));
    },

    getAtomCount(symbol) {
        return this.getAtomInventory()[symbol]?.count ?? 0;
    },

    hasMoleculeDiscovery(moleculeId) {
        return GameStateManager.hasDiscoveryInCategory(
            "molecules",
            moleculeId
        );
    },

    getAssembly(moleculeId) {
        const assembly = this.ensureState().assemblies[moleculeId];
        return assembly ? cloneRecord(assembly) : {
            placedSlots: [],
            startedAtMs: null,
            readyAtMs: null
        };
    },

    getMissingParentIds(definition) {
        return definition.parents.filter(
            parentId => !this.hasMoleculeDiscovery(parentId)
        );
    },

    getMissingDiscoveryIds(definition) {
        return definition.requiredDiscoveries.filter(
            discoveryId => !GameStateManager.hasDiscoveryInCategory(
                "atoms",
                discoveryId
            )
        );
    },

    getMissingAtomCounts(definition, assembly) {
        const placedBySymbol = {};
        assembly.placedSlots.forEach(slotIndex => {
            const symbol = definition.atoms[slotIndex]?.type;
            if (symbol) {
                placedBySymbol[symbol] = (placedBySymbol[symbol] ?? 0) + 1;
            }
        });

        return Object.fromEntries(Object.entries(definition.formula)
            .map(([symbol, required]) => {
                const stillRequired = Math.max(
                    0,
                    required - (placedBySymbol[symbol] ?? 0)
                );
                return [symbol, Math.max(
                    0,
                    stillRequired - this.getAtomCount(symbol)
                )];
            })
            .filter(([, missing]) => missing > 0));
    },

    getNodeStatus(moleculeId) {
        const definition = MoleculeRecipeCatalog.get(moleculeId);
        if (!definition) return null;

        const state = this.ensureState();
        const assembly = this.getAssembly(moleculeId);
        const activeSynthesis = state.activeSynthesis;
        const missingParents = this.getMissingParentIds(definition);
        const missingDiscoveries = this.getMissingDiscoveryIds(definition);
        const missingAtoms = this.getMissingAtomCounts(definition, assembly);
        let phase = "available";
        let message = "Select this molecule to begin assembly.";

        if (this.hasMoleculeDiscovery(moleculeId)) {
            phase = "complete";
            message = "Synthesis complete. Select to inspect the molecule.";
        } else if (activeSynthesis?.moleculeId === moleculeId) {
            phase = "synthesizing";
            message = "Timed synthesis is in progress.";
        } else if (!definition.implemented) {
            phase = "locked";
            message = "This recipe is planned but not implemented yet.";
        } else if (missingParents.length > 0) {
            phase = "locked";
            message = `Requires synthesis of: ${missingParents.join(", ")}.`;
        } else if (missingDiscoveries.length > 0) {
            phase = "locked";
            message = `Requires atom discoveries: ${missingDiscoveries.join(", ")}.`;
        } else if (assembly.readyAtMs) {
            phase = "ready";
            message = "Assembly complete. Ready to begin timed synthesis.";
        } else if (assembly.placedSlots.length > 0) {
            phase = "assembling";
            message = "Assembly in progress.";
        }

        return {
            id: moleculeId,
            phase,
            message,
            definition,
            assembly,
            missingParents,
            missingDiscoveries,
            missingAtoms,
            canAffordRemaining: Object.keys(missingAtoms).length === 0,
            synthesis: activeSynthesis?.moleculeId === moleculeId
                ? this.getActiveSynthesisProgress()
                : null
        };
    },

    getCategoryStatus(categoryId) {
        const requirements = MoleculeRecipeCatalog
            .getCategoryRequirements(categoryId);
        const missing = requirements.filter(
            moleculeId => !this.hasMoleculeDiscovery(moleculeId)
        );
        return { id: categoryId, unlocked: missing.length === 0, missing };
    },

    getActiveSynthesisProgress(nowMs = Date.now()) {
        const job = this.ensureState().activeSynthesis;
        if (!job) return null;
        const durationMs = Math.max(1, job.durationMs);
        const elapsedMs = Math.max(
            0,
            Math.min(durationMs, nowMs - job.startedAtMs)
        );
        return {
            ...cloneRecord(job),
            elapsedMs,
            remainingMs: Math.max(0, durationMs - elapsedMs),
            progress: elapsedMs / durationMs,
            complete: elapsedMs >= durationMs
        };
    },

    getStatus() {
        const state = this.ensureState();
        const categories = MoleculeRecipeCatalog.categories.map(category => ({
            ...category,
            ...this.getCategoryStatus(category.id)
        }));
        const nodes = MoleculeRecipeCatalog.getAll().map(
            definition => this.getNodeStatus(definition.id)
        );
        const synthesizedCount = Object.values(state.synthesized).reduce(
            (total, record) => total + safeInteger(record?.count),
            0
        );

        return {
            active: this.active,
            activeCategory: state.activeCategory,
            selectedMoleculeId: state.selectedMoleculeId,
            selectedNode: this.getNodeStatus(state.selectedMoleculeId),
            categories,
            nodes,
            atomInventory: this.getAtomInventory(),
            synthesizedCount,
            discoveredCount: nodes.filter(node => node.phase === "complete").length,
            totalMoleculesCount: nodes.filter(node =>
                node.definition.type !== "link" && node.definition.implemented
            ).length,
            investigatedCount: Object.keys(state.investigated).length,
            activeSynthesis: this.getActiveSynthesisProgress()
        };
    },

    setActiveCategory(categoryId) {
        const category = MoleculeRecipeCatalog.categories.find(
            candidate => candidate.id === categoryId
        );
        const categoryStatus = this.getCategoryStatus(categoryId);
        if (!category || !categoryStatus.unlocked) {
            return {
                success: false,
                reason: "category-locked",
                missing: categoryStatus.missing
            };
        }

        const state = this.ensureState();
        state.activeCategory = categoryId;
        const firstNode = MoleculeRecipeCatalog.getByCategory(categoryId)[0];
        if (firstNode) state.selectedMoleculeId = firstNode.id;
        SaveManager.save();
        this.notifyStateChange("category-changed");
        return { success: true, categoryId };
    },

    selectMolecule(moleculeId) {
        const node = this.getNodeStatus(moleculeId);
        if (!node) return { success: false, reason: "unknown-molecule" };
        if (node.definition.type === "link") {
            return this.setActiveCategory(node.definition.targetTab);
        }
        if (node.phase === "locked") {
            return {
                success: false,
                reason: "molecule-locked",
                message: node.message
            };
        }

        this.ensureState().selectedMoleculeId = moleculeId;
        SaveManager.save();
        this.notifyStateChange("selection-changed");
        return { success: true, moleculeId, node: this.getNodeStatus(moleculeId) };
    },

    consumeAtom(symbol, amount = 1) {
        const atom = GameStateManager
            .getZoneState("atomizer")?.atoms?.[symbol];
        const safeAmount = safeInteger(amount);
        if (!atom || safeAmount < 1 ||
            (Number(atom.count) || 0) + Number.EPSILON < safeAmount) {
            return false;
        }

        atom.count = Math.max(0, atom.count - safeAmount);
        GameStateObserver.notify("atom-inventory-changed", {
            source: ZONE_ID,
            symbol,
            count: atom.count
        });
        return true;
    },

    placeAtom(moleculeId, slotIndex) {
        const node = this.getNodeStatus(moleculeId);
        if (!node || !["available", "assembling"].includes(node.phase)) {
            return {
                success: false,
                reason: "assembly-unavailable",
                message: node?.message ?? "Assembly is unavailable."
            };
        }

        const atomDefinition = node.definition.atoms[slotIndex];
        if (!atomDefinition) return { success: false, reason: "invalid-slot" };

        const state = this.ensureState();
        state.assemblies[moleculeId] ??= {
            placedSlots: [],
            startedAtMs: Date.now(),
            readyAtMs: null
        };
        const assembly = state.assemblies[moleculeId];

        if (assembly.placedSlots.includes(slotIndex)) {
            return {
                success: true,
                duplicate: true,
                complete: Boolean(assembly.readyAtMs)
            };
        }

        if (!this.consumeAtom(atomDefinition.type, 1)) {
            return {
                success: false,
                reason: "insufficient-atoms",
                symbol: atomDefinition.type,
                message: `You need another ${atomDefinition.type} atom.`
            };
        }

        assembly.placedSlots.push(slotIndex);
        assembly.placedSlots.sort((a, b) => a - b);
        const complete = assembly.placedSlots.length ===
            node.definition.atoms.length;
        if (complete) assembly.readyAtMs = Date.now();

        SaveManager.save();
        this.notifyStateChange(
            complete ? "assembly-completed" : "atom-placed",
            { moleculeId, slotIndex }
        );
        return {
            success: true,
            complete,
            symbol: atomDefinition.type,
            assembly: cloneRecord(assembly)
        };
    },

    startSynthesis(moleculeId) {
        const state = this.ensureState();
        const node = this.getNodeStatus(moleculeId);
        if (state.activeSynthesis) {
            return {
                success: false,
                reason: "synthesis-already-active",
                message: `Finish ${state.activeSynthesis.moleculeId} first.`
            };
        }
        if (!node || node.phase !== "ready") {
            return { success: false, reason: "assembly-not-ready" };
        }

        const startedAtMs = Date.now();
        const durationMs = node.definition.durationMs;
        state.activeSynthesis = {
            moleculeId,
            startedAtMs,
            durationMs,
            completesAtMs: startedAtMs + durationMs
        };
        SaveManager.save();
        this.notifyStateChange("synthesis-started", { moleculeId });
        return { success: true, synthesis: this.getActiveSynthesisProgress() };
    },

    reconcileSynthesis(nowMs = Date.now()) {
        const progress = this.getActiveSynthesisProgress(nowMs);
        if (!progress) return false;
        if (progress.complete) {
            return this.finishSynthesis(progress.moleculeId, nowMs);
        }

        if (this.active && nowMs - this.lastProgressEventAtMs >=
            PROGRESS_EVENT_INTERVAL_MS) {
            this.lastProgressEventAtMs = nowMs;
            GameStateObserver.notify("molecule-synthesis-progress", progress);
        }
        return false;
    },

    finishSynthesis(moleculeId, completedAtMs = Date.now()) {
        const state = this.ensureState();
        const job = state.activeSynthesis;
        if (!job || job.moleculeId !== moleculeId) return false;

        state.activeSynthesis = null;
        delete state.assemblies[moleculeId];
        const previous = state.synthesized[moleculeId];
        state.synthesized[moleculeId] = {
            count: safeInteger(previous?.count) + 1,
            firstCompletedAtMs: previous?.firstCompletedAtMs ?? completedAtMs,
            lastCompletedAtMs: completedAtMs
        };

        DiscoveryManager.record("molecules", moleculeId);
        if (moleculeId === FIRST_MILESTONE_ID) {
            GameStateManager.setZoneCompleted(ZONE_ID, true);
        }
        SaveManager.save();
        GameStateObserver.notify("molecule-synthesized", {
            moleculeId,
            completedAtMs,
            count: state.synthesized[moleculeId].count
        });
        this.notifyStateChange("synthesis-completed", { moleculeId });
        return true;
    },

    recordInvestigation(moleculeId) {
        if (!MoleculeRecipeCatalog.has(moleculeId)) return false;
        const state = this.ensureState();
        if (state.investigated[moleculeId]) return true;
        state.investigated[moleculeId] = { investigatedAtMs: Date.now() };
        SaveManager.save();
        this.notifyStateChange("molecule-investigated", { moleculeId });
        return true;
    },

    notifyStateChange(reason, detail = {}) {
        GameStateObserver.notify("molecule-lab-state-changed", {
            reason,
            ...detail
        });
    },

    subscribe() {
        if (this.subscribed) return;
        GameStateObserver.on("game-tick", () => {
            this.reconcileSynthesis(Date.now());
        });
        GameStateObserver.on("game-state-loaded", () => {
            this.ensureState();
            this.reconcileSynthesis();
            this.notifyStateChange("state-loaded");
        });
        GameStateObserver.on("atom-inventory-changed", payload => {
            if (payload?.source !== ZONE_ID) {
                this.notifyStateChange("inventory-changed");
            }
        });
        GameStateObserver.on("discovery-made", () => {
            this.notifyStateChange("discovery-changed");
        });
        this.subscribed = true;
    }
};

window.ECGame = window.ECGame || {};
window.ECGame.MoleculeLabManager = MoleculeLabManager;

export default MoleculeLabManager;
