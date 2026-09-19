// --------------------------------------------------
// ProteinFunctionCatalog.js
// Reusable presentation metadata for the gameplay effects associated with
// completed proteins.
//
// Protein entries reference these definitions by ID. Keeping image paths and
// student-facing effect labels here prevents proteinLibrary from becoming a
// UI catalog, while still allowing several proteins to share one effect.
// This catalog is read-only and never creates saved game state.
// --------------------------------------------------

const FUNCTION_ICON_DIRECTORY =
    "../../public/assets/polymerizer/functions/";

function assetUrl(fileName) {

    return new URL(
        `${FUNCTION_ICON_DIRECTORY}${fileName}`,
        import.meta.url
    ).href;

}

const DEFINITIONS = Object.freeze({
    cellEnergy: Object.freeze({
        id: "cellEnergy",
        label: "Cell Energy",
        description:
            "Supports glucose uptake for cellular energy pathways.",
        iconUrl: assetUrl(
            "Card_Energy_Icon.png"
        ),
        iconAlt:
            "Cell energy function icon"
    }),
    atpProduction: Object.freeze({
        id: "atpProduction",
        label: "ATP Production",
        description:
            "Adds four ATP per minute while the game is open.",
        // The same energy artwork may identify glucose access and direct ATP
        // production while their labels explain the distinct effects.
        iconUrl: assetUrl(
            "Card_Energy_Icon.png"
        ),
        iconAlt:
            "ATP production function icon"
    })
});

const ProteinFunctionCatalog =
    Object.freeze({

        get(id) {
            return typeof id === "string"
                ? DEFINITIONS[id] ?? null
                : null;
        },

        has(id) {
            return Boolean(this.get(id));
        },

        getAll() {
            return Object.values(DEFINITIONS);
        }

    });

export default ProteinFunctionCatalog;
