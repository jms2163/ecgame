// --------------------------------------------------
// CellMapView.js
// Renders the static amoeba cell map
// --------------------------------------------------

import GameStateManager from "./GameStateManager.js";
import CellMapLayout from "./CellMapLayout.js";

const SVG_NAMESPACE =
    "http://www.w3.org/2000/svg";

const CellMapView = {

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

    bindSelection(
        featureGroup,
        feature,
        discovered,
        onFeatureSelected
    ) {

        featureGroup.setAttribute(
            "role",
            "button"
        );

        featureGroup.setAttribute(
            "tabindex",
            "0"
        );

        featureGroup.setAttribute(
            "aria-label",
            discovered
                ? `Open ${feature.label} lab`
                : `View locked ${feature.label} lab`
        );

        featureGroup.addEventListener(
            "click",
            () => {

                if (
                    typeof onFeatureSelected !==
                    "function"
                ) {
                    console.warn(
                        "CellMapView: feature selection callback unavailable"
                    );

                    return;
                }

                onFeatureSelected(
                    feature
                );

            }
        );

        featureGroup.addEventListener(
            "keydown",
            event => {

                const activatesFeature =
                    event.key === "Enter" ||
                    event.key === " ";

                if (!activatesFeature) {
                    return;
                }

                event.preventDefault();

                featureGroup.click();

            }
        );

    },

    // --------------------------------------------------
    // Render static cell illustration and all features.
    // Discovery controls lab availability, not whether
    // students can see or select anatomical structures.
    // --------------------------------------------------
    render({
        onFeatureSelected = null
    } = {}) {

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

        const cellIllustration =
            this.createSvgElement(
                "image",
                {
                    class:
                        "cell-map-illustration",

                    href:
                        "./public/assets/cell/amoeba-cell-map.png",

                    x: "0",
                    y: "0",
                    width: "1200",
                    height: "800",

                    preserveAspectRatio:
                        "xMidYMid meet"
                }
            );

        svg.appendChild(
            cellIllustration
        );

        CellMapLayout.features.forEach(
            feature => {

                const discovered =
                    GameStateManager.hasDiscovery(
                        feature.discoveryId
                    );

                const defaultHotspotDiameter =
                    feature.type === "boundary"
                        ? 36
                        : 52;

                const hotspotDiameter =
                    feature.hotspotDiameter ??
                    defaultHotspotDiameter;

                const featureGroup =
                    this.createSvgElement(
                        "g",
                        {
                            class:
                                `cell-map-feature ` +
                                `cell-map-feature--${feature.type} ` +
                                `cell-map-feature--${discovered
                                    ? "discovered"
                                    : "undiscovered"
                                }`,

                            "data-feature-id":
                                feature.id,

                            "data-discovery-id":
                                feature.discoveryId,

                            "data-hotspot-diameter":
                                hotspotDiameter,

                            "data-availability":
                                discovered
                                    ? "available"
                                    : "locked"
                        }
                    );

                const hitArea =
                    this.createSvgElement(
                        "circle",
                        {
                            class:
                                "cell-map-feature-hit-area",

                            cx:
                                feature.node.x,

                            cy:
                                feature.node.y,

                            r:
                                hotspotDiameter / 2
                        }
                    );

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
                                hotspotDiameter / 2
                        }
                    );

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
                    hitArea,
                    node,
                    labelLine,
                    label
                );

                this.bindSelection(
                    featureGroup,
                    feature,
                    discovered,
                    onFeatureSelected
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
