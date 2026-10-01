// Exact chain boundaries and motif counts from the supplied 9HVM and 5ND5 reports.
// Display numbers are stable recipe components, independent of PDB chain names.
const RUBISCO = [
    {
        "number": 1,
        "sourceModel": "1",
        "sourceChain": "A",
        "recipe": {
            "H": 20,
            "B": 13,
            "L": 30
        },
        "firstFrame": 1,
        "lastFrame": 33
    },
    {
        "number": 2,
        "sourceModel": "1",
        "sourceChain": "B",
        "recipe": {
            "H": 3,
            "B": 4,
            "L": 8
        },
        "firstFrame": 34,
        "lastFrame": 43
    },
    {
        "number": 3,
        "sourceModel": "1",
        "sourceChain": "C",
        "recipe": {
            "H": 21,
            "B": 13,
            "L": 31
        },
        "firstFrame": 44,
        "lastFrame": 77
    },
    {
        "number": 4,
        "sourceModel": "1",
        "sourceChain": "D",
        "recipe": {
            "H": 3,
            "B": 4,
            "L": 8
        },
        "firstFrame": 78,
        "lastFrame": 87
    },
    {
        "number": 5,
        "sourceModel": "1",
        "sourceChain": "E",
        "recipe": {
            "H": 20,
            "B": 13,
            "L": 30
        },
        "firstFrame": 88,
        "lastFrame": 120
    },
    {
        "number": 6,
        "sourceModel": "1",
        "sourceChain": "F",
        "recipe": {
            "H": 4,
            "B": 4,
            "L": 9
        },
        "firstFrame": 121,
        "lastFrame": 129
    },
    {
        "number": 7,
        "sourceModel": "1",
        "sourceChain": "G",
        "recipe": {
            "H": 21,
            "B": 13,
            "L": 31
        },
        "firstFrame": 130,
        "lastFrame": 162
    },
    {
        "number": 8,
        "sourceModel": "1",
        "sourceChain": "H",
        "recipe": {
            "H": 3,
            "B": 4,
            "L": 8
        },
        "firstFrame": 163,
        "lastFrame": 172
    },
    {
        "number": 9,
        "sourceModel": "1",
        "sourceChain": "I",
        "recipe": {
            "H": 21,
            "B": 13,
            "L": 31
        },
        "firstFrame": 173,
        "lastFrame": 205
    },
    {
        "number": 10,
        "sourceModel": "1",
        "sourceChain": "J",
        "recipe": {
            "H": 3,
            "B": 4,
            "L": 8
        },
        "firstFrame": 206,
        "lastFrame": 215
    },
    {
        "number": 11,
        "sourceModel": "1",
        "sourceChain": "K",
        "recipe": {
            "H": 21,
            "B": 13,
            "L": 31
        },
        "firstFrame": 216,
        "lastFrame": 248
    },
    {
        "number": 12,
        "sourceModel": "1",
        "sourceChain": "L",
        "recipe": {
            "H": 3,
            "B": 4,
            "L": 8
        },
        "firstFrame": 249,
        "lastFrame": 258
    },
    {
        "number": 13,
        "sourceModel": "1",
        "sourceChain": "M",
        "recipe": {
            "H": 20,
            "B": 13,
            "L": 30
        },
        "firstFrame": 259,
        "lastFrame": 291
    },
    {
        "number": 14,
        "sourceModel": "1",
        "sourceChain": "N",
        "recipe": {
            "H": 3,
            "B": 4,
            "L": 8
        },
        "firstFrame": 292,
        "lastFrame": 301
    },
    {
        "number": 15,
        "sourceModel": "1",
        "sourceChain": "O",
        "recipe": {
            "H": 21,
            "B": 13,
            "L": 31
        },
        "firstFrame": 302,
        "lastFrame": 334
    },
    {
        "number": 16,
        "sourceModel": "1",
        "sourceChain": "P",
        "recipe": {
            "H": 3,
            "B": 4,
            "L": 8
        },
        "firstFrame": 335,
        "lastFrame": 344
    }
];
// The 5ND5 CSV records 86 reveal frames; frame 87 is the supplied final image.
const TRANSKETOLASE = [
    {number:1,sourceModel:"1",sourceChain:"A",recipe:{H:32,B:19,L:45},firstFrame:1,lastFrame:43},
    {number:2,sourceModel:"1",sourceChain:"B",recipe:{H:31,B:17,L:44},firstFrame:44,lastFrame:86}
];
const HEXOKINASE = [
    {
        "number": 1,
        "sourceModel": "1",
        "sourceChain": "A",
        "recipe": {
            "H": 37,
            "B": 25,
            "L": 62
        },
        "firstFrame": 1,
        "lastFrame": 65
    },
    {
        "number": 2,
        "sourceModel": "1",
        "sourceChain": "B",
        "recipe": {
            "H": 37,
            "B": 25,
            "L": 64
        },
        "firstFrame": 66,
        "lastFrame": 130
    }
];
const FATTY_ACID_SYNTHASE = [
    {
        "number": 1,
        "sourceModel": "1",
        "sourceChain": "A",
        "recipe": {
            "H": 85,
            "B": 85,
            "L": 150
        },
        "firstFrame": 1,
        "lastFrame": 161
    },
    {
        "number": 2,
        "sourceModel": "1",
        "sourceChain": "B",
        "recipe": {
            "H": 86,
            "B": 85,
            "L": 151
        },
        "firstFrame": 162,
        "lastFrame": 321
    }
];
const COMPONENTS = {RuBisCO:RUBISCO,Transketolase:TRANSKETOLASE,Hexokinase:HEXOKINASE,FattyAcidSynthase:FATTY_ACID_SYNTHASE};
for (const components of Object.values(COMPONENTS)) {
    for (const component of components) { Object.freeze(component.recipe); Object.freeze(component); }
    Object.freeze(components);
}
Object.freeze(COMPONENTS);
export default Object.freeze({ get(id) { return COMPONENTS[id] ?? []; } });
