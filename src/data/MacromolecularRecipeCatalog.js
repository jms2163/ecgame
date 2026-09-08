// Aggregate assembly recipes without putting carbohydrates in the motif library.
import MotifRecipeCatalog from "./MotifRecipeCatalog.js";
import CarbohydrateRecipeCatalog from "./CarbohydrateRecipeCatalog.js";
import NucleotideRecipeCatalog from "./NucleotideRecipeCatalog.js";

const definitions = Object.freeze([
    ...MotifRecipeCatalog.getImplemented().map(recipe => Object.freeze({
        ...recipe,
        discoveryCategory: "motifs",
        monomers: recipe.aminoAcids,
        monomerCount: recipe.aminoAcidCount,
        bondCount: recipe.peptideBondCount,
        bondType: "peptide"
    })),
    ...CarbohydrateRecipeCatalog.getAll(),
    ...NucleotideRecipeCatalog.getImplemented().map(recipe => Object.freeze({
        ...recipe,
        discoveryCategory: "molecules",
        monomers: recipe.components,
        monomerCount: recipe.componentCount,
        bondCount: recipe.assemblyBondCount,
        bondType: recipe.bondType
    }))
]);

export default Object.freeze({
    get(id) { return definitions.find(recipe => recipe.id === id) ?? null; },
    has(id) { return Boolean(this.get(id)); },
    getImplemented() { return definitions; },
    getAll() { return definitions; }
});
