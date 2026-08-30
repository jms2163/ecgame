// --------------------------------------------------
// NaturalSelectionSessionPanel.js
// Setup, generation, and survivor-review controls
// --------------------------------------------------

import InvestigationSessionManager
    from "./InvestigationSessionManager.js";
import NaturalSelectionSetupPanel
    from "./NaturalSelectionSetupPanel.js";
import NaturalSelectionPlanPanel
    from "./NaturalSelectionPlanPanel.js";

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
    setupPanelElement: null,
    stagePanelElement: null,
    recordPanelElement: null,

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

        this.setupPanelElement =
            document.getElementById(
                "natural-selection-setup-panel"
            );
        this.stagePanelElement =
            document.getElementById(
                "natural-selection-stage-panel"
            );
        this.recordPanelElement =
            document.getElementById(
                "natural-selection-record-panel"
            );

        if (
            !this.beginButton ||
            !this.advanceButton ||
            !this.restartButton ||
            !this.setupPreviewElement ||
            !this.sessionStatusElement ||
            !this.recordStatusElement ||
            !this.setupPanelElement ||
            !this.stagePanelElement ||
            !this.recordPanelElement
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

        NaturalSelectionPlanPanel
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
            !NaturalSelectionSetupPanel
                .isScenarioConfirmed() ||
            !NaturalSelectionPlanPanel
                .isReady(setup) ||
            InvestigationSessionManager
                .hasActiveSession()
        ) {
            return false;
        }

        const investigationPlan =
            NaturalSelectionPlanPanel
                .getPlanSnapshot(setup);

        InvestigationSessionManager
            .startSession({
                ...setup,
                investigationPlan
            });

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
        NaturalSelectionPlanPanel
            .resetPlan();
        NaturalSelectionSetupPanel
            .resetTutorial();

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
            NaturalSelectionPlanPanel
                .setLocked(false);

            const planReady =
                setup !== null &&
                NaturalSelectionPlanPanel
                    .isReady(setup);

            this.beginButton.disabled =
                !planReady;
            this.stagePanelElement.hidden =
                this.beginButton.disabled;
            this.recordPanelElement.hidden =
                true;
            this.setupPanelElement.hidden =
                planReady;
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
        NaturalSelectionPlanPanel
            .setLocked(
                true,
                session.setup
                    .investigationPlan
            );

        this.beginButton.disabled = true;
        this.beginButton.hidden = true;
        this.restartButton.hidden = false;
        this.setupPreviewElement.hidden = true;
        this.sessionStatusElement.hidden =
            false;
        this.stagePanelElement.hidden = false;
        this.recordPanelElement.hidden = false;
        this.setupPanelElement.hidden = true;

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
        let message;

        if (
            session.phase ===
            "selection_interaction"
        ) {
            message =
                `Generation ${session.currentGeneration}: hunt in progress.`;
        } else if (
            session.phase ===
            "survivor_review"
        ) {
            message =
                `Generation ${session.currentGeneration} complete — review the Investigation Record, then reproduce.`;
        } else {
            message =
                "Investigation complete — use the table and graph below as evidence.";
        }

        const cue = document.createElement("p");
        cue.className =
            "natural-selection-session-cue";
        cue.textContent = message;

        this.sessionStatusElement.replaceChildren(cue);

    },

    renderRecordStatus(session) {

        const generationRecord =
            session.generationRecords
                .at(-1);

        const metrics =
            generationRecord.selection
                ?.strategyMetrics;
        const population =
            session.currentPopulation
                .phenotypeCounts;
        const heading = document.createElement("h3");
        const list = document.createElement("dl");
        const note = document.createElement("p");
        let stateText;
        let populationText;

        list.className =
            "natural-selection-record-list";
        note.className =
            "natural-selection-record-note";

        if (
            session.phase ===
            "selection_interaction"
        ) {
            heading.textContent =
                `Generation ${session.currentGeneration} hunt`;
            stateText = "Hunting in progress";
            populationText =
                `${getPopulationTotal(session.currentPopulation)} amoebas remain`;
            note.textContent =
                "Starting counts and frequencies are recorded automatically. Captured phenotypes remain hidden until the hunt is complete.";
        } else if (
            session.phase ===
            "survivor_review"
        ) {
            const captured =
                metrics.capturedByPhenotype;

            heading.textContent =
                `Generation ${session.currentGeneration} survivors`;
            stateText = "Ready for reproduction";
            populationText =
                `${population.pigmented} pigmented / ${population.non_pigmented} non-pigmented`;
            note.textContent =
                `Captured ${captured.pigmented} pigmented and ${captured.non_pigmented} non-pigmented. Review this record, then reproduce.`;
        } else {
            const initial =
                session.generationRecords[0]
                    .startPopulation
                    .phenotypeCounts;

            heading.textContent =
                `Generation ${session.finalGeneration} final population`;
            stateText = "Population run complete";
            populationText =
                `${population.pigmented} pigmented / ${population.non_pigmented} non-pigmented`;
            note.textContent =
                `Generation 0 began with ${initial.pigmented} pigmented and ${initial.non_pigmented} non-pigmented. Use the table and graph below as evidence for your conclusion.`;
        }

        const rows = [
            ["Session state", stateText],
            ["Population", populationText],
            [
                "Successful captures",
                metrics
                    ? `${metrics.successfulCaptures} of ${generationRecord.selection.targetSuccessfulOutcomes}`
                    : "Complete"
            ],
            [
                "Capture attempts",
                metrics
                    ? String(metrics.captureAttempts)
                    : "—"
            ],
            [
                "Study endpoint",
                `Study ends after Generation ${session.finalGeneration}`
            ]
        ];

        rows.forEach(([label, value]) => {
            const term = document.createElement("dt");
            const description = document.createElement("dd");
            term.textContent = label;
            description.textContent = value;
            list.append(term, description);
        });

        this.recordStatusElement.replaceChildren(
            heading,
            list,
            note
        );

    }

};

export default NaturalSelectionSessionPanel;
