# C3 G3P/DHAP functional-group prototype

Apply after the C3 aldolase-animation patch:

```bash
cd "$HOME/Documents/DCC/BIO 101/ecgame"
unzip -o "$HOME/Downloads/ECGame-Calvin-Triose-Prototype-2026-09-30.zip" -d .
node --test tests/calvin-*.test.mjs tests/metabolism-*.test.mjs tests/polymerizer-*.test.mjs
```

Hard-refresh. Open Metabolism → Calvin Cycle → Practice regeneration. In the first TPI reaction, add TPI and two G3P, then run the enzyme reaction.

This prototype displays the same three-carbon backbone with functional-group labels at carbons 1 and 2. G3P starts with C1 =O and C2 –OH; DHAP ends with C1 –OH and C2 =O. Phosphate remains labeled P at carbon 3. The diagram omits other attached hydrogens and the phosphate's oxygen linkage.

During the animation, the second bond line at C1 fades out as its H label fades in, while C2's second bond line fades in as its H label fades out. The primary bond lines adjust together. The O labels never move between carbons. Both docked sugars change simultaneously, and the final DHAP groups remain visible briefly before the existing product view appears. Students still inspect and collect the two products explicitly.

The animation shows an initial-to-final transformation only. It does not portray proton transfers, intermediates, or hydrogen trajectories. Reduced-motion preferences shorten the transition. Exiting during the transition cancels completion of the unfinished reaction.

Functional-group drawings are limited to C3's first TPI step, including its input molecules, bench, net G3P, and pending DHAP products. Later C3 reactions retain their existing drawings and animations. C1 and C2 are unchanged. This deliberate scope lets you review the prototype before adopting these drawings throughout the pathway.

The patch changes presentation only, preserving reaction accounting, inventory isolation, saves, and practice markers. All 32 Calvin/metabolism/polymerizer test files pass. Browser checks cover initial/mid-transition/final groups, both docked sugars, unchanged P labels, 1024-pixel laptop layout, reduced motion, cancellation, and the complete regeneration flow. Protein images in browser validation were placeholders because the PNG assets are on your Mac.

Commit and push after reviewing:

```bash
git add public/css/metabolism.css src/app/CalvinRegenerationView.js src/app/CalvinTriosePrototypeView.js docs/Calvin-Triose-Prototype-README.md
git commit -m "Prototype G3P to DHAP functional-group animation"
git push origin HEAD
```
