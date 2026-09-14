/**
 * Final assembled lipids for the Macromolecularizer L tab.
 * A precursor names an ingredient or intermediate, not an atom-level 3D model.
 * For example, a phospholipid combines a glycerol-derived backbone, fatty-acid
 * tails, phosphate and a head group through a biochemical pathway. The existing
 * lipidLibrary.js supplies 3D coordinates for small Molecule Lab components;
 * it must not be used as the final-product inventory or synthesis recipe.
 *
 * These are product descriptions and classroom component lists, not exact
 * cellular reaction stoichiometry. LipidRecipeCatalog declares which products
 * have playable synthesis and which remain future products.
 * DAG belongs to both storage and signaling; its single ID prevents duplicates.
 */

const products = [
    ["PC", "Phosphatidylcholine", ["membrane"], ["Glycerol", "PalmiticAcid", "OleicAcid", "PO4", "Choline"], "Glycerol, two fatty acids, phosphate, and a choline head group."],
    ["PE", "Phosphatidylethanolamine", ["membrane"], ["Glycerol", "PalmiticAcid", "OleicAcid", "PO4", "Ethanolamine"], "Glycerol, two fatty acids, phosphate, and an ethanolamine head group."],
    ["PS", "Phosphatidylserine", ["membrane"], ["Glycerol", "PalmiticAcid", "OleicAcid", "PO4", "S"], "Glycerol, two fatty acids, phosphate, and a serine head group."],
    ["PI", "Phosphatidylinositol", ["membrane"], ["Glycerol", "PalmiticAcid", "OleicAcid", "PO4", "Inositol"], "Glycerol, two fatty acids, phosphate, and an inositol head group."],
    ["Sphingomyelin", "Sphingomyelin", ["membrane"], ["S", "PalmiticAcid", "Choline", "Sphingosine"], "Sphingosine-based membrane lipid; sphingosine is not yet available."],
    ["Gangliosides", "Gangliosides", ["membrane"], ["Sphingosine", "Glucose", "Galactose", "SialicAcid", "UDPSugars", "CMPSialicAcid"], "Sphingosine-based glycolipids with sugar and sialic-acid groups."],
    ["Cardiolipin", "Cardiolipin", ["membrane"], ["Glycerol", "PalmiticAcid", "OleicAcid", "PO4", "Phosphatidylglycerol"], "Mitochondrial cardiolipin requires two phosphatidyl units and a glycerol bridge."],
    ["TAG", "Triacylglycerol", ["storage"], ["Glycerol", "PalmiticAcid", "OleicAcid", "DAG", "FattyAcylCoA"], "Energy Storage and Survival"],
    ["DAG", "Diacylglycerol", ["storage", "signaling"], ["Glycerol", "PalmiticAcid", "OleicAcid", "PhosphatidicAcid", "FattyAcylCoA"], "Primary second messenger in protists."],
    ["ErgosterolOleate", "Ergosterol oleate", ["storage"], ["Ergosterol", "OleicAcid"], "Sterol esters support membrane remodeling during stress or starvation and help regulate membrane fluidity."],
    ["PIP2", "PI(4,5)P₂", ["signaling"], ["PI", "PO4", "PI4P"], "Sequential ATP-dependent PI phosphorylation needs PI4P and phosphoinositide kinases."],
    ["PIP3", "PI(3,4,5)P₃", ["signaling"], ["PIP2", "PO4"], "ATP-dependent PI3-kinase phosphorylates PI(4,5)P₂; DAG is a separate product of PI(4,5)P₂ hydrolysis."],
    ["Farnesyl", "Farnesyl (FPP donor)", ["modification"], ["IPP", "DMAPP", "FPP"], "Farnesyl is a transferable isoprenoid group, not a free storage lipid; FPP supply is pending."],
    ["Geranylgeranyl", "Geranylgeranyl (GGPP donor)", ["modification"], ["IPP", "DMAPP", "FPP", "GGPP"], "Geranylgeranyl is a transferable isoprenoid group; GGPP supply is pending."],
    ["Dolichol14", "Dolichol-14", ["modification"], ["Isoprene"], "Fourteen isoprene units form a polyisoprenoid carrier; isoprene is coming soon."],
    ["CoQ", "Coenzyme Q", ["modification"], ["IPP", "DMAPP", "FPP", "PolyprenylDiphosphate", "4Hydroxybenzoate"], "Quinone head and polyisoprenoid tail pathways are pending; specify CoQ species later."]
];

export const macromoleculeLipidLibrary = Object.freeze(Object.fromEntries(
    products.map(([id, name, groups, precursorIds, description]) => [
        id,
        Object.freeze({
            id, name, description,
            groups: Object.freeze([...groups]),
            precursorIds: Object.freeze([...precursorIds]),
            // Playable status and ATP costs are defined by LipidRecipeCatalog.
        })
    ])
));
