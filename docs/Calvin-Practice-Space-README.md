# Full-width Calvin practice

Install after the Calvin Hydration patch:

```bash
cd "$HOME/Documents/DCC/BIO 101/ecgame"
unzip -o "$HOME/Downloads/ECGame-Calvin-Practice-Space-2026-09-30.zip" -d .
```

Hard-refresh the game. No image copying is needed for this patch; it uses the PNGs already copied from Downloads.

Opening Practice carbon fixation hides Available Maps, the reconstruction map, the enzyme inventory tray, and unrelated pathway summaries. The practice panel fills the pathway workspace. RuBP's five carbon markers and two attached phosphate markers stay on one line.

Exit practice appears at the top and bottom. It works during any reaction step and remains available after the existing carbon-source question. Exiting discards the transient session and restores the pathway library and reconstruction layout. Switching away, leaving the zone, or importing a save also clears the focused layout. Normal reconstruction and saved guided activity retain their existing layout and progress behavior.

Browser checks cover wider workspace, hidden maps, single-row RuBP, premature exit, complete practice and quiz, and restoration of maps after both exit paths. The water gate and no-save practice checks also pass. Actual PNGs are on your Mac; browser checks use placeholder images.

Commit this patch locally after reviewing:

```bash
git diff --check
git add src/app/CalvinFixationView.js public/css/metabolism.css docs/Calvin-Practice-Space-README.md
git commit -m "Give Calvin practice a full-width workspace and explicit exit"
```

If preceding updates are still uncommitted, stage those using their included scoped commands before committing. This development patch was committed locally; no remote push was performed.
