// --------------------------------------------------
// ProblemReportManager.js
// Sends selected laboratory submissions to the
// instructor's write-only problem-report endpoint.
// --------------------------------------------------

import gameState from "./GameState.js";

const ProblemReportManager = {

    endpointUrl:
        "https://script.google.com/macros/s/AKfycbxkfPcjCQ_PDPWr8JoiJSXY9MyWEuUGbtCOaVfggJjbVPem6ZdTXx0e8WYSvvVgYEg/exec",

    createPayload({ experiment, submission, issueType, message }) {
        const reflectionId = experiment?.assessment?.reflection?.id;

        return {
            reportId: crypto.randomUUID(),
            playerId: gameState.player?.id ?? "",
            experimentId: experiment?.id ?? "",
            experimentTitle: experiment?.title ?? "",
            submissionId: submission?.id ?? "",
            score: `${submission?.scorePoints ?? 0}/${submission?.scoreMaximum ?? 0}`,
            rubricVersion: submission?.rubricVersion ?? "unversioned",
            issueType,
            message,
            reflectionText: submission?.attemptSnapshot?.reflectionResponses?.[reflectionId] ?? "",
            placementSnapshot: {
    experimentId:
        submission?.placementSnapshot
            ?.experimentId ?? "",

    components:
        submission?.placementSnapshot
            ?.components ?? [],

    labels:
        submission?.placementSnapshot
            ?.labels ?? []
}
        };
    },

    async send(payload) {
        await fetch(this.endpointUrl, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });
    }

};

export default ProblemReportManager;
