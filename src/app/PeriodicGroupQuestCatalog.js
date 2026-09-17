// --------------------------------------------------
// PeriodicGroupQuestCatalog.js
// Independent quests for the eight main-group element families.
//
// Groups 3A–8A are also IUPAC Groups 13–18. The fixed symbol lists keep
// these awards scientifically stable even if isotope data is expanded.
// Hydrogen is not an alkali metal, and hypothetical elements 119–120 are
// intentionally excluded from the standard periodic-table families.
// --------------------------------------------------

const FAMILY_DEFINITIONS = Object.freeze([
    Object.freeze({
        id: "alkali_metals",
        title: "Alkali Metals",
        groupLabel: "Group 1",
        elementIds: Object.freeze(["Li", "Na", "K", "Rb", "Cs", "Fr"])
    }),
    Object.freeze({
        id: "alkaline_earth_metals",
        title: "Alkaline Earth Metals",
        groupLabel: "Group 2",
        elementIds: Object.freeze(["Be", "Mg", "Ca", "Sr", "Ba", "Ra"])
    }),
    Object.freeze({
        id: "boron_group",
        title: "Boron Group",
        groupLabel: "Group 3A / IUPAC Group 13",
        elementIds: Object.freeze(["B", "Al", "Ga", "In", "Tl", "Nh"])
    }),
    Object.freeze({
        id: "carbon_group",
        title: "Carbon Group",
        groupLabel: "Group 4A / IUPAC Group 14",
        elementIds: Object.freeze(["C", "Si", "Ge", "Sn", "Pb", "Fl"])
    }),
    Object.freeze({
        id: "nitrogen_group",
        title: "Nitrogen Group",
        groupLabel: "Group 5A / IUPAC Group 15",
        elementIds: Object.freeze(["N", "P", "As", "Sb", "Bi", "Mc"])
    }),
    Object.freeze({
        id: "oxygen_group",
        title: "Oxygen Group",
        groupLabel: "Group 6A / IUPAC Group 16",
        elementIds: Object.freeze(["O", "S", "Se", "Te", "Po", "Lv"])
    }),
    Object.freeze({
        id: "halogens",
        title: "Halogens",
        groupLabel: "Group 7A / IUPAC Group 17",
        elementIds: Object.freeze(["F", "Cl", "Br", "I", "At", "Ts"])
    }),
    Object.freeze({
        id: "noble_gases",
        title: "Noble Gases",
        groupLabel: "Group 8A / IUPAC Group 18",
        elementIds: Object.freeze(["He", "Ne", "Ar", "Kr", "Xe", "Rn", "Og"])
    })
]);

const PeriodicGroupQuestCatalog = Object.freeze(
    Object.fromEntries(
        FAMILY_DEFINITIONS.map(family => {
            const questId =
                `periodic_group_${family.id}`;

            return [questId, Object.freeze({
                id: questId,
                title: family.title,
                category: "atomizer",
                releaseState: "playable",
                description:
                    `Synthesize every supported ${family.title.toLowerCase()} element in ${family.groupLabel}: ${family.elementIds.join(", ")}. Earlier syntheses count.`,
                prerequisites: ["q1_particles"],
                objectives: [Object.freeze({
                    type: "atom-synthesis-set",
                    label:
                        `${family.title} synthesized`,
                    atomIds: family.elementIds,
                    target:
                        family.elementIds.length
                })],
                rewards: Object.freeze({
                    sp: 1,
                    zoneUnlocks: Object.freeze([]),
                    collectorUnlocks: Object.freeze([])
                })
            })];
        })
    )
);

export {
    FAMILY_DEFINITIONS,
    PeriodicGroupQuestCatalog
};
