import { substances } from "./PassiveDiffusionCatalog.js";
import ExperimentMaterialVisualLibrary from "./ExperimentMaterialVisualLibrary.js";

// Canvas-native art is shared by the draggable sample and moving particles.
// Cholesterol's symbol uses a four-ring fused steroid nucleus (3 hexagons + 1 pentagon).
const Renderer = {
    shape(ctx, sides, radius, fill) {
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = i * Math.PI * 2 / sides - Math.PI / 2;
            const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.stroke();
    },

    particle(ctx, id, x, y, scale = 1) {
        const visual =
            ExperimentMaterialVisualLibrary
                .definitions[substances[id].visualId];

        if (!visual) return;

        ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1;
        const ball = (x, y, r, color) => {
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = color; ctx.fill(); ctx.stroke();
        };
        if (visual.shape === "linear_atoms") {
            const spacing = visual.atomColors.length === 2 ? 8 : 7;
            const start = -(visual.atomColors.length - 1) * spacing / 2;
            visual.atomColors.forEach((color, index) =>
                ball(start + index * spacing, 0, visual.atomColors.length === 2 ? 5 : 4, color));
        } else if (visual.shape === "ring") {
            const shade = ctx.createLinearGradient(-8, -8, 8, 8);
            shade.addColorStop(0, visual.colors[0]); shade.addColorStop(1, visual.colors[1]);
            this.shape(ctx, visual.sides, 9, shade);
        } else if (visual.shape === "symbol") {
            ctx.strokeStyle = visual.simulationColor;
            ctx.beginPath(); ctx.moveTo(5, -14); ctx.lineTo(-12, 2); ctx.lineTo(-3, 2);
            ctx.lineTo(-5, 14); ctx.lineTo(13, -2); ctx.lineTo(4, -2); ctx.closePath(); ctx.stroke();
            ctx.font = "bold 9px sans-serif"; ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.fillText(visual.text, 0, 3);
        } else if (visual.shape === "steroid") {
            for (let i = 0; i < 4; i++) {
                ctx.save(); ctx.translate((i - 1.5) * 7, i % 2 ? -2 : 2);
                this.shape(ctx, i === 3 ? 5 : 6, 5, visual.simulationColor); ctx.restore();
            }
        } else {
            ball(0, 0, visual.simulationRadius ?? 6, visual.simulationColor);
        }
        ctx.restore();
    },

    render(canvas, state) {
        const width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
            canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
        }
        const ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "#ddd4e9"; ctx.font = "12px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("Watery side A", width * 0.2, 20); ctx.fillText("Watery side B", width * 0.8, 20);
        if (state) for (const p of state.particles) this.particle(ctx, state.substanceId, p.x * width, p.y * height);
    }
};
export default Renderer;
