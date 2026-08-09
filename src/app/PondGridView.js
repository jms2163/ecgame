// --------------------------------------------------
// PondGridView.js
// Renders the Pond microbiome / grid view
// --------------------------------------------------

import GameStateManager from "./GameStateManager.js";
import PondWorld from "./PondWorld.js";

const MICROSCOPE_VIEWPORT_RADIUS = 6; // radius of microscope viewport
const GRID_SIZE =
    (MICROSCOPE_VIEWPORT_RADIUS * 2) + 1;


const PondGridView = {

    initialized: false,
    active: false,
    viewportElement: null,
    surfaceElement: null,
    microscopeMaskElement: null,

    // --------------------------------------------------
    // Initialize
    // --------------------------------------------------
    initialize() {

    if (this.initialized) {
        return;
    }

    console.log("PondGridView.initialize() called");

    this.viewportElement = document.getElementById(
        "pond-viewport-container"
    );

    if (!this.viewportElement) {
        console.warn(
            "PondGridView: DOM element #pond-viewport-container not found"
        );

        return;
    }

    this.microscopeMaskElement =
        document.createElement("div");

    this.microscopeMaskElement.id =
        "pond-microscope-mask";

    this.microscopeMaskElement.style.position =
        "relative";

    this.microscopeMaskElement.style.margin =
        "0 auto";

    this.microscopeMaskElement.style.border =
        "4px solid #111";

    this.microscopeMaskElement.style.borderRadius =
        "50%";

    this.microscopeMaskElement.style.overflow =
        "hidden";

    this.surfaceElement =
        document.createElement("div");

    this.surfaceElement.id =
        "pond-grid-surface";

    this.surfaceElement.setAttribute(
        "aria-label",
        "Pond microbiome grid"
    );

    this.microscopeMaskElement.appendChild(
        this.surfaceElement
    );

    this.viewportElement.replaceChildren(
        this.microscopeMaskElement
    );

    this.initialized = true;

},

    // --------------------------------------------------
    // Activate
    // --------------------------------------------------
    activate() {

        if (this.active) {
            return;
        }

        this.active = true;

        console.log("PondGridView.activate() called");

        this.render();

    },

    // --------------------------------------------------
    // Deactivate
    // --------------------------------------------------
    deactivate() {

        if (!this.active) {
            return;
        }

        this.active = false;

        console.log("PondGridView.deactivate() called");

    },

    // --------------------------------------------------
    // Render Pond
    // --------------------------------------------------
    render() {

    const world =
        GameStateManager.getPondWorld();

    const position =
        GameStateManager.getPondPosition();

    if (!world || !position || !this.surfaceElement) {

        console.warn(
            "PondGridView: world, position, or surface unavailable"
        );

        return;

    }


    this.surfaceElement.replaceChildren();

    this.surfaceElement.style.display = "grid";
    this.surfaceElement.style.gridTemplateColumns =
    `repeat(${GRID_SIZE}, 48px)`;
    this.surfaceElement.style.gap = "2px";
    this.surfaceElement.style.width = "max-content";

    for (
        let y = position.y - MICROSCOPE_VIEWPORT_RADIUS;
        y <= position.y + MICROSCOPE_VIEWPORT_RADIUS;
        y++
    ) {

        for (
            let x = position.x - MICROSCOPE_VIEWPORT_RADIUS;
            x <= position.x + MICROSCOPE_VIEWPORT_RADIUS;
            x++
        ) {

            const tile =
                PondWorld.getTile(world, x, y);

            if (!tile) {
                continue;
            }

            const tileElement =
                document.createElement("div");

            tileElement.className = "pond-grid-tile";

            tileElement.dataset.x = x;
            tileElement.dataset.y = y;

            tileElement.textContent =
                `${x}, ${y}`;

            tileElement.style.width = "48px";
            tileElement.style.height = "48px";
            tileElement.style.display = "grid";
            tileElement.style.placeItems = "center";
            tileElement.style.border = "1px solid #777";
            tileElement.style.fontSize = "11px";
            tileElement.style.fontFamily = "monospace";

            this.surfaceElement.appendChild(
                tileElement
            );

        }

    }

    const gridWidth =
    this.surfaceElement.getBoundingClientRect().width;

this.microscopeMaskElement.style.width =
    `${gridWidth}px`;

this.microscopeMaskElement.style.height =
    `${gridWidth}px`;

    console.log(
        "PondGridView: rendered 9×9 generated world"
    );

}

};

export default PondGridView;
