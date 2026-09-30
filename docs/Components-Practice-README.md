# RuBisCO components and permanent practice

## Install on your Mac

This cumulative update includes the Calvin C1 activity, revised wording, RuBisCO recipe and visual registration, component synthesis, purpose labels, and permanent practice controls. It contains no PNG assets.

```bash
cd "$HOME/Documents/DCC/BIO 101/ecgame"
unzip -o "$HOME/Downloads/ECGame-RuBisCO-Components-Practice-2026-09-30.zip" -d .
```

Unzip updates the source files directly; no second `cp` is needed for those files. To install the motif images if you have not already copied them:

```bash
mkdir -p public/assets/polymerizer/proteins/9hvm_motifs
cp "$HOME/Desktop/9hvm_motifs/"9hvm-*.png public/assets/polymerizer/proteins/9hvm_motifs/
```

If your motif folder is in Downloads, substitute that path for Desktop. The visual sequence is `9hvm-0.png` through `9hvm-344.png`, inclusive.

## What students see

- Recipe cards show biological purposes, including Calvin Cycle and Lipid Synthesis. Protein level remains the existing effects/benefits level.
- In the Polymerizer, select a recipe and choose Explore assembly · Practice. Practice borrows resources, animates synthesis, and discards its local session on closing. It never creates inventory, discoveries, achievements, conditional releases, or saved mastery.
- In Metabolism's Calvin C1 panel, Practice carbon fixation is available without owning or activating RuBisCO. The normal activity still requires activated RuBisCO and keeps its existing saved mastery.
- Real RuBisCO synthesis offers 16 numbered components or Synthesize full complex. Components follow the CSV chain order, because the existing PNGs are cumulative. Chain letters are retained only as provenance metadata.
- Partially assembled cards turn yellow and display Components #/16. Completing all components grants the normal whole protein once, restores the Synthesized status, and removes the component count. Partial components do not activate full protein benefits.
- The first component costs 63 ATP; after it completes the remaining full complex costs 573 ATP. Component buttons check their own H/B/L requirements; full synthesis checks the summed remaining requirements. Existing motif levels are requirements, not consumed inventory.

`docs/data/9hvm-motifs.csv` is the source for all component recipes, the complete protein motif sequence, and exact terminal frames. Component 1 ends at frame 33, not an even fraction of the image sequence. RuBisCO still has protein level 636 and totals H190/B136/L310.

Other assemblies retain whole-protein synthesis until their own chain CSV and visual boundaries are registered in ProteinComponentCatalog. Fructose-1,6-bisphosphatase has not been assigned guessed component boundaries. Arbitrary out-of-order components would require independently rendered chain images rather than the current cumulative PNG sequence.

## Validate and commit locally

```bash
node --test tests/polymerizer-*.test.mjs tests/calvin-*.test.mjs tests/metabolism-*.test.mjs
git diff --check
git status --short
git add public/css/metabolism.css public/css/polymerizer.css src/app/MetabolismUI.js src/app/PolymerizerManager.js src/app/PolymerizerProductView.js src/app/PolymerizerUI.js src/app/CalvinActivityManager.js src/app/CalvinFixationModel.js src/app/CalvinFixationView.js src/app/CalvinPracticeManager.js src/app/GuidedReactionView.js src/app/PolymerizerComponentManager.js src/app/PolymerizerPracticeView.js src/app/ProteinAssemblyPractice.js src/app/ProteinComponentPlan.js src/data/PolymerizerRecipeCatalog.js src/data/PolymerizerVisualCatalog.js src/data/proteinLibrary.js src/data/ProteinComponentCatalog.js src/data/ProteinPurposeCatalog.js tests/calvin-carbon-fixation.test.mjs tests/polymerizer-components-practice.test.mjs tests/polymerizer-rubisco-9hvm.test.mjs tests/polymerizer-visual-sequence.test.mjs docs/Calvin-C1-README.md docs/Components-Practice-README.md docs/data/9hvm-motifs.csv public/assets/polymerizer/proteins/9hvm_motifs
git commit -m "Add Calvin fixation practice and numbered RuBisCO component synthesis"
```

The scoped staging command avoids unrelated local changes. A local source commit was also made in the development checkout; no remote push was performed. Browser verification used placeholder images because the original PNGs remain on your Mac. Check the real sequence locally after copying it.
