
const gameState = {
    player: {
        id: null,
        name: "",
    },

    registry: {
        inventory: [],
        discoveries: [],
        certifications: [],
        quests: [],
        journal: [],
    },

    zones: {
        pond: {},
        quantum: {},
        atomLab: {},
        atomizer: {},
        molecularizer: {},
        macromolecularizer: {},
        polymerizer: {},
        metabolism: {},
        genetics: {},
    },

    settings: {
        volume: 1,
        difficulty: "normal",
    },

    saveVersion: 1,
};

export default gameState;
