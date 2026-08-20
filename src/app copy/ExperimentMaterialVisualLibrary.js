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
                "water",
            simulationColor: "#58b8ff"

        },

        sodium_ion_sphere: {

            id:
                "sodium_ion_sphere",

            cssClass:
                "sodium",
            simulationColor: "#a92f4e"

        },

        chloride_ion_sphere: {

            id:
                "chloride_ion_sphere",

            cssClass:
                "chloride",
            simulationColor: "#5ee38d"

        },

        aquaporin_channel: {

            id:
                "aquaporin_channel",

            cssClass:
                "aquaporin",

            assetPath:
    "./public/assets/experiments/proteins/aquaporin.png"
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
            definition.assetPath
                ? document.createElement("img")
                : document.createElement("span");

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

        if (definition.assetPath) {
            visual.src = definition.assetPath;

            visual.alt = decorative
                ? ""
                : "Aquaporin water channel";
        }

        return visual;

    }

};

export default ExperimentMaterialVisualLibrary;
