// Fixed tier membership keeps award requirements stable as future recipes are added.
// Existing Molecule Lab synthesis history counts; repeated copies do not.
const tiers = [
    { xp: 500, ids: ["G", "A"] },
    { xp: 750, ids: ["V", "L", "I", "S"] },
    { xp: 1000, ids: ["T", "C", "M", "D", "E"] },
    { xp: 1250, ids: ["N", "Q", "K", "R", "H"] },
    { xp: 1500, ids: ["F", "Y", "W"] }
];

const AminoAcidQuestCatalog = Object.fromEntries(
    tiers.map((tier, index) => {
        const award = index + 1;
        const id = `bulking_up_${award}`;

        return [id, {
            id,
            title: `Bulking Up ${award}`,
            category: "proteins",
            releaseState: "playable",
            description:
                `Synthesize each of the ${tier.ids.length} tier ${award} amino acids in Molecule Lab. ` +
                `Earlier syntheses count. Claim ${tier.xp} XP and +5 maximum ATP; current ATP is not refilled.`,
            prerequisites: [
                index === 0
                    ? "unlock_molecule_lab"
                    : `bulking_up_${index}`
            ],
            objectives: [{
                type: "molecule-synthesis-set",
                label: `Tier ${award} amino acid types synthesized`,
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
    })
);

export { AminoAcidQuestCatalog };
