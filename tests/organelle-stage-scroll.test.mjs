import assert from "node:assert/strict";
import OrganelleView from "../src/app/OrganelleView.js";
import Stage from "../src/app/OrganelleExperimentStage.js";

const originalDocument = globalThis.document;
const originalOpen = Stage.open;
const originalReview = Stage.openReview;
const originalReexamine = Stage.openReexamine;
try {
    const calls = [];
    globalThis.document = {
        getElementById(id) {
            assert.equal(id, "organelle-experiment-stage");
            return { scrollIntoView(options) { calls.push(["scroll", options]); } };
        }
    };
    Stage.open = () => calls.push(["open"]);
    Stage.openReview = () => calls.push(["review"]);
    Stage.openReexamine = () => calls.push(["reexamine"]);
    OrganelleView.openExperiment({ id: "test" });
    OrganelleView.reviewSubmission({ id: "test" }, null);
    OrganelleView.reexamineExperiment({ id: "test" });
    assert.deepEqual(calls, [
        ["open"], ["scroll", { behavior: "smooth", block: "start" }],
        ["review"], ["scroll", { behavior: "smooth", block: "start" }],
        ["reexamine"], ["scroll", { behavior: "smooth", block: "start" }]
    ]);
} finally {
    globalThis.document = originalDocument;
    Stage.open = originalOpen;
    Stage.openReview = originalReview;
    Stage.openReexamine = originalReexamine;
}
console.log("PASS: opening, reviewing, or re-examining an experiment brings the stage to the top.");
