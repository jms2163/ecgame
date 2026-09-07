// Fixed tier membership keeps award requirements stable as future recipes are added.
// Existing Molecule Lab synthesis history counts; repeated copies do not.
const tiers = [
    { xp: 500, ids: ["G3P", "DHAP", "Erythrose", "Erythrulose"] },
    { xp: 750, ids: ["Arabinose", "Xylose", "Lyxose", "Ribulose", "Xylulose", "Deoxyribose", "Ribose"] },
    { xp: 1000, ids: ["Glucose", "Fructose", "Mannose", "Galactose", "Gulose", "Idose", "Talose", "Allose", "Altrose", "Sorbose", "Tagatose", "Psicose"] },
    { xp: 500, ids: ["Glucosamine", "NAcetylglucosamine", "NAcetylmuramicAcid"] }
];

const MonosaccharideQuestCatalog = Object.fromEntries(tiers.map((tier, index) => {
    const award = index + 1;
    const id = `sweet_award_${award}`;
    return [id, {
        id,
        title: `Sweeet Award ${award}`,
        category: "monosaccharides",
        releaseState: "playable",
        description: `Synthesize each of the ${tier.ids.length} tier ${index} sugars in Molecule Lab. Earlier syntheses count. Claim ${tier.xp} XP and +5 maximum ATP; current ATP is not refilled.`,
        prerequisites: [index === 0 ? "unlock_molecule_lab" : `sweet_award_${index}`],
        objectives: [{
            type: "molecule-synthesis-set",
            label: `Tier ${index} sugar types synthesized`,
            moleculeIds: tier.ids,
            target: tier.ids.length
        }],
        rewards: {
            xp: tier.xp,
            atpCapacity: 5,
            zoneUnlocks: [],
            collectorUnlocks: []
        }
    }];
}));

export { MonosaccharideQuestCatalog };
