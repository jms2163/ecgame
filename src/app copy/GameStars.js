// --------------------------------------------------
// GameStars.js
// Shared exceptional-work star registry and UI helper
// --------------------------------------------------

import gameState from "./GameState.js";
import GameStateObserver
    from "./GameStateObserver.js";
import SaveManager from "./SaveManager.js";

const STAR_CHARACTER = "\u2605";
const DEFAULT_TOOLTIP = "Exceptional Work!";
const STYLESHEET_ID = "game-stars-styles";
const STYLESHEET_PATH =
    "./public/css/game-stars.css";

const GameStars = {

    initialized: false,
    tooltipSequence: 0,

    initialize() {

        this.ensureRegistry();
        this.ensureStylesheet();

        if (!this.initialized) {
            GameStateObserver.on(
                "game-state-loaded",
                () => {
                    this.ensureRegistry();
                    this.refresh();
                }
            );

            GameStateObserver.on(
                "game-star-awarded",
                () => this.refresh()
            );

            this.initialized = true;
        }

        return true;

    },

    ensureRegistry() {

        gameState.registry ??= {};
        gameState.registry.research ??= {};

        if (
            !gameState.registry.research
                .stars ||
            typeof gameState.registry.research
                .stars !== "object" ||
            Array.isArray(
                gameState.registry.research
                    .stars
            )
        ) {
            gameState.registry.research
                .stars = {};
        }

        return gameState.registry.research
            .stars;

    },

    ensureStylesheet() {

        if (
            typeof document === "undefined" ||
            document.getElementById(
                STYLESHEET_ID
            )
        ) {
            return false;
        }

        const stylesheet =
            document.createElement("link");

        stylesheet.id = STYLESHEET_ID;
        stylesheet.rel = "stylesheet";
        stylesheet.href =
            STYLESHEET_PATH;

        document.head.appendChild(
            stylesheet
        );

        return true;

    },

    normalizeStarId(starId) {

        return typeof starId === "string"
            ? starId.trim()
            : "";

    },

    hasStar(starId) {

        const normalizedId =
            this.normalizeStarId(starId);

        if (!normalizedId) {
            return false;
        }

        return Boolean(
            this.ensureRegistry()[
                normalizedId
            ]
        );

    },

    getStar(starId) {

        const normalizedId =
            this.normalizeStarId(starId);

        if (!normalizedId) {
            return null;
        }

        const star =
            this.ensureRegistry()[
                normalizedId
            ] ?? null;

        return star
            ? structuredClone(star)
            : null;

    },

    getAllStars() {

        return structuredClone(
            this.ensureRegistry()
        );

    },

    getStarCount() {

        return Object.keys(
            this.ensureRegistry()
        ).length;

    },

    removeStar(
        starId,
        {
            save = true
        } = {}
    ) {

        const normalizedId =
            this.normalizeStarId(starId);

        if (!normalizedId) {
            return {
                removed: false,
                starId: normalizedId,
                reason: "invalid-star-id",
                saveSucceeded: false
            };
        }

        const stars =
            this.ensureRegistry();

        if (!stars[normalizedId]) {
            return {
                removed: false,
                starId: normalizedId,
                reason: "not-awarded",
                saveSucceeded: true
            };
        }

        const removedStar =
            structuredClone(
                stars[normalizedId]
            );

        delete stars[normalizedId];

        const saveSucceeded =
            save
                ? SaveManager.save()
                : true;

        GameStateObserver.notify(
            "game-star-removed",
            {
                starId: normalizedId,
                star: removedStar,
                saveSucceeded
            }
        );

        this.refresh();

        return {
            removed: true,
            starId: normalizedId,
            reason: "removed",
            star: removedStar,
            saveSucceeded
        };

    },

    awardStar(
        starId,
        {
            awardedAtMs = Date.now(),
            reason = "exceptional-work",
            ...evidence
        } = {},
        {
            save = true
        } = {}
    ) {

        const normalizedId =
            this.normalizeStarId(starId);

        if (!normalizedId) {
            return {
                awarded: false,
                starId: normalizedId,
                reason: "invalid-star-id",
                star: null,
                saveSucceeded: false
            };
        }

        const stars =
            this.ensureRegistry();

        if (stars[normalizedId]) {
            return {
                awarded: false,
                starId: normalizedId,
                reason: "already-awarded",
                star:
                    structuredClone(
                        stars[normalizedId]
                    ),
                saveSucceeded: true
            };
        }

        const star = {
            awardedAtMs:
                Number.isFinite(
                    awardedAtMs
                )
                    ? awardedAtMs
                    : Date.now(),
            reason:
                typeof reason === "string" &&
                reason.trim()
                    ? reason.trim()
                    : "exceptional-work",
            ...structuredClone(evidence)
        };

        stars[normalizedId] = star;

        const saveSucceeded =
            save
                ? SaveManager.save()
                : true;

        GameStateObserver.notify(
            "game-star-awarded",
            {
                starId: normalizedId,
                star:
                    structuredClone(star),
                saveSucceeded
            }
        );

        this.refresh();

        return {
            awarded: true,
            starId: normalizedId,
            reason: "awarded",
            star:
                structuredClone(star),
            saveSucceeded
        };

    },

    createStarElement(
        starId,
        {
            tooltip = DEFAULT_TOOLTIP,
            className = "",
            showWhenUnearned = false
        } = {}
    ) {

        if (typeof document === "undefined") {
            return null;
        }

        this.initialize();

        const normalizedId =
            this.normalizeStarId(starId);

        if (!normalizedId) {
            return null;
        }

        const tooltipText =
            typeof tooltip === "string" &&
            tooltip.trim()
                ? tooltip.trim()
                : DEFAULT_TOOLTIP;

        this.tooltipSequence += 1;

        const tooltipId =
            `game-star-tooltip-${this.tooltipSequence}`;

        const starElement =
            document.createElement("span");

        starElement.className = [
            "game-star",
            className
        ].filter(Boolean).join(" ");

        starElement.dataset.gameStarId =
            normalizedId;
        starElement.dataset.showWhenUnearned =
            String(showWhenUnearned);
        starElement.tabIndex = 0;
        starElement.setAttribute(
            "role",
            "img"
        );
        starElement.setAttribute(
            "aria-label",
            tooltipText
        );
        starElement.setAttribute(
            "aria-describedby",
            tooltipId
        );

        const symbolElement =
            document.createElement("span");

        symbolElement.className =
            "game-star__symbol";
        symbolElement.textContent =
            STAR_CHARACTER;
        symbolElement.setAttribute(
            "aria-hidden",
            "true"
        );

        const tooltipElement =
            document.createElement("span");

        tooltipElement.id = tooltipId;
        tooltipElement.className =
            "game-star__tooltip";
        tooltipElement.textContent =
            tooltipText;
        tooltipElement.setAttribute(
            "role",
            "tooltip"
        );

        starElement.append(
            symbolElement,
            tooltipElement
        );

        this.refreshElement(
            starElement
        );

        return starElement;

    },

    refreshElement(starElement) {

        const starId =
            starElement?.dataset
                ?.gameStarId;

        if (!starId) {
            return false;
        }

        const earned =
            this.hasStar(starId);
        const showWhenUnearned =
            starElement.dataset
                .showWhenUnearned ===
                "true";

        starElement.hidden =
            !earned &&
            !showWhenUnearned;
        starElement.dataset.earned =
            String(earned);

        return earned;

    },

    refresh(root = null) {

        if (typeof document === "undefined") {
            return 0;
        }

        const searchRoot =
            root ?? document;

        if (
            typeof searchRoot
                .querySelectorAll !==
                "function"
        ) {
            return 0;
        }

        const starElements =
            searchRoot.querySelectorAll(
                "[data-game-star-id]"
            );

        starElements.forEach(
            starElement =>
                this.refreshElement(
                    starElement
                )
        );

        return starElements.length;

    },

    mountStar(
        container,
        starId,
        options = {}
    ) {

        if (
            !container ||
            typeof container.appendChild !==
                "function"
        ) {
            return null;
        }

        const normalizedId =
            this.normalizeStarId(starId);

        const existing =
            Array.from(
                container.querySelectorAll?.(
                    "[data-game-star-id]"
                ) ?? []
            ).find(
                element =>
                    element.dataset
                        .gameStarId ===
                        normalizedId
            );

        if (existing) {
            this.refreshElement(existing);
            return existing;
        }

        const starElement =
            this.createStarElement(
                normalizedId,
                options
            );

        if (!starElement) {
            return null;
        }

        container.appendChild(
            starElement
        );

        return starElement;

    }

};

export default GameStars;
