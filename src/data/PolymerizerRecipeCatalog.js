// --------------------------------------------------
// PolymerizerRecipeCatalog.js
// Pure, immutable Polymerizer recipe definitions.
//
// Protein identity and simplified structural recipes remain
// authoritative in proteinLibrary. This adapter translates the
// library's compact PPC symbols into Macromolecularizer product IDs.
// --------------------------------------------------

import { proteinLibrary } from "./proteinLibrary.js";
import ProteinFunctionCatalog
    from "./ProteinFunctionCatalog.js";

const MOTIF_ID_BY_SYMBOL = Object.freeze({
    H: "H_helix",
    B: "B_sheet",
    L: "L_loop"
});

const ATP_PER_MOTIF_UNIT = 1;
const MINIMUM_ASSEMBLY_SECONDS = 15;
const MAXIMUM_ASSEMBLY_SECONDS = 60;
const SECONDS_PER_MOTIF_UNIT = 0.25;
const PRODUCT_CONFIGS = Object.freeze({
    Aquaporin: Object.freeze({
        name: "Aquaporin",
        implemented: true,
        discoveryId: "aquaporin",
        completionQuestId:
            "protein_building_blocks",
        lockedMessage: null
    }),
    GlucoseTransporter: Object.freeze({
        name: "Glucose Transporter",
        implemented: true,
        discoveryId: null,
        lockedMessage: null
    }),
    EnergyKinase: Object.freeze({
        name: "Energy Kinase",
        implemented: true,
        discoveryId: null,
        maxCompletions: 1,
        lockedMessage: null
    }),
    Hexokinase: Object.freeze({
        name: "Hexokinase",
        implemented: true,
        discoveryId: null,
        lockedMessage: null
    }),
    PhosphoglucoseIsomerase: Object.freeze({
        name: "Phosphoglucose Isomerase",
        implemented: true,
        discoveryId: null,
        lockedMessage: null
    }),
    Phosphofructokinase: Object.freeze({
        name: "Phosphofructokinase-1",
        implemented: true,
        discoveryId: null,
        lockedMessage: null
    }),
    Aldolase: Object.freeze({
        name: "Aldolase",
        implemented: true,
        discoveryId: null,
        lockedMessage: null
    }),
    TriosePhosphateIsomerase: Object.freeze({
        name: "Triose Phosphate Isomerase",
        implemented: true,
        discoveryId: null,
        lockedMessage: null
    }),
    Glyceraldehyde3PhosphateDehydrogenase: Object.freeze({
        name: "Glyceraldehyde-3-Phosphate Dehydrogenase",
        implemented: true,
        discoveryId: null,
        lockedMessage: null
    }),
    PhosphoglycerateKinase: Object.freeze({
        name: "Phosphoglycerate Kinase",
        implemented: true,
        discoveryId: null,
        lockedMessage: null
    }),
    PhosphoglycerateMutase: Object.freeze({
        name: "Phosphoglycerate Mutase",
        implemented: true,
        discoveryId: null,
        lockedMessage: null
    }),
    Enolase: Object.freeze({
        name: "Enolase",
        implemented: true,
        discoveryId: null,
        lockedMessage: null
    }),
    PyruvateKinase: Object.freeze({
        name: "Pyruvate Kinase",
        implemented: true,
        discoveryId: null,
        lockedMessage: null
    }),
    LactateDehydrogenase: Object.freeze({
        name: "Lactate Dehydrogenase",
        implemented: true,
        discoveryId: null,
        lockedMessage: null
    }),
    FormateAcetyltransferase1: Object.freeze({
        name: "Formate Acetyltransferase 1",
        implemented: true,
        discoveryId: null,
        lockedMessage: null
    })
});

function safeCount(value) {

    return Number.isFinite(value)
        ? Math.max(0, Math.floor(value))
        : 0;

}

function countPPCSymbols(ppc = "") {

    return [...ppc].reduce(
        (counts, symbol) => {
            counts[symbol] =
                (counts[symbol] ?? 0) + 1;
            return counts;
        },
        {}
    );

}

function createDefinition(id, protein) {

    const config = PRODUCT_CONFIGS[id];
    const recipe = protein?.Recipe ?? {};
    const ppcCounts = countPPCSymbols(
        protein?.PPC
    );
    const structureOrderKnown =
        typeof protein?.PPC === "string" &&
        protein.PPC.trim() !== "";
    const functionDisplay =
        ProteinFunctionCatalog.get(
            protein?.FunctionDisplay
        );

    const motifRequirements =
        Object.entries(recipe).map(
            ([symbol, quantity]) =>
                Object.freeze({
                    symbol,
                    productId:
                        MOTIF_ID_BY_SYMBOL[
                            symbol
                        ] ?? null,
                    quantity:
                        safeCount(quantity)
                })
        );

    const motifCount =
        motifRequirements.reduce(
            (total, requirement) =>
                total + requirement.quantity,
            0
        );

    // Protein assembly remains a short reward after the player has invested
    // in permanent motif levels. Larger structures take visibly longer, but
    // the cap prevents realistic protein size from becoming a second wait
    // wall: clamp(15 + motif count * 0.25, 15, 60) seconds.
    const assemblyDurationMs =
        Math.round(
            Math.min(
                MAXIMUM_ASSEMBLY_SECONDS,
                Math.max(
                    MINIMUM_ASSEMBLY_SECONDS,
                    MINIMUM_ASSEMBLY_SECONDS +
                        motifCount *
                            SECONDS_PER_MOTIF_UNIT
                )
            ) * 1000
        );

    // Some PDB-derived recipes provide reliable motif totals without a
    // reliable linear motif order. In that case an empty PPC is honest data,
    // not a validation failure. Whenever PPC is supplied, it must still match
    // the counts exactly.
    const recipeMatchesPPC =
        structureOrderKnown
            ? motifRequirements.every(
                requirement =>
                    safeCount(
                        ppcCounts[
                            requirement.symbol
                        ]
                    ) ===
                        requirement.quantity
            ) &&
                Object.keys(ppcCounts).every(
                    symbol =>
                        safeCount(
                            recipe[symbol]
                        ) ===
                            ppcCounts[symbol]
                )
            : null;

    const recognizedMotifs =
        motifRequirements.every(
            requirement =>
                Boolean(
                    requirement.productId
                )
        );

    return Object.freeze({
        id,
        name: config?.name ?? id,
        category: "proteins",
        className:
            protein?.Class ?? "Protein",
        location:
            protein?.Location ?? "",
        function:
            protein?.Function ?? "",
        // This is presentation metadata derived from a catalog reference.
        // It is never copied into Polymerizer save state.
        functionDisplay,
        description:
            protein?.Info ?? "",
        source:
            protein?.Source ?? "",
        simplifiedStructure:
            protein?.PPC ?? "",
        structureOrderKnown,
        motifRequirements:
            Object.freeze(
                motifRequirements
            ),
        motifCount,
        assemblyDurationMs:
            config?.implemented
                ? assemblyDurationMs
                : null,
        // Only released recipes receive a gameplay ATP cost. Locked catalog
        // entries may contain preliminary biological structure data, but
        // Polymerizer must not turn that into an unapproved playable cost.
        atpCost:
            config?.implemented
                ? motifCount *
                    ATP_PER_MOTIF_UNIT
                : null,
        consumesMotifs: false,
        recipeMatchesPPC,
        valid:
            recognizedMotifs &&
            recipeMatchesPPC !== false &&
            motifCount > 0,
        implemented:
            Boolean(config?.implemented),
        discoveryId:
            config?.discoveryId ?? null,
        // A claimed quest may satisfy progression without pretending that a
        // physical Polymerizer product was assembled. Runtime presentation
        // derives this alternate completion source from the quest record.
        completionQuestId:
            config?.completionQuestId ?? null,
        // null permits repeat assembly. A positive integer makes a functional
        // product a one-time unlock while retaining the existing inventory
        // record as the authoritative completion source.
        maxCompletions:
            Number.isSafeInteger(
                config?.maxCompletions
            ) &&
            config.maxCompletions > 0
                ? config.maxCompletions
                : null,
        lockedMessage:
            config?.lockedMessage ?? null
    });

}

const DEFINITIONS = Object.freeze(
    Object.fromEntries(
        Object.keys(PRODUCT_CONFIGS).map(
            id => [
                id,
                createDefinition(
                    id,
                    proteinLibrary[id]
                )
            ]
        )
    )
);

const PolymerizerRecipeCatalog =
    Object.freeze({

        get(id) {
            return DEFINITIONS[id] ?? null;
        },

        has(id) {
            return Boolean(this.get(id));
        },

        getAll() {
            return Object.values(DEFINITIONS);
        },

        getImplemented() {
            return this.getAll().filter(
                definition =>
                    definition.implemented
            );
        }

    });

export default PolymerizerRecipeCatalog;
