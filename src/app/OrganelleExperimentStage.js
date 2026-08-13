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

import ExperimentPlacementEvaluator
    from "./ExperimentPlacementEvaluator.js";

import ParticleSimulationEngine
    from "./ParticleSimulationEngine.js";

import ParticleSimulationView
    from "./ParticleSimulationView.js";

import ResearchManager
    from "./ResearchManager.js";

import OrganelleExperimentSubmissionManager
    from "./OrganelleExperimentSubmissionManager.js";

import SaveManager
    from "./SaveManager.js";
import ProblemReportManager
    from "./ProblemReportManager.js";

const OrganelleExperimentStage = {

    titleElement: null,
    controlsElement: null,
    contentElement: null,

    activeExperiment: null,
    activeResolvedExperiment: null,
    isParticleSimulationRunning: false,

    isReviewMode: false,

    selectedProteinStatusElement: null,

    // --------------------------------------------------
    // Stop and remove the canvas overlay so the original
    // drag-and-drop workspace is interactive again.
    // --------------------------------------------------
    stopParticleSimulation() {

        ParticleSimulationView.clear();

        const simulationSurface =
            document.getElementById(
                "organelle-particle-simulation-surface"
            );

        simulationSurface?.classList.add(
            "hidden"
        );

        this.isParticleSimulationRunning =
            false;

        const simulationButton =
            this.controlsElement?.querySelector(
                '[data-action="simulate"]'
            );

        if (simulationButton) {
            simulationButton.textContent =
                "Simulate";

            simulationButton.setAttribute(
                "aria-pressed",
                "false"
            );
        }

    },

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

        const isReflectionControl =
            controlId === "reflection";

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

        button.addEventListener(
            "click",
            () => {

                this.handleControlAction(
                    controlId
                );

            }
        );

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

    const selectedProteinStatus =
        document.createElement("p");

    selectedProteinStatus.id =
        "organelle-experiment-selected-protein-status";

    selectedProteinStatus.className =
        "organelle-experiment-selected-protein-status";

    selectedProteinStatus.textContent =
        "Select a placed protein to rotate it.";

    selectedProteinStatus.setAttribute(
        "aria-live",
        "polite"
    );

    this.selectedProteinStatusElement =
        selectedProteinStatus;

    this.controlsElement.appendChild(
        selectedProteinStatus
    );

    this.updateSelectedProteinStatus();

},

    // --------------------------------------------------
// Handle active experiment controls
// --------------------------------------------------
handleControlAction(actionId) {

    if (this.isReviewMode) {
        return;
    }

    if (actionId === "reflection") {
        this.toggleReflectionPanel();

        return;
    }

    if (actionId === "simulate") {
        this.runSimulation();

        return;
    }

    if (actionId === "rotate") {
        const rotated =
            OrganelleExperimentPlacementController
                .rotateSelectedPlacement();

        if (!rotated) {
            this.showSimulationResult(
                {
                    title: "Select a Protein",
                    message: "Place and select an aquaporin in the membrane before rotating it."
                }
            );
        }

        return;
    }

    if (actionId === "labels") {
        this.togglePlacedLabels();

        return;
    }

    if (actionId === "submit") {
        this.submitExperiment();

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
    // Toggle placed labels without hiding their palette.
    // This makes particle movement easier to observe.
    // --------------------------------------------------
    togglePlacedLabels() {

        const stage =
            this.contentElement?.querySelector(
                ".membrane-transport-stage"
            );

        const labelsButton =
            this.controlsElement?.querySelector(
                '[data-action="labels"]'
            );

        if (!stage || !labelsButton) {
            return;
        }

        const labelsAreNowHidden =
            !stage.classList.contains(
                "membrane-transport-stage--labels-hidden"
            );

        stage.classList.toggle(
            "membrane-transport-stage--labels-hidden",
            labelsAreNowHidden
        );

        labelsButton.textContent =
            labelsAreNowHidden
                ? "Show Labels"
                : "Hide Labels";

        labelsButton.setAttribute(
            "aria-pressed",
            String(labelsAreNowHidden)
        );

    },

    // --------------------------------------------------
    // Keep the selected-protein indicator in sync with
    // the controller's individual placement selection.
    // --------------------------------------------------
    updateSelectedProteinStatus(placement = null) {

        const selectedPlacement =
            placement ??
            OrganelleExperimentPlacementController
                .getSelectedPlacement();

        if (!this.selectedProteinStatusElement) {
            return;
        }

        const material = selectedPlacement
            ? this.activeResolvedExperiment?.stage
                ?.materials
                ?.find(candidate =>
                    candidate.id ===
                    selectedPlacement.definitionId
                )
            : null;

        if (!material?.rotatable) {
            this.selectedProteinStatusElement.textContent =
                "Select a placed protein to rotate it.";

            return;
        }

        this.selectedProteinStatusElement.textContent =
            `Selected protein: ${material.displayName} (${selectedPlacement.rotationDeg ?? 0}Â°)`;

    },

    // --------------------------------------------------
    // Save the visible reflection text explicitly.
    // --------------------------------------------------
    saveReflectionDraft({
        announce = true
    } = {}) {

        const textarea =
            document.getElementById(
                "organelle-experiment-reflection-response"
            );

        if (!textarea?.dataset.reflectionId) {
            return false;
        }

        const saved =
            OrganelleExperimentAttemptManager
                .setReflectionResponse(
                    textarea.dataset.reflectionId,
                    textarea.value
                );

        if (announce && saved) {
            const status =
                document.querySelector(
                    ".organelle-experiment-reflection-status"
                );

            if (status) {
                status.textContent =
                    "Draft saved for this attempt.";
            }
        }

        return saved;

    },

    // --------------------------------------------------
    // Check label presence without revealing correctness.
    // --------------------------------------------------
    getMissingPlacedLabelIds() {

        const requiredLabelIds =
            this.activeResolvedExperiment
                ?.stage?.labels
                ?.map(label => label.id) ?? [];

        const placedLabelIds =
            new Set(
                this.getPlacementSnapshot()
                    .labels
                    .map(label => label.id)
            );

        return requiredLabelIds.filter(
            labelId =>
                !placedLabelIds.has(labelId)
        );

    },

    // --------------------------------------------------
    // Submit the current configuration for scoring.
    // Only a perfect submission completes research.
    // --------------------------------------------------
    submitExperiment() {

        const experiment =
            this.activeResolvedExperiment;

        if (!experiment?.assessment) {
            return;
        }

        this.saveReflectionDraft({
            announce: false
        });

        const missingLabelIds =
            this.getMissingPlacedLabelIds();

        if (missingLabelIds.length > 0) {
            const shouldContinue =
                window.confirm(
                    "You have not labeled all features on this diagram. Submit anyway?"
                );

            if (!shouldContinue) {
                return;
            }
        }

        const report =
            ExperimentPlacementEvaluator.evaluate(
                {
                    assessment:
                        experiment.assessment,

                    snapshot:
                        this.getPlacementSnapshot(),

                    reflectionResponses:
                        this.getAttemptSnapshot()
                            .reflectionResponses
                }
            );

        const placementSnapshot =
            this.getPlacementSnapshot();

        const attemptSnapshot =
            this.getAttemptSnapshot();

        if (!report.isPerfect) {
            OrganelleExperimentSubmissionManager
                .recordSubmission(
                    {
                        experiment,
                        report,
                        placementSnapshot,
                        attemptSnapshot,
                        completion: null
                    }
                );

            SaveManager.save();

            this.showSimulationResult(
                {
                    title:
                        "Submission Reviewed",

                    message:
                        `Score: ${report.scorePoints} / ${report.scoreMaximum} (${report.scorePercent}%). Revise your model and submit again when you are ready.`
                }
            );

            return;
        }

        const completion =
            ResearchManager.completeExperiment(
                experiment.id
            );

        OrganelleExperimentSubmissionManager
            .recordSubmission(
                {
                    experiment,
                    report,
                    placementSnapshot,
                    attemptSnapshot,
                    completion
                }
            );

        SaveManager.save();

        if (completion.completed) {
            this.showSimulationResult(
                {
                    title:
                        "Experiment Completed",

                    message:
                        `Perfect score: ${report.scorePoints} / ${report.scoreMaximum}. ${completion.xpAwarded} XP awarded.`
                }
            );

            return;
        }

        this.showSimulationResult(
            {
                title:
                    "Submission Reviewed",

                message:
                    completion.reason ===
                    "already-completed"
                        ? "This experiment was already completed."
                        : "Your model earned a perfect score, but its research reward could not be applied."
            }
        );

    },

    // --------------------------------------------------
    // Show or hide the current reflection panel
    regradeExperiment(experiment) {
        const submissions = OrganelleExperimentSubmissionManager.getSubmissions(experiment.id);
        const results = submissions.map(submission => ({ submission, report: ExperimentPlacementEvaluator.evaluate({
            assessment: experiment.assessment,
            snapshot: submission.placementSnapshot,
            reflectionResponses: submission.attemptSnapshot?.reflectionResponses
        }) }));
        const perfect = results.find(result => result.report.isPerfect);
        let completion = null;
        if (perfect) completion = ResearchManager.completeExperiment(experiment.id);
        const outcome = OrganelleExperimentSubmissionManager.applyRegrade({ experiment, results });
        SaveManager.save();
        return outcome;
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

        const integrityNotice =
            document.createElement("p");

        integrityNotice.className =
            "organelle-experiment-integrity-notice";

        integrityNotice.textContent =
            "Academic integrity: Build and explain your own model. Submitted reflections may be reviewed for substantial similarity to other students.™ work.";

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
                status.textContent =
                    "Draft has unsaved changes.";

            }
        );

        const saveButton =
            document.createElement("button");

        saveButton.type = "button";

        saveButton.className =
            "organelle-experiment-reflection-save-button";

        saveButton.textContent =
            "Save Draft";

        saveButton.addEventListener(
            "click",
            () => {

                this.saveReflectionDraft();

            }
        );

        panel.append(
            heading,
            prompt,
            integrityNotice,
            label,
            textarea,
            saveButton,
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

        this.stopParticleSimulation();

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
        this.stopParticleSimulation();

        OrganelleExperimentPlacementController.reset();

        OrganelleExperimentAttemptManager.reset();

        this.activeExperiment =
            null;

        this.activeResolvedExperiment =
            null;

        this.isReviewMode = false;

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
            "data-membrane-style",
            "phospholipid-bilayer"
        );

        membrane.setAttribute(
            "aria-label",
            "Membrane placement area"
        );

        OrganelleExperimentPlacementController
            .registerDropZone(
                membrane,
                "membrane"
            );

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

        const trash =
            document.createElement("div");

        trash.className =
            "organelle-experiment-trash";

        trash.dataset.experimentTrash = "true";

        trash.setAttribute(
            "aria-label",
            "Drag unwanted placed materials here to remove them from the simulation"
        );

        trash.title =
            "Drag unwanted placed materials here to remove them from the simulation";

        trash.textContent = "\u{1F5D1}";

        tray.append(
            heading,
            materials,
            trash
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

        this.isReviewMode = false;

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

        OrganelleExperimentPlacementController
            .onSelectionChanged =
                placement =>
                    this.updateSelectedProteinStatus(
                        placement
                    );

        this.titleElement.textContent =
            resolvedExperiment.title;

        this.renderControls(
            resolvedExperiment
        );

        this.stopParticleSimulation();
    

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
    // Render the latest saved submission without starting
    // an editable attempt or revealing an answer key.
    // --------------------------------------------------
    openReview(
        experiment,
        submission
    ) {

        if (!this.initialize()) {
            return;
        }

        if (!experiment) {
            this.clear();

            return;
        }

        this.stopParticleSimulation();

        this.activeExperiment = experiment;

        this.activeResolvedExperiment = {
            ...experiment,
            stage:
                ExperimentStageDefinitionResolver
                    .resolveStage(
                        experiment.stage
                    )
        };

        this.isReviewMode = true;

        this.titleElement.textContent =
            `${this.activeResolvedExperiment.title} - Submission Review`;

        this.controlsElement.replaceChildren();

        this.contentElement.replaceChildren();

        if (!submission) {
            const message =
                document.createElement("p");

            message.textContent =
                "No saved submission is available for this completed experiment. Future submitted attempts can be reviewed here.";

            this.contentElement.appendChild(
                message
            );

            return;
        }

        const submissions =
            OrganelleExperimentSubmissionManager
                .getSubmissions(experiment.id);

        const submissionIndex =
            Math.max(
                0,
                submissions.findIndex(candidate =>
                    candidate.id === submission.id
                )
            );

        const summary =
            document.createElement("section");

        const reviewControls =
            document.createElement("section");
        reviewControls.className =
            "organelle-experiment-review-controls";

        summary.className =
            "organelle-experiment-submission-summary";

        const score =
            document.createElement("p");

        score.textContent =
            `Submitted score: ${submission.scorePoints} / ${submission.scoreMaximum}`;

        const timestamp =
            document.createElement("p");

        timestamp.textContent =
            `Submitted: ${new Date(submission.submittedAtMs).toLocaleString()}`;

        summary.append(score, timestamp);

        if (submissions.length > 1) {
            const navigation =
                document.createElement("nav");

            navigation.className =
                "organelle-experiment-review-navigation";

            const position = document.createElement("span");
            position.textContent =
                `Attempt ${submissionIndex + 1} of ${submissions.length}`;

            const previous = document.createElement("button");
            previous.type = "button";
            previous.textContent = "Previous <-";
            previous.disabled = submissionIndex === 0;
            previous.addEventListener("click", () => {
                this.openReview(
                    experiment,
                    submissions[submissionIndex - 1]
                );
            });

            const next = document.createElement("button");
            next.type = "button";
            next.textContent = "Next ->";
            next.disabled =
                submissionIndex === submissions.length - 1;
            next.addEventListener("click", () => {
                this.openReview(
                    experiment,
                    submissions[submissionIndex + 1]
                );
            });

            navigation.append(previous, position, next);
            reviewControls.appendChild(navigation);
        }

        const failedCriteria =
            submission.report?.criteria?.filter(
                criterion => !criterion.passed
            ) ?? [];

        if (failedCriteria.length > 0) {
            const guidance =
                document.createElement("section");

            guidance.className =
                "organelle-experiment-review-guidance";

            const heading =
                document.createElement("h3");

            heading.textContent =
                "Concepts to revisit";

            const list =
                document.createElement("ul");

            const messages = [
                ...new Set(
                    failedCriteria.map(criterion =>
                        this.getCriterionFeedback(
                            this.activeResolvedExperiment,
                            criterion
                        )
                    ).filter(Boolean)
                )
            ];

            messages.forEach(message => {
                const item = document.createElement("li");
                item.textContent = message;
                list.appendChild(item);
            });

            guidance.append(heading, list);
            summary.appendChild(guidance);
        }

        this.contentElement.appendChild(summary);

        OrganelleExperimentPlacementController.start(
            this.activeResolvedExperiment
        );

        if (
            this.activeResolvedExperiment.stage?.template ===
            "membrane_transport"
        ) {
            const workspace =
                document.createElement("div");

            workspace.className =
                "organelle-experiment-workspace";

            workspace.appendChild(
                this.renderMembraneTransportStage()
            );

            this.contentElement.appendChild(workspace);

            OrganelleExperimentPlacementController
                .restoreSnapshot(
                    submission.placementSnapshot
                );
        }

        const actions = document.createElement("div");
        actions.className = "organelle-experiment-review-actions";

        const regrade = document.createElement("button");
        regrade.type = "button";
        regrade.textContent = "Regrade assessment";
        regrade.addEventListener("click", () => {
            const outcome = this.regradeExperiment(experiment);
            this.showSimulationResult({ title: "Assessment Regraded", message: outcome ? `Highest score: ${outcome.best.report.scorePoints} / ${outcome.best.report.scoreMaximum}.` : "No saved submission is available to regrade." });
        });

        const report = document.createElement("button");
        report.type = "button";
        report.textContent = "Report a grading issue";
        report.addEventListener("click", () => {
            this.openProblemReportOverlay(experiment, submission);
        });

        actions.append(regrade, report);
        reviewControls.appendChild(actions);
        this.contentElement.appendChild(reviewControls);

    },

    openProblemReportOverlay(experiment, submission) {
        const overlay = document.createElement("div");
        overlay.className = "organelle-problem-report-overlay";
        const dialog = document.createElement("form");
        dialog.className = "organelle-problem-report-dialog";
        dialog.innerHTML = `<h3>Report a grading issue</h3><label>Issue type<select name="issueType"><option value="reflection">Reflection scoring</option><option value="placement">Placement, label, or orientation</option><option value="interface">Interface or saving</option><option value="other">Other</option></select></label><label>Briefly report the problem you want your instructor to review.<textarea name="message" required maxlength="1500"></textarea></label><div class="organelle-problem-report-actions"><button type="submit">Submit report</button><button type="button" data-cancel>Cancel</button></div>`;
        dialog.addEventListener("submit", async event => {
            event.preventDefault();
            const values = new FormData(dialog);
            try {
                await ProblemReportManager.send(ProblemReportManager.createPayload({ experiment, submission, issueType: values.get("issueType"), message: values.get("message") }));
                overlay.remove();
                this.showSimulationResult({ title: "Report Sent", message: "Your selected submission was sent to your instructor for review." });
            } catch (error) { console.error("Problem report failed", error); }
        });
        dialog.querySelector("[data-cancel]").addEventListener("click", () => overlay.remove());
        overlay.appendChild(dialog);
        this.contentElement.appendChild(overlay);
        dialog.querySelector("textarea").focus();
    },

    // --------------------------------------------------
    // Translate reusable criterion categories into a
    // lab-authored concept cue; never reveal an answer key.
    // --------------------------------------------------
    getCriterionFeedback(experiment, criterion) {

        const feedback =
            experiment?.assessment?.feedback ?? {};

        const id = String(criterion?.id ?? "");

        if (/rotation|orientation|spans/.test(id)) {
            return feedback.membraneSpanningOrientation;
        }

        if (/gradient|hypertonic|hypotonic|cytosol|extracellular/.test(id)) {
            return feedback.drivingGradient ?? feedback.destinationSide;
        }

        if (/reflection/.test(criterion?.type ?? "")) {
            return feedback.movingSubstance ?? feedback.energyRequirement;
        }

        return feedback.destinationSide;

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
