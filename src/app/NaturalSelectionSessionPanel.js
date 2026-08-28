// --------------------------------------------------
// NaturalSelectionSessionPanel.js
// Setup-to-session handoff for the Pond investigation
// --------------------------------------------------

import InvestigationSessionManager
    from "./InvestigationSessionManager.js";
import NaturalSelectionSetupPanel
    from "./NaturalSelectionSetupPanel.js";

const NaturalSelectionSessionPanel = {

    initialized: false,
    beginButton: null,
    restartButton: null,
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

        this.restartButton =
            document.getElementById(
                "btn-restart-natural-selection"
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
            !this.restartButton ||
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

        NaturalSelectionSetupPanel
            .setLocked(true);

        this.render();

        return true;

    },

    restartSetup() {

        InvestigationSessionManager
            .resetSession();

        NaturalSelectionSetupPanel
            .setLocked(false);

        this.render();

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
            this.restartButton.hidden = true;
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
        this.sessionStatusElement.hidden =
            false;

        this.renderSessionStatus(
            session
        );

        this.recordStatusElement.textContent =
            "Generation 0 has been recorded. Capture data will appear here when visual predation is added in Milestone 4.";

        return true;

    },

    renderSessionStatus(session) {

        const counts =
            session.currentPopulation
                .phenotypeCounts;

        const rows = [
            [
                "Session state",
                "Ready for predation"
            ],
            [
                "Current generation",
                String(
                    session.currentGeneration
                )
            ],
            [
                "Population",
                `${counts.pigmented} pigmented / ${counts.non_pigmented} non-pigmented`
            ],
            [
                "Successful captures required",
                String(
                    session.setup.population
                        .successfulCapturesPerGeneration
                )
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
            "Generation 0 population locked";

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

    }

};

export default NaturalSelectionSessionPanel;
