// --------------------------------------------------
// CellMapLayout.js
// Defines Cell View map features and fixed label positions
// --------------------------------------------------

const CellMapLayout = {

    viewBox: "0 0 1200 800",

    features: [

        {
            id: "plasma_membrane",
            label: "Plasma Membrane",
            type: "boundary",
            discoveryId: "plasma_membrane",
            labFocusId: "plasma_membrane",

            node: {
                x: 309,
                y: 269
            },

            hotspotDiameter: 50,

            labelPosition: {
                x: 141,
                y: 41,
                anchor: "start"
            }
        },

        {
            id: "cytoplasm",
            label: "Cytoplasm",
            type: "region",
            discoveryId: "cytoplasm",
            labFocusId: "cytoplasm",

            node: {
                x: 478,
                y: 407
            },

            hotspotDiameter: 50,

            labelPosition: {
                x: 397,
                y: 8,
                anchor: "start"
            }
        },

        {
            id: "ectoplasm",
            label: "Ectoplasm",
            type: "subregion",
            discoveryId: "cytoplasm",
            labFocusId: "cytoplasm",

            node: {
                x: 155,
                y: 265
            },

            hotspotDiameter: 50,

            labelPosition: {
                x: 69,
                y: 98,
                anchor: "start"
            }
        },

        {
            id: "endoplasm",
            label: "Endoplasm",
            type: "subregion",
            discoveryId: "cytoplasm",
            labFocusId: "cytoplasm",

            node: {
                x: 343,
                y: 360
            },

            hotspotDiameter: 50,

            labelPosition: {
                x: 71,
                y: 385,
                anchor: "start"
            }
        },

        {
            id: "nucleus",
            label: "Nucleus",
            type: "organelle",
            discoveryId: "nucleus",
            labFocusId: "nucleus",

            node: {
                x: 623,
                y: 384
            },

            hotspotDiameter: 140,

            labelPosition: {
                x: 581,
                y: -21,
                anchor: "start"
            }
        },

        {
            id: "contractile_vacuole",
            label: "Contractile Vacuole",
            type: "organelle",
            discoveryId: "contractile_vacuole",
            labFocusId: "contractile_vacuole",

            node: {
                x: 430,
                y: 347
            },

            hotspotDiameter: 120,

            labelPosition: {
                x: 221,
                y: 682,
                anchor: "start"
            }
        },

        {
            id: "food_vacuole",
            label: "Food Vacuole",
            type: "organelle",
            discoveryId: "food_vacuole",
            labFocusId: "food_vacuole",

            node: {
                x: 844,
                y: 387
            },

            hotspotDiameter: 70,

            labelPosition: {
                x: 834,
                y: 68,
                anchor: "start"
            }
        },

        {
            id: "pseudopodia",
            label: "Pseudopodia",
            type: "structure",
            discoveryId: "cytoskeleton",
            labFocusId: "cytoskeleton",

            node: {
                x: 876,
                y: 630
            },

            hotspotDiameter: 30,

            labelPosition: {
                x: 858,
                y: 784,
                anchor: "start"
            }
        },

        {
            id: "mitochondria",
            label: "Mitochondria",
            type: "organelle_group",
            discoveryId: "mitochondria",
            labFocusId: "mitochondria",

            node: {
                x: 795,
                y: 285
            },

            hotspotDiameter: 70,

            labelPosition: {
                x: 746,
                y: 29,
                anchor: "start"
            }
        },

        {
            id: "golgi_apparatus",
            label: "Golgi Apparatus",
            type: "organelle",
            discoveryId: "golgi_apparatus",
            labFocusId: "golgi_apparatus",

            node: {
                x: 680,
                y: 279
            },

            hotspotDiameter: 90,

            labelPosition: {
                x: 678,
                y: -47,
                anchor: "start"
            }
        },

        {
            id: "rough_endoplasmic_reticulum",
            label: "Rough ER",
            type: "organelle",
            discoveryId: "rough_endoplasmic_reticulum",
            labFocusId: "rough_endoplasmic_reticulum",

            node: {
                x: 522,
                y: 321
            },

            hotspotDiameter: 90,

            labelPosition: {
                x: 434,
                y: 653,
                anchor: "start"
            }
        },

        {
            id: "smooth_endoplasmic_reticulum",
            label: "Smooth ER",
            type: "organelle",
            discoveryId: "smooth_endoplasmic_reticulum",
            labFocusId: "smooth_endoplasmic_reticulum",

            node: {
                x: 706,
                y: 464
            },

            hotspotDiameter: 90,

            labelPosition: {
                x: 562,
                y: 697,
                anchor: "start"
            }
        },

        {
            id: "ribosomes",
            label: "Ribosomes",
            type: "organelle_group",
            discoveryId: "ribosomes",
            labFocusId: "ribosomes",

            node: {
                x: 585,
                y: 525
            },

            hotspotDiameter: 50,

            labelPosition: {
                x: 511,
                y: 728,
                anchor: "start"
            }
        },

        {
            id: "cytoskeleton",
            label: "Cytoskeleton",
            type: "structure",
            discoveryId: "cytoskeleton",
            labFocusId: "cytoskeleton",

            node: {
                x: 402,
                y: 266
            },

            hotspotDiameter: 50,

            labelPosition: {
                x: 269,
                y: 80,
                anchor: "start"
            }
        },

        {
            id: "lysosomes",
            label: "Lysosomes",
            type: "organelle_group",
            discoveryId: "lysosomes",
            labFocusId: "lysosomes",

            node: {
                x: 926,
                y: 309
            },

            hotspotDiameter: 40,

            labelPosition: {
                x: 919,
                y: 169,
                anchor: "start"
            }
        },

        {
            id: "symbiosomes",
            label: "Symbiosomes",
            type: "organelle_group",
            discoveryId: "symbiosomes",
            labFocusId: "symbiosomes",

            node: {
                x: 944,
                y: 465
            },

            hotspotDiameter: 40,

            labelPosition: {
                x: 1123,
                y: 566,
                anchor: "end"
            }
        },

        {
            id: "endosome",
            label: "Endosome",
            type: "organelle",
            discoveryId: "endosome",
            labFocusId: "endosome",

            node: {
                x: 781,
                y: 358
            },

            hotspotDiameter: 50,

            labelPosition: {
                x: 1108,
                y: 411,
                anchor: "end"
            }
        },

        {
            id: "autophagosome",
            label: "Autophagosome",
            type: "organelle",
            discoveryId: "autophagosome",
            labFocusId: "autophagosome",

            node: {
                x: 244,
                y: 299
            },

            hotspotDiameter: 50,

            labelPosition: {
                x: 50,
                y: 346,
                anchor: "start"
            }
        }

    ],

    // --------------------------------------------------
    // Retrieve one map feature by its stable ID
    // --------------------------------------------------
    getFeature(featureId) {

        return this.features.find(
            feature =>
                feature.id === featureId
        ) ?? null;

    }

};

export default CellMapLayout;