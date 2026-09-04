// --------------------------------------------------
// MotifRecipeCatalog.js
// Pure, immutable Macromolecularizer recipe definitions.
// Runtime eligibility and synthesis state do not belong here.
// --------------------------------------------------

import { motifLibrary } from "./motifLibrary.js";

const IMPLEMENTED_MOTIF_IDS = Object.freeze([
    "H_helix"
]);

function safePositiveInteger(value) {

    return Number.isFinite(value)
        ? Math.max(0, Math.floor(value))
        : 0;

}

function createDefinition(id, metadata) {

    const aminoAcidCount =
        safePositiveInteger(
            metadata.aa_count
        );

    const aminoAcids =
        Object.entries(
            metadata.costs ?? {}
        ).map(
            ([aminoAcidId, quantity]) =>
                Object.freeze({
                    id: aminoAcidId,
                    quantity:
                        safePositiveInteger(
                            quantity
                        )
                })
        );

    const compositionCount =
        aminoAcids.reduce(
            (total, requirement) =>
                total + requirement.quantity,
            0
        );

    return Object.freeze({
        id,
        name: metadata.name ?? id,
        category:
            metadata.category ??
            "motifs",
        description:
            metadata.description ??
            "",
        info:
            metadata.info ??
            metadata.description ??
            "",
        aminoAcidCount,
        peptideBondCount:
            Math.max(
                0,
                aminoAcidCount - 1
            ),
        atpCost:
            Math.max(
                0,
                aminoAcidCount - 1
            ),
        aminoAcids:
            Object.freeze(aminoAcids),
        requiredReactionIds:
            Object.freeze([
                "dehydration"
            ]),
        compositionCount,
        compositionValid:
            compositionCount ===
            aminoAcidCount,
        implemented:
            IMPLEMENTED_MOTIF_IDS
                .includes(id)
    });

}

const DEFINITIONS =
    Object.freeze(
        Object.fromEntries(
            Object.entries(
                motifLibrary
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

const MotifRecipeCatalog =
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
                        definition
                            .implemented
                );

        }

    });

export default MotifRecipeCatalog;
