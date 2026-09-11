// --------------------------------------------------
// ExperimentMaterialVisualLibrary.js
// Creates reusable visual elements for experiment materials
// --------------------------------------------------

const ExperimentMaterialVisualLibrary = {

    definitions: {

        hydrogen_ion_sphere: { id: 'hydrogen_ion_sphere', cssClass: 'proton', shape: 'sphere', simulationColor: '#ff8c42', text: 'H⁺' },
        v_atpase: { id: 'v_atpase', cssClass: 'potassium-channel',
            assetPath: './public/assets/experiments/proteins/v-atpase.svg', altText: 'V-ATPase with ATP-binding head and proton-transport arrow' },
        sodium_hydrogen_exchanger: { id: 'sodium_hydrogen_exchanger', cssClass: 'potassium-channel',
            assetPath: './public/assets/experiments/proteins/sodium-hydrogen-exchanger.svg',
            altText: 'Sodium proton antiporter with opposing transport arrows' },
        chloride_channel: { id: 'chloride_channel', cssClass: 'potassium-channel',
            assetPath: './public/assets/experiments/proteins/chloride-channel.svg',
            altText: 'Selective chloride channel with a lumen-directed arrow' },

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

        potassium_ion_sphere: {
            id: "potassium_ion_sphere",
            cssClass: "potassium",
            shape: "sphere",
            simulationColor: "#f2b84b"
        },

        sodium_chloride_sample: {
            id: "sodium_chloride_sample",
            cssClass: "sodium-chloride-sample",
            shape: "formula",
            text: "NaCl",
            colors: ["#a92f4e", "#5ee38d"]
        },

        calcium_chloride_sample: {
            id: "calcium_chloride_sample",
            cssClass: "calcium-chloride-sample",
            shape: "formula",
            text: "CaCl₂",
            colors: ["#b692eb", "#5ee38d"]
        },

        potassium_chloride_sample: {
            id: "potassium_chloride_sample",
            cssClass: "potassium-chloride-sample",
            shape: "formula",
            text: "KCl",
            colors: ["#f2b84b", "#5ee38d"]
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
    "./public/assets/experiments/proteins/aquaporin.png",

            altText:
                "Aquaporin water channel"
        },

        potassium_channel: {

            id:
                "potassium_channel",

            cssClass:
                "potassium-channel",

            assetPath:
                "./public/assets/experiments/proteins/potassium-channel.svg",

            altText:
                "Selective potassium ion channel"
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
                : definition.altText ?? "Experiment material";
        }

        return visual;

    }

};

export default ExperimentMaterialVisualLibrary;
