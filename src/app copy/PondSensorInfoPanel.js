// --------------------------------------------------
// PondSensorInfoPanel.js
// Controls the Pond sensor information panel
// --------------------------------------------------

const PondSensorInfoPanel = {

    initialized: false,

    panelElement: null,
    titleElement: null,
    messageElement: null,
    closeButtonElement: null,
    workspaceElement: null,
    openerElement: null,

    // --------------------------------------------------
    // Find panel display elements
    // --------------------------------------------------
    initialize() {

        if (this.initialized) {
            return;
        }

        this.panelElement =
            document.getElementById(
                "pond-sensor-information-panel"
            );

        this.titleElement =
            document.getElementById(
                "pond-sensor-information-title"
            );

        this.messageElement =
            document.getElementById(
                "pond-sensor-information-message"
            );

        this.closeButtonElement =
            document.getElementById(
                "btn-close-pond-sensor-information"
            );

        this.workspaceElement =
            document.getElementById(
                "pond-workspace"
            );

        if (
            !this.panelElement ||
            !this.titleElement ||
            !this.messageElement ||
            !this.closeButtonElement ||
            !this.workspaceElement
        ) {
            console.warn(
                "PondSensorInfoPanel: panel display elements not found"
            );

            return;
        }

        this.closeButtonElement.addEventListener(
            "click",
            () => {
                this.close();
            }
        );

        this.close();

        this.initialized = true;

    },

    // --------------------------------------------------
    // Disable or restore Pond workspace interaction
    // --------------------------------------------------
    setWorkspaceInteractive(interactive) {

        if (!this.workspaceElement) {
            return;
        }

        this.workspaceElement.inert =
            !interactive;

    },

    // --------------------------------------------------
    // Open panel with supplied sensor information
    // --------------------------------------------------
    open({
        title,
        message
    }) {

        this.initialize();

        if (
            !this.panelElement ||
            !this.titleElement ||
            !this.messageElement
        ) {
            return false;
        }

        this.openerElement =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;

        this.setWorkspaceInteractive(
            false
        );

        this.titleElement.textContent =
            title;

        this.messageElement.textContent =
            message;

        this.panelElement.classList.remove(
            "hidden"
        );

        this.panelElement.setAttribute(
            "aria-hidden",
            "false"
        );

        this.closeButtonElement.focus();

        return true;

    },

    // --------------------------------------------------
    // Hide sensor information panel
    // --------------------------------------------------
    close() {

        if (!this.panelElement) {
            return;
        }

        this.setWorkspaceInteractive(
            true
        );

        const focusIsInsidePanel =
            this.panelElement.contains(
                document.activeElement
            );

        if (focusIsInsidePanel) {

            const canRestoreFocus =
                this.openerElement &&
                this.openerElement.isConnected &&
                typeof this.openerElement.focus ===
                    "function";

            if (canRestoreFocus) {
                this.openerElement.focus();
            }

            if (
                this.panelElement.contains(
                    document.activeElement
                )
            ) {
                document.activeElement.blur();
            }

        }

        this.panelElement.classList.add(
            "hidden"
        );

        this.panelElement.setAttribute(
            "aria-hidden",
            "true"
        );

        this.openerElement = null;

    }

};

export default PondSensorInfoPanel;