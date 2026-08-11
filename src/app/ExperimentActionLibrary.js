// --------------------------------------------------
// ExperimentActionLibrary.js
// Shared definitions for standard experiment controls
// --------------------------------------------------

const ExperimentActionLibrary = {

    flip: {

        id:
            "flip",

        label:
            "Flip",

        requiresPlacement:
            false

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

    }

};

export default ExperimentActionLibrary;