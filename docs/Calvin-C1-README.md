# Calvin Cycle C1 — Carbon Fixation

Based on ECGame main commit 581bf76 (2026-09-30).

## Installation

From your ecgame folder, extract the update ZIP into the project root, then run:

```bash
node --test tests/calvin-*.test.mjs tests/metabolism-*.test.mjs
```

Hard-refresh the browser after installing.

## Where to find it

Metabolism → Pathway Detail → Calvin Cycle → Carbon Fixation.
Synthesize RuBisCO in the Polymerizer and activate it in Calvin slot 1. The
other ten Calvin enzymes are not required for this first guided activity.

## Classroom sequence

1. Start carbon fixation.
2. Drag RuBisCO to its dock, or click its tray card.
3. Add RuBP and CO2 using drag/drop or the tray cards.
4. Run fixation: the unstable six-carbon intermediate splits into two 3-PGA.
5. Repeat until three CO2 have been fixed. RuBisCO stays docked and reusable.
6. Answer the carbon-source check. Incorrect answers provide feedback and retry.
7. Completion is saved automatically. Re-examine starts a fresh practice batch
   without removing completion or awarding additional resources.

## Biology and accounting

- Each reaction: RuBP + CO2 + H2O → two 3-PGA.
- Water is supplied automatically and explicitly identified on screen.
- Green carbon is already present in RuBP; gold carbon enters from CO2.
- Carbon positions and molecule drawings are simplified.
- Three reactions: 3 RuBP + 3 CO2 + 3 H2O → 6 3-PGA; 18 carbons total,
  including 3 newly fixed carbons.
- This fixation step uses no ATP or NADPH. 3-PGA is not yet sugar; reduction
  to G3P is the next development milestone.

## Save behavior

The lesson uses activity-local tokens. It does not spend or award player ATP,
consume synthesized proteins, reset placements, activate starch/glycogen,
or change zone unlocks. Completion is added lazily at:

zones.metabolism.state.guidedActivities['calvin-carbon-fixation']

No save-version migration is introduced. Existing completion survives replay.
Leaving the pathway, returning to Systems Map, leaving Metabolism, or loading
another save discards the unfinished practice batch safely. If saving fails,
completion is rolled back and the lesson offers a retry.

## Next milestones

C2: ATP investment and NADPH reduction.
C3: Net G3P output versus RuBP regeneration.
C4: Regeneration carbon rearrangements.
C5: Complete-cycle operation and mastery.
C6: Symbiont starch storage and sugar export.

## Included files

- public/css/metabolism.css
- src/app/MetabolismUI.js
- src/app/CalvinFixationModel.js
- src/app/CalvinActivityManager.js
- src/app/GuidedReactionView.js
- src/app/CalvinFixationView.js
- tests/calvin-carbon-fixation.test.mjs
- docs/Calvin-C1-README.md
