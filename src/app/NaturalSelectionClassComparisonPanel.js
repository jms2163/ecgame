// --------------------------------------------------
// NaturalSelectionClassComparisonPanel.js
// Optional post-analysis class-average comparison UI
// --------------------------------------------------

import InvestigationClassComparisonModel
    from "./InvestigationClassComparisonModel.js";
import InvestigationSessionManager
    from "./InvestigationSessionManager.js";
import NaturalSelectionAnalysisPanel
    from "./NaturalSelectionAnalysisPanel.js";
import NaturalSelectionClassComparisonClient
    from "./NaturalSelectionClassComparisonClient.js";
import NaturalSelectionClassComparisonConfig
    from "./NaturalSelectionClassComparisonConfig.js";
import NaturalSelectionReportPanel
    from "./NaturalSelectionReportPanel.js";

const SVG_NAMESPACE =
    "http://www.w3.org/2000/svg";

const createElement = (
    tagName,
    className = "",
    textContent = ""
) => {
    const element =
        document.createElement(tagName);
    element.className = className;
    element.textContent = textContent;
    return element;
};

const createSvgElement = (
    tagName,
    attributes = {}
) => {
    const element =
        document.createElementNS(
            SVG_NAMESPACE,
            tagName
        );
    Object.entries(attributes)
        .forEach(
            ([name, value]) =>
                element.setAttribute(
                    name,
                    String(value)
                )
        );
    return element;
};

const formatPercent = value =>
    `${(value * 100).toFixed(1)}%`;

const getOwnPigmentedPoints = report =>
    report.data.graphReadySeries.find(
        series =>
            series.phenotypeId ===
            "pigmented"
    )?.points ?? [];

const NaturalSelectionClassComparisonPanel = {

    initialized: false,
    panelElement: null,
    scenarioElement: null,
    statusElement: null,
    shareButton: null,
    refreshButton: null,
    refreshGuidanceElement: null,
    accountHelpElement: null,
    resultsElement: null,
    reportSignature: "",
    submission: null,
    submissionSent: false,
    submitted: false,
    hasAttemptedShare: false,
    readbackFailed: false,
    busy: false,
    aggregate: null,

    initialize() {
        if (this.initialized) {
            return true;
        }

        this.panelElement =
            document.getElementById(
                "natural-selection-class-comparison-panel"
            );
        this.scenarioElement =
            document.getElementById(
                "natural-selection-class-comparison-scenario"
            );
        this.statusElement =
            document.getElementById(
                "natural-selection-class-comparison-status"
            );
        this.shareButton =
            document.getElementById(
                "btn-share-natural-selection-class-data"
            );
        this.refreshButton =
            document.getElementById(
                "btn-refresh-natural-selection-class-average"
            );
        this.refreshGuidanceElement =
            document.getElementById(
                "natural-selection-class-refresh-guidance"
            );
        this.accountHelpElement =
            document.getElementById(
                "natural-selection-class-account-help"
            );
        this.resultsElement =
            document.getElementById(
                "natural-selection-class-comparison-results"
            );

        if (
            !this.panelElement ||
            !this.scenarioElement ||
            !this.statusElement ||
            !this.shareButton ||
            !this.refreshButton ||
            !this.refreshGuidanceElement ||
            !this.accountHelpElement ||
            !this.resultsElement
        ) {
            console.warn(
                "NaturalSelectionClassComparisonPanel: required DOM elements are unavailable"
            );
            return false;
        }

        this.shareButton.addEventListener(
            "click",
            () => this.shareAndCompare()
        );
        this.refreshButton.addEventListener(
            "click",
            () => this.refreshAggregate()
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

    resetForReport(signature) {
        this.reportSignature = signature;
        this.submission = null;
        this.submissionSent = false;
        this.submitted = false;
        this.hasAttemptedShare = false;
        this.readbackFailed = false;
        this.busy = false;
        this.aggregate = null;
        this.resultsElement
            .replaceChildren();
    },

    getReport() {
        return NaturalSelectionReportPanel
            .getReportSnapshot();
    },

    render() {
        if (!this.initialize()) {
            return false;
        }

        const report = this.getReport();

        if (
            !NaturalSelectionClassComparisonConfig
                .enabled ||
            !NaturalSelectionAnalysisPanel
                .isComplete() ||
            !report
        ) {
            this.panelElement.hidden = true;
            return true;
        }

        const signature =
            `${report.attempt.sessionId}:${report.generatedAtMs}`;

        if (
            signature !==
            this.reportSignature
        ) {
            this.resetForReport(signature);
        }

        this.panelElement.hidden = false;
        this.renderScenario(report);

        const configured =
            NaturalSelectionClassComparisonClient
                .isConfigured();

        this.shareButton.disabled =
            this.busy || !configured;
        this.shareButton.hidden =
            this.submissionSent;
        this.refreshButton.disabled =
            this.busy || !configured;
        this.refreshButton.hidden =
            !this.submissionSent;
        this.refreshButton.textContent =
            this.readbackFailed
                ? "Retry Class Average"
                : "Check Class Average Again";
        this.refreshGuidanceElement.hidden =
            !this.submissionSent;
        this.accountHelpElement.hidden =
            !this.readbackFailed;

        if (!configured) {
            this.statusElement.textContent =
                "Class comparison is ready in the game but is not connected to the instructor's Google Apps Script endpoint yet. Your Canvas report is still complete.";
        } else if (
            !this.submitted &&
            !this.busy &&
            !this.hasAttemptedShare
        ) {
            this.statusElement.textContent =
                "Sharing is optional. Only anonymous scenario, generation, and capture-summary data will be sent.";
        }

        return true;
    },

    renderScenario(report) {
        const list =
            createElement(
                "ul",
                "natural-selection-class-scenario-list"
            );
        [
            `Habitat: ${report.scenario.backgroundLabel}`,
            `Starting population: ${report.scenario.startingPopulationLabel}`,
            `Study length: ${report.scenario.investigationLengthLabel}`,
            `Visual profile: ${report.scenario.visualCalibration.profileId}`
        ].forEach(
            text => list.append(
                createElement("li", "", text)
            )
        );

        const note =
            createElement(
                "p",
                "natural-selection-class-match-note",
                "The class mean includes one active trial per participant whose scientific and visual settings above match exactly."
            );

        this.scenarioElement.replaceChildren(
            list,
            note
        );
    },

    async shareAndCompare() {
        if (this.busy) {
            return false;
        }

        const report = this.getReport();
        if (!report) {
            return false;
        }

        this.busy = true;
        this.hasAttemptedShare = true;
        this.aggregate = null;
        this.resultsElement
            .replaceChildren();
        this.statusElement.textContent =
            "Sharing anonymous trial data…";
        this.render();

        try {
            this.submission ??=
                NaturalSelectionClassComparisonClient
                    .createSubmission(report);

            await NaturalSelectionClassComparisonClient
                .sendSubmission(
                    this.submission
                );

            this.submissionSent = true;

            this.statusElement.textContent =
                "Trial sent. Confirming that it was stored…";

            await NaturalSelectionClassComparisonClient
                .confirmSubmission(
                    this.submission
                        .submissionId
                );

            this.submitted = true;
            this.readbackFailed = false;
            this.statusElement.textContent =
                "Anonymous trial stored. Loading the matching class average…";
            await this.loadAggregate(report);
            return true;
        } catch (error) {
            if (this.submissionSent) {
                this.readbackFailed = true;
                this.statusElement.textContent =
                    "Your trial was sent to the class service and is likely already saved. Google could not return the class comparison. Keep this page open, resolve any multiple-account conflict, then choose Retry Class Average.";
                console.warn(
                    "NaturalSelectionClassComparisonPanel: class readback failed after submission",
                    error
                );
            } else {
                this.statusElement.textContent =
                    "The anonymous trial could not be sent. Your Canvas report and investigation data remain available. Check the connection, then try sharing again.";
                console.warn(
                    "NaturalSelectionClassComparisonPanel: class submission failed before send completed",
                    error
                );
            }
            return false;
        } finally {
            this.busy = false;
            this.render();
        }
    },

    async refreshAggregate() {
        if (
            this.busy ||
            !this.submissionSent ||
            !this.submission
        ) {
            return false;
        }

        const report = this.getReport();
        if (!report) {
            return false;
        }

        this.busy = true;
        this.statusElement.textContent =
            this.submitted
                ? "Refreshing the matching class average…"
                : "Confirming the saved trial and retrying the class average…";
        this.render();

        try {
            if (!this.submitted) {
                await NaturalSelectionClassComparisonClient
                    .confirmSubmission(
                        this.submission
                            .submissionId
                    );
                this.submitted = true;
            }

            this.readbackFailed = false;
            await this.loadAggregate(report);
            return true;
        } catch (error) {
            this.readbackFailed = true;
            this.statusElement.textContent =
                "The trial remains sent, but Google still could not return the class comparison. Keep this page open and retry after resolving the Google-account session.";
            console.warn(
                "NaturalSelectionClassComparisonPanel: class-average retry failed",
                error
            );
            return false;
        } finally {
            this.busy = false;
            this.render();
        }
    },

    async loadAggregate(report) {
        const scenario =
            InvestigationClassComparisonModel
                .createScenario(report);
        const scenarioKey =
            InvestigationClassComparisonModel
                .createScenarioKey(
                    scenario
                );

        this.aggregate =
            await NaturalSelectionClassComparisonClient
                .getAggregate(
                    scenarioKey
                );

        if (
            this.aggregate.status ===
            "insufficient_data"
        ) {
            this.resultsElement
                .replaceChildren();
            this.statusElement.textContent =
                `Your trial is stored. Results from ${this.aggregate.matchingTrialCount} of ${this.aggregate.requiredMinimum} different participants are available for this exact scenario. Your additional runs in this browser profile replace your earlier active run and do not increase the participant count.`;
            return;
        }

        this.renderAggregate(
            report,
            this.aggregate
        );
        this.statusElement.textContent =
            `Comparison ready using ${this.aggregate.matchingTrialCount} matching class participants.`;
    },

    renderAggregate(report, aggregate) {
        const ownPoints =
            getOwnPigmentedPoints(report);
        const classPoints =
            aggregate.series.find(
                series =>
                    series.phenotypeId ===
                    "pigmented"
            )?.points ?? [];
        const explanation =
            createElement(
                "p",
                "natural-selection-class-graph-note",
                "The graph compares pigmented frequency because the two phenotype frequencies always sum to 100%; the non-pigmented pattern is the complement."
            );

        this.resultsElement.replaceChildren(
            explanation,
            this.createGraph({
                ownPoints,
                classPoints,
                finalGeneration:
                    report.scenario
                        .finalGeneration,
                matchingTrialCount:
                    aggregate
                        .matchingTrialCount
            }),
            this.createComparisonTable({
                ownPoints,
                classPoints
            })
        );
    },

    createGraph({
        ownPoints,
        classPoints,
        finalGeneration,
        matchingTrialCount
    }) {
        const width = 760;
        const height = 340;
        const margin = {
            top: 28,
            right: 28,
            bottom: 58,
            left: 72
        };
        const plotWidth =
            width - margin.left - margin.right;
        const plotHeight =
            height - margin.top - margin.bottom;
        const xScale = generation =>
            margin.left +
            (
                generation /
                finalGeneration
            ) * plotWidth;
        const yScale = frequency =>
            margin.top +
            (1 - frequency) * plotHeight;
        const figure =
            createElement(
                "figure",
                "natural-selection-class-figure"
            );
        const caption =
            createElement(
                "figcaption",
                "",
                `Your Trial vs. Matching Class Mean (n = ${matchingTrialCount})`
            );
        const svg =
            createSvgElement("svg", {
                viewBox:
                    `0 0 ${width} ${height}`,
                role: "img",
                "aria-labelledby":
                    "natural-selection-class-graph-title natural-selection-class-graph-description"
            });
        const title =
            createSvgElement("title", {
                id:
                    "natural-selection-class-graph-title"
            });
        const description =
            createSvgElement("desc", {
                id:
                    "natural-selection-class-graph-description"
            });

        title.textContent =
            "Pigmented phenotype frequency: your trial and matching class mean";
        description.textContent =
            `Your trial: ${ownPoints.map(point => `Generation ${point.generation}, ${point.percentage.toFixed(1)} percent`).join("; ")}. Class mean from ${matchingTrialCount} participants: ${classPoints.map(point => `Generation ${point.generation}, ${point.percentage.toFixed(1)} percent`).join("; ")}.`;
        svg.append(title, description);

        [0, 0.25, 0.5, 0.75, 1]
            .forEach(frequency => {
                const y = yScale(frequency);
                const line = createSvgElement(
                    "line",
                    {
                        x1: margin.left,
                        y1: y,
                        x2:
                            width - margin.right,
                        y2: y,
                        class:
                            "natural-selection-graph-grid-line"
                    }
                );
                const label = createSvgElement(
                    "text",
                    {
                        x: margin.left - 12,
                        y: y + 4,
                        "text-anchor": "end",
                        class:
                            "natural-selection-graph-axis-label"
                    }
                );
                label.textContent =
                    `${frequency * 100}%`;
                svg.append(line, label);
            });

        for (
            let generation = 0;
            generation <= finalGeneration;
            generation += 1
        ) {
            const x = xScale(generation);
            const label = createSvgElement(
                "text",
                {
                    x,
                    y: height - 30,
                    "text-anchor": "middle",
                    class:
                        "natural-selection-graph-axis-label"
                }
            );
            label.textContent = String(generation);
            svg.append(label);
        }

        svg.append(
            createSvgElement("line", {
                x1: margin.left,
                y1: margin.top,
                x2: margin.left,
                y2:
                    height - margin.bottom,
                class:
                    "natural-selection-graph-axis-line"
            }),
            createSvgElement("line", {
                x1: margin.left,
                y1:
                    height - margin.bottom,
                x2: width - margin.right,
                y2:
                    height - margin.bottom,
                class:
                    "natural-selection-graph-axis-line"
            })
        );

        [
            {
                points: ownPoints,
                color: "#f0a45d",
                dashArray: null
            },
            {
                points: classPoints,
                color: "#79e6c4",
                dashArray: "10 7"
            }
        ].forEach(series => {
            const path = createSvgElement(
                "path",
                {
                    d: series.points.map(
                        (point, index) =>
                            `${index === 0 ? "M" : "L"} ${xScale(point.generation).toFixed(2)} ${yScale(point.frequency).toFixed(2)}`
                    ).join(" "),
                    fill: "none",
                    stroke: series.color,
                    "stroke-width": 4,
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round"
                }
            );
            if (series.dashArray) {
                path.setAttribute(
                    "stroke-dasharray",
                    series.dashArray
                );
            }
            svg.append(path);
            series.points.forEach(point => {
                svg.append(
                    createSvgElement(
                        "circle",
                        {
                            cx:
                                xScale(
                                    point.generation
                                ),
                            cy:
                                yScale(
                                    point.frequency
                                ),
                            r: 5,
                            fill: series.color
                        }
                    )
                );
            });
        });

        const xTitle = createSvgElement(
            "text",
            {
                x:
                    margin.left +
                    plotWidth / 2,
                y: height - 8,
                "text-anchor": "middle",
                class:
                    "natural-selection-graph-axis-title"
            }
        );
        const yTitle = createSvgElement(
            "text",
            {
                x:
                    -(
                        margin.top +
                        plotHeight / 2
                    ),
                y: 18,
                transform: "rotate(-90)",
                "text-anchor": "middle",
                class:
                    "natural-selection-graph-axis-title"
            }
        );
        xTitle.textContent = "Generation";
        yTitle.textContent =
            "Pigmented frequency";
        svg.append(xTitle, yTitle);

        const legend = createElement(
            "ul",
            "natural-selection-class-legend"
        );
        [
            [
                "natural-selection-class-swatch--student",
                "Your trial"
            ],
            [
                "natural-selection-class-swatch--mean",
                `Class mean (n = ${matchingTrialCount})`
            ]
        ].forEach(([className, label]) => {
            const item = createElement("li");
            item.append(
                createElement(
                    "span",
                    `natural-selection-class-swatch ${className}`
                ),
                label
            );
            legend.append(item);
        });

        figure.append(caption, svg, legend);
        return figure;
    },

    createComparisonTable({
        ownPoints,
        classPoints
    }) {
        const wrapper = createElement(
            "div",
            "natural-selection-table-scroll"
        );
        wrapper.tabIndex = 0;
        wrapper.setAttribute(
            "aria-label",
            "Scrollable class comparison data table"
        );
        const table = createElement(
            "table",
            "natural-selection-class-table"
        );
        const caption = createElement(
            "caption",
            "",
            "Pigmented frequency comparison"
        );
        const head =
            document.createElement("thead");
        const headRow =
            document.createElement("tr");
        [
            "Generation",
            "Your trial",
            "Class mean"
        ].forEach(label => {
            const cell = createElement(
                "th",
                "",
                label
            );
            cell.scope = "col";
            headRow.append(cell);
        });
        head.append(headRow);

        const body =
            document.createElement("tbody");
        ownPoints.forEach(
            (
                point,
                index
            ) => {
                const row =
                    document.createElement("tr");
                const generation = createElement(
                    "th",
                    "",
                    String(point.generation)
                );
                generation.scope = "row";
                row.append(
                    generation,
                    createElement(
                        "td",
                        "",
                        formatPercent(
                            point.frequency
                        )
                    ),
                    createElement(
                        "td",
                        "",
                        formatPercent(
                            classPoints[index]
                                .frequency
                        )
                    )
                );
                body.append(row);
            }
        );

        table.append(caption, head, body);
        wrapper.append(table);
        return wrapper;
    }

};

export default NaturalSelectionClassComparisonPanel;
