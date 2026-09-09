// Fixed tier membership keeps award requirements stable as future recipes are added.
// Existing Molecule Lab synthesis history counts; repeated copies do not.
const tiers = [
    {
        tier: 0,
        xp: 500,
        ids: [
            "Glycerol",
            "Ethanolamine",
            "Choline",
            "Inositol"
        ]
    },
    {
        tier: 1,
        xp: 750,
        ids: [
            "PropionicAcid",
            "ButyricAcid",
            "CaprylicAcid",
            "CapricAcid",
            "LauricAcid",
            "MyristicAcid",
            "PalmiticAcid",
            "StearicAcid"
        ]
    },
    {
        tier: 2,
        xp: 1000,
        ids: [
            "OleicAcid",
            "EA"
        ]
    },
    {
        tier: 3,
        xp: 1250,
        ids: [
            "LA",
            "AA",
            "EPA",
            "DHA"
        ]
    },
    {
        tier: 4,
        xp: 1500,
        ids: [
            "Ergosterol",
            "Sitosterol"
        ]
    }
];

const LipidQuestCatalog = Object.fromEntries(
    tiers.map((tierDefinition, index) => {
        const award = index + 1;
        const id = `lipid_award_${award}`;

        return [id, {
            id,
            title: `Lipid Award ${award}`,
            category: "lipids",
            releaseState: "playable",
            description:
                `Synthesize each of the ${tierDefinition.ids.length} tier ${tierDefinition.tier} ` +
                `lipid components in Molecule Lab. Earlier syntheses count. ` +
                `Claim ${tierDefinition.xp} XP and +5 maximum ATP; current ATP is not refilled.`,
            prerequisites: [
                index === 0
                    ? "unlock_molecule_lab"
                    : `lipid_award_${index}`
            ],
            objectives: [{
                type: "molecule-synthesis-set",
                label:
                    `Tier ${tierDefinition.tier} lipid components synthesized`,
                moleculeIds: tierDefinition.ids,
                target: tierDefinition.ids.length
            }],
            rewards: {
                xp: tierDefinition.xp,
                atpCapacity: 5,
                zoneUnlocks: [],
                collectorUnlocks: []
            }
        }];
    })
);

export { LipidQuestCatalog };