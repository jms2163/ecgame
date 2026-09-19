// --------------------------------------------------
// ATPManager.js
// Produces connected-browser ATP from data-driven progression sources.
// Production is derived from authoritative saved products/modules/placements;
// this manager never saves a conflicting ATP-rate field.
// --------------------------------------------------

import GameStateObserver from "./GameStateObserver.js";
import GameStateManager from "./GameStateManager.js";
import ResourceManager from "./ResourceManager.js";
import ATPProductionCatalog
    from "../data/ATPProductionCatalog.js";
import MetabolismPathwayCatalog
    from "../data/MetabolismPathwayCatalog.js";

const BASE_ATP_INTERVAL_SEC = 60;

let initialized = false;
let accumulatedATP = 0;
let gameTickHandler = null;

function safeCount(value) {

    const rawCount =
        typeof value === "number"
            ? value
            : value?.count;

    return Number.isFinite(rawCount)
        ? Math.max(0, Math.floor(rawCount))
        : 0;

}

function getPolymerizerProductCount(
    productId
) {

    return safeCount(
        GameStateManager.getZoneSnapshot(
            "polymerizer"
        )?.state?.productInventory?.[
            productId
        ]
    );

}

function getMetabolismState() {

    return GameStateManager.getZoneSnapshot(
        "metabolism"
    )?.state ?? {};

}

function getCorrectCorePlacementCount(
    pathwayId
) {

    const pathway =
        MetabolismPathwayCatalog.get(
            pathwayId
        );
    const placements =
        getMetabolismState()
            .pathwayPlacements?.[
                pathwayId
            ] ?? {};

    if (!pathway) return 0;

    return pathway.coreSlots.reduce(
        (count, slot) =>
            placements[String(slot.slot)] ===
                slot.enzymeId
                ? count + 1
                : count,
        0
    );

}

const ATPManager = {

    // --------------------------------------------------
    // Initialize ATP production once
    // --------------------------------------------------
    initialize() {

        if (initialized) {
            return false;
        }

        ResourceManager.initialize();

        gameTickHandler = payload => {
            this.handleGameTick(payload);
        };

        GameStateObserver.on(
            "game-tick",
            gameTickHandler
        );

        initialized = true;

        return true;

    },

    // --------------------------------------------------
    // Read the guaranteed base production rate
    // --------------------------------------------------
    getProductionRatePerSecond() {

        return this.getProductionStatus()
            .totalATPPerMinute / 60;

    },

    // --------------------------------------------------
    // Derive every active production contribution
    // --------------------------------------------------
    getProductionStatus() {

        const metabolismState =
            getMetabolismState();

        const sources =
            ATPProductionCatalog
                .getAll()
                .map(definition => {

                    let active = false;
                    let progress = null;
                    let atpPerMinute = 0;

                    switch (
                        definition.activationType
                    ) {
                        case "always":
                            active = true;
                            atpPerMinute =
                                definition
                                    .atpPerMinute;
                            break;

                        case "polymerizer-product": {
                            const currentCount =
                                getPolymerizerProductCount(
                                    definition
                                        .productId
                                );
                            const requiredCount =
                                definition
                                    .minimumCount;

                            active =
                                currentCount >=
                                requiredCount;
                            atpPerMinute = active
                                ? definition
                                    .atpPerMinute
                                : 0;
                            progress = {
                                currentCount,
                                requiredCount
                            };
                            break;
                        }

                        case "metabolism-module": {
                            const completed =
                                Boolean(
                                    metabolismState
                                        .completedModules
                                        ?.[
                                            definition
                                                .moduleId
                                        ]
                                        ?.completed
                                );

                            active = completed;
                            atpPerMinute = active
                                ? definition
                                    .atpPerMinute
                                : 0;
                            progress = { completed };
                            break;
                        }

                        case "correct-pathway-placements": {
                            const correctPlacements =
                                Math.min(
                                    definition
                                        .maximumPlacements,
                                    getCorrectCorePlacementCount(
                                        definition
                                            .pathwayId
                                    )
                                );

                            active =
                                correctPlacements > 0;
                            atpPerMinute =
                                Math.min(
                                    definition
                                        .maximumATPPerMinute,
                                    correctPlacements *
                                        definition
                                            .atpPerCorrectPlacement
                                );
                            progress = {
                                correctPlacements,
                                maximumPlacements:
                                    definition
                                        .maximumPlacements,
                                percent:
                                    Math.round(
                                        correctPlacements /
                                        definition
                                            .maximumPlacements *
                                        100
                                    )
                            };
                            break;
                        }

                        default:
                            break;
                    }

                    return {
                        ...definition,
                        active,
                        atpPerMinute,
                        progress
                    };

                });

        const totalATPPerMinute =
            sources.reduce(
                (total, source) =>
                    total +
                    source.atpPerMinute,
                0
            );

        return {
            connectedBrowserOnly: true,
            sources,
            totalATPPerMinute,
            totalATPPerSecond:
                totalATPPerMinute / 60,
            increasesCapacity: false
        };

    },

    // --------------------------------------------------
    // Process one central game tick
    // --------------------------------------------------
    handleGameTick(payload = {}) {

        const deltaSec =
            payload.deltaSec;

        if (
            !Number.isFinite(deltaSec) ||
            deltaSec <= 0
        ) {
            return 0;
        }

        const atpStatus =
            ResourceManager.getATPStatus();

        // Time spent at full capacity is intentionally
        // discarded rather than banked for later use.
        if (
            atpStatus.current >=
            atpStatus.maximum
        ) {
            accumulatedATP = 0;

            return 0;
        }

        const production =
            this.getProductionStatus();

        accumulatedATP +=
            deltaSec *
            production.totalATPPerSecond;

        const wholeATP =
            Math.floor(accumulatedATP);

        if (wholeATP < 1) {
            return 0;
        }

        accumulatedATP -= wholeATP;

        const actualGain =
            ResourceManager.addATP(
                wholeATP,
                "connected-atp-production"
            );

        const updatedStatus =
            ResourceManager.getATPStatus();

        if (
            actualGain < wholeATP ||
            updatedStatus.current >=
                updatedStatus.maximum
        ) {
            accumulatedATP = 0;
        }

        return actualGain;

    },

    // --------------------------------------------------
    // Development-console status
    // --------------------------------------------------
    getStatus() {

        const production =
            this.getProductionStatus();

        return {
            initialized,
            secondsPerATP:
                BASE_ATP_INTERVAL_SEC,
            baseATPPerSecond:
                ATPProductionCatalog
                    .get("baseMetabolism")
                    .atpPerMinute / 60,
            accumulatedATP,
            ...production
        };

    }

};

export default ATPManager;
