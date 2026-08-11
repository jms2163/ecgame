// --------------------------------------------------
// OrganelleExperimentStage.js
// Renders the currently open organelle experiment
// --------------------------------------------------

const OrganelleExperimentStage = {

    titleElement: null,
    contentElement: null,

    // --------------------------------------------------
    // Find experiment-stage elements
    // --------------------------------------------------
    initialize() {

        if (
            this.titleElement &&
            this.contentElement
        ) {
            return true;
        }

        this.titleElement =
            document.getElementById(
                "organelle-experiment-stage-title"
            );

        this.contentElement =
            document.getElementById(
                "organelle-experiment-stage-content"
            );

        if (
            !this.titleElement ||
            !this.contentElement
        ) {
            console.warn(
                "OrganelleExperimentStage: stage display elements not found"
            );

            return false;
        }

        return true;

    },

    // --------------------------------------------------
    // Clear the active experiment stage
    // --------------------------------------------------
    clear() {

        if (!this.initialize()) {
            return;
        }

        this.titleElement.textContent =
            "No Experiment Open";

        this.contentElement.replaceChildren();

        const message =
            document.createElement("p");

        message.textContent =
            "Select an available experiment from the organelle panel to begin.";

        this.contentElement.appendChild(
            message
        );

    },

    // --------------------------------------------------
    // Render one membrane-transport experiment stage
    // --------------------------------------------------
    renderMembraneTransportStage(experiment) {

        const stage =
            document.createElement("section");

        stage.className =
            "membrane-transport-stage";

        stage.dataset.template =
            "membrane_transport";

        const extracellular =
            document.createElement("section");

        extracellular.className =
            "membrane-transport-compartment";

        extracellular.dataset.compartment =
            "extracellular";

        const extracellularHeading =
            document.createElement("h3");

        extracellularHeading.textContent =
            "Extracellular Solution";

        extracellular.appendChild(
            extracellularHeading
        );

        const membrane =
            document.createElement("div");

        membrane.className =
            "membrane-transport-bilayer";

        membrane.setAttribute(
            "aria-label",
            "Plasma membrane lipid bilayer"
        );

        for (
            let lipidIndex = 0;
            lipidIndex < 12;
            lipidIndex++
        ) {

            const lipid =
                document.createElement("div");

            lipid.className =
                "membrane-transport-lipid";

            const outerHead =
                document.createElement("span");

            outerHead.className =
                "membrane-lipid-head";

            const outerTail =
                document.createElement("span");

            outerTail.className =
                "membrane-lipid-tail";

            const innerTail =
                document.createElement("span");

            innerTail.className =
                "membrane-lipid-tail";

            const innerHead =
                document.createElement("span");

            innerHead.className =
                "membrane-lipid-head";

            lipid.append(
                outerHead,
                outerTail,
                innerTail,
                innerHead
            );

            membrane.appendChild(
                lipid
            );

        }

        const cytoplasm =
            document.createElement("section");

        cytoplasm.className =
            "membrane-transport-compartment";

        cytoplasm.dataset.compartment =
            "cytoplasm";

        const cytoplasmHeading =
            document.createElement("h3");

        cytoplasmHeading.textContent =
            "Cytoplasm";

        cytoplasm.appendChild(
            cytoplasmHeading
        );

        stage.append(
            extracellular,
            membrane,
            cytoplasm
        );

        return stage;

    },

    // --------------------------------------------------
    // Render the experiment material tray
    // --------------------------------------------------
    renderMaterialTray(experiment) {

        const tray =
            document.createElement("section");

        tray.className =
            "organelle-experiment-material-tray";

        const heading =
            document.createElement("h3");

        heading.textContent =
            "Materials";

        const materials =
            document.createElement("div");

        materials.className =
            "organelle-experiment-material-list";

        const stageMaterials =
            experiment.stage?.materials ?? [];

        stageMaterials.forEach(material => {

            const materialCard =
                document.createElement("article");

            materialCard.className =
                "organelle-experiment-material";

            materialCard.dataset.materialId =
                material.id;

            const symbol =
                document.createElement("span");

            symbol.className =
                "organelle-experiment-material-symbol";

            symbol.textContent =
                material.symbol;

            const name =
                document.createElement("strong");

            name.textContent =
                material.label;

            const description =
                document.createElement("span");

            description.className =
                "organelle-experiment-material-description";

            description.textContent =
                material.description;

            materialCard.append(
                symbol,
                name,
                description
            );

            materials.appendChild(
                materialCard
            );

        });

        tray.append(
            heading,
            materials
        );

        return tray;

    },

    // --------------------------------------------------
    // Open one experiment on the stage
    // --------------------------------------------------
    open(experiment) {

        if (!this.initialize()) {
            return;
        }

        if (!experiment) {
            this.clear();

            return;
        }

        this.titleElement.textContent =
            experiment.title;

        this.contentElement.replaceChildren();

        const objectiveLabel =
            document.createElement("p");

        objectiveLabel.className =
            "organelle-experiment-objective-label";

        objectiveLabel.textContent =
            "Main Objective";

        const objective =
            document.createElement("p");

        objective.className =
            "organelle-experiment-objective";

        objective.textContent =
            experiment.objective ??
            "Complete the experiment objective.";

        this.contentElement.append(
            objectiveLabel,
            objective
        );

        if (
            experiment.stage?.template ===
            "membrane_transport"
        ) {
            this.contentElement.append(
                this.renderMembraneTransportStage(
                    experiment
                ),

                this.renderMaterialTray(
                    experiment
                )
            );

            return;
        }

        const message =
            document.createElement("p");

        message.className =
            "organelle-experiment-stage-message";

        message.textContent =
            "No stage template is defined for this experiment.";

        this.contentElement.appendChild(
            message
        );

    }

};

export default OrganelleExperimentStage;