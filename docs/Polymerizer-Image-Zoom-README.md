# Polymerizer PNG zoom

The Assembly Chamber now has − and + buttons at the bottom right, with the current zoom percentage between them. Each click changes the scale by 10 percentage points: 100%, 110%, 120%, and so on. The image remains centered; the rings and chamber keep their size.

Each protein starts at its configured catalog zoom (Aquaporin: 210%). Proteins without a configured scale start at 100%. These defaults live in PolymerizerVisualCatalog.js as displayZoomPercent. Manual zoom adjustments are remembered separately for each protein during the session and survive assembly-frame refreshes. Reloading restores each protein’s configured default; viewing preferences are not stored in player saves. The controls range from 10% to 500%.

Every button click prints a line prefixed `[Polymerizer PNG]` in the browser console. It reports the protein, zoom, displayed PNG width and height, source resolution, and inner/outer ring diameters. Expanding the accompanying object shows the exact image-element box dimensions too. Measurements include any transparent margins within the PNG.

The inner ring is 245 px and the outer ring is 330 px. For an image displayed at the existing 230 px width, 130% gives about 299 px. Use the actual console measurements to choose a comfortable scale for your PNGs.

## Install

```sh
cd "$HOME/Documents/DCC/BIO 101/ecgame"
unzip -o "$HOME/Downloads/ECGame-Polymerizer-Image-Zoom-2026-09-30.zip" -d .
```

Hard-refresh the game, open Polymerizer, and open the browser's developer console before clicking + or −. No additional cp is needed.

## Verification

All 16 Polymerizer test files passed. Browser checks confirmed the 10-percentage-point steps, displayed/source/ring measurements, fixed ring positions, retained zoom on renders and protein changes, laptop layout, zoom bounds, and unchanged game state.

```sh
node --test tests/polymerizer-*.test.mjs
git add src/app/PolymerizerUI.js public/css/polymerizer.css docs/Polymerizer-Image-Zoom-README.md
git commit -m "Add Polymerizer PNG zoom controls and size logging"
git push
```
