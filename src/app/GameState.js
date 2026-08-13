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
        CellSystemDefinitions
            .createStartingCellSystems(),

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
                electron: 0
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
        quests: [],
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
                subatomicAssembly: {
                    activityId:
                        "q1_particles",

                    totalCollected: {
                        proton: 0,
                        neutron: 0,
                        electron: 0
                    },

                    completed: false,
                    completedAtMs: null
                }
            }
        },

        atomLab: {
            unlocked: false,
            completed: false,
            state: {}
        },

        atomizer: {
            unlocked: false,
            completed: false,
            state: {}
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

    saveVersion: "1.3"

};

export default gameState;
