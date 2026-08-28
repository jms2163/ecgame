// --------------------------------------------------
// NaturalSelectionPrototypeConfig.js
// Central prototype settings for pigmentation trials
// --------------------------------------------------

// These two values are intentionally easy to change while
// calibrating camouflage. They use a 0-100 scale:
// 0 = no added pigmentation / brown coloration
// 100 = maximum prototype pigmentation / brown coloration
//
// A completed attempt will eventually store a snapshot of
// these values so trials from different visual profiles are
// never combined accidentally.
const NaturalSelectionPrototypeConfig = {

    activityId:
        "natural-selection-pigmentation",

    definitionVersion:
        "0.3.0",

    modelVersion:
        "pigmentation-selection-v1",

    visualCalibration: {
        profileId:
            "camouflage-contrast-v1",

        pigmentationLevel: 70,
        brownBackgroundLevel: 65
    },

    classComparison: {
        minimumMatchingTrials: 3
    }

};

export default NaturalSelectionPrototypeConfig;
