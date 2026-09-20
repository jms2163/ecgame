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
    }),
    glycolysisATPInvestment: Object.freeze({
        id: "glycolysisATPInvestment",
        label: "Glycolysis ATP Investment",
        description:
            "Uses ATP during its glycolysis reaction. Assembling the enzyme does not directly spend pathway ATP.",
        badgeText: "Uses ATP",
        badgeTone: "energy"
    }),
    glycolysisG6PIsomerization: Object.freeze({
        id: "glycolysisG6PIsomerization",
        label: "Sugar Rearrangement",
        description:
            "Rearranges glucose-6-phosphate into fructose-6-phosphate.",
        badgeText: "Rearranges G6P",
        badgeTone: "metabolism"
    }),
    glycolysisSugarCleavage: Object.freeze({
        id: "glycolysisSugarCleavage",
        label: "Sugar Cleavage",
        description:
            "Splits the six-carbon sugar into two three-carbon products.",
        badgeText: "Splits 6C Sugar",
        badgeTone: "metabolism"
    }),
    glycolysisTrioseConversion: Object.freeze({
        id: "glycolysisTrioseConversion",
        label: "Triose Conversion",
        description:
            "Converts DHAP into a second glyceraldehyde-3-phosphate molecule.",
        badgeText: "DHAP to GAP",
        badgeTone: "metabolism"
    }),
    glycolysisNADHProduction: Object.freeze({
        id: "glycolysisNADHProduction",
        label: "Electron Capture",
        description:
            "Reduces NAD+ to NADH during glycolysis.",
        badgeText: "Produces NADH",
        badgeTone: "energy"
    }),
    glycolysisATPGeneration: Object.freeze({
        id: "glycolysisATPGeneration",
        label: "Substrate-Level Phosphorylation",
        description:
            "Produces ATP at its glycolysis step after placement in Metabolism. Assembling the enzyme does not directly award ATP.",
        badgeText: "Produces ATP",
        badgeTone: "energy"
    }),
    glycolysisPhosphateShift: Object.freeze({
        id: "glycolysisPhosphateShift",
        label: "Phosphate Rearrangement",
        description:
            "Moves the phosphate group to prepare the molecule for the next glycolysis step.",
        badgeText: "Moves Phosphate",
        badgeTone: "metabolism"
    }),
    glycolysisPEPFormation: Object.freeze({
        id: "glycolysisPEPFormation",
        label: "PEP Formation",
        description:
            "Produces phosphoenolpyruvate and releases water.",
        badgeText: "Produces PEP",
        badgeTone: "metabolism"
    }),
    lactateNADRegeneration: Object.freeze({
        id: "lactateNADRegeneration",
        label: "NAD+ Regeneration",
        description:
            "Regenerates NAD+ during lactate fermentation so glycolysis can continue.",
        badgeText: "Regenerates NAD+",
        badgeTone: "metabolism"
    }),
    anaerobicAcetylCoA: Object.freeze({
        id: "anaerobicAcetylCoA",
        label: "Anaerobic Acetyl-CoA Formation",
        description:
            "Forms acetyl-CoA and formate from pyruvate and CoA during anaerobic metabolism.",
        badgeText: "Produces Acetyl-CoA",
        badgeTone: "metabolism"
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
