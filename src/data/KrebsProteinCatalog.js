// Generated from validated motif CSVs by tools/install_krebs_proteins.py.
const DATA = {
    "CitrateSynthase": {
        "name": "Citrate Synthase",
        "source": "1IXE",
        "organism": "Thermus thermophilus",
        "reaction": "Oxaloacetate + acetyl-CoA + water \u2192 citrate + CoA-SH.",
        "ppc": "HLBLHHLHLHHHLHHHLHLHLHLHLHLHLHLHLHHBLBLBLBLHLHLBLHHLHLHHHLHHLHLHLHLHLHLHLHLHLHHBLBLBLBLHL",
        "recipe": {
            "H": 41,
            "B": 10,
            "L": 38
        },
        "components": [
            {
                "number": 1,
                "sourceModel": "1",
                "sourceChain": "A",
                "recipe": {
                    "H": 21,
                    "B": 5,
                    "L": 19
                },
                "firstFrame": 1,
                "lastFrame": 22
            },
            {
                "number": 2,
                "sourceModel": "1",
                "sourceChain": "B",
                "recipe": {
                    "H": 20,
                    "B": 5,
                    "L": 19
                },
                "firstFrame": 23,
                "lastFrame": 45
            }
        ],
        "lastFrame": 45,
        "displayZoomPercent": 150,
        "location": "Krebs Cycle (bacterial structural representative)",
        "qualification": ""
    },
    "Aconitase": {
        "name": "Aconitase",
        "source": "1L5J",
        "organism": "Escherichia coli",
        "reaction": "Citrate \u21cc isocitrate through dehydration and rehydration.",
        "ppc": "LHHLHHLHLBLBLHLBLHHLBLHLBLHLBLBLHLBLHLHLBLHHLBLHLBLBLHLBLBLHHLBLHLBLHLBLBLHLHHLBLBLBLBLHBLBLBHLBLHLHHLHHBLHHLHLHLHHLHLHLHLHLH",
        "recipe": {
            "H": 42,
            "B": 27,
            "L": 56
        },
        "components": [],
        "lastFrame": 59,
        "displayZoomPercent": 260,
        "location": "Krebs Cycle (bacterial structural representative)",
        "qualification": ""
    },
    "IsocitrateDehydrogenase": {
        "name": "Isocitrate Dehydrogenase",
        "source": "2D4V",
        "organism": "Acidithiobacillus thiooxidans",
        "reaction": "Isocitrate + NAD+ \u2192 alpha-ketoglutarate + CO2 + NADH + H+.",
        "ppc": "LHBLHBLHLHLBLBLHHBLHHBLHHBLHLBLHBLHLHLBLHLBLHLBLHLBHLHLBLHLBLBLBLLHLHLHLHLBLBLHHBLHHBLHHBLHLBLHBLHLHLBLHLBLHLBLHLBHLHLBLHLBLBLBL",
        "recipe": {
            "H": 40,
            "B": 32,
            "L": 56
        },
        "components": [
            {
                "number": 1,
                "sourceModel": "1",
                "sourceChain": "A",
                "recipe": {
                    "H": 20,
                    "B": 17,
                    "L": 28
                },
                "firstFrame": 1,
                "lastFrame": 28
            },
            {
                "number": 2,
                "sourceModel": "1",
                "sourceChain": "B",
                "recipe": {
                    "H": 20,
                    "B": 15,
                    "L": 28
                },
                "firstFrame": 29,
                "lastFrame": 57
            }
        ],
        "lastFrame": 57,
        "displayZoomPercent": 270,
        "location": "Krebs Cycle (bacterial structural representative)",
        "qualification": ""
    },
    "SuccinylCoASynthetase": {
        "name": "Succinyl-CoA Synthetase",
        "source": "1SCU",
        "organism": "Escherichia coli",
        "reaction": "Succinyl-CoA + ADP + Pi \u2192 succinate + CoA-SH + ATP.",
        "ppc": "LHHLHHLBLHHLBLHHLBLHHLBLHLBLBLBLHLBLHHHLBLHLBLHLBLLHLBLHHLBLHLBLHHLBLHLBLBLHHLHLHLHLBLBLBLBLHHLHHLBLHLHLBLBBLBLHLBLHLBLHHLBLHHLLHHLBLHLBLHLBLHLBLHHLBLBLBLBLHLBLHHLBLHHLBLBLBLHLBLLHLBLHLBLHLBLHHLBLHHLBLBLHHLHLHHLHLBLBLBLBLHHLHLBLHLHLBLBBLBLHHLBHLBLHLBLHL",
        "recipe": {
            "H": 77,
            "B": 61,
            "L": 115
        },
        "components": [
            {
                "number": 1,
                "sourceModel": "1",
                "sourceChain": "A",
                "recipe": {
                    "H": 17,
                    "B": 11,
                    "L": 22
                },
                "firstFrame": 1,
                "lastFrame": 19
            },
            {
                "number": 2,
                "sourceModel": "1",
                "sourceChain": "B",
                "recipe": {
                    "H": 24,
                    "B": 18,
                    "L": 35
                },
                "firstFrame": 20,
                "lastFrame": 42
            },
            {
                "number": 3,
                "sourceModel": "1",
                "sourceChain": "D",
                "recipe": {
                    "H": 13,
                    "B": 14,
                    "L": 24
                },
                "firstFrame": 43,
                "lastFrame": 60
            },
            {
                "number": 4,
                "sourceModel": "1",
                "sourceChain": "E",
                "recipe": {
                    "H": 23,
                    "B": 18,
                    "L": 34
                },
                "firstFrame": 61,
                "lastFrame": 84
            }
        ],
        "lastFrame": 84,
        "displayZoomPercent": 210,
        "location": "Krebs Cycle (bacterial structural representative)",
        "qualification": ""
    },
    "Fumarase": {
        "name": "Fumarase",
        "source": "6MSO",
        "organism": "Leishmania major",
        "reaction": "Fumarate + water \u21cc malate.",
        "ppc": "HLBHBHLBLHLBLHHLBLHLHLBLHLBLHLHLBLBLBLBLBLHBLHLBLHHBLHBLBLBLBLHLBLBLHLHLHLBLBLBLHLBHBHLBLHLBLHHLBLHLHLBLHLBLHLHLBLBLBLBLBLHBLHLBLHHHBLHBLBLBLBLHLBLBLHLHLHBLBLBL",
        "recipe": {
            "H": 41,
            "B": 48,
            "L": 71
        },
        "components": [
            {
                "number": 1,
                "sourceModel": "1",
                "sourceChain": "A",
                "recipe": {
                    "H": 20,
                    "B": 24,
                    "L": 36
                },
                "firstFrame": 1,
                "lastFrame": 37
            },
            {
                "number": 2,
                "sourceModel": "1",
                "sourceChain": "B",
                "recipe": {
                    "H": 21,
                    "B": 24,
                    "L": 35
                },
                "firstFrame": 38,
                "lastFrame": 74
            }
        ],
        "lastFrame": 74,
        "displayZoomPercent": 240,
        "location": "Mitochondria (protist structural representative)",
        "qualification": ""
    },
    "MalateDehydrogenase": {
        "name": "Malate Dehydrogenase",
        "source": "7NRZ",
        "organism": "Trypanosoma cruzi",
        "reaction": "Malate + NAD+ \u21cc oxaloacetate + NADH + H+.",
        "ppc": "HLBLBLBLHLHHLHLBLHLBLHLBLHLBLHLBLHLBLHLBLHLBLHLBLBLBLHLHHLHLBLHLBLHLBLHLBLHLBLHLBLHLBLHLBL",
        "recipe": {
            "H": 24,
            "B": 22,
            "L": 44
        },
        "components": [
            {
                "number": 1,
                "sourceModel": "1",
                "sourceChain": "A",
                "recipe": {
                    "H": 12,
                    "B": 11,
                    "L": 22
                },
                "firstFrame": 1,
                "lastFrame": 22
            },
            {
                "number": 2,
                "sourceModel": "1",
                "sourceChain": "B",
                "recipe": {
                    "H": 12,
                    "B": 11,
                    "L": 22
                },
                "firstFrame": 23,
                "lastFrame": 45
            }
        ],
        "lastFrame": 45,
        "displayZoomPercent": 100,
        "location": "Glycosome (structural representative for the Krebs reaction)",
        "qualification": "This glycosomal enzyme models the reaction; the structure is not a mitochondrial isoform."
    }
};
for (const protein of Object.values(DATA)) {
    Object.freeze(protein.recipe);
    for (const component of protein.components) {
        Object.freeze(component.recipe);
        Object.freeze(component);
    }
    Object.freeze(protein.components);
    Object.freeze(protein);
}
export default Object.freeze(DATA);
