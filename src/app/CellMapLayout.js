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
                x: 850,
                y: 300
            },

            labelPosition: {
                x: 1080,
                y: 100,
                anchor: "end"
            }
        },

        {
            id: "cytoplasm",
            label: "Cytoplasm",
            type: "region",
            discoveryId: "cytoplasm",
            labFocusId: "cytoplasm",

            node: {
                x: 430,
                y: 330
            },

            labelPosition: {
                x: 120,
                y: 100,
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
                x: 270,
                y: 350
            },

            labelPosition: {
                x: 120,
                y: 210,
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
                x: 430,
                y: 500
            },

            labelPosition: {
                x: 120,
                y: 320,
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
                x: 580,
                y: 380
            },

            labelPosition: {
                x: 1080,
                y: 200,
                anchor: "end"
            }
        },

        {
            id: "contractile_vacuole",
            label: "Contractile Vacuole",
            type: "organelle",
            discoveryId: "contractile_vacuole",
            labFocusId: "contractile_vacuole",

            node: {
                x: 720,
                y: 220
            },

            labelPosition: {
                x: 1080,
                y: 300,
                anchor: "end"
            }
        },

        {
            id: "food_vacuole",
            label: "Food Vacuole",
            type: "organelle",
            discoveryId: "food_vacuole",
            labFocusId: "food_vacuole",

            node: {
                x: 690,
                y: 500
            },

            labelPosition: {
                x: 1080,
                y: 410,
                anchor: "end"
            }
        },

        {
            id: "pseudopodia",
            label: "Pseudopodia",
            type: "structure",
            discoveryId: "cytoskeleton",
            labFocusId: "cytoskeleton",

            node: {
                x: 250,
                y: 600
            },

            labelPosition: {
                x: 120,
                y: 560,
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
                x: 480,
                y: 550
            },

            labelPosition: {
                x: 420,
                y: 760,
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
                x: 690,
                y: 380
            },

            labelPosition: {
                x: 1080,
                y: 510,
                anchor: "end"
            }
        },

        {
            id: "rough_endoplasmic_reticulum",
            label: "Rough ER",
            type: "organelle",
            discoveryId: "rough_endoplasmic_reticulum",
            labFocusId: "rough_endoplasmic_reticulum",

            node: {
                x: 490,
                y: 300
            },

            labelPosition: {
                x: 120,
                y: 430,
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
                x: 420,
                y: 430
            },

            labelPosition: {
                x: 120,
                y: 500,
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
                x: 570,
                y: 270
            },

            labelPosition: {
                x: 470,
                y: 50,
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
                x: 350,
                y: 470
            },

            labelPosition: {
                x: 120,
                y: 630,
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
                x: 750,
                y: 440
            },

            labelPosition: {
                x: 1080,
                y: 610,
                anchor: "end"
            }
        },

        {
            id: "symbiosomes",
            label: "Symbiosomes",
            type: "organelle_group",
            discoveryId: "symbiosomes",
            labFocusId: "symbiosomes",

            node: {
                x: 570,
                y: 610
            },

            labelPosition: {
                x: 700,
                y: 760,
                anchor: "start"
            }
        },

        {
            id: "endosome",
            label: "Endosome",
            type: "organelle",
            discoveryId: "endosome",
            labFocusId: "endosome",

            node: {
                x: 310,
                y: 510
            },

            labelPosition: {
                x: 120,
                y: 700,
                anchor: "start"
            }
        },

        {
            id: "autophagosome",
            label: "Autophagosome",
            type: "organelle",
            discoveryId: "autophagosome",
            labFocusId: "autophagosome",

            node: {
                x: 790,
                y: 570
            },

            labelPosition: {
                x: 1080,
                y: 710,
                anchor: "end"
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