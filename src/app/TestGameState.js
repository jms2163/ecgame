const testGameState = {
    player: {
        id: 6283439,
        name: "TEST STUDENT",

        level: 12,
        xp: 148374,

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
        }
    },

    settings: {
        volume: 1,
        difficulty: "normal"
    },

    saveVersion: "1.0"
};

export default testGameState;
