import CellSystemDefinitions from "./CellSystemDefinitions.js";

const gameState = {

    player: {
        id: null,
        name: "",

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

  registry: {

    resources: {
        atp: {
            current: 50,
            maximum: 50
        }
    },

    inventory: [],

    discoveries: [
    "plasma_membrane",
    "cytoskeleton",
    "glycoproteins",
    "H2O" // DEBUG ONLY
],

    // --------------------------------------------------
    // One-time research outcomes
    // --------------------------------------------------
    achievements: {},

    research: {

        // Example future record:
        // water_passive_diffusion: {
        //     completedAtMs: 1780000000000
        // }
        completedExperiments: {}

    },

    certifications: [],
    quests: [],
    journal: []

},

    zones: {

        pond: {
            unlocked: true,

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
            unlocked: false,
            state: {}
        },

        atomLab: {
            unlocked: false,
            state: {}
        },

        atomizer: {
            unlocked: false,
            state: {}
        },

        molecularizer: {
            unlocked: false,
            state: {}
        },

        macromolecularizer: {
            unlocked: false,
            state: {}
        },

        polymerizer: {
            unlocked: false,
            state: {}
        },

        metabolism: {
            unlocked: false,
            state: {}
        },

        genetics: {
            unlocked: false,
            state: {}
        }

    },

    settings: {
        volume: 1,
        difficulty: "normal"
    },

    saveVersion: "1.0"

};

export default gameState;