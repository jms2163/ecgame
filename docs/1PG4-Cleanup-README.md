# Fresh 1PG4 and unused alternative cleanup

Adds Acetyl-CoA Synthetase to Polymerizer: Source 1PG4, H25/B30/L44, 99 game ATP, 39.75-second assembly, frames 0–47, initial 120% zoom. Uses the supplied fresh single-chain CSV (including short motifs). The last CSV reveal is 46; the trailing short loop is included in final image 47 by make_motifs.py.

The card's purpose is Acetyl-CoA Formation. Synthesis creates the normal saved protein inventory. Practice stays local. It grants no discoveries, achievements or pathway benefits, and does not alter the existing Acetyl-CoA macromolecule recipe.

Protein reference: https://www.rcsb.org/structure/1PG4.

## Install and resize the fresh Downloads run

```sh
cd "$HOME/Documents/DCC/BIO 101/ecgame"
unzip -o "$HOME/Downloads/ECGame-1PG4-Cleanup-2026-09-30.zip" -d .
python3 tools/install_1pg4_cleanup.py
```

The fresh full-size PNGs must be in `$HOME/Downloads/1pg4_motifs` and include all 48 images, 1pg4-0.png through 1pg4-47.png. The installer does not reuse the older project series as its resize source. It creates 50%-dimension images, copies them into `public/assets/polymerizer/proteins/1pg4_motifs`, and deletes the temporary reduced duplicates automatically. The full-size Downloads run is unchanged.

It deletes only the confirmed unused alternatives `3o8n_motifs` (alternative PFK), `1ebh_motifs` (alternative enolase), and `1qo5_motifs` (alternative aldolase). It stops before deletion if one of those PDBs is referenced in the current local src files. Other unreferenced folders are left for separate identification and review. Previous committed image versions remain in Git history.

Each removed folder's size, the fresh/resized 1PG4 sizes, and the exact local source-file estimate before/after are printed. Earlier GitHub measurements put the three alternatives at approximately 63.4 MiB (66.5 MB) combined. Relative to the previous approximately 847 MB estimate, removing them yields roughly 781 MB before replacing the old 1PG4 series. The replacement's net size change is unknown until the new images are processed on the Mac.

Hard-refresh and find Acetyl-CoA Synthetase. Confirm 120% zoom, white frame 0 and full colored frame 47. Adjust +/− if needed and report the preferred zoom.

## Checks

37 relevant Calvin, metabolism, Polymerizer and acetyl-CoA test files passed; browser verified the new card, frame-zero URL and 120% transform. Installer is syntax checked; actual Mac PNG resizing and local deletions run only when the above command is executed.

## Commit and push after visual review

```sh
git status --short
git add src/data/PolymerizerRecipeCatalog.js src/data/PolymerizerVisualCatalog.js src/data/ProteinPurposeCatalog.js src/data/proteinLibrary.js tests/polymerizer-acetyl-coa-synthetase.test.mjs tests/polymerizer-visual-sequence.test.mjs docs/data/1pg4-motifs.csv docs/1PG4-Cleanup-README.md tools/install_1pg4_cleanup.py
git add -A public/assets/polymerizer/proteins/1pg4_motifs public/assets/polymerizer/proteins/3o8n_motifs public/assets/polymerizer/proteins/1ebh_motifs public/assets/polymerizer/proteins/1qo5_motifs
git diff --cached --stat
git commit -m "Add fresh Acetyl-CoA synthetase images and remove unused alternatives"
git push
```
