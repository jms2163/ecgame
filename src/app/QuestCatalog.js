// --------------------------------------------------
// QuestCatalog.js
// Plain quest data only
//
// Objective behavior belongs in ObjectiveRegistry.
// Reward behavior belongs in RewardRegistry.
// Quest lifecycle behavior belongs in QuestManager.
// --------------------------------------------------

const QuestCatalog = {

    q1_particles: {
        id: "q1_particles",
        title: "Subatomic Assembly",
        category: "main",
        releaseState: "playable",

        description:
            "Identify and collect five protons, five neutrons, and five electrons in the Quantum Field.",

        prerequisites: [],

        objectives: [
            {
                type:
                    "guided-particle-collection",
                particleId: "proton",
                label: "Protons identified",
                target: 5
            },
            {
                type:
                    "guided-particle-collection",
                particleId: "neutron",
                label: "Neutrons identified",
                target: 5
            },
            {
                type:
                    "guided-particle-collection",
                particleId: "electron",
                label: "Electrons identified",
                target: 5
            }
        ],

        rewards: {
            xp: 50,
            particleCapacity: 2,
            zoneUnlocks: ["atomLab"],
            collectorUnlocks: []
        }
    },

    // Configured now, but not released until the Hydrogen
    // activity is implemented in Atom Lab.
    q2_hydrogen: {
        id: "q2_hydrogen",
        title: "First Light: Hydrogen",
        category: "main",
        releaseState: "configured",

        description:
            "Construct a stable hydrogen atom in the Atom Lab.",

        prerequisites: ["q1_particles"],

        objectives: [
            {
                type: "atom-synthesis",
                atomId: "hydrogen",
                label: "Hydrogen atoms built",
                target: 1
            }
        ],

        rewards: {
            xp: 100,
            particleCapacity: 0,
            zoneUnlocks: [],
            collectorUnlocks: []
        }
    },

    q7_proton_collector: {
        id: "q7_proton_collector",
        title: "Proton Autocollector",
        category: "upgrade",
        releaseState: "playable",

        description:
            "Gather twenty protons after this quest becomes available to calibrate a Proton Autocollector.",

        prerequisites: ["q2_hydrogen"],

        objectives: [
            {
                type:
                    "post-activation-particle-collection",
                particleId: "proton",
                label: "New protons gathered",
                target: 20
            }
        ],

        rewards: {
            xp: 100,
            particleCapacity: 0,
            zoneUnlocks: [],
            collectorUnlocks: ["proton"]
        }
    },

    q8_neutron_collector: {
        id: "q8_neutron_collector",
        title: "Neutron Autocollector",
        category: "upgrade",
        releaseState: "playable",

        description:
            "Gather twenty neutrons after this quest becomes available to calibrate a Neutron Autocollector.",

        prerequisites: ["q2_hydrogen"],

        objectives: [
            {
                type:
                    "post-activation-particle-collection",
                particleId: "neutron",
                label: "New neutrons gathered",
                target: 20
            }
        ],

        rewards: {
            xp: 100,
            particleCapacity: 0,
            zoneUnlocks: [],
            collectorUnlocks: ["neutron"]
        }
    },

    q9_electron_collector: {
        id: "q9_electron_collector",
        title: "Electron Autocollector",
        category: "upgrade",
        releaseState: "playable",

        description:
            "Gather twenty electrons after this quest becomes available to calibrate an Electron Autocollector.",

        prerequisites: ["q2_hydrogen"],

        objectives: [
            {
                type:
                    "post-activation-particle-collection",
                particleId: "electron",
                label: "New electrons gathered",
                target: 20
            }
        ],

        rewards: {
            xp: 100,
            particleCapacity: 0,
            zoneUnlocks: [],
            collectorUnlocks: ["electron"]
        }
    }

};

export default QuestCatalog;
