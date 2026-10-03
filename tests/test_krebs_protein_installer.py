import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('installer', ROOT / 'tools/install_krebs_proteins.py')
installer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(installer)


class InstallerTests(unittest.TestCase):
    def test_wrong_csv_cannot_be_used_for_another_enzyme(self):
        with self.assertRaisesRegex(ValueError, 'wrong PDB'):
            installer.parse_motifs(ROOT / 'docs/data/2d4v-motifs.csv', '1l5j')

    def test_final_short_motifs_require_an_extra_complete_image(self):
        _, protein = installer.parse_motifs(ROOT / 'docs/data/1ixe-motifs.csv', '1ixe')
        self.assertEqual(protein['lastFrame'], 45)
        self.assertEqual(protein['components'][-1]['lastFrame'], 45)

    def test_missing_white_frame_aborts_before_catalog_changes(self):
        with tempfile.TemporaryDirectory() as work:
            downloads = Path(work) / 'Downloads'
            source = downloads / '1ixe_motifs'
            source.mkdir(parents=True)
            for frame in range(1, 46):
                (source / f'1ixe-{frame}.png').write_bytes(b'fixture')
            before = (ROOT / 'src/data/KrebsProteinCatalog.js').read_bytes()
            with self.assertRaisesRegex(ValueError, 'missing \\[0\\]'):
                installer.run(ROOT, downloads, ['1ixe'], catalog_only=True)
            self.assertEqual((ROOT / 'src/data/KrebsProteinCatalog.js').read_bytes(), before)


if __name__ == '__main__':
    unittest.main()
