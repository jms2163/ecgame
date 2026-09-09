import assert from "node:assert/strict";

import OrganelleExperimentLibrary
    from "../src/app/OrganelleExperimentLibrary.js";
import OrganelleExperimentPanel
    from "../src/app/OrganelleExperimentPanel.js";
import OrganelleExperimentStage
    from "../src/app/OrganelleExperimentStage.js";
import SaveManager
    from "../src/app/SaveManager.js";

class FakeElement {

    constructor(tagName) {
        this.tagName = tagName.toUpperCase();
        this.children = [];
        this.dataset = {};
        this.listeners = {};
        this.attributes = {};
        this.className = "";
        this.textContent = "";
    }

    append(...children) {
        children.forEach(child =>
            this.appendChild(child)
        );
    }

    appendChild(child) {
        this.children.push(child);
        return child;
    }

    setAttribute(name, value) {
        this.attributes[name] = String(value);
    }

    addEventListener(type, listener) {
        this.listeners[type] = listener;
    }

    click() {
        this.listeners.click?.({
            preventDefault() {}
        });
    }

}

function findElement(root, predicate) {
    if (predicate(root)) {
        return root;
    }

    for (const child of root.children) {
        const match =
            findElement(child, predicate);

        if (match) {
            return match;
        }
    }

    return null;
}

const experiment =
    OrganelleExperimentLibrary
        .aquaporin_facilitated_diffusion;

const attemptControlIds =
    OrganelleExperimentStage
        .getControlsForMode(
            experiment,
            "attempt"
        )
        .map(control =>
            typeof control === "string"
                ? control
                : control.id
        );

const reexamineControlIds =
    OrganelleExperimentStage
        .getControlsForMode(
            experiment,
            "reexamine"
        )
        .map(control =>
            typeof control === "string"
                ? control
                : control.id
        );

assert.ok(
    attemptControlIds.includes("reflection"),
    "the graded attempt should retain reflection"
);

assert.ok(
    attemptControlIds.includes("submit"),
    "the graded attempt should retain submission"
);

assert.ok(
    reexamineControlIds.includes("simulate"),
    "re-examine mode should retain simulation"
);

assert.ok(
    reexamineControlIds.includes("rotate"),
    "re-examine mode should retain protein rotation"
);

assert.ok(
    reexamineControlIds.includes("labels"),
    "re-examine mode should retain label interaction"
);

assert.ok(
    reexamineControlIds.includes("reset"),
    "re-examine mode should retain reset"
);

assert.ok(
    !reexamineControlIds.includes("reflection"),
    "re-examine mode should remove reflection"
);

assert.ok(
    !reexamineControlIds.includes("submit"),
    "re-examine mode should remove submission"
);

OrganelleExperimentStage.isReexamineMode =
    true;

const stateBeforeBlockedSubmission =
    SaveManager.export();

assert.deepEqual(
    OrganelleExperimentStage.submitExperiment(),
    {
        submitted: false,
        reason: "reexamine-mode"
    },
    "re-examine mode should reject direct submission calls"
);

assert.equal(
    SaveManager.export(),
    stateBeforeBlockedSubmission,
    "a blocked re-examine submission should not change saved game state"
);

OrganelleExperimentStage.isReexamineMode =
    false;

const previousDocument =
    globalThis.document;

globalThis.document = {
    createElement(tagName) {
        return new FakeElement(tagName);
    }
};

let reviewedExperimentId = null;
let reexaminedExperimentId = null;

OrganelleExperimentPanel.onReviewSubmission =
    reviewedExperiment => {
        reviewedExperimentId =
            reviewedExperiment.id;
    };

OrganelleExperimentPanel.onReexamineExperiment =
    reexaminedExperiment => {
        reexaminedExperimentId =
            reexaminedExperiment.id;
    };

const completedCard =
    OrganelleExperimentPanel.createExperimentCard(
        experiment,
        {
            completed: true,
            available: false,
            missingDiscoveries: [],
            incompleteExperiments: []
        }
    );

const reviewLink =
    findElement(
        completedCard,
        element =>
            element.textContent ===
            "Review submission"
    );

const reexamineButton =
    findElement(
        completedCard,
        element =>
            element.tagName === "BUTTON" &&
            element.textContent === "Re-examine"
    );

assert.ok(
    reviewLink,
    "a completed card should retain Review submission"
);

assert.ok(
    reexamineButton,
    "a completed card should add a Re-examine button"
);

reviewLink.click();
reexamineButton.click();

assert.equal(
    reviewedExperimentId,
    experiment.id,
    "Review submission should retain its existing callback"
);

assert.equal(
    reexaminedExperimentId,
    experiment.id,
    "Re-examine should invoke its separate callback"
);

globalThis.document =
    previousDocument;

console.log(
    "PASS: re-examine mode retains simulation tools while blocking reflection, submission, and grading."
);
