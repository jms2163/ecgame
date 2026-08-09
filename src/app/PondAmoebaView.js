// --------------------------------------------------
// PondAmoebaView.js
// Creates the visual display for the Pond amoeba
// --------------------------------------------------

const PondAmoebaView = {

    create() {

        const amoebaElement =
            document.createElement("span");

        amoebaElement.className =
            "pond-amoeba-view";

        amoebaElement.setAttribute(
            "aria-label",
            "Amoeba position"
        );

        amoebaElement.setAttribute(
            "role",
            "img"
        );

        amoebaElement.textContent =
            "●";

        return amoebaElement;

    }

};

export default PondAmoebaView;