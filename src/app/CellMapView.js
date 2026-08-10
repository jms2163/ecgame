// --------------------------------------------------
// CellMapView.js
// Renders the static amoeba cell map
// --------------------------------------------------

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
        // Neutral organelle placeholders
        // --------------------------------------------------

        CellMapLayout.features.forEach(
            feature => {

                const featureGroup =
                    this.createSvgElement(
                        "g",
                        {
                            class:
                                `cell-map-feature ` +
                                `cell-map-feature--${feature.type}`,
                            "data-feature-id":
                                feature.id
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

                featureGroup.append(
                    node,
                    placeholder
                );

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