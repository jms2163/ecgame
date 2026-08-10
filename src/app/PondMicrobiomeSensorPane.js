// --------------------------------------------------
// PondMicrobiomeSensorPane.js
// Updates Microbiome sensor-pane readouts
// --------------------------------------------------

import GameStateManager from "./GameStateManager.js";
import MicrobiomeLibrary from "./MicrobiomeLibrary.js";
import PondPerception from "./PondPerception.js";
import PondSensorInfoPanel from "./PondSensorInfoPanel.js";

const PondMicrobiomeSensorPane = {

    microbiomeElement: null,

    oxygenElement: null,
    phElement: null,
    lightElement: null,
    chemicalSignalsElement: null,
    temperatureElement: null,

    oxygenCardElement: null,
    phCardElement: null,
    lightCardElement: null,
    temperatureCardElement: null,

    pseudopodElement: null,
    adhesionElement: null,
    anchoringElement: null,
    systemAnchoringElement: null,

    // --------------------------------------------------
    // Find sensor-pane display elements
    // --------------------------------------------------
    initialize() {

        if (
            this.microbiomeElement &&
            this.oxygenElement &&
            this.phElement &&
            this.lightElement &&
            this.chemicalSignalsElement &&
            this.temperatureElement &&
            this.oxygenCardElement &&
            this.phCardElement &&
            this.lightCardElement &&
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
                PondSensorInfoPanel.open({
                    title,
                    message
                });
            }
        );

    },

    // --------------------------------------------------
    // Format one numeric sensor value
    // --------------------------------------------------
    formatDecimal(value) {

        return Number.isFinite(value)
            ? value.toFixed(2)
            : "--";

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
            this.temperatureElement.textContent =
                this.formatDecimal(
                    tile?.physics?.temperature
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

        const pseudopodsAvailable =
            GameStateManager.hasDiscovery(
                "cytoskeleton"
            );

        this.updateCapability(
            this.pseudopodElement,
            pseudopodsAvailable
        );

        const adhesionAvailable =
            GameStateManager.hasDiscovery(
                "glycoproteins"
            );

        this.updateCapability(
            this.adhesionElement,
            adhesionAvailable
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

    }

};

export default PondMicrobiomeSensorPane;