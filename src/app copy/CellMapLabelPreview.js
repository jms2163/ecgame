// --------------------------------------------------
// CellMapLabelPreview.js
// Temporary console-only preview of all Cell Map labels
// --------------------------------------------------

import CellMapLayout from "./CellMapLayout.js";

const SVG_NAMESPACE =
    "http://www.w3.org/2000/svg";

const CellMapLabelPreview = {

    overlayElement: null,
    modifiedMarkerElements: [],
    modifiedPlaceholderElements: [],

    // --------------------------------------------------
    // Create one SVG element
    // --------------------------------------------------
    createSvgElement(
        elementName,
        attributes = {}
    ) {

        const element =
            document.createElementNS(
                SVG_NAMESPACE,
                elementName
            );

        Object.entries(attributes).forEach(
            ([name, value]) => {

                element.setAttribute(
                    name,
                    String(value)
                );

            }
        );

        return element;

    },

    // --------------------------------------------------
    // Show every fixed Cell Map label and leader line
    // --------------------------------------------------
    show() {

        this.hide();

        const svg =
            document.querySelector(
                "#cell-map-container .cell-map-svg"
            );

        if (!svg) {
            console.warn(
                "CellMapLabelPreview: Cell Map SVG not found"
            );

            return;
        }

        // --------------------------------------------------
        // Make marker circles transparent
        // --------------------------------------------------

        this.modifiedMarkerElements = [
            ...svg.querySelectorAll(
                ".cell-map-feature-node"
            )
        ].map(
            element => ({
                element,

                previousFill:
                    element.style.fill
            })
        );

        this.modifiedMarkerElements.forEach(
            ({ element }) => {

                element.style.fill =
                    "transparent";

            }
        );

        // --------------------------------------------------
        // Hide only the ? characters
        // --------------------------------------------------

        this.modifiedPlaceholderElements = [
            ...svg.querySelectorAll(
                ".cell-map-feature-placeholder"
            )
        ].map(
            element => ({
                element,

                previousVisibility:
                    element.style.visibility
            })
        );

        this.modifiedPlaceholderElements.forEach(
            ({ element }) => {

                element.style.visibility =
                    "hidden";

            }
        );

        // --------------------------------------------------
        // Draw temporary all-label overlay
        // --------------------------------------------------

        this.overlayElement =
            this.createSvgElement(
                "g",
                {
                    id:
                        "cell-map-label-preview"
                }
            );

        CellMapLayout.features.forEach(
            feature => {

                const line =
                    this.createSvgElement(
                        "line",
                        {
                            class:
                                "cell-map-label-preview-line",

                            x1:
                                feature.node.x,

                            y1:
                                feature.node.y,

                            x2:
                                feature.labelPosition.x,

                            y2:
                                feature.labelPosition.y,

                            stroke:
                                "#2b103d",

                            "stroke-width":
                                "2",

                            opacity:
                                "0.8",

                            "pointer-events":
                                "none"
                        }
                    );

                const label =
                    this.createSvgElement(
                        "text",
                        {
                            class:
                                "cell-map-label-preview-label",

                            x:
                                feature.labelPosition.x,

                            y:
                                feature.labelPosition.y,

                            fill:
                                "#2b103d",

                            "font-family":
                                "monospace",

                            "font-size":
                                "18",

                            "font-weight":
                                "bold",

                            "text-anchor":
                                feature.labelPosition.anchor,

                            "dominant-baseline":
                                "middle",

                            "pointer-events":
                                "none"
                        }
                    );

                label.textContent =
                    feature.label;

                this.overlayElement.append(
                    line,
                    label
                );

            }
        );

        svg.appendChild(
            this.overlayElement
        );

        console.log(
            "CellMapLabelPreview: all labels shown"
        );

    },

    // --------------------------------------------------
    // Remove temporary label preview
    // --------------------------------------------------
    hide() {

        this.overlayElement?.remove();

        this.overlayElement = null;

        this.modifiedMarkerElements.forEach(
            ({
                element,
                previousFill
            }) => {

                element.style.fill =
                    previousFill;

            }
        );

        this.modifiedMarkerElements = [];

        this.modifiedPlaceholderElements.forEach(
            ({
                element,
                previousVisibility
            }) => {

                element.style.visibility =
                    previousVisibility;

            }
        );

        this.modifiedPlaceholderElements = [];

    }

};

export default CellMapLabelPreview;