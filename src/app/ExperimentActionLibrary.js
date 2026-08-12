// --------------------------------------------------
// ExperimentActionLibrary.js
// Shared definitions for standard experiment controls
// --------------------------------------------------

const ExperimentActionLibrary = {

    rotate: {

        id:
            "rotate",

        label:
            "Rotate",

        requiresSelectedPlacement:
            true

    },

    simulate: {

        id:
            "simulate",

        label:
            "Simulate",

        requiresPlacement:
            true

    },

    labels: {

        id:
            "labels",

        label:
            "Labels",

        requiresPlacement:
            false

    },

    reflection: {

        id:
            "reflection",

        label:
            "Reflection",

        requiresPlacement:
            true

    },

    submit: {

        id:
            "submit",

        label:
            "Submit",

        requiresPlacement:
            true,

        requiresReflection:
            true

    },

    review: {

        id:
            "review",

        label:
            "Review",

        requiresPlacement:
            false

    },

    reset: {

    id:
        "reset",

    label:
        "Reset",

    requiresPlacement:
        false

}

};

export default ExperimentActionLibrary;
