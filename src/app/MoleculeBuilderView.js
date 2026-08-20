// --------------------------------------------------
// MoleculeBuilderView.js
// Isolated Three.js renderer for molecule assembly.
// Owns only scene, drag, snap, zoom, and rotation behavior.
// --------------------------------------------------

import * as THREE from
    "https://cdn.jsdelivr.net/npm/three@0.164/build/three.module.js";

const ELEMENT_COLORS = Object.freeze({
    H: 0xf4f7ff,
    C: 0x4a5568,
    N: 0x3b82f6,
    O: 0xef4444,
    P: 0xf59e0b,
    S: 0xfacc15,
    DEFAULT: 0x94a3b8
});

// Ghost targets use unlit, high-contrast colors. Carbon is intentionally
// lighter than its solid model so its wireframe remains legible against the
// chamber background on a wide range of displays and WebGL implementations.
const GHOST_ELEMENT_COLORS = Object.freeze({
    ...ELEMENT_COLORS,
    C: 0x94a3b8
});

// Dragging and snapping are intentionally screen-plane friendly. The target
// may rotate toward or away from the camera without making the player chase
// its Z depth.
const DRAG_PICK_RADIUS_PX = 34;
const SNAP_AXIS_TOLERANCE = 1.25;
const ROTATION_RADIANS_PER_SECOND = 0.36;
const DIPOLE_ROTATION_RADIANS_PER_SECOND = 0.42;
const WATER_PROBE_DROP_RADIUS = 3.0;
const WATER_PROBE_GLIDE_MS = 720;

const MoleculeBuilderView = {
    initialized: false,
    active: false,
    container: null,
    canvas: null,
    scene: null,
    camera: null,
    renderer: null,
    moleculeGroup: null,
    analysisGroup: null,
    atomMeshes: [],
    waterProbeGroup: null,
    waterProbeHitMeshes: [],
    waterProbeHome: new THREE.Vector3(-3.15, -2.35, 0.35),
    waterProbeDragging: false,
    waterProbeGlide: null,
    waterInteractionReady: false,
    draggables: [],
    targetPoints: [],
    selected: null,
    raycaster: new THREE.Raycaster(),
    pointer: new THREE.Vector2(),
    dragPlane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    waterProbeDragPlane:
        new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.35),
    animationFrameId: null,
    lastAnimationTimeMs: null,
    analysisMode: null,
    dipoleRotationActive: false,
    dipoleMeasurementFlashActive: false,
    resizeObserver: null,
    currentDefinition: null,
    placedSlots: new Set(),
    onPlacementRequest: null,
    onAssemblyComplete: null,
    onWaterProbePlaced: null,
    onFeedback: null,

    initialize({
        container,
        canvas,
        onPlacementRequest,
        onAssemblyComplete,
        onWaterProbePlaced,
        onFeedback
    }) {
        if (this.initialized) {
            this.container = container ?? this.container;
            this.canvas = canvas ?? this.canvas;
            this.onPlacementRequest = onPlacementRequest ?? this.onPlacementRequest;
            this.onAssemblyComplete = onAssemblyComplete ?? this.onAssemblyComplete;
            this.onWaterProbePlaced =
                onWaterProbePlaced ?? this.onWaterProbePlaced;
            this.onFeedback = onFeedback ?? this.onFeedback;
            return true;
        }

        if (!container || !canvas) {
            console.warn("[MoleculeBuilderView] Container or canvas missing.");
            return false;
        }

        this.container = container;
        this.canvas = canvas;
        this.onPlacementRequest = onPlacementRequest;
        this.onAssemblyComplete = onAssemblyComplete;
        this.onWaterProbePlaced = onWaterProbePlaced;
        this.onFeedback = onFeedback;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x020407);

        const { width, height } = this.getSize();
        this.camera = new THREE.PerspectiveCamera(
            48,
            width / height,
            0.1,
            100
        );
        this.camera.position.set(0, 0, 10);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setPixelRatio(
            Math.min(window.devicePixelRatio || 1, 2)
        );
        this.renderer.setSize(width, height, false);

        this.scene.add(new THREE.AmbientLight(0xffffff, 1.6));
        const keyLight = new THREE.DirectionalLight(0xffffff, 3.8);
        keyLight.position.set(4, 6, 8);
        this.scene.add(keyLight);

        const rimLight = new THREE.PointLight(0x00d8ff, 24, 30);
        rimLight.position.set(-5, -2, 5);
        this.scene.add(rimLight);

        this.canvas.addEventListener("pointerdown", this.handlePointerDown);
        this.canvas.addEventListener("pointermove", this.handlePointerMove);
        this.canvas.addEventListener("pointerup", this.handlePointerUp);
        this.canvas.addEventListener("pointercancel", this.handlePointerUp);

        this.resizeObserver = new ResizeObserver(() => this.handleResize());
        this.resizeObserver.observe(this.container);

        this.initialized = true;
        this.handleResize();
        return true;
    },

    getSize() {
        return {
            width: Math.max(320, this.container?.clientWidth || 800),
            height: Math.max(320, this.container?.clientHeight || 520)
        };
    },

    handleResize() {
        if (!this.renderer || !this.camera) return;
        const { width, height } = this.getSize();
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
    },

    activate() {
        if (!this.initialized) return false;
        this.active = true;
        this.lastAnimationTimeMs = null;
        this.handleResize();
        this.startAnimation();
        return true;
    },

    deactivate() {
        this.active = false;
        this.stopAnimation();
        this.selected = null;
        return true;
    },

    startAnimation() {
        if (this.animationFrameId || !this.renderer) return;

        // The first animation callback must come from requestAnimationFrame so
        // it always receives a valid high-resolution timestamp. Calling the
        // callback directly would make the second frame subtract `undefined`,
        // turning the molecule's rotation into NaN and removing it from view.
        this.lastAnimationTimeMs = null;

        const animate = timeMs => {
            if (!this.active) {
                this.lastAnimationTimeMs = Number.isFinite(timeMs)
                    ? timeMs
                    : null;
                this.animationFrameId = requestAnimationFrame(animate);
                return;
            }

            const hasValidFrameTimes =
                Number.isFinite(timeMs) &&
                Number.isFinite(this.lastAnimationTimeMs);
            const deltaSeconds = hasValidFrameTimes
                ? Math.min(
                    0.05,
                    Math.max(
                        0,
                        (timeMs - this.lastAnimationTimeMs) / 1000
                    )
                )
                : 0;
            this.lastAnimationTimeMs = Number.isFinite(timeMs)
                ? timeMs
                : null;

            // Recover safely if a stale page session or earlier animation-loop
            // bug ever left a non-finite transform on the live group.
            if (this.moleculeGroup) {
                if (!Number.isFinite(this.moleculeGroup.rotation.y)) {
                    this.moleculeGroup.rotation.y = 0;
                }
                if (!Number.isFinite(this.moleculeGroup.rotation.z)) {
                    this.moleculeGroup.rotation.z = 0;
                }
            }

            if (
                this.moleculeGroup &&
                this.analysisMode === "dipole" &&
                this.dipoleRotationActive
            ) {
                this.moleculeGroup.rotation.z -=
                    DIPOLE_ROTATION_RADIANS_PER_SECOND * deltaSeconds;
            } else if (this.moleculeGroup && !this.analysisMode) {
                this.moleculeGroup.rotation.y +=
                    ROTATION_RADIANS_PER_SECOND * deltaSeconds;
            }

            if (this.waterProbeGlide) {
                this.updateWaterProbeGlide(timeMs);
            }

            if (this.analysisGroup) {
                const flashOpacity = this.dipoleMeasurementFlashActive
                    ? 0.58 + 0.32 * Math.abs(Math.sin(timeMs * 0.018))
                    : 0.78;
                this.analysisGroup.traverse(child => {
                    if (child.userData?.dipolePlate && child.material) {
                        child.material.opacity = flashOpacity;
                    }
                });
            }

            this.renderer.render(this.scene, this.camera);
            this.animationFrameId = requestAnimationFrame(animate);
        };

        this.animationFrameId = requestAnimationFrame(animate);
    },

    stopAnimation() {
        if (!this.animationFrameId) return;
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
        this.lastAnimationTimeMs = null;
    },

    clearScene() {
        this.endAnalysis();

        if (this.moleculeGroup) {
            this.disposeObject(this.moleculeGroup);
            this.scene.remove(this.moleculeGroup);
        }

        this.draggables.forEach(mesh => {
            this.disposeObject(mesh);
            this.scene.remove(mesh);
        });

        this.moleculeGroup = null;
        this.atomMeshes = [];
        this.draggables = [];
        this.targetPoints = [];
        this.selected = null;
        this.placedSlots = new Set();
    },

    normalizeAtoms(atoms) {
        if (!atoms.length) return [];

        const center = atoms.reduce(
            (sum, atom) => sum.add(
                new THREE.Vector3(...atom.position)
            ),
            new THREE.Vector3()
        ).multiplyScalar(1 / atoms.length);

        const centered = atoms.map(atom => ({
            ...atom,
            vector: new THREE.Vector3(...atom.position).sub(center)
        }));

        const maxRadius = Math.max(
            1,
            ...centered.map(atom => atom.vector.length())
        );
        const scale = Math.min(1.45, 2.4 / maxRadius);

        centered.forEach(atom => atom.vector.multiplyScalar(scale));
        return centered;
    },

    loadAssembly(definition, restoredSlots = []) {
        if (!this.initialized || !definition?.atoms?.length) return false;

        const preservedRotationY =
            this.moleculeGroup &&
            this.currentDefinition?.id === definition.id &&
            Number.isFinite(this.moleculeGroup.rotation.y)
                ? this.moleculeGroup.rotation.y
                : 0;

        this.clearScene();
        this.currentDefinition = definition;
        this.placedSlots = new Set(restoredSlots);
        this.moleculeGroup = new THREE.Group();
        this.moleculeGroup.rotation.y = preservedRotationY;
        this.scene.add(this.moleculeGroup);

        const atoms = this.normalizeAtoms(definition.atoms);

        atoms.forEach((atom, slotIndex) => {
            const ghost = this.createGhostAtom(atom.type);
            ghost.position.copy(atom.vector);
            ghost.userData.slotIndex = slotIndex;
            this.moleculeGroup.add(ghost);

            const placed = this.placedSlots.has(slotIndex);
            this.targetPoints.push({
                mesh: ghost,
                type: atom.type,
                slotIndex,
                assembled: placed
            });

            if (placed) {
                ghost.visible = false;
                const solid = this.createSolidAtom(atom.type);
                solid.position.copy(atom.vector);
                solid.userData.slotIndex = slotIndex;
                this.moleculeGroup.add(solid);
            }
        });

        definition.bonds.forEach(bond => {
            const start = atoms[bond.a]?.vector;
            const end = atoms[bond.b]?.vector;
            if (start && end) {
                this.moleculeGroup.add(
                    this.createBond(start, end, true, bond.order)
                );
            }
        });

        const remaining = atoms.filter(
            (_, slotIndex) => !this.placedSlots.has(slotIndex)
        );
        const spacing = 1.15;
        const rowWidth = Math.max(0, remaining.length - 1) * spacing;

        remaining.forEach((atom, index) => {
            const sphere = this.createSolidAtom(atom.type);
            const home = new THREE.Vector3(
                index * spacing - rowWidth / 2,
                -3.15,
                0
            );
            sphere.position.copy(home);
            sphere.userData = {
                type: atom.type,
                home,
                slotIndex: atoms.indexOf(atom)
            };
            this.scene.add(sphere);
            this.draggables.push(sphere);
        });

        this.fitCamera(atoms);
        this.onFeedback?.(
            remaining.length
                ? "Drag each atom onto its matching ghost frame."
                : "Assembly complete. Begin timed synthesis."
        );
        return true;
    },

    showCompleted(definition) {
        if (!this.initialized || !definition?.atoms?.length) return false;

        const preservedRotationY =
            this.moleculeGroup &&
            this.currentDefinition?.id === definition.id &&
            Number.isFinite(this.moleculeGroup.rotation.y)
                ? this.moleculeGroup.rotation.y
                : 0;

        this.clearScene();
        this.currentDefinition = definition;
        this.moleculeGroup = new THREE.Group();
        this.moleculeGroup.rotation.y = preservedRotationY;
        this.scene.add(this.moleculeGroup);

        const atoms = this.normalizeAtoms(definition.atoms);
        this.atomMeshes = [];
        atoms.forEach((atom, atomIndex) => {
            const solid = this.createSolidAtom(atom.type, 0.42);
            solid.position.copy(atom.vector);
            solid.userData.atomIndex = atomIndex;
            this.moleculeGroup.add(solid);
            this.atomMeshes[atomIndex] = solid;
        });
        definition.bonds.forEach(bond => {
            const start = atoms[bond.a]?.vector;
            const end = atoms[bond.b]?.vector;
            if (start && end) {
                this.moleculeGroup.add(
                    this.createBond(start, end, false, bond.order)
                );
            }
        });
        this.fitCamera(atoms);
        return true;
    },

    fitCamera(atoms) {
        const maxRadius = Math.max(
            1,
            ...atoms.map(atom => atom.vector.length())
        );
        this.camera.position.set(0, 0, Math.max(8, maxRadius * 3.2));
        this.camera.lookAt(0, -0.25, 0);
    },

    createGhostAtom(symbol) {
        // MeshBasicMaterial in wireframe mode is more consistently rendered
        // than transparent LineSegments on Chromium/WebGL combinations. The
        // ghost remains visually distinct because it has no filled surface.
        const geometry = new THREE.SphereGeometry(0.42, 18, 18);
        const material = new THREE.MeshBasicMaterial({
            color:
                GHOST_ELEMENT_COLORS[symbol] ??
                GHOST_ELEMENT_COLORS.DEFAULT,
            wireframe: true,
            transparent: false,
            depthTest: false,
            depthWrite: false,
            toneMapped: false
        });
        const ghost = new THREE.Mesh(geometry, material);
        ghost.renderOrder = 10;
        ghost.userData.isGhostTarget = true;
        return ghost;
    },

    createSolidAtom(symbol, radius = 0.38) {
        const geometry = new THREE.SphereGeometry(radius, 28, 28);
        const material = new THREE.MeshPhongMaterial({
            color: ELEMENT_COLORS[symbol] ?? ELEMENT_COLORS.DEFAULT,
            shininess: 90,
            specular: 0xffffff
        });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.userData.type = symbol;
        return sphere;
    },

    createBond(start, end, ghost = false, order = 1) {
        const direction = new THREE.Vector3().subVectors(end, start);
        const geometry = new THREE.CylinderGeometry(
            ghost ? 0.035 : 0.075,
            ghost ? 0.035 : 0.075,
            direction.length(),
            10
        );
        const material = ghost
            ? new THREE.MeshBasicMaterial({
                color: 0x7dd3fc,
                wireframe: true,
                transparent: false,
                depthTest: false,
                depthWrite: false,
                toneMapped: false
            })
            : new THREE.MeshPhongMaterial({
                color: 0x94a3b8,
                transparent: false,
                opacity: 0.9
            });
        const mesh = new THREE.Mesh(geometry, material);
        if (ghost) {
            mesh.renderOrder = 9;
            mesh.userData.isGhostBond = true;
        }
        mesh.position.copy(
            new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
        );
        mesh.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction.clone().normalize()
        );
        mesh.userData.bondOrder = order ?? 1;
        return mesh;
    },

    createTextSprite(text, color, scale = 0.54) {
        const canvas = document.createElement("canvas");
        canvas.width = 192;
        canvas.height = 192;
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = color;
        context.font = "700 96px Oxanium, Arial, sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false,
            depthWrite: false
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(scale, scale, 1);
        sprite.renderOrder = 20;
        return sprite;
    },

    createDipolePlateAssembly() {
        const group = new THREE.Group();
        const plateGeometry = new THREE.BoxGeometry(0.5, 5.35, 0.18);
        const plateDefinitions = [
            { x: -3.55, sign: "−", color: 0x38bdf8 },
            { x: 3.55, sign: "+", color: 0xfb7185 }
        ];

        plateDefinitions.forEach(({ x, sign, color }) => {
            const material = new THREE.MeshPhongMaterial({
                color,
                transparent: true,
                opacity: 0.78,
                emissive: color,
                emissiveIntensity: 0.22
            });
            const plate = new THREE.Mesh(plateGeometry.clone(), material);
            plate.position.set(x, 0, -0.45);
            plate.userData.dipolePlate = true;
            group.add(plate);

            [-2, -1.2, -0.4, 0.4, 1.2, 2].forEach(y => {
                const charge = this.createTextSprite(
                    sign,
                    sign === "−" ? "#e0f2fe" : "#ffe4e6",
                    0.42
                );
                charge.position.set(x, y, 0.05);
                charge.visible = false;
                charge.userData.dipolePlateCharge = true;
                group.add(charge);
            });
        });

        plateGeometry.dispose();
        return group;
    },

    startDipoleMeasurement(definition) {
        if (
            !this.initialized ||
            !this.moleculeGroup ||
            this.currentDefinition?.id !== definition?.id ||
            !definition?.dipoleModel
        ) {
            return false;
        }

        this.endDipoleMeasurement();
        this.analysisMode = "dipole";
        this.dipoleRotationActive = false;
        this.dipoleMeasurementFlashActive = false;

        // Begin from a readable calibration plane. Rotation during the
        // activity occurs around Z so the dipole direction crosses the
        // left/right plate axis visibly.
        this.moleculeGroup.rotation.set(0, 0, 0);
        this.analysisGroup = this.createDipolePlateAssembly();
        this.scene.add(this.analysisGroup);
        this.camera.position.z = Math.max(this.camera.position.z, 9.5);
        return true;
    },

    setDipolePlateChargesVisible(visible = true) {
        if (this.analysisMode !== "dipole" || !this.analysisGroup) return false;
        this.analysisGroup.traverse(child => {
            if (child.userData?.dipolePlateCharge) {
                child.visible = Boolean(visible);
            }
        });
        return true;
    },

    showDipolePartialCharges() {
        const model = this.currentDefinition?.dipoleModel;
        if (this.analysisMode !== "dipole" || !model || !this.moleculeGroup) {
            return false;
        }

        this.moleculeGroup.children
            .filter(child => child.userData?.dipolePartialCharge)
            .forEach(child => {
                this.moleculeGroup.remove(child);
                this.disposeObject(child);
            });

        const addLabels = (indexes, text, color) => {
            indexes.forEach(atomIndex => {
                const atom = this.atomMeshes[atomIndex];
                if (!atom) return;
                const label = this.createTextSprite(text, color, 0.58);
                label.position.copy(atom.position);
                label.position.y += 0.58;
                label.position.z += 0.28;
                label.userData.dipolePartialCharge = true;
                label.userData.atomIndex = atomIndex;
                this.moleculeGroup.add(label);
            });
        };

        addLabels(model.negativeAtomIndexes, "δ−", "#7dd3fc");
        addLabels(model.positiveAtomIndexes, "δ+", "#fda4af");
        return true;
    },

    rotateDipoleSlowly() {
        if (this.analysisMode !== "dipole") return false;
        this.dipoleRotationActive = true;
        return true;
    },

    averageAtomWorldPosition(indexes) {
        if (!indexes?.length) return null;
        const total = new THREE.Vector3();
        const worldPosition = new THREE.Vector3();
        let count = 0;

        indexes.forEach(atomIndex => {
            const atom = this.atomMeshes[atomIndex];
            if (!atom) return;
            atom.getWorldPosition(worldPosition);
            total.add(worldPosition);
            count += 1;
        });

        return count ? total.multiplyScalar(1 / count) : null;
    },

    getDipoleOrientationStatus() {
        const model = this.currentDefinition?.dipoleModel;
        if (!model) {
            return { required: false, aligned: false, deltaX: 0 };
        }

        if (!model.orientationRequired) {
            return { required: false, aligned: true, deltaX: 0 };
        }

        const negativeCenter = this.averageAtomWorldPosition(
            model.negativeAtomIndexes
        );
        const positiveCenter = this.averageAtomWorldPosition(
            model.positiveAtomIndexes
        );
        if (!negativeCenter || !positiveCenter) {
            return { required: true, aligned: false, deltaX: 0 };
        }

        // The negative plate is on the left. Alignment is correct when the
        // molecule's partial-positive center is left of its negative center.
        const deltaX = negativeCenter.x - positiveCenter.x;
        return {
            required: true,
            aligned: deltaX >= 0.18,
            deltaX
        };
    },

    pauseDipoleRotation() {
        if (this.analysisMode !== "dipole") return null;
        this.dipoleRotationActive = false;
        return this.getDipoleOrientationStatus();
    },

    setDipoleMeasurementFlash(active) {
        this.dipoleMeasurementFlashActive = Boolean(active);
        return true;
    },

    endDipoleMeasurement() {
        return this.endAnalysis();
    },

    createWaterProbe() {
        const group = new THREE.Group();
        const oxygenPosition = new THREE.Vector3(0, 0, 0);
        const donorHydrogenPosition = new THREE.Vector3(0.58, 0.28, 0);
        const secondHydrogenPosition = new THREE.Vector3(-0.35, 0.55, 0);

        const oxygen = this.createSolidAtom("O", 0.4);
        oxygen.position.copy(oxygenPosition);
        oxygen.userData.waterProbeAtom = true;
        group.add(oxygen);

        [donorHydrogenPosition, secondHydrogenPosition].forEach(
            (position, index) => {
                const hydrogen = this.createSolidAtom("H", 0.27);
                hydrogen.position.copy(position);
                hydrogen.userData.waterProbeAtom = true;
                hydrogen.userData.waterProbeHydrogenDonor = index === 0;
                group.add(hydrogen);
            }
        );

        group.add(this.createBond(
            oxygenPosition,
            donorHydrogenPosition,
            false,
            1
        ));
        group.add(this.createBond(
            oxygenPosition,
            secondHydrogenPosition,
            false,
            1
        ));

        const hitTarget = new THREE.Mesh(
            new THREE.SphereGeometry(0.92, 16, 16),
            new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0.001,
                depthWrite: false
            })
        );
        hitTarget.userData.waterProbeHitTarget = true;
        group.add(hitTarget);

        group.position.copy(this.waterProbeHome);
        group.userData.waterProbe = true;
        return group;
    },

    startWaterInteraction(definition) {
        if (
            !this.initialized ||
            !this.moleculeGroup ||
            this.currentDefinition?.id !== definition?.id ||
            !definition?.waterInteractionModel
        ) {
            return false;
        }

        this.endAnalysis();
        this.analysisMode = "water-interaction";
        this.waterProbeDragging = false;
        this.waterProbeGlide = null;
        this.waterInteractionReady = false;

        // The molecule remains fixed throughout this investigation.
        this.moleculeGroup.rotation.set(0, 0, 0);
        this.analysisGroup = new THREE.Group();
        this.scene.add(this.analysisGroup);

        this.waterProbeGroup = this.createWaterProbe();
        this.waterProbeHitMeshes = [];
        this.waterProbeGroup.traverse(child => {
            if (child.isMesh) this.waterProbeHitMeshes.push(child);
        });
        this.scene.add(this.waterProbeGroup);
        this.camera.position.z = Math.max(this.camera.position.z, 9.5);
        return true;
    },

    getWaterInteractionTargetWorldPosition() {
        const model = this.currentDefinition?.waterInteractionModel;
        const atom = this.atomMeshes[model?.targetAtomIndex];
        if (!atom) return new THREE.Vector3(0, 0, 0);

        const position = new THREE.Vector3();
        atom.getWorldPosition(position);
        return position;
    },

    findWaterProbeAtPointer(event) {
        if (!this.waterProbeGroup) return false;
        this.updatePointer(event);
        this.raycaster.setFromCamera(this.pointer, this.camera);
        if (this.raycaster.intersectObjects(this.waterProbeHitMeshes, false)[0]) {
            return true;
        }

        const rect = this.canvas.getBoundingClientRect();
        const projected = new THREE.Vector3();
        this.waterProbeGroup.getWorldPosition(projected);
        projected.project(this.camera);
        const screenX = rect.left + (projected.x + 1) * rect.width / 2;
        const screenY = rect.top + (1 - projected.y) * rect.height / 2;
        return Math.hypot(
            event.clientX - screenX,
            event.clientY - screenY
        ) <= 68;
    },

    isWaterProbeNearMolecule() {
        if (!this.waterProbeGroup) return false;
        const target = this.getWaterInteractionTargetWorldPosition();
        return Math.hypot(
            this.waterProbeGroup.position.x - target.x,
            this.waterProbeGroup.position.y - target.y
        ) <= WATER_PROBE_DROP_RADIUS;
    },

    getWaterProbeDestination() {
        const model = this.currentDefinition?.waterInteractionModel;
        const target = this.getWaterInteractionTargetWorldPosition();
        const outward = target.clone();
        outward.z = 0;
        if (outward.lengthSq() < 0.08) outward.set(-1, 0.15, 0);
        outward.normalize();

        const distance = model?.interactionType === "hydrogen-bond"
            ? 1.22
            : model?.interactionType === "dipole-dipole"
                ? 1.62
                : 2.35;
        const destination = target.clone().add(
            outward.clone().multiplyScalar(distance)
        );
        destination.z = 0.35;

        const directionToTarget = outward.multiplyScalar(-1);
        const donorHydrogenAngle = Math.atan2(0.28, 0.58);
        const rotationZ = Math.atan2(
            directionToTarget.y,
            directionToTarget.x
        ) - donorHydrogenAngle;

        return { destination, rotationZ };
    },

    glideWaterProbeToInteraction() {
        if (
            this.analysisMode !== "water-interaction" ||
            !this.waterProbeGroup ||
            this.waterProbeGlide
        ) {
            return false;
        }

        const { destination, rotationZ } = this.getWaterProbeDestination();
        this.waterProbeGlide = {
            startedAtMs: performance.now(),
            durationMs: WATER_PROBE_GLIDE_MS,
            startPosition: this.waterProbeGroup.position.clone(),
            endPosition: destination,
            startRotationZ: this.waterProbeGroup.rotation.z,
            endRotationZ: rotationZ
        };
        this.onFeedback?.("Water is approaching the fixed molecule.");
        return true;
    },

    updateWaterProbeGlide(timeMs) {
        const glide = this.waterProbeGlide;
        if (!glide || !this.waterProbeGroup) return;

        const progress = Math.min(
            1,
            Math.max(0, (timeMs - glide.startedAtMs) / glide.durationMs)
        );
        const eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        this.waterProbeGroup.position.lerpVectors(
            glide.startPosition,
            glide.endPosition,
            eased
        );
        this.waterProbeGroup.rotation.z = THREE.MathUtils.lerp(
            glide.startRotationZ,
            glide.endRotationZ,
            eased
        );

        if (progress < 1) return;
        this.waterProbeGlide = null;
        this.waterInteractionReady = true;
        this.createWaterInteractionVisualization();

        const model = this.currentDefinition?.waterInteractionModel;
        this.onWaterProbePlaced?.({
            interactionType: model?.interactionType,
            interactionLabel: model?.interactionLabel
        });
    },

    createWaterInteractionVisualization() {
        const model = this.currentDefinition?.waterInteractionModel;
        if (!model || !this.analysisGroup || !this.waterProbeGroup) return false;

        [...this.analysisGroup.children].forEach(child => {
            this.analysisGroup.remove(child);
            this.disposeObject(child);
        });

        if (model.interactionType !== "hydrogen-bond") return true;

        const donorHydrogen = this.waterProbeGroup.children.find(
            child => child.userData?.waterProbeHydrogenDonor
        );
        if (!donorHydrogen) return false;

        const hydrogenPosition = new THREE.Vector3();
        donorHydrogen.getWorldPosition(hydrogenPosition);
        const targetPosition = this.getWaterInteractionTargetWorldPosition();
        const geometry = new THREE.BufferGeometry().setFromPoints([
            hydrogenPosition,
            targetPosition
        ]);
        const material = new THREE.LineDashedMaterial({
            color: 0x7dd3fc,
            dashSize: 0.11,
            gapSize: 0.09,
            transparent: true,
            opacity: 0.95
        });
        const dottedLine = new THREE.Line(geometry, material);
        dottedLine.computeLineDistances();
        dottedLine.userData.waterHydrogenBond = true;
        this.analysisGroup.add(dottedLine);
        return true;
    },

    endWaterInteraction() {
        return this.endAnalysis();
    },

    endAnalysis() {
        this.dipoleRotationActive = false;
        this.dipoleMeasurementFlashActive = false;
        this.waterProbeDragging = false;
        this.waterProbeGlide = null;
        this.waterInteractionReady = false;
        this.analysisMode = null;

        if (this.moleculeGroup) {
            this.moleculeGroup.children
                .filter(child => child.userData?.dipolePartialCharge)
                .forEach(child => {
                    this.moleculeGroup.remove(child);
                    this.disposeObject(child);
                });
        }

        if (this.analysisGroup) {
            this.disposeObject(this.analysisGroup);
            this.scene?.remove(this.analysisGroup);
            this.analysisGroup = null;
        }

        if (this.waterProbeGroup) {
            this.disposeObject(this.waterProbeGroup);
            this.scene?.remove(this.waterProbeGroup);
            this.waterProbeGroup = null;
        }
        this.waterProbeHitMeshes = [];
        return true;
    },

    updatePointer(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    },

    findDraggableAtPointer(event) {
        this.updatePointer(event);
        this.raycaster.setFromCamera(this.pointer, this.camera);

        const rayHit = this.raycaster.intersectObjects(
            this.draggables,
            false
        )[0]?.object;
        if (rayHit) return rayHit;

        // The visible atoms are intentionally small. Use a larger CSS-pixel
        // selection radius so students do not need pixel-perfect pointer aim.
        const rect = this.canvas.getBoundingClientRect();
        const projected = new THREE.Vector3();
        let closest = null;
        let closestDistancePx = DRAG_PICK_RADIUS_PX;

        this.draggables.forEach(mesh => {
            mesh.getWorldPosition(projected);
            projected.project(this.camera);

            const screenX = rect.left + (projected.x + 1) * rect.width / 2;
            const screenY = rect.top + (1 - projected.y) * rect.height / 2;
            const distancePx = Math.hypot(
                event.clientX - screenX,
                event.clientY - screenY
            );

            if (distancePx <= closestDistancePx) {
                closestDistancePx = distancePx;
                closest = mesh;
            }
        });

        return closest;
    },

    handlePointerDown(event) {
        const view = MoleculeBuilderView;
        if (!view.active || !view.renderer) return;
        if (event.pointerType === "mouse" && event.button !== 0) return;

        if (
            view.analysisMode === "water-interaction" &&
            !view.waterInteractionReady &&
            !view.waterProbeGlide &&
            view.findWaterProbeAtPointer(event)
        ) {
            view.waterProbeDragging = true;
            view.canvas.setPointerCapture?.(event.pointerId);
            view.canvas.classList.add("is-dragging");
            event.preventDefault();
            return;
        }

        const draggable = view.findDraggableAtPointer(event);
        if (!draggable) return;

        view.selected = draggable;
        view.canvas.setPointerCapture?.(event.pointerId);
        view.canvas.classList.add("is-dragging");
        event.preventDefault();
    },

    handlePointerMove(event) {
        const view = MoleculeBuilderView;
        if (view.waterProbeDragging && view.waterProbeGroup) {
            view.updatePointer(event);
            view.raycaster.setFromCamera(view.pointer, view.camera);
            const worldPosition = new THREE.Vector3();
            if (
                view.raycaster.ray.intersectPlane(
                    view.waterProbeDragPlane,
                    worldPosition
                )
            ) {
                view.waterProbeGroup.position.set(
                    THREE.MathUtils.clamp(worldPosition.x, -4.5, 4.5),
                    THREE.MathUtils.clamp(worldPosition.y, -3.1, 3.1),
                    0.35
                );
            }
            event.preventDefault();
            return;
        }

        if (!view.selected) return;
        view.updatePointer(event);
        view.raycaster.setFromCamera(view.pointer, view.camera);
        const worldPosition = new THREE.Vector3();
        if (view.raycaster.ray.intersectPlane(view.dragPlane, worldPosition)) {
            view.selected.position.copy(worldPosition);
        }
        event.preventDefault();
    },

    handlePointerUp(event) {
        const view = MoleculeBuilderView;
        if (view.waterProbeDragging) {
            view.waterProbeDragging = false;
            view.canvas.releasePointerCapture?.(event.pointerId);
            view.canvas.classList.remove("is-dragging");

            if (view.isWaterProbeNearMolecule()) {
                view.glideWaterProbeToInteraction();
            } else if (view.waterProbeGroup) {
                view.waterProbeGroup.position.copy(view.waterProbeHome);
                view.waterProbeGroup.rotation.set(0, 0, 0);
                view.onFeedback?.(
                    "Move the water molecule closer to the fixed molecule."
                );
            }
            event.preventDefault();
            return;
        }

        if (!view.selected) return;

        const selected = view.selected;
        let bestTarget = null;
        let bestDistance = Infinity;
        const targetPosition = new THREE.Vector3();

        view.targetPoints.forEach(target => {
            if (target.assembled || target.type !== selected.userData.type) return;
            target.mesh.getWorldPosition(targetPosition);
            const deltaX = Math.abs(
                selected.position.x - targetPosition.x
            );
            const deltaY = Math.abs(
                selected.position.y - targetPosition.y
            );

            // Each screen-plane axis gets its own generous tolerance. Z is
            // deliberately excluded from both eligibility and ranking.
            if (
                deltaX <= SNAP_AXIS_TOLERANCE &&
                deltaY <= SNAP_AXIS_TOLERANCE
            ) {
                const distance = Math.hypot(deltaX, deltaY);
                if (distance >= bestDistance) return;
                bestDistance = distance;
                bestTarget = target;
            }
        });

        if (bestTarget) {
            const result = view.onPlacementRequest?.(
                view.currentDefinition.id,
                bestTarget.slotIndex
            );

            if (result?.success) {
                view.moleculeGroup.attach(selected);
                selected.position.copy(bestTarget.mesh.position);
                selected.userData.slotIndex = bestTarget.slotIndex;
                bestTarget.assembled = true;
                bestTarget.mesh.visible = false;
                view.placedSlots.add(bestTarget.slotIndex);
                view.draggables = view.draggables.filter(
                    candidate => candidate !== selected
                );
                view.flashPlacedAtom(selected);

                if (result.complete) {
                    view.onFeedback?.(
                        "Assembly complete. Begin timed synthesis."
                    );
                    view.onAssemblyComplete?.(
                        view.currentDefinition.id
                    );
                } else {
                    view.onFeedback?.(
                        "Atom snapped into place. Continue assembly."
                    );
                }
            } else {
                selected.position.copy(selected.userData.home);
                view.onFeedback?.(
                    result?.message ?? "That atom cannot be placed yet."
                );
            }
        } else {
            selected.position.copy(selected.userData.home);
            view.onFeedback?.(
                "Match the atom to a nearby ghost of the same element."
            );
        }

        view.selected = null;
        view.canvas.releasePointerCapture?.(event.pointerId);
        view.canvas.classList.remove("is-dragging");
    },

    flashPlacedAtom(mesh) {
        const originalScale = mesh.scale.clone();
        mesh.scale.multiplyScalar(1.35);
        setTimeout(() => {
            if (mesh?.scale) mesh.scale.copy(originalScale);
        }, 180);
    },

    rotate(deltaRadians) {
        if (!this.moleculeGroup) return false;
        const currentRotationY = Number.isFinite(this.moleculeGroup.rotation.y)
            ? this.moleculeGroup.rotation.y
            : 0;
        const safeDelta = Number.isFinite(deltaRadians) ? deltaRadians : 0;
        this.moleculeGroup.rotation.y = currentRotationY + safeDelta;
        return true;
    },

    zoom(delta) {
        if (!this.camera) return false;
        this.camera.position.z = THREE.MathUtils.clamp(
            this.camera.position.z + delta,
            4,
            20
        );
        return true;
    },

    disposeObject(object) {
        object.traverse?.(child => {
            child.geometry?.dispose?.();
            if (Array.isArray(child.material)) {
                child.material.forEach(material => {
                    material.map?.dispose?.();
                    material.dispose?.();
                });
            } else {
                child.material?.map?.dispose?.();
                child.material?.dispose?.();
            }
        });
    },

    destroy() {
        this.deactivate();
        this.clearScene();
        this.canvas?.removeEventListener("pointerdown", this.handlePointerDown);
        this.canvas?.removeEventListener("pointermove", this.handlePointerMove);
        this.canvas?.removeEventListener("pointerup", this.handlePointerUp);
        this.canvas?.removeEventListener("pointercancel", this.handlePointerUp);
        this.resizeObserver?.disconnect();
        this.renderer?.dispose();

        this.container = null;
        this.canvas = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.currentDefinition = null;
        this.onWaterProbePlaced = null;
        this.initialized = false;
    }
};

export default MoleculeBuilderView;
