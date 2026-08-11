// --------------------------------------------------
// ExperimentMaterialVisualLibrary.js
// Creates reusable visual elements for experiment materials
// --------------------------------------------------

const ExperimentMaterialVisualLibrary = {

    definitions: {

        water_sphere: {

            id:
                "water_sphere",

            cssClass:
                "water"

        },

        sodium_ion_sphere: {

            id:
                "sodium_ion_sphere",

            cssClass:
                "sodium"

        },

        chloride_ion_sphere: {

            id:
                "chloride_ion_sphere",

            cssClass:
                "chloride"

        },

        aquaporin_channel: {

            id:
                "aquaporin_channel",

            cssClass:
                "aquaporin"

        }

    },

    // --------------------------------------------------
    // Create one visual element from a reusable visual ID
    // --------------------------------------------------
    create(
        visualId,
        {
            decorative = true
        } = {}
    ) {

        const definition =
            this.definitions[visualId];

        if (!definition) {
            console.warn(
                `ExperimentMaterialVisualLibrary: unknown visual "${visualId}"`
            );

            return null;
        }

        const visual =
            document.createElement("span");

        visual.className =
            "organelle-experiment-particle " +
            `organelle-experiment-particle--${definition.cssClass}`;

        if (decorative) {
            visual.setAttribute(
                "aria-hidden",
                "true"
            );
        }

        visual.dataset.visualId =
            definition.id;

        return visual;

    }

};

export default ExperimentMaterialVisualLibrary;