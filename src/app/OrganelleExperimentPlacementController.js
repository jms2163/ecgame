// --------------------------------------------------
// OrganelleExperimentPlacementController.js
// Handles temporary pointer-based experiment placements
// --------------------------------------------------
import ExperimentMaterialVisualLibrary
    from "./ExperimentMaterialVisualLibrary.js";

const OrganelleExperimentPlacementController = {

    activeExperimentId: null,

    materials: new Map(),
    labels: new Map(),
    dropZones: new Map(),

    placements: [],
    labelSourceElements: new Map(),

    activeDrag: null,
    dragGhostElement: null,
    placementCounter: 0,

    boundPointerMove: null,
    boundPointerUp: null,

    // --------------------------------------------------
    // Configure one temporary experiment attempt
    // --------------------------------------------------
    start(experiment) {

        this.reset();

        this.activeExperimentId =
            experiment?.id ?? null;

        (
            experiment?.stage?.materials ?? []
        ).forEach(material => {

            this.materials.set(
                material.id,
                material
            );

        });

        (
            experiment?.stage?.labels ?? []
        ).forEach(label => {

            this.labels.set(
                label.id,
                label
            );

        });

    },

    // --------------------------------------------------
    // Clear temporary stage state
    // --------------------------------------------------
    reset() {

        this.cancelActiveDrag();

        this.activeExperimentId =
            null;

        this.materials.clear();

        this.labels.clear();

        this.dropZones.clear();

        this.placements = [];

        this.labelSourceElements.clear();

        this.placementCounter =
            0;

    },

    // --------------------------------------------------
    // Prepare persistent pointer handlers
    // --------------------------------------------------
    ensurePointerHandlers() {

        this.boundPointerMove ??=
            event =>
                this.handlePointerMove(event);

        this.boundPointerUp ??=
            event =>
                this.handlePointerUp(event);

    },

    // --------------------------------------------------
// Create one material visual from its shared visual ID
// --------------------------------------------------
createMaterialVisual(material) {

    const visual =
        ExperimentMaterialVisualLibrary.create(
            material?.visualId
        );

    if (visual) {
        return visual;
    }

    const fallback =
        document.createElement("span");

    fallback.className =
        "organelle-experiment-particle " +
        "organelle-experiment-particle--unknown";

    fallback.textContent =
        "?";

    fallback.setAttribute(
        "aria-hidden",
        "true"
    );

    return fallback;

},

    // --------------------------------------------------
// Create a palette material source
// --------------------------------------------------
createMaterialSource(material) {

    const source =
        document.createElement("div");

    source.className =
        "organelle-experiment-material";

    source.dataset.materialId =
        material.id;

    source.setAttribute(
        "aria-label",
        material.ariaLabel
    );

    const visual =
        this.createMaterialVisual(
            material
        );

    const name =
        document.createElement("span");

    name.className =
        "organelle-experiment-material-name";

    name.textContent =
        material.displayName ??
        material.ariaLabel ??
        material.id;

    source.append(
        visual,
        name
    );

    source.addEventListener(
        "pointerdown",
        event => {

            this.beginPaletteDrag(
                "material",
                material.id,
                event
            );

        }
    );

    return source;

},

    // --------------------------------------------------
    // Create a palette label source
    // --------------------------------------------------
    createLabelSource(labelData) {

        const source =
            document.createElement("div");

        source.className =
            "organelle-experiment-label";

        source.dataset.labelId =
            labelData.id;

        source.textContent =
            labelData.text;

        source.addEventListener(
            "pointerdown",
            event => {

                if (
                    this.hasPlacedLabel(
                        labelData.id
                    )
                ) {
                    return;
                }

                this.beginPaletteDrag(
                    "label",
                    labelData.id,
                    event
                );

            }
        );

        this.labelSourceElements.set(
            labelData.id,
            source
        );

        return source;

    },

    // --------------------------------------------------
    // Register one surface as a placement target
    // --------------------------------------------------
    registerDropZone(
        element,
        zoneId
    ) {

        element.dataset.experimentDropZone =
            zoneId;

        this.dropZones.set(
            zoneId,
            element
        );

    },

    // --------------------------------------------------
    // Begin a palette-source drag
    // --------------------------------------------------
    beginPaletteDrag(
        kind,
        definitionId,
        event
    ) {

        this.beginDrag(
            {
                source: "palette",
                kind,
                definitionId
            },
            event
        );

    },

    // --------------------------------------------------
    // Begin a placed-item drag
    // --------------------------------------------------
    beginPlacementDrag(
        placementId,
        event
    ) {

        const placement =
            this.placements.find(
                candidate =>
                    candidate.id === placementId
            );

        if (!placement) {
            return;
        }

        this.beginDrag(
            {
                source: "placement",
                placementId,

                kind:
                    placement.kind,

                definitionId:
                    placement.definitionId
            },
            event
        );

    },

    // --------------------------------------------------
// Create a visual drag ghost under the pointer
// --------------------------------------------------
createDragGhost(payload) {

    const ghost =
        document.createElement("div");

    ghost.className =
        "organelle-experiment-drag-ghost";

    if (payload.kind === "material") {

        const material =
            this.materials.get(
                payload.definitionId
            );

        ghost.appendChild(
            this.createMaterialVisual(
                material
            )
        );

    } else {

        const label =
            this.labels.get(
                payload.definitionId
            );

        ghost.classList.add(
            "organelle-experiment-drag-ghost--label"
        );

        ghost.textContent =
            label?.text ?? "";

    }

    document.body.appendChild(
        ghost
    );

    return ghost;

},

    // --------------------------------------------------
    // Begin one pointer drag
    // --------------------------------------------------
    beginDrag(
        payload,
        event
    ) {

        if (
            event.pointerType === "mouse" &&
            event.button !== 0
        ) {
            return;
        }

        event.preventDefault();

        this.ensurePointerHandlers();

        this.cancelActiveDrag();

        this.activeDrag = {
            ...payload
        };

        this.dragGhostElement =
            this.createDragGhost(payload);

        this.positionDragGhost(
            event.clientX,
            event.clientY
        );

        window.addEventListener(
            "pointermove",
            this.boundPointerMove
        );

        window.addEventListener(
            "pointerup",
            this.boundPointerUp,
            {
                once: true
            }
        );

    },

    // --------------------------------------------------
    // Move the drag ghost
    // --------------------------------------------------
    positionDragGhost(
        clientX,
        clientY
    ) {

        if (!this.dragGhostElement) {
            return;
        }

        this.dragGhostElement.style.left =
            `${clientX}px`;

        this.dragGhostElement.style.top =
            `${clientY}px`;

    },

    // --------------------------------------------------
    // Highlight the target beneath the pointer
    // --------------------------------------------------
    updateDropZoneHighlight(
        clientX,
        clientY
    ) {

        this.dropZones.forEach(element => {

            element.classList.remove(
                "organelle-experiment-drop-zone--active"
            );

        });

        const target =
            document.elementFromPoint(
                clientX,
                clientY
            )?.closest(
                "[data-experiment-drop-zone]"
            );

        target?.classList.add(
            "organelle-experiment-drop-zone--active"
        );

    },

    // --------------------------------------------------
    // Handle pointer movement
    // --------------------------------------------------
    handlePointerMove(event) {

        if (!this.activeDrag) {
            return;
        }

        this.positionDragGhost(
            event.clientX,
            event.clientY
        );

        this.updateDropZoneHighlight(
            event.clientX,
            event.clientY
        );

    },

    // --------------------------------------------------
    // Convert a pointer location to normalized zone space
    // --------------------------------------------------
    getNormalizedPosition(
        element,
        clientX,
        clientY
    ) {

        const box =
            element.getBoundingClientRect();

        const clamp = value =>
            Math.min(
                0.94,
                Math.max(0.06, value)
            );

        return {
            x: clamp(
                (clientX - box.left) /
                box.width
            ),

            y: clamp(
                (clientY - box.top) /
                box.height
            )
        };

    },

    // --------------------------------------------------
    // Add or move one experiment placement
    // --------------------------------------------------
    placeActiveDrag(
        zoneId,
        clientX,
        clientY
    ) {

        const zone =
            this.dropZones.get(zoneId);

        if (!zone || !this.activeDrag) {
            return;
        }

        const position =
            this.getNormalizedPosition(
                zone,
                clientX,
                clientY
            );

        if (
            this.activeDrag.source ===
            "placement"
        ) {
            const placement =
                this.placements.find(
                    candidate =>
                        candidate.id ===
                        this.activeDrag.placementId
                );

            if (placement) {
                placement.zoneId =
                    zoneId;

                placement.position =
                    position;
            }

        } else {

            this.placementCounter++;

            this.placements.push(
                {
                    id:
                        `placement-${this.placementCounter}`,

                    kind:
                        this.activeDrag.kind,

                    definitionId:
                        this.activeDrag.definitionId,

                    zoneId,

                    position
                }
            );

        }

        this.renderPlacements();

    },

    // --------------------------------------------------
    // Render placed items in their assigned zones
    // --------------------------------------------------
    renderPlacements() {

        this.dropZones.forEach(zone => {

            zone.querySelectorAll(
                ".organelle-experiment-placement"
            ).forEach(element => {

                element.remove();

            });

        });

        this.placements.forEach(placement => {

            const zone =
                this.dropZones.get(
                    placement.zoneId
                );

            if (!zone) {
                return;
            }

            const element =
                this.createPlacementElement(
                    placement
                );

            zone.appendChild(element);

        });

        this.refreshLabelSources();

    },

    // --------------------------------------------------
    // Create one movable placed item
    // --------------------------------------------------
    createPlacementElement(placement) {

        const element =
            document.createElement("div");

        element.className =
            `organelle-experiment-placement ` +
            `organelle-experiment-placement--${placement.kind}`;

        element.dataset.placementId =
            placement.id;

        element.style.left =
            `${placement.position.x * 100}%`;

        element.style.top =
            `${placement.position.y * 100}%`;

        if (placement.kind === "material") {

    const material =
        this.materials.get(
            placement.definitionId
        );

    element.appendChild(
        this.createMaterialVisual(
            material
        )
    );

} else {

            const label =
                this.labels.get(
                    placement.definitionId
                );

            element.textContent =
                label?.text ?? "";

        }

        element.addEventListener(
            "pointerdown",
            event => {

                this.beginPlacementDrag(
                    placement.id,
                    event
                );

            }
        );

        return element;

    },

    // --------------------------------------------------
    // Determine whether a label is already placed
    // --------------------------------------------------
    hasPlacedLabel(labelId) {

        return this.placements.some(
            placement =>
                placement.kind === "label" &&
                placement.definitionId === labelId
        );

    },

    // --------------------------------------------------
    // Dim used label sources
    // --------------------------------------------------
    refreshLabelSources() {

        this.labelSourceElements.forEach(
            (
                element,
                labelId
            ) => {

                const isUsed =
                    this.hasPlacedLabel(labelId);

                element.classList.toggle(
                    "organelle-experiment-label--used",
                    isUsed
                );

                element.setAttribute(
                    "aria-disabled",
                    String(isUsed)
                );

            }
        );

    },

    // --------------------------------------------------
    // Handle pointer release
    // --------------------------------------------------
    handlePointerUp(event) {

        const target =
            document.elementFromPoint(
                event.clientX,
                event.clientY
            )?.closest(
                "[data-experiment-drop-zone]"
            );

        const zoneId =
            target?.dataset
                .experimentDropZone;

        if (zoneId) {
            this.placeActiveDrag(
                zoneId,
                event.clientX,
                event.clientY
            );
        }

        this.cancelActiveDrag();

    },

    // --------------------------------------------------
    // Remove active-drag visuals and listeners
    // --------------------------------------------------
    cancelActiveDrag() {

        window.removeEventListener(
            "pointermove",
            this.boundPointerMove
        );

        this.dropZones.forEach(element => {

            element.classList.remove(
                "organelle-experiment-drop-zone--active"
            );

        });

        this.dragGhostElement?.remove();

        this.dragGhostElement =
            null;

        this.activeDrag =
            null;

    },

    // --------------------------------------------------
    // Read a re-renderable temporary placement snapshot
    // --------------------------------------------------
    getPlacementSnapshot() {

        return structuredClone(
            {
                experimentId:
                    this.activeExperimentId,

                components:
                    this.placements
                        .filter(
                            placement =>
                                placement.kind ===
                                "material"
                        )
                        .map(placement => ({
                            id:
                                placement.definitionId,

                            zoneId:
                                placement.zoneId,

                            position:
                                placement.position
                        })),

                labels:
                    this.placements
                        .filter(
                            placement =>
                                placement.kind ===
                                "label"
                        )
                        .map(placement => ({
                            id:
                                placement.definitionId,

                            zoneId:
                                placement.zoneId,

                            position:
                                placement.position
                        }))
            }
        );

    }

};

export default OrganelleExperimentPlacementController;