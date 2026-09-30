# Polymerizer protein zoom defaults

All 30 requested zoom defaults are configured in src/data/PolymerizerVisualCatalog.js. Aquaporin remains at 210%, bringing the configured set to 31 proteins. “Energy kings” maps to Energy Kinase; “glycogenic” maps to Glycogenin; TPT maps to Triose Phosphate Translocator.

The + and − buttons and console size logging remain available. Manual adjustments are kept separately for each protein during the session. Reloading restores catalog defaults. New proteins without a configured displayZoomPercent start at 100%.

The PNG files, their pixel dimensions, assembly behavior, and player saves are unchanged.

| Protein | Default zoom |
| --- | ---: |
| Aquaporin | 210% |
| Transketolase | 270% |
| RuBisCO (9HVM · full assembly) | 190% |
| Glucose Transporter | 160% |
| Energy Kinase | 160% |
| Glycerol-3-Phosphate Acyltransferase | 210% |
| Glycogenin | 250% |
| Hexokinase | 230% |
| Phosphoglucose Isomerase | 190% |
| Phosphofructokinase-1 | 220% |
| Aldolase | 260% |
| Triose Phosphate Isomerase | 210% |
| Glyceraldehyde-3-Phosphate Dehydrogenase | 210% |
| Phosphoglycerate Kinase | 210% |
| Phosphoglycerate Mutase | 190% |
| Enolase | 180% |
| Pyruvate Kinase | 180% |
| Lactate Dehydrogenase | 180% |
| Formate Acetyltransferase 1 | 260% |
| Fructose-1,6-Bisphosphatase | 260% |
| Sedoheptulose-1,7-Bisphosphatase | 250% |
| Ribose-5-Phosphate Isomerase | 250% |
| Ribulose-5-Phosphate Epimerase | 250% |
| Phosphoribulokinase | 250% |
| Triose Phosphate/Phosphate Translocator (TPT) | 230% |
| Sucrose Synthase 1 | 250% |
| Starch Synthase (GBSSI) | 260% |
| Isoamylase | 250% |
| Ferredoxin (Fd) | 200% |
| Ferredoxin-NADP+ Reductase (FNR) | 280% |
| Plastocyanin (PC) | 230% |

## Install

```sh
cd "$HOME/Documents/DCC/BIO 101/ecgame"
unzip -o "$HOME/Downloads/ECGame-Polymerizer-Protein-Zooms-Complete-2026-09-30.zip" -d .
```

This complete bundle includes the viewer, catalog, and stylesheet, so the earlier Aquaporin patch is not required. Hard-refresh with Command-Shift-R after installation. Check Aquaporin at 210%, RuBisCO at 190%, and transketolase at 270%. No cp command is needed.

## Validation and commit

The earlier catalog-only patch could leave the original viewer at 100%; this failure was reproduced in a browser. The viewer now also sets the image transform directly so an old cached stylesheet cannot omit the scale. All 31 values were checked against the requested defaults. All 16 Polymerizer test files passed. A browser check selected every protein, confirmed the zoom readout and rendered scale, exercised +/− and console logging, verified reload defaults, and confirmed unchanged game state.

```sh
node --test tests/polymerizer-*.test.mjs
git add src/app/PolymerizerUI.js src/data/PolymerizerVisualCatalog.js public/css/polymerizer.css docs/Polymerizer-Protein-Zooms-README.md
git commit -m "Configure preferred zoom defaults for Polymerizer proteins"
git push
```
