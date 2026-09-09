// --------------------------------------------------
// PotassiumChannelExperimentCatalog.js
// Selective K+ channel experiment definition
// --------------------------------------------------

import PlasmaMembraneVisualCatalog
    from "./PlasmaMembraneVisualCatalog.js";

const PotassiumChannelExperiment = {

    id:
        "potassium_channel_selectivity",

    organelleId:
        "plasma_membrane",

    title:
        "K⁺ Channel",

    summary:
        "Compare NaCl, CaCl₂, and KCl to observe selective one-direction movement of K⁺ through a membrane channel.",

    catalogReward:
        "+100 XP • Discovery: Ion Channels",

    objective:
        "Test three dissolved salts and observe that a potassium channel selectively transports K⁺ in one direction while other ions remain blocked.",

    stage: {

        template:
            "membrane_transport",

        materials: [
            {
                id: "sodium_chloride",
                maxPlacements: 1
            },
            {
                id: "calcium_chloride",
                maxPlacements: 1
            },
            {
                id: "potassium_chloride",
                maxPlacements: 1
            },
            {
                id: "potassium_channel",
                maxPlacements: 1
            }
        ],

        labels: [],

        controls: [
            "rotate",
            "simulate",
            "reflection",
            "submit",
            "reset"
        ]

    },

    simulation: {

        modelId:
            "particle_membrane_transport",

        modelVariant:
            "potassium_channel_selectivity",

        zoneIds: [
            "side_a",
            "membrane",
            "side_b"
        ],

        particleMaterialIds: [
            "sodium_chloride",
            "calcium_chloride",
            "potassium_chloride"
        ],

        fixedStructureMaterialIds: [
            "potassium_channel"
        ],

        membraneGeometry: {
            ...PlasmaMembraneVisualCatalog.geometry
        },

        poreRule: {
            materialId: "potassium_channel",
            allowedRotationDeg: [90, 270],
            radius: 0.10,
            speedMultiplier: 5
        },

        selectiveTransportRule: {
            allowedMaterialIds: [
                "potassium_ion"
            ],
            sourceZoneId: "side_a",
            targetZoneId: "side_b"
        }

    },

    assessment: {

        scoreMaximum:
            40,

        rubricVersion:
            "potassium-channel-v1",

        feedback: {
            movingSubstance:
                "Identify which dissolved ion moves through the channel.",
            destinationSide:
                "Place all three salt samples on side A so their ions encounter the channel.",
            membraneSpanningOrientation:
                "Place the K⁺ channel in the membrane and rotate it so it spans the bilayer."
        },

        setupRules: [
            {
                id: "nacl_on_side_a",
                type: "exact_material_count_in_zone",
                materialId: "sodium_chloride",
                zoneId: "side_a",
                exactCount: 1,
                points: 5
            },
            {
                id: "cacl2_on_side_a",
                type: "exact_material_count_in_zone",
                materialId: "calcium_chloride",
                zoneId: "side_a",
                exactCount: 1,
                points: 5
            },
            {
                id: "kcl_on_side_a",
                type: "exact_material_count_in_zone",
                materialId: "potassium_chloride",
                zoneId: "side_a",
                exactCount: 1,
                points: 5
            },
            {
                id: "potassium_channel_placement_and_orientation",
                type: "material_in_zone_with_allowed_rotation",
                materialId: "potassium_channel",
                zoneId: "membrane",
                allowedRotationDeg: [90, 270],
                placementScoreUnit: {
                    id: "potassium_channel_in_membrane",
                    points: 5
                },
                orientationScoreUnit: {
                    id: "potassium_channel_spans_membrane",
                    points: 5
                }
            }
        ],

        labelRules: [],

        reflection: {

            id:
                "potassium_channel_observation",

            prompt:
                "Describe what happens to K⁺, Na⁺, Ca²⁺, and Cl⁻. Explain why this channel is described as selective and state the direction K⁺ moves.",

            maximumPoints:
                15,

            conceptGroups: [
                {
                    id: "potassium_moves_a_to_b",
                    terms: [
                        "potassium moves from side a to side b",
                        "k+ moves from side a to side b",
                        "potassium crosses from side a to side b"
                    ],
                    patterns: [
                        "\\b(potassium|k\\+?)\\b.{0,35}\\b(crosses|moves|passes|travels)\\b.{0,35}\\b(side\\s*a.{0,12}side\\s*b|a\\s+to\\s+b)\\b"
                    ]
                },
                {
                    id: "sodium_blocked",
                    patterns: [
                        "\\b(sodium|na\\+?)\\b.{0,30}\\b(blocked|cannot|does not|doesn't|stays|remains|bounces)\\b",
                        "\\b(blocked|cannot|does not|doesn't|stays|remains|bounces)\\b.{0,30}\\b(sodium|na\\+?)\\b"
                    ]
                },
                {
                    id: "calcium_blocked",
                    patterns: [
                        "\\b(calcium|ca2\\+?|ca²⁺)\\b.{0,30}\\b(blocked|cannot|does not|doesn't|stays|remains|bounces)\\b",
                        "\\b(blocked|cannot|does not|doesn't|stays|remains|bounces)\\b.{0,30}\\b(calcium|ca2\\+?|ca²⁺)\\b"
                    ]
                },
                {
                    id: "chloride_blocked",
                    patterns: [
                        "\\b(chloride|cl-?)\\b.{0,30}\\b(blocked|cannot|does not|doesn't|stays|remains|bounces)\\b",
                        "\\b(blocked|cannot|does not|doesn't|stays|remains|bounces)\\b.{0,30}\\b(chloride|cl-?)\\b"
                    ]
                },
                {
                    id: "channel_selectivity",
                    terms: [
                        "selective channel",
                        "selectively transports potassium",
                        "only potassium can pass",
                        "only k+ can pass",
                        "specific for potassium"
                    ],
                    patterns: [
                        "\\b(channel|pore)\\b.{0,30}\\b(selective|specific)\\b",
                        "\\b(selective|specific)\\b.{0,30}\\b(potassium|k\\+?|channel|pore)\\b"
                    ]
                }
            ],

            feedbackByKeywordGroup: [
                "State that K⁺ moves from side A through the channel to side B.",
                "Describe what happens to Na⁺ at the membrane.",
                "Describe what happens to Ca²⁺ at the membrane.",
                "Describe what happens to Cl⁻ at the membrane.",
                "Explain what makes the channel selective."
            ],

            technicalVocabulary: [
                "ion channel",
                "selective permeability",
                "facilitated diffusion",
                "concentration gradient"
            ]

        }

    },

    requirements: {
        discoveries: [],
        completedExperiments: [
            "aquaporin_facilitated_diffusion"
        ]
    },

    grants: {
        xp: 100,
        discoveries: [
            "ion_channels"
        ],
        achievements: [],
        metricEffects: []
    },

    observation: {
        title:
            "Ion Channels Are Selective",
        description:
            "The salts dissociate into ions. K⁺ moves from side A to side B through the correctly oriented potassium channel, while Na⁺, Ca²⁺, and Cl⁻ bounce away from the membrane.",
        takeaway:
            "A membrane channel can permit one ion while excluding other ions, even when they are dissolved together."
    }

};

export default PotassiumChannelExperiment;
