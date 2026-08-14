// --------------------------------------------------
// QuantumField.js
// Lifecycle-safe repeatable particle-harvesting field
// --------------------------------------------------

import QuantumAudioManager
    from "./QuantumAudioManager.js";
import QuantumSpawnTimingManager
    from "./QuantumSpawnTimingManager.js";
import QuantumAutoCollectorManager
    from "./QuantumAutoCollectorManager.js";

const FIELD_WIDTH = 800;
const FIELD_HEIGHT = 420;
const PARTICLES_PER_TYPE = 3;
const PARTICLE_TRANSITION_MS = 260;
const PHOTON_INTERVAL_MS = 1000;
const PHOTON_MARGIN = 32;

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

function clamp(value, minimum, maximum) {
    return Math.max(
        minimum,
        Math.min(maximum, value)
    );
}

function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
}

class FieldParticle {

    constructor(
        particleId,
        fieldWidth,
        fieldHeight,
        animateSpawn = true
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
        this.phase = animateSpawn
            ? "spawning"
            : "active";
        this.transitionElapsedMs =
            animateSpawn
                ? 0
                : PARTICLE_TRANSITION_MS;
        this.expired = false;

    }

    update(
        fieldWidth,
        fieldHeight,
        deltaMs
    ) {

        const safeDeltaMs =
            clamp(deltaMs, 0, 50);

        if (this.phase !== "active") {
            this.transitionElapsedMs +=
                safeDeltaMs;

            if (
                this.transitionElapsedMs >=
                PARTICLE_TRANSITION_MS
            ) {
                if (
                    this.phase ===
                    "despawning"
                ) {
                    this.expired = true;
                    return;
                }

                this.phase = "active";
                this.transitionElapsedMs =
                    PARTICLE_TRANSITION_MS;
            }
        }

        const frameScale =
            safeDeltaMs /
            (1000 / 60);

        this.x +=
            this.velocityX * frameScale;
        this.y +=
            this.velocityY * frameScale;

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

        if (
            this.phase === "despawning" ||
            this.expired
        ) {
            return false;
        }

        return Math.hypot(
            this.x - x,
            this.y - y
        ) <=
            this.radius *
                this.getTransitionScale() +
            10;

    }

    beginDespawn(animate = true) {

        if (!animate) {
            this.expired = true;
            return;
        }

        this.phase = "despawning";
        this.transitionElapsedMs = 0;

    }

    getTransitionScale() {

        const progress = clamp(
            this.transitionElapsedMs /
                PARTICLE_TRANSITION_MS,
            0,
            1
        );

        if (this.phase === "spawning") {
            return easeOutCubic(progress);
        }

        if (this.phase === "despawning") {
            return 1 -
                easeOutCubic(progress);
        }

        return 1;

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

        const transitionScale =
            this.getTransitionScale();

        if (
            this.expired ||
            transitionScale <= 0.01
        ) {
            return;
        }

        context.save();
        context.translate(this.x, this.y);
        context.scale(
            pulse * transitionScale,
            pulse * transitionScale
        );

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

class FieldPhoton {

    constructor(fieldWidth, fieldHeight) {

        this.id =
            `photon-${Date.now()}-${Math.random()}`;
        this.radius = 5;
        this.trail = [];
        this.hasEntered = false;
        this.expired = false;

        const edge =
            Math.floor(Math.random() * 4);
        let targetX;
        let targetY;

        if (edge === 0) {
            this.x = -PHOTON_MARGIN;
            this.y = Math.random() *
                fieldHeight;
            targetX =
                fieldWidth + PHOTON_MARGIN;
            targetY = Math.random() *
                fieldHeight;
        } else if (edge === 1) {
            this.x =
                fieldWidth + PHOTON_MARGIN;
            this.y = Math.random() *
                fieldHeight;
            targetX = -PHOTON_MARGIN;
            targetY = Math.random() *
                fieldHeight;
        } else if (edge === 2) {
            this.x = Math.random() *
                fieldWidth;
            this.y = -PHOTON_MARGIN;
            targetX = Math.random() *
                fieldWidth;
            targetY =
                fieldHeight + PHOTON_MARGIN;
        } else {
            this.x = Math.random() *
                fieldWidth;
            this.y =
                fieldHeight + PHOTON_MARGIN;
            targetX = Math.random() *
                fieldWidth;
            targetY = -PHOTON_MARGIN;
        }

        const distance = Math.hypot(
            targetX - this.x,
            targetY - this.y
        );
        const speed =
            0.46 + Math.random() * 0.16;

        this.velocityX =
            (targetX - this.x) /
            distance * speed;
        this.velocityY =
            (targetY - this.y) /
            distance * speed;

    }

    update(deltaMs, fieldWidth, fieldHeight) {

        const safeDeltaMs =
            clamp(deltaMs, 0, 50);

        this.trail.push({
            x: this.x,
            y: this.y
        });

        if (this.trail.length > 16) {
            this.trail.shift();
        }

        this.x +=
            this.velocityX * safeDeltaMs;
        this.y +=
            this.velocityY * safeDeltaMs;

        const inside =
            this.x >= 0 &&
            this.x <= fieldWidth &&
            this.y >= 0 &&
            this.y <= fieldHeight;

        this.hasEntered =
            this.hasEntered || inside;

        const outsideExitMargin =
            this.x < -PHOTON_MARGIN ||
            this.x >
                fieldWidth + PHOTON_MARGIN ||
            this.y < -PHOTON_MARGIN ||
            this.y >
                fieldHeight + PHOTON_MARGIN;

        if (
            this.hasEntered &&
            outsideExitMargin
        ) {
            this.expired = true;
        }

    }

    draw(context) {

        const trailLength =
            this.trail.length;

        this.trail.forEach(
            (point, index) => {
                const strength =
                    (index + 1) /
                    Math.max(1, trailLength);

                context.save();
                context.beginPath();
                context.arc(
                    point.x,
                    point.y,
                    this.radius *
                        (0.25 + strength * 0.55),
                    0,
                    Math.PI * 2
                );
                context.fillStyle =
                    `rgba(246, 207, 114, ${0.025 + strength * 0.18})`;
                context.fill();
                context.restore();
            }
        );

        context.save();
        context.beginPath();
        context.arc(
            this.x,
            this.y,
            this.radius,
            0,
            Math.PI * 2
        );
        context.fillStyle =
            "rgba(246, 207, 114, 0.46)";
        context.shadowColor =
            "rgba(246, 207, 114, 0.38)";
        context.shadowBlur = 9;
        context.fill();
        context.restore();

    }

}

const QuantumField = {

    initialized: false,
    active: false,
    canvasElement: null,
    context: null,
    particles: [],
    pendingSpawns: [],
    photons: [],
    animationFrameId: null,
    lastFrameTimestampMs: null,
    nextPhotonAtMs: null,
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

            QuantumAutoCollectorManager
                .setVisibleCollectionHandler(
                    particleId =>
                        this.handleAutoCollection(
                            particleId
                        )
                );

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

        QuantumAudioManager.initialize();
        QuantumSpawnTimingManager
            .initialize();
        QuantumAutoCollectorManager
            .initialize();

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
        QuantumAutoCollectorManager
            .setVisibleCollectionHandler(
                particleId =>
                    this.handleAutoCollection(
                        particleId
                    )
            );
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

    prefersReducedMotion() {

        return Boolean(
            globalThis.matchMedia?.(
                "(prefers-reduced-motion: reduce)"
            )?.matches
        );

    },

    ensurePopulation({
        animateSpawn = true
    } = {}) {

        if (!this.initialized) {
            return false;
        }

        PARTICLE_ORDER.forEach(
            particleId => {

                const currentCount =
                    this.particles.filter(
                        particle =>
                            particle.particleId ===
                            particleId &&
                            particle.phase !==
                                "despawning" &&
                            !particle.expired
                    ).length;

                const pendingCount =
                    this.pendingSpawns
                        .filter(
                            pending =>
                                pending
                                    .particleId ===
                                particleId
                        ).length;

                for (
                    let index =
                        currentCount +
                        pendingCount;
                    index < PARTICLES_PER_TYPE;
                    index += 1
                ) {
                    this.spawnParticle(
                        particleId,
                        {
                            animateSpawn,
                            playSound: false
                        }
                    );
                }

            }
        );

        return true;

    },

    spawnParticle(
        particleId,
        {
            animateSpawn = true,
            playSound = true
        } = {}
    ) {

        const particle =
            new FieldParticle(
                particleId,
                FIELD_WIDTH,
                FIELD_HEIGHT,
                animateSpawn &&
                    !this
                        .prefersReducedMotion()
            );

        this.particles.push(particle);

        if (playSound) {
            QuantumAudioManager
                .playSpawnSound();
        }

        return particle;

    },

    queueParticleSpawn(
        particleId,
        queuedAtMs =
            performance.now?.() ?? 0
    ) {

        const delayMs =
            QuantumSpawnTimingManager
                .getRespawnDelayMs();

        const pendingSpawn = {
            id:
                `pending-${particleId}-${Date.now()}-${Math.random()}`,
            particleId,
            queuedAtMs,
            delayMs,
            readyAtMs:
                queuedAtMs + delayMs
        };

        this.pendingSpawns.push(
            pendingSpawn
        );

        return { ...pendingSpawn };

    },

    processPendingSpawns(timestampMs) {

        const ready =
            this.pendingSpawns.filter(
                pending =>
                    timestampMs >=
                    pending.readyAtMs
            );

        if (ready.length === 0) {
            return 0;
        }

        const readyIds =
            new Set(
                ready.map(
                    pending => pending.id
                )
            );

        this.pendingSpawns =
            this.pendingSpawns.filter(
                pending =>
                    !readyIds.has(
                        pending.id
                    )
            );

        ready.forEach(
            pending =>
                this.spawnParticle(
                    pending.particleId,
                    {
                        animateSpawn: true,
                        playSound: true
                    }
                )
        );

        return ready.length;

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

    selectParticle(
        particle,
        {
            animate = true,
            respectRespawnDelay =
                animate
        } = {}
    ) {

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
            const animateTransition =
                animate &&
                !this.prefersReducedMotion();

            if (animateTransition) {
                particle.beginDespawn(true);
            } else {
                this.particles =
                    this.particles.filter(
                        candidate =>
                            candidate !==
                            particle
                    );
            }

            if (respectRespawnDelay) {
                this.queueParticleSpawn(
                    particle.particleId
                );
            } else {
                this.spawnParticle(
                    particle.particleId,
                    {
                        animateSpawn:
                            animateTransition,
                        playSound: true
                    }
                );
            }
        }

        this.drawFrame(
            performance.now?.() ?? 0
        );

        return result;

    },

    selectFirstParticleOfType(
        particleId,
        {
            animate = false,
            respectRespawnDelay =
                animate
        } = {}
    ) {

        const particle =
            this.particles.find(
                candidate =>
                    candidate.particleId ===
                    particleId &&
                    candidate.phase !==
                        "despawning" &&
                    !candidate.expired
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

        return this.selectParticle(
            particle,
            {
                animate,
                respectRespawnDelay
            }
        );

    },

    selectRandomParticleOfType(
        particleId,
        {
            animate = true,
            respectRespawnDelay = true
        } = {}
    ) {

        const candidates =
            this.particles.filter(
                candidate =>
                    candidate.particleId ===
                        particleId &&
                    candidate.phase !==
                        "despawning" &&
                    !candidate.expired
            );

        if (candidates.length === 0) {
            return {
                accepted: false,
                correct: false,
                collected: false,
                reason:
                    "particle-not-visible"
            };
        }

        const particle =
            candidates[
                Math.floor(
                    Math.random() *
                    candidates.length
                )
            ];

        return this.selectParticle(
            particle,
            {
                animate,
                respectRespawnDelay
            }
        );

    },

    handleAutoCollection(particleId) {

        if (!this.active) {
            return {
                handled: false,
                collected: false,
                reason: "field-inactive"
            };
        }

        const result =
            this.selectRandomParticleOfType(
                particleId,
                {
                    animate: true,
                    respectRespawnDelay: true
                }
            );

        return {
            handled: true,
            ...result
        };

    },

    updateParticles(deltaMs) {

        this.particles.forEach(
            particle =>
                particle.update(
                    FIELD_WIDTH,
                    FIELD_HEIGHT,
                    deltaMs
                )
        );

        this.particles =
            this.particles.filter(
                particle =>
                    !particle.expired
            );

    },

    spawnPhoton() {

        if (this.prefersReducedMotion()) {
            return null;
        }

        const photon =
            new FieldPhoton(
                FIELD_WIDTH,
                FIELD_HEIGHT
            );

        this.photons.push(photon);

        return {
            id: photon.id,
            x: photon.x,
            y: photon.y,
            velocityX:
                photon.velocityX,
            velocityY:
                photon.velocityY
        };

    },

    spawnPhotonIfDue(timestampMs) {

        if (
            this.prefersReducedMotion()
        ) {
            return false;
        }

        if (
            this.nextPhotonAtMs === null
        ) {
            this.nextPhotonAtMs =
                timestampMs +
                PHOTON_INTERVAL_MS;
            return false;
        }

        if (
            timestampMs <
            this.nextPhotonAtMs
        ) {
            return false;
        }

        this.spawnPhoton();
        this.nextPhotonAtMs =
            timestampMs +
            PHOTON_INTERVAL_MS;

        return true;

    },

    updatePhotons(deltaMs) {

        this.photons.forEach(
            photon =>
                photon.update(
                    deltaMs,
                    FIELD_WIDTH,
                    FIELD_HEIGHT
                )
        );

        this.photons =
            this.photons.filter(
                photon =>
                    !photon.expired
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

        context.fillStyle = "#000000";
        context.fillRect(
            0,
            0,
            FIELD_WIDTH,
            FIELD_HEIGHT
        );

        context.save();
        context.strokeStyle =
            "rgba(112, 112, 128, 0.58)";
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

        // Photons are decorative, non-interactive, and
        // intentionally rendered behind harvestable matter.
        this.photons.forEach(
            photon =>
                photon.draw(this.context)
        );

        this.particles.forEach(
            particle =>
                particle.draw(
                    this.context,
                    timestampMs
                )
        );

        this.context.save();
        this.context.fillStyle =
            "#C8C8D0";
        this.context.font =
            "12px monospace";
        this.context.textAlign = "left";
        this.context.textBaseline = "top";
        this.context.fillText(
            this.getMode() === "guided"
                ? "SELECT THE PARTICLE THAT MATCHES THE PROMPT"
                : this.isInventorySaturated()
                    ? "SATURATED FIELD"
                    : "SELECT ANY PARTICLE",
            14,
            12
        );
        this.context.restore();

        return true;

    },

    isInventorySaturated() {

        const inventory =
            this.getActivityStatus?.()
                ?.inventory;

        if (!inventory) {
            return false;
        }

        return PARTICLE_ORDER.every(
            particleId =>
                inventory[particleId] >=
                inventory.capacity
        );

    },

    animate(timestampMs) {

        if (!this.active) {
            this.animationFrameId = null;
            return;
        }

        const deltaMs =
            this.lastFrameTimestampMs ===
                null
                ? 0
                : timestampMs -
                    this.lastFrameTimestampMs;

        this.lastFrameTimestampMs =
            timestampMs;

        this.processPendingSpawns(
            timestampMs
        );
        this.ensurePopulation();
        this.spawnPhotonIfDue(
            timestampMs
        );
        this.updatePhotons(deltaMs);
        this.updateParticles(deltaMs);
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

        const now =
            performance.now?.() ?? 0;

        this.lastFrameTimestampMs = now;
        this.nextPhotonAtMs =
            this.prefersReducedMotion()
                ? null
                : now +
                    PHOTON_INTERVAL_MS;

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

        this.lastFrameTimestampMs = null;
        this.nextPhotonAtMs = null;
        this.photons = [];

        this.particles =
            this.particles.filter(
                particle =>
                    particle.phase !==
                        "despawning" &&
                    !particle.expired
            );

        this.particles.forEach(
            particle => {
                particle.phase = "active";
                particle.transitionElapsedMs =
                    PARTICLE_TRANSITION_MS;
            }
        );

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
                radius: particle.radius,
                phase: particle.phase,
                scale:
                    particle
                        .getTransitionScale()
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
                            particleId &&
                            particle.phase !==
                                "despawning" &&
                            !particle.expired
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
                Object.values(
                    visibleCounts
                ).reduce(
                    (total, count) =>
                        total + count,
                    0
                ),
            transitionParticleCount:
                this.particles.length,
            pendingSpawnCount:
                this.pendingSpawns.length,
            respawnDelayMs:
                QuantumSpawnTimingManager
                    .getRespawnDelayMs(),
            photonCount:
                this.photons.length,
            photonIntervalMs:
                PHOTON_INTERVAL_MS,
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
        this.pendingSpawns = [];
        this.photons = [];
        this.lastFrameTimestampMs = null;
        this.nextPhotonAtMs = null;
        this.pointerHandler = null;
        this.onParticleSelected = null;
        this.onFieldMiss = null;
        this.getActivityStatus = null;

        return true;

    }

};

export default QuantumField;
