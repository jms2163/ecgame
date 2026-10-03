# Acetyl-CoA card

Adds Acetyl-CoA (`AcetylCoA`) to the Macromolecularizer N tab as a COF card.

Requirements: one completed CoA from Macromolecularizer inventory, and prior Acetic Acid synthesis in Molecule Lab. Like other cofactor recipes, those prerequisites are not consumed. Existing shared dehydration knowledge remains required by the assembly system.

Models one thioester linkage; game cost 1 ATP, base time 30 seconds, existing speed upgrades apply. Completion grants normal saved acetyl-CoA inventory and molecule discovery through the existing manager. This adds a recipe rather than a new metabolic pathway or reward.

Description distinguishes the game assembly recipe from cellular chemistry: acetate + CoA + ATP → acetyl-CoA + AMP + pyrophosphate, catalyzed by acetyl-CoA synthetase. Source: https://iubmb.qmul.ac.uk/enzyme/EC6/2/1/1.html. ATP byproducts are explained in text rather than awarded as additional inventory.

Install:

```sh
cd "$HOME/Documents/DCC/BIO 101/ecgame"
unzip -o "$HOME/Downloads/ECGame-Acetyl-CoA-Card-2026-09-30.zip" -d .
```

Hard-refresh. Open N and select Acetyl-CoA. No images or cp commands are needed.

Verification: eight relevant cofactor, nucleotide and Macromolecularizer test files passed. New lifecycle checks verify each precursor gate, one game ATP, synthesis completion, saved inventory and unchanged prerequisites. Browser check confirms the visible COF card and recognized precursor names.

Optional commit and push after checking:

```sh
git add src/data/NucleotideRecipeCatalog.js tests/cofactor-recipes.test.mjs tests/acetyl-coa-synthesis.test.mjs docs/Acetyl-CoA-Card-README.md
git commit -m "Add Acetyl-CoA cofactor recipe to Macromolecularizer"
git push
```
