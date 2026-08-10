// --------------------------------------------------
// PondMovementControls.js
// Creates Pond movement-control user interface
// --------------------------------------------------
import {
    POND_MOVE_ATP_COST
} from "./PondMovementRules.js";

const MOVEMENT_VECTORS = {

    north: { dx: 0, dy: -1 },
    south: { dx: 0, dy: 1 },
    west: { dx: -1, dy: 0 },
    east: { dx: 1, dy: 0 }

};

const MOVEMENT_BUTTONS = [

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

const PondMovementControls = {

    // --------------------------------------------------
    // Create Pond D-pad
    // --------------------------------------------------
    create({ onMove }) {

        const controlsElement =
            document.createElement("div");

        controlsElement.id =
            "pond-movement-controls";

        controlsElement.setAttribute(
            "aria-label",
            "Pond movement controls"
        );

        // --------------------------------------------------
        // Pond movement instruction
        // --------------------------------------------------

        const instructionsElement =
            document.createElement("div");

        instructionsElement.id =
            "pond-movement-instructions";

        instructionsElement.textContent =
    `SPEND ${POND_MOVE_ATP_COST} ATP TO\nMOVE ONE SPACE`;

        controlsElement.appendChild(
            instructionsElement
        );

        // --------------------------------------------------
        // D-pad direction buttons
        // --------------------------------------------------

        MOVEMENT_BUTTONS.forEach(buttonData => {

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

            button.addEventListener("click", () => {

                const movement =
                    MOVEMENT_VECTORS[
                        buttonData.direction
                    ];

                if (!movement) {
                    console.warn(
                        `PondMovementControls: unknown direction "${buttonData.direction}"`
                    );

                    return;
                }

                if (typeof onMove !== "function") {
                    console.warn(
                        "PondMovementControls: onMove callback unavailable"
                    );

                    return;
                }

                onMove(
                    movement.dx,
                    movement.dy
                );

            });

            controlsElement.appendChild(
                button
            );

        });

        return controlsElement;

    }

};

export default PondMovementControls;