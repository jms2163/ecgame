// --------------------------------------------------
// NavigationUI.js
// Renders and refreshes student-facing global navigation
// --------------------------------------------------

import ZoneCatalog from "./ZoneCatalog.js";
import ZoneStatusResolver from "./ZoneStatusResolver.js";
import ZoneManager from "./ZoneManager.js";
import GameStateObserver from "./GameStateObserver.js";

const NavigationUI = {

    initialized: false,
    navigationElement: null,
    listElement: null,
    messageElement: null,
    utilityControls: new Map(),

    initialize() {

        if (this.initialized) {
            this.refresh();
            return true;
        }

        this.navigationElement =
            document.getElementById(
                "game-nav"
            );

        if (!this.navigationElement) {
            console.warn(
                "NavigationUI: #game-nav was not found"
            );

            return false;
        }

        this.navigationElement.replaceChildren();

        this.listElement =
            document.createElement("div");

        this.listElement.className =
            "game-nav-list";

        this.messageElement =
            document.createElement("p");

        this.messageElement.className =
            "game-nav-message";

        this.messageElement.setAttribute(
            "aria-live",
            "polite"
        );

        this.navigationElement.append(
            this.listElement,
            this.messageElement
        );

        GameStateObserver.on(
            "zone-state-changed",
            () => this.refresh()
        );

        GameStateObserver.on(
            "current-zone-changed",
            () => this.refresh()
        );

        GameStateObserver.on(
            "active-zone-changed",
            () => this.refresh()
        );

        GameStateObserver.on(
            "game-state-loaded",
            () => this.refresh()
        );

        this.initialized = true;

        this.refresh();

        return true;

    },

    getZoneStatus(zoneId) {

        return ZoneStatusResolver.getStatus(
            zoneId
        );

    },

    setMessage(message) {

        if (!this.messageElement) {
            return;
        }

        this.messageElement.textContent =
            message;

    },

    // --------------------------------------------------
    // Register a global navigation control that is not a
    // zone. Registered controls are always rendered after
    // every ZoneCatalog entry, in registration order.
    // --------------------------------------------------
    registerUtilityControl(
        controlId,
        element
    ) {

        if (
            typeof controlId !== "string" ||
            controlId.trim() === "" ||
            !element ||
            element.nodeType !== 1
        ) {
            console.warn(
                "NavigationUI: invalid utility control registration"
            );

            return false;
        }

        this.utilityControls.set(
            controlId,
            element
        );

        if (this.initialized) {
            this.refresh();
        }

        return true;

    },

    unregisterUtilityControl(controlId) {

        const element =
            this.utilityControls.get(
                controlId
            );

        if (!element) {
            return false;
        }

        this.utilityControls.delete(
            controlId
        );

        element.remove();

        if (this.initialized) {
            this.refresh();
        }

        return true;

    },

    getUtilityControlIds() {

        return [
            ...this.utilityControls.keys()
        ];

    },

    createButton(definition) {

        const status =
            this.getZoneStatus(
                definition.id
            );

        if (!status) {
            return null;
        }

        const button =
            document.createElement("button");

        const isActive =
            ZoneManager.getCurrentZoneId() ===
            definition.id;

        button.type = "button";

        button.className = [
            "game-nav-button",
            `game-nav-button--${status.status}`,
            isActive
                ? "game-nav-button--active"
                : ""
        ]
            .filter(Boolean)
            .join(" ");

        button.dataset.zoneId =
            definition.id;

        button.dataset.zoneStatus =
            status.status;

        button.setAttribute(
            "aria-disabled",
            String(!status.interactive)
        );

        if (isActive) {
            button.setAttribute(
                "aria-current",
                "page"
            );
        }

        button.title = status.message;

        const name =
            document.createElement("span");

        name.className =
            "game-nav-button-name";

        name.textContent =
            definition.label;

        const statusBadge =
            document.createElement("span");

        statusBadge.className =
            "game-nav-button-status";

        statusBadge.textContent =
            status.label;

        button.append(
            name,
            statusBadge
        );

        button.addEventListener(
            "click",
            () => {

                if (!status.interactive) {
                    this.setMessage(
                        status.message
                    );

                    return;
                }

                const result =
                    ZoneManager.enterZone(
                        definition.id
                    );

                if (result.entered) {
                    this.setMessage(
                        `${definition.label} opened.`
                    );
                } else {
                    this.setMessage(
                        result.message ||
                        `Unable to open ${definition.label}.`
                    );
                }

                this.refresh();

            }
        );

        return button;

    },

    refresh() {

        if (
            !this.initialized ||
            !this.listElement
        ) {
            return false;
        }

        const buttons =
            ZoneCatalog.getAll()
                .map(
                    definition =>
                        this.createButton(
                            definition
                        )
                )
                .filter(Boolean);

        const utilityControls = [
            ...this.utilityControls.values()
        ];

        this.listElement.replaceChildren(
            ...buttons,
            ...utilityControls
        );

        return true;

    }

};

export default NavigationUI;
