const QuestCatalog = {
    "q1_particles": {
        id: "q1_particles",
        title: "Subatomic Assembly",
        category: "main",
        description: "Identify and collect five protons, five neutrons, and five electrons.",

        prerequisites: [],

        objectives: [
            { type: "guided-particle-collection", particleId: "proton",  target: 5 },
            { type: "guided-particle-collection", particleId: "neutron", target: 5 },
            { type: "guided-particle-collection", particleId: "electron", target: 5 }
        ],

        rewards: {
            xp: 50,
            particleCapacity: 2,
            zoneUnlocks: ["atomLab"],
            collectorUnlocks: []
        }
    }
};

export default QuestCatalog;
