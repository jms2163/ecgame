// --------------------------------------------------
// NaturalSelectionSessionPanel.js
// Setup, generation, and survivor-review controls
// --------------------------------------------------

import InvestigationSessionManager
    from "./InvestigationSessionManager.js";
import NaturalSelectionSetupPanel
    from "./NaturalSelectionSetupPanel.js";

const getPopulationTotal = population =>
    population.phenotypeOrder.reduce(
        (
            total,
            phenotypeId
        ) =>
            total +
            population.phenotypeCounts[
                phenotypeId
            ],
        0
    );

const NaturalSelectionSessionPanel = {

    initialized: false,
    beginButton: null,
    advanceButton: null,
    restartButton: null,
    setupPreviewElement: null,
    sessionStatusElement: null,
    recordStatusElement: null,

    initialize() {

        if (this.initialized) {
            return true;
        }

        this.beginButton =
            document.getElementById(
                "btn-begin-natural-selection"
            );

        this.advanceButton =
            document.getElementById(
                "btn-advance-natural-selection"
            );

        this.restartButton =
            document.getElementById(
                "btn-restart-natural-selection"
            );

        this.setupPreviewElement =
            document.getElementById(
                "natural-selection-setup-preview"
            );

        this.sessionStatusElement =
            document.getElementById(
                "natural-selection-session-status"
            );

        this.recordStatusElement =
            document.getElementById(
                "natural-selection-record-status"
            );

        if (
            !this.beginButton ||
            !this.advanceButton ||
            !this.restartButton ||
            !this.setupPreviewElement ||
            !this.sessionStatusElement ||
            !this.recordStatusElement
        ) {
            console.warn(
                "NaturalSelectionSessionPanel: required DOM elements are unavailable"
            );

            return false;
        }

        this.beginButton.addEventListener(
            "click",
            () => {
                this.beginInvestigation();
            }
        );

        this.advanceButton.addEventListener(
            "click",
            () => {
                this.advanceGeneration();
            }
        );

        this.restartButton.addEventListener(
            "click",
            () => {
                this.restartSetup();
            }
        );

        NaturalSelectionSetupPanel
            .subscribeToSelectionChanges(
                () => {
                    this.render();
                }
            );

        InvestigationSessionManager
            .subscribe(
                () => {
                    this.render();
                }
            );

        this.initialized = true;

        return true;

    },

    beginInvestigation() {

        const setup =
            NaturalSelectionSetupPanel
                .getSetupSnapshot();

        if (
            !setup ||
            InvestigationSessionManager
                .hasActiveSession()
        ) {
            return false;
        }

        InvestigationSessionManager
            .startSession(setup);

        return true;

    },

    advanceGeneration() {

        const session =
            InvestigationSessionManager
                .getSnapshot();

        if (
            session?.phase !==
            "survivor_review"
        ) {
            return false;
        }

        InvestigationSessionManager
            .advanceGeneration();

        return true;

    },

    restartSetup() {

        InvestigationSessionManager
            .resetSession();

    },

    render() {

        if (!this.initialize()) {
            return false;
        }

        const session =
            InvestigationSessionManager
                .getSnapshot();

        if (!session) {
            const setup =
                NaturalSelectionSetupPanel
                    .getSetupSnapshot();

            NaturalSelectionSetupPanel
                .setLocked(false);

            this.beginButton.disabled =
                setup === null;
            this.beginButton.hidden = false;
            this.advanceButton.hidden = true;
            this.restartButton.hidden = true;
            this.setupPreviewElement.hidden =
                false;
            this.sessionStatusElement.hidden =
                true;

            this.recordStatusElement.textContent =
                "No attempt has started. Choose a complete setup, then begin the investigation.";

            return true;
        }

        NaturalSelectionSetupPanel
            .setLocked(true);

        this.beginButton.disabled = true;
        this.beginButton.hidden = true;
        this.restartButton.hidden = false;
        this.setupPreviewElement.hidden = true;
        this.sessionStatusElement.hidden =
            false;

        const canAdvance =
            session.phase ===
            "survivor_review";

        this.advanceButton.hidden =
            !canAdvance;

        if (canAdvance) {
            const nextGeneration =
                session.currentGeneration + 1;

            this.advanceButton.textContent =
                nextGeneration ===
                session.finalGeneration
                    ? "Reproduce Final Generation"
                    : `Reproduce Generation ${nextGeneration}`;
        }

        this.renderSessionStatus(
            session
        );
        this.renderRecordStatus(
            session
        );

        return true;

    },

    renderSessionStatus(session) {

        const generationRecord =
            session.generationRecords
                .at(-1);
        const metrics =
            generationRecord.selection
                ?.strategyMetrics;

        let headingText;
        let stateText;
        let populationText;

        if (
            session.phase ===
            "selection_interaction"
        ) {
            headingText =
                `Generation ${session.currentGeneration} hunt`;
            stateText =
                "Hunting in progress";
            populationText =
                `${getPopulationTotal(session.currentPopulation)} amoebas remain`;
        } else if (
            session.phase ===
            "survivor_review"
        ) {
            headingText =
                `Generation ${session.currentGeneration} survivors`;
            stateText =
                "Ready for reproduction";
            populationText =
                `${session.currentPopulation.phenotypeCounts.pigmented} pigmented / ${session.currentPopulation.phenotypeCounts.non_pigmented} non-pigmented`;
        } else {
            headingText =
                `Generation ${session.finalGeneration} final population`;
            stateText =
                "Population run complete";
            populationText =
                `${session.currentPopulation.phenotypeCounts.pigmented} pigmented / ${session.currentPopulation.phenotypeCounts.non_pigmented} non-pigmented`;
        }

        const rows = [
            [
                "Session state",
                stateText
            ],
            [
                "Population",
                populationText
            ],
            [
                "Successful captures",
                metrics
                    ? `${metrics.successfulCaptures} of ${generationRecord.selection.targetSuccessfulOutcomes}`
                    : "Complete"
            ],
            [
                "Capture attempts",
                metrics
                    ? String(
                        metrics.captureAttempts
                    )
                    : "—"
            ],
            [
                "Final observation",
                `Generation ${session.finalGeneration}`
            ]
        ];

        const heading =
            document.createElement(
                "h3"
            );

        heading.textContent =
            headingText;

        const list =
            document.createElement(
                "dl"
            );

        list.className =
            "natural-selection-session-list";

        rows.forEach(
            ([label, value]) => {

                const term =
                    document.createElement(
                        "dt"
                    );

                const description =
                    document.createElement(
                        "dd"
                    );

                term.textContent = label;
                description.textContent = value;

                list.append(
                    term,
                    description
                );

            }
        );

        this.sessionStatusElement
            .replaceChildren(
                heading,
                list
            );

    },

    renderRecordStatus(session) {

        const generationRecord =
            session.generationRecords
                .at(-1);

        if (
            session.phase ===
            "selection_interaction"
        ) {
            this.recordStatusElement.textContent =
                `Generation ${session.currentGeneration} is in progress. Starting counts and frequencies are recorded automatically; captured phenotypes remain hidden until all required captures are complete.`;

            return;
        }

        if (
            session.phase ===
            "survivor_review"
        ) {
            const captured =
                generationRecord.selection
                    .strategyMetrics
                    .capturedByPhenotype;

            this.recordStatusElement.textContent =
                `Generation ${session.currentGeneration}: captured ${captured.pigmented} pigmented and ${captured.non_pigmented} non-pigmented. Review the automatic record, then reproduce.`;

            return;
        }

        const initial =
            session.generationRecords[0]
                .startPopulation
                .phenotypeCounts;
        const finalCounts =
            session.currentPopulation
                .phenotypeCounts;

        this.recordStatusElement.textContent =
            `Population run complete. Generation 0 began with ${initial.pigmented} pigmented and ${initial.non_pigmented} non-pigmented; Generation ${session.finalGeneration} has ${finalCounts.pigmented} pigmented and ${finalCounts.non_pigmented} non-pigmented. Use the completed table and graph below as evidence for your later conclusion.`;

    }

};

export default NaturalSelectionSessionPanel;
