# Calvin Cycle: persistent overview and automatic practice replay

The circular overview stays beside the active guided lesson on a laptop or desktop. Its flashing dot follows the enzyme in the current reaction. Fixation, reduction, and regeneration can also be opened from the overview's Explore buttons. Clicking the current dot brings the existing close-up into view without restarting it.

Thirteen reaction dots represent eleven unique enzymes: aldolase and transketolase each act twice. The green P appears at every reaction position belonging to a practiced enzyme, but mastery counts the enzyme once.

## Automate

Automate unlocks after all eleven Calvin enzymes have saved perfect-practice P markers. Activating enzymes or finishing a reconstruction does not substitute for practice mastery. Existing saved P markers count immediately.

The central button starts a simplified animated practice replay. Carbon spheres and P labels show sugars moving through the three phases; O–C–O represents incoming CO₂. ATP and NADPH enter, and ADP, NADP⁺, and inorganic phosphate leave the relevant steps. Water and the GAPDH H⁺ input are also shown. One net G3P branches into the product bin, while three RuBP return to fixation.

Each batch summarizes 3 CO₂, 9 ATP, and 6 NADPH used for one net G3P. Moving tokens represent labeled groups of molecules. Regeneration's reserved DHAP, Xu5P, and Ru5P branch toward the enzymes that will use them; the circular reaction order does not imply that every molecule passes through every enzyme. The existing close-ups retain their functional-group detail.

“Repeat automatic batches” is initially checked. Uncheck it to watch one batch. Stop animation ends the replay; the Explore buttons return to a detailed practice lesson. Leaving the Calvin detail view also cancels all moving tokens. Reduced-motion preferences are respected.

This replay is educational: it does not spend or generate game resources, synthesize enzymes, activate benefits, award achievements or discoveries, or award new P markers. Only the existing practice activities can award P.

## Install on your Mac

Download the ZIP to Downloads, then run:

```sh
cd "$HOME/Documents/DCC/BIO 101/ecgame"
unzip -o "$HOME/Downloads/ECGame-Calvin-Overview-Automate-2026-09-30.zip" -d .
```

Unzip writes the updated files directly into the project; no additional cp is needed. Hard-refresh the browser after installation.

## Verification

33 Node test files pass across Calvin, metabolism, and polymerizer behavior. Browser checks cover the existing C1/C2 and complete C3 activities, current-dot updates, laptop and mobile layout, the eleven-P gate, the complete animated batch, unchanged game state, stopping/restarting, and navigation cleanup.

```sh
node --test tests/calvin-*.test.mjs tests/metabolism-*.test.mjs tests/polymerizer-*.test.mjs
```

## Commit and push

```sh
git add src/app/Calvin* public/css/metabolism.css tests/calvin-overview.test.mjs docs/Calvin-Overview-Automate-README.md
git commit -m "Add persistent Calvin cycle overview and mastered practice replay"
git push
```
