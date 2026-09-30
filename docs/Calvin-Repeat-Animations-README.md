# Calvin practice: repeat rounds, molecular transfers, and net output

This patch follows the Calvin C2 update. Apply it from the root of the existing ECGame checkout; it includes source and tests, with no replacement protein images.

## Install on your Mac

```bash
cd "$HOME/Documents/DCC/BIO 101/ecgame"
unzip -o "$HOME/Downloads/ECGame-Calvin-Repeat-Animations-2026-09-30.zip" -d .
node --test tests/calvin-*.test.mjs tests/polymerizer-*.test.mjs tests/metabolism-*.test.mjs
```

Restart the development server if necessary and hard-refresh the browser. Unzip updates the files directly in the VS Code project; no additional cp command is needed.

## Student activity

- C1: students manually fix one CO2, add water, observe cleavage, and collect two 3-PGA. "Repeat this whole process" then performs the remaining identical rounds. Three fixations produce six 3-PGA. The manual next-round option remains available.
- C2: students complete one phosphorylation and reduction and collect its products. They can repeat the remaining rounds together, producing six G3P from six 3-PGA using six ATP and six NADPH. Batch repetition cannot skip the first manual round or count a completed round twice.
- ATP appears on the left with its terminal yellow phosphate facing carbon 1. ATP glides in, the phosphate moves onto the molecule, and ADP departs to the left. The intermediate remains visible afterward.
- NADPH transfers a white H-minus token accompanied by two electron dots. These travel together as one hydride transfer; two additional electrons do not follow. NADP-plus and the reaction products remain visible after the animation. The illustration is schematic: enzyme-bound intermediates and the additional solution proton are omitted. Phosphate is attached through oxygen, as in the existing molecular schematic, rather than depicting a literal direct carbon-phosphorus bond.
- Before the reduction questions, students allocate five of the six G3P (15 carbons) toward regeneration of three RuBP and one G3P (3 carbons) as net output. Dragging and button alternatives are available. The quiz stays locked until that budget is complete. Any G3P can be chosen; a traced CO2 carbon does not designate a special net-output molecule.
- This allocation reserves carbon for the next regeneration activity; it does not enact regeneration or export actual game sugar. Practice completion still requires 100% to award the green P. Practice does not activate metabolic benefits, discoveries, or achievements.

The animations respect reduced-motion preferences. Exiting during an animation cancels the visual and does not complete the unfinished reaction.

## Validation

All 31 Calvin, polymerizer, and metabolism test files passed. A browser walkthrough verified manual and repeat gates, phosphate transfer, bundled hydride transfer, product collection, mandatory G3P allocation, perfect-practice markers, cancellation, reduced motion, and laptop layout. The browser used placeholder protein images because the actual PNG assets are on your Mac.

## Commit and push from your Mac

```bash
git add public/css/metabolism.css src/app/CalvinFixationModel.js src/app/CalvinFixationView.js src/app/CalvinReductionManager.js src/app/CalvinReductionModel.js src/app/CalvinReductionView.js src/app/GuidedTransferAnimation.js tests/calvin-reduction.test.mjs tests/calvin-repeat-allocation.test.mjs docs/Calvin-Repeat-Animations-README.md
git commit -m "Reduce Calvin repetition and animate phosphate and hydride transfers"
git push origin HEAD
```

The next milestone is the guided RuBP regeneration activity, including rearrangement of the reserved 15 carbons and the remaining three-ATP cost per net G3P.
