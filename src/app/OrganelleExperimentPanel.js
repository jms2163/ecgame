// --------------------------------------------------
// OrganelleExperimentPanel.js
// Renders and runs experiments for one organelle
// --------------------------------------------------

import CellMapLayout from "./CellMapLayout.js";
import OrganelleExperimentLibrary
    from "./OrganelleExperimentLibrary.js";
import ResearchManager from "./ResearchManager.js";
import OrganelleExperimentSubmissionManager
    from "./OrganelleExperimentSubmissionManager.js";

const OrganelleExperimentPanel = {

    focusNameElement: null,
    summaryElement: null,
    actionMessageElement: null,

    unlockedListElement: null,
    lockedListElement: null,

    currentOrganelleId: null,
    onOpenExperiment: null,
    onReviewSubmission: null,
    onRegradeAssessment: null,

    // --------------------------------------------------
    // Find Organelle Lab display elements
    // --------------------------------------------------
    initialize() {

        if (
            this.focusNameElement &&
            this.summaryElement &&
            this.actionMessageElement &&
            this.unlockedListElement &&
            this.lockedListElement
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

        this.unlockedListElement =
            document.getElementById(
                "organelle-unlocked-experiment-list"
            );

        this.lockedListElement =
            document.getElementById(
                "organelle-locked-experiment-list"
            );

        if (
            !this.focusNameElement ||
            !this.summaryElement ||
            !this.actionMessageElement ||
            !this.unlockedListElement ||
            !this.lockedListElement
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
    // Read a human-facing title for a prerequisite ID.
    // --------------------------------------------------
    getExperimentTitle(experimentId) {

        return OrganelleExperimentLibrary[
            experimentId
        ]?.title ?? experimentId;

    },

    // --------------------------------------------------
    // Read the highest persisted score, if attempted.
    // --------------------------------------------------
    getBestScore(experimentId) {

        return OrganelleExperimentSubmissionManager
            .getBestScore(experimentId);

    },

    // --------------------------------------------------
    // Create one experiment card
    // --------------------------------------------------
    createExperimentCard(
        experiment,
        status
    ) {

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
            document.createElement("h4");

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
            state === "available"
                    ? "Available"
                    : state === "locked"
                        ? "Locked"
                        : "Completed · ";

        card.append(
            title,
            summary,
            statusElement
        );

        if (state === "available") {

            const bestScore =
                this.getBestScore(
                    experiment.id
                );

            if (bestScore) {
                const score =
                    document.createElement("span");

                score.className =
                    "organelle-experiment-best-score";

                score.textContent =
                    ` · Highest score: ${bestScore.scorePoints} / ${bestScore.scoreMaximum}`;

                statusElement.appendChild(score);

                const reviewLink =
                    document.createElement("a");

                reviewLink.href = "#";
                reviewLink.className =
                    "organelle-experiment-review-link";
                reviewLink.textContent =
                    "Review attempt";

                reviewLink.addEventListener("click", event => {
                    event.preventDefault();
                    const submissions =
                        OrganelleExperimentSubmissionManager
                            .getSubmissions(experiment.id);
                    this.onReviewSubmission?.(
                        experiment,
                        submissions.at(-1) ?? null
                    );
                });

                statusElement.appendChild(reviewLink);
            }

        }

        if (state === "completed") {

            const reviewLink =
                document.createElement("a");

            reviewLink.href = "#";

            reviewLink.className =
                "organelle-experiment-review-link";

            reviewLink.textContent =
                "Review submission";

            reviewLink.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    if (
                        typeof this.onReviewSubmission !==
                        "function"
                    ) {
                        return;
                    }

                    const submissions =
                        OrganelleExperimentSubmissionManager
                            .getSubmissions(
                                experiment.id
                            );

                    this.onReviewSubmission(
                        experiment,
                        submissions.at(-1) ?? null
                    );

                }
            );

            statusElement.appendChild(
                reviewLink
            );

            const star =
                OrganelleExperimentSubmissionManager
                    .getStar(experiment.id);

            if (star) {
                const starElement =
                    document.createElement("span");

                starElement.className =
                    "organelle-experiment-star";

                starElement.textContent =
    "★";

starElement.setAttribute(
    "data-tooltip",
    "Exceptional Work!"
);

starElement.setAttribute(
    "tabindex",
    "0"
);

                starElement.setAttribute(
                    "title",
                    "Exceptional Work!"
                );

                starElement.setAttribute(
                    "aria-label",
                    "Exceptional Work!"
                );

                starElement.setAttribute(
                    "role",
                    "img"
                );

                statusElement.appendChild(
                    starElement
                );
            }

        }

        if (state !== "locked" && this.getBestScore(experiment.id)) {
            const regrade = document.createElement("button");
            regrade.type = "button";
            regrade.className = "organelle-experiment-regrade";
            regrade.textContent = "Regrade assessment";
            regrade.addEventListener("click", () => {
                this.onRegradeAssessment?.(experiment);
            });
            card.appendChild(regrade);
        }

        if (state === "available") {

    const openButton =
        document.createElement("button");

    openButton.type =
        "button";

    openButton.className =
        "organelle-experiment-run-button";

    openButton.textContent =
        "Open Experiment";

    openButton.addEventListener(
        "click",
        () => {

            if (
                typeof this.onOpenExperiment !==
                "function"
            ) {
                console.warn(
                    "OrganelleExperimentPanel: experiment open callback unavailable"
                );

                return;
            }

            this.onOpenExperiment(
                experiment
            );

        }
    );

    card.appendChild(
        openButton
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
                status.incompleteExperiments
                    .forEach(experimentId => {

                        details.push(
                            `Requires: 100% ${
                                this.getExperimentTitle(
                                    experimentId
                                )
                            } score.`
                        );

                    });
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
    // Add a catalog empty-state message
    // --------------------------------------------------
    appendEmptyMessage(
        container,
        message
    ) {

        const emptyMessage =
            document.createElement("p");

        emptyMessage.className =
            "organelle-experiment-empty-message";

        emptyMessage.textContent =
            message;

        container.appendChild(
            emptyMessage
        );

    },

    // --------------------------------------------------
    // Render experiments for the selected organelle
    // --------------------------------------------------
    render(
        organelleId,
        {
            onOpenExperiment = null,
            onReviewSubmission = null,
            onRegradeAssessment = null,
            actionMessage = ""
        } = {}
    ) {

        if (!this.initialize()) {
            return;
        }

        this.currentOrganelleId =
            organelleId;

        this.onOpenExperiment =
            onOpenExperiment;

        this.onReviewSubmission =
            onReviewSubmission;

        this.onRegradeAssessment = onRegradeAssessment;

        this.unlockedListElement.replaceChildren();

        this.lockedListElement.replaceChildren();

        this.actionMessageElement.textContent =
            actionMessage;

        if (!organelleId) {

            this.focusNameElement.textContent =
                "No organelle selected";

            this.summaryElement.textContent =
                "Select a discovered organelle in Cell View to study its available experiments.";

            this.appendEmptyMessage(
                this.unlockedListElement,
                "No experiments selected."
            );

            this.appendEmptyMessage(
                this.lockedListElement,
                "No experiments selected."
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

        const experimentStatuses =
            experiments.map(experiment => ({
                experiment,

                status:
                    ResearchManager.getExperimentStatus(
                        experiment.id
                    )
            }));

        const unlockedExperiments =
            experimentStatuses.filter(
                ({ status }) =>
                    status.available ||
                    status.completed
            );

        const lockedExperiments =
            experimentStatuses.filter(
                ({ status }) =>
                    !status.available &&
                    !status.completed
            );

        if (
            unlockedExperiments.length === 0
        ) {
            this.appendEmptyMessage(
                this.unlockedListElement,
                "No experiments have been unlocked for this organelle."
            );
        } else {

            unlockedExperiments.forEach(
                ({
                    experiment,
                    status
                }) => {

                    this.unlockedListElement.appendChild(
                        this.createExperimentCard(
                            experiment,
                            status
                        )
                    );

                }
            );

        }

        if (
            lockedExperiments.length === 0
        ) {
            this.appendEmptyMessage(
                this.lockedListElement,
                "No additional experiments are currently locked."
            );
        } else {

            lockedExperiments.forEach(
                ({
                    experiment,
                    status
                }) => {

                    this.lockedListElement.appendChild(
                        this.createExperimentCard(
                            experiment,
                            status
                        )
                    );

                }
            );

        }

    }

};

export default OrganelleExperimentPanel;
