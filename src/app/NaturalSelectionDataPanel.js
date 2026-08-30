// --------------------------------------------------
// NaturalSelectionDataPanel.js
// Accessible table and lightweight frequency graph
// --------------------------------------------------

import InvestigationDataModel
    from "./InvestigationDataModel.js";
import InvestigationSessionManager
    from "./InvestigationSessionManager.js";

const SVG_NAMESPACE =
    "http://www.w3.org/2000/svg";

const SERIES_STYLES = [
    {
        color: "#f0a45d",
        dashArray: null,
        marker: "circle"
    },
    {
        color: "#79e6c4",
        dashArray: "9 6",
        marker: "square"
    },
    {
        color: "#df80ff",
        dashArray: "3 5",
        marker: "circle"
    },
    {
        color: "#8fb8ff",
        dashArray: "12 5 3 5",
        marker: "square"
    }
];

const formatPercentage = value =>
    `${(value * 100).toFixed(1)}%`;

const formatPercentagePointChange =
    value => {

        const rounded =
            value.toFixed(1);

        return value > 0
            ? `+${rounded}`
            : rounded;

    };

const createCell = (
    tagName,
    text,
    scope = null
) => {

    const cell =
        document.createElement(
            tagName
        );

    cell.textContent = text;

    if (scope) {
        cell.scope = scope;
    }

    return cell;

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
            ([name, value]) => {
                element.setAttribute(
                    name,
                    String(value)
                );
            }
        );

    return element;

};

const NaturalSelectionDataPanel = {

    initialized: false,
    panelElement: null,
    statusElement: null,
    summaryElement: null,
    tableElement: null,
    graphElement: null,

    initialize() {

        if (this.initialized) {
            return true;
        }

        this.panelElement =
            document.getElementById(
                "natural-selection-data-panel"
            );
        this.statusElement =
            document.getElementById(
                "natural-selection-data-status"
            );
        this.summaryElement =
            document.getElementById(
                "natural-selection-frequency-summary"
            );
        this.tableElement =
            document.getElementById(
                "natural-selection-data-table"
            );
        this.graphElement =
            document.getElementById(
                "natural-selection-frequency-graph"
            );

        if (
            !this.panelElement ||
            !this.statusElement ||
            !this.summaryElement ||
            !this.tableElement ||
            !this.graphElement
        ) {
            console.warn(
                "NaturalSelectionDataPanel: required DOM elements are unavailable"
            );

            return false;
        }

        InvestigationSessionManager
            .subscribe(
                () => {
                    this.render();
                }
            );

        this.initialized = true;

        return true;

    },

    render() {

        if (!this.initialize()) {
            return false;
        }

        const session =
            InvestigationSessionManager
                .getSnapshot();

        if (!session) {
            this.panelElement.hidden = true;
            this.summaryElement
                .replaceChildren();
            this.tableElement
                .replaceChildren();
            this.graphElement
                .replaceChildren();

            return true;
        }

        const data =
            InvestigationDataModel
                .createSnapshot(session);

        this.panelElement.hidden = false;
        this.renderStatus(data);
        this.renderSummary(data);
        this.renderTable(data);
        this.renderGraph(data);

        return true;

    },

    renderStatus(data) {

        if (
            data.phase ===
            "selection_interaction"
        ) {
            this.statusElement.textContent =
                `Generation ${data.rows.at(-1).generation} is in progress. Starting frequencies are shown; captured phenotypes remain hidden until the hunt ends.`;

            return;
        }

        if (
            data.phase ===
            "survivor_review"
        ) {
            this.statusElement.textContent =
                `Generation ${data.rows.at(-1).generation} selection results have been added. Reproduction will create the next observation.`;

            return;
        }

        this.statusElement.textContent =
            `Complete data set: Generation 0 through Generation ${data.finalGeneration}.`;

    },

    renderSummary(data) {

        const heading =
            document.createElement("h3");
        const list =
            document.createElement("ul");

        heading.textContent =
            data.comparison.isFinal
                ? "Initial-to-final comparison"
                : "Observed frequency comparison";

        list.className =
            "natural-selection-frequency-summary-list";

        data.phenotypes.forEach(
            phenotype => {

                const initial =
                    data.comparison
                        .initialPopulation
                        .phenotypeFrequencies[
                            phenotype.id
                        ];
                const latest =
                    data.comparison
                        .latestPopulation
                        .phenotypeFrequencies[
                            phenotype.id
                        ];
                const change =
                    data.comparison
                        .frequencyChanges[
                            phenotype.id
                        ];
                const item =
                    document.createElement("li");

                item.textContent =
                    `${phenotype.label}: ${formatPercentage(initial)} at Generation ${data.comparison.initialGeneration}; ${formatPercentage(latest)} at Generation ${data.comparison.latestGeneration}; change ${formatPercentagePointChange(change)} percentage points.`;

                list.append(item);

            }
        );

        const interpretationNote =
            document.createElement("p");

        interpretationNote.className =
            "natural-selection-data-interpretation-note";
        interpretationNote.textContent =
            "These are descriptive results. Use your hypothesis and evidence to explain the pattern later; the game does not supply the conclusion.";

        this.summaryElement.replaceChildren(
            heading,
            list,
            interpretationNote
        );

    },

    renderTable(data) {

        const table =
            document.createElement("table");
        const caption =
            document.createElement("caption");
        const head =
            document.createElement("thead");
        const body =
            document.createElement("tbody");
        const groupRow =
            document.createElement("tr");
        const labelRow =
            document.createElement("tr");

        table.className =
            "natural-selection-generation-table";
        caption.textContent =
            "Generation-by-generation phenotype counts and starting frequencies";

        const generationHeader =
            createCell(
                "th",
                data.presentation
                    .observationLabel,
                "col"
            );

        generationHeader.rowSpan = 2;
        groupRow.append(
            generationHeader
        );

        [
            [
                data.presentation
                    .startingPopulationLabel,
                data.phenotypes.length * 2
            ],
            [
                data.presentation
                    .selectionOutcomeLabel,
                data.phenotypes.length
            ],
            [
                data.presentation
                    .survivorLabel,
                data.phenotypes.length
            ],
            [
                data.presentation
                    .nextPopulationLabel,
                data.phenotypes.length
            ]
        ].forEach(
            ([label, span]) => {
                const header =
                    createCell(
                        "th",
                        label,
                        "colgroup"
                    );

                header.colSpan = span;
                groupRow.append(header);
            }
        );

        data.phenotypes.forEach(
            phenotype => {
                labelRow.append(
                    createCell(
                        "th",
                        `${phenotype.label} n`,
                        "col"
                    ),
                    createCell(
                        "th",
                        `${phenotype.label} %`,
                        "col"
                    )
                );
            }
        );

        [
            data.presentation
                .selectionOutcomeLabel,
            data.presentation
                .survivorLabel,
            data.presentation
                .nextPopulationLabel
        ].forEach(
            () => {
                data.phenotypes.forEach(
                    phenotype => {
                        labelRow.append(
                            createCell(
                                "th",
                                phenotype.label,
                                "col"
                            )
                        );
                    }
                );
            }
        );

        head.append(
            groupRow,
            labelRow
        );

        data.rows.forEach(
            row => {

                const tableRow =
                    document.createElement("tr");

                tableRow.append(
                    createCell(
                        "th",
                        String(row.generation),
                        "row"
                    )
                );

                data.phenotypes.forEach(
                    phenotype => {
                        tableRow.append(
                            createCell(
                                "td",
                                String(
                                    row.startPopulation
                                        .phenotypeCounts[
                                            phenotype.id
                                        ]
                                )
                            ),
                            createCell(
                                "td",
                                formatPercentage(
                                    row.startPopulation
                                        .phenotypeFrequencies[
                                            phenotype.id
                                        ]
                                )
                            )
                        );
                    }
                );

                data.phenotypes.forEach(
                    phenotype => {
                        const selectionOutcome =
                            row.selectionOutcomeCounts[
                                phenotype.id
                            ];

                        tableRow.append(
                            createCell(
                                "td",
                                selectionOutcome === null
                                    ? (
                                        row.isFinalObservation
                                            ? "—"
                                            : "Hidden"
                                    )
                                    : String(
                                        selectionOutcome
                                    )
                            )
                        );
                    }
                );

                [
                    row.survivors,
                    row.nextGeneration
                ].forEach(
                    population => {
                        data.phenotypes.forEach(
                            phenotype => {
                                tableRow.append(
                                    createCell(
                                        "td",
                                        population
                                            ? String(
                                                population
                                                    .phenotypeCounts[
                                                        phenotype.id
                                                    ]
                                            )
                                            : "—"
                                    )
                                );
                            }
                        );
                    }
                );

                body.append(tableRow);

            }
        );

        table.append(
            caption,
            head,
            body
        );

        this.tableElement.replaceChildren(
            table
        );

    },

    renderGraph(data) {

        const width = 760;
        const height = 340;
        const margin = {
            top: 26,
            right: 26,
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
                data.finalGeneration
            ) * plotWidth;
        const yScale = frequency =>
            margin.top +
            (1 - frequency) * plotHeight;
        const svg =
            createSvgElement(
                "svg",
                {
                    viewBox:
                        `0 0 ${width} ${height}`,
                    role: "img",
                    "aria-labelledby":
                        "natural-selection-graph-title natural-selection-graph-description"
                }
            );
        const title =
            createSvgElement(
                "title",
                {
                    id:
                        "natural-selection-graph-title"
                }
            );
        const description =
            createSvgElement(
                "desc",
                {
                    id:
                        "natural-selection-graph-description"
                }
            );

        title.textContent =
            data.presentation
                .frequencyGraphTitle;
        description.textContent =
            data.frequencySeries.map(
                series =>
                    `${series.label}: ${series.points.map(point => `Generation ${point.generation}, ${point.percentage.toFixed(1)} percent`).join("; ")}.`
            ).join(" ");

        svg.append(
            title,
            description
        );

        [0, 0.25, 0.5, 0.75, 1]
            .forEach(
                frequency => {
                    const y =
                        yScale(frequency);
                    const gridLine =
                        createSvgElement(
                            "line",
                            {
                                x1: margin.left,
                                y1: y,
                                x2:
                                    width -
                                    margin.right,
                                y2: y,
                                class:
                                    "natural-selection-graph-grid-line"
                            }
                        );
                    const label =
                        createSvgElement(
                            "text",
                            {
                                x:
                                    margin.left - 12,
                                y: y + 4,
                                "text-anchor":
                                    "end",
                                class:
                                    "natural-selection-graph-axis-label"
                            }
                        );

                    label.textContent =
                        `${frequency * 100}%`;
                    svg.append(
                        gridLine,
                        label
                    );
                }
            );

        for (
            let generation = 0;
            generation <= data.finalGeneration;
            generation += 1
        ) {
            const x =
                xScale(generation);
            const tick =
                createSvgElement(
                    "line",
                    {
                        x1: x,
                        y1:
                            height -
                            margin.bottom,
                        x2: x,
                        y2:
                            height -
                            margin.bottom + 7,
                        class:
                            "natural-selection-graph-axis-line"
                    }
                );
            const label =
                createSvgElement(
                    "text",
                    {
                        x,
                        y:
                            height -
                            margin.bottom + 25,
                        "text-anchor":
                            "middle",
                        class:
                            "natural-selection-graph-axis-label"
                    }
                );

            label.textContent =
                String(generation);
            svg.append(tick, label);
        }

        const yAxis =
            createSvgElement(
                "line",
                {
                    x1: margin.left,
                    y1: margin.top,
                    x2: margin.left,
                    y2:
                        height -
                        margin.bottom,
                    class:
                        "natural-selection-graph-axis-line"
                }
            );
        const xAxis =
            createSvgElement(
                "line",
                {
                    x1: margin.left,
                    y1:
                        height -
                        margin.bottom,
                    x2:
                        width -
                        margin.right,
                    y2:
                        height -
                        margin.bottom,
                    class:
                        "natural-selection-graph-axis-line"
                }
            );

        svg.append(yAxis, xAxis);

        data.frequencySeries.forEach(
            (series, seriesIndex) => {

                const style =
                    SERIES_STYLES[
                        seriesIndex %
                        SERIES_STYLES.length
                    ];
                const pathData =
                    series.points.map(
                        (point, pointIndex) =>
                            `${pointIndex === 0 ? "M" : "L"} ${xScale(point.generation).toFixed(2)} ${yScale(point.frequency).toFixed(2)}`
                    ).join(" ");
                const path =
                    createSvgElement(
                        "path",
                        {
                            d: pathData,
                            fill: "none",
                            stroke: style.color,
                            "stroke-width": 4,
                            "stroke-linecap":
                                "round",
                            "stroke-linejoin":
                                "round",
                            class:
                                "natural-selection-frequency-line"
                        }
                    );

                if (style.dashArray) {
                    path.setAttribute(
                        "stroke-dasharray",
                        style.dashArray
                    );
                }

                svg.append(path);

                series.points.forEach(
                    point => {
                        const x =
                            xScale(
                                point.generation
                            );
                        const y =
                            yScale(
                                point.frequency
                            );
                        const marker =
                            style.marker ===
                            "square"
                                ? createSvgElement(
                                    "rect",
                                    {
                                        x: x - 5,
                                        y: y - 5,
                                        width: 10,
                                        height: 10,
                                        fill:
                                            style.color,
                                        class:
                                            "natural-selection-frequency-marker"
                                    }
                                )
                                : createSvgElement(
                                    "circle",
                                    {
                                        cx: x,
                                        cy: y,
                                        r: 5,
                                        fill:
                                            style.color,
                                        class:
                                            "natural-selection-frequency-marker"
                                    }
                                );

                        svg.append(marker);
                    }
                );

            }
        );

        const xAxisTitle =
            createSvgElement(
                "text",
                {
                    x:
                        margin.left +
                        plotWidth / 2,
                    y: height - 9,
                    "text-anchor": "middle",
                    class:
                        "natural-selection-graph-axis-title"
                }
            );
        const yAxisTitle =
            createSvgElement(
                "text",
                {
                    x:
                        -(
                            margin.top +
                            plotHeight / 2
                        ),
                    y: 18,
                    transform:
                        "rotate(-90)",
                    "text-anchor": "middle",
                    class:
                        "natural-selection-graph-axis-title"
                }
            );

        xAxisTitle.textContent =
            data.presentation
                .observationLabel;
        yAxisTitle.textContent =
            "Phenotype frequency";
        svg.append(
            xAxisTitle,
            yAxisTitle
        );

        const legend =
            document.createElement("ul");

        legend.className =
            "natural-selection-graph-legend";

        data.phenotypes.forEach(
            (phenotype, index) => {
                const item =
                    document.createElement("li");
                const swatch =
                    document.createElement("span");
                const style =
                    SERIES_STYLES[
                        index %
                        SERIES_STYLES.length
                    ];

                swatch.className =
                    `natural-selection-graph-swatch natural-selection-graph-swatch--${style.marker}`;
                swatch.style.backgroundColor =
                    style.color;
                item.append(
                    swatch,
                    phenotype.label
                );
                legend.append(item);
            }
        );

        this.graphElement.replaceChildren(
            svg,
            legend
        );

    }

};

export default NaturalSelectionDataPanel;
