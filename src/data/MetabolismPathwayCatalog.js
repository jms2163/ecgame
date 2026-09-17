// --------------------------------------------------
// MetabolismPathwayCatalog.js
// Read-only, data-driven definitions for metabolism pathways.
//
// Milestone 1 intentionally describes the complete Glycolysis contract
// without implementing placement, completion, or ATP production. Keeping
// these facts in one catalog lets later milestones build the map and rules
// without embedding biological content in the UI.
// --------------------------------------------------

const GLYCOLYSIS = {
    id: "glycolysis",
    name: "Glycolysis",
    category: "Carbohydrate Metabolism",
    description:
        "Arrange the enzymes that convert glucose to pyruvate, then regenerate NAD+ through lactate dehydrogenase.",

    // A completed Polymerizer product unlocks the pathway card. Products
    // are level-like prerequisites and are never consumed by Metabolism.
    unlockRequirement: {
        type: "polymerizer-product",
        productId: "GlucoseTransporter",
        label: "Glucose Transporter",
        minimumCount: 1,
        consumed: false
    },

    coreSlots: [
        {
            slot: 1,
            enzymeId: "Hexokinase",
            label: "Hexokinase",
            abbreviation: "HK"
        },
        {
            slot: 2,
            enzymeId: "PhosphoglucoseIsomerase",
            label: "Phosphoglucose Isomerase",
            abbreviation: "PGI"
        },
        {
            slot: 3,
            enzymeId: "Phosphofructokinase",
            label: "Phosphofructokinase-1",
            abbreviation: "PFK-1"
        },
        {
            slot: 4,
            enzymeId: "Aldolase",
            label: "Aldolase",
            abbreviation: "ALDO"
        },
        {
            slot: 5,
            enzymeId: "TriosePhosphateIsomerase",
            label: "Triose Phosphate Isomerase",
            abbreviation: "TPI"
        },
        {
            slot: 6,
            enzymeId: "Glyceraldehyde3PhosphateDehydrogenase",
            label: "Glyceraldehyde-3-Phosphate Dehydrogenase",
            abbreviation: "GAPDH"
        },
        {
            slot: 7,
            enzymeId: "PhosphoglycerateKinase",
            label: "Phosphoglycerate Kinase",
            abbreviation: "PGK"
        },
        {
            slot: 8,
            enzymeId: "PhosphoglycerateMutase",
            label: "Phosphoglycerate Mutase",
            abbreviation: "PGM"
        },
        {
            slot: 9,
            enzymeId: "Enolase",
            label: "Enolase",
            abbreviation: "ENO"
        },
        {
            slot: 10,
            enzymeId: "PyruvateKinase",
            label: "Pyruvate Kinase",
            abbreviation: "PK"
        }
    ],

    // The first release uses lactate fermentation as its sole route for
    // recycling NADH to NAD+. Alcohol fermentation and TPP are excluded.
    regenerationBranches: [
        {
            id: "lactate",
            name: "Lactate Fermentation",
            slots: [
                {
                    slot: 11,
                    enzymeId: "LactateDehydrogenase",
                    label: "Lactate Dehydrogenase",
                    abbreviation: "LDH"
                }
            ],
            input: "Pyruvate + NADH",
            output: "Lactate + NAD+",
            regenerates: "NAD+"
        }
    ],

    chemistry: {
        inputs: ["Glucose", "2 ADP", "2 Pi", "2 NAD+"],
        outputs: ["2 Pyruvate", "2 ATP", "2 NADH", "2 Water"],
        cofactors: ["Mg2+"],
        atpInvestment: 2,
        atpGross: 4,
        atpNet: 2
    },

    completionRule: {
        requiredCoreSlots: 10,
        requiredRegenerationBranchId: "lactate"
    },

    // This reward is descriptive only in Milestone 1. ATPManager is not
    // connected until a later milestone validates a completed pathway.
    reward: {
        type: "atp-production-rate",
        amountPerMinute: 10,
        increasesCapacity: false,
        active: false
    }
};

function validatePathway(pathway) {

    const slots = [
        ...pathway.coreSlots,
        ...pathway.regenerationBranches.flatMap(
            branch => branch.slots
        )
    ];
    const slotNumbers = slots.map(
        slot => slot.slot
    );
    const enzymeIds = slots.map(
        slot => slot.enzymeId
    );

    return Boolean(
        pathway.id &&
        pathway.unlockRequirement
            ?.type ===
                "polymerizer-product" &&
        pathway.unlockRequirement
            ?.consumed === false &&
        pathway.coreSlots.length === 10 &&
        pathway.regenerationBranches
            .length === 1 &&
        new Set(slotNumbers).size ===
            slotNumbers.length &&
        new Set(enzymeIds).size ===
            enzymeIds.length &&
        pathway.reward
            ?.increasesCapacity === false
    );

}

function deepFreeze(value) {

    if (!value || typeof value !== "object") {
        return value;
    }

    Object.values(value).forEach(
        child => deepFreeze(child)
    );

    return Object.freeze(value);

}

GLYCOLYSIS.valid =
    validatePathway(GLYCOLYSIS);

const PATHWAYS = deepFreeze([
    GLYCOLYSIS
]);

const PATHWAYS_BY_ID = new Map(
    PATHWAYS.map(pathway => [
        pathway.id,
        pathway
    ])
);

const MetabolismPathwayCatalog =
    Object.freeze({

        has(pathwayId) {
            return PATHWAYS_BY_ID.has(
                pathwayId
            );
        },

        get(pathwayId) {

            const pathway =
                PATHWAYS_BY_ID.get(
                    pathwayId
                );

            return pathway
                ? structuredClone(pathway)
                : null;

        },

        getAll() {
            return structuredClone(PATHWAYS);
        }

    });

export default MetabolismPathwayCatalog;
