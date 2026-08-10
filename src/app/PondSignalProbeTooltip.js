// --------------------------------------------------
// PondSignalProbeTooltip.js
// Displays one Chemical Signals probe reading
// --------------------------------------------------

import MicrobiomeLibrary from "./MicrobiomeLibrary.js";

const PondSignalProbeTooltip = {

    parentElement: null,
    tooltipElement: null,

    // --------------------------------------------------
    // Create tooltip inside the microscope stage
    // --------------------------------------------------
    initialize(parentElement) {

        if (this.tooltipElement) {
            return;
        }

        if (!parentElement) {
            console.warn(
                "PondSignalProbeTooltip: parent element unavailable"
            );

            return;
        }

        this.parentElement =
            parentElement;

        this.tooltipElement =
            document.createElement("div");

        this.tooltipElement.id =
            "pond-signal-probe-tooltip";

        this.tooltipElement.className =
            "hidden";

        this.tooltipElement.setAttribute(
            "aria-live",
            "polite"
        );

        this.parentElement.appendChild(
            this.tooltipElement
        );

    },

    // --------------------------------------------------
    // Format one chemical signal value
    // --------------------------------------------------
    formatSignal(value) {

        return Number.isFinite(value)
            ? value.toFixed(3)
            : "--";

    },

    // --------------------------------------------------
    // Add one label/value line to the tooltip
    // --------------------------------------------------
    createRow(label, value) {

        const rowElement =
            document.createElement("p");

        rowElement.className =
            "pond-signal-probe-tooltip-row";

        const labelElement =
            document.createElement("span");

        labelElement.className =
            "pond-signal-probe-tooltip-label";

        labelElement.textContent =
            `${label}:`;

        const valueElement =
            document.createElement("span");

        valueElement.className =
            "pond-signal-probe-tooltip-value";

        valueElement.textContent =
            value;

        rowElement.append(
            labelElement,
            valueElement
        );

        return rowElement;

    },

    // --------------------------------------------------
    // Show one perception reading at stage coordinates
    // --------------------------------------------------
    show(reading, left, top) {

        if (!this.tooltipElement || !reading) {
            return;
        }

        const microbiomeProfile =
            MicrobiomeLibrary[
                reading.microbiome
            ];

        const fragment =
            document.createDocumentFragment();

        const headingElement =
            document.createElement("h3");

        headingElement.className =
            "pond-signal-probe-tooltip-heading";

        headingElement.textContent =
            reading.classification.label;

        fragment.appendChild(
            headingElement
        );

        fragment.append(
            this.createRow(
                "Relative",
                reading.relativeLocation
            ),

            this.createRow(
                "Microbiome",
                microbiomeProfile?.name ??
                    reading.microbiome
            ),

            this.createRow(
                "Folate",
                this.formatSignal(
                    reading.signals.folate
                )
            ),

            this.createRow(
                "N-formyl peptides",
                this.formatSignal(
                    reading.signals.nFormylPeptides
                )
            ),

            this.createRow(
                "SCFA",
                this.formatSignal(
                    reading.signals.scfa
                )
            ),

            this.createRow(
                "cAMP",
                this.formatSignal(
                    reading.signals.camp
                )
            ),

            this.createRow(
                "Cyanotoxins",
                this.formatSignal(
                    reading.signals.cyanotoxins
                )
            ),

            this.createRow(
                "Ammonia",
                this.formatSignal(
                    reading.signals.ammonia
                )
            )
        );

        this.tooltipElement.replaceChildren(
            fragment
        );

        this.tooltipElement.style.left =
            `${left}px`;

        this.tooltipElement.style.top =
            `${top}px`;

        this.tooltipElement.classList.remove(
            "hidden"
        );

    },

    // --------------------------------------------------
    // Hide the tooltip
    // --------------------------------------------------
    hide() {

        if (!this.tooltipElement) {
            return;
        }

        this.tooltipElement.classList.add(
            "hidden"
        );

    }

};

export default PondSignalProbeTooltip;