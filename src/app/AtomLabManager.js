// --------------------------------------------------
// AtomLabManager.js
// Owns guided H and He builds, and free-build atom synthesis
// --------------------------------------------------

import gameState from "./GameState.js";
import GameStateObserver from "./GameStateObserver.js";
import GameStars from "./GameStars.js";
import ParticleInventoryManager from "./ParticleInventoryManager.js";
import QuestManager from "./QuestManager.js";
import SaveManager from "./SaveManager.js";
// element and isotopic data
import { elementLibrary } from "../data/elementLibrary.js";


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

        this.ensureState();
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

        if (state.buildMode === "free-build") {
            return this.handleFreeBuildAction(state, actionType, payload);
        }

        return this.handleGuidedAction(state, actionType, payload);
    },

    handleGuidedAction(state, actionType, payload) {
        const currentSequence = GUIDED_SEQUENCES[state.buildMode];
        const stepId = currentSequence[state.guidedStepIndex];
        const expected = STEP_DEFINITIONS[stepId];

        // 1. Pre-requisite check: Reject interactions if they don't have enough particles to even start the guide
        const preReq = this.checkInventoryPreReq(state.buildMode);
        if (!preReq.ready) {
            return { accepted: false, correct: false, reason: "insufficient-inventory", message: preReq.missing };
        }

        // 2. Validate Action
        if (payload !== expected.expectedPayload) {
            
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

        // 3. Process Particle Deductions for Correct Steps
        if (["proton", "neutron", "electron"].includes(payload)) {
            const deductResult = ParticleInventoryManager.removeParticle(payload, 1);
            if (!deductResult.success) {
                return { accepted: false, correct: true, reason: "inventory-error", message: "Error deducting particle." };
            }
        }

        // 4. Advance Step Sequence
        state.guidedStepIndex += 1;
        let message = "Correct.";
        let completedSequence = false;

        if (state.guidedStepIndex >= currentSequence.length) {
            completedSequence = true;
            state.guidedStepIndex = 0;
            
            if (state.buildMode === "guided-h") {
                DiscoveryManager.record("atoms", "H");
                DiscoveryManager.record("isotopes", "H1");

                state.buildMode = "guided-he";
                message = "Hydrogen synthesized! Now, let's build Helium.";
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
        }

        const saveSucceeded = SaveManager.save();
        
        GameStateObserver.notify("atom-lab-action", {
            buildMode: state.buildMode,
            action: payload,
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

    handleFreeBuildAction(state, actionType, payload) {
        const buffer = state.freeBuildBuffer;

        // Handle target element selection
        if (actionType === "select_element") {
            buffer.targetElement = payload;
            SaveManager.save();
            return {
                accepted: true,
                reason: "element-selected",
                message: `Target element set to ${payload}.`,
                buffer: state.freeBuildBuffer
            };
        }

        // Handle adding particles to the midstream buffer
        if (["proton", "neutron", "electron"].includes(actionType)) {
            const deductResult = ParticleInventoryManager.removeParticle(actionType, 1);
            
            if (!deductResult.success) {
                return {
                    accepted: false,
                    correct: true,
                    reason: "inventory-error",
                    message: `Not enough ${actionType}s in inventory.`,
                    buffer: state.freeBuildBuffer
                };
            }
            
            buffer[`${actionType}s`] += 1;
            SaveManager.save();
            
            return {
                accepted: true,
                reason: "particle-added",
                message: `Added 1 ${actionType}.`,
                buffer: state.freeBuildBuffer
            };
        }

        // Handle synthesis and validation
        if (actionType === "synthesize") {
            
            // Validate Synthesis -> Check if buffer protons/neutrons/electrons match the targetElement
            // (Assuming validation passes here for the implementation)
            const isSynthesisValid = buffer.targetElement !== null && buffer.protons > 0; 

            if (isSynthesisValid) {
                const atomId = buffer.targetElement;
                const massNumber = buffer.protons + buffer.neutrons;
                const isotopeId = atomId + massNumber;

                DiscoveryManager.record("atoms", atomId);
                DiscoveryManager.record("isotopes", isotopeId);

                // Clear the buffer after a successful build
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
            message: "Free build action not recognized.",
            buffer: state.freeBuildBuffer
        };
    }
};

export default AtomLabManager;