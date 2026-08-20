// --------------------------------------------------
// OrganelleExperimentAttemptManager.js
// Owns one temporary, unsubmitted organelle experiment
// attempt. This data is not saved until submission.
// --------------------------------------------------

const OrganelleExperimentAttemptManager = {

    activeExperimentId: null,
    startedAtMs: null,

    reflectionResponses: {},

    simulation: {
        hasRun: false,
        lastRunAtMs: null
    },

    // --------------------------------------------------
    // Begin a new temporary attempt
    // --------------------------------------------------
    start(experimentId) {

        if (!experimentId) {
            console.warn(
                "OrganelleExperimentAttemptManager: experiment ID is required"
            );

            return false;
        }

        this.reset();

        this.activeExperimentId =
            experimentId;

        this.startedAtMs =
            Date.now();

        return true;

    },

    // --------------------------------------------------
    // Clear temporary attempt data without recording it
    // --------------------------------------------------
    reset() {

        this.activeExperimentId =
            null;

        this.startedAtMs =
            null;

        this.reflectionResponses =
            {};

        this.simulation = {
            hasRun: false,
            lastRunAtMs: null
        };

    },

    // --------------------------------------------------
    // Save one temporary reflection response
    // --------------------------------------------------
    setReflectionResponse(
        reflectionId,
        response
    ) {

        if (
            !this.activeExperimentId ||
            !reflectionId
        ) {
            console.warn(
                "OrganelleExperimentAttemptManager: no active attempt or reflection ID"
            );

            return false;
        }

        this.reflectionResponses[
            reflectionId
        ] = String(
            response ?? ""
        );

        return true;

    },

    // --------------------------------------------------
    // Read one temporary reflection response
    // --------------------------------------------------
    getReflectionResponse(reflectionId) {

        return this.reflectionResponses[
            reflectionId
        ] ?? "";

    },

    // --------------------------------------------------
    // Record that the student ran a simulation
    // --------------------------------------------------
    markSimulationRun() {

        if (!this.activeExperimentId) {
            console.warn(
                "OrganelleExperimentAttemptManager: no active attempt"
            );

            return false;
        }

        this.simulation = {
            hasRun: true,
            lastRunAtMs: Date.now()
        };

        return true;

    },

    // --------------------------------------------------
    // Read a safe copy of the temporary attempt
    // --------------------------------------------------
    getSnapshot() {

        return structuredClone(
            {
                experimentId:
                    this.activeExperimentId,

                startedAtMs:
                    this.startedAtMs,

                reflectionResponses:
                    this.reflectionResponses,

                simulation:
                    this.simulation
            }
        );

    }

};

export default OrganelleExperimentAttemptManager;