// --------------------------------------------------
// PlasmaMembraneVisualCatalog.js
// Shared geometry and artwork for plasma-membrane labs
// --------------------------------------------------

const PlasmaMembraneVisualCatalog = {

    geometry: Object.freeze({
        start: 0.44,
        end: 0.56
    }),

    assets: Object.freeze({
        setup:
            "./public/assets/experiments/membranes/phospholipid-bilayer.svg",
        simulation:
            "./public/assets/experiments/membranes/phospholipid-bilayer-animated.svg"
    }),

    createVisual({ animated = false, className = "" } = {}) {

        const visual =
            document.createElement("img");

        visual.className = className;
        visual.src = animated
            ? this.assets.simulation
            : this.assets.setup;
        visual.alt = "";
        visual.setAttribute(
            "aria-hidden",
            "true"
        );

        return visual;

    },

    applyGeometry(element) {

        const width =
            this.geometry.end -
            this.geometry.start;

        element.style.setProperty(
            "--membrane-start",
            `${this.geometry.start * 100}%`
        );

        element.style.setProperty(
            "--membrane-width",
            `${width * 100}%`
        );

        element.style.setProperty(
            "--plasma-membrane-image",
            `url("${this.assets.simulation}")`
        );

        return element;

    }

};

export default PlasmaMembraneVisualCatalog;
