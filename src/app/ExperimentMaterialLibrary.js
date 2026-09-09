// --------------------------------------------------
// ExperimentMaterialLibrary.js
// Shared definitions for draggable experiment materials
// --------------------------------------------------

const ExperimentMaterialLibrary = {

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

    }

};

export default ExperimentMaterialLibrary;
