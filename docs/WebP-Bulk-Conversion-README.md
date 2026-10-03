# ECGame protein WebP conversion

Run from the project root:

```bash
python3 tools/convert_protein_webp.py
```

Only PNG files under `public/assets/polymerizer/proteins/` are converted.
Quality is 90 with alpha quality 100. Each file keeps its current pixel dimensions,
name prefix and frame number. All protein catalog image URLs, including the optional
Aquaporin fallback, use WebP. Per-protein zoom and +/- controls remain unchanged.
Metabolism and practice views use the same catalog.

The installer stages and decodes the outputs, verifies dimensions, checks that every
required catalog frame is present, and runs Polymerizer, Calvin, Krebs and metabolism
inventory regression tests. Only after these checks pass are the replaced PNGs deleted.
If regression tests fail, code changes are reverted and the PNG originals remain.
The script creates no full-size backups; temporary conversion copies are removed.
It reports before/after protein storage and does not commit, push or rewrite history.
Non-protein image directories are untouched.

The previous two-protein pilot has duplicate WebPs alongside PNGs. This script
regenerates those two series using the same quality setting and removes the PNGs.
Its reported net saving includes removal of these pilot duplicates.

After completion, hard-refresh the local game, check a few representative proteins
and inspect `git status --short`. Commit and push conversion changes using HTTP/1.1.
Run the existing PNG history cleanup only after the new commit is published:

```bash
python3 "$HOME/Downloads/ECGame-PNG-History-Cleanup/cleanup_png_history.py"
python3 "$HOME/Downloads/ECGame-PNG-History-Cleanup/cleanup_png_history.py" --apply --push
```

That tool targets obsolete blobs historically used as protein PNGs. Current WebPs,
all current files and any blob used outside the protein PNG scope are protected.
It preserves commit count, verifies the current tracked-file tree is identical, and
uses an exact force-with-lease when pushing. Historical WebP versions and code history
are not targeted. Purging is based on superseded PNG paths, not a global byte-size
threshold. Re-clone any other development checkouts after rewriting history.

The current source contains no full-series Polymerizer preloader. Catalog arrays hold
URLs; the selected protein image and assembly practice request the current frame.
Compression reduces file storage and transfer bytes. It does not reduce decoded RAM
at unchanged dimensions, and browsers may cache previously displayed frames.

For fresh ChimeraX PNG imports in the future, rerun this converter before using the
new frames in the game. Those source imports remain PNGs until this conversion step.
