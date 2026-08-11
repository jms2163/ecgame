// --------------------------------------------------
// OrganelleExperimentStage.js
// Renders the currently open organelle experiment
// --------------------------------------------------

import OrganelleExperimentPlacementController
    from "./OrganelleExperimentPlacementController.js";

import ExperimentStageDefinitionResolver
    from "./ExperimentStageDefinitionResolver.js";

const OrganelleExperimentStage = {

    titleElement: null,
    controlsElement: null,
    contentElement: null,

    // --------------------------------------------------
    // Find experiment-stage elements
    // --------------------------------------------------
    initialize() {

        if (
            this.titleElement &&
            this.controlsElement &&
            this.contentElement
        ) {
            return true;
        }

        this.titleElement =
            document.getElementById(
                "organelle-experiment-stage-title"
            );

        this.controlsElement =
            document.getElementById(
                "organelle-experiment-stage-controls"
            );

        this.contentElement =
            document.getElementById(
                "organelle-experiment-stage-content"
            );

        if (
            !this.titleElement ||
            !this.controlsElement ||
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
    // Render inactive experiment controls
    // --------------------------------------------------
    renderControls(experiment) {

        this.controlsElement.replaceChildren();

        const controls =
            experiment.stage?.controls ?? [];

        controls.forEach(control => {

            const controlId =
                typeof control === "string"
                    ? control
                    : control.id;

            const button =
                document.createElement("button");

            button.type =
                "button";

            button.className =
                "organelle-experiment-control";

            button.dataset.action =
                controlId;

            button.textContent =
                control.label ??
                controlId;

            // Enabled in later experiment milestones.
            button.disabled = true;

            this.controlsElement.appendChild(
                button
            );

        });

    },

    // --------------------------------------------------
    // Clear the active experiment stage
    // --------------------------------------------------
    clear() {

        if (!this.initialize()) {
            return;
        }

        OrganelleExperimentPlacementController.reset();

        this.titleElement.textContent =
            "No Experiment Open";

        this.controlsElement.replaceChildren();

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
    renderMembraneTransportStage() {

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

        extracellular.setAttribute(
            "aria-label",
            "Extracellular placement area"
        );

        OrganelleExperimentPlacementController
            .registerDropZone(
                extracellular,
                "extracellular"
            );

        const membrane =
            document.createElement("div");

        membrane.className =
            "membrane-transport-bilayer";

        membrane.setAttribute(
            "aria-label",
            "Plasma membrane placement area"
        );

        OrganelleExperimentPlacementController
            .registerDropZone(
                membrane,
                "membrane"
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

            [
                "membrane-lipid-head",
                "membrane-lipid-tail",
                "membrane-lipid-tail",
                "membrane-lipid-head"
            ].forEach(className => {

                const part =
                    document.createElement("span");

                part.className =
                    className;

                lipid.appendChild(part);

            });

            membrane.appendChild(
                lipid
            );

        }

        const cytosol =
            document.createElement("section");

        cytosol.className =
            "membrane-transport-compartment";

        cytosol.setAttribute(
            "aria-label",
            "Cytosol placement area"
        );

        OrganelleExperimentPlacementController
            .registerDropZone(
                cytosol,
                "cytosol"
            );

        stage.append(
            extracellular,
            membrane,
            cytosol
        );

        return stage;

    },

    // --------------------------------------------------
    // Render the draggable materials tray
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

        (
            experiment.stage?.materials ?? []
        ).forEach(material => {

            materials.appendChild(
                OrganelleExperimentPlacementController
                    .createMaterialSource(
                        material
                    )
            );

        });

        tray.append(
            heading,
            materials
        );

        return tray;

    },

    // --------------------------------------------------
    // Render the draggable labels tray
    // --------------------------------------------------
    renderLabelTray(experiment) {

        const tray =
            document.createElement("aside");

        tray.className =
            "organelle-experiment-label-tray";

        const heading =
            document.createElement("h3");

        heading.textContent =
            "Labels";

        const labels =
            document.createElement("div");

        labels.className =
            "organelle-experiment-label-list";

        (
            experiment.stage?.labels ?? []
        ).forEach(labelData => {

            labels.appendChild(
                OrganelleExperimentPlacementController
                    .createLabelSource(
                        labelData
                    )
            );

        });

        tray.append(
            heading,
            labels
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

        const resolvedExperiment = {

            ...experiment,

            stage:
                ExperimentStageDefinitionResolver
                    .resolveStage(
                        experiment.stage
                    )

        };

        OrganelleExperimentPlacementController.start(
            resolvedExperiment
        );

        this.titleElement.textContent =
            resolvedExperiment.title;

        this.renderControls(
            resolvedExperiment
        );

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
            resolvedExperiment.objective ??
            "Complete the experiment objective.";

        this.contentElement.append(
            objectiveLabel,
            objective
        );

        if (
            resolvedExperiment.stage?.template !==
            "membrane_transport"
        ) {
            return;
        }

        const activityLayout =
            document.createElement("div");

        activityLayout.className =
            "organelle-experiment-activity-layout";

        const workspace =
            document.createElement("div");

        workspace.className =
            "organelle-experiment-workspace";

        workspace.append(
            this.renderMembraneTransportStage(),
            this.renderMaterialTray(
                resolvedExperiment
            )
        );

        activityLayout.append(
            this.renderLabelTray(
                resolvedExperiment
            ),
            workspace
        );

        this.contentElement.appendChild(
            activityLayout
        );

    },

    // --------------------------------------------------
    // Read temporary placement data for future grading
    // --------------------------------------------------
    getPlacementSnapshot() {

        return OrganelleExperimentPlacementController
            .getPlacementSnapshot();

    }

};

export default OrganelleExperimentStage;