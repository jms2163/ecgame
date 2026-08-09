// --------------------------------------------------
// PondGridView.js
// Renders the Pond microbiome / grid view
// --------------------------------------------------

import GameStateManager from "./GameStateManager.js";
import PondWorld from "./PondWorld.js";
import PondController from "./PondController.js";
import PondAmoebaView from "./PondAmoebaView.js";

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

    viewportElement: null,         // Pond viewport positioning
    microscopeStageElement: null,  // Frame positioning for grid, D-pad, and HUD
    microscopeMaskElement: null,   // Circular microscope viewport
    surfaceElement: null,          // Rendered Pond world grid
    controlsElement: null,         // D-pad container
    instructionsElement: null,     // D-pad instruction label

    statusElement: null,           // Status/HUD box
    coordinatesElement: null, // Coordinate readout
    atpElement: null,         // ATP readout

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

        // --------------------------------------------------
// Pond movement instruction
// --------------------------------------------------

this.instructionsElement =
    document.createElement("div");

this.instructionsElement.id =
    "pond-movement-instructions";

this.instructionsElement.textContent =
    "SPEND 10 ATP TO\nMOVE ONE SPACE";

this.controlsElement.appendChild(
    this.instructionsElement
);

       

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

            button.className =
                "pond-movement-button";

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



        // --------------------------------------------------
// Coordinate and ATP status box
// --------------------------------------------------

this.statusElement =
    document.createElement("div");

this.statusElement.id =
    "pond-status-hud";

this.statusElement.setAttribute(
    "aria-label",
    "Pond status display"
);

this.coordinatesElement =
    document.createElement("span");

this.coordinatesElement.id =
    "pond-coordinate-readout";

const separatorElement =
    document.createElement("span");

separatorElement.id =
    "pond-status-separator";

separatorElement.textContent =
    "|";

this.atpElement =
    document.createElement("span");

this.atpElement.id =
    "pond-atp-readout";

this.atpElement.textContent =
    "ATP: --/--";

this.statusElement.append(
    this.coordinatesElement,
    separatorElement,
    this.atpElement
);



this.microscopeMaskElement.appendChild(
    this.surfaceElement
);

// --------------------------------------------------
// Mount microscope, controls, and status HUD
// --------------------------------------------------

this.microscopeStageElement.append(
    this.microscopeMaskElement,
    this.controlsElement,
    this.statusElement
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

        // --------------------------------------------------
// Update coordinate display
// --------------------------------------------------

this.coordinatesElement.textContent =
    `COORD: ${position.x}, ${position.y}`;

        this.surfaceElement.replaceChildren();

        this.surfaceElement.style.display =
            "grid";

        this.surfaceElement.style.gridTemplateColumns =
            `repeat(${GRID_SIZE}, 48px)`;

       

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

                    tileElement.classList.add(
    `pond-biome-${tile.biome ?? "unknown"}`
);

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

if (
    x === position.x &&
    y === position.y
) {

    tileElement.appendChild(
        PondAmoebaView.create()
    );

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