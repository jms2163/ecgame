// --------------------------------------------------
// PondSignalProbe.js
// Manages temporary Chemical Signals probe-mode state
// --------------------------------------------------

const PondSignalProbe = {

    active: false,
    listeners: new Set(),

    // --------------------------------------------------
    // Check whether probe mode is active
    // --------------------------------------------------
    isActive() {

        return this.active;

    },

    // --------------------------------------------------
    // Listen for probe-mode changes
    // --------------------------------------------------
    onChange(listener) {

        if (typeof listener !== "function") {
            console.warn(
                "PondSignalProbe: listener must be a function"
            );

            return () => {};
        }

        this.listeners.add(
            listener
        );

        return () => {
            this.listeners.delete(
                listener
            );
        };

    },

    // --------------------------------------------------
    // Tell listeners that probe mode changed
    // --------------------------------------------------
    notifyListeners() {

        this.listeners.forEach(listener => {
            listener(this.active);
        });

    },

    // --------------------------------------------------
    // Set probe mode to one specific state
    // --------------------------------------------------
    setActive(active) {

        const nextActive =
            Boolean(active);

        if (this.active === nextActive) {
            return this.active;
        }

        this.active = nextActive;

        this.notifyListeners();

        return this.active;

    },

    // --------------------------------------------------
    // Turn on probe mode
    // --------------------------------------------------
    activate() {

        return this.setActive(
            true
        );

    },

    // --------------------------------------------------
    // Turn off probe mode
    // --------------------------------------------------
    deactivate() {

        return this.setActive(
            false
        );

    },

    // --------------------------------------------------
    // Switch probe mode on or off
    // --------------------------------------------------
    toggle() {

        return this.setActive(
            !this.active
        );

    }

};

export default PondSignalProbe;