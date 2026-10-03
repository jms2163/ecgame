# Calvin C2: reduction of 3-PGA to G3P

Install after the Metabolism Practice P update:

```bash
cd "$HOME/Documents/DCC/BIO 101/ecgame"
unzip -o "$HOME/Downloads/ECGame-Calvin-C2-2026-09-30.zip" -d .
node --test tests/calvin-*.test.mjs tests/polymerizer-*.test.mjs tests/metabolism-*.test.mjs
```

Hard-refresh. In Metabolism, select the Calvin Cycle map, then Practice reduction below the Carbon Fixation activity. After finishing C1 practice, Continue to reduction practice opens C2 directly. Opening either activity hides the other and expands the workspace. Exit practice restores both introductions and the normal maps. Navigation away, zone exit, and save import clear both transient sessions.

## What students do

The activity follows six 3-PGA molecules, representing the batch formed from three RuBP and three CO2 in C1. Every activity supplies local molecules and carriers; they are not real inventory. C2 practice can be explored without saved C1 or owning enzymes.

For each of the six molecules:

1. Dock PGK (phosphoglycerate kinase), add 3-PGA, and add ATP by dragging or clicking. Transfer ATP phosphate produces 1,3-bisphosphoglycerate and ADP. The original phosphate on carbon 3 is blue; the ATP-derived phosphate added at carbon 1 is gold. The intermediate remains visible until the student advances.
2. Move intermediate to GAPDH. Dock GAPDH and add NADPH. Use NADPH to reduce produces G3P, NADP+, and free inorganic phosphate (Pi). The original phosphate stays on G3P; the ATP-derived phosphate leaves as Pi. ADP from step 1 is included for collection. No new carbon is added during reduction.
3. Examine the released products below the enzyme, then Store reduction products. The tray receives G3P, ADP, NADP+, and Pi. Collection is an instructional bookkeeping action, not another reaction or membrane transport step.
4. Reduce the next 3-PGA, or proceed to the checkpoint after all six are collected. Enzymes remain docked and reusable; each molecule requires fresh ATP and NADPH.

The four checkpoint questions cover ATP's phosphate/energy contribution, NADPH's electron contribution, the unchanged three-carbon backbone, and six gross versus one net G3P. Wrong answers give feedback and must be corrected before advancing. Score is based on first attempts. A fresh perfect practice run saves green P markers on PGK and GAPDH together; incomplete or imperfect practice saves no new marker. Previously earned markers are preserved. Marker save failure restores both previous records and offers retry.

Six G3P are gross production: five are needed to regenerate three RuBP, leaving one net G3P. That allocation and regeneration will be modeled in later activities. C2 does not export sugar, synthesize starch/glycogen, activate a pathway, or generate a functional G3P inventory item.

## Guided activity and saves

Start reduction is the normal guided mode. It requires saved normal C1 mastery plus PGK and GAPDH activated in Calvin slots 2 and 3. It saves educational completion under guidedActivities['calvin-reduction']; it grants no gameplay reward or practice P. Practice reduction is permanently available and only saves its P markers on a perfect finish. ATP, NADPH, proteins, motif levels, discoveries, achievements, and benefits remain unchanged. No save-version migration or new zone unlock is introduced.

An unfinished reaction session is transient in either mode. Existing C1 mastery and RuBisCO's P remain intact.

## Chemistry and visual simplifications

- PGK: 3-PGA + ATP → 1,3-bisphosphoglycerate + ADP.
- NADPH-dependent GAPDH: 1,3-bisphosphoglycerate + NADPH + H+ → G3P + NADP+ + Pi.
- The batch uses six ATP and six NADPH and forms six ADP, six NADP+, six Pi, and six G3P. Three further ATP will be needed for RuBP regeneration.
- The solution supplies H+; the activity names this contribution without requiring a separate proton inventory. Most atoms, stereochemistry, and carrier structures are omitted. G3P's carbon-1 group is an aldehyde; 3-PGA begins with a carboxyl group. NADPH is represented as supplying an electron pair.
- The existing GAPDH card/image is a structural representative. The activity explicitly identifies Calvin-cycle GAPDH as the NADPH-dependent chloroplast form, distinguishing it from glycolysis's NAD+/NADH chemistry. Existing enzyme identities, recipes, and shared card purposes are preserved.
- Three gold carbons among the six G3P trace the three CO2 carbons from the represented C1 batch. Blue/gold phosphates track retained and transferred phosphate groups, independently of carbon colors. ATP's other two phosphate groups stay in ADP.

Reference reactions: https://enzyme.expasy.org/EC/2.7.2.3 and https://enzyme.expasy.org/EC/1.2.1.13 . Chloroplast enzyme coupling study: https://pubmed.ncbi.nlm.nih.gov/16667700/ .

The view uses existing final-frame PNGs for PGK (3pgk-26.png) and GAPDH (1dc4-20.png). This patch includes no PNGs; no copying is needed if those existing assets are installed. Browser verification uses placeholder images because the original motifs are on your Mac.

## Validation and commit

Model tests cover phase order, missing/wrong/duplicate inputs, six-round carbon and phosphate conservation, collection gates, four questions and imperfect attempts, marker batch rollback/retry/persistence, existing marker preservation, normal mastery gates/rollback, and unchanged gameplay state. Browser checks cover real click/drop handlers, persistent intermediate and products, C1/C2 focus and transition, marker rendering/reload, laptop layout, and navigation cleanup. Existing C1 completion/P tests remain passing.

```bash
git diff --check
git add src/app/CalvinReductionModel.js src/app/CalvinReductionManager.js src/app/CalvinReductionView.js src/app/CalvinActivitiesView.js src/app/CalvinFixationView.js src/app/MetabolismPracticeProgress.js src/app/MetabolismUI.js public/css/metabolism.css tests/calvin-reduction.test.mjs docs/Calvin-C2-README.md
git commit -m "Add Calvin reduction activity with ATP and NADPH accounting"
git push origin HEAD
```

The development checkout has a local source commit; no remote push was performed there.
