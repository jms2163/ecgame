// --------------------------------------------------
// CellMapView.js
// Renders the static amoeba cell map
// --------------------------------------------------

import GameStateManager from "./GameStateManager.js";
import CellMapLayout from "./CellMapLayout.js";

const SVG_NAMESPACE =
    "http://www.w3.org/2000/svg";

const CellMapView = {

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
    // Render static cell outline and organelle nodes
    // --------------------------------------------------
    render() {

        const container =
            document.getElementById(
                "cell-map-container"
            );

        if (!container) {
            console.warn(
                "CellMapView: #cell-map-container not found"
            );

            return;
        }

        const svg =
            this.createSvgElement(
                "svg",
                {
                    class: "cell-map-svg",
                    viewBox:
                        CellMapLayout.viewBox,
                    role: "img",
                    "aria-label":
                        "Amoeba cell map"
                }
            );

        // --------------------------------------------------
        // Static amoeba outline
        // --------------------------------------------------

        const cellOutline =
            this.createSvgElement(
                "image",
                {
                    class:
                        "cell-map-amoeba-outline",

                    href:
                        "./public/assets/cell/amoeba-outline.svg",

                    x: "180",
                    y: "40",
                    width: "820",
                    height: "700",

                    preserveAspectRatio:
                        "xMidYMid meet"
                }
            );

        svg.appendChild(
            cellOutline
        );

        // --------------------------------------------------
        // Discovered labels and unknown placeholders
        // --------------------------------------------------

        CellMapLayout.features.forEach(
            feature => {

                const discovered =
                    GameStateManager.hasDiscovery(
                        feature.discoveryId
                    );

                const featureGroup =
                    this.createSvgElement(
                        "g",
                        {
                            class:
                                `cell-map-feature ` +
                                `cell-map-feature--${feature.type} ` +
                                `cell-map-feature--${
                                    discovered
                                        ? "discovered"
                                        : "undiscovered"
                                }`,

                            "data-feature-id":
                                feature.id,

                            "data-discovery-id":
                                feature.discoveryId
                        }
                    );

                const nodeRadius =
                    feature.type === "boundary"
                        ? 18
                        : 26;

                const node =
                    this.createSvgElement(
                        "circle",
                        {
                            class:
                                "cell-map-feature-node",

                            cx:
                                feature.node.x,

                            cy:
                                feature.node.y,

                            r:
                                nodeRadius
                        }
                    );

                featureGroup.appendChild(
                    node
                );

                if (discovered) {

                    const labelLine =
                        this.createSvgElement(
                            "line",
                            {
                                class:
                                    "cell-map-feature-label-line",

                                x1:
                                    feature.node.x,

                                y1:
                                    feature.node.y,

                                x2:
                                    feature.labelPosition.x,

                                y2:
                                    feature.labelPosition.y
                            }
                        );

                    const label =
                        this.createSvgElement(
                            "text",
                            {
                                class:
                                    "cell-map-feature-label",

                                x:
                                    feature.labelPosition.x,

                                y:
                                    feature.labelPosition.y,

                                "text-anchor":
                                    feature.labelPosition.anchor,

                                "dominant-baseline":
                                    "middle"
                            }
                        );

                    label.textContent =
                        feature.label;

                    featureGroup.append(
                        labelLine,
                        label
                    );

                } else {

                    const placeholder =
                        this.createSvgElement(
                            "text",
                            {
                                class:
                                    "cell-map-feature-placeholder",

                                x:
                                    feature.node.x,

                                y:
                                    feature.node.y,

                                "text-anchor":
                                    "middle",

                                "dominant-baseline":
                                    "central"
                            }
                        );

                    placeholder.textContent =
                        "?";

                    featureGroup.appendChild(
                        placeholder
                    );

                }

                svg.appendChild(
                    featureGroup
                );

            }
        );

        container.replaceChildren(
            svg
        );

    }

};

export default CellMapView;