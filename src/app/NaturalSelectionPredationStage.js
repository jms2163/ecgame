// --------------------------------------------------
// NaturalSelectionPredationStage.js
// Canvas adapter for student-controlled visual hunting
// --------------------------------------------------

import AmoebaSpriteCache
    from "./AmoebaSpriteCache.js";
import InvestigationSessionManager
    from "./InvestigationSessionManager.js";
import NaturalSelectionPrototypeConfig
    from "./NaturalSelectionPrototypeConfig.js";
import VisualPredationModel
    from "./VisualPredationModel.js";

const clamp = (
    value,
    minimum,
    maximum
) =>
    Math.min(
        maximum,
        Math.max(minimum, value)
    );

const hexToRgb = hexColor => {

    const match =
        /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i
            .exec(hexColor);

    if (!match) {
        throw new TypeError(
            `Expected a six-digit hex color: ${hexColor}`
        );
    }

    return match.slice(1).map(
        channel =>
            Number.parseInt(
                channel,
                16
            )
    );

};

const interpolateColor = (
    lightColor,
    darkColor,
    percentage
) => {

    const light =
        hexToRgb(lightColor);
    const dark =
        hexToRgb(darkColor);
    const ratio =
        clamp(
            percentage,
            0,
            100
        ) / 100;

    const channels =
        light.map(
            (
                lightChannel,
                index
            ) =>
                Math.round(
                    lightChannel +
                    (
                        dark[index] -
                        lightChannel
                    ) * ratio
                )
        );

    return `rgb(${channels.join(", ")})`;

};

const NaturalSelectionPredationStage = {

    initialized: false,
    active: false,
    areaElement: null,
    canvasElement: null,
    statusElement: null,
    context: null,
    simulation: null,
    simulationKey: null,
    sessionSnapshot: null,
    spriteVariants: null,
    spriteLoadError: null,
    animationFrameId: null,
    lastFrameTime: null,
    generationStartedAt: null,
    predator: {
        x: 360,
        y: 220,
        angle: 0
    },

    initialize() {

        if (this.initialized) {
            return true;
        }

        this.areaElement =
            document.getElementById(
                "natural-selection-predation-area"
            );

        this.canvasElement =
            document.getElementById(
                "natural-selection-predation-canvas"
            );

        this.statusElement =
            document.getElementById(
                "natural-selection-hunt-status"
            );

        if (
            !this.areaElement ||
            !this.canvasElement ||
            !this.statusElement
        ) {
            console.warn(
                "NaturalSelectionPredationStage: required DOM elements are unavailable"
            );

            return false;
        }

        const visualConfig =
            NaturalSelectionPrototypeConfig
                .visualPredation;

        this.canvasElement.width =
            visualConfig.fieldWidth;
        this.canvasElement.height =
            visualConfig.fieldHeight;

        this.context =
            this.canvasElement
                .getContext("2d");

        if (!this.context) {
            console.warn(
                "NaturalSelectionPredationStage: 2D canvas is unavailable"
            );

            return false;
        }

        this.canvasElement.addEventListener(
            "pointermove",
            event => {
                this.handlePointerMove(event);
            }
        );

        this.canvasElement.addEventListener(
            "click",
            event => {
                this.handlePointerMove(event);
                this.canvasElement.focus();
                this.attemptCapture();
            }
        );

        this.canvasElement.addEventListener(
            "keydown",
            event => {
                this.handleKeyDown(event);
            }
        );

        InvestigationSessionManager
            .subscribe(
                session => {
                    this.syncToSession(
                        session
                    );
                }
            );

        this.initialized = true;

        this.syncToSession(
            InvestigationSessionManager
                .getSnapshot()
        );

        return true;

    },

    activate() {

        this.active = true;

        if (!this.initialize()) {
            return;
        }

        this.syncToSession(
            InvestigationSessionManager
                .getSnapshot()
        );

    },

    deactivate() {

        this.active = false;
        this.stopAnimation();

    },

    syncToSession(session) {

        this.sessionSnapshot =
            session;

        if (!this.initialized) {
            return;
        }

        if (!session) {
            this.areaElement.hidden = true;
            this.simulation = null;
            this.simulationKey = null;
            this.spriteVariants = null;
            this.stopAnimation();

            return;
        }

        this.areaElement.hidden = false;

        const nextSimulationKey =
            `${session.sessionId}|${session.currentGeneration}`;

        if (
            this.simulationKey !==
            nextSimulationKey
        ) {
            this.createGenerationSimulation(
                session,
                nextSimulationKey
            );
        }

        this.updateStatusFromSession(
            session
        );

        if (
            this.active &&
            session.phase ===
                "selection_interaction" &&
            !this.spriteLoadError
        ) {
            this.startAnimation();
        } else {
            this.stopAnimation();
            this.draw();
        }

    },

    createGenerationSimulation(
        session,
        simulationKey
    ) {

        const visualConfig =
            NaturalSelectionPrototypeConfig
                .visualPredation;

        this.simulation =
            VisualPredationModel
                .createTrial({
                    seed:
                        session.sessionId,
                    generation:
                        session.currentGeneration,
                    populationSummary:
                        session.currentPopulation,
                    width:
                        visualConfig.fieldWidth,
                    height:
                        visualConfig.fieldHeight,
                    displaySize:
                        visualConfig
                            .amoebaDisplaySize,
                    minimumCenterDistance:
                        visualConfig
                            .minimumCenterDistance,
                    movementSpeed:
                        visualConfig
                            .movementSpeedPixelsPerSecond
                });

        this.simulationKey =
            simulationKey;
        this.generationStartedAt =
            performance.now();
        this.lastFrameTime = null;
        this.spriteVariants = null;
        this.spriteLoadError = null;

        this.predator.x =
            visualConfig.fieldWidth / 2;
        this.predator.y =
            visualConfig.fieldHeight / 2;
        this.predator.angle = 0;

        const calibration =
            session.setup
                .visualCalibration;

        AmoebaSpriteCache.getVariants({
            source:
                visualConfig
                    .amoebaSpritePath,
            pigmentationLevel:
                calibration
                    .pigmentationLevel,
            pigmentColor:
                calibration.pigmentColor ??
                NaturalSelectionPrototypeConfig
                    .visualCalibration
                    .pigmentColor
        }).then(
            variants => {

                if (
                    this.simulationKey !==
                    simulationKey
                ) {
                    return;
                }

                this.spriteVariants =
                    variants;
                this.spriteLoadError = null;
                this.draw();

                if (
                    this.active &&
                    this.sessionSnapshot
                        ?.phase ===
                        "selection_interaction"
                ) {
                    this.startAnimation();
                }

            }
        ).catch(
            error => {

                if (
                    this.simulationKey !==
                    simulationKey
                ) {
                    return;
                }

                this.spriteLoadError =
                    error;
                this.stopAnimation();
                this.statusElement.textContent =
                    "The amoeba image could not be loaded. Check the configured public asset path, then restart the setup.";
                this.draw();

                console.error(
                    "NaturalSelectionPredationStage: sprite load failed",
                    error
                );

            }
        );

        this.draw();

    },

    getCanvasPoint(event) {

        const bounds =
            this.canvasElement
                .getBoundingClientRect();

        return {
            x:
                (
                    event.clientX -
                    bounds.left
                ) /
                bounds.width *
                this.canvasElement.width,
            y:
                (
                    event.clientY -
                    bounds.top
                ) /
                bounds.height *
                this.canvasElement.height
        };

    },

    movePredatorTo(
        x,
        y
    ) {

        const nextX =
            clamp(
                x,
                0,
                this.canvasElement.width
            );
        const nextY =
            clamp(
                y,
                0,
                this.canvasElement.height
            );
        const movementX =
            nextX - this.predator.x;
        const movementY =
            nextY - this.predator.y;

        if (
            movementX !== 0 ||
            movementY !== 0
        ) {
            this.predator.angle =
                Math.atan2(
                    movementY,
                    movementX
                );
        }

        this.predator.x = nextX;
        this.predator.y = nextY;

        this.draw();

    },

    handlePointerMove(event) {

        if (!this.simulation) {
            return;
        }

        const point =
            this.getCanvasPoint(event);

        this.movePredatorTo(
            point.x,
            point.y
        );

    },

    handleKeyDown(event) {

        if (
            !this.simulation ||
            this.sessionSnapshot?.phase !==
                "selection_interaction"
        ) {
            return;
        }

        const step =
            NaturalSelectionPrototypeConfig
                .visualPredation
                .keyboardPredatorStep;

        const movementByKey = {
            ArrowLeft: [-step, 0],
            ArrowRight: [step, 0],
            ArrowUp: [0, -step],
            ArrowDown: [0, step]
        };

        if (event.key in movementByKey) {
            event.preventDefault();

            const [
                movementX,
                movementY
            ] = movementByKey[event.key];

            this.movePredatorTo(
                this.predator.x +
                    movementX,
                this.predator.y +
                    movementY
            );

            return;
        }

        if (
            (
                event.key === " " ||
                event.key === "Enter"
            ) &&
            !event.repeat
        ) {
            event.preventDefault();
            this.attemptCapture();
        }

    },

    attemptCapture() {

        const session =
            InvestigationSessionManager
                .getSnapshot();

        if (
            !session ||
            session.phase !==
                "selection_interaction" ||
            !this.simulation ||
            !this.spriteVariants ||
            this.spriteLoadError
        ) {
            return false;
        }

        const target =
            VisualPredationModel
                .findCaptureTarget(
                    this.simulation,
                    this.predator.x,
                    this.predator.y,
                    NaturalSelectionPrototypeConfig
                        .visualPredation
                        .amoebaHitRadius
                );

        const elapsedMs =
            Math.max(
                0,
                Math.round(
                    performance.now() -
                    this.generationStartedAt
                )
            );

        if (!target) {
            InvestigationSessionManager
                .recordCaptureAttempt({
                    successful: false,
                    elapsedMs
                });

            this.statusElement.textContent =
                "Miss. Aim the pointed end of the predator at an amoeba and try again.";

            return false;
        }

        VisualPredationModel.capture(
            this.simulation,
            target.id
        );

        try {
            const updatedSession =
                InvestigationSessionManager
                    .recordSuccessfulCapture(
                        target.phenotypeId,
                        {
                            elapsedMs,
                            targetId:
                                target.id
                        }
                    );

            const metrics =
                updatedSession
                    .generationRecords
                    .at(-1)
                    .selection
                    .strategyMetrics;

            if (
                updatedSession.phase ===
                "survivor_review"
            ) {
                this.statusElement.textContent =
                    "Hunt complete. Review the survivor counts before reproduction.";
            } else {
                this.statusElement.textContent =
                    `Capture successful. ${metrics.successfulCaptures} of ${updatedSession.setup.population.successfulCapturesPerGeneration} captured.`;
            }

            this.draw();

            return true;

        } catch (error) {
            target.alive = true;
            throw error;
        }

    },

    updateStatusFromSession(session) {

        const generationRecord =
            session.generationRecords
                .at(-1);

        if (
            session.phase ===
            "selection_interaction"
        ) {
            const metrics =
                generationRecord.selection
                    .strategyMetrics;

            this.statusElement.textContent =
                `Hunt is untimed. Successful captures: ${metrics.successfulCaptures} of ${generationRecord.selection.targetSuccessfulOutcomes}.`;

            return;
        }

        if (
            session.phase ===
            "survivor_review"
        ) {
            this.statusElement.textContent =
                "Hunt complete. Review the survivor counts before reproduction.";

            return;
        }

        this.statusElement.textContent =
            `Generation ${session.finalGeneration} is the final population. Predation is complete.`;

    },

    startAnimation() {

        if (
            this.animationFrameId !==
            null ||
            !this.spriteVariants
        ) {
            return;
        }

        const animate = timestamp => {

            this.animationFrameId = null;

            if (
                !this.active ||
                this.sessionSnapshot?.phase !==
                    "selection_interaction" ||
                !this.simulation
            ) {
                this.lastFrameTime = null;
                this.draw();

                return;
            }

            const elapsedSeconds =
                this.lastFrameTime === null
                    ? 0
                    : (
                        timestamp -
                        this.lastFrameTime
                    ) / 1000;

            const minimumFrameSeconds =
                1 /
                NaturalSelectionPrototypeConfig
                    .visualPredation
                    .maximumFramesPerSecond;

            if (
                this.lastFrameTime !== null &&
                elapsedSeconds <
                    minimumFrameSeconds
            ) {
                this.animationFrameId =
                    requestAnimationFrame(
                        animate
                    );

                return;
            }

            this.lastFrameTime =
                timestamp;

            VisualPredationModel.step(
                this.simulation,
                Math.min(
                    0.05,
                    elapsedSeconds
                )
            );

            this.draw();

            this.animationFrameId =
                requestAnimationFrame(
                    animate
                );

        };

        this.animationFrameId =
            requestAnimationFrame(
                animate
            );

    },

    stopAnimation() {

        if (
            this.animationFrameId !==
            null
        ) {
            cancelAnimationFrame(
                this.animationFrameId
            );
        }

        this.animationFrameId = null;
        this.lastFrameTime = null;

    },

    drawBackground() {

        const context = this.context;
        const session =
            this.sessionSnapshot;

        if (!session) {
            return;
        }

        const calibration =
            session.setup
                .visualCalibration;
        const defaultCalibration =
            NaturalSelectionPrototypeConfig
                .visualCalibration;

        const whiteColor =
            calibration
                .whiteBackgroundColor ??
            defaultCalibration
                .whiteBackgroundColor;

        const brownColor =
            interpolateColor(
                calibration
                    .brownBackgroundLightColor ??
                    defaultCalibration
                        .brownBackgroundLightColor,
                calibration
                    .brownBackgroundDarkColor ??
                    defaultCalibration
                        .brownBackgroundDarkColor,
                calibration
                    .brownBackgroundLevel
            );

        const background =
            session.setup.parameters
                .background;

        if (background === "white") {
            context.fillStyle = whiteColor;
            context.fillRect(
                0,
                0,
                this.canvasElement.width,
                this.canvasElement.height
            );

            return;
        }

        if (background === "brown") {
            context.fillStyle = brownColor;
            context.fillRect(
                0,
                0,
                this.canvasElement.width,
                this.canvasElement.height
            );

            return;
        }

        const visualConfig =
            NaturalSelectionPrototypeConfig
                .visualPredation;
        const columns =
            visualConfig
                .mixedBackgroundColumns;
        const rows =
            visualConfig
                .mixedBackgroundRows;
        const tileWidth =
            this.canvasElement.width /
            columns;
        const tileHeight =
            this.canvasElement.height /
            rows;

        for (
            let row = 0;
            row < rows;
            row += 1
        ) {
            for (
                let column = 0;
                column < columns;
                column += 1
            ) {
                context.fillStyle =
                    (
                        row + column
                    ) % 2 === 0
                        ? whiteColor
                        : brownColor;

                context.fillRect(
                    column * tileWidth,
                    row * tileHeight,
                    tileWidth,
                    tileHeight
                );
            }
        }

    },

    drawAmoebas() {

        if (
            !this.spriteVariants ||
            !this.simulation
        ) {
            return;
        }

        const displaySize =
            this.simulation.displaySize;

        this.simulation.individuals
            .forEach(
                individual => {

                    if (!individual.alive) {
                        return;
                    }

                    const sprite =
                        this.spriteVariants[
                            individual.phenotypeId
                        ];

                    this.context.save();
                    this.context.translate(
                        individual.x,
                        individual.y
                    );
                    this.context.rotate(
                        individual.rotation
                    );
                    this.context.drawImage(
                        sprite,
                        -displaySize / 2,
                        -displaySize / 2,
                        displaySize,
                        displaySize
                    );
                    this.context.restore();

                }
            );

    },

    drawPredator() {

        if (
            this.sessionSnapshot?.phase !==
            "selection_interaction"
        ) {
            return;
        }

        const context = this.context;

        context.save();
        context.translate(
            this.predator.x,
            this.predator.y
        );
        context.rotate(
            this.predator.angle
        );

        context.beginPath();
        context.moveTo(0, 0);
        context.bezierCurveTo(
            -10,
            -5,
            -24,
            -13,
            -39,
            -10
        );
        context.bezierCurveTo(
            -51,
            -7,
            -51,
            7,
            -39,
            10
        );
        context.bezierCurveTo(
            -24,
            13,
            -10,
            5,
            0,
            0
        );
        context.closePath();

        context.fillStyle =
            "rgba(53, 151, 129, 0.76)";
        context.strokeStyle =
            "rgba(5, 55, 50, 0.95)";
        context.lineWidth = 2;
        context.fill();
        context.stroke();

        context.beginPath();
        context.arc(
            -31,
            -3,
            2.2,
            0,
            Math.PI * 2
        );
        context.fillStyle = "#f7efff";
        context.fill();

        context.restore();

    },

    draw() {

        if (
            !this.context ||
            !this.sessionSnapshot
        ) {
            return;
        }

        this.context.clearRect(
            0,
            0,
            this.canvasElement.width,
            this.canvasElement.height
        );

        this.drawBackground();
        this.drawAmoebas();
        this.drawPredator();

        if (!this.spriteVariants) {
            this.context.save();
            this.context.fillStyle =
                "rgba(15, 4, 28, 0.82)";
            this.context.fillRect(
                0,
                0,
                this.canvasElement.width,
                this.canvasElement.height
            );
            this.context.fillStyle =
                "#f7efff";
            this.context.font =
                "bold 18px sans-serif";
            this.context.textAlign =
                "center";
            this.context.fillText(
                this.spriteLoadError
                    ? "Amoeba image unavailable"
                    : "Loading amoeba population…",
                this.canvasElement.width / 2,
                this.canvasElement.height / 2
            );
            this.context.restore();
        }

    }

};

export default NaturalSelectionPredationStage;
