// --------------------------------------------------
// CellMapLabelCalibrator.js
// Temporary tool for arranging Cell Map label positions
// --------------------------------------------------

import CellMapLayout from "./CellMapLayout.js";

const SVG_NAMESPACE =
    "http://www.w3.org/2000/svg";

const CellMapLabelCalibrator = {

    svgElement: null,
    overlayElement: null,

    activeFeature: null,
    activeLineElement: null,
    activeLabelElement: null,
    activeHitAreaElement: null,
    activeHandleElement: null,

    x: 0,
    y: 0,

    draftLabelPositions: {},

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
    // Read saved or temporary label position
    // --------------------------------------------------
    getLabelPosition(feature) {

        return (
            this.draftLabelPositions[
                feature.id
            ] ??
            feature.labelPosition
        );

    },

    // --------------------------------------------------
    // Determine label text direction from its position
    // --------------------------------------------------
    getAnchorForPosition(
        feature,
        x
    ) {

        return x < feature.node.x
            ? "start"
            : "end";

    },

    // --------------------------------------------------
    // Show calibration overlay for one feature label
    // --------------------------------------------------
    show(featureId) {

        this.hide();

        const feature =
            CellMapLayout.getFeature(
                featureId
            );

        if (!feature) {
            console.warn(
                `CellMapLabelCalibrator: unknown feature "${featureId}"`
            );

            return;
        }

        const svg =
            document.querySelector(
                "#cell-map-container .cell-map-svg"
            );

        if (!svg) {
            console.warn(
                "CellMapLabelCalibrator: Cell Map SVG not found"
            );

            return;
        }

        this.svgElement = svg;
        this.activeFeature = feature;

        this.overlayElement =
            this.createSvgElement(
                "g",
                {
                    class:
                        "cell-map-label-calibrator"
                }
            );

        // --------------------------------------------------
        // Show all non-active label guides
        // --------------------------------------------------

        CellMapLayout.features.forEach(
            guideFeature => {

                if (
                    guideFeature.id ===
                    feature.id
                ) {
                    return;
                }

                const guidePosition =
                    this.getLabelPosition(
                        guideFeature
                    );

                const guideLine =
                    this.createSvgElement(
                        "line",
                        {
                            class:
                                "cell-map-label-calibrator-guide-line",

                            x1:
                                guideFeature.node.x,

                            y1:
                                guideFeature.node.y,

                            x2:
                                guidePosition.x,

                            y2:
                                guidePosition.y
                        }
                    );

                const guideLabel =
                    this.createSvgElement(
                        "text",
                        {
                            class:
                                "cell-map-label-calibrator-guide-label",

                            x:
                                guidePosition.x,

                            y:
                                guidePosition.y,

                            "text-anchor":
                                guidePosition.anchor,

                            "dominant-baseline":
                                "middle"
                        }
                    );

                guideLabel.textContent =
                    guideFeature.label;

                this.overlayElement.append(
                    guideLine,
                    guideLabel
                );

            }
        );

        // --------------------------------------------------
        // Active draggable label guide
        // --------------------------------------------------

        this.activeLineElement =
            this.createSvgElement(
                "line",
                {
                    class:
                        "cell-map-label-calibrator-active-line",

                    x1:
                        feature.node.x,

                    y1:
                        feature.node.y
                }
            );

        this.activeLabelElement =
            this.createSvgElement(
                "text",
                {
                    class:
                        "cell-map-label-calibrator-active-label",

                    "dominant-baseline":
                        "middle"
                }
            );

        this.activeLabelElement.textContent =
            feature.label;

        this.activeHitAreaElement =
            this.createSvgElement(
                "circle",
                {
                    class:
                        "cell-map-label-calibrator-hit-area",

                    r: "20"
                }
            );

        this.activeHandleElement =
            this.createSvgElement(
                "circle",
                {
                    class:
                        "cell-map-label-calibrator-handle",

                    r: "8"
                }
            );

        this.activeHitAreaElement.addEventListener(
            "pointerdown",
            event => {

                this.beginDrag(
                    event
                );

            }
        );

        this.activeHitAreaElement.addEventListener(
            "pointermove",
            event => {

                this.continueDrag(
                    event
                );

            }
        );

        this.activeHitAreaElement.addEventListener(
            "pointerup",
            event => {

                this.endDrag(
                    event
                );

            }
        );

        this.activeHitAreaElement.addEventListener(
            "pointercancel",
            event => {

                this.endDrag(
                    event
                );

            }
        );

        this.overlayElement.append(
            this.activeLineElement,
            this.activeLabelElement,
            this.activeHitAreaElement,
            this.activeHandleElement
        );

        this.svgElement.appendChild(
            this.overlayElement
        );

        const startingPosition =
            this.getLabelPosition(
                feature
            );

        this.setPosition(
            startingPosition.x,
            startingPosition.y
        );

        console.log(
            `CellMapLabelCalibrator: calibrating ${feature.id}`
        );

    },

    // --------------------------------------------------
    // Convert pointer position into SVG layout coordinates
    // --------------------------------------------------
    getSvgPoint(event) {

        if (!this.svgElement) {
            return null;
        }

        const matrix =
            this.svgElement.getScreenCTM();

        if (!matrix) {
            return null;
        }

        const point =
            this.svgElement.createSVGPoint();

        point.x =
            event.clientX;

        point.y =
            event.clientY;

        return point.matrixTransform(
            matrix.inverse()
        );

    },

    // --------------------------------------------------
    // Begin dragging active label endpoint
    // --------------------------------------------------
    beginDrag(event) {

        if (event.button !== 0) {
            return;
        }

        event.preventDefault();

        this.activeHitAreaElement.setPointerCapture(
            event.pointerId
        );

        this.updatePositionFromPointer(
            event
        );

    },

    // --------------------------------------------------
    // Continue dragging active label endpoint
    // --------------------------------------------------
    continueDrag(event) {

        if (
            !this.activeHitAreaElement.hasPointerCapture(
                event.pointerId
            )
        ) {
            return;
        }

        this.updatePositionFromPointer(
            event
        );

    },

    // --------------------------------------------------
    // Finish drag and report label placement
    // --------------------------------------------------
    endDrag(event) {

        if (
            this.activeHitAreaElement.hasPointerCapture(
                event.pointerId
            )
        ) {
            this.activeHitAreaElement.releasePointerCapture(
                event.pointerId
            );
        }

        this.updatePositionFromPointer(
            event
        );

        this.logPlacement();

    },

    // --------------------------------------------------
    // Update active label from pointer event
    // --------------------------------------------------
    updatePositionFromPointer(event) {

        const point =
            this.getSvgPoint(
                event
            );

        if (!point) {
            return;
        }

        this.setPosition(
            point.x,
            point.y
        );

    },

    // --------------------------------------------------
    // Move active label endpoint and guide line
    // --------------------------------------------------
    setPosition(
        x,
        y
    ) {

        if (!this.activeFeature) {
            return;
        }

        const anchor =
            this.getAnchorForPosition(
                this.activeFeature,
                x
            );

        this.x = x;
        this.y = y;

        this.draftLabelPositions[
            this.activeFeature.id
        ] = {
            x,
            y,
            anchor
        };

        this.activeLineElement.setAttribute(
            "x2",
            x
        );

        this.activeLineElement.setAttribute(
            "y2",
            y
        );

        this.activeLabelElement.setAttribute(
            "x",
            x
        );

        this.activeLabelElement.setAttribute(
            "y",
            y
        );

        this.activeLabelElement.setAttribute(
            "text-anchor",
            anchor
        );

        this.activeHitAreaElement.setAttribute(
            "cx",
            x
        );

        this.activeHitAreaElement.setAttribute(
            "cy",
            y
        );

        this.activeHandleElement.setAttribute(
            "cx",
            x
        );

        this.activeHandleElement.setAttribute(
            "cy",
            y
        );

    },

    // --------------------------------------------------
    // Read rounded active label placement
    // --------------------------------------------------
    getPlacement() {

        if (!this.activeFeature) {
            return null;
        }

        return {
            featureId:
                this.activeFeature.id,

            labelPosition: {
                x: Math.round(
                    this.x
                ),

                y: Math.round(
                    this.y
                ),

                anchor:
                    this.getAnchorForPosition(
                        this.activeFeature,
                        this.x
                    )
            }
        };

    },

    // --------------------------------------------------
    // Print active label placement after drag release
    // --------------------------------------------------
    logPlacement() {

        console.log(
            "CellMapLabelCalibrator:",
            this.getPlacement()
        );

    },

    // --------------------------------------------------
    // Read all temporary label positions
    // --------------------------------------------------
    getDraftLabelPositions() {

        return structuredClone(
            this.draftLabelPositions
        );

    },

    // --------------------------------------------------
    // Remove visible overlay but retain draft positions
    // --------------------------------------------------
    hide() {

        this.overlayElement?.remove();

        this.svgElement = null;
        this.overlayElement = null;

        this.activeFeature = null;
        this.activeLineElement = null;
        this.activeLabelElement = null;
        this.activeHitAreaElement = null;
        this.activeHandleElement = null;

    },

    // --------------------------------------------------
    // Remove all temporary draft label positions
    // --------------------------------------------------
    clearDraftLabelPositions() {

        this.draftLabelPositions = {};

    }

};

export default CellMapLabelCalibrator;