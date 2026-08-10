const gameState = {

    player: {
        id: null,
        name: "",

        level: 1,
        xp: 0,

        currentZone: "pond",
        currentZoom: 0
    },

  registry: {
    resources: {
        atp: {
            current: 50,
            maximum: 50
        }
    },

    inventory: [],
    discoveries: [],
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