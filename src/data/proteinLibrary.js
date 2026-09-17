// Simplified structural stubs use only the three Macromolecularizer motifs:
// H (alpha helix), B (beta sheet), and L (loop). These are gameplay-scale
// placeholders until each protein receives a PDB-based recipe.
export const proteinLibrary =  Object.freeze({
  "Aquaporin": {
    "PPC": "HLHLHLHLHLHLHLH",
    "Recipe": {"H": 8, "L": 7},
    "Kilodaltons": 25.4,
    "Class": "Transport",
    "Function": "Water channel; increases osmosis rate",
    "Tier": 1,
    "Location": "PlasmaMembrane",
    "Requires": ["AminoAcids", "BasicTranscription"],
    "Source": "1RC2",
    "Models": {},
    "Info": "Integral membrane channel protein that selectively conducts water molecules while preventing proton passage. Essential for cellular osmotic balance."
  },
  "GlucoseTransporter": {
    "PPC": "HBLLHB",
    "Recipe": {"B": 2, "L": 2, "H": 2},
    "Class": "Transport",
    "Function": "Moves glucose into cytosol",
    "Tier": 1,
    "Location": "PlasmaMembrane",
    "Requires": ["AminoAcids", "BasicTranscription"],
    "Source": "4LDS",
    "Models": {},
    "Info": "Carrier protein that facilitates passive transport of glucose across the plasma membrane down its concentration gradient."
  },
  /* ============================================================
   Active Transport Pumps & Channels (Bio-Craft Core Systems)
   ------------------------------------------------------------
   Amoebae rely on a small set of essential pumps to regulate:
     • Ion gradients
     • Osmotic balance
     • Contractile vacuole filling
     • Calcium signaling (Ca2+ spikes)
     • pH regulation

   Key concepts:
     - ER stores Ca2+ and releases it via IP3 receptors.
     - Contractile vacuole becomes hyperosmotic using H+ and Cl- pumps.
     - Aquaporins move water rapidly into the vacuole.
     - Exocytosis empties the vacuole when full.

   These pumps form the backbone of realistic cell physiology
   for your simulation.
   ============================================================ */

"SodiumPotassiumPump": {
  "PPC": "BBHHLBH",
  "Recipe": {"B": 3, "H": 3, "L": 1},
  "Class": "ActiveTransport",
  "Function": "Maintains ion gradients; consumes ATP",
  "Tier": 2,
  "Location": "PlasmaMembrane",
  "Requires": ["Tier1_Proteins", "ATPProduction"],
  "Source": "",
  "Models": {},
  "Info": "ATP-driven pump that exports Na+ and imports K+, maintaining membrane potential and osmotic stability."
},

"ProtonPump": {
  "PPC": "BHBBH",
  "Recipe": {"B": 3, "H": 2},
  "Class": "ActiveTransport",
  "Function": "Acidifies vacuole; drives water influx",
  "Tier": 2,
  "Location": "ContractileVacuole",
  "Requires": ["Tier1_Proteins", "ATPProduction"],
  "Source": "",
  "Models": {},
  "Info": "V-ATPase pump that moves H+ into the contractile vacuole, increasing osmolarity and drawing water inward through aquaporins."
},

"CalciumPump": {
  "PPC": "BBHHLH",
  "Recipe": {"B": 3, "H": 3, "L": 1},
  "Class": "ActiveTransport",
  "Function": "Resets Ca2+ spikes; maintains low cytosolic Ca2+",
  "Tier": 2,
  "Location": "PlasmaMembrane",
  "Requires": ["Tier1_Proteins", "ATPProduction"],
  "Source": "",
  "Models": {},
  "Info": "PMCA/SERCA-like ATPase that pumps Ca2+ out of the cytosol or into ER stores, enabling Ca2+ signaling cycles."
},

"IP3Receptor": {
  "PPC": "BBHHH",
  "Recipe": {"B": 3, "H": 3},
  "Class": "Channel",
  "Function": "Releases Ca2+ from ER stores",
  "Tier": 2,
  "Location": "EndoplasmicReticulum",
  "Requires": ["Tier1_Proteins"],
  "Source": "",
  "Models": {},
  "Info": "Ligand-gated Ca2+ channel activated by IP3; generates Ca2+ spikes for intracellular signaling and movement."
},

"ChlorideTransporter": {
  "PPC": "BBHHL",
  "Recipe": {"B": 2, "L": 1, "H": 2},
  "Class": "ActiveTransport",
  "Function": "Raises vacuole osmolarity",
  "Tier": 2,
  "Location": "ContractileVacuole",
  "Requires": ["Tier1_Proteins", "ATPProduction"],
  "Source": "",
  "Models": {},
  "Info": "Cl- transporter that increases osmolarity inside the contractile vacuole, enhancing water uptake and supporting exocytosis."
},
  "CalciumChannel": {
    "PPC": "HLBBHH",
    "Recipe": {"B": 2, "H": 3, "L": 1},
    "Class": "Transport",
    "Function": "Calcium signaling; triggers vesicle release",
    "Tier": 2,
    "Location": "ER",
    "Requires": ["Tier1_Proteins"],
    "Source": "",
    "Models": {},
    "Info": "Voltage- or ligand-gated channel that mediates calcium ion influx into the cytosol, serving as a primary intracellular second messenger."
  },
  "Actin": {
    "PPC": "LLHHHB",
    "Recipe": {"L": 2, "H": 3, "B": 1},
    "Class": "Cytoskeleton",
    "Function": "Structural support; vesicle highway anchor",
    "Tier": 1,
    "Requires": ["AminoAcids"],
    "Source": "",
    "Models": {},
    "Info": "Abundant microfilament protein forming dynamic networks beneath the plasma membrane to maintain cell shape and drive motility."
  },
  "Tubulin": {
    "PPC": "BHLLHB",
    "Recipe": {"B": 2, "L": 2, "H": 2},
    "Class": "Cytoskeleton",
    "Function": "Microtubule formation; vesicle transport",
    "Tier": 2,
    "Requires": ["Tier1_Proteins"],
    "Source": "",
    "Models": {},
    "Info": "Globular protein subunits that polymerize into hollow microtubules, serving as tracks for intracellular motor proteins."
  },
  "Collagen": {
    "PPC": "HHHBBB",
    "Recipe": {"H": 3, "B": 3},
    "Class": "ECM",
    "Function": "Extracellular matrix strength",
    "Tier": 2,
    "Requires": ["Tier1_Proteins"],
    "Source": "",
    "Models": {},
    "Info": "Fibrous structural protein featuring a triple helix architecture that provides high tensile strength to connective tissues."
  },
  "Elastin": {
    "PPC": "LHLHLH",
    "Recipe": {"L": 3, "H": 3},
    "Class": "ECM",
    "Function": "Elasticity; reduces damage from stress",
    "Tier": 2,
    "Requires": ["Tier1_Proteins"],
    "Source": "",
    "Models": {},
    "Info": "Highly elastic extracellular matrix protein allowing tissues and organs to resume their shape after stretching or contracting."
  },
  "GProtein": {
    "PPC": "HLHBLH",
    "Recipe": {"L": 2, "H": 3, "B": 1},
    "Class": "Signaling",
    "Function": "Signal relay; boosts tissue communication",
    "Tier": 2,
    "Requires": ["Tier1_Proteins"],
    "Source": "",
    "Models": {},
    "Info": "Heterotrimeric molecular switch proteins that transmit extracellular signals received by GPCRs to internal downstream effector enzymes."
  },
  "Kinase": {
    "PPC": "BHLHBH",
    "Recipe": {"B": 2, "L": 1, "H": 3},
    "Class": "Enzyme",
    "Function": "Phosphorylation; boosts metabolic reactions",
    "Tier": 2,
    "Requires": ["Tier1_Proteins"],
    "Source": "",
    "Models": {},
    "Info": "Enzyme that transfers phosphate groups from high-energy donor molecules like ATP to specific target substrate proteins."
  },
  "Phosphatase": {
    "PPC": "LBHHHL",
    "Recipe": {"L": 2, "B": 2, "H": 2},
    "Class": "Enzyme",
    "Function": "Dephosphorylation; resets signaling pathways",
    "Tier": 2,
    "Requires": ["Tier1_Proteins", "Kinase"],
    "Source": "",
    "Models": {},
    "Info": "Regulatory enzyme that removes phosphate groups from phosphorylated target proteins, acting as a molecular off-switch."
  },
  "ReceptorTyrosineKinase": {
    "PPC": "BBHLLBH",
    "Recipe": {"B": 3, "L": 2, "H": 2},
    "Class": "Signaling",
    "Function": "Growth signals; boosts clan tissue bonuses",
    "Tier": 3,
    "Requires": ["Tier2_Proteins", "SignalingUnlocked"],
    "Source": "",
    "Models": {},
    "Info": "High-affinity cell surface receptor that binds peptide growth factors and triggers intracellular kinase cascades for cell division."
  },
  "Hexokinase": {
    // Motif totals were measured from PDB 1BG3. Their exact linear order is
    // intentionally left unspecified rather than inventing an H/B/L string.
    "PPC": "",
    "Recipe": {"H": 22, "B": 25, "L": 48},
    "Class": "Metabolism",
    "Function": "First step of glycolysis; glucose → G6P",
    "Tier": 1,
    "Location": "Cytosol",
    "Requires": ["AminoAcids", "GlycolysisUnlocked"],
    "Source": "1BG3",
    "Models": {},
    "Info": "Cytosolic enzyme that phosphorylates glucose to trap it inside the cell and initiate cellular respiration pathways."
  },
  "PhosphoglucoseIsomerase": {
    // Motif totals were measured from PDB 2PGI. Their exact linear order is
    // intentionally left unspecified rather than inventing an H/B/L string.
    "PPC": "",
    "Recipe": {"H": 14, "B": 10, "L": 25},
    "Class": "Metabolism",
    "Function": "Second step of glycolysis; G6P → F6P",
    "Tier": 1,
    "Location": "Cytosol",
    "Requires": ["Hexokinase", "GlycolysisUnlocked"],
    "Source": "2PGI",
    "Models": {},
    "Info": "Cytosolic enzyme that reversibly converts glucose-6-phosphate into fructose-6-phosphate during glycolysis."
  },
  "Phosphofructokinase": {
    "PPC": "BHLHLHB",
    "Recipe": {"B": 2, "L": 1, "H": 4},
    "Class": "Metabolism",
    "Function": "Rate‑limiting glycolysis enzyme",
    "Tier": 2,
    "Requires": ["Hexokinase", "GlycolysisUnlocked"],
    "Source": "",
    "Models": {},
    "Info": "Allosteric regulatory enzyme controlling the primary flux rate and pace of the glycolysis metabolic pathway."
  },
  "ATP_Synthase": {
    "PPC": "BBHBBH",
    "Recipe": {"B": 4, "H": 2},
    "Class": "Metabolism",
    "Function": "Produces ATP from proton gradient",
    "Tier": 3,
    "Location": "Mitochondria",
    "Requires": ["MitochondriaUnlocked", "RespirationUnlocked"],
    "Source": "",
    "Models": {},
    "Info": "Remarkable rotary nanomachine that synthesizes ATP from ADP and inorganic phosphate using energy from a transmembrane proton flux."
  },
  "CytochromeC": {
    "PPC": "LBBHLH",
    "Recipe": {"B": 2, "L": 2, "H": 2},
    "Class": "Respiration",
    "Function": "Electron transport chain carrier",
    "Tier": 2,
    "Requires": ["RespirationUnlocked"],
    "Source": "",
    "Models": {},
    "Info": "Small heme protein associated with the inner mitochondrial membrane that shuttles electrons between Complex III and Complex IV."
  },
  "NADH_Dehydrogenase": {
    "PPC": "BHBHLBH",
    "Recipe": {"B": 3, "H": 3, "L": 1},
    "Class": "Respiration",
    "Function": "ETC Complex I; generates proton gradient",
    "Tier": 3,
    "Requires": ["RespirationUnlocked", "MitochondriaUnlocked"],
    "Source": "",
    "Models": {},
    "Info": "Massive multi-subunit membrane enzyme complex that initiates the electron transport chain by oxidizing NADH."
  },
  "RuBisCO": {
    "PPC": "HLBBHLH",
    "Recipe": {"B": 2, "L": 1, "H": 4},
    "Class": "Photosynthesis",
    "Function": "Carbon fixation; Calvin cycle entry",
    "Tier": 3,
    "PlantOnly": true,
    "Requires": ["ChloroplastUnlocked", "CalvinCycleUnlocked"],
    "Source": "",
    "Models": {},
    "Info": "Primary carbon-fixing enzyme of photosynthesis, catalyzing the addition of atmospheric carbon dioxide to ribulose bisphosphate."
  },
  "PhotosystemII": {
    "PPC": "BBHHLBH",
    "Recipe": {"B": 3, "H": 3, "L": 1},
    "Class": "Photosynthesis",
    "Function": "Splits water; generates electrons",
    "Tier": 3,
    "PlantOnly": true,
    "Requires": ["ChloroplastUnlocked"],
    "Source": "",
    "Models": {},
    "Info": "Light-driven water-plastoquinone oxidoreductase complex that performs the initial photolysis of water in plant chloroplasts."
  },
  "PhotosystemI": {
    "PPC": "BHLHBHB",
    "Recipe": {"B": 3, "H": 3, "L": 1},
    "Class": "Photosynthesis",
    "Function": "Produces NADPH",
    "Tier": 3,
    "PlantOnly": true,
    "Requires": ["ChloroplastUnlocked", "PhotosystemII"],
    "Source": "",
    "Models": {},
    "Info": "Integral membrane protein complex that uses light energy to transfer electrons across the thylakoid membrane to generate NADPH."
  },
  "ATP_Synthase_Chloro": {
    "PPC": "BBHBBH",
    "Recipe": {"B": 4, "H": 2},
    "Class": "Photosynthesis",
    "Function": "Chloroplast ATP production",
    "Tier": 3,
    "PlantOnly": true,
    "Requires": ["ChloroplastUnlocked"],
    "Source": "",
    "Models": {},
    "Info": "Chloroplast-localized rotary motor engine that harnesses light-induced proton motive force to produce chemical energy currency."
  },
  "DNA_Polymerase": {
    "PPC": "BHLHBLH",
    "Recipe": {"B": 2, "L": 1, "H": 3},
    "Class": "Replication",
    "Function": "Copies DNA during prestige",
    "Tier": 3,
    "Requires": ["NucleusUnlocked", "Helicase"],
    "Source": "",
    "Models": {},
    "Info": "Essential enzyme family that synthesizes DNA molecules from deoxyribonucleotides, ensuring accurate genomic duplication."
  },
  "RNA_Polymerase": {
    "PPC": "HLHBHBH",
    "Recipe": {"H": 4, "B": 2, "L": 1},
    "Class": "Transcription",
    "Function": "Creates mRNA from DNA",
    "Tier": 2,
    "Requires": ["BasicTranscription"],
    "Source": "",
    "Models": {},
    "Info": "Multi-subunit enzyme that synthesizes messenger RNA strands by reading genetic sequences along a DNA template strand."
  },
  "Helicase": {
    "PPC": "LHLBHB",
    "Recipe": {"L": 2, "B": 1, "H": 3},
    "Class": "Replication",
    "Function": "Unwinds DNA",
    "Tier": 2,
    "Requires": ["Tier1_Proteins"],
    "Source": "",
    "Models": {},
    "Info": "Motor protein that uses ATP hydrolysis to separate double-stranded nucleic acid polymers during replication forks."
  },
  "Ligase": {
    "PPC": "HLHLHB",
    "Recipe": {"L": 2, "H": 4, "B": 1},
    "Class": "Replication",
    "Function": "Seals DNA fragments",
    "Tier": 1,
    "Requires": ["AminoAcids"],
    "Source": "",
    "Models": {},
    "Info": "Specialized enzyme that joins broken DNA strand fragments together by catalyzing phosphodiester bond formation."
  },
  "Antibody": {
    "PPC": "BBLLHBH",
    "Recipe": {"B": 3, "L": 2, "H": 2},
    "Class": "Defense",
    "Function": "Neutralizes pathogens; boosts tissue immunity",
    "Tier": 3,
    "Requires": ["ImmuneSystemUnlocked"],
    "Source": "",
    "Models": {},
    "Info": "Y-shaped immune system protein produced by plasma cells to identify and neutralize foreign antigens like bacteria and viruses."
  },
  "Chaperonin": {
    "PPC": "LHBHLHB",
    "Recipe": {"L": 2, "H": 3, "B": 1},
    "Class": "Folding",
    "Function": "Improves PPC folding success rate",
    "Tier": 3,
    "Requires": ["RoughER_Unlocked"],
    "Source": "",
    "Models": {},
    "Info": "Barrel-shaped protein complex that assists the proper physical folding of newly translated proteins inside cells."
  },
  "Ubiquitin": {
    "PPC": "LHLLH",
    "Recipe": {"L": 3, "H": 2},
    "Class": "Regulation",
    "Function": "Marks damaged proteins for recycling",
    "Tier": 1,
    "Requires": ["AminoAcids"],
    "Source": "",
    "Models": {},
    "Info": "Small regulatory protein tag attached to target proteins to signal cellular degradation and recycling machinery."
  }
});
