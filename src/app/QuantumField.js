// --------------------------------------------------
// QuantumField.js
// Lifecycle-safe repeatable particle-harvesting field
// --------------------------------------------------

const FIELD_WIDTH = 800;
const FIELD_HEIGHT = 420;
const PARTICLES_PER_TYPE = 3;

const PARTICLE_ORDER = Object.freeze([
    "proton",
    "neutron",
    "electron"
]);

const PARTICLE_STYLES = Object.freeze({
    proton: Object.freeze({
        baseSymbol: "p",
        chargeSymbol: "+",
        fill: "#ff6575",
        stroke: "#8d2632",
        glow: "rgba(216, 79, 95, 0.55)",
        radius: 25
    }),

    neutron: Object.freeze({
        baseSymbol: "n",
        chargeSymbol: "0",
        fill: "#a9b3b9",
        stroke: "#4d5961",
        glow: "rgba(88, 104, 114, 0.45)",
        radius: 25
    }),

    electron: Object.freeze({
        baseSymbol: "e",
        chargeSymbol: "-",
        fill: "#55cfff",
        stroke: "#236a8a",
        glow: "rgba(44, 148, 197, 0.55)",
        radius: 19
    })
});

class FieldParticle {

    constructor(
        particleId,
        fieldWidth,
        fieldHeight
    ) {

        const style =
            PARTICLE_STYLES[particleId];

        this.id =
            `${particleId}-${Date.now()}-${Math.random()}`;
        this.particleId = particleId;
        this.radius = style.radius;

        this.x =
            this.radius +
            Math.random() *
            (
                fieldWidth -
                this.radius * 2
            );

        this.y =
            this.radius + 34 +
            Math.random() *
            (
                fieldHeight -
                this.radius * 2 -
                52
            );

        const speed =
            0.35 + Math.random() * 0.45;
        const angle =
            Math.random() * Math.PI * 2;

        this.velocityX =
            Math.cos(angle) * speed;
        this.velocityY =
            Math.sin(angle) * speed;
        this.pulseOffset =
            Math.random() * Math.PI * 2;

    }

    update(fieldWidth, fieldHeight) {

        this.x += this.velocityX;
        this.y += this.velocityY;

        const topBoundary =
            this.radius + 28;

        if (
            this.x <= this.radius ||
            this.x >=
                fieldWidth - this.radius
        ) {
            this.velocityX *= -1;
            this.x = Math.max(
                this.radius,
                Math.min(
                    fieldWidth - this.radius,
                    this.x
                )
            );
        }

        if (
            this.y <= topBoundary ||
            this.y >=
                fieldHeight - this.radius
        ) {
            this.velocityY *= -1;
            this.y = Math.max(
                topBoundary,
                Math.min(
                    fieldHeight - this.radius,
                    this.y
                )
            );
        }

    }

    contains(x, y) {

        return Math.hypot(
            this.x - x,
            this.y - y
        ) <= this.radius + 10;

    }

    draw(context, timestampMs) {

        const style =
            PARTICLE_STYLES[
                this.particleId
            ];

        const pulse =
            1 +
            Math.sin(
                timestampMs / 420 +
                this.pulseOffset
            ) * 0.06;

        context.save();
        context.translate(this.x, this.y);
        context.scale(pulse, pulse);

        context.beginPath();
        context.arc(
            0,
            0,
            this.radius,
            0,
            Math.PI * 2
        );

        context.fillStyle = style.fill;
        context.strokeStyle = style.stroke;
        context.lineWidth = 2;
        context.shadowColor = style.glow;
        context.shadowBlur = 14;
        context.fill();
        context.stroke();

        context.shadowBlur = 0;
        context.fillStyle = "#15212a";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font =
            "bold 18px monospace";
        context.fillText(
            style.baseSymbol,
            -2,
            2
        );

        context.font =
            "bold 10px monospace";
        context.fillText(
            style.chargeSymbol,
            9,
            -8
        );

        context.restore();

    }

}

const QuantumField = {

    initialized: false,
    active: false,
    canvasElement: null,
    context: null,
    particles: [],
    animationFrameId: null,
    pointerHandler: null,
    onParticleSelected: null,
    onFieldMiss: null,
    getActivityStatus: null,

    initialize({
        canvasElement,
        onParticleSelected,
        onFieldMiss,
        getActivityStatus
    } = {}) {

        if (this.initialized) {
            this.onParticleSelected =
                onParticleSelected ??
                this.onParticleSelected;
            this.onFieldMiss =
                onFieldMiss ??
                this.onFieldMiss;
            this.getActivityStatus =
                getActivityStatus ??
                this.getActivityStatus;

            return true;
        }

        if (
            !canvasElement ||
            typeof canvasElement.getContext !==
                "function"
        ) {
            throw new Error(
                "QuantumField: a canvas element is required"
            );
        }

        if (
            typeof onParticleSelected !==
                "function" ||
            typeof getActivityStatus !==
                "function"
        ) {
            throw new Error(
                "QuantumField: selection and activity callbacks are required"
            );
        }

        const context =
            canvasElement.getContext("2d");

        if (!context) {
            throw new Error(
                "QuantumField: 2D canvas context is unavailable"
            );
        }

        this.canvasElement = canvasElement;
        this.context = context;
        this.onParticleSelected =
            onParticleSelected;
        this.onFieldMiss =
            typeof onFieldMiss === "function"
                ? onFieldMiss
                : null;
        this.getActivityStatus =
            getActivityStatus;

        this.canvasElement.width =
            FIELD_WIDTH;
        this.canvasElement.height =
            FIELD_HEIGHT;

        this.pointerHandler =
            event =>
                this.handlePointer(event);

        this.canvasElement.addEventListener(
            "pointerdown",
            this.pointerHandler
        );

        this.initialized = true;
        this.ensurePopulation();
        this.drawFrame(0);

        console.log(
            "QuantumField.initialize() called"
        );

        return true;

    },

    getMode() {

        return this.getActivityStatus?.()
            ?.mode ?? "guided";

    },

    ensurePopulation() {

        if (!this.initialized) {
            return false;
        }

        PARTICLE_ORDER.forEach(
            particleId => {

                const currentCount =
                    this.particles.filter(
                        particle =>
                            particle.particleId ===
                            particleId
                    ).length;

                for (
                    let index = currentCount;
                    index < PARTICLES_PER_TYPE;
                    index += 1
                ) {
                    this.particles.push(
                        new FieldParticle(
                            particleId,
                            FIELD_WIDTH,
                            FIELD_HEIGHT
                        )
                    );
                }

            }
        );

        return true;

    },

    handlePointer(event) {

        if (!this.active) {
            return;
        }

        event.preventDefault?.();

        const rectangle =
            this.canvasElement
                .getBoundingClientRect();

        if (
            rectangle.width <= 0 ||
            rectangle.height <= 0
        ) {
            return;
        }

        const pointerX =
            (
                event.clientX -
                rectangle.left
            ) *
            (
                this.canvasElement.width /
                rectangle.width
            );

        const pointerY =
            (
                event.clientY -
                rectangle.top
            ) *
            (
                this.canvasElement.height /
                rectangle.height
            );

        const selectedParticle =
            [...this.particles]
                .reverse()
                .find(
                    particle =>
                        particle.contains(
                            pointerX,
                            pointerY
                        )
                );

        if (!selectedParticle) {
            this.onFieldMiss?.();
            return;
        }

        this.selectParticle(
            selectedParticle
        );

    },

    selectParticle(particle) {

        if (!this.active) {
            return {
                accepted: false,
                correct: false,
                collected: false,
                reason: "field-inactive"
            };
        }

        const result =
            this.onParticleSelected(
                particle.particleId
            );

        if (result?.collected) {
            this.particles =
                this.particles.filter(
                    candidate =>
                        candidate !== particle
                );
        }

        // Replenishment occurs after every successful
        // harvest in both guided and free modes.
        this.ensurePopulation();
        this.drawFrame(
            performance.now?.() ?? 0
        );

        return result;

    },

    selectFirstParticleOfType(
        particleId
    ) {

        const particle =
            this.particles.find(
                candidate =>
                    candidate.particleId ===
                    particleId
            );

        if (!particle) {
            return {
                accepted: false,
                correct: false,
                collected: false,
                reason:
                    "particle-not-visible"
            };
        }

        return this.selectParticle(particle);

    },

    updateParticles() {

        this.particles.forEach(
            particle =>
                particle.update(
                    FIELD_WIDTH,
                    FIELD_HEIGHT
                )
        );

    },

    drawBackground() {

        const context = this.context;

        context.clearRect(
            0,
            0,
            FIELD_WIDTH,
            FIELD_HEIGHT
        );

        context.fillStyle = "#e8edf0";
        context.fillRect(
            0,
            0,
            FIELD_WIDTH,
            FIELD_HEIGHT
        );

        context.save();
        context.strokeStyle =
            "rgba(42, 64, 77, 0.12)";
        context.lineWidth = 1;

        for (
            let x = 0;
            x <= FIELD_WIDTH;
            x += 40
        ) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, FIELD_HEIGHT);
            context.stroke();
        }

        for (
            let y = 0;
            y <= FIELD_HEIGHT;
            y += 40
        ) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(FIELD_WIDTH, y);
            context.stroke();
        }

        context.restore();

    },

    drawFrame(timestampMs = 0) {

        if (!this.context) {
            return false;
        }

        this.drawBackground();

        this.particles.forEach(
            particle =>
                particle.draw(
                    this.context,
                    timestampMs
                )
        );

        this.context.save();
        this.context.fillStyle =
            "rgba(29, 46, 57, 0.82)";
        this.context.font =
            "12px monospace";
        this.context.textAlign = "left";
        this.context.textBaseline = "top";
        this.context.fillText(
            this.getMode() === "guided"
                ? "SELECT THE PARTICLE THAT MATCHES THE PROMPT"
                : "FREE GATHERING - SELECT ANY PARTICLE",
            14,
            12
        );
        this.context.restore();

        return true;

    },

    animate(timestampMs) {

        if (!this.active) {
            this.animationFrameId = null;
            return;
        }

        this.ensurePopulation();
        this.updateParticles();
        this.drawFrame(timestampMs);

        this.animationFrameId =
            requestAnimationFrame(
                nextTimestamp =>
                    this.animate(
                        nextTimestamp
                    )
            );

    },

    activate() {

        if (!this.initialized) {
            return false;
        }

        this.active = true;
        this.ensurePopulation();

        if (this.animationFrameId === null) {
            this.animationFrameId =
                requestAnimationFrame(
                    timestamp =>
                        this.animate(
                            timestamp
                        )
                );
        }

        console.log(
            "QuantumField.activate() called"
        );

        return true;

    },

    deactivate() {

        this.active = false;

        if (this.animationFrameId !== null) {
            cancelAnimationFrame(
                this.animationFrameId
            );
            this.animationFrameId = null;
        }

        console.log(
            "QuantumField.deactivate() called"
        );

        return true;

    },

    getParticlesSnapshot() {

        return this.particles.map(
            particle => ({
                particleId:
                    particle.particleId,
                x: particle.x,
                y: particle.y,
                radius: particle.radius
            })
        );

    },

    getRuntimeStatus() {

        const visibleCounts = {};

        PARTICLE_ORDER.forEach(
            particleId => {
                visibleCounts[particleId] =
                    this.particles.filter(
                        particle =>
                            particle.particleId ===
                            particleId
                    ).length;
            }
        );

        const activityStatus =
            this.getActivityStatus?.() ??
            null;

        return {
            initialized: this.initialized,
            active: this.active,
            animationScheduled:
                this.animationFrameId !== null,
            mode:
                activityStatus?.mode ??
                "guided",
            guidanceComplete:
                Boolean(
                    activityStatus
                        ?.guidanceComplete
                ),
            particleCount:
                this.particles.length,
            visibleCounts
        };

    },

    destroy() {

        this.deactivate();

        if (
            this.canvasElement &&
            this.pointerHandler
        ) {
            this.canvasElement
                .removeEventListener(
                    "pointerdown",
                    this.pointerHandler
                );
        }

        this.initialized = false;
        this.canvasElement = null;
        this.context = null;
        this.particles = [];
        this.pointerHandler = null;
        this.onParticleSelected = null;
        this.onFieldMiss = null;
        this.getActivityStatus = null;

        return true;

    }

};

export default QuantumField;
