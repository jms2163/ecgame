// --------------------------------------------------
// MetabolismPathwayCatalog.js
// Read-only, data-driven definitions for metabolism pathways.
//
// Milestone 1 intentionally describes the complete Glycolysis contract
// without implementing placement, completion, or ATP production. Keeping
// these facts in one catalog lets later milestones build the map and rules
// without embedding biological content in the UI.
// --------------------------------------------------

// Eleven distinct enzyme activities are shown once each. Transketolase and
// aldolase act more than once during regeneration; their reactions are
// described in the slot notes without requiring duplicate protein products.
const CALVIN_CYCLE = {
    id: "calvinCycle",
    name: "Calvin Cycle",
    category: "Carbon Fixation",
    themeId: "green",
    releaseState: "development",
    description: "Fix CO2, reduce 3-phosphoglycerate to G3P, and regenerate RuBP in the symbiont chloroplast.",
    unlockRequirements: [],
    coreModule: null,
    coreSlots: [
        { slot: 1, enzymeId: "RuBisCO", label: "RuBisCO", abbreviation: "RuBisCO", teachingNote: "CO2 + RuBP → two 3-phosphoglycerate." },
        { slot: 2, enzymeId: "PhosphoglycerateKinase", label: "Phosphoglycerate Kinase", abbreviation: "PGK", teachingNote: "Uses ATP to make 1,3-bisphosphoglycerate; the reverse of its glycolytic reaction." },
        { slot: 3, enzymeId: "Glyceraldehyde3PhosphateDehydrogenase", label: "Glyceraldehyde-3-Phosphate Dehydrogenase", abbreviation: "GAPDH", teachingNote: "Chloroplast isoform uses NADPH to produce G3P. The existing game protein is a glycolytic structural representative." },
        { slot: 4, enzymeId: "TriosePhosphateIsomerase", label: "Triose Phosphate Isomerase", abbreviation: "TPI", teachingNote: "Interconverts G3P and DHAP." },
        { slot: 5, enzymeId: "Aldolase", label: "Aldolase", abbreviation: "ALDO", teachingNote: "Joins G3P + DHAP to make fructose-1,6-bisphosphate; acts again with erythrose-4-phosphate in regeneration." },
        { slot: 6, enzymeId: "FructoseBisphosphatase", label: "Fructose-1,6-Bisphosphatase", abbreviation: "FBPase" },
        { slot: 7, enzymeId: "Transketolase", label: "Transketolase", abbreviation: "TK", teachingNote: "Transfers two-carbon units twice during RuBP regeneration." },
        { slot: 8, enzymeId: "SedoheptuloseBisphosphatase", label: "Sedoheptulose-1,7-Bisphosphatase", abbreviation: "SBPase" },
        { slot: 9, enzymeId: "Ribose5PhosphateIsomerase", label: "Ribose-5-Phosphate Isomerase", abbreviation: "RPI" },
        { slot: 10, enzymeId: "Ribulose5PhosphateEpimerase", label: "Ribulose-5-Phosphate Epimerase", abbreviation: "RPE" },
        { slot: 11, enzymeId: "Phosphoribulokinase", label: "Phosphoribulokinase", abbreviation: "PRK", teachingNote: "Uses ATP to regenerate RuBP." }
    ],
    regenerationBranches: [],
    chemistry: {
        inputs: ["3 CO2", "9 ATP", "6 NADPH"],
        outputs: ["1 net G3P", "9 ADP", "6 NADP+", "Pi"],
        cofactors: ["Mg2+", "Thiamine pyrophosphate (transketolase)"],
        atpInvestment: 9,
        atpGross: 0,
        atpNet: -9
    },
    completionRule: { requiredCoreSlots: 11, requiredRegenerationBranchId: null },
    reward: {
        implemented: false, type: "not-configured",
        amountPerCorrectCoreEnzyme: 0, maximumAmountPerMinute: 0,
        increasesCapacity: false, activeFromPlacements: false
    }
};

const GLYCOLYSIS = {
    id: "glycolysis",
    name: "Glycolysis",
    category: "Carbohydrate Metabolism",
    themeId: "yellow",
    releaseState: "development",
    description:
        "Arrange the enzymes that convert glucose to pyruvate, then regenerate NAD+ through lactate dehydrogenase.",

    // A completed Polymerizer product unlocks the pathway card. Products
    // are level-like prerequisites and are never consumed by Metabolism.
    unlockRequirements: [
        {
            type: "polymerizer-product",
            productId: "GlucoseTransporter",
            label: "Glucose Transporter",
            minimumCount: 1,
            consumed: false
        }
    ],

    // The early black-box module establishes functional Glycolysis before
    // students reconstruct its ten enzymes individually. NAD+ is required at
    // the GAPDH step and is reduced to NADH; it is not supplied by LDH.
    // NADPlus is assembled in the Macromolecularizer N category from AMP plus
    // Molecule Lab nicotinamide, ribose, and phosphate. All three prerequisites
    // below are permanent products and are not
    // consumed when this black-box module is activated.
    coreModule: {
        id: "glycolysisCore",
        name: "Glycolysis Core",
        implemented: true,
        blockedReason: null,
        requirements: [
            {
                type:
                    "polymerizer-product",
                productId:
                    "GlucoseTransporter",
                label:
                    "Glucose Transporter",
                minimumCount: 1,
                consumed: false
            },
            {
                type:
                    "polymerizer-product",
                productId:
                    "EnergyKinase",
                label: "Energy Kinase",
                minimumCount: 1,
                consumed: false
            },
            {
                type:
                    "macromolecularizer-product",
                productId: "NADPlus",
                label: "NAD+",
                minimumCount: 1,
                consumed: false,
                intendedCategory:
                    "nucleotides"
            }
        ],
        reaction:
            "Glucose + 2 ADP + 2 Pi + 2 NAD+ → 2 pyruvate + 2 ATP + 2 NADH + 2 water",
        reward: {
            type:
                "atp-production-rate",
            amountPerMinute: 4,
            increasesCapacity: false
        }
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
            regenerates: "NAD+",

            // LDH oxidizes NADH back to NAD+, allowing Glycolysis to continue
            // when oxidative metabolism cannot recycle the cofactor. A future
            // biome system should derive an anoxic-survival benefit from this
            // completed branch. That survival effect is deliberately not
            // implemented or stored during the current Metabolism milestone.
            futureBiomeBenefit: {
                id: "anoxic-survival",
                implemented: false,
                description:
                    "Supports continued ATP production in anoxic biomes by regenerating NAD+."
            }
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

    // Each correctly placed core enzyme contributes a fixed +0.3 ATP/min.
    // Placement bonuses do not depend on adjacency; connections communicate
    // reconstruction progress rather than multiplying production rates.
    reward: {
        implemented: true,
        type: "atp-production-rate",
        // Fixed additive contribution. Ten correctly placed enzymes add
        // +3 ATP/min; this is intentionally not a compounding percentage.
        amountPerCorrectCoreEnzyme:
            0.3,
        maximumAmountPerMinute: 3,
        increasesCapacity: false,
        activeFromPlacements: true
    }
};

// A Bio 101 representation of one turn of the bacterial TCA cycle. The
// pathway deliberately uses eight familiar enzyme steps and one ATP-forming
// substrate-level phosphorylation. Cofactor gates are permanent knowledge or
// products; placing an enzyme never consumes them.
const TCA_CYCLE = {
    id: "tcaCycle",
    name: "Krebs Cycle (TCA)",
    category: "Citric Acid Cycle",
    themeId: "blue",
    releaseState: "development",
    description:
        "Complete the eight-enzyme cycle that oxidizes an acetyl unit, captures high-energy electrons, and regenerates oxaloacetate.",
    unlockRequirements: [],
    coreModule: null,
    coreSlots: [
        {
            slot: 1,
            enzymeId: "CitrateSynthase",
            label: "Citrate Synthase",
            abbreviation: "CS",
            activationRequirements: [
                {
                    type: "macromolecularizer-product",
                    productId: "AcetylCoA",
                    label: "Acetyl-CoA",
                    minimumCount: 1,
                    consumed: false
                }
            ]
        },
        {
            slot: 2,
            enzymeId: "Aconitase",
            label: "Aconitase",
            abbreviation: "ACO",
            activationRequirements: []
        },
        {
            slot: 3,
            enzymeId: "IsocitrateDehydrogenase",
            label: "Isocitrate Dehydrogenase",
            abbreviation: "IDH",
            activationRequirements: [
                {
                    type: "macromolecularizer-product",
                    productId: "NADPlus",
                    label: "NAD+",
                    minimumCount: 1,
                    consumed: false
                }
            ]
        },
        {
            slot: 4,
            enzymeId: "AlphaKetoglutarateDehydrogenase",
            label: "Alpha-Ketoglutarate Dehydrogenase",
            abbreviation: "AKGDH",
            teachingNote:
                "Represents the alpha-ketoglutarate dehydrogenase complex as one enzyme card.",
            activationRequirements: [
                {
                    type: "macromolecularizer-product",
                    productId: "NADPlus",
                    label: "NAD+",
                    minimumCount: 1,
                    consumed: false
                }
            ]
        },
        {
            slot: 5,
            enzymeId: "SuccinylCoASynthetase",
            label: "Succinyl-CoA Synthetase",
            abbreviation: "SCS",
            teachingNote:
                "Uses the bacterial ADP + Pi route to make ATP by substrate-level phosphorylation.",
            activationRequirements: [
                {
                    type: "macromolecularizer-product",
                    productId: "ADP",
                    label: "ADP",
                    minimumCount: 1,
                    consumed: false
                },
                {
                    type: "molecule-discovery",
                    productId: "PO4",
                    label: "Pi (phosphate)",
                    minimumCount: 1,
                    consumed: false
                }
            ]
        },
        {
            slot: 6,
            enzymeId: "SuccinateDehydrogenase",
            label: "Succinate Dehydrogenase",
            abbreviation: "SDH",
            activationRequirements: [
                {
                    type: "macromolecularizer-product",
                    productId: "FAD",
                    label: "FAD",
                    minimumCount: 1,
                    consumed: false
                }
            ]
        },
        {
            slot: 7,
            enzymeId: "Fumarase",
            label: "Fumarase",
            abbreviation: "FUM",
            activationRequirements: []
        },
        {
            slot: 8,
            enzymeId: "MalateDehydrogenase",
            label: "Malate Dehydrogenase",
            abbreviation: "MDH",
            activationRequirements: [
                {
                    type: "macromolecularizer-product",
                    productId: "NADPlus",
                    label: "NAD+",
                    minimumCount: 1,
                    consumed: false
                }
            ]
        }
    ],
    regenerationBranches: [],
    chemistry: {
        inputs: [
            "Acetyl-CoA",
            "3 NAD+",
            "FAD",
            "ADP + Pi",
            "2 Water"
        ],
        outputs: [
            "2 CO2",
            "3 NADH",
            "FADH2",
            "ATP",
            "CoA"
        ],
        cofactors: ["NAD+", "FAD", "CoA"],
        atpInvestment: 0,
        atpGross: 1,
        atpNet: 1
    },
    completionRule: {
        requiredCoreSlots: 8,
        requiredRegenerationBranchId: null
    },
    reward: {
        implemented: false,
        type: "not-configured",
        amountPerCorrectCoreEnzyme: 0,
        maximumAmountPerMinute: 0,
        increasesCapacity: false,
        activeFromPlacements: false
    }
};

// This card reserves ETC's place in the pathway library. Its complexes,
// carriers, chemistry, and rewards belong to a later milestone; CoQ is not
// modeled here.
const ELECTRON_TRANSPORT_CHAIN = {
    id: "electronTransportChain",
    name: "Electron Transport Chain (ETC)",
    category: "Oxidative Phosphorylation",
    themeId: "purple",
    releaseState: "development",
    description:
        "Use high-energy electrons to build a proton gradient that can power ATP synthesis.",
    unlockRequirements: [],
    coreModule: null,
    coreSlots: [],
    regenerationBranches: [],

    // ETC is a branched network, not a numbered enzyme sequence. Complex I
    // and Complex II provide alternate electron entry routes that converge at
    // Complex III. Protein products remain owned by Polymerizer; metabolites
    // and derived conditions are presentation-only nodes and are never added
    // to Polymerizer inventory.
    mapType: "network",
    placementImplemented: false,
    network: {
        nodes: [
            {
                id: "complexI",
                type: "protein-complex",
                productId: "NADH_Dehydrogenase",
                label: "NADH Dehydrogenase",
                abbreviation: "CI",
                position: { row: 1, column: 1 },
                activationRequirements: [
                    {
                        type: "metabolism-output",
                        outputId: "NADH",
                        label: "NADH",
                        minimumCount: 1,
                        consumed: false,
                        sources: [
                            {
                                type: "completed-module",
                                moduleId: "glycolysisCore"
                            },
                            {
                                type: "completed-pathway",
                                pathwayId: "tcaCycle"
                            }
                        ]
                    }
                ],
                effect:
                    "Accepts electrons from NADH and pumps H+ across the membrane."
            },
            {
                id: "complexII",
                type: "protein-complex",
                productId: "SuccinateDehydrogenase",
                label: "Succinate Dehydrogenase",
                abbreviation: "CII",
                position: { row: 3, column: 1 },
                activationRequirements: [
                    {
                        type: "metabolism-output",
                        outputId: "FADH2",
                        label: "FADH2 from the TCA cycle",
                        minimumCount: 1,
                        consumed: false,
                        sources: [
                            {
                                type: "completed-pathway",
                                pathwayId: "tcaCycle"
                            }
                        ]
                    }
                ],
                effect:
                    "Feeds FADH2-derived electrons into the chain but does not pump H+."
            },
            {
                id: "complexIII",
                type: "protein-complex",
                productId: "CytochromeBC1Complex",
                label: "Cytochrome bc1 Complex",
                abbreviation: "CIII",
                position: { row: 2, column: 3 },
                dependencies: [
                    {
                        mode: "any",
                        nodeIds: ["complexI", "complexII"],
                        label: "electron input from CI or CII"
                    }
                ],
                activationRequirements: [],
                effect:
                    "Transfers electrons onward and pumps H+ across the membrane."
            },
            {
                id: "cytochromeC",
                type: "electron-carrier",
                productId: "CytochromeC",
                label: "Cytochrome c",
                abbreviation: "Cyt c",
                position: { row: 2, column: 5 },
                dependencies: [
                    {
                        mode: "all",
                        nodeIds: ["complexIII"],
                        label: "active Complex III"
                    }
                ],
                activationRequirements: [],
                effect:
                    "Carries electrons from Complex III to Complex IV."
            },
            {
                id: "complexIV",
                type: "protein-complex",
                productId: "CytochromeCOxidase",
                label: "Cytochrome c Oxidase",
                abbreviation: "CIV",
                position: { row: 2, column: 7 },
                dependencies: [
                    {
                        mode: "all",
                        nodeIds: ["cytochromeC"],
                        label: "electron input from cytochrome c"
                    }
                ],
                activationRequirements: [
                    {
                        type: "molecule-discovery",
                        productId: "O2",
                        label: "Oxygen (O2)",
                        minimumCount: 1,
                        consumed: false
                    }
                ],
                effect:
                    "Transfers electrons to oxygen and pumps H+ across the membrane."
            },
            {
                id: "oxygen",
                type: "terminal-acceptor",
                label: "Oxygen",
                abbreviation: "O2",
                position: { row: 1, column: 9 },
                activationRequirements: [
                    {
                        type: "molecule-discovery",
                        productId: "O2",
                        label: "Oxygen (O2)",
                        minimumCount: 1,
                        consumed: false
                    }
                ],
                effect:
                    "Final electron acceptor; combines with electrons and H+ to form water."
            },
            {
                id: "protonGradient",
                type: "derived-condition",
                label: "Proton Gradient",
                abbreviation: "H+",
                position: { row: 4, column: 5 },
                dependencies: [
                    {
                        mode: "any",
                        nodeIds: ["complexI", "complexII"],
                        label: "electron entry through CI or CII"
                    },
                    {
                        mode: "all",
                        nodeIds: ["complexIII", "complexIV"],
                        label: "proton pumping by CIII and CIV"
                    }
                ],
                activationRequirements: [],
                effect:
                    "Stored electrochemical energy created by proton pumping."
            },
            {
                id: "atpSynthase",
                type: "protein-complex",
                productId: "ATP_Synthase",
                label: "ATP Synthase",
                abbreviation: "ATPsyn",
                position: { row: 4, column: 7 },
                dependencies: [
                    {
                        mode: "all",
                        nodeIds: ["protonGradient"],
                        label: "proton gradient"
                    }
                ],
                activationRequirements: [
                    {
                        type: "macromolecularizer-product",
                        productId: "ADP",
                        label: "ADP",
                        minimumCount: 1,
                        consumed: false
                    },
                    {
                        type: "molecule-discovery",
                        productId: "PO4",
                        label: "Pi (phosphate)",
                        minimumCount: 1,
                        consumed: false
                    }
                ],
                effect:
                    "Uses proton flow to join ADP and Pi; ATP output is not balanced yet."
            },
            {
                id: "atpOutput",
                type: "pathway-output",
                label: "ATP Output",
                abbreviation: "ATP",
                position: { row: 4, column: 9 },
                dependencies: [
                    {
                        mode: "all",
                        nodeIds: ["atpSynthase"],
                        label: "active ATP synthase"
                    }
                ],
                activationRequirements: [],
                effect:
                    "ATP amount and production rate are intentionally not configured."
            }
        ],
        connections: [
            {
                from: "complexI",
                to: "complexIII",
                label: "e-",
                direction: "down-right",
                position: { row: 1, column: 2 }
            },
            {
                from: "complexII",
                to: "complexIII",
                label: "e-",
                direction: "up-right",
                position: { row: 3, column: 2 }
            },
            {
                from: "complexIII",
                to: "cytochromeC",
                label: "e-",
                direction: "right",
                position: { row: 2, column: 4 }
            },
            {
                from: "cytochromeC",
                to: "complexIV",
                label: "e-",
                direction: "right",
                position: { row: 2, column: 6 }
            },
            {
                from: "complexIV",
                to: "oxygen",
                label: "e- to O2",
                direction: "up-right",
                position: { row: 1, column: 8 }
            },
            {
                from: "protonGradient",
                to: "atpSynthase",
                label: "H+ flow",
                direction: "right",
                position: { row: 4, column: 6 }
            },
            {
                from: "atpSynthase",
                to: "atpOutput",
                label: "ATP",
                direction: "right",
                position: { row: 4, column: 8 }
            }
        ]
    },
    chemistry: {
        inputs: ["NADH", "FADH2", "O2", "ADP + Pi"],
        outputs: ["NAD+", "FAD", "Water", "ATP"],
        cofactors: ["Cytochrome c"],
        atpInvestment: 0,
        atpGross: 0,
        atpNet: 0,
        energyAccounting: [
            "ATP amount and production rate intentionally deferred for balance review."
        ]
    },
    completionRule: {
        requiredCoreSlots: 0,
        requiredRegenerationBranchId: null
    },
    reward: {
        implemented: false,
        type: "not-configured",
        amountPerCorrectCoreEnzyme: 0,
        maximumAmountPerMinute: 0,
        increasesCapacity: false,
        activeFromPlacements: false
    }
};

function validatePathway(pathway) {

    const slots = [
        ...(pathway.coreSlots ?? []),
        ...(pathway.regenerationBranches ?? []).flatMap(
            branch => branch.slots
        )
    ];
    const slotNumbers = slots.map(
        slot => slot.slot
    );
    const enzymeIds = slots.map(
        slot => slot.enzymeId
    );
    const networkNodes =
        pathway.network?.nodes ?? [];
    const networkConnections =
        pathway.network?.connections ?? [];
    const networkNodeIds =
        networkNodes.map(node => node.id);
    const networkNodeIdSet =
        new Set(networkNodeIds);
    const networkValid =
        pathway.mapType !== "network" ||
        (
            networkNodes.length > 0 &&
            networkNodeIdSet.size ===
                networkNodeIds.length &&
            networkNodes.every(node =>
                node.id &&
                node.label &&
                node.position &&
                Array.isArray(
                    node.activationRequirements ?? []
                )
            ) &&
            networkConnections.every(
                connection =>
                    networkNodeIdSet.has(
                        connection.from
                    ) &&
                    networkNodeIdSet.has(
                        connection.to
                    ) &&
                    connection.position
            )
        );

    return Boolean(
        pathway.id &&
        pathway.name &&
        ["development", "coming-soon"]
            .includes(pathway.releaseState) &&
        Array.isArray(pathway.unlockRequirements) &&
        pathway.unlockRequirements.every(
            requirement =>
                requirement.consumed === false
        ) &&
        Array.isArray(pathway.coreSlots) &&
        Array.isArray(pathway.regenerationBranches) &&
        new Set(slotNumbers).size ===
            slotNumbers.length &&
        new Set(enzymeIds).size ===
            enzymeIds.length &&
        slots.every(slot =>
            Array.isArray(
                slot.activationRequirements ?? []
            ) &&
            (slot.activationRequirements ?? [])
                .every(requirement =>
                    requirement.consumed === false
                )
        ) &&
        pathway.reward
            ?.increasesCapacity === false &&
        networkValid
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
CALVIN_CYCLE.valid =
    validatePathway(CALVIN_CYCLE);
TCA_CYCLE.valid =
    validatePathway(TCA_CYCLE);
ELECTRON_TRANSPORT_CHAIN.valid =
    validatePathway(
        ELECTRON_TRANSPORT_CHAIN
    );

const PATHWAYS = deepFreeze([
    CALVIN_CYCLE,
    GLYCOLYSIS,
    TCA_CYCLE,
    ELECTRON_TRANSPORT_CHAIN
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
