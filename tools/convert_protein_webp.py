#!/usr/bin/env python3
"""Convert only Polymerizer protein PNGs to WebP; preserve pixels dimensions and zoom."""
import json
from pathlib import Path
import shutil
import subprocess
import tempfile

PREFIX = Path("public/assets/polymerizer/proteins")


def run(args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)


def prepare_code(root):
    catalog = root / "src/data/PolymerizerVisualCatalog.js"
    before = catalog.read_text()
    marker = "function assetUrl(fileName) {"
    replacement = (marker + '\n\n    // Protein images use WebP; preserves each frame number and display zoom.\n'
                   '    fileName = fileName.replace(/\\.png$/i, ".webp");')
    if replacement in before:
        after = before
    elif before.count(marker) == 1:
        after = before.replace(marker, replacement, 1)
    else:
        raise RuntimeError("Unexpected visual catalog layout; no project files changed.")
    edits = {catalog: (before, after)}
    names = (
        "polymerizer-transketolase-components", "polymerizer-glycolysis-proteins",
        "polymerizer-visual-sequence", "polymerizer-shell", "polymerizer-glycogenin-acyltransferase",
        "polymerizer-energy-kinase", "polymerizer-dimer-updates", "polymerizer-photosynthesis-proteins",
        "polymerizer-acetyl-coa-synthetase", "polymerizer-krebs-proteins",
        "polymerizer-rubisco-9hvm", "polymerizer-components-practice",
        "calvin-polymerizer-recipes", "metabolism-enzyme-inventory"
    )
    for name in names:
        path = root / "tests" / f"{name}.test.mjs"
        if not path.is_file():
            raise RuntimeError(f"Missing existing test: {path.name}; no project files changed.")
        before = path.read_text()
        # All PNG references in these specific tests are protein image paths.
        after = before.replace(".png", ".webp")
        after = after.replace("const extension = id === 'CitrateSynthase' ? 'webp' : 'png';",
                              "const extension = 'webp';")
        edits[path] = (before, after)
    return edits


def dimensions(paths):
    result = []
    for offset in range(0, len(paths), 40):
        batch = paths[offset:offset + 40]
        out = run(["magick", "identify", "-format", "%w %h\n", *map(str, batch)],
                  capture_output=True, text=True)
        rows = out.stdout.splitlines()
        if len(rows) != len(batch):
            raise RuntimeError("Unexpected frame count when decoding images.")
        sizes = [tuple(map(int, row.split())) for row in rows]
        if any(len(size) != 2 or min(size) <= 0 for size in sizes):
            raise RuntimeError("Invalid image dimensions.")
        result.extend(sizes)
    return result


def check_webps(paths, expected_sizes):
    for path in paths:
        with path.open("rb") as stream:
            header = stream.read(12)
        if header[:4] != b"RIFF" or header[8:12] != b"WEBP":
            raise RuntimeError(f"Invalid WebP file: {path}")
    if dimensions(paths) != expected_sizes:
        raise RuntimeError("Output dimensions differ from the original images.")


def references(root, edits):
    """Inspect prospective catalog URLs without editing the real source file."""
    catalog = root / "src/data/PolymerizerVisualCatalog.js"
    probe = catalog.with_name("WebPConversionCatalogProbe.mjs")
    if probe.exists():
        raise RuntimeError(f"Remove stale probe file first: {probe}")
    try:
        probe.write_text(edits[catalog][1])
        code = '''import {fileURLToPath} from 'node:url';
import V from './src/data/WebPConversionCatalogProbe.mjs';
const required = new Set(), optional = new Set();
for (const v of Object.values(V.getAll())) {
 for (const url of v.frameUrls) required.add(fileURLToPath(url));
 if (v.fallbackImageUrl) optional.add(fileURLToPath(v.fallbackImageUrl));
}
console.log(JSON.stringify({required:[...required],optional:[...optional]}));'''
        out = run(["node", "--input-type=module", "-e", code], cwd=root,
                  capture_output=True, text=True)
        return json.loads(out.stdout)
    finally:
        probe.unlink(missing_ok=True)


def regression_tests(root):
    paths = sorted(set(
        list((root / "tests").glob("polymerizer-*.test.mjs")) +
        list((root / "tests").glob("calvin-*.test.mjs")) +
        [root / "tests/krebs-practice.test.mjs", root / "tests/metabolism-enzyme-inventory.test.mjs"]
    ))
    run(["node", "--test", *map(str, paths)], cwd=root)


def convert(root):
    root = root.resolve()
    if not (root / "src/data/PolymerizerVisualCatalog.js").is_file():
        raise RuntimeError("Run this from your ecgame project directory.")
    if not shutil.which("magick") or not shutil.which("node"):
        raise RuntimeError("ImageMagick and Node are required.")
    assets = root / PREFIX
    edits = prepare_code(root)
    refs = references(root, edits)
    pngs = sorted(path for path in assets.rglob("*") if path.is_file() and path.suffix.lower() == ".png")
    if any(path.is_symlink() for path in pngs):
        raise RuntimeError("Symlinked images need review; no images changed.")
    available = {path.with_suffix(".webp") for path in pngs}
    missing = [path for path in map(Path, refs["required"])
               if path not in available and not path.is_file()]
    if missing:
        raise RuntimeError("Missing required frames before conversion: " + ", ".join(map(str, missing[:12])))
    before = sum(path.stat().st_size for path in assets.rglob("*") if path.is_file())
    by_folder = {}
    for path in pngs:
        by_folder.setdefault(path.parent, []).append(path)
    installed = []
    # Stage the converted series; source PNGs remain until validation and tests pass.
    with tempfile.TemporaryDirectory(prefix="ecgame-webp-bulk-") as temporary:
        stage = Path(temporary)
        for folder, originals in by_folder.items():
            relative = folder.relative_to(assets)
            output = stage / relative
            output.mkdir(parents=True, exist_ok=True)
            print(f"Converting {relative}: {len(originals)} images...", flush=True)
            sizes = dimensions(originals)
            for offset in range(0, len(originals), 40):
                run(["magick", "mogrify", "-path", str(output), "-format", "webp",
                     "-quality", "90", "-define", "webp:alpha-quality=100",
                     *map(str, originals[offset:offset + 40])])
            outputs = [output / path.with_suffix(".webp").name for path in originals]
            check_webps(outputs, sizes)
            old_bytes = sum(path.stat().st_size for path in originals)
            new_bytes = sum(path.stat().st_size for path in outputs)
            print(f"  {old_bytes/1048576:.1f} -> {new_bytes/1048576:.1f} MiB "
                  f"({100*(1-new_bytes/old_bytes):.1f}% smaller)", flush=True)
            installed.extend((original, out) for original, out in zip(originals, outputs))
        for original, out in installed:
            shutil.copy2(out, original.with_suffix(".webp"))
        # Verify every referenced frame is now installed, including original WebPs.
        required = list(map(Path, refs["required"]))
        if any(not path.is_file() for path in required):
            raise RuntimeError("Required installed frame missing. PNG originals retained.")
        dimensions(required)
        try:
            for path, (_, text) in edits.items():
                path.write_text(text)
            regression_tests(root)
        except Exception:
            for path, (text, _) in edits.items():
                path.write_text(text)
            raise RuntimeError("Regression tests failed; code restored and all PNG originals retained.")
        # Delete only source files successfully converted under the protein directory.
        for original, _ in installed:
            original.unlink()
    optional_missing = [path for path in refs["optional"] if not Path(path).is_file()]
    if optional_missing:
        print("Optional legacy fallback absent (not a sequence frame): " + ", ".join(optional_missing))
    after = sum(path.stat().st_size for path in assets.rglob("*") if path.is_file())
    print(f"COMPLETE: {len(pngs)} protein PNGs replaced; dimensions, zoom values and frame numbers preserved.")
    print(f"Protein directory: {before/1048576:.1f} -> {after/1048576:.1f} MiB; "
          f"net saved {(before-after)/1048576:.1f} MiB (includes replacement of pilot duplicates).")
    print("All required catalog frames and regression tests passed. Other asset directories untouched.")
    print("Temporary conversion copies removed. No Git commit, push, or history rewrite performed.")


if __name__ == "__main__":
    try:
        convert(Path.cwd())
    except (RuntimeError, subprocess.CalledProcessError) as error:
        raise SystemExit(f"STOPPED: {error}")
