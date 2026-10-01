# Hexokinase and fatty acid synthase component update

Fructose-1,6-bisphosphatase in this project uses PDB **1SPI**, in `public/assets/polymerizer/proteins/1spi_motifs`.

The fatty acid synthase source is **2VZ9** (not 2ZV9). Although the attached CSV filename transposes the letters, its `model_name` entries correctly identify `2vz9`. The structural record is https://www.rcsb.org/structure/2VZ9.

## Exact recipes from the supplied CSVs

| Protein | Component | Source chain | H | B | L | ATP | Reveal frames |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Hexokinase | 1 | A | 37 | 25 | 62 | 124 | 1–65 |
| Hexokinase | 2 | B | 37 | 25 | 64 | 126 | 66–130 |
| Hexokinase | Full complex | A+B | 74 | 50 | 126 | 250 | Final 131 |
| Fatty acid synthase | 1 | A | 85 | 85 | 150 | 320 | 1–161 |
| Fatty acid synthase | 2 | B | 86 | 85 | 151 | 322 | 162–321 |
| Fatty acid synthase | Full complex | A+B | 171 | 170 | 301 | 642 | Final 322 |

Short motifs are included in recipes even when they do not have a separate PNG reveal. Components follow the CSV chain order because the existing PNGs are cumulative. Students can synthesize component 1, then component 2, or synthesize the full complex in one action. After component 1, the full-complex button charges only the remaining component. Partial progress persists, and full inventory is granted only at completion.

Real full fatty acid synthase completion grants the saved **Megasynthase** achievement (`registry.achievements.megasynthase`). One component and practice do not grant it. The achievement and completed inventory roll back together if saving fails. This adds the protein assembly recipe; it does not implement a fatty acid production simulation.

Every configured unsynthesized protein now starts at frame 0. Transketolase retains the complete two-chain recipe, frames 0–87 and 270% zoom. Hexokinase retains 230% zoom. Fatty acid synthase uses the visually confirmed 230% default zoom; the existing +/− controls remain available.

Previously completed proteins remain completed. Already-paid old 95-ATP hexokinase and 176-ATP transketolase jobs keep their paid cost and finish time.

## Install on the Mac

```sh
cd "$HOME/Documents/DCC/BIO 101/ecgame"
unzip -o "$HOME/Downloads/ECGame-Protein-Dimer-Updates-2026-09-30.zip" -d .

mkdir -p public/assets/polymerizer/proteins/1bg3_motifs
cp "$HOME/Downloads/1bg3_motifs/"1bg3-*.png public/assets/polymerizer/proteins/1bg3_motifs/

mkdir -p public/assets/polymerizer/proteins/2vz9_motifs
cp "$HOME/Downloads/2vz9_motifs_run2/"2vz9-*.png public/assets/polymerizer/proteins/2vz9_motifs/

mkdir -p public/assets/polymerizer/proteins/5nd5_motifs
cp "$HOME/Downloads/5nd5_motifs/"5nd5-*.png public/assets/polymerizer/proteins/5nd5_motifs/
```

Hard-refresh the browser after installation. The package includes the current Polymerizer UI, practice and component dependencies, and zoom CSS so those changes can be installed together.

Frame 0 must itself contain the completely white structure. Code chooses `5nd5-0.png` for an untouched transketolase; it cannot remove an orange motif already painted into that PNG. To check the actual source image on the Mac:

```sh
open public/assets/polymerizer/proteins/5nd5_motifs/5nd5-0.png
```

## Verification

35 relevant Calvin, metabolism and Polymerizer test files passed. Browser checks verified frame-zero selection, both new component costs, partial practice and final images. PNGs live on the user's Mac; browser checks used substitute images to verify URLs and behavior, not the actual PNG content or color scheme.

## Commit and push after visual review

```sh
git status --short
git add src/app/PolymerizerComponentManager.js src/app/PolymerizerManager.js src/app/PolymerizerProductView.js src/app/PolymerizerUI.js src/app/PolymerizerPracticeView.js src/app/ProteinAssemblyPractice.js src/app/ProteinComponentPlan.js src/data/PolymerizerRecipeCatalog.js src/data/PolymerizerVisualCatalog.js src/data/ProteinComponentCatalog.js src/data/ProteinPurposeCatalog.js src/data/proteinLibrary.js public/css/polymerizer.css tests/calvin-polymerizer-recipes.test.mjs tests/polymerizer-glycolysis-proteins.test.mjs tests/polymerizer-shell.test.mjs tests/polymerizer-visual-sequence.test.mjs tests/polymerizer-dimer-updates.test.mjs tests/polymerizer-transketolase-components.test.mjs docs/data/1bg3-motifs.csv docs/data/2vz9-motifs.csv docs/data/5nd5-motifs.csv docs/Protein-Dimer-Updates-README.md public/assets/polymerizer/proteins/1bg3_motifs public/assets/polymerizer/proteins/2vz9_motifs public/assets/polymerizer/proteins/5nd5_motifs
git commit -m "Update dimer protein recipes and grant Megasynthase on full synthesis"
git push
```
