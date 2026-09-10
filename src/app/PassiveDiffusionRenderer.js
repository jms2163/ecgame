import { substances } from "./PassiveDiffusionCatalog.js";
import ExperimentMaterialCanvasRenderer from "./ExperimentMaterialCanvasRenderer.js";

// Canvas-native art is shared by the draggable sample and moving particles.
// Cholesterol's symbol uses a four-ring fused steroid nucleus (3 hexagons + 1 pentagon).
const Renderer = {
    particle(ctx, id, x, y, scale = 1) {
        ExperimentMaterialCanvasRenderer.draw(
            ctx,
            substances[id].visualId,
            x,
            y,
            scale
        );
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
