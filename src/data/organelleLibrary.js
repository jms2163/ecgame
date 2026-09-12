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
            "src": null,
            "alt": "Labeled plasma membrane with a phospholipid bilayer, transport proteins, and an aquaporin.",
            "caption": "Selective permeability and membrane transport."
        },
        "components": [
            {
                "id": "phospholipid_bilayer",
                "label": "Phospholipid Bilayer",
                "description": "Forms the membrane’s structural framework and hydrophobic interior."
            },
            {
                "id": "transport_proteins",
                "label": "Transport Proteins",
                "description": "Provide pathways or mechanisms for moving selected substances across the membrane."
            },
            {
                "id": "aquaporin",
                "label": "Aquaporin",
                "description": "A channel protein that facilitates water movement across the membrane."
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
            "src": null,
            "alt": "",
            "caption": ""
        },
        "components": [],
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
            "src": null,
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
            "status": "deferred",
            "mode": "all",
            "requirements": [],
            "proposal": null
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
            "status": "deferred",
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
            "src": null,
            "alt": "",
            "caption": ""
        },
        "components": [],
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
            "src": null,
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
            "status": "deferred",
            "mode": "all",
            "requirements": [],
            "proposal": null
        }
    },
    "rough_endoplasmic_reticulum": {
        "id": "rough_endoplasmic_reticulum",
        "name": "Rough ER",
        "classification": "organelle",
        "shortSummary": "Supports synthesis and processing of many membrane and secreted proteins.",
        "description": "Supports synthesis and processing of many membrane and secreted proteins.",
        "figure": {
            "src": null,
            "alt": "",
            "caption": ""
        },
        "components": [],
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
            "status": "deferred",
            "mode": "all",
            "requirements": [],
            "proposal": null
        }
    },
    "smooth_endoplasmic_reticulum": {
        "id": "smooth_endoplasmic_reticulum",
        "name": "Smooth ER",
        "classification": "organelle",
        "shortSummary": "Participates in lipid synthesis and other metabolic processes.",
        "description": "Participates in lipid synthesis and other metabolic processes.",
        "figure": {
            "src": null,
            "alt": "",
            "caption": ""
        },
        "components": [],
        "benefits": [
            {
                "id": "smooth_endoplasmic_reticulum_benefit",
                "label": "Lipid Production",
                "description": "Proposed benefit: improved lipid-production capacity.",
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
    "ribosomes": {
        "id": "ribosomes",
        "name": "Ribosomes",
        "classification": "cell structure group",
        "shortSummary": "Translate messenger RNA into polypeptides.",
        "description": "Translate messenger RNA into polypeptides.",
        "figure": {
            "src": null,
            "alt": "",
            "caption": ""
        },
        "components": [],
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
            "status": "deferred",
            "mode": "all",
            "requirements": [],
            "proposal": null
        }
    },
    "lysosomes": {
        "id": "lysosomes",
        "name": "Lysosomes",
        "classification": "organelle group",
        "shortSummary": "Break down cellular materials using digestive enzymes.",
        "description": "Break down cellular materials using digestive enzymes.",
        "figure": {
            "src": null,
            "alt": "",
            "caption": ""
        },
        "components": [],
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
            "status": "deferred",
            "mode": "all",
            "requirements": [],
            "proposal": null
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
            "status": "deferred",
            "mode": "all",
            "requirements": [],
            "proposal": null
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
