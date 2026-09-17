// --------------------------------------------------
// PolymerizerRecipeCatalog.js
// Pure, immutable Polymerizer recipe definitions.
//
// Protein identity and simplified structural recipes remain
// authoritative in proteinLibrary. This adapter translates the
// library's compact PPC symbols into Macromolecularizer product IDs.
// --------------------------------------------------

import { proteinLibrary } from "./proteinLibrary.js";

const MOTIF_ID_BY_SYMBOL = Object.freeze({
    H: "H_helix",
    B: "B_sheet",
    L: "L_loop"
});

const ATP_PER_MOTIF_UNIT = 1;
const PRODUCT_CONFIGS = Object.freeze({
    Aquaporin: Object.freeze({
        name: "Aquaporin",
        implemented: true,
        discoveryId: "aquaporin",
        lockedMessage: null
    }),
    GlucoseTransporter: Object.freeze({
        name: "Glucose Transporter",
        implemented: false,
        discoveryId: null,
        lockedMessage:
            "Coming Soon — its PDB-based motif recipe, ATP cost, and release approval are not configured."
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

    const recipeMatchesPPC =
        motifRequirements.every(
            requirement =>
                safeCount(
                    ppcCounts[
                        requirement.symbol
                    ]
                ) === requirement.quantity
        ) &&
        Object.keys(ppcCounts).every(
            symbol =>
                safeCount(recipe[symbol]) ===
                    ppcCounts[symbol]
        );

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
        description:
            protein?.Info ?? "",
        source:
            protein?.Source ?? "",
        simplifiedStructure:
            protein?.PPC ?? "",
        motifRequirements:
            Object.freeze(
                motifRequirements
            ),
        motifCount,
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
            recipeMatchesPPC &&
            motifCount > 0,
        implemented:
            Boolean(config?.implemented),
        discoveryId:
            config?.discoveryId ?? null,
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
