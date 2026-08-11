// --------------------------------------------------
// PondMicrobiomeSensorPane.js
// Updates Microbiome sensor-pane readouts
// --------------------------------------------------

import GameStateManager from "./GameStateManager.js";
import MicrobiomeLibrary from "./MicrobiomeLibrary.js";
import PondPerception from "./PondPerception.js";
import PondSensorInfoPanel from "./PondSensorInfoPanel.js";
import PondSignalProbe from "./PondSignalProbe.js";
import CellSystemManager from "./CellSystemManager.js";
import CellHealthCalculator from "./CellHealthCalculator.js";
import CellEnvironmentEngine from "./CellEnvironmentEngine.js";
import CellConditionCalculator from "./CellConditionCalculator.js";
import CellStatusEvaluator
    from "./CellStatusEvaluator.js";
    import CellCapabilityEvaluator
    from "./CellCapabilityEvaluator.js";

const NUMERIC_STATUS_METRIC_IDS = {

    mutationRate:
        "stat-mutation",

    dnaDamage:
        "stat-dna-damage",

    atpProduction:
        "stat-atp-prod",

    nutrientProcessing:
        "stat-nutrient-proc",

    autophagy:
        "stat-autophagy",

    cellMembraneHealth:
        "stat-membrane",

    cytoskeleton:
        "stat-cytoskeleton",

    motility:
        "stat-motility",

    phagocytosis:
        "stat-phagocytosis",

    reproduction:
        "stat-reproduction",

    contractileVacuoleFunction:
        "stat-vacuole",

    encystmentAbility:
        "stat-encystment"

};

const PondMicrobiomeSensorPane = {

    microbiomeElement: null,

    oxygenElement: null,
    phElement: null,
    lightElement: null,
    chemicalSignalsElement: null,
    temperatureElement: null,
    compositeHealthElement: null,
    compositeHealthCardElement: null,

    oxygenCardElement: null,
    phCardElement: null,
    lightCardElement: null,
    chemicalSignalsCardElement: null,
    temperatureCardElement: null,

    pseudopodElement: null,
    adhesionElement: null,
    anchoringElement: null,
    systemAnchoringElement: null,
    systemStatusMessageElement: null,
    statusMetricElements: null,

    // --------------------------------------------------
    // Find sensor-pane display elements
    // --------------------------------------------------
    initialize() {

        if (
            this.statusMetricElements &&
Object.values(
    this.statusMetricElements
).every(Boolean) &&
            this.systemStatusMessageElement &&
            this.microbiomeElement &&
            this.oxygenElement &&
            this.phElement &&
            this.lightElement &&
            this.chemicalSignalsElement &&
            this.temperatureElement &&
            this.compositeHealthElement &&
            this.compositeHealthCardElement &&
            this.oxygenCardElement &&
            this.phCardElement &&
            this.lightCardElement &&
            this.chemicalSignalsCardElement &&
            this.temperatureCardElement &&
            this.pseudopodElement &&
            this.adhesionElement &&
            this.anchoringElement &&
            this.systemAnchoringElement
            
        ) {
            return;
        }

        // --------------------------------------------------
        // Current microbiome display
        // --------------------------------------------------

        this.microbiomeElement =
            document.getElementById(
                "pond-current-microbiome"
            );

        // --------------------------------------------------
        // Quick environmental sensor values
        // --------------------------------------------------

        this.oxygenElement =
            document.getElementById(
                "pond-sensor-oxygen"
            );

        this.phElement =
            document.getElementById(
                "pond-sensor-ph"
            );

        this.lightElement =
            document.getElementById(
                "pond-sensor-light"
            );

        this.chemicalSignalsElement =
            document.getElementById(
                "pond-sensor-chemical-signals"
            );

        this.temperatureElement =
            document.getElementById(
                "pond-sensor-temperature"
            );

            this.compositeHealthElement =
    document.getElementById(
        "pond-composite-health-value"
    );
    this.compositeHealthCardElement =
    document.getElementById(
        "pond-composite-health-score"
    );

        // --------------------------------------------------
        // Clickable sensor cards
        // --------------------------------------------------

        this.oxygenCardElement =
            document.getElementById(
                "btn-pond-sensor-oxygen"
            );

        this.phCardElement =
            document.getElementById(
                "btn-pond-sensor-ph"
            );

        this.lightCardElement =
            document.getElementById(
                "btn-pond-sensor-light"
            );

        this.chemicalSignalsCardElement =
            document.getElementById(
                "btn-pond-sensor-chemical-signals"
            );

        this.temperatureCardElement =
            document.getElementById(
                "btn-pond-sensor-temperature"
            );

        // --------------------------------------------------
        // Cell capability and anchoring readouts
        // --------------------------------------------------

        this.pseudopodElement =
            document.getElementById(
                "stat-pseudopod"
            );

        this.adhesionElement =
            document.getElementById(
                "stat-cell-adhesion"
            );

        this.anchoringElement =
            document.getElementById(
                "stat-anchoring"
            );

        this.systemAnchoringElement =
            document.getElementById(
                "pond-system-anchoring-status"
            );

            this.systemStatusMessageElement =
    document.getElementById(
        "pond-system-status-message"
    );

            // --------------------------------------------------
// Detailed numerical cell-health metrics
// --------------------------------------------------

this.statusMetricElements =
    Object.fromEntries(
        Object.entries(
            NUMERIC_STATUS_METRIC_IDS
        ).map(
            ([metricName, elementId]) => [
                metricName,
                document.getElementById(
                    elementId
                )
            ]
        )
    );

        // --------------------------------------------------
        // Missing-display warnings
        // --------------------------------------------------

        if (!this.microbiomeElement) {
            console.warn(
                "PondMicrobiomeSensorPane: current microbiome display not found"
            );
        }

        if (!this.oxygenElement) {
            console.warn(
                "PondMicrobiomeSensorPane: oxygen display not found"
            );
        }

        if (!this.phElement) {
            console.warn(
                "PondMicrobiomeSensorPane: pH display not found"
            );
        }

        if (!this.lightElement) {
            console.warn(
                "PondMicrobiomeSensorPane: light display not found"
            );
        }

        if (!this.chemicalSignalsElement) {
            console.warn(
                "PondMicrobiomeSensorPane: chemical signals display not found"
            );
        }

        if (!this.temperatureElement) {
            console.warn(
                "PondMicrobiomeSensorPane: temperature display not found"
            );
        }

        if (!this.compositeHealthElement) {
    console.warn(
        "PondMicrobiomeSensorPane: composite health display not found"
    );
}

        if (!this.oxygenCardElement) {
            console.warn(
                "PondMicrobiomeSensorPane: oxygen card not found"
            );
        }

        if (!this.phCardElement) {
            console.warn(
                "PondMicrobiomeSensorPane: pH card not found"
            );
        }

        if (!this.lightCardElement) {
            console.warn(
                "PondMicrobiomeSensorPane: light card not found"
            );
        }

        if (!this.chemicalSignalsCardElement) {
            console.warn(
                "PondMicrobiomeSensorPane: chemical signals card not found"
            );
        }

        if (!this.temperatureCardElement) {
            console.warn(
                "PondMicrobiomeSensorPane: temperature card not found"
            );
        }

        if (!this.pseudopodElement) {
            console.warn(
                "PondMicrobiomeSensorPane: pseudopod display not found"
            );
        }

        if (!this.adhesionElement) {
            console.warn(
                "PondMicrobiomeSensorPane: cell adhesion display not found"
            );
        }

        if (!this.anchoringElement) {
            console.warn(
                "PondMicrobiomeSensorPane: anchoring display not found"
            );
        }

        if (!this.systemAnchoringElement) {
            console.warn(
                "PondMicrobiomeSensorPane: system anchoring display not found"
            );
        }

        if (!this.systemStatusMessageElement) {
    console.warn(
        "PondMicrobiomeSensorPane: system status message display not found"
    );
}

if (!this.compositeHealthCardElement) {
    console.warn(
        "PondMicrobiomeSensorPane: composite health card not found"
    );
}

        Object.entries(
    this.statusMetricElements
).forEach(
    ([metricName, element]) => {

        if (!element) {
            console.warn(
                `PondMicrobiomeSensorPane: "${metricName}" display not found`
            );
        }

    }
);

        // --------------------------------------------------
        // Sensor learning panels
        // --------------------------------------------------

        this.attachInfoPanelListener(
            this.oxygenCardElement,
            "Oxygen",
            "Dissolved oxygen supports aerobic cellular respiration. Low oxygen can reduce ATP production and limit other cell functions."
        );

        this.attachInfoPanelListener(
            this.phCardElement,
            "pH Level",
            "pH affects protein shape and enzyme activity. Strongly acidic or alkaline water can stress the cell and interfere with normal reactions."
        );

        this.attachInfoPanelListener(
            this.lightCardElement,
            "Light Level",
            "Light supports photosynthetic organisms in the microbiome. It can also influence ultraviolet exposure and local oxygen conditions."
        );

        this.attachInfoPanelListener(
            this.temperatureCardElement,
            "Temperature",
            "Temperature affects the speed of diffusion, membrane transport, and enzyme-controlled reactions."
        );

        this.attachInfoPanelListener(
    this.compositeHealthCardElement,
    "Composite Health Score",
    "Composite Health combines your cell's intrinsic organelle efficiency with the temporary conditions of the current microbiome. Moving to a new tile can change this score without permanently changing your cell."
);

        // --------------------------------------------------
        // Chemical Signals probe-control button
        // --------------------------------------------------

        if (this.chemicalSignalsCardElement) {
            this.chemicalSignalsCardElement.addEventListener(
                "click",
                () => {
                    PondSignalProbe.toggle();

                    this.updateChemicalSignalsCardState();
                }
            );
        }

    },

    // --------------------------------------------------
// Connect one sensor card to the information panel
// --------------------------------------------------
attachInfoPanelListener(
    cardElement,
    title,
    message
) {

    if (!cardElement) {
        return;
    }

    cardElement.addEventListener(
        "click",
        () => {

            if (PondSignalProbe.isActive()) {
                PondSignalProbe.deactivate();

                this.updateChemicalSignalsCardState();

                return;
            }

            PondSensorInfoPanel.open({
                title,
                message
            });

        }
    );

},

    // --------------------------------------------------
    // Update Chemical Signals probe-control appearance
    // --------------------------------------------------
    updateChemicalSignalsCardState() {

        if (!this.chemicalSignalsCardElement) {
            return;
        }

        const probeActive =
            PondSignalProbe.isActive();

        this.chemicalSignalsCardElement.setAttribute(
            "aria-pressed",
            String(probeActive)
        );

        this.chemicalSignalsCardElement.classList.toggle(
            "pond-sensor-card--probe-active",
            probeActive
        );

    },

    // --------------------------------------------------
// Format one numeric sensor value
// --------------------------------------------------
formatDecimal(
    value,
    decimalPlaces = 2
) {

    return Number.isFinite(value)
        ? value.toFixed(decimalPlaces)
        : "--";

},

// --------------------------------------------------
// Update one detailed cell-health percentage
// --------------------------------------------------
updatePercentMetric(
    metricName,
    value
) {

    const element =
        this.statusMetricElements?.[
            metricName
        ];

    if (!element) {
        return;
    }

    element.textContent =
        Number.isFinite(value)
            ? `${Math.round(value * 100)}%`
            : "--";

},

// --------------------------------------------------
// Calculate current cell condition on this tile
// --------------------------------------------------
calculateCurrentCellCondition(tile) {

    const baseReport =
        CellHealthCalculator.calculate(
            CellSystemManager.getAllSystems()
        );

    const environmentReport =
        CellEnvironmentEngine.calculate(
            tile
        );

    const effectiveCellReport =
        CellConditionCalculator.calculate(
            baseReport,
            environmentReport
        );

    return {
        environmentReport,
        effectiveCellReport
    };

},

    // --------------------------------------------------
    // Update an available or locked cell capability
    // --------------------------------------------------
    updateCapability(element, available) {

        if (!element) {
            return;
        }

        element.textContent =
            available
                ? "AVAIL"
                : "LOCKED";

        element.classList.toggle(
            "ec-status--available",
            available
        );

        element.classList.toggle(
            "ec-status--locked",
            !available
        );

    },

    // --------------------------------------------------
    // Update current microbiome and sensor readouts
    // --------------------------------------------------
    render(tile) {

        this.initialize();

        this.updateChemicalSignalsCardState();

        const currentCellCondition =
    tile
        ? this.calculateCurrentCellCondition(
            tile
        )
        : null;

const environmentReport =
    currentCellCondition
        ?.environmentReport ?? null;

const effectiveCellReport =
    currentCellCondition
        ?.effectiveCellReport ?? null;

        const profile =
            tile?.biome
                ? MicrobiomeLibrary[tile.biome]
                : null;

        // --------------------------------------------------
        // Current microbiome name
        // --------------------------------------------------

        if (this.microbiomeElement) {
            this.microbiomeElement.textContent =
                profile?.name ?? "Undetermined";
        }

        // --------------------------------------------------
        // Quick environmental sensor cards
        // --------------------------------------------------

        if (this.oxygenElement) {
            this.oxygenElement.textContent =
                this.formatDecimal(
                    tile?.physics?.oxygen
                );
        }

        if (this.phElement) {
            this.phElement.textContent =
                this.formatDecimal(
                    tile?.physics?.ph
                );
        }

        if (this.lightElement) {
            this.lightElement.textContent =
                this.formatDecimal(
                    tile?.physics?.light
                );
        }

        if (this.temperatureElement) {

    const temperature =
        this.formatDecimal(
            tile?.physics?.temperature,
            1
        );

    this.temperatureElement.textContent =
        temperature === "--"
            ? "--"
            : `${temperature} °C`;

}

// --------------------------------------------------
// Effective composite cell health score
// --------------------------------------------------

if (this.compositeHealthElement) {

    this.compositeHealthElement.textContent =
        effectiveCellReport
            ? `${Math.round(
                effectiveCellReport
                    .compositeHealth *
                100
            )}%`
            : "--";

}

// --------------------------------------------------
// Effective detailed cell-health metrics
// --------------------------------------------------

if (effectiveCellReport) {

    this.updatePercentMetric(
        "mutationRate",
        effectiveCellReport
            .geneticIntegrity
            .mutationRate
    );

    this.updatePercentMetric(
        "dnaDamage",
        effectiveCellReport
            .geneticIntegrity
            .dnaDamage
    );

    this.updatePercentMetric(
        "atpProduction",
        effectiveCellReport
            .metabolicActivity
            .atpProduction
    );

    this.updatePercentMetric(
        "nutrientProcessing",
        effectiveCellReport
            .metabolicActivity
            .nutrientProcessing
    );

    this.updatePercentMetric(
        "autophagy",
        effectiveCellReport
            .metabolicActivity
            .autophagy
    );

    this.updatePercentMetric(
        "cellMembraneHealth",
        effectiveCellReport
            .structuralIntegrity
            .cellMembraneHealth
    );

    this.updatePercentMetric(
        "cytoskeleton",
        effectiveCellReport
            .structuralIntegrity
            .cytoskeleton
    );

    this.updatePercentMetric(
        "motility",
        effectiveCellReport
            .functionalActivity
            .motility
    );

    this.updatePercentMetric(
        "phagocytosis",
        effectiveCellReport
            .functionalActivity
            .phagocytosis
    );

    this.updatePercentMetric(
        "reproduction",
        effectiveCellReport
            .functionalActivity
            .reproduction
    );

    this.updatePercentMetric(
        "contractileVacuoleFunction",
        effectiveCellReport
            .environmentalResponse
            .contractileVacuoleFunction
    );

    this.updatePercentMetric(
        "encystmentAbility",
        effectiveCellReport
            .environmentalResponse
            .encystmentAbility
    );

}

        // --------------------------------------------------
        // Chemical signals quick readout
        // --------------------------------------------------

        if (this.chemicalSignalsElement) {

            const classification =
                PondPerception.classifyTile(
                    tile
                );

            this.chemicalSignalsElement.textContent =
                classification.label;

        }

        // --------------------------------------------------
        // Cell capability readouts
        // --------------------------------------------------

        const capabilities =
    CellCapabilityEvaluator.evaluate();

this.updateCapability(
    this.pseudopodElement,
    capabilities.pseudopodFormation
        .available
);

this.updateCapability(
    this.adhesionElement,
    capabilities.cellAdhesion
        .available
);

        // --------------------------------------------------
        // Current anchoring state
        // --------------------------------------------------

        const anchored =
            GameStateManager.isPondPlayerAnchored();

        if (this.anchoringElement) {
            this.anchoringElement.textContent =
                anchored
                    ? "ANCHORED"
                    : "UNANCHORED";
        }

        if (this.systemAnchoringElement) {
            this.systemAnchoringElement.textContent =
                anchored
                    ? "Anchored"
                    : "Drifting";
        }

        // --------------------------------------------------
// Prioritized current system-status message
// --------------------------------------------------

if (this.systemStatusMessageElement) {

    const status =
        CellStatusEvaluator.evaluate(
            effectiveCellReport,
            environmentReport
        );

    this.systemStatusMessageElement.textContent =
        status.message;

}

    }

};

export default PondMicrobiomeSensorPane;