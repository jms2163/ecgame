# Calvin C3: regenerate RuBP

Apply after the Calvin repeat/animations update. This patch adds the third guided activity in Metabolism → Calvin Cycle and a Continue to regeneration practice button at the end of C2.

## Install

```bash
cd "$HOME/Documents/DCC/BIO 101/ecgame"
unzip -o "$HOME/Downloads/ECGame-Calvin-C3-2026-09-30.zip" -d .
node --test tests/calvin-*.test.mjs tests/polymerizer-*.test.mjs tests/metabolism-*.test.mjs
```

Hard-refresh the browser. No cp command or additional image installation is needed. Existing enzyme PNGs are reused; if an image is unavailable, its enzyme label remains usable.

## What students do

Five reserved G3P start on the regeneration bench. One other G3P stays in a separate net-output area throughout the reactions. Students drag or click the enzyme and each required input into the chamber, run the reaction, inspect its products, and explicitly collect them before continuing. The bench retains intermediates that are waiting for other reactions. This is one valid route through a network, rather than a claim that all intermediates follow the same linear path.

| Part | Enzyme | Reaction modeled | Student action |
| --- | --- | --- | --- |
| 1 | TPI | 2 G3P → 2 DHAP | Dock two G3P; rearrange them together. |
| 1 | Aldolase | DHAP + G3P → FBP | Join two three-carbon sugars; inspect the six-carbon product. |
| 1 | FBPase | FBP + H₂O → F6P + Pi | Add water; watch it approach a phosphate and the released phosphate depart. |
| 1 | Transketolase | F6P + G3P → E4P + Xu5P | Move a visible two-carbon fragment: 6 + 3 becomes 4 + 5. |
| 1 | Aldolase | DHAP + E4P → SBP | Join three and four carbons to make seven. |
| 1 | SBPase | SBP + H₂O → S7P + Pi | Add water to remove a phosphate while retaining seven carbons. |
| 1 | Transketolase | S7P + G3P → R5P + Xu5P | Transfer another two-carbon fragment: 7 + 3 becomes 5 + 5. |
| 2 | RPI | R5P → Ru5P | Rearrange one five-carbon sugar. |
| 2 | RPE | 2 Xu5P → 2 Ru5P | Dock both five-carbon sugars; rearrange them together. |
| 3 | PRK | 3 Ru5P + 3 ATP → 3 RuBP + 3 ADP | Complete one ATP transfer manually, then repeat the remaining two together or explore them individually. |

Full sugar names are available on hover. FBP and SBP have two phosphates; F6P and S7P have one. Ru5P is ribulose-5-phosphate; RuBP is ribulose-1,5-bisphosphate. ATP remains on the left, its terminal phosphate glides toward carbon 1, and ADP departs left. New RuBP shows its ATP-derived phosphate in gold.

The ledger conserves 15 sugar carbons throughout, counts 3 ATP and 3 ADP, and shows 3 collected RuBP. Two waters are used and two Pi released in this regeneration activity. The retained net G3P is excluded from that 15-carbon recycling ledger. No extra CO₂ enters regeneration.

Students finish by returning the three regenerated RuBP to the fixation tray, then answering five questions about the carbon source, two-carbon transfer, ATP, RuBP reuse, and the complete batch's 9 ATP/6 NADPH cost per net G3P. Returning to the tray is an educational state transition, not actual molecule export into game inventory or a new fixation reaction. A completed practice offers Return to carbon fixation practice to begin a new supplied batch.

## Practice, mastery, and persistence

Practice regeneration is permanently available, independently of protein ownership, levels, or earlier saved completions. The existing map and other activity introductions collapse while C3 is open. Exit practice, navigation away, zone exit, and save import clear transient activity state. Reduced-motion preferences are respected. Exiting during an animation cancels it before its unfinished reaction can update the model.

Five correct answers on first attempts save green P markers for the eight regeneration enzymes together. Earlier shared-enzyme markers are preserved. Wrong answers provide feedback and must be corrected; an imperfect run does not award new P markers. A failed save restores previous records and exposes Retry saving regeneration.

Start regeneration is the normal guided mode. It requires saved normal C2 completion and the correct enzymes activated in Calvin slots 4–11. It saves educational completion at guidedActivities['calvin-regeneration']. Practice saves only perfect-practice markers. Neither mode grants a gameplay reward, produces inventory sugars, unlocks discoveries or achievements, or activates ATP benefits. No save migration is introduced.

## Model scope and sources

Carbon circles show backbone size; isomers differ in functional groups or stereochemistry even when the schematic circles look alike. Phosphate attaches through oxygen. Detailed enzyme-bound intermediates, proton balancing, and cofactors such as transketolase's TPP are omitted. Aldolase joining does not release water; the explicitly modeled water use is phosphate-ester hydrolysis by the phosphatases.

Reaction references:

- [Chloroplast transketolase: the two carbon-transfer reactions](https://www.uniprot.org/uniprotkb/Q7SIC9/entry)
- [Experimental study of the two chloroplast aldolase reactions](https://pmc.ncbi.nlm.nih.gov/articles/PMC8628874/)
- [FBPase hydrolysis](https://enzyme.expasy.org/EC/3.1.3.11)
- [SBPase hydrolysis](https://enzyme.expasy.org/EC/3.1.3.37)
- [RPI](https://enzyme.expasy.org/EC/5.3.1.6), [RPE](https://enzyme.expasy.org/EC/5.1.3.1), and [PRK](https://enzyme.expasy.org/EC/2.7.1.19)

## Validation

All 32 Calvin, metabolism, and polymerizer test files passed. Tests check carbon/phosphate conservation after every reaction, exact resource totals, first-manual PRK and repeat gates, missing substrate rejection, atomic repeat failure, quiz/return gates, normal prerequisites, save rollback, perfect-marker persistence, and inventory isolation.

Browser walkthroughs verified C2→C3 and C3→C1 transitions, all dock/run/collect steps, water and carbon-fragment animations, ATP phosphate transfer, net-output separation, repeats, questions, markers, reduced motion, cancellation, and a 1024-pixel laptop layout. The prior C1/C2 walkthrough also passed. Protein images were placeholders in browser validation because the actual PNGs are on your Mac.

## Commit and push when reviewed

```bash
git add public/css/metabolism.css src/app/CalvinActivitiesView.js src/app/CalvinReductionView.js src/app/GuidedTransferAnimation.js src/app/MetabolismUI.js src/app/CalvinRegenerationModel.js src/app/CalvinRegenerationManager.js src/app/CalvinRegenerationView.js tests/calvin-regeneration.test.mjs docs/Calvin-C3-README.md
git commit -m "Add guided Calvin RuBP regeneration practice"
git push origin HEAD
```
