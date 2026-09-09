import { substances } from "./PassiveDiffusionCatalog.js";
import PlasmaMembraneVisualCatalog from "./PlasmaMembraneVisualCatalog.js";

// Independent of the legacy one-way osmosis engine: no concentration trap.
// Fixed time steps and a saved PRNG state make trials reproducible.
const LEFT = PlasmaMembraneVisualCatalog.geometry.start;
const RIGHT = PlasmaMembraneVisualCatalog.geometry.end;
const STEP = 1 / 60;

const Engine = {
    create(substanceId, side = "left", position = { x: 0.2, y: 0.5 }, seed = 731) {
        const material = substances[substanceId];
        if (!material || !["left", "right"].includes(side)) throw new Error("Invalid diffusion trial");
        const count = material.count ?? 12;
        const centerX = Math.max(side === "left" ? 0.12 : 0.68,
            Math.min(side === "left" ? 0.32 : 0.88, position.x));
        const centerY = Math.max(0.15, Math.min(0.85, position.y));
        return {
            substanceId, side, seed: seed >>> 0, elapsed: 0, remainder: 0,
            particles: Array.from({ length: count }, (_, i) => ({
                x: centerX + (count === 1 ? 0 : (i % 4 - 1.5) * 0.038),
                y: centerY + (count === 1 ? 0 : (Math.floor(i / 4) - 1) * 0.06),
                vx: (side === "left" ? 1 : -1) * (0.13 + (i % 3) * 0.018),
                vy: Math.sin(i * 2.399 + 0.7) * 0.12,
                phase: side, encounters: 0, transfers: 0, embedded: false
            }))
        };
    },

    random(state) {
        state.seed = (Math.imul(1664525, state.seed) + 1013904223) >>> 0;
        return state.seed / 4294967296;
    },

    step(state, seconds) {
        if (!Number.isFinite(seconds) || seconds <= 0) return state;
        state.remainder += Math.min(seconds, 0.1);
        while (state.remainder + 1e-9 >= STEP) {
            state.remainder -= STEP;
            state.elapsed += STEP;
            for (const p of state.particles) this.advance(state, p, STEP);
        }
        return state;
    },

    advance(state, p, dt) {
        if (p.embedded) return;
        const material = substances[state.substanceId];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.y < 0.04 || p.y > 0.96) {
            p.y = Math.max(0.04, Math.min(0.96, p.y));
            p.vy *= -1;
        }
        if (p.x < 0.04 || p.x > 0.96) {
            p.x = Math.max(0.04, Math.min(0.96, p.x));
            p.vx *= -1;
        }
        if (p.phase === "transit") {
            if (p.x > RIGHT || p.x < LEFT) {
                p.phase = p.x > RIGHT ? "right" : "left";
                p.transfers++;
            }
            return;
        }
        const entering = (p.phase === "left" && p.x >= LEFT && p.vx > 0) ||
            (p.phase === "right" && p.x <= RIGHT && p.vx < 0);
        if (!entering) return;
        p.encounters++;
        if (material.behavior === "embeds") {
            p.x = p.phase === "left" ? LEFT + 0.03 : RIGHT - 0.03;
            p.phase = "membrane";
            p.embedded = true;
            p.vx = p.vy = 0;
        } else if (this.random(state) < material.permeability) {
            p.phase = "transit";
        } else {
            p.x = p.phase === "left" ? LEFT - 0.001 : RIGHT + 0.001;
            p.vx *= -1;
        }
    },

    summary(state) {
        return {
            seconds: Number(state.elapsed.toFixed(2)),
            particles: state.particles.length,
            encountered: state.particles.filter(p => p.encounters > 0).length,
            transferredParticles: state.particles.filter(p => p.transfers > 0).length,
            transfers: state.particles.reduce((sum, p) => sum + p.transfers, 0),
            embedded: state.particles.filter(p => p.embedded).length
        };
    },

    ready(state) {
        const s = this.summary(state);
        return s.seconds >= 12 && s.encountered === s.particles &&
            (substances[state.substanceId].behavior !== "crosses" || s.transferredParticles > 0);
    }
};

export default Engine;
