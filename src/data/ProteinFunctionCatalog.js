// --------------------------------------------------
// ProteinFunctionCatalog.js
// Reusable presentation metadata for the gameplay effects associated with
// completed proteins.
//
// Protein entries reference these definitions by ID. Keeping student-facing
// effect labels here prevents proteinLibrary from becoming a UI catalog,
// while still allowing several proteins to share one effect.
// This catalog is read-only and never creates saved game state.
// --------------------------------------------------

const DEFINITIONS = Object.freeze({
    cellEnergy: Object.freeze({
        id: "cellEnergy",
        label: "Cell Energy",
        description:
            "Glucose uptake grants access to Glycolysis but does not directly add ATP.",
        badgeText:
            "⚡ Glycolysis Access",
        badgeTone: "energy"
    }),
    atpProduction: Object.freeze({
        id: "atpProduction",
        label: "ATP Production",
        description:
            "Adds four ATP per minute while the game is open.",
        badgeText:
            "⚡ +4 ATP/min",
        badgeTone: "energy"
    }),
    waterBalance: Object.freeze({
        id: "waterBalance",
        label: "Water Balance",
        description:
            "Supports selective water transport and cellular osmotic balance.",
        badgeText:
            "💧 Water Balance",
        badgeTone: "homeostasis"
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
