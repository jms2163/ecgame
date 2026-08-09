// --------------------------------------------------
// PondGridView.js
// Renders the Pond microbiome / grid view
// --------------------------------------------------

import GameStateManager from "./GameStateManager.js";
import PondWorld from "./PondWorld.js";
import PondController from "./PondController.js";
import PondMovementControls from "./PondMovementControls.js";
import PondAmoebaView from "./PondAmoebaView.js";
import PondMicrobiomeSensorPane from "./PondMicrobiomeSensorPane.js";
import PondStatusHud from "./PondStatusHud.js";

const MICROSCOPE_VIEWPORT_RADIUS = 6;

const GRID_SIZE =
    (MICROSCOPE_VIEWPORT_RADIUS * 2) + 1;

const PondGridView = {

    initialized: false,
    active: false,

    viewportElement: null,         // Pond viewport positioning
    microscopeStageElement: null,  // Frame positioning for grid, D-pad, and HUD
    microscopeMaskElement: null,   // Circular microscope viewport
    surfaceElement: null,          // Rendered Pond world grid

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

        // --------------------------------------------------
        // Microscope stage and grid surface
        // --------------------------------------------------

        this.microscopeStageElement =
            document.createElement("div");

        this.microscopeStageElement.id =
            "pond-microscope-stage";

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

        // --------------------------------------------------
        // Pond movement controls
        // --------------------------------------------------

        const movementControlsElement =
            PondMovementControls.create({

                onMove: (dx, dy) => {

                    PondController.movePlayer(
                        dx,
                        dy
                    );

                    this.render();

                }

            });

        // --------------------------------------------------
        // Pond status HUD
        // --------------------------------------------------

        const statusElement =
            PondStatusHud.create();

        // --------------------------------------------------
        // Mount microscope, controls, and status HUD
        // --------------------------------------------------

        this.microscopeMaskElement.appendChild(
            this.surfaceElement
        );

        this.microscopeStageElement.append(
            this.microscopeMaskElement,
            movementControlsElement,
            statusElement
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

        const currentTile =
            PondWorld.getTile(
                world,
                position.x,
                position.y
            );

        PondMicrobiomeSensorPane.render(
            currentTile
        );

        PondStatusHud.render(
            position
        );

        this.surfaceElement.replaceChildren();

        this.surfaceElement.style.gridTemplateColumns =
            `repeat(${GRID_SIZE}, 48px)`;

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

                }

                if (
                    x === position.x &&
                    y === position.y
                ) {

                    tileElement.appendChild(
                        PondAmoebaView.create()
                    );

                }

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

    }

};

export default PondGridView;