// --------------------------------------------------
// ParticleSimulationView.js
// Owns the canvas and animation loop for one active
// particle simulation. Physics remains in the engine.
// --------------------------------------------------

import ParticleSimulationEngine
    from "./ParticleSimulationEngine.js";

import ParticleSimulationRenderer
    from "./ParticleSimulationRenderer.js";

const ParticleSimulationView = {

    canvasElement: null,
    currentState: null,

    animationFrameId: null,
    lastFrameAtMs: null,

    // --------------------------------------------------
    // Mount one canvas into a simulation container
    // --------------------------------------------------
    mount(container) {

        if (!container) {
            console.warn(
                "ParticleSimulationView: simulation container unavailable"
            );

            return false;
        }

        this.stop();

        this.canvasElement =
            ParticleSimulationRenderer
                .createCanvas();

        this.canvasElement.classList.add(
            "organelle-particle-simulation-canvas--active"
        );

        container.replaceChildren(
            this.canvasElement
        );

        return true;

    },

    // --------------------------------------------------
    // Read canvas dimensions from its visible container
    // --------------------------------------------------
    getRenderDimensions() {

        const container =
            this.canvasElement?.parentElement;

        const width =
            Math.max(
                1,
                Math.floor(
                    container?.clientWidth ?? 720
                )
            );

        const height =
            Math.max(
                1,
                Math.floor(
                    container?.clientHeight ?? 320
                )
            );

        return {
            width,
            height
        };

    },

    // --------------------------------------------------
    // Draw the current particle state
    // --------------------------------------------------
    render() {

        if (
            !this.canvasElement ||
            !this.currentState
        ) {
            return false;
        }

        return ParticleSimulationRenderer.render(
            this.canvasElement,
            this.currentState,
            this.getRenderDimensions()
        );

    },

    // --------------------------------------------------
    // Advance one animation frame
    // --------------------------------------------------
    animate(frameAtMs) {

        if (!this.currentState) {
            return;
        }

        const elapsedMilliseconds =
            this.lastFrameAtMs === null
                ? 16
                : frameAtMs -
                this.lastFrameAtMs;

        this.lastFrameAtMs =
            frameAtMs;

        this.currentState =
            ParticleSimulationEngine.step(
                this.currentState,
                elapsedMilliseconds
            );

        this.render();

        this.animationFrameId =
            window.requestAnimationFrame(
                nextFrameAtMs =>
                    this.animate(
                        nextFrameAtMs
                    )
            );

    },

    // --------------------------------------------------
    // Start one active particle simulation
    // --------------------------------------------------
    start(state) {

        if (
            !this.canvasElement ||
            !state
        ) {
            console.warn(
                "ParticleSimulationView: canvas or simulation state unavailable"
            );

            return false;
        }

        this.stop();

        this.currentState =
            structuredClone(state);

        this.lastFrameAtMs =
            null;

        this.render();

        this.animationFrameId =
            window.requestAnimationFrame(
                frameAtMs =>
                    this.animate(frameAtMs)
            );

        return true;

    },

    // --------------------------------------------------
    // Stop movement but keep the final rendered frame
    // --------------------------------------------------
    stop() {

        if (
            this.animationFrameId !== null
        ) {
            window.cancelAnimationFrame(
                this.animationFrameId
            );
        }

        this.animationFrameId =
            null;

        this.lastFrameAtMs =
            null;

        if (this.currentState) {
            this.currentState =
                ParticleSimulationEngine.stop(
                    this.currentState
                );
        }

    },

    // --------------------------------------------------
    // Remove the canvas and temporary simulation state
    // --------------------------------------------------
    clear() {

        this.stop();

        this.canvasElement?.remove();

        this.canvasElement =
            null;

        this.currentState =
            null;

    },

    // --------------------------------------------------
    // Read a safe copy for tests and future controls
    // --------------------------------------------------
    getStateSnapshot() {

        return this.currentState
            ? structuredClone(
                this.currentState
            )
            : null;

    }

};

export default ParticleSimulationView;