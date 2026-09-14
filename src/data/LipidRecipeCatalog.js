// Classroom lipid recipes. Only entries in ASSEMBLIES are playable;
// unlisted products are catalog previews, not executable recipes.
import MoleculeRecipeCatalog from "./MoleculeRecipeCatalog.js";
import { macromoleculeLipidLibrary } from "./macromoleculeLipidLibrary.js";

export const LIPID_GROUPS = Object.freeze([
    Object.freeze({ id: "membrane", label: "Membrane lipids" }),
    Object.freeze({ id: "storage", label: "Storage lipids" }),
    Object.freeze({ id: "signaling", label: "Signaling lipids" }),
    Object.freeze({ id: "modification", label: "Modification lipids" })
]);

// Synthesis checks that each component type has been made in Molecule Lab.
// These are introductory assembly models; ATP is a game cost, not a claim
// about the biochemical energy cost of any specific lipid pathway.
const ASSEMBLIES = Object.freeze({
    PC: Object.freeze({ componentIds: ["Glycerol", "PalmiticAcid", "OleicAcid", "PO4", "Choline"], bondCount: 4, bondType: "ester/phosphoester" }),
    PE: Object.freeze({ componentIds: ["Glycerol", "PalmiticAcid", "OleicAcid", "PO4", "Ethanolamine"], bondCount: 4, bondType: "ester/phosphoester" }),
    PS: Object.freeze({ componentIds: ["Glycerol", "PalmiticAcid", "OleicAcid", "PO4", "S"], bondCount: 4, bondType: "ester/phosphoester" }),
    PI: Object.freeze({ componentIds: ["Glycerol", "PalmiticAcid", "OleicAcid", "PO4", "Inositol"], bondCount: 4, bondType: "ester/phosphoester" }),
    ErgosterolOleate: Object.freeze({ componentIds: ["Ergosterol", "OleicAcid"], bondCount: 1, bondType: "ester" })
});

const definitions = Object.freeze(Object.values(macromoleculeLipidLibrary).map(product => {
    const assembly = ASSEMBLIES[product.id];
    return Object.freeze({
        ...product,
        category: "lipids",
        discoveryCategory: "molecules",
        implemented: Boolean(assembly),
        status: assembly ? "available" : "coming-soon",
        ...(assembly ? {
            monomers: Object.freeze(assembly.componentIds.map(id => Object.freeze({ id, quantity: 1 }))),
            monomerCount: assembly.componentIds.length,
            compositionCount: assembly.componentIds.length,
            compositionValid: true,
            bondCount: assembly.bondCount,
            bondType: assembly.bondType,
            atpCost: assembly.bondCount,
            requiredReactionIds: Object.freeze(["dehydration"]),
            consumesComponents: false
        } : {}),
        precursors: Object.freeze(product.precursorIds.map(id => {
            const molecule = MoleculeRecipeCatalog.get(id);
            const plannedLipid = macromoleculeLipidLibrary[id];
            return Object.freeze({
                id,
                name: molecule?.name ?? plannedLipid?.name ?? id,
                availableInMoleculeLab: Boolean(molecule?.implemented),
                kind: molecule ? "small-molecule" : plannedLipid ? "assembled-lipid" : "planned-intermediate"
            });
        }))
    });
}));

export default Object.freeze({
    get(id) { return definitions.find(recipe => recipe.id === id) ?? null; },
    getAll() { return definitions; },
    getByGroup(group) { return definitions.filter(recipe => recipe.groups.includes(group)); },
    getImplemented() { return definitions.filter(recipe => recipe.implemented); }
});
