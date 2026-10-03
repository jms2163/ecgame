# Krebs protein imports — 2026-10-02

The Polymerizer now uses the supplied CSVs for these six enzymes. All short
motifs count toward recipes even when they did not generate a separate PNG.

| Protein | PDB | H | B | L | Frames | Components |
| --- | --- | ---: | ---: | ---: | --- | --- |
| Citrate Synthase | 1IXE | 41 | 10 | 38 | 0–45 | 2 |
| Aconitase | 1L5J | 42 | 27 | 56 | 0–59 | 1 |
| Isocitrate Dehydrogenase, NAD+-dependent | 2D4V | 40 | 32 | 56 | 0–57 | 2 |
| Succinyl-CoA Synthetase | 1SCU | 77 | 61 | 115 | 0–84 | 4 |
| Fumarase | 6MSO | 41 | 48 | 71 | 0–74 | 2 |
| Malate Dehydrogenase | 7NRZ | 24 | 22 | 44 | 0–45 | 2 |

## Repair missing cards after manually installing PNGs

Magick resizes images; copying those PNGs does not register an enzyme card.
The complete six-card ZIP includes the catalog integrations from the earlier
three-card patch, so it can be installed even if that earlier ZIP was skipped.
It changes code and CSV metadata only; it does not resize or replace PNGs.

```bash
cd "$HOME/Documents/DCC/BIO 101/ecgame"
unzip -o "$HOME/Downloads/ECGame-Krebs-Six-Cards-2026-10-02.zip" -d .
node --test tests/polymerizer-krebs-proteins.test.mjs tests/polymerizer-visual-sequence.test.mjs
```

Open this project through VS Code Live Server and hard-refresh. The six new
cards appear under Incomplete if synthesis requirements are not met, or Ready
when they are met. Existing completed cards remain in their usual groups.
GitHub Pages will show the local patch after it is committed/pushed and deployed.

Citrate Synthase costs 45 ATP for component 1 and 44 for component 2.
Isocitrate Dehydrogenase costs 65 ATP for component 1 and 63 for component 2.
Aconitase costs 125 ATP for the monomer. Permanent motif levels are not consumed.
Only complete assemblies enter the inventory used by Metabolism. Synthesis does
not place or activate a pathway enzyme, award a practice P, or enable Automate.
Practice remains educational and independent of these synthesis requirements.

Confirmed Polymerizer zoom defaults: Citrate Synthase 150%, Aconitase 260%,
Isocitrate Dehydrogenase 270%, Succinyl-CoA Synthetase 210%, and Fumarase 240%.
Malate Dehydrogenase remains at 100% pending a visual check. The existing +/−
buttons remain available. The generated data catalog keeps per-protein zoom
values on subsequent installer runs. Existing proteins retain their zoom settings.

## Install fresh images

Place the fresh full-resolution runs in:

```
~/Downloads/1ixe_motifs/
~/Downloads/1l5j_motifs/
~/Downloads/2d4v_motifs/
~/Downloads/1scu_motifs/
~/Downloads/6mso_motifs/
~/Downloads/7nrz_motifs/
```

Each must include its white frame 0 and the complete sequence above. The installer
accepts lowercase or uppercase PDB filename prefixes, normalizing installed names
to lowercase. A new local `motifs.csv` is used when present; otherwise the supplied
CSV in `docs/data` is used. It verifies model identity, selected-chain counts,
motif and frame numbering, and complete PNG ranges before updating project files.

From the project folder, after unzipping the patch:

```bash
python3 tools/install_krebs_proteins.py
node --test tests/polymerizer-*.test.mjs tests/metabolism-*.test.mjs tests/krebs-practice.test.mjs
```

The installer runs the same ImageMagick operation used in the earlier trials:

```bash
magick mogrify -path "$temporary_folder" -filter Lanczos -resize '50%' \
  "$HOME/Downloads/1ixe_motifs/"1ixe-*.png
```

It generates every reduced series in a temporary directory, installs it under
`public/assets/polymerizer/proteins/<pdb>_motifs`, reports byte savings by protein
and in total, and removes temporary reduced copies. Fresh Downloads originals
remain unchanged. Rerunning reads those originals again, so it does not halve
the already-reduced project images a second time. Nothing is committed or pushed.

To install only one fresh series:

```bash
python3 tools/install_krebs_proteins.py --protein 1l5j
```

## Recalculate secondary structure in ChimeraX

For Succinyl-CoA Synthetase open as model #1:

```
dssp #1 report true
cartoon #1
```

Then rerun `make_motifs.py` for a consistent fresh PNG/CSV run. DSSP assigns helices
and strands from backbone coordinates; it cannot reconstruct missing coordinates.
Reference: https://www.cgl.ucsf.edu/chimerax/docs/user/commands/dssp.html

## Proteins still awaiting motifs and CSVs

| Enzyme | Suggested PDB | Organism | Assembly / qualification |
| --- | --- | --- | --- |
| Alpha-ketoglutarate dehydrogenase complex | 2JGD for E1 only; full complex design still pending | E. coli (bacterium) | E1 homodimer; full complex requires E1, E2 and E3 |
| Succinate dehydrogenase / Complex II | 8B6G; smaller alternative 1NEK | Tetrahymena thermophila (protist); E. coli alternative | Deposited 8B6G assembly has 15 protein chains; 1NEK author-assigned assembly has 4 |

References: https://www.rcsb.org/structure/2JGD,
https://www.rcsb.org/structure/1SCU, https://www.rcsb.org/structure/8B6G,
https://www.rcsb.org/structure/1NEK, https://www.rcsb.org/structure/6MSO,
https://www.rcsb.org/structure/7NRZ

### Deferred revision: alpha-ketoglutarate dehydrogenase

- Preserve the current single practice step as a summary of the whole reaction.
- Revise the eventual Polymerizer parent recipe to require E1, E2 and E3.
- A completed E1 model alone must never count as a complete active complex.
- 2JGD is a structural E1 representative, not a complete assembly model.
- Investigate a coherent set of component models before releasing the full recipe.

### Chain-count clarification

9HVM is the previously added RuBisCo: eight large chains plus eight small chains
(L8S8), 16 total. The 15-chain suggestion above refers to 8B6G, a different protein
complex. No change to RuBisCo's existing 16 numbered components is needed.

## Checks

The new Node test verifies all six visible, selectable cards with no prerequisites,
exact CSV counts and motif order, frame zero, final images, numbered component
costs, partial-versus-full inventory availability,
isolated practice, and synthesis without automatic pathway activation or rewards.
The Python tests check wrong CSV identity, final short-motif frames, and rejection
of a missing white frame before project data changes.

```bash
python3 -m unittest discover -s tests -p 'test_krebs_protein_installer.py'
```
