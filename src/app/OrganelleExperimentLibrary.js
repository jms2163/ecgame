// --------------------------------------------------
// OrganelleExperimentLibrary.js
// Static definitions for organelle research experiments
// --------------------------------------------------

const OrganelleExperimentLibrary = {

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
            "Use water and electrolyte to determine how a solute gradient changes net water movement across a plasma membrane.",

        stage: {

            template:
                "membrane_transport",

            materials: [

                {
                    id:
                        "water",

                    label:
                        "Water",

                    symbol:
                        "H₂O",

                    description:
                        "Water molecules can move passively across a plasma membrane."
                },

                {
                    id:
                        "electrolyte",

                    label:
                        "Salt (Electrolyte)",

                    symbol:
                        "Na⁺ + Cl⁻",

                    description:
                        "Dissolved ions create an osmotic gradient that influences net water movement."
                }

            ]

        },

        requirements: {

            discoveries: [
                "H2O"
            ],

            completedExperiments: []

        },

        grants: {

            xp: 100,

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

                {
                    id:
                        "water",

                    label:
                        "Water",

                    symbol:
                        "H₂O",

                    description:
                        "Water molecules move in response to an osmotic gradient."
                },

                {
                    id:
                        "electrolyte",

                    label:
                        "Salt (Electrolyte)",

                    symbol:
                        "Na⁺ + Cl⁻",

                    description:
                        "Dissolved ions establish the osmotic gradient."
                },

                {
                    id:
                        "aquaporin",

                    label:
                        "Aquaporin",

                    symbol:
                        "AQP",

                    description:
                        "A selective membrane channel that increases the rate of passive water transport."
                }

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

            xp: 500,

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