// --------------------------------------------------
// OrganelleExperimentLibrary.js
// Static definitions for organelle research experiments
// --------------------------------------------------

const MEMBRANE_TRANSPORT_LABELS = [

    "sodium_ion",

    "chloride_ion",

    "hypertonic",

    "hypotonic",

    "plasma_membrane",

    "extracellular_solution",

    "cytosol"

];

const OrganelleExperimentLibrary = {

    // --------------------------------------------------
    // Plasma membrane: passive diffusion
    // --------------------------------------------------
    water_passive_diffusion: {

        id:
            "water_passive_diffusion",

        organelleId:
            "plasma_membrane",

        title:
            "Passive Diffusion of Water",

        summary:
            "Observe water moving slowly across the plasma membrane without ATP or a transport protein.",

        catalogReward:
            "+100 XP",

        objective:
            "An amoeba needs water. Position the components so that water flows into the cell.",

        stage: {

            

            template:
                "membrane_transport",

            materials: [

                {
                    id: "water",
                    maxPlacements: 2
                },

                {
                    id: "sodium_ion",
                    maxPlacements: 2
                },

                {
                    id: "chloride_ion",
                    maxPlacements: 2
                }

            ],

            labels:
                MEMBRANE_TRANSPORT_LABELS,

            controls: [

                "simulate",

                "labels",

                "reflection",

                "submit",

                "reset",

            ]

        },

        // strawberry

            assessment: {

    scoreMaximum:
        60,

    rubricVersion:
        "water-passive-v2",

    feedback: {
        movingSubstance: "Revisit the relationship between water, the solute difference, and net movement into the cell.",
        drivingGradient: "Recheck which side has the higher solute concentration and how that drives net movement.",
        destinationSide: "Recheck which compartment should receive the net movement.",
        membraneSpanningOrientation: "Recheck whether the transport structure orientation allows material to properly cross the membrane.",
        proteinSideOrientation: "Recheck which side of the protein should face the cytosol.",
        energyRequirement: "Recheck whether this transport process requires ATP."
    },

        sideZoneIds: [
    "side_a",
    "side_b"
],

    setupRules: [

        {
            id:
                "water_in_cytosol",

            type:
                "minimum_material_in_semantic_zone",

            materialId:
                "water",

            semanticZone:
                "cytosol",

            minimumCount:
                1,

            points:
                5
        },

        {
            id:
                "water_in_extracellular_solution",

            type:
                "minimum_material_in_semantic_zone",

            materialId:
                "water",

            semanticZone:
                "extracellular",

            minimumCount:
                1,

            points:
                5
        },

        {
            id:
                "inward_sodium_chloride_gradient",

            type:
                "balanced_ion_gradient",

            cationId:
                "sodium_ion",

            anionId:
                "chloride_ion",

            higherConcentrationZone:
                "cytosol",

            scoreUnits: [

                {
                    id:
                        "sodium_gradient",

                    points:
                        5
                },

                {
                    id:
                        "chloride_gradient",

                    points:
                        5
                }

            ]

        }

    ],

    labelRules: [

        {
            id:
                "plasma_membrane_label",

            type:
                "label_in_zone",

            labelId:
                "plasma_membrane",

            zoneId:
                "membrane",

            points:
                5
        },

        {
            id:
                "cytosol_label",

            type:
                "semantic_zone_label",

            labelId:
                "cytosol",

            semanticZone:
                "cytosol",

                ionGradientRuleId:
    "inward_sodium_chloride_gradient",

            concentrationRelation:
                "higher",

            points:
                5
        },

        {
            id:
                "extracellular_solution_label",

            type:
                "semantic_zone_label",

            labelId:
                "extracellular_solution",

            semanticZone:
                "extracellular",

                ionGradientRuleId:
    "inward_sodium_chloride_gradient",

            concentrationRelation:
                "lower",

            points:
                5
        },

        {
            id:
                "sodium_ion_label",

            type:
                "label_near_material",

            labelId:
                "sodium_ion",

            materialId:
                "sodium_ion",

            maximumDistance:
                0.20,

            points:
                5
        },

        {
            id:
                "chloride_ion_label",

            type:
                "label_near_material",

            labelId:
                "chloride_ion",

            materialId:
                "chloride_ion",

            maximumDistance:
                0.20,

            points:
                5
        },

        {
            id:
                "hypertonic_label",

            type:
                "label_in_semantic_zone",

            labelId:
                "hypertonic",

            semanticZone:
                "cytosol",

            points:
                5
        },

        {
            id:
                "hypotonic_label",

            type:
                "label_in_semantic_zone",

            labelId:
                "hypotonic",

            semanticZone:
                "extracellular",

            points:
                5
        }

    ],

    reflection: {

        id:
            "water_osmosis_explanation",

        prompt:
            "Explain why water has a net movement into the amoeba. Describe the difference between the two sides of the membrane and how that difference affects water movement.",

        maximumPoints:
            5,

        keywordGroups: [

    // Identifies the moving substance.
    [
        "water",
        "H2O"
    ],

    // Identifies the solute or concentration context.
    [
        "solute",
        "solutes",
        "ion",
        "ions",
        "salt",
        "salty",
        "sodium",
        "chloride",
        "NaCl",
        "concentration",
        "gradient",
        "hypertonic",
        "hypotonic",
        "salt concentration",
        "solute concentration",
        "ion concentration",
        "concentration gradient",
        "osmotic gradient",
        "higher concentration",
        "higher solute concentration",
        "higher salt concentration",
        "more concentrated",
        "more salty",
        "saltier"
    ],

    // Identifies the cause-and-effect direction:
    // water enters the cell toward its higher-solute cytosol.
    [
        "higher solute",
        "more solute",
        "more salt",
        "more ions",
        "higher ion concentration",
        "higher solute concentration",
        "higher salt concentration",
        "higher concentration of solute",
        "higher concentration of salt",
        "greater solute concentration",
        "greater salt concentration",
        "more concentrated",
        "more highly concentrated",
        "saltier side",
        "saltier cytosol",
        "higher concentration",
        "toward the cytosol",
        "to the cytosol",
        "into the cytosol",
        "towards the cytosol",
        "toward cytosol",
        "into the amoeba",
        "to the amoeba",
        "inside the amoeba",
        "into the cell",
        "to the cell",
        "inside the cell",
        "enters the cell",
        "enter the cell",
        "enters the amoeba",
        "enter the amoeba",
        "moves into the cell",
        "move into the cell",
        "moves into the amoeba",
        "move into the amoeba",
        "moves inward",
        "move inward",
        "flows into the cell",
        "flow into the cell"
    ]

],

        // Recognized only after a perfect score; these
        // terms never contribute to the 60-point grade.
        technicalVocabulary: [
            "osmosis",
            "osmotic",
            "passive transport",
            "passive diffusion",
            "diffusion"
        ]

    }

},

simulation: {

    modelId:
        "particle_membrane_transport",

    modelVariant:
        "osmosis",

    zoneIds: [
        "side_a",
        "membrane",
        "side_b"
    ],

    // Only dissolved substances become moving particles.
    particleMaterialIds: [
        "water",
        "sodium_ion",
        "chloride_ion"
    ],

    // Shared by the setup grid, simulation backdrop, and
    // particle-engine collision bounds.
    membraneGeometry: {
        start: 0.44,
        end: 0.56
    },

    membraneRules: {

        blockedMaterialIds: [

            "sodium_ion",

            "chloride_ion"

        ],

        permeableMaterialIds: [

            "water"

        ]

    },

    waterCrossingRule:
        "lower_to_higher_trap"

        

},

        requirements: {

            discoveries: [
                "H2O"
            ],

            completedExperiments: []

        },

        grants: {

            xp:
                100,

            discoveries: [],

            achievements: [],

            metricEffects: []

        },

        observation: {

            title:
                "Observation",

            description:
                "Water molecules move in both directions across the plasma membrane. A small amount can pass directly through the lipid bilayer without ATP or a transport protein.",

            takeaway:
                "Water can move passively across a membrane, but direct diffusion is comparatively slow."

        }

    },

    // --------------------------------------------------
    // Plasma membrane: facilitated diffusion
    // --------------------------------------------------
    aquaporin_facilitated_diffusion: {

        id:
            "aquaporin_facilitated_diffusion",

        organelleId:
            "plasma_membrane",

        title:
            "Aquaporin-Facilitated Water Diffusion",

        summary:
            "Compare slow passive water movement with rapid water movement through an aquaporin channel.",

        catalogReward:
            "+500 XP • +5% membrane transport • +3% vacuole osmoregulation",

        objective:
            "An amoeba has taken in too much water and must export the excess to restore water balance. Arrange the materials to move water out of the cell.",

        stage: {

            template:
                "membrane_transport",

            materials: [

                {
                    id: "water",
                    maxPlacements: 2
                },

                {
                    id: "sodium_ion",
                    maxPlacements: 2
                },

                {
                    id: "chloride_ion",
                    maxPlacements: 2
                },

                {
                    id: "aquaporin",
                    maxPlacements: 1
                }

            ],

            labels: [

                ...MEMBRANE_TRANSPORT_LABELS,

                "aquaporin_channel"

            ],

            controls: [

                "rotate",

                "simulate",

                "labels",

                "reflection",

                "submit",

                "reset"

            ]

        },

        // The engine expands each placed water source into
        // twelve moving molecules. A valid, vertical aquaporin
        // creates the only rapid crossing path through the membrane.
        simulation: {

            modelId:
                "particle_membrane_transport",

            modelVariant:
                "aquaporin_facilitated_osmosis",

            zoneIds: [
                "side_a",
                "membrane",
                "side_b"
            ],

            // Aquaporin remains a fixed membrane structure;
            // only dissolved substances become particles.
            particleMaterialIds: [
                "water",
                "sodium_ion",
                "chloride_ion"
            ],

            // Stays visible over the particle canvas but is
            // not converted into a moving simulation particle.
            fixedStructureMaterialIds: [
                "aquaporin"
            ],

            // Shared by the setup grid, simulation backdrop,
            // and particle-engine collision bounds.
            membraneGeometry: {
                start: 0.44,
                end: 0.56
            },

            waterParticlesPerPlacement:
                12,

            poreRule: {

                materialId:
                    "aquaporin",

                allowedRotationDeg: [
                    90,
                    270
                ],

                radius:
                    0.10,

                speedMultiplier:
                    5

            }

        },

        assessment: {

    scoreMaximum:
        75,

    rubricVersion:
        "aquaporin-v2",

    feedback: {
        movingSubstance: "Revisit how the external solute difference affects net water movement through the membrane.",
        drivingGradient: "Recheck which side has the higher solute concentration and how that drives water movement out of the amoeba.",
        destinationSide: "Recheck which side of the membrane should be the extracellular solution.",
        membraneSpanningOrientation: "Recheck whether the aquaporin orientation allows material to properly cross the membrane.",
        proteinSideOrientation: "Recheck which side of the protein should face the cytosol.",
        energyRequirement: "Recheck why this transport does not require ATP."
    },

            sideZoneIds: [
                "side_a",
                "side_b"
            ],

            setupRules: [

                {
                    id: "water_in_cytosol",
                    type: "minimum_material_in_semantic_zone",
                    materialId: "water",
                    semanticZone: "cytosol",
                    minimumCount: 1,
                    points: 5
                },

                {
                    id: "water_in_extracellular_solution",
                    type: "minimum_material_in_semantic_zone",
                    materialId: "water",
                    semanticZone: "extracellular",
                    minimumCount: 1,
                    points: 5
                },

                {
                    id: "outward_sodium_chloride_gradient",
                    type: "balanced_ion_gradient",
                    cationId: "sodium_ion",
                    anionId: "chloride_ion",
                    higherConcentrationZone: "extracellular",
                    scoreUnits: [
                        {
                            id: "outward_sodium_gradient",
                            points: 5
                        },
                        {
                            id: "outward_chloride_gradient",
                            points: 5
                        }
                    ]
                },

                {
                    id: "aquaporin_membrane_placement_and_orientation",
                    type: "material_in_zone_with_allowed_rotation",
                    materialId: "aquaporin",
                    zoneId: "membrane",
                    allowedRotationDeg: [90, 270],
                    placementScoreUnit: {
                        id: "aquaporin_in_membrane",
                        points: 5
                    },
                    orientationScoreUnit: {
                        id: "aquaporin_spans_membrane",
                        points: 5
                    }
                }

            ],

            labelRules: [

                {
                    id: "plasma_membrane_label",
                    type: "label_in_zone",
                    labelId: "plasma_membrane",
                    zoneId: "membrane",
                    points: 5
                },

                {
                    id: "cytosol_label",
                    type: "semantic_zone_label",
                    labelId: "cytosol",
                    semanticZone: "cytosol",
                    ionGradientRuleId: "outward_sodium_chloride_gradient",
                    concentrationRelation: "lower",
                    points: 5
                },

                {
                    id: "extracellular_solution_label",
                    type: "semantic_zone_label",
                    labelId: "extracellular_solution",
                    semanticZone: "extracellular",
                    ionGradientRuleId: "outward_sodium_chloride_gradient",
                    concentrationRelation: "higher",
                    points: 5
                },

                {
                    id: "sodium_ion_label",
                    type: "label_near_material",
                    labelId: "sodium_ion",
                    materialId: "sodium_ion",
                    maximumDistance: 0.20,
                    points: 5
                },

                {
                    id: "chloride_ion_label",
                    type: "label_near_material",
                    labelId: "chloride_ion",
                    materialId: "chloride_ion",
                    maximumDistance: 0.20,
                    points: 5
                },

                {
                    id: "hypertonic_label",
                    type: "label_in_semantic_zone",
                    labelId: "hypertonic",
                    semanticZone: "extracellular",
                    points: 5
                },

                {
                    id: "hypotonic_label",
                    type: "label_in_semantic_zone",
                    labelId: "hypotonic",
                    semanticZone: "cytosol",
                    points: 5
                },

                {
                    id: "aquaporin_channel_label",
                    type: "label_near_material",
                    labelId: "aquaporin_channel",
                    materialId: "aquaporin",
                    maximumDistance: 0.20,
                    points: 5
                }

            ],

            reflection: {

                id:
                    "aquaporin_water_export_explanation",

                prompt:
                    "Explain why water moves out of the amoeba through your aquaporin model. Describe the solute difference across the membrane, why the aquaporin must span the membrane, and why ATP is not needed.",

                maximumPoints:
                    5,

              keywordGroups: [

    // 1 point — identifies what is moving
    [
        "water",
        "H2O"
    ],

    // 1 point — identifies the external solute difference
    [
        "extracellular solution",
        "outside solution",
        "external solution",
        "outside of the cell has",
        "outside has",
        "higher concentration",
        "high concentration",
        "higher salt concentration",
        "higher solute concentration",
        "more salt",
        "more solute",
        "salt concentration",
        "solute concentration",
        "osmotic gradient",
        "concentration gradient",
        "hypertonic environment",
        "hypertonic solution",
        "hypertonic outside",
        "outside is hypertonic"
    ],

    // 1 point — identifies water leaving the amoeba
    [
        "out of the amoeba",
        "out of the cell",
        "outside of the amoeba",
        "outside of the cell",
        "to the outside of the amoeba",
        "to the outside of the cell",
        "to the outside",
        "moves to the outside",
        "move to the outside",
        "moves outward",
        "move outward",
        "flows outward",
        "flow outward",
        "flows out",
        "flow out",
        "moves out",
        "move out",
        "diffuses out",
        "diffuse out",
        "exits the cell",
        "exit the cell",
        "leaves the cell",
        "leave the cell"
    ],

    // 1 point — identifies the aquaporin membrane pathway
    [
        "aquaporin channel",
        "aquaporin pore",
        "aquaporin protein",
        "aquaporin transport protein",
        "aquaporin spanning the membrane",
        "aquaporin spans the membrane",
        "aquaporin span the membrane",
        "aquaporin through the membrane",
        "aquaporin in the membrane",
        "aquaporin embedded in the membrane",
        "channel in the membrane",
        "channel through the membrane",
        "membrane channel",
        "water channel",
        "transport protein",
        "protein channel",
        "spans the membrane",
        "span the membrane",
        "spanning the membrane",
        "through the membrane",
        "embedded in the membrane"
    ],

    // 1 point — identifies ATP-independent passive movement
    [
        "without ATP",
        "no ATP",
        "ATP is not needed",
        "ATP is unnecessary",
        "ATP is not required",
        "does not use ATP",
        "doesn't use ATP",
        "does not require ATP",
        "doesn't require ATP",
        "passive transport",
        "passively",
        "passive diffusion",
        "facilitated diffusion",
        "does not require energy",
        "doesn't require energy",
        "no energy required",
        "no energy is required",
        "without energy",
        "without energy input"
    ]

],

                technicalVocabulary: [
                    "facilitated diffusion",
                    "channel protein",
                    "selective channel",
                    "osmosis",
                    "passive transport"
                ]

            }

        },

        requirements: {

            discoveries: [
                "aquaporin"
            ],

            completedExperiments: [
                "water_passive_diffusion"
            ]

        },

        grants: {

            xp:
                500,

            discoveries: [
                "facilitated_diffusion_level_1"
            ],

            achievements: [
                "aquaporin_transport"
            ],

            metricEffects: [

                {
                    systemId:
                        "plasma_membrane",

                    metricId:
                        "transportEfficiency",

                    operation:
                        "add",

                    amount:
                        0.05
                },

                {
                    systemId:
                        "contractile_vacuole",

                    metricId:
                        "osmoregulationCapacity",

                    operation:
                        "add",

                    amount:
                        0.03
                }

            ]

        },

        observation: {

            title:
                "Observation",

            description:
                "Aquaporin forms a selective channel that allows water to cross the membrane much faster than direct diffusion through lipids. This transport remains passive and does not consume ATP.",

            takeaway:
                "A membrane protein can increase transport rate without changing passive diffusion into active transport."

        }

    }

};

export default OrganelleExperimentLibrary;
