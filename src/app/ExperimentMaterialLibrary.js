// --------------------------------------------------
// ExperimentMaterialLibrary.js
// Shared definitions for draggable experiment materials
// --------------------------------------------------

const ExperimentMaterialLibrary = {

    hydrogen_ion: { id: 'hydrogen_ion', displayName: 'H⁺', ariaLabel: 'Proton', visualId: 'hydrogen_ion_sphere' },
    hydrogen_ion_sample: { id: 'hydrogen_ion_sample', displayName: 'H⁺ sample', ariaLabel: 'Six protons',
        visualId: 'hydrogen_ion_sphere', particleComposition: { hydrogen_ion: 6 } },
    lab_atp_supply: { id: 'lab_atp_supply', displayName: 'ATP supply', ariaLabel: 'Lab ATP supply, six ATP molecules',
        visualId: 'atp_symbol', particlesPerPlacement: 6 },
    v_atpase: { id: 'v_atpase', displayName: 'V-ATPase', ariaLabel: 'ATP-powered proton pump', visualId: 'v_atpase',
        placementSize: { widthRem: 3.1, heightRem: 4.5 }, initialRotationDeg: 0, rotatable: true },

    water: {

        id:
            "water",

        displayName:
            "Water",

        ariaLabel:
            "Water molecule",

        visualId:
            "water_sphere",

        // One draggable water source represents a small sample.
        // Placement and simulation renderers both read this value
        // so the visible cluster does not collapse on simulation.
        particlesPerPlacement:
            12

    },

    sodium_ion: {

        id:
            "sodium_ion",

        displayName:
            "Sodium ion",

        ariaLabel:
            "Sodium ion",

        visualId:
            "sodium_ion_sphere"

    },

    chloride_ion: {

        id:
            "chloride_ion",

        displayName:
            "Chloride ion",

        ariaLabel:
            "Chloride ion",

        visualId:
            "chloride_ion_sphere"

    },

    potassium_ion: {

        id:
            "potassium_ion",

        displayName:
            "Potassium ion",

        ariaLabel:
            "Potassium ion",

        visualId:
            "potassium_ion_sphere"

    },

    calcium_ion: {

        id:
            "calcium_ion",

        displayName:
            "Calcium ion",

        ariaLabel:
            "Calcium ion",

        visualId:
            "calcium_ion_sphere"

    },

    sodium_chloride: {

        id:
            "sodium_chloride",

        displayName:
            "NaCl",

        ariaLabel:
            "Sodium chloride sample",

        visualId:
            "sodium_chloride_sample",

        particleComposition: {
            sodium_ion: 6,
            chloride_ion: 6
        }

    },

    calcium_chloride: {

        id:
            "calcium_chloride",

        displayName:
            "CaCl₂",

        ariaLabel:
            "Calcium chloride sample",

        visualId:
            "calcium_chloride_sample",

        particleComposition: {
            calcium_ion: 4,
            chloride_ion: 8
        }

    },

    potassium_chloride: {

        id:
            "potassium_chloride",

        displayName:
            "KCl",

        ariaLabel:
            "Potassium chloride sample",

        visualId:
            "potassium_chloride_sample",

        particleComposition: {
            potassium_ion: 6,
            chloride_ion: 6
        }

    },

    aquaporin: {

        id:
            "aquaporin",

        displayName:
            "Aquaporin",

        ariaLabel:
            "Aquaporin water channel",

        visualId:
            "aquaporin_channel",

        // The source art is vertical at 0°. These dimensions
        // give it a matching vertical placement boundary.
        placementSize: {
            widthRem: 3.1,
            heightRem: 4.5
        },

        // The vertically oriented source art begins in the
        // incorrect membrane orientation. Students rotate it
        // to span the membrane.
        initialRotationDeg:
            0,

        rotatable:
            true

    },

    potassium_channel: {

        id:
            "potassium_channel",

        displayName:
            "K⁺ Channel",

        ariaLabel:
            "Selective potassium ion channel",

        visualId:
            "potassium_channel",

        placementSize: {
            widthRem: 3.1,
            heightRem: 4.5
        },

        initialRotationDeg:
            0,

        rotatable:
            true

    }

};

export default ExperimentMaterialLibrary;
