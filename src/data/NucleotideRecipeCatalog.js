// --------------------------------------------------
// NucleotideRecipeCatalog.js
// Pure, immutable Macromolecularizer nucleotide recipes.
// Runtime eligibility, speed upgrades, and synthesis state
// do not belong here.
// --------------------------------------------------

const BASE_SECONDS_PER_BOND = 30;

const IMPLEMENTED_NUCLEOTIDE_IDS =
    Object.freeze([
        "AMP",
        "GMP",
        "CMP",
        "UMP",
        "dAMP",
        "dGMP",
        "dCMP",
        "dTMP"
    ]);

const NUCLEOTIDE_METADATA =
    Object.freeze({

        // ------------------------------------------
        // RNA nucleotides — ribose
        // ------------------------------------------

        AMP: Object.freeze({
            name:
                "Adenosine Monophosphate",
            abbreviation: "A",
            nucleicAcidType: "RNA",
            baseId: "Adenine",
            sugarId: "Ribose",
            phosphateId: "PO4",
            description:
                "Adenine joined to ribose and phosphate."
        }),

        GMP: Object.freeze({
            name:
                "Guanosine Monophosphate",
            abbreviation: "G",
            nucleicAcidType: "RNA",
            baseId: "Guanine",
            sugarId: "Ribose",
            phosphateId: "PO4",
            description:
                "Guanine joined to ribose and phosphate."
        }),

        CMP: Object.freeze({
            name:
                "Cytidine Monophosphate",
            abbreviation: "C",
            nucleicAcidType: "RNA",
            baseId: "Cytosine",
            sugarId: "Ribose",
            phosphateId: "PO4",
            description:
                "Cytosine joined to ribose and phosphate."
        }),

        UMP: Object.freeze({
            name:
                "Uridine Monophosphate",
            abbreviation: "U",
            nucleicAcidType: "RNA",
            baseId: "Uracil",
            sugarId: "Ribose",
            phosphateId: "PO4",
            description:
                "Uracil joined to ribose and phosphate."
        }),

        // ------------------------------------------
        // DNA nucleotides — deoxyribose
        // ------------------------------------------

        dAMP: Object.freeze({
            name:
                "Deoxyadenosine Monophosphate",
            abbreviation: "A",
            nucleicAcidType: "DNA",
            baseId: "Adenine",
            sugarId: "Deoxyribose",
            phosphateId: "PO4",
            description:
                "Adenine joined to deoxyribose and phosphate."
        }),

        dGMP: Object.freeze({
            name:
                "Deoxyguanosine Monophosphate",
            abbreviation: "G",
            nucleicAcidType: "DNA",
            baseId: "Guanine",
            sugarId: "Deoxyribose",
            phosphateId: "PO4",
            description:
                "Guanine joined to deoxyribose and phosphate."
        }),

        dCMP: Object.freeze({
            name:
                "Deoxycytidine Monophosphate",
            abbreviation: "C",
            nucleicAcidType: "DNA",
            baseId: "Cytosine",
            sugarId: "Deoxyribose",
            phosphateId: "PO4",
            description:
                "Cytosine joined to deoxyribose and phosphate."
        }),

        dTMP: Object.freeze({
            name:
                "Deoxythymidine Monophosphate",
            abbreviation: "T",
            nucleicAcidType: "DNA",
            baseId: "Thymine",
            sugarId: "Deoxyribose",
            phosphateId: "PO4",
            description:
                "Thymine joined to deoxyribose and phosphate."
        })

    });

function createDefinition(id, metadata) {

    const components =
        Object.freeze([
            Object.freeze({
                id: metadata.baseId,
                quantity: 1,
                role:
                    "nitrogenous-base"
            }),

            Object.freeze({
                id: metadata.sugarId,
                quantity: 1,
                role:
                    "pentose-sugar"
            }),

            Object.freeze({
                id: metadata.phosphateId,
                quantity: 1,
                role:
                    "phosphate"
            })
        ]);

    const compositionCount =
        components.reduce(
            (total, component) =>
                total + component.quantity,
            0
        );

    const componentCount = 3;
    const assemblyBondCount = 2;

    return Object.freeze({
        id,

        name:
            metadata.name ?? id,

        abbreviation:
            metadata.abbreviation ?? id,

        category:
            "nucleotides",

        discoveryCategory: "molecules",

        productType:
            "nucleotide",

        nucleicAcidType:
            metadata.nucleicAcidType,

        description:
            metadata.description ?? "",

        info:
            metadata.info ??
            metadata.description ??
            "",

        baseId:
            metadata.baseId,

        sugarId:
            metadata.sugarId,

        phosphateId:
            metadata.phosphateId,

        components,

        componentCount,

        compositionCount,

        compositionValid:
            compositionCount ===
            componentCount,

        nucleotideCount: 1,

        bondType:
            "glycosidic-and-phosphoester",

        assemblyBondCount,

        secondsPerBond:
            BASE_SECONDS_PER_BOND,

        baseDurationSeconds:
            assemblyBondCount *
            BASE_SECONDS_PER_BOND,

        atpCost:
            assemblyBondCount,

        requiredReactionIds:
            Object.freeze([
                "dehydration"
            ]),

        consumesComponents:
            false,

        implemented:
            IMPLEMENTED_NUCLEOTIDE_IDS
                .includes(id)
    });

}

const DEFINITIONS =
    Object.freeze(
        Object.fromEntries(
            Object.entries(
                NUCLEOTIDE_METADATA
            ).map(
                ([id, metadata]) => [
                    id,
                    createDefinition(
                        id,
                        metadata
                    )
                ]
            )
        )
    );

const NucleotideRecipeCatalog =
    Object.freeze({

        has(id) {

            return Boolean(
                DEFINITIONS[id]
            );

        },

        get(id) {

            return DEFINITIONS[id] ??
                null;

        },

        getAll() {

            return Object.values(
                DEFINITIONS
            );

        },

        getImplemented() {

            return this.getAll()
                .filter(
                    definition =>
                        definition.implemented
                );

        }

    });

export {
    BASE_SECONDS_PER_BOND
};

export default NucleotideRecipeCatalog;