// Run with: node --test tests/macromolecularizer-point-prompt.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import MacromolecularizerUI from "../src/app/MacromolecularizerUI.js";

const classes = new Set();
const button = {
    disabled: false,
    classList: {
        toggle(name, enabled) {
            if (enabled) classes.add(name);
            else classes.delete(name);
        },
        remove(name) { classes.delete(name); }
    }
};
const label = () => ({ textContent: "" });
const ui = Object.create(MacromolecularizerUI);
ui.lastSynthesisPointBalance = null;
ui.synthesisPointPromptDismissed = false;
ui.upgradeFeedbackMessage = "";
ui.elements = {
    synthesisPoints: label(),
    speedLevel: label(),
    speedMultiplier: label(),
    secondsPerBond: label(),
    upgradeSpeedButton: button,
    upgradeFeedback: label()
};
const ready = () => classes.has("macro-button--point-ready");
function render(points) {
    ui.renderSpeedUpgrade({
        points: { current: points },
        level: 0,
        speedMultiplier: 1,
        effectiveSecondsPerPeptideBond: 30,
        synthesisPointCost: 1
    });
}

render(0);
assert.equal(button.disabled, true);
assert.equal(ready(), false);
render(1);
assert.equal(button.disabled, false);
assert.equal(ready(), true);
render(1);
assert.equal(ready(), true, "rerendering must not reset the prompt");
ui.dismissSynthesisPointPrompt();
assert.equal(ready(), false, "pressing the button removes the pulse immediately");
render(1);
assert.equal(ready(), false, "remaining points do not restart the pulse");
render(2);
assert.equal(ready(), true, "a newly earned point may prompt again");
ui.dismissSynthesisPointPrompt();
render(0);
assert.equal(ready(), false);
render(1);
assert.equal(ready(), true, "earning a point after spending the last prompts again");

const css = fs.readFileSync(new URL("../public/css/macromolecularizer.css", import.meta.url), "utf8");
assert.match(css, /macro-button--upgrade\.macro-button--point-ready:not\(:disabled\)/);
assert.match(css, /outline: 3px solid #ffd34d/);
console.log("PASS: a spendable synthesis point pulses the yellow button outline until pressed, and later point gains prompt again.");
