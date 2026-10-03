#!/usr/bin/env python3
"""Install the fresh 1PG4 series at 50%, remove three unreferenced alternatives."""
from pathlib import Path
import shutil, subprocess, tempfile

ROOT = Path(__file__).resolve().parents[1]
PROTEINS = ROOT / 'public/assets/polymerizer/proteins'
SOURCE = Path.home() / 'Downloads/1pg4_motifs'
REMOVE = ('3o8n_motifs', '1ebh_motifs', '1qo5_motifs')
EXPECTED = {f'1pg4-{n}.png' for n in range(48)}


def folder_bytes(folder):
    return sum(p.stat().st_size for p in folder.rglob('*') if p.is_file()) if folder.exists() else 0


def site_bytes():
    # Count existing tracked files plus current source/asset files, excluding Git history.
    tracked = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode().split('\0')
    files = {ROOT / p for p in tracked if p}
    for name in ('src', 'public', 'docs', 'tests', 'tools'):
        folder = ROOT / name
        if folder.exists():
            files.update(p for p in folder.rglob('*') if p.is_file())
    return sum(p.stat().st_size for p in files if p.is_file())


def main():
    if not (ROOT / '.git').exists() or not PROTEINS.is_dir():
        raise SystemExit('Run this installer from the ECGame project after unzipping the patch.')
    if not shutil.which('magick'):
        raise SystemExit('ImageMagick magick command was not found.')
    supplied = {p.name for p in SOURCE.glob('1pg4-*.png')}
    if supplied != EXPECTED:
        raise SystemExit(f'Fresh Downloads/1pg4_motifs must contain frames 0–47. Missing: {sorted(EXPECTED-supplied)}; unexpected: {sorted(supplied-EXPECTED)}')
    # Stop rather than deleting folders referenced by newer local code.
    code = '\n'.join(p.read_text(errors='replace').lower()
                     for p in (ROOT / 'src').rglob('*') if p.is_file())
    for name in REMOVE:
        if name.split('_')[0] in code:
            raise SystemExit(f'{name} is referenced by current source; nothing was removed.')
    before = site_bytes()
    old_series = folder_bytes(PROTEINS / '1pg4_motifs')
    fresh_size = sum((SOURCE / name).stat().st_size for name in EXPECTED)
    # Temporary reduced copies are automatically removed; fresh full-size source is retained.
    with tempfile.TemporaryDirectory(prefix='ecgame-1pg4-resize-', dir=Path.home() / 'Downloads') as work:
        smaller = Path(work)
        subprocess.run(['magick', 'mogrify', '-path', str(smaller), '-filter', 'Lanczos',
                        '-resize', '50%'] + [str(SOURCE / f'1pg4-{n}.png') for n in range(48)], check=True)
        if {p.name for p in smaller.glob('*.png')} != EXPECTED:
            raise SystemExit('Resize output was incomplete. Project images were not changed.')
        for name in EXPECTED:
            if (smaller / name).stat().st_size == 0:
                raise SystemExit('An output image is empty. Project images were not changed.')
        dimensions = subprocess.check_output(['magick', 'identify', '-format', '%f: %wx%h pixels; %b\n',
                                             str(SOURCE / '1pg4-47.png'), str(smaller / '1pg4-47.png')], text=True)
        target = PROTEINS / '1pg4_motifs'
        target.mkdir(exist_ok=True)
        for file in target.glob('1pg4-*.png'):
            if file.name not in EXPECTED:
                file.unlink()
        for name in EXPECTED:
            shutil.copy2(smaller / name, target / name)
        removed = 0
        for name in REMOVE:
            folder = PROTEINS / name
            size = folder_bytes(folder)
            if folder.exists():
                shutil.rmtree(folder)
            removed += size
            print(f'Removed {name}: {size/1048576:.1f} MiB')
    installed = sum((target / name).stat().st_size for name in EXPECTED)
    after = site_bytes()
    print(dimensions, end='')
    print(f'Fresh 1PG4: {fresh_size/1048576:.1f} → {installed/1048576:.1f} MiB; saved {(fresh_size-installed)/1048576:.1f} MiB ({(fresh_size-installed)/fresh_size:.1%})')
    print(f'Previous project 1PG4 series: {old_series/1048576:.1f} MiB')
    print(f'Alternative folders removed: {removed/1048576:.1f} MiB')
    print(f'Project current files: {before/1000000:.1f} → {after/1000000:.1f} MB; net saved {(before-after)/1000000:.1f} MB')
    print(f'Equivalent to {after/1000000000:.1%} of the documented 1 GB Pages site limit (source-file estimate).')
    print('Fresh full-size images remain in Downloads/1pg4_motifs. Temporary resized duplicates were deleted.')
    print('Hard-refresh and preview Acetyl-CoA Synthetase at 120% zoom. No Git commit or push was performed.')


if __name__ == '__main__':
    main()
