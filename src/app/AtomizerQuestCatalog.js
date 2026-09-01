const AtomizerQuestCatalog = {};

for (let i = 1; i <= 24; i++) {
    const targetAtoms = i * 5; 
    const questId = `a${i}_elements`;
    
    // The first quest requires the base particle quest. 
    // Subsequent quests require the previous milestone.
    const prereqId = i === 1 ? "q1_particles" : `a${i - 1}_elements`;

    AtomizerQuestCatalog[questId] = {
        id: questId,
        title: `${targetAtoms} Elements`,
        category: "atomizer",
        releaseState: "playable",
        description: `Synthesize ${targetAtoms} unique elements in the Atom Lab to earn a Skill Point.`,
        prerequisites: [prereqId],
        objectives: [
            {
                type: "atom-discovery-count",
                label: "Elements Synthesized",
                target: targetAtoms
            }
        ],
        rewards: {
            xp: 50, // You can dynamically scale this, e.g., xp: i * 50
            sp: 1,
            zoneUnlocks: [],
            collectorUnlocks: []
        }
    };
}

export { AtomizerQuestCatalog };