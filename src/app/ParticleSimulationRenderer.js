// --------------------------------------------------
// ParticleSimulationRenderer.js
// Draws particle-simulation states onto a canvas.
// It does not advance physics or score experiments.
// --------------------------------------------------

const DEFAULT_WIDTH =
    720;

const DEFAULT_HEIGHT =
    320;

const MEMBRANE_START =
    0.45;

const MEMBRANE_END =
    0.55;

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

    // --------------------------------------------------
    // Create a reusable simulation canvas
    // --------------------------------------------------
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

    // --------------------------------------------------
    // Configure canvas dimensions for crisp rendering
    // --------------------------------------------------
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

    // --------------------------------------------------
    // Return the render rectangle for one simulation zone
    // --------------------------------------------------
    getZoneRectangle(
        zoneId,
        width,
        height
    ) {

        const padding =
            10;

        if (zoneId === "side_a") {
            return {
                x: padding,
                y: padding,
                width:
                    width *
                    MEMBRANE_START -
                    padding * 2,
                height:
                    height -
                    padding * 2
            };
        }

        if (zoneId === "side_b") {
            return {
                x:
                    width *
                    MEMBRANE_END +
                    padding,

                y: padding,

                width:
                    width *
                    (1 - MEMBRANE_END) -
                    padding * 2,

                height:
                    height -
                    padding * 2
            };
        }

        return null;

    },

    // --------------------------------------------------
    // Convert normalized zone position into canvas space
    // --------------------------------------------------
    getParticleCanvasPosition(
        particle,
        width,
        height
    ) {

        const zone =
            this.getZoneRectangle(
                particle.zoneId,
                width,
                height
            );

        if (!zone) {
            return null;
        }

        return {

            x:
                zone.x +
                zone.width *
                particle.position.x,

            y:
                zone.y +
                zone.height *
                particle.position.y

        };

    },

    // --------------------------------------------------
    // Draw the fixed membrane barrier
    // --------------------------------------------------
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

        context.lineWidth =
            2;

        context.strokeRect(
            startX,
            0,
            endX - startX,
            height
        );

        const lipidSpacing =
            20;

        for (
            let y = 10;
            y < height;
            y += lipidSpacing
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

    // --------------------------------------------------
    // Draw one simulation particle
    // --------------------------------------------------
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

        if (!point) {
            return;
        }

        const color =
            PARTICLE_COLORS[
                particle.visualId
            ] ?? "#f7efff";

        context.fillStyle =
            color;

        context.strokeStyle =
            "#ffffff";

        context.lineWidth =
            1;

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

    // --------------------------------------------------
    // Draw one complete static simulation frame
    // --------------------------------------------------
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

        const sideA =
            this.getZoneRectangle(
                "side_a",
                width,
                height
            );

        const sideB =
            this.getZoneRectangle(
                "side_b",
                width,
                height
            );

        context.fillStyle =
            "rgba(88, 184, 255, 0.08)";

        context.fillRect(
            sideA.x,
            sideA.y,
            sideA.width,
            sideA.height
        );

        context.fillRect(
            sideB.x,
            sideB.y,
            sideB.width,
            sideB.height
        );

        this.drawMembrane(
            context,
            width,
            height
        );

        (
            state.particles ?? []
        ).forEach(particle => {

            this.drawParticle(
                context,
                particle,
                width,
                height
            );

        });

        return true;

    }

};

export default ParticleSimulationRenderer;