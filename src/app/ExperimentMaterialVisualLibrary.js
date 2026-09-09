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
            shape: "sphere",
            simulationColor: "#58b8ff"

        },

        sodium_ion_sphere: {

            id:
                "sodium_ion_sphere",

            cssClass:
                "sodium",
            shape: "sphere",
            simulationColor: "#a92f4e"

        },

        chloride_ion_sphere: {

            id:
                "chloride_ion_sphere",

            cssClass:
                "chloride",
            shape: "sphere",
            simulationColor: "#5ee38d"

        },

        calcium_ion_sphere: {
            id: "calcium_ion_sphere",
            cssClass: "calcium",
            shape: "sphere",
            simulationColor: "#b692eb"
        },

        urea_sphere: {
            id: "urea_sphere",
            cssClass: "urea",
            shape: "sphere",
            simulationColor: "#ecc994"
        },

        protein_sphere: {
            id: "protein_sphere",
            cssClass: "protein",
            shape: "sphere",
            simulationColor: "#d989b5",
            simulationRadius: 24
        },

        carbon_dioxide_molecule: {
            id: "carbon_dioxide_molecule",
            cssClass: "carbon-dioxide",
            shape: "linear_atoms",
            text: "CO₂",
            atomColors: ["#ed5555", "#292932", "#ed5555"]
        },

        oxygen_molecule: {
            id: "oxygen_molecule",
            cssClass: "oxygen",
            shape: "linear_atoms",
            text: "O₂",
            atomColors: ["#ed5555", "#ed5555"]
        },

        glucose_ring: {
            id: "glucose_ring",
            cssClass: "glucose",
            shape: "ring",
            sides: 6,
            colors: ["#a5f5b1", "#25894c"]
        },

        fructose_ring: {
            id: "fructose_ring",
            cssClass: "fructose",
            shape: "ring",
            sides: 5,
            colors: ["#a5f5b1", "#25894c"]
        },

        atp_symbol: {
            id: "atp_symbol",
            cssClass: "atp",
            shape: "symbol",
            text: "ATP",
            simulationColor: "#ffe36a"
        },

        cholesterol_steroid: {
            id: "cholesterol_steroid",
            cssClass: "cholesterol",
            shape: "steroid",
            simulationColor: "#d8ae4e"
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

        if (definition.simulationColor) {
            visual.style.setProperty(
                "--material-color",
                definition.simulationColor
            );
        }

        if (definition.colors) {
            visual.style.setProperty(
                "--material-color-start",
                definition.colors[0]
            );
            visual.style.setProperty(
                "--material-color-end",
                definition.colors[1]
            );
        }

        if (definition.text) {
            visual.textContent =
                definition.text;
        }

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
