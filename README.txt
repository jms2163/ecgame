ECGame two-protein WebP pilot

Extract this ZIP in the ecgame project and run:
python3 tools/install_two_protein_webp.py

The installer reuses complete quality90 trial folders in Downloads, or generates
missing series from the installed PNGs. It verifies all 391 WebP files decode at
800x600 before switching the catalog. Only RuBisCO and CitrateSynthase switch to
WebP. Existing per-protein zoom values and +/- controls remain unchanged.
The shared catalog also supplies images for Calvin/TCA practice.

Original PNGs are retained during the trial. No full-size image backups, save
changes, commits, pushes, or history rewrites are made. The two additional WebP
series temporarily increase current project storage until PNG removal is approved.
Existing image-path assertions in three test files are updated for this pilot.

After installing, run:
node --test tests/polymerizer-rubisco-9hvm.test.mjs tests/polymerizer-components-practice.test.mjs tests/polymerizer-krebs-proteins.test.mjs tests/polymerizer-visual-sequence.test.mjs tests/calvin-polymerizer-recipes.test.mjs

Hard-refresh the local Live Server game. Select each protein in Polymerizer.
Check the main image at default zoom and with +/-; use Practice to explore
components and the full complex without spending resources or changing progress.
Check the final enzyme structures in Calvin/TCA practice too.

In browser DevTools Network, filter by 9hvm or 1ixe. Displayed frame requests
should end in .webp. Idle selection should not fetch the entire series; new
frames should follow practice progress. The catalog contains URL strings, not
decoded image objects, and the Polymerizer has no full-series preloader.
Browser caching can retain some earlier frames; this is not a RAM quota guarantee.

Code verification: five existing test files passed, plus checks that exactly two
series use WebP and their frame counts and default zoom values are unchanged.
Actual Mac image conversion and visual QA happen when running this installer.
