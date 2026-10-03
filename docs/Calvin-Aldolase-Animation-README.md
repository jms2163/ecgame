# Calvin C3: animate aldolase joining

Install after the C3 regeneration update:

```bash
cd "$HOME/Documents/DCC/BIO 101/ecgame"
unzip -o "$HOME/Downloads/ECGame-Calvin-Aldolase-Animation-2026-09-30.zip" -d .
node --test tests/calvin-*.test.mjs tests/metabolism-*.test.mjs tests/polymerizer-*.test.mjs
```

Hard-refresh the browser. No image files or cp commands are required.

In C3's second reaction, dock aldolase, DHAP, and G3P, then click **Join carbon chains**. The two chains glide into a joined six-carbon backbone, a gold carbon–carbon bond appears between them, and the product's name fades in. The assembled product remains visible briefly before entering the existing persistent product-collection view. Students still explicitly store it before continuing.

Blue carbons identify the DHAP fragment; green carbons identify the other sugar fragment. Both attached phosphate groups stay with the product. These colors are schematic input-fragment labels, not chemical properties or a complete tracer simulation. The gold line identifies the new carbon–carbon bond. The same animation is used for C3's later DHAP + E4P → seven-carbon SBP reaction.

This reaction does not consume or regenerate NADPH. Aldolase joins the carbon fragments; no hydrogen/electron transfer from a redox carrier is shown. C2 reduction consumes NADPH and forms NADP-plus; regeneration of NADPH belongs to the light reactions. Reference: [aldolase reaction](https://enzyme.expasy.org/EC/4.1.2.13).

Animations honor reduced-motion preferences. Exiting during the join cancels both moving fragments and the preview without completing the reaction. This patch changes only the presentation; reaction bookkeeping, saves, inventory, rewards, and practice P rules remain unchanged.

Validation: all 32 existing Calvin/metabolism/polymerizer test files pass. The browser walkthrough covers both joining reactions, preserved phosphate groups, fragment colors, the new bond, persistent products, cancellation during joining, and the complete C3 flow with reduced motion and a 1024-pixel laptop layout. Browser protein images were placeholders because the actual PNGs are on your Mac.

When ready to commit:

```bash
git add public/css/metabolism.css src/app/CalvinRegenerationView.js docs/Calvin-Aldolase-Animation-README.md
git commit -m "Animate Calvin aldolase carbon-chain joining"
git push origin HEAD
```
