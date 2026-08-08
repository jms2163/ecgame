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
        inventory: [],
        discoveries: [],
        certifications: [],
        quests: [],
        journal: []
    },

    zones: {
        pond: {
            unlocked: true,
            state: {}
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
        },

        test: {
             unlocked: true,
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