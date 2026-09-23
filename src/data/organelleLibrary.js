// Static organelle profiles. JSON-compatible data only; never copy into saves.
// Null figure.src means no PNG has been supplied. The overview renderer must
// omit the image until a real asset path is assigned.
// Deferred unlocks and planned benefits are descriptive ONLY. Empty requirements
// do not grant access. Existing game rules remain authoritative in Milestone 3.
// Each key is an existing labFocusId. Map feature IDs and geometry stay in
// CellMapLayout; ectoplasm/endoplasm share cytoplasm, pseudopodia shares cytoskeleton.

const organelleLibrary = {
    "plasma_membrane": {
        "id": "plasma_membrane",
        "name": "Plasma Membrane",
        "classification": "cell boundary",
        "shortSummary": "Controls exchange between the cell and its environment.",
        "description": "A phospholipid bilayer and its associated proteins form a selectively permeable boundary. Transport proteins help regulate the movement of substances between the cytoplasm and the environment.",
        "figure": {
    "src": "./public/assets/organelles/plasma-membrane-labeled.png",
    "alt": "Diagram of the plasma membrane labeling the phospholipid bilayer, transport proteins, and aquaporin.",
    "caption": "Major structural and transport components of the plasma membrane."
},
       "components": [
    {
        "id": "phospholipid_bilayer",
        "label": "Phospholipid Bilayer",
        "description": "Forms the fundamental structural framework and selective barrier of the membrane."
    },
    {
        "id": "cholesterol",
        "label": "Cholesterol",
        "description": "Regulates membrane fluidity and stability under varying temperatures."
    },
    {
        "id": "integral_protein",
        "label": "Integral Protein",
        "description": "Spans the phospholipid bilayer, facilitating transport of substances, cell signaling, and structural support."
    },
    {
        "id": "peripheral_protein",
        "label": "Peripheral Protein",
        "description": "Attaches loosely to the membrane’s inner or outer surface, assisting in cellular signaling and structural linkage."
    },
    {
        "id": "carbohydrate",
        "label": "Carbohydrate",
        "description": "Acts as a cellular identifier or marker, contributing to cellular recognition and interaction on the extracellular surface."
    },
    {
        "id": "glycoprotein",
        "label": "Glycoprotein",
        "description": "A protein with attached carbohydrate chains, playing a vital role in cell-cell recognition, adhesion, and signaling."
    },
    {
        "id": "glycolipid",
        "label": "Glycolipid",
        "description": "A lipid with attached carbohydrate chains, helping to stabilize the membrane and facilitate cellular recognition."
    }
],
        "benefits": [
            {
                "id": "plasma_membrane_benefit",
                "label": "Membrane Health",
                "description": "Supports selective transport and membrane integrity.",
                "status": "planned",
                "effectReference": null
            }
        ],
        "unlock": {
            "status": "deferred",
            "mode": "all",
            "requirements": [],
            "proposal": "Retain the existing plasma membrane access rule.",
            "displayRequirement": null
        }
    },
    "cytoplasm": {
        "id": "cytoplasm",
        "name": "Cytoplasm",
        "classification": "cell region",
        "shortSummary": "Contains the cytosol and cellular structures outside the nucleus.",
        "description": "Contains the cytosol and cellular structures outside the nucleus.",
        "figure": {
            "src": null,
            "alt": "",
            "caption": ""
        },
        "components": [],
        "benefits": [
            {
                "id": "cytoplasm_benefit",
                "label": "Reaction Efficiency",
                "description": "Proposed benefit: improved efficiency of cellular reactions.",
                "status": "planned",
                "effectReference": null
            }
        ],
        "unlock": {
            "status": "deferred",
            "mode": "all",
            "requirements": [],
            "proposal": null
        }
    },
    "nucleus": {
        "id": "nucleus",
        "name": "Nucleus",
        "classification": "organelle",
        "shortSummary": "Houses the cell’s nuclear DNA.",
        "description": "Houses the cell’s nuclear DNA.",
        "figure": {
    "src": "./public/assets/organelles/nucleus-labeled.png",
    "alt": "Diagram of the cell nucleus and surrounding endoplasmic reticulum, labeling the endoplasmic reticulum, nucleolus, chromatin, nucleoplasm, nuclear pore, and nuclear envelope.",
    "caption": "Major structural and functional components of the cell nucleus and the closely associated endoplasmic reticulum."
},
        "components": [
    {
        "id": "endoplasmic_reticulum",
        "label": "Endoplasmic Reticulum",
        "description": "A continuous network of membranous sacs and tubules continuous with the nuclear envelope, involved in protein and lipid synthesis."
    },
    {
        "id": "nucleolus",
        "label": "Nucleolus",
        "description": "A dense, non-membrane-bound region within the nucleus dedicated to the assembly of ribosomal subunits."
    },
    {
        "id": "chromatin",
        "label": "Chromatin",
        "description": "A complex of DNA and proteins that condenses to form chromosomes, carrying the cell’s genetic blueprint."
    },
    {
        "id": "nucleoplasm",
        "label": "Nucleoplasm",
        "description": "The semi-solid, gel-like matrix inside the nucleus that suspends and protects the chromatin and nucleolus."
    },
    {
        "id": "nuclear_pore",
        "label": "Nuclear Pore",
        "description": "Small, protein-lined channels spanning the nuclear envelope that regulate the exchange of materials between the nucleoplasm and cytoplasm."
    },
    {
        "id": "nuclear_envelope",
        "label": "Nuclear Envelope",
        "description": "A double-membrane barrier encloses the genetic material and separates the nucleus' contents from the cytoplasm."
    }
],
        "benefits": [
            {
                "id": "nucleus_benefit",
                "label": "Genetic Research",
                "description": "Proposed benefit: access to genetic research.",
                "status": "planned",
                "effectReference": null
            }
        ],
        "unlock": {
            "status": "deferred",
            "mode": "all",
            "requirements": [],
            "proposal": "Synthesize a DNA polymer; resolve its recipe and synthesis record before activating this rule.",
            "displayRequirement": "synthesize a DNA polymer."
        }
    },
    "contractile_vacuole": {
        "id": "contractile_vacuole",
        "name": "Contractile Vacuole",
        "classification": "organelle",
        "shortSummary": "Collects and expels excess water to support osmotic balance.",
        "description": "The filling experiment explores how proton pumping, sodium/proton exchange, chloride entry, and aquaporin-mediated water movement contribute to vacuole filling. Expulsion removes collected water from the cell.",
        "figure": {
            "src": "./public/assets/organelles/contractile-vacuole-labeled.png",
            "alt": "Labeled contractile vacuole with lumen, membrane, V-ATPase, sodium/proton exchanger, chloride channel, and aquaporin.",
            "caption": "Components explored in the four-stage filling experiment."
        },
        "components": [
            {
                "id": "vacuole_membrane",
                "label": "Vacuole Membrane",
                "description": "Separates the lumen from the cytoplasm."
            },
            {
                "id": "lumen",
                "label": "Lumen",
                "description": "The internal compartment where solutes and water accumulate."
            },
            {
                "id": "v_atpase",
                "label": "V-ATPase",
                "description": "Uses ATP to pump protons across the membrane."
            },
            {
                "id": "sodium_proton_exchanger",
                "label": "Na⁺/H⁺ Exchanger",
                "description": "Exchanges sodium ions and protons across the membrane."
            },
            {
                "id": "chloride_channel",
                "label": "Chloride Channel",
                "description": "Provides a pathway for chloride movement."
            },
            {
                "id": "aquaporin",
                "label": "Aquaporin",
                "description": "Facilitates osmotic water movement."
            }
        ],
        "benefits": [
            {
                "id": "contractile_vacuole_benefit",
                "label": "Osmotic Defense",
                "description": "Proposed benefit: improved tolerance of water influx.",
                "status": "planned",
                "effectReference": null
            }
        ],
        "unlock": {
            "status": "active",
            "mode": "all",
            "requirements": [
                {
                    "type": "discovery",
                    "id": "facilitated_diffusion_level_1",
                    "label": "complete Aquaporin-Facilitated Water Diffusion"
                }
            ],
            "proposal": null,
            "displayRequirement": "complete Aquaporin-Facilitated Water Diffusion."
        }
    },
    "food_vacuole": {
        "id": "food_vacuole",
        "name": "Food Vacuole",
        "classification": "organelle",
        "shortSummary": "Contains engulfed food during intracellular digestion.",
        "description": "Contains engulfed food during intracellular digestion.",
        "figure": {
            "src": null,
            "alt": "",
            "caption": ""
        },
        "components": [],
        "benefits": [
            {
                "id": "food_vacuole_benefit",
                "label": "Nutrient Processing",
                "description": "Proposed benefit: improved use of engulfed food.",
                "status": "planned",
                "effectReference": null
            }
        ],
        "unlock": {
            "status": "active",
            "mode": "all",
            "requirements": [
                {
                    "type": "experiment_completed",
                    "id": "pseudopodia_membrane_extension",
                    "label": "complete Pseudopod Extension: Curve, Push, Stabilize"
                }
            ],
            "proposal": null,
            "displayRequirement": "complete Pseudopod Extension: Curve, Push, Stabilize.",
            "comingSoonMessage": null
        }
    },
    "cytoskeleton": {
        "id": "cytoskeleton",
        "name": "Cytoskeleton",
        "classification": "cell structure",
        "shortSummary": "Supports cell shape, internal organization, and movement.",
        "description": "Supports cell shape, internal organization, and movement.",
        "figure": {
            "src": null,
            "alt": "",
            "caption": ""
        },
        "components": [],
        "benefits": [
            {
                "id": "cytoskeleton_benefit",
                "label": "Movement Efficiency",
                "description": "Proposed benefit: reduced movement energy cost or increased movement speed.",
                "status": "planned",
                "effectReference": null
            }
        ],
        "unlock": {
            "status": "active",
            "mode": "all",
            "requirements": [],
            "proposal": null
        }
    },
    "mitochondria": {
        "id": "mitochondria",
        "name": "Mitochondria",
        "classification": "organelle group",
        "shortSummary": "Support ATP production through cellular respiration.",
        "description": "Support ATP production through cellular respiration.",
        "figure": {
            "src": "./public/assets/organelles/mitochondria-labeled.png",
            "alt": "A three-dimensional cutaway illustration of a mitochondrion with labels pointing to its key structural components: the smooth outer membrane, the folded inner membrane, the folds known as cristae, the fluid-filled matrix, and the intermembrane space between the two membranes.",
"caption": "Structural features of a mitochondrion, highlighting the outer and inner membranes, folds called cristae, the intermembrane space, and the internal matrix."
        },
        "components": [
    {
        "id": "outer_membrane",
        "label": "Outer Membrane",
        "description": "The smooth, continuous outermost boundary that encloses the mitochondrion and regulates the transport of molecules into and out of the organelle."
    },
    {
        "id": "inner_membrane",
        "label": "Inner Membrane",
        "description": "The highly folded internal membrane that contains the proteins and complexes necessary for the electron transport chain and ATP synthesis."
    },
    {
        "id": "cristae",
        "label": "Cristae",
        "description": "The numerosas folds of the inner membrane that significantly increase its surface area, maximizing the capacity for ATP generation."
    },
    {
        "id": "intermembrane_space",
        "label": "Intermembrane Space",
        "description": "The narrow region between the outer and inner membranes where protons accumulate to create an electrochemical gradient during cellular respiration."
    },
    {
        "id": "matrix",
        "label": "Matrix",
        "description": "The gel-like internal fluid enclosed by the inner membrane, containing mitochondrial DNA, ribosomes, and the enzymes responsible for the citric acid (Krebs) cycle."
    }
],
        "benefits": [
            {
                "id": "mitochondria_benefit",
                "label": "ATP Production",
                "description": "Proposed benefit: improved ATP regeneration.",
                "status": "planned",
                "effectReference": null
            }
        ],
        "unlock": {
            "status": "deferred",
            "mode": "all",
            "requirements": [],
            "proposal": null
        }
    },
    "golgi_apparatus": {
        "id": "golgi_apparatus",
        "name": "Golgi Apparatus",
        "classification": "organelle",
        "shortSummary": "Modifies and sorts cellular cargo for delivery.",
        "description": "Modifies and sorts cellular cargo for delivery.",
        "figure": {
            "src": "./public/assets/organelles/golgi-apparatus-labeled.png",
            "alt": "",
            "caption": ""
        },
        "components": [
            {
                "id": "cis_face",
                "label": "Cis Face",
                "description": "The receiving side of the Golgi apparatus."
            },
            {
                "id": "cisternae",
                "label": "Cisternae",
                "description": "Flattened membrane-bound compartments."
            },
            {
                "id": "trans_face",
                "label": "Trans Face",
                "description": "The shipping side where cargo is sorted for delivery."
            }
        ],
        "benefits": [
            {
                "id": "golgi_apparatus_benefit",
                "label": "Cargo Processing",
                "description": "Proposed benefit: improved cargo-processing efficiency.",
                "status": "planned",
                "effectReference": null
            }
        ],
        "unlock": {
            "status": "preview",
            "mode": "all",
            "requirements": [
                {
                    "type": "experiment_completed",
                    "id": "rough_er_protein_targeting",
                    "label": "complete the Rough ER protein-targeting investigation"
                }
            ],
            "proposal": null,
            "displayRequirement": "complete the Rough ER protein-targeting investigation.",
            "comingSoonMessage": "ER cargo is ready for its next destination. The introductory Golgi routing investigation is coming soon."
        }
    },
    "rough_endoplasmic_reticulum": {
        "id": "rough_endoplasmic_reticulum",
        "name": "Rough ER",
        "classification": "organelle",
        "shortSummary": "Supports synthesis and processing of many membrane and secreted proteins.",
        "description": "Supports synthesis and processing of many membrane and secreted proteins.",
        "figure": {
            "src": "./public/assets/organelles/rough-ER-labelend.png",
            "alt": "Diagram of rough endoplasmic reticulum membranes with attached ribosomes.",
            "caption": "Ribosomes dock temporarily while an ER-targeted protein is being translated."
        },
        "components": [
            {
                "id": "free_ribosome",
                "label": "Free Ribosome",
                "description": "Begins translation in the cytosol before an emerging ER signal is recognized."
            },
            {
                "id": "signal_recognition_particle",
                "label": "Signal Recognition Particle (SRP)",
                "description": "Recognizes an emerging ER signal and briefly pauses translation while targeting the ribosome to the ER."
            },
            {
                "id": "translocon",
                "label": "Translocon",
                "description": "A membrane channel through which a growing protein enters the ER lumen or is inserted into the ER membrane."
            },
            {
                "id": "er_lumen",
                "label": "ER Lumen",
                "description": "The compartment continuous with the future extracellular-facing side of secretory-pathway membranes."
            }
        ],
        "benefits": [
            {
                "id": "rough_endoplasmic_reticulum_benefit",
                "label": "Protein Production",
                "description": "Proposed benefit: improved protein-production capacity.",
                "status": "planned",
                "effectReference": null
            }
        ],
        "unlock": {
            "status": "active",
            "mode": "all",
            "requirements": [
                {
                    "type": "polymerizer_product_synthesized",
                    "id": "GlucoseTransporter",
                    "label": "synthesize Glucose Transporter in the Polymerizer"
                }
            ],
            "proposal": null,
            "displayRequirement": "synthesize Glucose Transporter in the Polymerizer.",
            "comingSoonMessage": "Rough ER revealed through Glucose Transporter synthesis."
        }
    },
    "smooth_endoplasmic_reticulum": {
    "id": "smooth_endoplasmic_reticulum",
    "name": "Smooth ER",
    "classification": "organelle",
    "shortSummary": "Participates in lipid synthesis and other metabolic processes.",
    "description": "Participates in lipid synthesis and other metabolic processes.",
    "figure": {
        "src": "./public/assets/organelles/smooth-ER-labeled.png",
        "alt": "Diagram of the smooth endoplasmic reticulum showing its branching tubular structure and internal lumen, continuous with the ribosome-studded rough ER and the nuclear membrane.",
        "caption": "Structural organization of the smooth endoplasmic reticulum, featuring interconnected tubules, internal lumen, and its physical integration with the rough ER and nucleus."
    },
    "components": [
        {
            "id": "smooth_er",
            "label": "Smooth ER",
            "description": "A ribosome-free membranous network responsible for lipid synthesis, carbohydrate metabolism, calcium storage, and detoxification."
        },
        {
            "id": "tubules",
            "label": "Tubules",
            "description": "Interconnected tubular membrane structures that form the characteristic branching framework of the smooth endoplasmic reticulum."
        },
        {
            "id": "lumen",
            "label": "Lumen",
            "description": "The internal, fluid-filled space inside the smooth ER that primarily stores and buffers calcium."
        },
        {
            "id": "rough_er",
            "label": "Rough ER",
            "description": "The contiguous region of the endoplasmic reticulum studded with ribosomes, dedicated to protein folding and transport."
        },
        {
            "id": "ribosomes",
            "label": "Ribosomes",
            "description": "Small protein-RNA complexes bound to the outer surface of the rough ER that synthesize polypeptides."
        },
        {
            "id": "nucleus",
            "label": "Nucleus",
            "description": "The membrane-bound organelle storing genetic material, physically connected to the endoplasmic reticulum system."
        }
    ],
        "benefits": [
            {
                "id": "smooth_endoplasmic_reticulum_benefit",
                "label": "Lipid Research",
                "description": "Experiments award XP, achievements, and selected Polymerizer or lipid recipe discoveries without directly changing cell-wide metrics.",
                "status": "active",
                "effectReference": null
            }
        ],
        "unlock": {
            "status": "active",
            "mode": "all",
            "requirements": [
                {
                    "type": "macromolecular_product_synthesized",
                    "ids": [
                        "PC",
                        "PE",
                        "PS",
                        "PI"
                    ],
                    "mode": "any",
                    "label": "synthesize a membrane lipid (PC, PE, PS, or PI)"
                }
            ],
            "proposal": null,
            "displayRequirement": "synthesize a membrane lipid (PC, PE, PS, or PI).",
            "comingSoonMessage": "Smooth ER revealed through membrane-lipid synthesis."
        }
    },
    "ribosomes": {
    "id": "ribosomes",
    "name": "Ribosomes",
    "classification": "cell structure group",
    "shortSummary": "Translate messenger RNA into polypeptides.",
    "description": "Translate messenger RNA into polypeptides.",
    "figure": {
        "src": "./public/assets/organelles/ribosome-labeled.png",
        "alt": "Diagram of a ribosome showing the large and small subunits, the tRNA docking sites labeled E (Exit), P (Peptidyl), and A (Aminoacyl), and the mRNA binding site.",
        "caption": "Structural components and functional active sites of a ribosome during protein translation."
    },
    "components": [
        {
            "id": "large_subunit",
            "label": "Large Subunit",
            "description": "The top ribosomal subunit that catalyzes peptide bond formation and houses the tRNA docking cavities."
        },
        {
            "id": "small_subunit",
            "label": "Small Subunit",
            "description": "The bottom ribosomal subunit responsible for binding messenger RNA and ensuring accurate decoding during translation."
        },
        {
            "id": "aminoacyl_site",
            "label": "Aminoacyl Site (A Site)",
            "description": "The entry site for incoming aminoacyl-tRNA carrying the next amino acid to be added to the growing polypeptide."
        },
        {
            "id": "peptidyl_site",
            "label": "Peptidyl Site (P Site)",
            "description": "The central binding site that holds the tRNA carrying the growing polypeptide chain."
        },
        {
            "id": "exit_site",
            "label": "Exit Site (E Site)",
            "description": "The final binding site where deacylated (uncharged) tRNA resides briefly prior to its release from the ribosome."
        },
        {
            "id": "trna_docking_sites",
            "label": "tRNA Docking Sites",
            "description": "The functional cavities (A, P, and E sites) spanning the subunits that accommodate transfer RNA molecules during synthesis."
        },
        {
            "id": "mrna_binding_site",
            "label": "mRNA Binding Site",
            "description": "A specialized groove on the small subunit that positions messenger RNA for translation."
        }
    ],
        "benefits": [
            {
                "id": "ribosomes_benefit",
                "label": "Protein Synthesis",
                "description": "Proposed benefit: improved protein-synthesis capacity.",
                "status": "planned",
                "effectReference": null
            }
        ],
        "unlock": {
            "status": "active",
            "mode": "all",
            "requirements": [
                {
                    "type": "zone_unlocked",
                    "id": "polymerizer",
                    "label": "claim the From Monomers to Proteins quest and unlock Polymerizer"
                }
            ],
            "proposal": null,
            "displayRequirement": "claim the From Monomers to Proteins quest and unlock Polymerizer.",
            "comingSoonMessage": "Ribosomes revealed with the Polymerizer."
        }
    },
    "lysosomes": {
    "id": "lysosomes",
    "name": "Lysosomes",
    "classification": "organelle group",
    "shortSummary": "Break down cellular materials using digestive enzymes.",
    "description": "Break down cellular materials using digestive enzymes.",
    "figure": {
        "src": "./public/assets/organelles/lysosome-labeled.png",
        "alt": "Diagram of a lysosome showing its outer lipid bilayer, internal hydrolytic enzymes, and membrane transport proteins.",
        "caption": "Structural components of a lysosome involved in cellular waste breakdown and material transport."
    },
    "components": [
        {
            "id": "lipid_bilayer",
            "label": "Lipid Bilayer",
            "description": "A protective single phospholipid membrane that isolates acidic hydrolytic enzymes from the rest of the cytoplasm."
        },
        {
            "id": "hydrolytic_enzymes",
            "label": "Hydrolytic Enzymes",
            "description": "Acidic digestive proteins within the internal lumen that break down biomolecules, cellular waste, and foreign pathogens."
        },
        {
            "id": "transport_proteins",
            "label": "Transport Proteins",
            "description": "Membrane-bound channels and pumps that maintain internal pH and shuttle recycled molecules back into the cytosol."
        }
    ],
        "benefits": [
            {
                "id": "lysosomes_benefit",
                "label": "Digestion and Recycling",
                "description": "Proposed benefit: improved digestion and material recovery.",
                "status": "planned",
                "effectReference": null
            }
        ],
        "unlock": {
            "status": "preview",
            "mode": "all",
            "requirements": [
                {
                    "type": "experiment_completed",
                    "id": "golgi_protein_routing",
                    "label": "complete the Golgi protein-routing investigation"
                },
                {
                    "type": "any_discovery",
                    "ids": [
                        "food_vacuole",
                        "endosome",
                        "successful_phagocytosis",
                        "endocytosis_observed"
                    ],
                    "label": "discover a food vacuole or endosome"
                }
            ],
            "proposal": null,
            "displayRequirement": "complete Golgi protein routing and discover a food vacuole or endosome.",
            "comingSoonMessage": "Lysosome prerequisites are complete. Intracellular digestion and recycling activities are coming soon."
        }
    },
    "symbiosomes": {
        "id": "symbiosomes",
        "name": "Symbiosomes",
        "classification": "symbiont-containing compartments",
        "shortSummary": "House symbiotic partners within the host cell.",
        "description": "This game profile represents compartments housing photosynthetic partners. The planned learning path connects exploration of a photosynthetic habitat with establishing a symbiotic partnership.",
        "figure": {
            "src": null,
            "alt": "Labeled symbiosome showing a host-derived membrane and a photosynthetic symbiont.",
            "caption": "Planned photosynthetic partnership profile."
        },
        "components": [
            {
                "id": "host_membrane",
                "label": "Host-Derived Membrane",
                "description": "Defines the host compartment surrounding the symbiotic partner."
            },
            {
                "id": "symbiont",
                "label": "Photosynthetic Symbiont",
                "description": "The partner represented in the planned photosynthetic association."
            }
        ],
        "benefits": [
            {
                "id": "symbiosomes_benefit",
                "label": "Photosynthetic Partnership",
                "description": "Proposed benefit: access to photosynthetic energy through a suitable symbiont.",
                "status": "planned",
                "effectReference": null
            }
        ],
        "unlock": {
            "status": "deferred",
            "mode": "all",
            "requirements": [],
            "proposal": "Move into the photosynthetic zone; discuss whether entry alone or a symbiont encounter grants the permanent discovery.",
            "displayRequirement": "enter a photosynthetic region and encounter a photosynthetic symbiont."
        }
    },
    "endosome": {
        "id": "endosome",
        "name": "Endosome",
        "classification": "organelle",
        "shortSummary": "Sorts material taken up through endocytosis.",
        "description": "Sorts material taken up through endocytosis.",
        "figure": {
            "src": null,
            "alt": "",
            "caption": ""
        },
        "components": [],
        "benefits": [
            {
                "id": "endosome_benefit",
                "label": "Transport and Sorting",
                "description": "Proposed benefit: improved sorting of internalized cargo.",
                "status": "planned",
                "effectReference": null
            }
        ],
        "unlock": {
            "status": "preview",
            "mode": "all",
            "requirements": [
                {
                    "type": "environment_discovered",
                    "id": "endocytosis_observed",
                    "label": "observe cargo entering the cell through endocytosis"
                }
            ],
            "proposal": null,
            "displayRequirement": "observe cargo entering the cell through endocytosis.",
            "comingSoonMessage": "Endosome revealed through endocytosis. Cargo-sorting activities are coming soon."
        }
    },
    "autophagosome": {
        "id": "autophagosome",
        "name": "Autophagosome",
        "classification": "organelle",
        "shortSummary": "Encloses cellular material for delivery to a degradative compartment.",
        "description": "Encloses cellular material for delivery to a degradative compartment.",
        "figure": {
            "src": null,
            "alt": "",
            "caption": ""
        },
        "components": [],
        "benefits": [
            {
                "id": "autophagosome_benefit",
                "label": "Cellular Recycling",
                "description": "Proposed benefit: improved recovery of materials from damaged cell components.",
                "status": "planned",
                "effectReference": null
            }
        ],
        "unlock": {
            "status": "deferred",
            "mode": "all",
            "requirements": [],
            "proposal": null
        }
    }
};

export default organelleLibrary;
