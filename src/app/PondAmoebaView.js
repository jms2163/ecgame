// --------------------------------------------------
// PondAmoebaView.js
// Creates the visual display for the Pond amoeba
// --------------------------------------------------

const TROPHOZOITE_STATIONARY_SPRITE_PATH =
    "./public/assets/pond/amoeba/amoeba-trophozoite-stationary.png";

const PondAmoebaView = {

    // --------------------------------------------------
    // Create stationary amoeba display
    // --------------------------------------------------
    create() {

        const amoebaElement =
            document.createElement("span");

        amoebaElement.className =
            "pond-amoeba-view";

        const spriteElement =
            document.createElement("img");

        spriteElement.className =
            "pond-amoeba-sprite";

        spriteElement.src =
            TROPHOZOITE_STATIONARY_SPRITE_PATH;

        spriteElement.alt =
            "Stationary amoeba";

        amoebaElement.appendChild(
            spriteElement
        );

        return amoebaElement;

    }

};

export default PondAmoebaView;