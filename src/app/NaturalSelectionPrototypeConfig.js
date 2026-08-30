// --------------------------------------------------
// NaturalSelectionPrototypeConfig.js
// Central prototype settings for pigmentation trials
// --------------------------------------------------

// These two values are intentionally easy to change while
// calibrating camouflage. They use a 0-100 scale:
// 0 = no added pigmentation / brown coloration
// 100 = maximum prototype pigmentation / brown coloration
//
// Every attempt stores a setup snapshot containing these
// values so trials from different visual profiles are never
// combined accidentally.
const NaturalSelectionPrototypeConfig = {

    activityId:
        "natural-selection-pigmentation",

    definitionVersion:
        "0.5.0",

    modelVersion:
        "pigmentation-selection-v1",

    visualCalibration: {
        profileId:
            "camouflage-contrast-v1",

        pigmentationLevel: 70,
        brownBackgroundLevel: 65,

        pigmentColor: "#7a4b2c",
        whiteBackgroundColor: "#f3efe6",
        brownBackgroundLightColor: "#d7c19c",
        brownBackgroundDarkColor: "#6c452d"
    },

    visualPredation: {
        amoebaSpritePath:
            "./public/assets/pond/amoeba/amoeba-trophozoite-stationary.png",

        fieldWidth: 720,
        fieldHeight: 440,
        amoebaDisplaySize: 46,
        amoebaHitRadius: 23,
        minimumCenterDistance: 52,
        movementSpeedPixelsPerSecond: 12,
        maximumFramesPerSecond: 30,
        keyboardPredatorStep: 18,
        mixedBackgroundColumns: 6,
        mixedBackgroundRows: 4
    },

    classComparison: {
        minimumMatchingTrials: 3
    }

};

export default NaturalSelectionPrototypeConfig;
