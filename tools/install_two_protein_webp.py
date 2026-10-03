#!/usr/bin/env python3
"""Install a WebP trial for two proteins without replacing PNG originals."""
from pathlib import Path
import shutil
import subprocess
import tempfile

SERIES = (("9hvm", 344), ("1ixe", 45))


def replace_once(text, old, new, label):
    if new in text:
        return text
    if text.count(old) != 1:
        raise RuntimeError(f"Unexpected source layout: {label}. No code was changed.")
    return text.replace(old, new, 1)


def code_changes(root):
    changes = {}
    path = root / "src/data/PolymerizerVisualCatalog.js"
    text = path.read_text()
    text = replace_once(text,
        'displayZoomPercent: protein.displayZoomPercent,',
        'displayZoomPercent: protein.displayZoomPercent,\n        fileExtension: id === "CitrateSynthase" ? "webp" : "png",',
        'Krebs image format')
    text = replace_once(text,
        'RuBisCO: Object.freeze({\n        displayZoomPercent: 190,',
        'RuBisCO: Object.freeze({\n        fileExtension: "webp",\n        displayZoomPercent: 190,',
        'RuBisCO image format')
    text = replace_once(text,
        '${directoryPrefix}${filePrefix}-${frameNumber}.png',
        '${directoryPrefix}${filePrefix}-${frameNumber}.${config.fileExtension ?? "png"}',
        'frame URL extension')
    changes[path] = text
    for name in ("polymerizer-rubisco-9hvm.test.mjs", "polymerizer-components-practice.test.mjs"):
        path = root / "tests" / name
        text = path.read_text()
        import re
        text = re.sub(r'(9hvm-\d+\\\.)png', r'\1webp', text)
        changes[path] = text
    path = root / "tests/polymerizer-krebs-proteins.test.mjs"
    text = path.read_text()
    text = replace_once(text,
        "const d = Recipes.get(id), v = Visuals.get(id);",
        "const d = Recipes.get(id), v = Visuals.get(id);\n    const extension = id === 'CitrateSynthase' ? 'webp' : 'png';",
        'Krebs test format')
    text = text.replace('${pdb}-0\\\\.png$', '${pdb}-0\\\\.${extension}$')
    text = text.replace('${pdb}-${lastFrame}\\\\.png$', '${pdb}-${lastFrame}\\\\.${extension}$')
    changes[path] = text
    return changes


def validate_images(paths):
    for path in paths:
        with path.open("rb") as stream:
            header = stream.read(12)
        if header[:4] != b"RIFF" or header[8:12] != b"WEBP":
            raise RuntimeError(f"Not a WebP file: {path}")
    for offset in range(0, len(paths), 50):
        batch = paths[offset:offset + 50]
        result = subprocess.run(["magick", "identify", "-format", "%w %h\n",
                                 *map(str, batch)], capture_output=True, text=True, check=True)
        lines = result.stdout.splitlines()
        if len(lines) != len(batch) or any(line != "800 600" for line in lines):
            raise RuntimeError("Expected every trial frame to decode at 800x600.")


def main():
    root = Path.cwd()
    if not (root / "src/data/PolymerizerVisualCatalog.js").is_file():
        raise RuntimeError("Run this from the ecgame project directory.")
    if not shutil.which("magick"):
        raise RuntimeError("ImageMagick is required.")
    changes = code_changes(root)  # Check source compatibility before any writes.
    with tempfile.TemporaryDirectory(prefix="ecgame-webp-") as temp:
        prepared = []
        for pdb, last in SERIES:
            target = root / "public/assets/polymerizer/proteins" / f"{pdb}_motifs"
            pngs = [target / f"{pdb}-{frame}.png" for frame in range(last + 1)]
            if not all(path.is_file() for path in pngs):
                raise RuntimeError(f"Incomplete installed PNG series: {pdb}")
            cached = Path.home() / "Downloads" / f"{pdb}_webp_test/quality90"
            source = cached
            webps = [source / f"{pdb}-{frame}.webp" for frame in range(last + 1)]
            if not all(path.is_file() for path in webps):
                source = Path(temp) / pdb
                source.mkdir()
                print(f"Converting {pdb}: {len(pngs)} frames at quality 90...", flush=True)
                for offset in range(0, len(pngs), 50):
                    subprocess.run(["magick", "mogrify", "-path", str(source),
                                    "-format", "webp", "-quality", "90",
                                    *map(str, pngs[offset:offset + 50])], check=True)
                webps = [source / f"{pdb}-{frame}.webp" for frame in range(last + 1)]
            validate_images(webps)
            prepared.append((pdb, target, pngs, webps))
        for pdb, target, pngs, webps in prepared:
            for path in webps:
                shutil.copy2(path, target / path.name)
            before = sum(path.stat().st_size for path in pngs)
            after = sum(path.stat().st_size for path in webps)
            print(f"{pdb}: {len(webps)} verified frames; PNG {before/1048576:.1f} MiB; "
                  f"WebP {after/1048576:.1f} MiB; series reduction {100*(1-after/before):.1f}%")
        for path, text in changes.items():
            path.write_text(text)
    print("Trial installed: RuBisCO 190%, citrate synthase 150%; +/- controls unchanged.")
    print("PNGs retained. Trial temporarily adds WebP storage; no history cleanup or Git push performed.")
    print("Hard-refresh your local game and test both proteins in Polymerizer practice.")


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, subprocess.CalledProcessError) as error:
        raise SystemExit(f"STOPPED: {error}")
