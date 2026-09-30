# Calvin fixation: release and collect products

Install after the Calvin Practice Space patch:

```bash
cd "$HOME/Documents/DCC/BIO 101/ecgame"
unzip -o "$HOME/Downloads/ECGame-Calvin-Product-Collection-2026-09-30.zip" -d .
node --test tests/calvin-*.test.mjs tests/polymerizer-*.test.mjs tests/metabolism-*.test.mjs
```

Hard-refresh the game. This patch uses the images already installed from Downloads; no image copying is needed.

After adding H2O and choosing Split into two 3-PGA, the two products fade in beneath RuBisCO in the reaction chamber. They remain there until Store in output tray is clicked. Only then do they appear in the output tray, and the next-round or quiz button becomes available. Each product has three carbons and one attached phosphate; the new carbon from CO2 remains gold. The existing 3-PGA formed counter counts formation, including products still waiting in the chamber.

Storing is an instructional collection action, not a second chemical reaction or transport across a membrane. The output tray collects 3-PGA for the future reduction activity; it does not create sugar or spend ATP/NADPH. Both normal guided activity and transient practice use the same sequence. Practice still changes no saved progression or inventory, and Exit practice remains available throughout.

RuBisCO catalyzes the entire carboxylation sequence: enolization, CO2 addition, hydration, carbon–carbon cleavage, and protonation yielding two 3-PGA. No separate hydrolase is needed. The UI names CO2 addition, hydration, and cleavage rather than assigning RuBisCO a generic hydrolysis activity. Detailed mechanism: https://pmc.ncbi.nlm.nih.gov/articles/PMC10336775/ . Overall enzyme reaction: https://enzyme.expasy.org/EC/4.1.1.39 .

Model tests verify that products cannot be stored twice and that the next round is blocked until collection. Browser checks verify that the released pair appears beneath the enzyme, stays outside the tray until collected, and transfers exactly once for all three rounds. Early and completed exits restore the maps, and practice leaves game state and browser storage unchanged. Browser images are placeholders because the original PNGs remain on your Mac.

To commit locally after reviewing:

```bash
git diff --check
git add src/app/CalvinFixationModel.js src/app/CalvinFixationView.js public/css/metabolism.css tests/calvin-carbon-fixation.test.mjs tests/polymerizer-components-practice.test.mjs docs/Calvin-Product-Collection-README.md
git commit -m "Show released Calvin products before explicit output collection"
```

Stage preceding updates too if they remain uncommitted. The development checkout has a local source commit; no remote push was performed.
