// --------------------------------------------------
// CellMapHotspotCalibrator.js
// Temporary tool for measuring Cell Map hotspot locations
// --------------------------------------------------

const SVG_NAMESPACE =
    "http://www.w3.org/2000/svg";

const CellMapHotspotCalibrator = {

    svgElement: null,
    overlayElement: null,
    hitAreaElement: null,
    visualCircleElement: null,

    x: 600,
    y: 400,
    diameter: 10,

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
    // Show temporary draggable calibration circle
    // --------------------------------------------------
    show({
        x = 600,
        y = 400,
        diameter = 10
    } = {}) {

        this.hide();

        const svg =
            document.querySelector(
                "#cell-map-container .cell-map-svg"
            );

        if (!svg) {
            console.warn(
                "CellMapHotspotCalibrator: Cell Map SVG not found"
            );

            return;
        }

        this.svgElement = svg;

        this.overlayElement =
            this.createSvgElement(
                "g",
                {
                    class:
                        "cell-map-hotspot-calibrator"
                }
            );

        // Larger invisible area makes the small circle easier to drag.
        this.hitAreaElement =
            this.createSvgElement(
                "circle",
                {
                    class:
                        "cell-map-hotspot-calibrator-hit-area",

                    r: "20"
                }
            );

        this.visualCircleElement =
            this.createSvgElement(
                "circle",
                {
                    class:
                        "cell-map-hotspot-calibrator-handle"
                }
            );

        this.hitAreaElement.addEventListener(
            "pointerdown",
            event => {

                this.beginDrag(
                    event
                );

            }
        );

        this.hitAreaElement.addEventListener(
            "pointermove",
            event => {

                this.continueDrag(
                    event
                );

            }
        );

        this.hitAreaElement.addEventListener(
            "pointerup",
            event => {

                this.endDrag(
                    event
                );

            }
        );

        this.hitAreaElement.addEventListener(
            "pointercancel",
            event => {

                this.endDrag(
                    event
                );

            }
        );

        this.hitAreaElement.addEventListener(
            "dblclick",
            event => {

                event.preventDefault();

                this.increaseDiameter();

            }
        );

        this.overlayElement.append(
            this.hitAreaElement,
            this.visualCircleElement
        );

        this.svgElement.appendChild(
            this.overlayElement
        );

        this.setPosition(
            x,
            y
        );

        this.setDiameter(
            diameter
        );

        console.log(
            "CellMapHotspotCalibrator: active"
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
    // Begin dragging calibration circle
    // --------------------------------------------------
    beginDrag(event) {

        if (event.button !== 0) {
            return;
        }

        event.preventDefault();

        this.hitAreaElement.setPointerCapture(
            event.pointerId
        );

        this.updatePositionFromPointer(
            event
        );

    },

    // --------------------------------------------------
    // Continue dragging calibration circle
    // --------------------------------------------------
    continueDrag(event) {

        if (
            !this.hitAreaElement.hasPointerCapture(
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
    // Finish dragging and report placement
    // --------------------------------------------------
    endDrag(event) {

        if (
            this.hitAreaElement.hasPointerCapture(
                event.pointerId
            )
        ) {
            this.hitAreaElement.releasePointerCapture(
                event.pointerId
            );
        }

        this.updatePositionFromPointer(
            event
        );

        this.logPlacement();

    },

    // --------------------------------------------------
    // Update position from pointer event
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
    // Set calibration-circle location
    // --------------------------------------------------
    setPosition(
        x,
        y
    ) {

        this.x = x;
        this.y = y;

        this.hitAreaElement?.setAttribute(
            "cx",
            x
        );

        this.hitAreaElement?.setAttribute(
            "cy",
            y
        );

        this.visualCircleElement?.setAttribute(
            "cx",
            x
        );

        this.visualCircleElement?.setAttribute(
            "cy",
            y
        );

    },

    // --------------------------------------------------
    // Set visual circle diameter in SVG layout units
    // --------------------------------------------------
    setDiameter(diameter) {

        const numericDiameter =
            Number(diameter);

        if (
            !Number.isFinite(
                numericDiameter
            )
        ) {
            console.warn(
                "CellMapHotspotCalibrator: diameter must be numeric"
            );

            return;
        }

        this.diameter =
            Math.max(
                10,
                Math.min(
                    200,
                    Math.round(
                        numericDiameter / 10
                    ) * 10
                )
            );

        this.visualCircleElement?.setAttribute(
            "r",
            this.diameter / 2
        );

    },

    // --------------------------------------------------
    // Increase diameter by 10, up to 200
    // --------------------------------------------------
    increaseDiameter() {

        this.setDiameter(
            this.diameter + 10
        );

        console.log(
            `CellMapHotspotCalibrator: diameter = ${this.diameter}`
        );

    },

    // --------------------------------------------------
    // Read rounded placement for CellMapLayout
    // --------------------------------------------------
    getPlacement() {

        return {
            x: Math.round(
                this.x
            ),

            y: Math.round(
                this.y
            ),

            diameter:
                this.diameter
        };

    },

    // --------------------------------------------------
    // Print placement after drag release
    // --------------------------------------------------
    logPlacement() {

        const placement =
            this.getPlacement();

        console.log(
            "CellMapHotspotCalibrator:",
            placement
        );

    },

    // --------------------------------------------------
    // Remove temporary calibration circle
    // --------------------------------------------------
    hide() {

        this.overlayElement?.remove();

        this.svgElement = null;
        this.overlayElement = null;
        this.hitAreaElement = null;
        this.visualCircleElement = null;

    }

};

export default CellMapHotspotCalibrator;