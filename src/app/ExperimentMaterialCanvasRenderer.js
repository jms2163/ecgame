import ExperimentMaterialVisualLibrary
    from "./ExperimentMaterialVisualLibrary.js";

// Shared canvas renderer for experiment materials. This keeps the symbols
// used by specialized explorations and the general particle engine identical.
const ExperimentMaterialCanvasRenderer = {

    polygon(context, sides, radius, fill) {
        context.beginPath();
        for (let index = 0; index < sides; index += 1) {
            const angle = index * Math.PI * 2 / sides - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (index === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
        }
        context.closePath();
        context.fillStyle = fill;
        context.fill();
        context.stroke();
    },

    draw(context, visualId, x, y, scale = 1) {
        const visual =
            ExperimentMaterialVisualLibrary
                .definitions[visualId];

        if (!visual) return false;

        context.save();
        context.translate(x, y);
        context.scale(scale, scale);
        context.strokeStyle = "#ffffff";
        context.lineWidth = 1;

        const ball = (ballX, ballY, radius, color) => {
            context.beginPath();
            context.arc(ballX, ballY, radius, 0, Math.PI * 2);
            context.fillStyle = color;
            context.fill();
            context.stroke();
        };

        if (visual.shape === "linear_atoms") {
            const spacing = visual.atomColors.length === 2 ? 8 : 7;
            const start = -(visual.atomColors.length - 1) * spacing / 2;
            visual.atomColors.forEach((color, index) =>
                ball(start + index * spacing, 0, visual.atomColors.length === 2 ? 5 : 4, color));
        } else if (visual.shape === "ring") {
            const shade = context.createLinearGradient(-8, -8, 8, 8);
            shade.addColorStop(0, visual.colors[0]);
            shade.addColorStop(1, visual.colors[1]);
            this.polygon(context, visual.sides, 9, shade);
        } else if (visual.shape === "symbol") {
            context.strokeStyle = visual.simulationColor;
            context.lineWidth = 1.5;
            context.beginPath();
            context.moveTo(5, -14);
            context.lineTo(-12, 2);
            context.lineTo(-3, 2);
            context.lineTo(-5, 14);
            context.lineTo(13, -2);
            context.lineTo(4, -2);
            context.closePath();
            context.stroke();
            context.font = "bold 9px sans-serif";
            context.fillStyle = "white";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText(visual.text, 0, 1);
        } else if (visual.shape === "steroid") {
            for (let index = 0; index < 4; index += 1) {
                context.save();
                context.translate((index - 1.5) * 7, index % 2 ? -2 : 2);
                this.polygon(context, index === 3 ? 5 : 6, 5, visual.simulationColor);
                context.restore();
            }
        } else {
            ball(0, 0, visual.simulationRadius ?? 6, visual.simulationColor);
            if (visual.text) {
                context.fillStyle = "#ffffff";
                context.font = "bold 8px sans-serif";
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.fillText(visual.text, 0, 0);
            }
        }

        context.restore();
        return true;
    }
};

export default ExperimentMaterialCanvasRenderer;
