#!/usr/bin/env python3
"""Import exact motif recipes and install half-size PNGs from fresh Downloads runs.

The six supplied enzymes are supported here. Missing runs are reported and
skipped; a present but inconsistent run aborts before project files are changed.
"""
import argparse
import csv
import json
import re
import shutil
import subprocess
import tempfile
from collections import OrderedDict
from pathlib import Path

PROTEINS = {
    '1ixe': ('CitrateSynthase', 'Citrate Synthase', 'Thermus thermophilus', 2,
             'Oxaloacetate + acetyl-CoA + water → citrate + CoA-SH.'),
    '1l5j': ('Aconitase', 'Aconitase', 'Escherichia coli', 1,
             'Citrate ⇌ isocitrate through dehydration and rehydration.'),
    '2d4v': ('IsocitrateDehydrogenase', 'Isocitrate Dehydrogenase',
             'Acidithiobacillus thiooxidans', 2,
             'Isocitrate + NAD+ → alpha-ketoglutarate + CO2 + NADH + H+.'),
    '1scu': ('SuccinylCoASynthetase', 'Succinyl-CoA Synthetase', 'Escherichia coli', 4,
             'Succinyl-CoA + ADP + Pi → succinate + CoA-SH + ATP.'),
    '6mso': ('Fumarase', 'Fumarase', 'Leishmania major', 2,
             'Fumarate + water ⇌ malate.'),
    '7nrz': ('MalateDehydrogenase', 'Malate Dehydrogenase', 'Trypanosoma cruzi', 2,
             'Malate + NAD+ ⇌ oxaloacetate + NADH + H+.'),
}
LOCATIONS = {
    '6mso': 'Mitochondria (protist structural representative)',
    '7nrz': 'Glycosome (structural representative for the Krebs reaction)',
}
QUALIFICATIONS = {
    '7nrz': 'This glycosomal enzyme models the reaction; the structure is not a mitochondrial isoform.',
}
DATA_PREFIX = '// Generated from validated motif CSVs by tools/install_krebs_proteins.py.\nconst DATA = '
DATA_SUFFIX = ''';
for (const protein of Object.values(DATA)) {
    Object.freeze(protein.recipe);
    for (const component of protein.components) {
        Object.freeze(component.recipe);
        Object.freeze(component);
    }
    Object.freeze(protein.components);
    Object.freeze(protein);
}
export default Object.freeze(DATA);
'''


def parse_motifs(path, pdb):
    with Path(path).open(encoding='utf-8-sig', newline='') as handle:
        rows = list(csv.DictReader(handle))
    required = {'motif', 'model', 'model_name', 'chain', 'type', 'saved_frame', 'length'}
    if not rows or not required.issubset(rows[0]):
        raise ValueError(f'{path}: expected a make_motifs CSV with model/chain/frame columns.')
    groups = OrderedDict()
    frames = []
    for number, row in enumerate(rows, 1):
        if int(row['motif']) != number or row['type'] not in 'HBL' or len(row['type']) != 1:
            raise ValueError(f'{path}: invalid motif numbering or type at row {number}.')
        if pdb not in row['model_name'].lower() or int(row['length']) < 1:
            raise ValueError(f'{path}: wrong PDB model or invalid motif length at row {number}.')
        key = (row['model'], row['chain'])
        if key in groups and next(reversed(groups)) != key:
            raise ValueError(f'{path}: chain rows must be consecutive for cumulative images.')
        groups.setdefault(key, []).append(row)
        if row['saved_frame']:
            frames.append(int(row['saved_frame']))
    if len(groups) != PROTEINS[pdb][3]:
        raise ValueError(f'{path}: expected {PROTEINS[pdb][3]} selected protein chain(s), found {len(groups)}.')
    if not frames or frames != list(range(1, max(frames) + 1)):
        raise ValueError(f'{path}: saved frames must be consecutive starting at 1.')
    final_frame = max(frames) + (0 if rows[-1]['saved_frame'] else 1)
    components = []
    for number, ((model, chain), own) in enumerate(groups.items(), 1):
        own_frames = [int(row['saved_frame']) for row in own if row['saved_frame']]
        if not own_frames:
            raise ValueError(f'{path}: chain {chain} has no reveal frame.')
        components.append(dict(number=number, sourceModel=model, sourceChain=chain,
                               recipe={k: sum(row['type'] == k for row in own) for k in 'HBL'},
                               firstFrame=min(own_frames), lastFrame=max(own_frames)))
    # The last component includes the final complete image when trailing short
    # motifs did not receive individual reveal frames.
    components[-1]['lastFrame'] = final_frame
    product_id, name, organism, _, reaction = PROTEINS[pdb]
    return product_id, dict(name=name, source=pdb.upper(), organism=organism,
                           reaction=reaction, ppc=''.join(row['type'] for row in rows),
                           recipe={k: sum(row['type'] == k for row in rows) for k in 'HBL'},
                           components=components if len(components) > 1 else [],
                           lastFrame=final_frame, displayZoomPercent=100,
                           location=LOCATIONS.get(pdb, 'Krebs Cycle (bacterial structural representative)'),
                           qualification=QUALIFICATIONS.get(pdb, ''))


def write_catalog(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(DATA_PREFIX + json.dumps(data, indent=4, ensure_ascii=False) + DATA_SUFFIX,
                    encoding='utf-8')


def read_catalog(path):
    if not path.exists():
        return {}
    return json.JSONDecoder().raw_decode(path.read_text(encoding='utf-8').split('const DATA = ', 1)[1])[0]


def find_csv(downloads, source, root, pdb):
    for path in (source / 'motifs.csv', source / f'motifs_{pdb}.csv',
                 downloads / f'motifs_{pdb}.csv', root / 'docs/data' / f'{pdb}-motifs.csv'):
        if path.is_file():
            return path
    return None


def run(root, downloads, chosen, catalog_only=False):
    catalog = root / 'src/data/KrebsProteinCatalog.js'
    data = read_catalog(catalog)
    plans = []
    for pdb in chosen:
        source = downloads / f'{pdb}_motifs'
        csv_path = find_csv(downloads, source, root, pdb)
        if not source.is_dir() or csv_path is None:
            print(f'PENDING {pdb.upper()}: provide Downloads/{pdb}_motifs with PNGs and motifs.csv.')
            continue
        product_id, protein = parse_motifs(csv_path, pdb)
        protein['displayZoomPercent'] = data.get(product_id, {}).get('displayZoomPercent', 100)
        images = {}
        for image in source.iterdir():
            match = re.fullmatch(re.escape(pdb) + r'-(\d+)\.png', image.name, re.IGNORECASE)
            if match:
                number = int(match[1])
                if number in images or image.stat().st_size == 0:
                    raise ValueError(f'{source}: duplicate or empty frame {number}.')
                images[number] = image
        expected = set(range(protein['lastFrame'] + 1))
        if set(images) != expected:
            raise ValueError(f'{source}: expected frames 0–{protein["lastFrame"]}; '
                             f'missing {sorted(expected-set(images))}, extra {sorted(set(images)-expected)}.')
        plans.append((pdb, product_id, protein, csv_path, images))
    if not plans:
        return
    if not catalog_only and not shutil.which('magick'):
        raise ValueError('ImageMagick magick was not found. Install it before running this installer.')
    total_before = total_after = 0
    # Generate and validate every series before copying any project images.
    with tempfile.TemporaryDirectory(prefix='ecgame-krebs-50pct-', dir=downloads) as work:
        staged = []
        for pdb, product_id, protein, csv_path, images in plans:
            smaller = Path(work) / pdb
            smaller.mkdir()
            if not catalog_only:
                # Read fresh sources, never the already-resized project images.
                subprocess.run(['magick', 'mogrify', '-path', str(smaller), '-filter', 'Lanczos',
                                '-resize', '50%'] + [str(images[i]) for i in sorted(images)], check=True)
                output = {p.name.lower(): p for p in smaller.glob('*.png')}
                names = {f'{pdb}-{i}.png' for i in images}
                if set(output) != names or any(p.stat().st_size == 0 for p in output.values()):
                    raise ValueError(f'{pdb}: resized output is incomplete; project files were not changed.')
                before = sum(p.stat().st_size for p in images.values())
                after = sum(p.stat().st_size for p in output.values())
                total_before += before
                total_after += after
                staged.append((pdb, output))
                print(f'{pdb.upper()}: {before/1048576:.1f} → {after/1048576:.1f} MiB; '
                      f'saved {(before-after)/1048576:.1f} MiB ({(before-after)/before:.1%}).')
            data[product_id] = protein
            print(f'{protein["name"]}: H={protein["recipe"]["H"]}, B={protein["recipe"]["B"]}, '
                  f'L={protein["recipe"]["L"]}; frames 0–{protein["lastFrame"]}; '
                  f'{len(protein["components"]) or 1} chain(s).')
        for pdb, output in staged:
            target = root / 'public/assets/polymerizer/proteins' / f'{pdb}_motifs'
            target.mkdir(parents=True, exist_ok=True)
            for old in target.iterdir():
                if re.fullmatch(re.escape(pdb) + r'-\d+\.png', old.name, re.IGNORECASE) and old.name not in output:
                    old.unlink()
            for name, image in output.items():
                shutil.copy2(image, target / name)
        for pdb, _, _, csv_path, _ in plans:
            target = root / 'docs/data' / f'{pdb}-motifs.csv'
            target.parent.mkdir(parents=True, exist_ok=True)
            if csv_path.resolve() != target.resolve():
                # Keep repository CSVs on LF line endings; source files stay intact.
                target.write_text(csv_path.read_text(encoding='utf-8-sig'), encoding='utf-8')
        write_catalog(catalog, data)
    if not catalog_only:
        print(f'TOTAL: {total_before/1048576:.1f} → {total_after/1048576:.1f} MiB; '
              f'saved {(total_before-total_after)/1048576:.1f} MiB.')
        print('Fresh Downloads originals retained; temporary resized copies deleted.')
    print('Hard-refresh the Polymerizer. Per-protein catalog zoom defaults and +/− controls remain available.')
    print('No Git commit or push was performed.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--downloads', type=Path, default=Path.home() / 'Downloads')
    parser.add_argument('--protein', choices=PROTEINS, action='append')
    parser.add_argument('--catalog-only', action='store_true', help='Import CSVs without resizing/installing PNGs.')
    args = parser.parse_args()
    if not (args.root / 'src/data/proteinLibrary.js').is_file():
        parser.error('The target must be the ECGame project.')
    try:
        run(args.root, args.downloads, args.protein or list(PROTEINS), args.catalog_only)
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        raise SystemExit(str(error))


if __name__ == '__main__':
    main()
