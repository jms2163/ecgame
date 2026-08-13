// --------------------------------------------------
// ZoneStatusResolver.js
// Derives navigation status from release metadata
// and persisted GameState; status text is never saved.
// --------------------------------------------------

import ZoneCatalog from "./ZoneCatalog.js";
import GameStateManager from "./GameStateManager.js";

const STATUS = Object.freeze({
    AVAILABLE: "available",
    LOCKED: "locked",
    COMPLETED: "completed",
    COMING_SOON: "coming-soon"
});

const STATUS_LABEL = Object.freeze({
    [STATUS.AVAILABLE]: "Available",
    [STATUS.LOCKED]: "Locked",
    [STATUS.COMPLETED]: "Completed",
    [STATUS.COMING_SOON]: "Coming Soon"
});

const ZoneStatusResolver = Object.freeze({

    STATUS,

    getStatus(zoneId) {

        const definition =
            ZoneCatalog.get(zoneId);

        if (!definition) {
            return null;
        }

        if (
            definition.releaseState ===
            ZoneCatalog.RELEASE_STATE.COMING_SOON
        ) {
            return {
                zoneId,
                status: STATUS.COMING_SOON,
                label: STATUS_LABEL[
                    STATUS.COMING_SOON
                ],
                interactive: false,
                message:
                    definition.comingSoonMessage ||
                    `${definition.label} is coming soon.`
            };
        }

        if (
            GameStateManager.isZoneCompleted(
                zoneId
            )
        ) {
            return {
                zoneId,
                status: STATUS.COMPLETED,
                label: STATUS_LABEL[
                    STATUS.COMPLETED
                ],
                interactive: true,
                message:
                    `${definition.label}'s required activity is complete. You may revisit it.`
            };
        }

        if (
            GameStateManager.isZoneUnlocked(
                zoneId
            )
        ) {
            return {
                zoneId,
                status: STATUS.AVAILABLE,
                label: STATUS_LABEL[
                    STATUS.AVAILABLE
                ],
                interactive: true,
                message:
                    `${definition.label} is available.`
            };
        }

        return {
            zoneId,
            status: STATUS.LOCKED,
            label: STATUS_LABEL[
                STATUS.LOCKED
            ],
            interactive: false,
            message:
                definition.lockedMessage ||
                `${definition.label} is locked.`
        };

    }

});

export default ZoneStatusResolver;
