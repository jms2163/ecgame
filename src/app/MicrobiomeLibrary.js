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

    }

};

export default MicrobiomeLibrary;