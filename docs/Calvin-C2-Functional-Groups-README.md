# C2: show carbon-1 reduction and the photosynthesis NADPH icon

Apply after the C3 triose functional-group prototype:

```bash
cd "$HOME/Documents/DCC/BIO 101/ecgame"
unzip -o "$HOME/Downloads/ECGame-Calvin-C2-Functional-Groups-2026-09-30.zip" -d .
node --test tests/calvin-*.test.mjs tests/metabolism-*.test.mjs tests/polymerizer-*.test.mjs
```

Hard-refresh and open Practice reduction in Metabolism → Calvin Cycle. Complete the ATP phosphorylation, move the intermediate to GAPDH, then add GAPDH, NADPH, and the new H-plus input before clicking Use NADPH to reduce. Inputs support both clicking and dragging.

The 1,3-bisphosphoglycerate drawing now shows carbon 1's double-bonded O and its O–P attachment, carbon 2's OH, and carbon 3's retained P. The G3P drawing shows C1's unchanged =O plus its new H. During reduction, the O–P attachment glides away and fades while the C–H attachment appears. The oxygen in =O stays in place. Functional-group detail is shown on the intermediate and G3P; the earlier 3-PGA/ATP approach animation remains unchanged.

NADPH and NADP-plus use the yellow notched carrier shape and colors from the photosynthesis simulation. NADPH's white H and two blue electron dots move together as one hydride transfer toward the carbon-1 H position. The carrier becomes NADP-plus with an empty notch. Its caption describes a hydrogen nucleus plus two electrons (H-minus), rather than an additional electron pair following a hydrogen transfer.

A separate white H-plus circle from solution is a required activity-local input. It glides into the enzyme area and disappears to represent its use in the net reaction. It is not depicted becoming a second hydrogen on carbon 1. Detailed proton-transfer routes, intermediates, and protonation states are omitted. The six-molecule repeat supplies six new solution protons, and the ledger counts six protons used together with six NADPH. No real game resource is consumed.

Products remain visible until explicitly collected: G3P, NADP-plus, Pi, and ADP carried forward from the earlier PGK step. The explanation identifies carbon 1 as reduced and states that =O did not become OH. ADP is not an input or a product of GAPDH itself.

Reaction reference: [NADP-dependent GAPDH](https://enzyme.expasy.org/EC/1.2.1.13), read in the Calvin direction: 1,3-bisphosphoglycerate + NADPH + H-plus → G3P + NADP-plus + Pi. The diagrams show selected groups, not complete molecular structures; phosphate is abbreviated P except for the displayed carbon-1 O–P linkage.

Existing completion records and P markers remain valid. This patch changes transient reaction requirements and presentation without changing save versions, inventory, discoveries, achievements, or pathway benefits. C1 and C3 retain their existing activities and visuals.

Validation: all 32 Calvin/metabolism/polymerizer test files pass. Tests check the new proton requirement in both input orders, wrong-stage rejection, consumed inputs, repeated-batch accounting, carbon/phosphate conservation, and the existing save/marker rules. Browser validation covers the functional groups before and after reduction, the photosynthesis carrier, bundled electrons, required H-plus, product collection, repeat/allocation/questions, cancellation during reduction, reduced motion, and laptop layout. Protein PNGs were placeholders in browser validation because the actual assets are on your Mac.

Commit after review:

```bash
git add public/css/metabolism.css src/app/CalvinReductionView.js src/app/CalvinReductionModel.js src/app/CalvinReductionVisuals.js tests/calvin-reduction.test.mjs tests/calvin-repeat-allocation.test.mjs docs/Calvin-C2-Functional-Groups-README.md
git commit -m "Show Calvin carbon-one reduction and photosynthesis NADPH carrier"
git push origin HEAD
```
