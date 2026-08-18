// --------------------------------------------------
// ZoneManager.js
// Owns global-zone registration and lifecycle transitions
// --------------------------------------------------

import Pond from "./Pond.js";
import QuantumZone from "./QuantumZone.js";
import TestZone from "./TestZone.js";
import AtomLab from "./AtomLab.js";
import Atomizer from "./Atomizer.js";
import GameStateManager
    from "./GameStateManager.js";
import GameStateObserver
    from "./GameStateObserver.js";
import ZoneCatalog from "./ZoneCatalog.js";


const ZONE_REGISTRY = new Map([
    [
        "pond",
        {
            module: Pond,
            rootId: "pond-zone",
            persistCurrentZone: true
        }
    ],
    [
        "quantum",
        {
            module: QuantumZone,
            rootId: "quantum-zone",
            persistCurrentZone: true
        }
    ],
    [
        "atomLab",
        {
            module: AtomLab,        // your AtomLab.js controller
            rootId: "atomlab-zone", // the DOM root
            persistCurrentZone: true
        }
    ],
    [
        "atomizer",
        {
            module: Atomizer,
            rootId: "atomizer-zone",
            persistCurrentZone: true
        }
    ],
    [
        "test",
        {
            module: TestZone,
            rootId: "test-zone",
            persistCurrentZone: false
        }
    ]
]);

const ZoneManager = {

    currentZone: null,
    currentZoneId: null,

    initialize() {

        console.log(
            "ZoneManager initialized"
        );

        return true;

    },

    isRegistered(zoneId) {

        return ZONE_REGISTRY.has(
            zoneId
        );

    },

    getCurrentZoneId() {

        return this.currentZoneId;

    },

    getRegisteredZoneIds() {

        return Array.from(
            ZONE_REGISTRY.keys()
        );

    },

    resolveEntry(zoneId) {

        return ZONE_REGISTRY.get(zoneId) ??
            null;

    },

    createFailure(
        zoneId,
        reason,
        message
    ) {

        console.warn(
            `ZoneManager: ${message}`
        );

        return {
            entered: false,
            zoneId,
            reason,
            message
        };

    },

    validateEntry(zoneId) {

        const entry =
            this.resolveEntry(zoneId);

        if (!entry) {

            if (ZoneCatalog.has(zoneId)) {
                return this.createFailure(
                    zoneId,
                    "not-implemented",
                    `zone "${zoneId}" is not implemented yet`
                );
            }

            return this.createFailure(
                zoneId,
                "unknown-zone",
                `unknown zone "${zoneId}"`
            );
        }

        if (
            entry.persistCurrentZone &&
            !GameStateManager
                .isZoneAccessible(zoneId)
        ) {
            return this.createFailure(
                zoneId,
                "locked",
                `zone "${zoneId}" is locked`
            );
        }

        return {
            entered: true,
            zoneId,
            entry
        };

    },

    updateZoneVisibility(zoneId) {

        let activeRootFound = false;

        ZONE_REGISTRY.forEach(
            (entry, registeredZoneId) => {

                const element =
                    document.getElementById(
                        entry.rootId
                    );

                if (!element) {

                    if (
                        registeredZoneId ===
                        zoneId
                    ) {
                        console.warn(
                            `ZoneManager: active DOM root #${entry.rootId} for "${registeredZoneId}" was not found`
                        );
                    }

                    return;
                }

                if (
                    registeredZoneId ===
                    zoneId
                ) {
                    activeRootFound = true;
                }

                element.classList.toggle(
                    "hidden",
                    registeredZoneId !== zoneId
                );

            }
        );

        return activeRootFound;

    },

    enterZone(zoneId) {

        console.log(
            `ZoneManager: entering ${zoneId}`
        );

        // Resolve and authorize the destination before
        // deactivating the current zone.
        const validation =
            this.validateEntry(zoneId);

        if (!validation.entered) {
            return validation;
        }

        const nextEntry =
            validation.entry;

        const nextZone =
            nextEntry.module;

        if (
            this.currentZoneId === zoneId &&
            this.currentZone === nextZone
        ) {
            const activeRootFound =
                this.updateZoneVisibility(
                    zoneId
                );

            if (!activeRootFound) {
                return this.createFailure(
                    zoneId,
                    "missing-zone-root",
                    `DOM root for zone "${zoneId}" is missing`
                );
            }

            return {
                entered: true,
                zoneId,
                reason: "already-active",
                message:
                    `Zone "${zoneId}" is already active.`
            };
        }

        const previousZone =
            this.currentZone;

        const previousZoneId =
            this.currentZoneId;

        try {
            // Initialization must be safe and idempotent.
            // Preparing first lets a failed initialization
            // leave the current zone untouched.
            nextZone.initialize();
        } catch (error) {
            console.error(
                `ZoneManager: failed to initialize "${zoneId}"`,
                error
            );

            return {
                entered: false,
                zoneId,
                reason: "initialization-failed",
                message:
                    `Unable to initialize zone "${zoneId}".`
            };
        }

        try {
            previousZone?.deactivate();

            const activeRootFound =
                this.updateZoneVisibility(
                    zoneId
                );

            if (!activeRootFound) {
                throw new Error(
                    `DOM root for zone "${zoneId}" is missing`
                );
            }

            nextZone.activate();

            if (nextEntry.persistCurrentZone) {

                const recorded =
                    GameStateManager
                        .setCurrentZone(zoneId);

                if (!recorded) {
                    throw new Error(
                        `GameState rejected zone "${zoneId}"`
                    );
                }

            }

            this.currentZone = nextZone;
            this.currentZoneId = zoneId;

            GameStateObserver.notify(
                "active-zone-changed",
                {
                    zoneId,
                    previousZoneId
                }
            );

            console.log(
                `ZoneManager: ${zoneId} is now active`
            );

            return {
                entered: true,
                zoneId,
                reason: "entered",
                message:
                    `Zone "${zoneId}" is now active.`
            };

        } catch (error) {
            console.error(
                `ZoneManager: failed to activate "${zoneId}"`,
                error
            );

            try {
                nextZone.deactivate?.();

                if (
                    previousZone &&
                    previousZoneId
                ) {
                    this.updateZoneVisibility(
                        previousZoneId
                    );

                    previousZone.activate();
                }
            } catch (rollbackError) {
                console.error(
                    "ZoneManager: rollback failed",
                    rollbackError
                );
            }

            this.currentZone = previousZone;
            this.currentZoneId =
                previousZoneId;

            return {
                entered: false,
                zoneId,
                reason: "activation-failed",
                message:
                    `Unable to activate zone "${zoneId}".`
            };
        }

    },

    showView(level) {

        if (!this.currentZone) {
            console.warn(
                "ZoneManager: no active zone"
            );

            return false;
        }

        if (
            typeof this.currentZone.showView !==
            "function"
        ) {
            console.warn(
                "ZoneManager: current zone does not support internal views"
            );

            return false;
        }

        this.currentZone.showView(level);

        return true;

    }

};

export default ZoneManager;
