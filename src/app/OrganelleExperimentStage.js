// --------------------------------------------------
// OrganelleExperimentStage.js
// Renders the currently open organelle experiment
// --------------------------------------------------

import OrganelleExperimentAttemptManager
    from "./OrganelleExperimentAttemptManager.js";

import OrganelleExperimentPlacementController
    from "./OrganelleExperimentPlacementController.js";

import ExperimentStageDefinitionResolver
    from "./ExperimentStageDefinitionResolver.js";

import ParticleSimulationEngine
    from "./ParticleSimulationEngine.js";

import ParticleSimulationView
    from "./ParticleSimulationView.js";

const OrganelleExperimentStage = {

    titleElement: null,
    controlsElement: null,
    contentElement: null,

    activeExperiment: null,
    activeResolvedExperiment: null,
    isParticleSimulationRunning: false,

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
// Render experiment controls
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

        const isResetControl =
            controlId === "reset";

        const isReflectionControl =
            controlId === "reflection" &&
            Boolean(
                experiment.assessment?.reflection
            );

        const isSimulateControl =
            controlId === "simulate" &&
            Boolean(
                experiment.simulation?.modelId
            );

        button.disabled =
            !isResetControl &&
            !isReflectionControl &&
            !isSimulateControl;

        if (
            isResetControl ||
            isReflectionControl ||
            isSimulateControl
        ) {
            button.addEventListener(
                "click",
                () => {

                    this.handleControlAction(
                        controlId
                    );

                }
            );
        }

        if (isReflectionControl) {
            button.setAttribute(
                "aria-controls",
                "organelle-experiment-reflection"
            );

            button.setAttribute(
                "aria-expanded",
                "false"
            );
        }

        this.controlsElement.appendChild(
            button
        );

    });

},

    // --------------------------------------------------
// Handle active experiment controls
// --------------------------------------------------
handleControlAction(actionId) {

    if (actionId === "reflection") {
        this.toggleReflectionPanel();

        return;
    }

    if (actionId === "simulate") {
        this.runSimulation();

        return;
    }

    if (actionId !== "reset") {
        return;
    }

    const shouldReset =
        window.confirm(
            "Reset this experiment? All current placements and responses will be cleared. This attempt will not be recorded."
        );

    if (!shouldReset) {
        return;
    }

    if (!this.activeExperiment) {
        return;
    }

    this.open(
        this.activeExperiment
    );

},

    // --------------------------------------------------
    // Show or hide the current reflection panel
    // --------------------------------------------------
    toggleReflectionPanel() {

        const panel =
            document.getElementById(
                "organelle-experiment-reflection"
            );

        const reflectionButton =
            this.controlsElement.querySelector(
                '[data-action="reflection"]'
            );

        if (!panel) {
            return;
        }

        const shouldOpen =
            panel.classList.contains(
                "hidden"
            );

        panel.classList.toggle(
            "hidden",
            !shouldOpen
        );

        panel.setAttribute(
            "aria-hidden",
            String(!shouldOpen)
        );

        reflectionButton?.setAttribute(
            "aria-expanded",
            String(shouldOpen)
        );

        if (shouldOpen) {
            panel.querySelector("textarea")?.focus();
        }

    },

    // --------------------------------------------------
    // Build one reusable reflection form
    // --------------------------------------------------
    createReflectionPanel(experiment) {

        const reflection =
            experiment.assessment?.reflection;

        if (!reflection) {
            return null;
        }

        const panel =
            document.createElement("section");

        panel.id =
            "organelle-experiment-reflection";

        panel.className =
            "organelle-experiment-reflection hidden";

        panel.setAttribute(
            "aria-hidden",
            "true"
        );

        const heading =
            document.createElement("h3");

        heading.textContent =
            "Reflection";

        const prompt =
            document.createElement("p");

        prompt.className =
            "organelle-experiment-reflection-prompt";

        prompt.textContent =
            reflection.prompt;

        const label =
            document.createElement("label");

        label.htmlFor =
            "organelle-experiment-reflection-response";

        label.textContent =
            "Your explanation";

        const textarea =
            document.createElement("textarea");

        textarea.id =
            "organelle-experiment-reflection-response";

        textarea.rows =
            5;

        textarea.dataset.reflectionId =
            reflection.id;

        textarea.value =
            OrganelleExperimentAttemptManager
                .getReflectionResponse(
                    reflection.id
                );

        const status =
            document.createElement("p");

        status.className =
            "organelle-experiment-reflection-status";

        status.setAttribute(
            "aria-live",
            "polite"
        );

        textarea.addEventListener(
            "input",
            () => {

                OrganelleExperimentAttemptManager
                    .setReflectionResponse(
                        reflection.id,
                        textarea.value
                    );

                status.textContent =
                    "Draft saved for this attempt.";

            }
        );

        panel.append(
            heading,
            prompt,
            label,
            textarea,
            status
        );

        return panel;

    },

    // --------------------------------------------------
// Build an initially hidden simulation-result panel
// --------------------------------------------------
createSimulationResultPanel() {

    const panel =
        document.createElement("section");

    panel.id =
        "organelle-experiment-simulation-result";

    panel.className =
        "organelle-experiment-simulation-result hidden";

    panel.setAttribute(
        "aria-hidden",
        "true"
    );

    panel.setAttribute(
        "aria-live",
        "polite"
    );

    const heading =
        document.createElement("h3");

    heading.id =
        "organelle-experiment-simulation-title";

    const message =
        document.createElement("p");

    message.id =
        "organelle-experiment-simulation-message";

    panel.append(
        heading,
        message
    );

    return panel;

},

// --------------------------------------------------
// Show one neutral simulation status or outcome
// --------------------------------------------------
showSimulationResult({
    title,
    message
}) {

    const panel =
        document.getElementById(
            "organelle-experiment-simulation-result"
        );

    if (!panel) {
        return;
    }

    const heading =
        panel.querySelector(
            "#organelle-experiment-simulation-title"
        );

    const messageElement =
        panel.querySelector(
            "#organelle-experiment-simulation-message"
        );

    heading.textContent =
        title;

    messageElement.textContent =
        message;

    panel.classList.remove(
        "hidden"
    );

    panel.setAttribute(
        "aria-hidden",
        "false"
    );

},

// --------------------------------------------------
// Start or stop the visible particle simulation.
// Simulation is exploratory: it never grades or
// requires labels or a reflection response.
// --------------------------------------------------
runSimulation() {

    const experiment =
        this.activeResolvedExperiment;

    if (
        !experiment?.simulation?.modelId
    ) {
        return;
    }

    const simulationButton =
        this.controlsElement.querySelector(
            '[data-action="simulate"]'
        );

    if (this.isParticleSimulationRunning) {

        ParticleSimulationView.stop();

        this.isParticleSimulationRunning =
            false;

        simulationButton.textContent =
            "Simulate";

        simulationButton.setAttribute(
            "aria-pressed",
            "false"
        );

        return;
    }

    const simulationSurface =
        document.getElementById(
            "organelle-particle-simulation-surface"
        );

    if (!simulationSurface) {
        console.warn(
            "OrganelleExperimentStage: particle simulation surface not found"
        );

        return;
    }

    const initialState =
        ParticleSimulationEngine
            .createInitialState(
                {
                    simulation:
                        experiment.simulation,

                    snapshot:
                        this.getPlacementSnapshot()
                }
            );

    simulationSurface.classList.remove(
        "hidden"
    );

    if (
        !ParticleSimulationView.mount(
            simulationSurface
        )
    ) {
        return;
    }

    ParticleSimulationView.start(
        initialState
    );

    OrganelleExperimentAttemptManager
        .markSimulationRun();

    this.isParticleSimulationRunning =
        true;

    simulationButton.textContent =
        "Stop Simulation";

    simulationButton.setAttribute(
        "aria-pressed",
        "true"
    );

},

    // --------------------------------------------------
    // Clear the active experiment stage
    // --------------------------------------------------
    clear() {

        if (!this.initialize()) {
            return;
        }
        ParticleSimulationView.clear();

this.isParticleSimulationRunning =
    false;

        OrganelleExperimentPlacementController.reset();

        OrganelleExperimentAttemptManager.reset();

        this.activeExperiment =
            null;

        this.activeResolvedExperiment =
            null;

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

        const sideA =
            document.createElement("section");

        sideA.className =
            "membrane-transport-compartment";

        sideA.setAttribute(
            "aria-label",
            "Experiment side A placement area"
        );

        OrganelleExperimentPlacementController
            .registerDropZone(
                sideA,
                "side_a"
            );

        const membrane =
            document.createElement("div");

        membrane.className =
            "membrane-transport-bilayer";

        membrane.setAttribute(
            "aria-label",
            "Membrane placement area"
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

                lipid.appendChild(
                    part
                );

            });

            membrane.appendChild(
                lipid
            );

        }

        const sideB =
            document.createElement("section");

        sideB.className =
            "membrane-transport-compartment";

        sideB.setAttribute(
            "aria-label",
            "Experiment side B placement area"
        );

        OrganelleExperimentPlacementController
            .registerDropZone(
                sideB,
                "side_b"
            );

        const simulationSurface =
    document.createElement("div");

simulationSurface.id =
    "organelle-particle-simulation-surface";

simulationSurface.className =
    "organelle-particle-simulation-surface hidden";

simulationSurface.setAttribute(
    "aria-label",
    "Particle simulation"
);

stage.append(
    sideA,
    membrane,
    sideB,
    simulationSurface
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

        this.activeExperiment =
            experiment;

        const resolvedExperiment = {

            ...experiment,

            stage:
                ExperimentStageDefinitionResolver
                    .resolveStage(
                        experiment.stage
                    )

        };

        this.activeResolvedExperiment =
            resolvedExperiment;

        OrganelleExperimentAttemptManager.start(
            resolvedExperiment.id
        );

        OrganelleExperimentPlacementController.start(
            resolvedExperiment
        );

        this.titleElement.textContent =
            resolvedExperiment.title;

        this.renderControls(
            resolvedExperiment
        );

        ParticleSimulationView.clear();

this.isParticleSimulationRunning =
    false;
    

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
            resolvedExperiment.stage?.template ===
            "membrane_transport"
        ) {
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
        }

        const reflectionPanel =
            this.createReflectionPanel(
                resolvedExperiment
            );

        if (reflectionPanel) {
            this.contentElement.appendChild(
                reflectionPanel
            );
        }

        const simulationPanel =
    this.createSimulationResultPanel();

this.contentElement.appendChild(
    simulationPanel
);

    },

    // --------------------------------------------------
    // Read temporary placement data for future grading
    // --------------------------------------------------
    getPlacementSnapshot() {

        return OrganelleExperimentPlacementController
            .getPlacementSnapshot();

    },

    // --------------------------------------------------
    // Read temporary reflection and simulation state
    // --------------------------------------------------
    getAttemptSnapshot() {

        return OrganelleExperimentAttemptManager
            .getSnapshot();

    }

};

export default OrganelleExperimentStage;