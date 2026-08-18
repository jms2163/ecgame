// --------------------------------------------------
// GameState.js
// Default persisted state for ECGame
// --------------------------------------------------

import CellSystemDefinitions
    from "./CellSystemDefinitions.js";

const gameState = {

    player: {
        id: null,
        name: "",
        displayName: "",
        level: 1,
        xp: 0,
        currentZone: "pond",
        currentZoom: 0
    },

    // --------------------------------------------------
    // Player cell biological systems
    // --------------------------------------------------
    cellSystems: 
        CellSystemDefinitions.createStartingCellSystems(),
    
    discoveries: {
        organelles: {}, // future refactor
        atoms: {},
        isotopes: {},
        molecules: {}
    },


    registry: {

        resources: {
    atp: {
        current: 50,
        maximum: 50
    },

    particles: {
        capacity: 5,
        proton: 0,
        neutron: 0,
        electron: 0,

        lifetimeCollected: {
            proton: 0,
            neutron: 0,
            electron: 0
        }
    }
},

        inventory: [],

        discoveries: [
            "plasma_membrane",
            "cytoskeleton",
            "glycoproteins"
        ],


        achievements: {},

        research: {
            completedExperiments: {},
            experimentSubmissions: {},
            bestExperimentScores: {},
            stars: {}
        },

        certifications: [],
        quests: {
            q1_particles: {
                status: "in-progress",
                readyAtMs: null,
                claimedAtMs: null,
                viewedAtMs: null,
                activatedAtMs: null,
                objectiveBaselines: {}
            },
            q2_hydrogen: {
                status: "in-progress",
                readyAtMs: null,
                claimedAtMs: null,
                viewedAtMs: null,
                activatedAtMs: null,
                objectiveBaselines: {}
            },
            q7_proton_collector: {
                status: "in-progress",
                readyAtMs: null,
                claimedAtMs: null,
                viewedAtMs: null,
                activatedAtMs: null,
                objectiveBaselines: {}
            },
            q8_neutron_collector: {
                status: "in-progress",
                readyAtMs: null,
                claimedAtMs: null,
                viewedAtMs: null,
                activatedAtMs: null,
                objectiveBaselines: {}
            },
            q9_electron_collector: {
                status: "in-progress",
                readyAtMs: null,
                claimedAtMs: null,
                viewedAtMs: null,
                activatedAtMs: null,
                objectiveBaselines: {}
            }
        },
        journal: []

    },

    // --------------------------------------------------
    // Global zones
    //
    // completed means the zone's current required learning
    // milestone is complete. It does not mean the entire
    // scientific subject can never be revisited.
    // --------------------------------------------------
    zones: {
        features: {
                isotope_mode: false,
                sandbox_mode: false
            },

        pond: {
            unlocked: true,
            completed: false,

            state: {
                player: {
                    x: 0,
                    y: 0,
                    anchored: false
                },

                movement: {
                    atpCost: 10
                },

                worldSeed: null,

                world: {
                    tiles: {}
                }
            }
        },

        quantum: {
            // The old progression exposed the Quantum
            // Field at the beginning of Chemical Life.
            unlocked: true,
            completed: false,

            state: {
                audio: {
                    // Quantum sound is independent from
                    // future global or other-zone audio.
                    enabled: true
                },

                upgrades: {
                    // Each future upgrade level removes
                    // 100 ms from the 1500 ms base delay.
                    particleRespawnLevel: 0
                },

                autoCollectors: {
                    proton: {
                        unlocked: false,
                        enabled: false,
                        collectionIntervalMs:
                            2000
                    },
                    neutron: {
                        unlocked: false,
                        enabled: false,
                        collectionIntervalMs:
                            2000
                    },
                    electron: {
                        unlocked: false,
                        enabled: false,
                        collectionIntervalMs:
                            2000
                    }
                },

                subatomicAssembly: {
                    activityId:
                        "q1_particles",

                    guidedCollected: {
                        proton: 0,
                        neutron: 0,
                        electron: 0
                    },

                    // Generated once at the start of Q1
                    // and persisted so reloads do not
                    // change the current question order.
                    guidedSequence: [],

                    guidanceCompletedAtMs:
                        null,

                    // A wrong particle selection makes
                    // the first guided run ineligible for
                    // its exceptional-work star.
                    incorrectGuidedSelections:
                        0,
                    perfectGuidanceEligible:
                        true
                }
            }
        },

        atomLab: {
            unlocked: false,
            completed: false,
            
            state: {
                // Modes: "guided-h", "guided-he", "free-build"
                buildMode: "guided-h",
                
                // Tracks progress through the current sequence array
                guidedStepIndex: 0,
                
                // Tracked only during the Helium build
                perfectHeEligible: true,
                incorrectHeSelections: 0,
                
                // Retains midstream states for Lithium and beyond
                freeBuildBuffer: {
                    targetElement: null,
                    protons: 0,
                    neutrons: 0,
                    electrons: 0
                }
            }
        },

        // AFTER
atomizer: {
    unlocked: false,
    completed: false,

    state: {
        audio: {
            enabled: true
        },
        globalBoost: 0,
        spAllocated: { H: 0, C: 0, N: 0, O: 0, P: 0, S: 0 },
        lastActiveTimestamp: Date.now(),
        totalDiscoveries: 0,
        atoms: {
            H: { count: 0, cap: 100, progress: 0, unlocked: true,  boost: 0, baseRate: 30.0 },
            C: { count: 0, cap: 100, progress: 0, unlocked: false, boost: 0, baseRate: 270.0 },
            N: { count: 0, cap: 50,  progress: 0, unlocked: false, boost: 0, baseRate: 315.0 },
            O: { count: 0, cap: 50,  progress: 0, unlocked: false, boost: 0, baseRate: 360.0 },
            P: { count: 0, cap: 25,  progress: 0, unlocked: false, boost: 0, baseRate: 690.0 },
            S: { count: 0, cap: 25,  progress: 0, unlocked: false, boost: 0, baseRate: 720.0 }
        }
    }
},

        molecularizer: {
            unlocked: false,
            completed: false,
            state: {}
        },

        macromolecularizer: {
            unlocked: false,
            completed: false,
            state: {}
        },

        polymerizer: {
            unlocked: false,
            completed: false,
            state: {}
        },

        metabolism: {
            unlocked: false,
            completed: false,
            state: {}
        },

        genetics: {
            unlocked: false,
            completed: false,
            state: {}
        }

    },

    settings: {
        volume: 1,
        difficulty: "normal"
    },

    saveVersion: "under-construction"

};

export default gameState;
