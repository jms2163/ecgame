// --------------------------------------------------
// NaturalSelectionClassComparisonConfig.js
// Instructor-controlled class comparison connection
// --------------------------------------------------

import NaturalSelectionPrototypeConfig
    from "./NaturalSelectionPrototypeConfig.js";

// This URL is public by design. It is not a secret and
// must point to the deployed Google Apps Script /exec URL.
// Leave it blank until the instructor deploys the service.
const CLASS_COMPARISON_ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbzAmODyUgS9c6mPwgKEk4PXh1lT6x_pHda2JfcGfz9LbsHfK5zZUi9peBPdf1p2Ow0/exec";

// Use a new, non-identifying cohort id for each course or
// section that should have a separate class average. The
// same value must be set in the Apps Script configuration.
const CLASS_COMPARISON_COHORT_ID =
           "bio101-fall-2026-section-01";

const NaturalSelectionClassComparisonConfig = {

    enabled: true,

    endpointUrl:
        CLASS_COMPARISON_ENDPOINT_URL,

    cohortId:
        CLASS_COMPARISON_COHORT_ID,

    submissionSchemaVersion:
        "natural-selection-class-submission-v1",

    aggregateSchemaVersion:
        "natural-selection-class-aggregate-v1",

    anonymousParticipantStorageKey:
        "ecgame.naturalSelection.anonymousParticipant.v1",

    minimumMatchingTrials:
        NaturalSelectionPrototypeConfig
            .classComparison
            .minimumMatchingTrials,

    requestTimeoutMs: 10000,

    confirmation: {
        maximumPolls: 5,
        intervalMs: 700
    }

};

export {
    CLASS_COMPARISON_COHORT_ID,
    CLASS_COMPARISON_ENDPOINT_URL
};

export default NaturalSelectionClassComparisonConfig;
