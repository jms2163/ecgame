# Green P for perfect metabolic practice

Install after the Calvin Product Collection update:

```bash
cd "$HOME/Documents/DCC/BIO 101/ecgame"
unzip -o "$HOME/Downloads/ECGame-Metabolism-Practice-P-2026-09-30.zip" -d .
node --test tests/calvin-*.test.mjs tests/polymerizer-*.test.mjs tests/metabolism-*.test.mjs
```

Hard-refresh the game. No PNG copying is needed.

Finish Practice carbon fixation: run all three reactions, collect each product pair, and answer the carbon-source question correctly without a preceding incorrect answer. This saves a green circled P at the top right of RuBisCO's enzyme card in Metabolism. Exit practice to see it in the restored enzyme tray. It remains after saving, exporting/importing that save, and reloading.

An early exit or an imperfect answer attempt earns no P. Re-examine to attempt a fresh perfect run. A later imperfect replay does not remove an earned marker. Existing past practice cannot be backfilled because its completion was deliberately not saved. A previously saved normal guided-activity completion is separate; the new P is earned through the Practice button.

This intentionally revises the earlier promise that all practice is entirely unsaved: reactions stay transient, but a perfect Calvin finish now saves the requested educational marker and the normal save timestamp. It changes no inventory, ATP, motif levels, discoveries, achievements, pathway activation, benefits, or conditional releases. Polymerizer assembly practice remains entirely transient. The P does not mean that RuBisCO has been synthesized or activated.

The optional record is under zones.metabolism.state.practiceMastery.RuBisCO with the activity ID, 100% score, and completion timestamp. No save-version migration is needed. A failed save rolls back the marker, shows a retry button, and preserves unrelated records. The reusable marker renderer supports other enzymes once their activities explicitly register perfect completion.

Tests cover incomplete and imperfect attempts, perfect completion, save rollback/retry, persistence, duplicate completion, replay, and unchanged gameplay state. Browser checks cover the green marker's top-right position, its visibility after Exit practice, and persistence after reload, along with the full reaction/collection flow. PNGs are mocked in browser verification.

To commit this patch locally after reviewing:

```bash
git diff --check
git add src/app/MetabolismPracticeProgress.js src/app/CalvinPracticeManager.js src/app/CalvinFixationView.js src/app/MetabolismEnzymeTrayView.js public/css/metabolism.css tests/metabolism-practice-marker.test.mjs tests/polymerizer-components-practice.test.mjs docs/Metabolism-Practice-Marker-README.md
git commit -m "Mark perfect Calvin practice with a saved green P on RuBisCO"
git push origin HEAD
```

The development checkout has a local source commit; no remote push was performed there.

Next planned milestone: Calvin C2 reduction. Students use ATP to phosphorylate 3-PGA, then NADPH to reduce it toward G3P, tracking ADP, inorganic phosphate, and NADP+. Export and RuBP regeneration remain later milestones.
