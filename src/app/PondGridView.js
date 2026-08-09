// --------------------------------------------------
// PondGridView.js
// Renders the Pond microbiome / grid view
// --------------------------------------------------

import GameStateManager from "./GameStateManager.js";
import PondWorld from "./PondWorld.js";
import PondController from "./PondController.js";

const MICROSCOPE_VIEWPORT_RADIUS = 6;

const GRID_SIZE =
    (MICROSCOPE_VIEWPORT_RADIUS * 2) + 1;

const MOVEMENT_VECTORS = {
    north: { dx: 0, dy: -1 },
    south: { dx: 0, dy: 1 },
    west: { dx: -1, dy: 0 },
    east: { dx: 1, dy: 0 }
};
    

const PondGridView = {

    initialized: false,
    active: false,

    viewportElement: null,
    microscopeStageElement: null,
    microscopeMaskElement: null,
    surfaceElement: null,
    controlsElement: null,

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

        this.microscopeStageElement =
            document.createElement("div");

        this.microscopeStageElement.id =
            "pond-microscope-stage";

        this.microscopeStageElement.style.position =
            "relative";

        this.microscopeStageElement.style.margin =
            "0 auto";

        this.microscopeMaskElement =
            document.createElement("div");

        this.microscopeMaskElement.id =
            "pond-microscope-mask";

        this.microscopeMaskElement.style.position =
            "relative";

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

        this.controlsElement =
            document.createElement("div");

        this.controlsElement.id =
            "pond-movement-controls";

        this.controlsElement.setAttribute(
            "aria-label",
            "Pond movement controls"
        );

        this.controlsElement.style.position =
            "absolute";

        this.controlsElement.style.left =
            "-16px";

        this.controlsElement.style.top =
            "50%";

        this.controlsElement.style.transform =
            "translateY(-50%)";

        this.controlsElement.style.width =
            "105px";

        this.controlsElement.style.height =
            "105px";

        this.controlsElement.style.outline =
            "1px dashed #555";

        this.controlsElement.style.display =
            "grid";

        this.controlsElement.style.gridTemplateColumns =
            "repeat(3, 1fr)";

        this.controlsElement.style.gridTemplateRows =
            "repeat(3, 1fr)";

        this.controlsElement.style.gap =
            "3px";

        this.controlsElement.style.padding =
            "4px";

        this.controlsElement.style.boxSizing =
            "border-box";

        const movementButtons = [
            {
                direction: "north",
                symbol: "▲",
                column: "2",
                row: "1"
            },
            {
                direction: "west",
                symbol: "◀",
                column: "1",
                row: "2"
            },
            {
                direction: "east",
                symbol: "▶",
                column: "3",
                row: "2"
            },
            {
                direction: "south",
                symbol: "▼",
                column: "2",
                row: "3"
            }
        ];

        movementButtons.forEach(buttonData => {

            const button =
                document.createElement("button");

            button.type = "button";

            button.dataset.direction =
                buttonData.direction;

            button.textContent =
                buttonData.symbol;

            button.setAttribute(
                "aria-label",
                `Move ${buttonData.direction}`
            );

            button.style.gridColumn =
                buttonData.column;

            button.style.gridRow =
                buttonData.row;

            button.style.fontSize =
                "14px";

            button.style.border =
                "1px solid #222";

            button.style.borderRadius =
                "4px";

            button.style.background =
                "#f5f5f5";

            button.style.cursor =
                "pointer";

            button.style.padding =
                "0";

            this.controlsElement.appendChild(
                button
            
            );
            
            button.addEventListener("click", () => {

    const movement =
        MOVEMENT_VECTORS[
            buttonData.direction
        ];

    if (!movement) {
        console.warn(
            `PondGridView: unknown direction "${buttonData.direction}"`
        );

        return;
    }

    PondController.movePlayer(
        movement.dx,
        movement.dy
    );

    this.render();

});

        });

        this.microscopeMaskElement.appendChild(
            this.surfaceElement
        );

        this.microscopeStageElement.append(
            this.microscopeMaskElement,
            this.controlsElement
        );

        this.viewportElement.replaceChildren(
            this.microscopeStageElement
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

        this.surfaceElement.style.display =
            "grid";

        this.surfaceElement.style.gridTemplateColumns =
            `repeat(${GRID_SIZE}, 48px)`;

        this.surfaceElement.style.gap =
            "0px";

        this.surfaceElement.style.width =
            "max-content";

        for (
            let y =
                position.y - MICROSCOPE_VIEWPORT_RADIUS;
            y <=
                position.y + MICROSCOPE_VIEWPORT_RADIUS;
            y++
        ) {

            for (
                let x =
                    position.x - MICROSCOPE_VIEWPORT_RADIUS;
                x <=
                    position.x + MICROSCOPE_VIEWPORT_RADIUS;
                x++
            ) {

                const tile =
                    PondWorld.getTile(world, x, y);

                if (!tile) {
                    continue;
                }

                const tileElement =
                    document.createElement("div");

                tileElement.className =
                    "pond-grid-tile";

                tileElement.dataset.x = x;
                tileElement.dataset.y = y;

                const isSensingExtreme =
    (x === -4 && y === 0) ||
    (x === 4 && y === 0) ||
    (x === 0 && y === 4) ||
    (x === 0 && y === -4);

if (isSensingExtreme) {

    tileElement.textContent =
        `${x}, ${y}`;

} else {

    tileElement.textContent =
        "";

}

                tileElement.style.width =
                    "48px";

                tileElement.style.height =
                    "48px";

                tileElement.style.boxSizing =
                    "border-box";

                tileElement.style.display =
                    "grid";

                tileElement.style.placeItems =
                    "center";

                tileElement.style.border =
                    "1px solid #777";

                tileElement.style.fontSize =
                    "11px";

                tileElement.style.fontFamily =
                    "monospace";

                this.surfaceElement.appendChild(
                    tileElement
                );

            }

        }

        const gridWidth =
            this.surfaceElement
                .getBoundingClientRect()
                .width;

        this.microscopeMaskElement.style.width =
            `${gridWidth}px`;

        this.microscopeMaskElement.style.height =
            `${gridWidth}px`;

        this.microscopeStageElement.style.width =
            `${gridWidth}px`;

        this.microscopeStageElement.style.height =
            `${gridWidth}px`;

        console.log(
            "PondGridView: rendered 9×9 generated world"
        );

    }

};

export default PondGridView;