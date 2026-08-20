// --------------------------------------------------
// CellMetricsPanel.js
// Renders read-only Cell View efficiency information
// --------------------------------------------------

import GameStateManager from "./GameStateManager.js";
import CellMapLayout from "./CellMapLayout.js";
import CellSystemManager
    from "./CellSystemManager.js";

import CellHealthCalculator
    from "./CellHealthCalculator.js";

const METRIC_FEATURE_IDS = new Set([
    "plasma_membrane",
    "nucleus",
    "contractile_vacuole",
    "food_vacuole",
    "mitochondria",
    "golgi_apparatus",
    "rough_endoplasmic_reticulum",
    "smooth_endoplasmic_reticulum",
    "ribosomes",
    "cytoskeleton",
    "pseudopodia",
    "lysosomes",
    "symbiosomes",
    "endosome",
    "autophagosome"
]);

const CellMetricsPanel = {

    panelElement: null,

    // --------------------------------------------------
    // Find Cell Metrics panel
    // --------------------------------------------------
    initialize() {

        if (this.panelElement) {
            return;
        }

        this.panelElement =
            document.getElementById(
                "cell-metrics-panel"
            );

        if (!this.panelElement) {
            console.warn(
                "CellMetricsPanel: #cell-metrics-panel not found"
            );
        }

    },

    // --------------------------------------------------
    // Create one ordinary DOM element
    // --------------------------------------------------
    createElement(
        elementName,
        className = null
    ) {

        const element =
            document.createElement(
                elementName
            );

        if (className) {
            element.className =
                className;
        }

        return element;

    },

    // --------------------------------------------------
    // Read features tracked by Cell Metrics
    // --------------------------------------------------
    getMetricFeatures() {

        return CellMapLayout.features.filter(
            feature =>
                METRIC_FEATURE_IDS.has(
                    feature.id
                )
        );

    },

    // --------------------------------------------------
    // Render Cell Metrics panel
    // --------------------------------------------------
    render() {

        this.initialize();

        if (!this.panelElement) {
            return;
        }

        const metricFeatures =
            this.getMetricFeatures();

            const cellSystems =
    CellSystemManager.getAllSystems();

        const discoveredFeatures =
            metricFeatures.filter(
                feature =>
                    GameStateManager.hasDiscovery(
                        feature.discoveryId
                    )
            ).sort(
                (firstFeature, secondFeature) =>
                    firstFeature.label.localeCompare(
                        secondFeature.label
                    )
            );

        const undiscoveredCount =
            metricFeatures.length -
            discoveredFeatures.length;

        const title =
            this.createElement(
                "h2",
                "cell-metrics-title"
            );

        title.textContent =
            "Cell Metrics";

        const efficiencyHeading =
            this.createElement(
                "h3",
                "cell-metrics-heading"
            );

        efficiencyHeading.textContent =
            "Efficiency";

        const efficiencyList =
            this.createElement(
                "ul",
                "cell-efficiency-list"
            );

        efficiencyList.id =
            "cell-efficiency-list";

        if (
            discoveredFeatures.length ===
            0
        ) {
            const emptyMessage =
                this.createElement(
                    "p",
                    "cell-metrics-empty-message"
                );

            emptyMessage.textContent =
                "No organelles discovered.";

            efficiencyList.appendChild(
                emptyMessage
            );

        } else {

            discoveredFeatures.forEach(
                feature => {

                    const listItem =
                        this.createElement(
                            "li",
                            "cell-efficiency-entry"
                        );

                    const label =
                        this.createElement(
                            "span",
                            "cell-efficiency-label"
                        );

                    label.textContent =
                        feature.label;

                    const value =
                        this.createElement(
                            "span",
                            "cell-efficiency-value"
                        );

                    const efficiency =
    CellHealthCalculator.getSystemEfficiency(
        cellSystems,
        feature.id
    );

value.textContent =
    Number.isFinite(efficiency)
        ? `${Math.round(
            efficiency * 100
        )}%`
        : "--";

                    listItem.append(
                        label,
                        value
                    );

                    efficiencyList.appendChild(
                        listItem
                    );

                }
            );

        }

        const undiscoveredMessage =
            this.createElement(
                "p",
                "cell-undiscovered-count"
            );

        undiscoveredMessage.id =
            "cell-undiscovered-count";

        undiscoveredMessage.textContent =
            `${undiscoveredCount} organelles undiscovered`;

        this.panelElement.replaceChildren(
            title,
            efficiencyHeading,
            efficiencyList,
            undiscoveredMessage
        );

    }

};

export default CellMetricsPanel;