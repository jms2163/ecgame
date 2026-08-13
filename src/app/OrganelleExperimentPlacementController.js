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
    placementEvents: [],
    labelSourceElements: new Map(),

    activeDrag: null,
    dragGhostElement: null,
    placementCounter: 0,

    selectedPlacementId: null,
    onSelectionChanged: null,

    isReadOnly: false,

    boundPointerMove: null,
    boundPointerUp: null,

    // --------------------------------------------------
    // Configure one temporary experiment attempt
    // --------------------------------------------------
    start(experiment) {

        this.reset();
        this.placements = [];

        this.activeExperimentId =
            experiment?.id ?? null;

        this.isReadOnly = false;

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

    this.placementEvents = [];

    this.labelSourceElements.clear();

    this.placementCounter =
        0;

    this.selectedPlacementId =
        null;

    this.onSelectionChanged =
        null;

    this.isReadOnly =
        false;

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

        this.selectPlacement(placementId);

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

    const visual =
        this.createMaterialVisual(
            material
        );

    const placement =
        payload.source === "placement"
            ? this.placements.find(
                candidate =>
                    candidate.id ===
                    payload.placementId
            )
            : null;

    const rotationDeg =
        placement?.rotationDeg ??
        material?.initialRotationDeg ??
        0;

    visual.style.transform =
        `rotate(${rotationDeg}deg)`;

    ghost.appendChild(visual);

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

        const trashTarget =
            document.elementFromPoint(
                clientX,
                clientY
            )?.closest(
                "[data-experiment-trash]"
            );

        trashTarget?.classList.add(
            "organelle-experiment-trash--active"
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
// Record one placement action for future Journal review
// --------------------------------------------------
    recordPlacementEvent(
    eventType,
    placement
) {

    if (!placement) {
        return;
    }

    this.placementEvents.push(
        {
            eventId:
                `event-${this.placementEvents.length + 1}`,

            eventType,

            kind:
                placement.kind,

            definitionId:
                placement.definitionId,

            zoneId:
                placement.zoneId,

            position:
                structuredClone(
                    placement.position
                ),

            rotationDeg:
                placement.rotationDeg ?? 0,

            occurredAtMs:
                Date.now()
        }
    );

},

    // --------------------------------------------------
// Add or move one experiment placement
// --------------------------------------------------
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

    let changedPlacement =
        null;

    let eventType =
        null;

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

            changedPlacement =
                placement;

            eventType =
                "moved";
        }

    } else {

        this.placementCounter++;

        changedPlacement = {
            id:
                `placement-${this.placementCounter}`,

            kind:
                this.activeDrag.kind,

            definitionId:
                this.activeDrag.definitionId,

            zoneId,

            position,

            rotationDeg:
                this.activeDrag.kind === "material"
                    ? this.materials.get(
                        this.activeDrag.definitionId
                    )?.initialRotationDeg ?? 0
                    : 0
        };

        this.placements.push(
            changedPlacement
        );

        if (
            changedPlacement.kind === "material" &&
            this.materials.get(
                changedPlacement.definitionId
            )?.rotatable
        ) {
            this.selectedPlacementId =
                changedPlacement.id;
        }

        eventType =
            "placed";
    }

    this.recordPlacementEvent(
        eventType,
        changedPlacement
    );

    this.renderPlacements();

    this.onSelectionChanged?.(
        this.getSelectedPlacement()
    );

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

        element.classList.toggle(
            "organelle-experiment-placement--selected",
            placement.id === this.selectedPlacementId
        );

        element.style.left =
            `${placement.position.x * 100}%`;

        element.style.top =
            `${placement.position.y * 100}%`;

        if (placement.kind === "material") {

    const material =
        this.materials.get(
            placement.definitionId
        );

    if (material?.id === "water") {
        const cluster = document.createElement("span");
        cluster.className = "organelle-experiment-water-cluster";
        for (let index = 0; index < 12; index += 1) {
            cluster.appendChild(this.createMaterialVisual(material));
        }
        element.appendChild(cluster);
    } else {
        const visual = this.createMaterialVisual(material);
        visual.style.transform = `rotate(${placement.rotationDeg ?? 0}deg)`;
        element.appendChild(visual);
    }

} else {

            const label =
                this.labels.get(
                    placement.definitionId
                );

            element.textContent =
                label?.text ?? "";

        }

        if (!this.isReadOnly) {
            element.addEventListener(
                "pointerdown",
                event => {

                    this.beginPlacementDrag(
                        placement.id,
                        event
                    );

                }
            );
        }

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

        const trashTarget =
            document.elementFromPoint(
                event.clientX,
                event.clientY
            )?.closest(
                "[data-experiment-trash]"
            );

        if (
            trashTarget &&
            this.activeDrag?.source === "placement" &&
            this.activeDrag?.kind === "material"
        ) {
            this.removePlacement(
                this.activeDrag.placementId
            );

            this.cancelActiveDrag();
            return;
        }

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
    // Explicitly remove one placed material. Palette
    // sources and labels cannot be deleted through trash.
    // --------------------------------------------------
    removePlacement(placementId) {

        const index =
            this.placements.findIndex(
                placement =>
                    placement.id === placementId &&
                    placement.kind === "material"
            );

        if (index < 0) {
            return false;
        }

        const [removedPlacement] =
            this.placements.splice(index, 1);

        if (
            this.selectedPlacementId ===
            removedPlacement.id
        ) {
            this.selectedPlacementId = null;
        }

        this.recordPlacementEvent(
            "removed",
            removedPlacement
        );

        this.renderPlacements();

        this.onSelectionChanged?.(
            this.getSelectedPlacement()
        );

        return true;

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

        document.querySelectorAll(
            "[data-experiment-trash]"
        ).forEach(element => {
            element.classList.remove(
                "organelle-experiment-trash--active"
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

                    events:
    this.placementEvents,

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
                                placement.position,

                            rotationDeg:
                                placement.rotationDeg ?? 0
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

    ,

    // --------------------------------------------------
    // Select one individual placed material for controls
    // such as Rotate. Labels cannot be selected.
    // --------------------------------------------------
    selectPlacement(placementId) {

        const placement =
            this.placements.find(
                candidate =>
                    candidate.id === placementId &&
                    candidate.kind === "material"
            ) ?? null;

        this.selectedPlacementId =
            placement?.id ?? null;

        this.renderPlacements();

        this.onSelectionChanged?.(
            placement
                ? structuredClone(placement)
                : null
        );

        return Boolean(placement);

    },

    // --------------------------------------------------
    // Rotate the selected, rotatable material by 90°.
    // --------------------------------------------------
    rotateSelectedPlacement() {

        const placement =
            this.placements.find(
                candidate =>
                    candidate.id === this.selectedPlacementId
            );

        const material =
            this.materials.get(
                placement?.definitionId
            );

        if (!placement || !material?.rotatable) {
            return false;
        }

        placement.rotationDeg =
            ((placement.rotationDeg ?? 0) + 90) % 360;

        this.recordPlacementEvent(
            "rotated",
            placement
        );

        this.renderPlacements();

        this.onSelectionChanged?.(
            structuredClone(placement)
        );

        return true;

    },

    // --------------------------------------------------
    // Read the selected placement without exposing it.
    // --------------------------------------------------
    getSelectedPlacement() {

        const placement =
            this.placements.find(
                candidate =>
                    candidate.id === this.selectedPlacementId
            );

        return placement
            ? structuredClone(placement)
            : null;

    }

    ,

    // --------------------------------------------------
    // Rebuild a saved placement snapshot for read-only
    // submission review. The active experiment must match.
    // --------------------------------------------------
    restoreSnapshot(snapshot) {

        if (
            !snapshot ||
            snapshot.experimentId !==
                this.activeExperimentId
        ) {
            console.warn(
                "OrganelleExperimentPlacementController: snapshot does not match the active experiment"
            );

            return false;
        }

        const savedPlacements = [
            ...(snapshot.components ?? []).map(
                component => ({
                    kind: "material",
                    definitionId: component.id,
                    zoneId: component.zoneId,
                    position: component.position
                    ,
                    rotationDeg:
                        component.rotationDeg ?? 0
                })
            ),
            ...(snapshot.labels ?? []).map(
                label => ({
                    kind: "label",
                    definitionId: label.id,
                    zoneId: label.zoneId,
                    position: label.position
                })
            )
        ];

        this.placements =
            savedPlacements
                .filter(placement =>
                    this.dropZones.has(
                        placement.zoneId
                    ) &&
                    this[
                        placement.kind === "material"
                            ? "materials"
                            : "labels"
                    ].has(placement.definitionId) &&
                    Number.isFinite(
                        placement.position?.x
                    ) &&
                    Number.isFinite(
                        placement.position?.y
                    )
                )
                .map((placement, index) => ({
                    id: `review-placement-${index + 1}`,
                    ...structuredClone(placement)
                }));

        this.placementEvents =
            structuredClone(
                snapshot.events ?? []
            );

        this.placementCounter =
            this.placements.length;

        this.selectedPlacementId =
            null;

        this.isReadOnly = true;

        this.renderPlacements();

        return true;

    }

};

export default OrganelleExperimentPlacementController;
