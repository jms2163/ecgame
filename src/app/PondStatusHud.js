// --------------------------------------------------
// PondStatusHud.js
// Creates and updates Pond coordinate / ATP display
// --------------------------------------------------

const PondStatusHud = {

    coordinatesElement: null,  // Coordinate display
    atpElement: null,          // ATP display
    currentElement: null,      // Current direction / timing

    // --------------------------------------------------
    // Create Pond HUD
    // --------------------------------------------------
    create() {

        const statusElement =
            document.createElement("div");

        statusElement.id =
            "pond-status-hud";

        statusElement.setAttribute(
            "aria-label",
            "Pond status display"
        );

        const primaryLineElement =
            document.createElement("div");

        primaryLineElement.id =
            "pond-status-primary-line";

        this.coordinatesElement =
            document.createElement("span");

        this.coordinatesElement.id =
            "pond-coordinate-readout";

        const separatorElement =
            document.createElement("span");

        separatorElement.id =
            "pond-status-separator";

        separatorElement.textContent =
            "|";

        this.atpElement =
            document.createElement("span");

        this.atpElement.id =
            "pond-atp-readout";

        this.atpElement.textContent =
            "ATP: --/--";

        primaryLineElement.append(
            this.coordinatesElement,
            separatorElement,
            this.atpElement
        );

        this.currentElement =
            document.createElement("div");

        this.currentElement.id =
            "pond-current-readout";

        this.currentElement.textContent =
            "CURRENT: --";

        statusElement.append(
            primaryLineElement,
            this.currentElement
        );

        return statusElement;

    },

    // --------------------------------------------------
    // Format one countdown without displaying fractions
    // --------------------------------------------------
    formatCountdown(milliseconds) {
        if (!Number.isFinite(milliseconds)) {
            return "--:--";
        }

        const totalSeconds = Math.max(
            0,
            Math.ceil(milliseconds / 1000)
        );
        const minutes = Math.floor(
            totalSeconds / 60
        );
        const seconds = totalSeconds % 60;

        return `${minutes}:${String(seconds).padStart(2, "0")}`;
    },

    // --------------------------------------------------
    // Update current direction and timing
    // --------------------------------------------------
    renderCurrent(currentStatus) {
        if (
            !this.currentElement ||
            !currentStatus
        ) {
            return;
        }

        const direction =
            currentStatus.direction?.label ?? "--";
        const turnCountdown =
            this.formatCountdown(
                currentStatus
                    .millisecondsUntilDirectionChange
            );
        let stateText;
        let stateClass = "drifting";

        if (currentStatus.anchored) {
            stateText = "ANCHORED";
            stateClass = "anchored";
        } else if (
            currentStatus.safetyHoldActive
        ) {
            const biome = String(
                currentStatus.lastBlockedBiome ??
                    "hazard"
            )
                .replaceAll("_", " ")
                .toUpperCase();

            stateText = `SAFETY HOLD: ${biome} | RETRY ${this.formatCountdown(
                currentStatus.millisecondsUntilShift
            )}`;
            stateClass = "safety-hold";
        } else {
            stateText = `DRIFT ${this.formatCountdown(
                currentStatus.millisecondsUntilShift
            )}`;
        }

        this.currentElement.textContent =
            `CURRENT: ${direction} | ${stateText} | TURN ${turnCountdown}`;
        this.currentElement.dataset.state =
            stateClass;
    },

    // --------------------------------------------------
    // Update coordinate display
    // --------------------------------------------------
    renderCoordinates(position) {

        if (
            !this.coordinatesElement ||
            !position
        ) {
            return;
        }

        this.coordinatesElement.textContent =
            `COORD: ${position.x}, ${position.y}`;

    },

    // --------------------------------------------------
    // Update ATP display without rebuilding the grid
    // --------------------------------------------------
    renderATP(atpStatus) {

        if (
            !this.atpElement ||
            !atpStatus
        ) {
            return;
        }

        this.atpElement.textContent =
            `ATP: ${atpStatus.current}/${atpStatus.maximum}`;

    },

    // --------------------------------------------------
    // Update coordinate and ATP display
    // --------------------------------------------------
    render(
        position,
        atpStatus,
        currentStatus = null
    ) {

        this.renderCoordinates(position);
        this.renderATP(atpStatus);
        this.renderCurrent(currentStatus);

    }

};

export default PondStatusHud;
