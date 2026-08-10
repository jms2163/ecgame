// --------------------------------------------------
// PondMicrobiomeSensorPane.js
// Updates Microbiome sensor-pane readouts
// --------------------------------------------------

import GameStateManager from "./GameStateManager.js";
import MicrobiomeLibrary from "./MicrobiomeLibrary.js";

const PondMicrobiomeSensorPane = {

    microbiomeElement: null,
    oxygenElement: null,
    phElement: null,
    lightElement: null,
    temperatureElement: null,
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
            this.temperatureElement &&
            this.pseudopodElement &&
            this.adhesionElement &&
            this.anchoringElement &&
            this.systemAnchoringElement
        ) {
            return;
        }

        this.microbiomeElement =
            document.getElementById(
                "pond-current-microbiome"
            );

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

        this.temperatureElement =
            document.getElementById(
                "pond-sensor-temperature"
            );

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

        if (!this.temperatureElement) {
            console.warn(
                "PondMicrobiomeSensorPane: temperature display not found"
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

    },

    // --------------------------------------------------
    // Format a numeric environmental reading
    // --------------------------------------------------
    formatDecimal(value) {

        return Number.isFinite(value)
            ? value.toFixed(2)
            : "--";

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

        const anchored =
            GameStateManager.isPondPlayerAnchored();

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
        // Cell capability and anchoring readouts
        // --------------------------------------------------

        if (this.pseudopodElement) {

            const pseudopodsAvailable =
                GameStateManager.hasDiscovery(
                    "cytoskeleton"
                );

            this.pseudopodElement.textContent =
                pseudopodsAvailable
                    ? "AVAIL"
                    : "LOCKED";

            this.pseudopodElement.classList.toggle(
                "ec-status--available",
                pseudopodsAvailable
            );

            this.pseudopodElement.classList.toggle(
                "ec-status--locked",
                !pseudopodsAvailable
            );
        }

        if (this.adhesionElement) {

            const adhesionAvailable =
                GameStateManager.hasDiscovery(
                    "glycoproteins"
                );

            this.adhesionElement.textContent =
                adhesionAvailable
                    ? "AVAIL"
                    : "LOCKED";

            this.adhesionElement.classList.toggle(
                "ec-status--available",
                adhesionAvailable
            );

            this.adhesionElement.classList.toggle(
                "ec-status--locked",
                !adhesionAvailable
            );
        }

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