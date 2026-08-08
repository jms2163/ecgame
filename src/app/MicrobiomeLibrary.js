// --------------------------------------------------
// MicrobiomeLibrary.js
// Defines environmental archetypes for Pond microbiomes
// --------------------------------------------------

const MicrobiomeLibrary = {

    open_water: {

        id: "open_water",
        name: "Open Water",

        environment: {

            physics: {
                light: 0.95,      // Relative intensity: 0–1
                oxygen: 0.85,     // Relative saturation: 1.0 = 100%
                ph: 7.4
            },

            nutrients: {
                glucose: 0.01,       // mM
                nitrates: 0.03,      // mM
                phosphates: 0.005    // mM
            }

        }

    },


    algae_patch: {

        id: "algae_patch",
        name: "Algae Patch",

        environment: {

            physics: {
                light: 0.65,      // Relative intensity: 0–1
                oxygen: 1.20,     // Relative saturation: 1.0 = 100%
                ph: 8.6
            },

            nutrients: {
                glucose: 0.80,        // mM
                nitrates: 0.002,      // mM
                phosphates: 0.0001    // mM
            }

        }

    },

    leaf_surface: {
    id: "leaf_surface",
    name: "Leaf Surface",

    environment: {
        physics: {
            light: 0.70,
            oxygen: 0.95,
            ph: 7.6
        },

        nutrients: {
            glucose: 0.30,
            nitrates: 0.015,
            phosphates: 0.003
        }
    }
},

sediment_grain: {
    id: "sediment_grain",
    name: "Sediment Grain",

    environment: {
        physics: {
            light: 0.05,
            oxygen: 0.20,
            ph: 6.9
        },

        nutrients: {
            glucose: 0.20,
            nitrates: 0.05,
            phosphates: 0.020
        }
    }
},

biofilm_mat: {
    id: "biofilm_mat",
    name: "Biofilm Mat",

    environment: {
        physics: {
            light: 0.45,
            oxygen: 0.55,
            ph: 7.5
        },

        nutrients: {
            glucose: 0.50,
            nitrates: 0.020,
            phosphates: 0.008
        }
    }
},

detritus_cloud: {
    id: "detritus_cloud",
    name: "Detritus Cloud",

    environment: {
        physics: {
            light: 0.30,
            oxygen: 0.35,
            ph: 7.0
        },

        nutrients: {
            glucose: 0.90,
            nitrates: 0.040,
            phosphates: 0.015
        }
    }
},

bacterial_bloom: {
    id: "bacterial_bloom",
    name: "Bacterial Bloom",

    environment: {
        physics: {
            light: 0.40,
            oxygen: 0.25,
            ph: 7.2
        },

        nutrients: {
            glucose: 1.20,
            nitrates: 0.005,
            phosphates: 0.001
        }
    }
},

anaerobic_pocket: {
    id: "anaerobic_pocket",
    name: "Anaerobic Pocket",

    environment: {
        physics: {
            light: 0.00,
            oxygen: 0.00,
            ph: 6.5
        },

        nutrients: {
            glucose: 0.60,
            nitrates: 0.002,
            phosphates: 0.010
        }
    }
}

};

export default MicrobiomeLibrary;