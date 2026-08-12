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

                "water",

                "sodium_ion",

                "chloride_ion"

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
            "Explain why the net movement of water in your model is into the amoeba.",

        maximumPoints:
            5,

        keywordGroups: [

            [
                "water",
                "h2o"
            ],

            [
                "osmosis",
                "osmotic"
            ],

            [
                "solute",
                "salt",
                "ion",
                "nacl"
            ],

            [
                "concentration",
                "gradient"
            ],

            [
                "hypertonic",
                "hypotonic"
            ]

        ]

    }

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
            "Place aquaporin correctly in the plasma membrane and compare direct water diffusion with channel-facilitated water transport.",

        stage: {

            template:
                "membrane_transport",

            materials: [

                "water",

                "sodium_ion",

                "chloride_ion",

                "aquaporin"

            ],

            labels: [

                ...MEMBRANE_TRANSPORT_LABELS,

                "aquaporin_channel"

            ],

            controls: [

                "flip",

                "simulate",

                "labels",

                "reflection",

                "submit",

                "reset"

            ]

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