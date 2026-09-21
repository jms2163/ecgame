// --------------------------------------------------
// PondAnchoringManager.js
// Charges the continuous anchoring demand and protects an ATP reserve.
// --------------------------------------------------

import GameStateManager
    from "./GameStateManager.js";
import GameStateObserver
    from "./GameStateObserver.js";
import ResourceManager
    from "./ResourceManager.js";
import SaveManager from "./SaveManager.js";
import ATPManager from "./ATPManager.js";
import ATPDemandCatalog
    from "../data/ATPDemandCatalog.js";

const ANCHORING_DEMAND =
    ATPDemandCatalog.get("pondAnchoring");

const PondAnchoringManager = {
    initialized: false,
    accumulatedDemandATP: 0,
    gameTickHandler: null,

    initialize() {
        if (this.initialized) {
            return false;
        }

        this.gameTickHandler = event => {
            this.handleGameTick(event);
        };

        GameStateObserver.on(
            "game-tick",
            this.gameTickHandler
        );

        this.initialized = true;
        return true;
    },

    getReserveThreshold(maximum) {
        return Math.ceil(
            Math.max(0, Number(maximum) || 0) *
            ANCHORING_DEMAND.reserveFraction
        );
    },

    getStatus() {
        const atp =
            ResourceManager.getATPStatus();
        const balance =
            ATPManager.getBalanceStatus();
        const anchored =
            GameStateManager.isPondPlayerAnchored();

        return {
            anchored,
            demandATPPerMinute:
                anchored
                    ? ANCHORING_DEMAND.atpPerMinute
                    : 0,
            accumulatedDemandATP:
                this.accumulatedDemandATP,
            reserveFraction:
                ANCHORING_DEMAND.reserveFraction,
            reserveATP:
                this.getReserveThreshold(
                    atp.maximum
                ),
            productionATPPerMinute:
                balance
                    .totalProductionATPPerMinute,
            netATPPerMinute:
                balance.netATPPerMinute,
            inNetDeficit:
                anchored &&
                balance.netATPPerMinute < 0
        };
    },

    releaseAtReserve(previousATPStatus) {
        GameStateManager.setPondPlayerAnchored(
            false
        );

        if (!SaveManager.save({
            reason:
                "pond-anchor-reserve-release"
        })) {
            GameStateManager.setPondPlayerAnchored(
                true
            );
            ResourceManager.setATPStatus(
                previousATPStatus,
                "pond-anchor-release-rollback"
            );

            return false;
        }

        this.accumulatedDemandATP = 0;

        const payload = {
            anchored: false,
            automatic: true,
            reason: "atp-reserve",
            status: this.getStatus()
        };

        GameStateObserver.notify(
            "pond-anchoring-changed",
            payload
        );
        GameStateObserver.notify(
            "pond-anchor-auto-released",
            payload
        );

        return true;
    },

    handleGameTick(event = {}) {
        const deltaSec = Number(event.deltaSec);

        if (
            !Number.isFinite(deltaSec) ||
            deltaSec <= 0
        ) {
            return {
                charged: 0,
                released: false,
                reason: "invalid-time"
            };
        }

        if (
            !GameStateManager
                .isPondPlayerAnchored()
        ) {
            this.accumulatedDemandATP = 0;

            return {
                charged: 0,
                released: false,
                reason: "unanchored"
            };
        }

        const previousATPStatus =
            ResourceManager.getATPStatus();
        const reserveATP =
            this.getReserveThreshold(
                previousATPStatus.maximum
            );
        const balance =
            ATPManager.getBalanceStatus();
        const inNetDeficit =
            balance.netATPPerMinute < 0;

        if (
            inNetDeficit &&
            previousATPStatus.current <=
                reserveATP
        ) {
            const released =
                this.releaseAtReserve(
                    previousATPStatus
                );

            return {
                charged: 0,
                released,
                reason: released
                    ? "atp-reserve"
                    : "save-failed",
                status: this.getStatus()
            };
        }

        this.accumulatedDemandATP +=
            deltaSec *
            ANCHORING_DEMAND.atpPerMinute /
            60;

        const wholeDemand = Math.floor(
            this.accumulatedDemandATP
        );

        if (wholeDemand < 1) {
            return {
                charged: 0,
                released: false,
                reason: "accumulating",
                status: this.getStatus()
            };
        }

        const spendableATP = inNetDeficit
            ? Math.max(
                0,
                previousATPStatus.current -
                    reserveATP
            )
            : previousATPStatus.current;
        const charge = Math.min(
            wholeDemand,
            spendableATP
        );

        if (charge > 0) {
            ResourceManager.spendATP(
                charge,
                "pond-anchoring-demand"
            );
            this.accumulatedDemandATP -= charge;
        }

        const updatedATP =
            ResourceManager.getATPStatus();
        let released = false;
        let releaseFailed = false;

        if (
            inNetDeficit &&
            updatedATP.current <= reserveATP
        ) {
            released = this.releaseAtReserve(
                previousATPStatus
            );
            releaseFailed = !released;
        }

        return {
            charged: releaseFailed
                ? 0
                : charge,
            released,
            reason: releaseFailed
                ? "save-failed"
                : released
                    ? "atp-reserve"
                    : charge > 0
                        ? "charged"
                        : "insufficient-atp",
            status: this.getStatus()
        };
    },

    resetAccumulator() {
        this.accumulatedDemandATP = 0;
    }
};

export {
    ANCHORING_DEMAND
};

export default PondAnchoringManager;
