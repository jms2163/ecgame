// --------------------------------------------------
// OrganelleExperimentPanel.js
// Renders and runs experiments for one organelle
// --------------------------------------------------

import CellMapLayout from "./CellMapLayout.js";
import OrganelleExperimentLibrary
    from "./OrganelleExperimentLibrary.js";
import ResearchManager from "./ResearchManager.js";

const OrganelleExperimentPanel = {

    focusNameElement: null,
    summaryElement: null,
    actionMessageElement: null,
    listElement: null,

    currentOrganelleId: null,
    onRunExperiment: null,

    // --------------------------------------------------
    // Find Organelle Lab display elements
    // --------------------------------------------------
    initialize() {

        if (
            this.focusNameElement &&
            this.summaryElement &&
            this.actionMessageElement &&
            this.listElement
        ) {
            return true;
        }

        this.focusNameElement =
            document.getElementById(
                "organelle-lab-focus-name"
            );

        this.summaryElement =
            document.getElementById(
                "organelle-lab-focus-summary"
            );

        this.actionMessageElement =
            document.getElementById(
                "organelle-lab-action-message"
            );

        this.listElement =
            document.getElementById(
                "organelle-experiment-list"
            );

        if (
            !this.focusNameElement ||
            !this.summaryElement ||
            !this.actionMessageElement ||
            !this.listElement
        ) {
            console.warn(
                "OrganelleExperimentPanel: Organelle Lab display elements not found"
            );

            return false;
        }

        return true;

    },

    // --------------------------------------------------
    // Read an organelle's map label
    // --------------------------------------------------
    getOrganelleLabel(organelleId) {

        const feature =
            CellMapLayout.features.find(
                candidate =>
                    candidate.id === organelleId
            );

        return feature?.label ??
            "Unknown Organelle";

    },

    // --------------------------------------------------
    // Read experiments belonging to one organelle
    // --------------------------------------------------
    getExperimentsForOrganelle(organelleId) {

        return Object.values(
            OrganelleExperimentLibrary
        ).filter(
            experiment =>
                experiment.organelleId ===
                organelleId
        );

    },

    // --------------------------------------------------
    // Create one experiment card
    // --------------------------------------------------
    createExperimentCard(experiment) {

        const status =
            ResearchManager.getExperimentStatus(
                experiment.id
            );

        const state =
            status.completed
                ? "completed"
                : status.available
                    ? "available"
                    : "locked";

        const card =
            document.createElement("article");

        card.className =
            `organelle-experiment-card ` +
            `organelle-experiment-card--${state}`;

        card.dataset.experimentId =
            experiment.id;

        card.dataset.status =
            state;

        const title =
            document.createElement("h3");

        title.textContent =
            experiment.title;

        const summary =
            document.createElement("p");

        summary.textContent =
            experiment.summary;

        const statusElement =
            document.createElement("p");

        statusElement.className =
            "organelle-experiment-status";

        statusElement.textContent =
            state === "completed"
                ? "Completed"
                : state === "available"
                    ? "Available"
                    : "Locked";

        card.append(
            title,
            summary,
            statusElement
        );

        if (state === "available") {

            const runButton =
                document.createElement("button");

            runButton.type =
                "button";

            runButton.className =
                "organelle-experiment-run-button";

            runButton.textContent =
                "Run Experiment";

            runButton.addEventListener(
                "click",
                () => {

                    if (
                        typeof this.onRunExperiment !==
                        "function"
                    ) {
                        console.warn(
                            "OrganelleExperimentPanel: experiment callback unavailable"
                        );

                        return;
                    }

                    const result =
                        this.onRunExperiment(
                            experiment.id
                        );

                    if (!result?.completed) {

                        this.render(
                            this.currentOrganelleId,
                            {
                                onRunExperiment:
                                    this.onRunExperiment,

                                actionMessage:
                                    "Experiment could not be completed."
                            }
                        );

                        return;
                    }

                    this.render(
                        this.currentOrganelleId,
                        {
                            onRunExperiment:
                                this.onRunExperiment,

                            actionMessage:
                                `Experiment completed. +${result.xpAwarded} XP awarded.`
                        }
                    );

                }
            );

            card.appendChild(
                runButton
            );

        }

        if (state === "locked") {

            const requirements =
                document.createElement("p");

            requirements.className =
                "organelle-experiment-requirements";

            const details = [];

            if (
                status.missingDiscoveries.length > 0
            ) {
                details.push(
                    `Requires discovery: ${
                        status.missingDiscoveries.join(
                            ", "
                        )
                    }`
                );
            }

            if (
                status.incompleteExperiments
                    .length > 0
            ) {
                details.push(
                    `Requires experiment: ${
                        status.incompleteExperiments.join(
                            ", "
                        )
                    }`
                );
            }

            requirements.textContent =
                details.join(" • ");

            card.appendChild(
                requirements
            );

        }

        return card;

    },

    // --------------------------------------------------
    // Render experiments for the selected organelle
    // --------------------------------------------------
    render(
        organelleId,
        {
            onRunExperiment = null,
            actionMessage = ""
        } = {}
    ) {

        if (!this.initialize()) {
            return;
        }

        this.currentOrganelleId =
            organelleId;

        this.onRunExperiment =
            onRunExperiment;

        this.listElement.replaceChildren();

        this.actionMessageElement.textContent =
            actionMessage;

        if (!organelleId) {

            this.focusNameElement.textContent =
                "No organelle selected";

            this.summaryElement.textContent =
                "Select a discovered organelle in Cell View to study its available experiments.";

            const message =
                document.createElement("p");

            message.textContent =
                "No experiments selected.";

            this.listElement.appendChild(
                message
            );

            return;
        }

        const organelleLabel =
            this.getOrganelleLabel(
                organelleId
            );

        const experiments =
            this.getExperimentsForOrganelle(
                organelleId
            );

        this.focusNameElement.textContent =
            `${organelleLabel} Lab`;

        this.summaryElement.textContent =
            "Experiments reveal how molecular structure affects cell function.";

        if (experiments.length === 0) {

            const message =
                document.createElement("p");

            message.textContent =
                "No experiments are defined for this organelle yet.";

            this.listElement.appendChild(
                message
            );

            return;
        }

        experiments.forEach(experiment => {

            this.listElement.appendChild(
                this.createExperimentCard(
                    experiment
                )
            );

        });

    }

};

export default OrganelleExperimentPanel;