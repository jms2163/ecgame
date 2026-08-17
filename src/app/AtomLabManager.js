// --------------------------------------------------
// AtomLabManager.js
// Owns guided H and He builds, and free-build atom synthesis
// --------------------------------------------------

import gameState from "./GameState.js";
import GameStateManager from "./GameStateManager.js";
import GameStateObserver from "./GameStateObserver.js";
import GameStars from "./GameStars.js";
import ParticleInventoryManager from "./ParticleInventoryManager.js";
import QuestManager from "./QuestManager.js";
import SaveManager from "./SaveManager.js";
// element and isotopic data
import { elementLibrary } from "../data/elementLibrary.js";
import DiscoveryManager from "./DiscoveryManager.js";
import AtomCraftUI from "./AtomCraftUI.js";

const ACTIVITY_ID_H = "guided_hydrogen";
const ACTIVITY_ID_HE = "guided_helium";
const STAR_ID_HE = "perfect_helium";

// Define the precise order of operations for the tutorials
const GUIDED_SEQUENCES = Object.freeze({
    "guided-h": [
        "select_h",
        "click_nucleus",
        "add_proton",
        "click_orbit",
        "add_electron",
        "synthesize"
    ],
    "guided-he": [
        "select_he",
        "click_nucleus",
        "add_proton",
        "add_proton",
        "add_neutron",
        "add_neutron",
        "click_orbit",
        "add_electron",
        "add_electron",
        "synthesize"
    ]
});

// Defines minimum inventory required to start each guided build
const GUIDED_COSTS = Object.freeze({
    "guided-h": { proton: 1, neutron: 0, electron: 1 },
    "guided-he": { proton: 2, neutron: 2, electron: 2 }
});

const STEP_DEFINITIONS = Object.freeze({
    "select_h": { expectedPayload: "H", prompt: "Select Hydrogen (H) from the periodic table." },
    "select_he": { expectedPayload: "He", prompt: "Select Helium (He) from the periodic table." },
    "click_nucleus": { expectedPayload: "nucleus", prompt: "Click the center of the atom to target the nucleus." },
    "click_orbit": { expectedPayload: "orbit", prompt: "Click the electron ring to target the orbit." },
    "add_proton": { expectedPayload: "proton", prompt: "Add a proton to the nucleus." },
    "add_neutron": { expectedPayload: "neutron", prompt: "Add a neutron to the nucleus." },
    "add_electron": { expectedPayload: "electron", prompt: "Add an electron to the orbit." },
    "synthesize": { expectedPayload: "synthesize", prompt: "Synthesize the atom!" }
});

const AtomLabManager = {

initialize() {
    ParticleInventoryManager.initialize();
    QuestManager.initialize();
    GameStars.initialize();

    const state = this.ensureState();
    const gsm = window.ECGame?.GameStateManager;

    // Check discovery state to assign correct starting build mode
    if (gsm) {
        if (!gsm.hasDiscovery("H")) {
            state.buildMode = "guided-h";
            state.guidedStepIndex = 0;
        } else if (!gsm.hasDiscovery("He")) {
            state.buildMode = "guided-he";
            state.guidedStepIndex = 0;
        } else if (state.buildMode !== "free-build") {
            state.buildMode = "free-build";
        }
    }

    return true;
},

    ensureState() {
        const atomLab = gameState.zones?.atomLab;

        if (!atomLab) {
            throw new Error("AtomLabManager: Atom Lab zone state is missing");
        }

        atomLab.state ??= {};
        const state = atomLab.state;

        state.buildMode ??= "guided-h";
        state.guidedStepIndex ??= 0;
        
        state.incorrectHeSelections = Number.isInteger(state.incorrectHeSelections) && state.incorrectHeSelections >= 0 ? state.incorrectHeSelections : 0;
        
        if (typeof state.perfectHeEligible !== "boolean") {
            state.perfectHeEligible = state.incorrectHeSelections === 0;
        }

        state.freeBuildBuffer ??= { targetElement: null, protons: 0, neutrons: 0, electrons: 0 };

        return state;
    },

    getStarRecord() {
        return GameStars.getStar(STAR_ID_HE);
    },

    awardPerfectHeStar(awardedAtMs = Date.now()) {
        return GameStars.awardStar(
            STAR_ID_HE,
            {
                awardedAtMs,
                sourceActivityId: ACTIVITY_ID_HE,
                reason: "perfect-guided-helium"
            },
            { save: false }
        );
    },

    // Validates if the player has enough particles to begin a specific guided sequence
    checkInventoryPreReq(mode) {
        const costs = GUIDED_COSTS[mode];
        if (!costs) return { ready: true }; // Free build mode handles inventory actively

        const inventory = ParticleInventoryManager.getStatus();
        
        const hasEnough = 
            inventory.proton >= costs.proton &&
            inventory.neutron >= costs.neutron &&
            inventory.electron >= costs.electron;

        return {
            ready: hasEnough,
            missing: hasEnough ? null : "Insufficient particles. Return to the Quantum Zone to harvest more."
        };
    },

    getStatus() {
        const state = this.ensureState();
        
        let nextPrompt = null;
        if (state.buildMode !== "free-build") {
            const currentSequence = GUIDED_SEQUENCES[state.buildMode];
            const stepId = currentSequence[state.guidedStepIndex];
            nextPrompt = STEP_DEFINITIONS[stepId]?.prompt;
        }

        return {
            mode: state.buildMode,
            guidedStepIndex: state.guidedStepIndex,
            inventoryCheck: this.checkInventoryPreReq(state.buildMode),
            perfectHeStatus: {
                eligible: state.perfectHeEligible,
                mistakes: state.incorrectHeSelections,
                starEarned: Boolean(this.getStarRecord())
            },
            freeBuildBuffer: { ...state.freeBuildBuffer },
            inventory: ParticleInventoryManager.getStatus(),
            nextPrompt: nextPrompt
        };
    },

    // Main entry point from the UI for any action (clicking elements, adding particles, synthesizing)
processAction(actionType, payload) {
    const state = this.ensureState();

    let result;
    if (state.buildMode !== "free-build") {
        result = this.handleGuidedAction(state, actionType, payload);
    } else {
        result = this.handleFreeBuildAction(state, actionType, payload);
    }

    // Directly trigger top-level imported UI re-render
    if (typeof AtomCraftUI !== "undefined" && AtomCraftUI.render) {
        AtomCraftUI.render();
    }

    return result;
},

handleGuidedAction(state, actionType, payload) {
    const currentSequence = GUIDED_SEQUENCES[state.buildMode];
    const stepId = currentSequence[state.guidedStepIndex];
    const expected = STEP_DEFINITIONS[stepId];

    // Safety fallback for payload extraction
    const effectivePayload = payload || (actionType.startsWith("add_") ? actionType.replace("add_", "") : actionType);

    // Normalize particle keys (guided steps use singular 'proton', freeBuildBuffer uses plural 'protons')
    const particleMap = {
        proton: "protons",
        neutron: "neutrons",
        electron: "electrons",
        protons: "protons",
        neutrons: "neutrons",
        electrons: "electrons"
    };

    // 1. Pre-requisite check
    const preReq = this.checkInventoryPreReq(state.buildMode);
    if (!preReq.ready) {
        return { accepted: false, correct: false, reason: "insufficient-inventory", message: preReq.missing };
    }

    // 2. Validate Action against expected step
    if (effectivePayload !== expected.expectedPayload) {
        if (state.buildMode === "guided-he") {
            state.incorrectHeSelections += 1;
            state.perfectHeEligible = false;
        }

        SaveManager.save();
        return {
            accepted: true,
            correct: false,
            reason: "incorrect-step",
            message: expected.prompt 
        };
    }

    // 3. Process Particle Deductions & Workspace Updates
    if (actionType === "select_element" || stepId.startsWith("select_")) {
        this.selectElement(effectivePayload);
    }

    // Helper to evaluate removal success regardless of return signature
const isSuccess = (res) => {
    if (res === true) return true;
    if (typeof res === "object" && res !== null) {
        if (res.success === true) return true;
        if (typeof res.removed === "number" && res.removed > 0) return true;
    }
    return false;
};

    if (["proton", "neutron", "electron", "protons", "neutrons", "electrons"].includes(effectivePayload)) {
    // Attempt removal using singular key first, then plural
    let deductResult = ParticleInventoryManager.removeParticle(effectivePayload, 1);
    if (!isSuccess(deductResult)) {
        const altKey = particleMap[effectivePayload];
        deductResult = ParticleInventoryManager.removeParticle(altKey, 1);
    }

    if (!isSuccess(deductResult)) {
        return { accepted: false, correct: true, reason: "inventory-error", message: "Error deducting particle." };
    }
    
    // Ensure freeBuildBuffer exists with correct plural keys
    state.freeBuildBuffer = state.freeBuildBuffer || { protons: 0, neutrons: 0, electrons: 0 };
    const pluralKey = particleMap[effectivePayload] || "protons";
    state.freeBuildBuffer[pluralKey] = (state.freeBuildBuffer[pluralKey] || 0) + 1;
}

    // 4. Advance Step Sequence
    state.guidedStepIndex += 1;
    let completedSequence = false;
    let message = "";

    if (state.guidedStepIndex >= currentSequence.length) {
        completedSequence = true;
        state.guidedStepIndex = 0;
        
        // Clear workspace build buffer upon completion
        state.freeBuildBuffer = { targetElement: null, protons: 0, neutrons: 0, electrons: 0 };

        if (state.buildMode === "guided-h") {
            DiscoveryManager.record("atoms", "H");
            DiscoveryManager.record("isotopes", "H1");

            state.buildMode = "guided-he";
            message = "Hydrogen synthesized! Select Helium (He) from the periodic table.";
            QuestManager.markQuestClaimable(ACTIVITY_ID_H, Date.now());
        } 
        else if (state.buildMode === "guided-he") {
            DiscoveryManager.record("atoms", "He");
            DiscoveryManager.record("isotopes", "He4");

            state.buildMode = "free-build";
            message = "Helium synthesized! Free build mode unlocked.";
            QuestManager.markQuestClaimable(ACTIVITY_ID_HE, Date.now());
            
            if (state.perfectHeEligible) {
                this.awardPerfectHeStar();
                message += " Perfect execution! You earned a star.";
            }
        }
    } else {
        // LOOKUP THE PROMPT FOR THE NEWLY ADVANCED STEP
        const nextStepId = currentSequence[state.guidedStepIndex];
        const nextStep = STEP_DEFINITIONS[nextStepId];
        message = nextStep ? nextStep.prompt : "Proceed to the next step.";
    }

    const saveSucceeded = SaveManager.save();
    
    GameStateObserver.notify("atom-lab-action", {
        buildMode: state.buildMode,
        action: effectivePayload,
        completedSequence,
        saveSucceeded
    });

    return {
        accepted: true,
        correct: true,
        reason: "step-complete",
        message,
        saveSucceeded,
        status: this.getStatus()
    };
},

    // #TODO added this function to screen routing when an element is pressed.
   selectElement(symbol) {
    const state = this.ensureState();

    const isotopes = this.getIsotopesForElement(symbol);
    if (!isotopes.length) {
        return { accepted: false, message: `Unknown element symbol: ${symbol}` };
    }

    const isDiscovered = GameStateManager?.hasDiscovery(symbol);
    const isotopeModeUnlocked = Boolean(GameStateManager?.hasDiscovery("isotope_mode"));
    const representative = this.getRepresentativeIsotope(symbol);

    state.selectedElement = symbol;
    state.activeTargetIsotope = representative.id;
    state.availableIsotopes = (isotopeModeUnlocked && representative.p >= 6) 
        ? isotopes 
        : [representative];

    return {
        accepted: true,
        message: `Selected ${representative.name} (${symbol}). Isotope Mode: ${isotopeModeUnlocked ? "Active" : "Locked"}.`
    };
},

getIsotopeSynthesisStatus(symbol) {
    const isotopes = this.getIsotopesForElement(symbol);
    if (!isotopes.length) return null;

    const hasDiscovery = (id) => GameStateManager?.hasDiscovery(id);
    const isotopeModeUnlocked = Boolean(hasDiscovery("isotope_mode"));

    const isotopeStatusList = isotopes.map(iso => ({
        id: iso.id,
        name: iso.name,
        symbol: iso.symbol,
        protons: iso.p,
        neutrons: iso.n,
        electrons: iso.e,
        abundance: iso.a,
        isSynthesized: Boolean(hasDiscovery(iso.id))
    }));

    const isFullyComplete = isotopeStatusList.length > 0 && isotopeStatusList.every(iso => iso.isSynthesized);

    return {
        symbol,
        isFullyComplete,
        isotopeModeUnlocked,
        isotopes: isotopeStatusList
    };
},

// Helper: Retrieve all isotope variants for an element symbol (e.g. "C")
getIsotopesForElement(symbol) {
    return Object.entries(elementLibrary)
        .filter(([id, data]) => data.symbol === symbol)
        .map(([id, data]) => ({ id, ...data }));
},

// Helper: Get representative (highest abundance) isotope
getRepresentativeIsotope(symbol) {
    const isotopes = this.getIsotopesForElement(symbol);
    if (!isotopes.length) return null;
    return isotopes.reduce((max, iso) => (iso.a > max.a ? iso : max), isotopes[0]);
},





handleFreeBuildAction(state, actionType, payload) {
    const buffer = state.freeBuildBuffer;

    // 1. View Discovered Element (Dynamic lookup via ElementLibrary & Discoveries)
    if (actionType === "view_element") {
        buffer.targetElement = payload;
        
        // Dynamically populate workspace counts for the discovered isotope
        const counts = GameStateManager.getParticleCountsForElement(payload);
        buffer.protons = counts.protons;
        buffer.neutrons = counts.neutrons;
        buffer.electrons = counts.electrons;

        SaveManager.save();
        
        return {
            accepted: true,
            reason: "element-viewed",
            message: `Viewing structure for ${payload}.`,
            buffer: state.freeBuildBuffer
        };
    }

    // 2. Select Element for New Build (Clears workspace)
    if (["select_element", "set_target_element", "set_target"].includes(actionType)) {
        buffer.targetElement = payload;
        buffer.protons = 0;
        buffer.neutrons = 0;
        buffer.electrons = 0;
        
        SaveManager.save();
        
        return {
            accepted: true,
            reason: "element-selected",
            message: `Target element set to ${payload}.`,
            buffer: state.freeBuildBuffer
        };
    }

    // 3. Particle Addition (Normalizes "add_proton" and "proton")
    const particleType = actionType.replace("add_", "");
    
    if (["proton", "neutron", "electron"].includes(particleType)) {
        const deductResult = ParticleInventoryManager.removeParticle(particleType, 1);
        
        if (!deductResult.success) {
            return {
                accepted: false,
                correct: true,
                reason: "inventory-error",
                message: `Not enough ${particleType}s in inventory.`,
                buffer: state.freeBuildBuffer
            };
        }
        
        buffer[`${particleType}s`] = (buffer[`${particleType}s`] || 0) + 1;
        SaveManager.save();
        
        return {
            accepted: true,
            reason: "particle-added",
            message: `Added 1 ${particleType}.`,
            buffer: state.freeBuildBuffer
        };
    }

    // 4. Workspace Reset
    if (actionType === "reset") {
        buffer.protons = 0;
        buffer.neutrons = 0;
        buffer.electrons = 0;
        buffer.targetElement = null;
        SaveManager.save();

        return {
            accepted: true,
            reason: "reset-complete",
            message: "Workspace cleared.",
            buffer: state.freeBuildBuffer
        };
    }

    // 5. Synthesis Validation
    if (actionType === "synthesize") {
        const isSynthesisValid = buffer.targetElement !== null && buffer.protons > 0; 

        if (isSynthesisValid) {
            const atomId = buffer.targetElement;
            const massNumber = buffer.protons + buffer.neutrons;
            const isotopeId = atomId + massNumber;

            DiscoveryManager.record("atoms", atomId);
            DiscoveryManager.record("isotopes", isotopeId);

            state.freeBuildBuffer = { targetElement: null, protons: 0, neutrons: 0, electrons: 0 };
            const saveSucceeded = SaveManager.save();

            return {
                accepted: true,
                correct: true,
                reason: "synthesis-success",
                message: `Successfully synthesized ${isotopeId}!`,
                saveSucceeded,
                buffer: state.freeBuildBuffer
            };
        } else {
            return {
                accepted: true,
                correct: false,
                reason: "synthesis-failed",
                message: "The current configuration does not form a valid, stable atom.",
                buffer: state.freeBuildBuffer
            };
        }
    }

    return {
        accepted: false,
        reason: "unknown-action",
        message: `Free build action not recognized: ${actionType}.`,
        buffer: state.freeBuildBuffer
    };
}
};

export default AtomLabManager;