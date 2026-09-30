# Calvin fixation: hydration and visible phosphate groups

Install this patch after the RuBisCO Components Practice update.

```bash
cd "$HOME/Documents/DCC/BIO 101/ecgame"
unzip -o "$HOME/Downloads/ECGame-Calvin-Hydration-2026-09-30.zip" -d .
mkdir -p public/assets/polymerizer/proteins/9hvm_motifs
cp "$HOME/Desktop/9hvm_motifs/"9hvm-*.png public/assets/polymerizer/proteins/9hvm_motifs/
node --test tests/calvin-*.test.mjs tests/polymerizer-*.test.mjs tests/metabolism-*.test.mjs
```

Use Downloads instead of Desktop if that is where your motif folder is. The previous Components Practice instructions incorrectly used public/assets/9hvm; the corrected path above matches the visual catalog. Copying again is harmless. The patch contains no PNG images. The activity uses the catalog's fully colored final frame, 9hvm-344.png.

Both practice and the normal guided activity now show:

- RuBisCO's colored assembly image in the input tray and enzyme dock.
- An animated CO2 carbon joining the original five-carbon backbone as a branch on carbon 2, followed by the intermediate's name fading in. The intermediate remains until the student advances.
- H2O in the tray, draggable to the marked hydration/cleavage site. Clicking the tray button is an accessible alternative.
- A separate Split into two 3-PGA button after hydration. No timed automatic splitting occurs.
- Two attached P markers on RuBP, retained as one on each product. The 3 in 3-phosphoglycerate indicates carbon position, not phosphate count. The newly fixed carbon is shown away from the product's phosphate-bearing end.

The diagram omits most atoms and stereochemistry. Water hydrates the intermediate at original RuBP carbon 3, enabling cleavage of the original C2–C3 bond; this is more precise than treating the step as generic bond hydrolysis. The marked dock represents this local reaction site rather than an atomically literal water trajectory. The overall neutral-acid shorthand is RuBP + CO2 + H2O → 2 3-PGA; proton terms depend on the chosen ionization convention and are omitted in this introductory model. No phosphate is released and this fixation reaction uses no ATP or NADPH.

Mechanistic source: https://pmc.ncbi.nlm.nih.gov/articles/PMC10336775/ (Crystal structure of a type III Rubisco in complex with its product 3-phosphoglycerate).

Existing saved mastery is preserved. Practice remains transient, with no inventory or progression changes. The session model now requires water before product formation. Tests cover this gate, duplicate inputs, three-round accounting, normal save rollback, and practice isolation. Browser verification exercises water dropping, click fallback, persistent intermediate, explicit cleavage, product phosphate counts, and the final PNG path. PNGs were mocked because the original assets are on your Mac.

To commit this patch locally after reviewing it:

```bash
git diff --check
git add src/app/CalvinFixationModel.js src/app/CalvinFixationView.js src/app/GuidedReactionView.js public/css/metabolism.css tests/calvin-carbon-fixation.test.mjs tests/polymerizer-components-practice.test.mjs docs/Components-Practice-README.md docs/Calvin-Hydration-README.md public/assets/polymerizer/proteins/9hvm_motifs
git commit -m "Make Calvin fixation hydration explicit and show retained phosphates"
```

If the preceding Components Practice update is not committed yet, use its scoped staging command first, then stage this patch. No remote push was performed by this patch workflow.
