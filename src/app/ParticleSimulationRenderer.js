// --------------------------------------------------
// ParticleSimulationRenderer.js
// Draws particle-simulation states onto a canvas.
// It does not advance physics or score experiments.
// --------------------------------------------------

const DEFAULT_WIDTH = 720;
const DEFAULT_HEIGHT = 320;

const MEMBRANE_START = 0.45;
const MEMBRANE_END = 0.55;

const PARTICLE_COLORS = {

    water_sphere:
        "#58b8ff",

    sodium_ion_sphere:
        "#a92f4e",

    chloride_ion_sphere:
        "#5ee38d",

    aquaporin_channel:
        "#df80ff"

};

const ParticleSimulationRenderer = {

    createCanvas() {

        const canvas =
            document.createElement("canvas");

        canvas.className =
            "organelle-particle-simulation-canvas";

        canvas.setAttribute(
            "aria-label",
            "Particle simulation"
        );

        canvas.setAttribute(
            "role",
            "img"
        );

        return canvas;

    },

    prepareCanvas(
        canvas,
        width = DEFAULT_WIDTH,
        height = DEFAULT_HEIGHT
    ) {

        if (!canvas) {
            return null;
        }

        const devicePixelRatio =
            window.devicePixelRatio || 1;

        canvas.width =
            Math.round(
                width *
                devicePixelRatio
            );

        canvas.height =
            Math.round(
                height *
                devicePixelRatio
            );

        canvas.style.width =
            `${width}px`;

        canvas.style.height =
            `${height}px`;

        const context =
            canvas.getContext("2d");

        context.setTransform(
            devicePixelRatio,
            0,
            0,
            devicePixelRatio,
            0,
            0
        );

        return {
            context,
            width,
            height
        };

    },

    getParticleCanvasPosition(
        particle,
        width,
        height
    ) {

        const padding = 10;

        return {
            x:
                width *
                particle.position.x,

            y:
                padding +
                (
                    (
                        height -
                        padding * 2
                    ) *
                    particle.position.y
                )
        };

    },

    drawMembrane(
        context,
        width,
        height
    ) {

        const startX =
            width * MEMBRANE_START;

        const endX =
            width * MEMBRANE_END;

        context.fillStyle =
            "#2b103d";

        context.fillRect(
            startX,
            0,
            endX - startX,
            height
        );

        context.strokeStyle =
            "#df80ff";

        context.lineWidth = 2;

        context.strokeRect(
            startX,
            0,
            endX - startX,
            height
        );

        for (
            let y = 10;
            y < height;
            y += 20
        ) {

            context.fillStyle =
                "#f4a0ff";

            context.beginPath();

            context.arc(
                startX + 9,
                y,
                4,
                0,
                Math.PI * 2
            );

            context.fill();

            context.beginPath();

            context.arc(
                endX - 9,
                y,
                4,
                0,
                Math.PI * 2
            );

            context.fill();

        }

    },

    drawParticle(
        context,
        particle,
        width,
        height
    ) {

        const point =
            this.getParticleCanvasPosition(
                particle,
                width,
                height
            );

        const color =
            PARTICLE_COLORS[
                particle.visualId
            ] ?? "#f7efff";

        context.fillStyle =
            color;

        context.strokeStyle =
            "#ffffff";

        context.lineWidth = 1;

        context.beginPath();

        context.arc(
            point.x,
            point.y,
            8,
            0,
            Math.PI * 2
        );

        context.fill();

        context.stroke();

    },

    render(
        canvas,
        state,
        {
            width = DEFAULT_WIDTH,
            height = DEFAULT_HEIGHT
        } = {}
    ) {

        const prepared =
            this.prepareCanvas(
                canvas,
                width,
                height
            );

        if (!prepared || !state) {
            return false;
        }

        const {
            context
        } = prepared;

        context.clearRect(
            0,
            0,
            width,
            height
        );

        context.fillStyle =
            "#16051e";

        context.fillRect(
            0,
            0,
            width,
            height
        );

        context.fillStyle =
            "rgba(88, 184, 255, 0.08)";

        context.fillRect(
            10,
            10,
            (
                width *
                MEMBRANE_START
            ) - 20,
            height - 20
        );

        context.fillRect(
            (
                width *
                MEMBRANE_END
            ) + 10,
            10,
            (
                width *
                (
                    1 -
                    MEMBRANE_END
                )
            ) - 20,
            height - 20
        );

        // Draw particles first. A crossing water molecule
        // disappears behind the membrane when it enters
        // the barrier region.
        (
            state.particles ?? []
        ).forEach(
            particle => {

                this.drawParticle(
                    context,
                    particle,
                    width,
                    height
                );

            }
        );

        this.drawMembrane(
            context,
            width,
            height
        );

        return true;

    }

};

export default ParticleSimulationRenderer;