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
        "dTMP",
        "NADPlus",
        "NADPPlus",
        "FAD",
        "CoA"
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
        }),
                // ------------------------------------------
        // Nucleotide cofactors
        // ------------------------------------------

        NADPlus: Object.freeze({
            name:
                "Nicotinamide Adenine Dinucleotide",
            abbreviation:
                "NAD+",
            nucleicAcidType:
                "COF",
            productType:
                "dinucleotide-cofactor",
            components: Object.freeze([
                Object.freeze({
                    id: "AMP",
                    quantity: 1,
                    role:
                        "adenosine-nucleotide",
                    sourceZoneId:
                        "macromolecularizer"
                }),
                Object.freeze({
                    id: "Nicotinamide",
                    quantity: 1,
                    role:
                        "nicotinamide",
                    sourceZoneId:
                        "moleculeLab"
                }),
                Object.freeze({
                    id: "Ribose",
                    quantity: 1,
                    role:
                        "pentose-sugar",
                    sourceZoneId:
                        "moleculeLab"
                }),
                Object.freeze({
                    id: "PO4",
                    quantity: 1,
                    role:
                        "phosphate",
                    sourceZoneId:
                        "moleculeLab"
                })
            ]),
            assemblyBondCount: 3,
            nucleotideCount: 2,
            bondType:
                "phosphate-bridge",
            description:
                "AMP joined with nicotinamide, ribose, and phosphate to form the dinucleotide cofactor NAD+."
        }),

        NADPPlus: Object.freeze({
            name:
                "Nicotinamide Adenine Dinucleotide Phosphate",
            abbreviation:
                "NADP+",
            nucleicAcidType:
                "COF",
            productType:
                "phosphorylated-dinucleotide-cofactor",
            components: Object.freeze([
                Object.freeze({
                    id: "NADPlus",
                    quantity: 1,
                    role:
                        "nicotinamide-adenine-dinucleotide",
                    sourceZoneId:
                        "macromolecularizer"
                }),
                Object.freeze({
                    id: "PO4",
                    quantity: 1,
                    role:
                        "phosphate",
                    sourceZoneId:
                        "moleculeLab"
                })
            ]),
            assemblyBondCount: 1,
            nucleotideCount: 2,
            bondType:
                "phosphoester",
            description:
                "NAD+ joined to an additional phosphate to form the oxidized electron carrier NADP+."
        }),

        FAD: Object.freeze({
            name:
                "Flavin Adenine Dinucleotide",
            abbreviation:
                "FAD",
            nucleicAcidType:
                "COF",
            productType:
                "dinucleotide-cofactor",
            components: Object.freeze([
                Object.freeze({
                    id: "AMP",
                    quantity: 1,
                    role:
                        "adenosine-nucleotide",
                    sourceZoneId:
                        "macromolecularizer"
                }),
                Object.freeze({
                    id: "Riboflavin",
                    quantity: 1,
                    role:
                        "flavin-vitamin-precursor",
                    sourceZoneId:
                        "moleculeLab"
                }),
                Object.freeze({
                    id: "PO4",
                    quantity: 1,
                    role:
                        "phosphate",
                    sourceZoneId:
                        "moleculeLab"
                })
            ]),
            assemblyBondCount: 2,
            nucleotideCount: 2,
            bondType:
                "phosphate-bridge",
            description:
                "AMP joined with riboflavin and phosphate to form the oxidized electron carrier FAD."
        }),

        CoA: Object.freeze({
            name:
                "Coenzyme A",
            abbreviation:
                "CoA",
            nucleicAcidType:
                "COF",
            productType:
                "coenzyme",
            components: Object.freeze([
                Object.freeze({
                    id: "AMP",
                    quantity: 1,
                    role:
                        "adenosine-nucleotide",
                    sourceZoneId:
                        "macromolecularizer"
                }),
                Object.freeze({
                    id: "PantothenicAcid",
                    quantity: 1,
                    role:
                        "vitamin-b5-precursor",
                    sourceZoneId:
                        "moleculeLab"
                }),
                Object.freeze({
                    id: "C",
                    quantity: 1,
                    role:
                        "cysteine-sulfur-source",
                    sourceZoneId:
                        "moleculeLab"
                }),
                Object.freeze({
                    id: "PO4",
                    quantity: 2,
                    role:
                        "phosphate",
                    sourceZoneId:
                        "moleculeLab"
                })
            ]),
            assemblyBondCount: 4,
            nucleotideCount: 1,
            bondType:
                "coenzyme-assembly",
            description:
                "AMP joined with pantothenic acid, cysteine, and two phosphate units to form coenzyme A."
        })

    });

function createDefinition(id, metadata) {

        const defaultComponents =
        Object.freeze([
            Object.freeze({
                id: metadata.baseId,
                quantity: 1,
                role:
                    "nitrogenous-base",
                sourceZoneId:
                    "moleculeLab"
            }),

            Object.freeze({
                id: metadata.sugarId,
                quantity: 1,
                role:
                    "pentose-sugar",
                sourceZoneId:
                    "moleculeLab"
            }),

            Object.freeze({
                id: metadata.phosphateId,
                quantity: 1,
                role:
                    "phosphate",
                sourceZoneId:
                    "moleculeLab"
            })
        ]);

    const components =
        Object.freeze(
            (
                metadata.components ??
                defaultComponents
            ).map(component =>
                Object.freeze({
                    id:
                        component.id,
                    quantity:
                        component.quantity ?? 1,
                    role:
                        component.role ??
                        "component",
                    sourceZoneId:
                        component.sourceZoneId ??
                        "moleculeLab"
                })
            )
        );

    const compositionCount =
        components.reduce(
            (total, component) =>
                total + component.quantity,
            0
        );

        const componentCount =
        metadata.componentCount ??
        compositionCount;

    const assemblyBondCount =
        metadata.assemblyBondCount ??
        2;

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
            metadata.productType ??
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

                nucleotideCount:
            metadata.nucleotideCount ??
            1,

                bondType:
            metadata.bondType ??
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
