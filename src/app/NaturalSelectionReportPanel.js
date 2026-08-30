// --------------------------------------------------
// NaturalSelectionReportPanel.js
// Canvas-ready plain-text preview, copy, and download
// --------------------------------------------------

import gameState from "./GameState.js";
import InvestigationDataModel
    from "./InvestigationDataModel.js";
import InvestigationDefinitionRegistry
    from "./InvestigationDefinitionRegistry.js";
import InvestigationReportModel
    from "./InvestigationReportModel.js";
import InvestigationSessionManager
    from "./InvestigationSessionManager.js";
import NaturalSelectionAnalysisPanel
    from "./NaturalSelectionAnalysisPanel.js";

const INVESTIGATION_ID =
    "natural_selection_pigmentation";

const NaturalSelectionReportPanel = {

    initialized: false,
    panelElement: null,
    previewElement: null,
    statusElement: null,
    copyButton: null,
    downloadButton: null,
    reportSnapshot: null,
    reportText: "",
    reportSignature: "",

    initialize() {
        if (this.initialized) {
            return true;
        }

        this.panelElement = document.getElementById(
            "natural-selection-report-panel"
        );
        this.previewElement = document.getElementById(
            "natural-selection-report-preview"
        );
        this.statusElement = document.getElementById(
            "natural-selection-report-status"
        );
        this.copyButton = document.getElementById(
            "btn-copy-natural-selection-report"
        );
        this.downloadButton = document.getElementById(
            "btn-download-natural-selection-report"
        );

        if (
            !this.panelElement ||
            !this.previewElement ||
            !this.statusElement ||
            !this.copyButton ||
            !this.downloadButton
        ) {
            console.warn(
                "NaturalSelectionReportPanel: required DOM elements are unavailable"
            );
            return false;
        }

        this.copyButton.addEventListener(
            "click",
            () => this.copyReport()
        );
        this.downloadButton.addEventListener(
            "click",
            () => this.downloadReport()
        );

        InvestigationSessionManager.subscribe(
            () => this.render()
        );
        NaturalSelectionAnalysisPanel.subscribe(
            () => this.render()
        );

        this.initialized = true;
        return true;
    },

    clearReport() {
        this.reportSnapshot = null;
        this.reportText = "";
        this.reportSignature = "";
    },

    buildReport() {
        const session = InvestigationSessionManager
            .getSnapshot();
        const analysis = NaturalSelectionAnalysisPanel
            .getAnalysisSnapshot();

        if (
            !session ||
            session.phase !== "population_complete" ||
            !analysis
        ) {
            this.clearReport();
            return null;
        }

        const signature =
            `${session.sessionId}:${analysis.completedAtMs}`;
        if (
            signature === this.reportSignature &&
            this.reportSnapshot
        ) {
            return this.reportSnapshot;
        }

        const definition =
            InvestigationDefinitionRegistry.get(
                INVESTIGATION_ID
            );
        const data = InvestigationDataModel
            .createSnapshot(session);

        this.reportSnapshot =
            InvestigationReportModel.createSnapshot({
                session,
                data,
                analysis,
                definition,
                player: gameState.player ?? {}
            });
        this.reportText =
            InvestigationReportModel.formatPlainText(
                this.reportSnapshot
            );
        this.reportSignature = signature;
        return this.reportSnapshot;
    },

    render() {
        if (!this.initialize()) {
            return false;
        }

        if (!NaturalSelectionAnalysisPanel.isComplete()) {
            this.clearReport();
            this.panelElement.hidden = true;
            this.previewElement.value = "";
            this.statusElement.textContent = "";
            return true;
        }

        try {
            this.buildReport();
            this.previewElement.value =
                this.reportText;
            this.panelElement.hidden = false;
            this.copyButton.disabled = false;
            this.downloadButton.disabled = false;
            this.statusElement.textContent =
                gameState.player?.displayName ||
                gameState.player?.name
                    ? "Report ready. Your saved player name is included."
                    : "Report ready. No player name is currently saved; Canvas will identify the submitting account.";
        } catch (error) {
            this.clearReport();
            this.panelElement.hidden = true;
            console.warn(
                "NaturalSelectionReportPanel: report generation failed",
                error
            );
        }

        return true;
    },

    async copyReport() {
        if (!this.reportText) {
            return false;
        }

        try {
            if (
                globalThis.navigator?.clipboard
                    ?.writeText
            ) {
                await globalThis.navigator
                    .clipboard.writeText(
                        this.reportText
                    );
            } else {
                this.previewElement.focus();
                this.previewElement.select();
                if (!document.execCommand?.("copy")) {
                    throw new Error(
                        "The browser did not confirm the copy operation."
                    );
                }
            }

            this.statusElement.textContent =
                "Copied. Open the Canvas essay response and paste your report.";
            return true;
        } catch (error) {
            this.statusElement.textContent =
                "Copy was blocked by the browser. Select the report text manually, or use Download .txt.";
            return false;
        }
    },

    downloadReport() {
        if (!this.reportText || !this.reportSnapshot) {
            return false;
        }

        try {
            const blob = new Blob(
                [this.reportText],
                {
                    type:
                        "text/plain;charset=utf-8"
                }
            );
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download =
                InvestigationReportModel
                    .createFilename(
                        this.reportSnapshot
                    );
            link.hidden = true;
            document.body.append(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);

            this.statusElement.textContent =
                "Downloaded the plain-text report. Attach that file to the Canvas quiz if requested.";
            return true;
        } catch (error) {
            this.statusElement.textContent =
                "The download could not be created. Copy the report text instead.";
            return false;
        }
    },

    getReportSnapshot() {
        return this.reportSnapshot
            ? structuredClone(
                this.reportSnapshot
            )
            : null;
    },

    getReportText() {
        return this.reportText;
    }
};

export default NaturalSelectionReportPanel;
