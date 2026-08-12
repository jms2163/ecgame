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
            "water_sphere"

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

        // The source art is horizontal. Start it vertical
        // so students must rotate it to span the membrane.
        initialRotationDeg:
            0,

        rotatable:
            true

    }

};

export default ExperimentMaterialLibrary;
