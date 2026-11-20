"""ADR-015: cópia congelada do pacote ativo, sempre conferida por SHA-256. Sem rede, dados DEMO_."""
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from rastro import publicar  # noqa: E402
from rastro.bundle import PREFIXES  # noqa: E402

SNAP = 'e' * 64


def make_validation(root: Path) -> dict:
    ident = 'a' * 64
    files = {}
    for p in PREFIXES:
        content = json.dumps({'kind': 'VALIDACAO', 'prefixo': f'DEMO_{p}'}).encode()
        (root / f'{p}-2026-11-19-{SNAP[:8]}.json').write_bytes(content)
        files[p] = {'path': f'bundles/{ident}/{p}.json', 'sha256': hashlib.sha256(content).hexdigest()}
    manifest = {'version': 1, 'id': ident, 'snapshot': SNAP, 'files': files}
    (root / 'active-bundle.json').write_text(json.dumps(manifest), encoding='utf-8')
    return manifest


class FreezeTest(unittest.TestCase):
    def test_copies_from_exports_when_bundle_unreadable(self):
        with tempfile.TemporaryDirectory() as d:
            val, out = Path(d) / 'validacao', Path(d) / 'publicado'
            val.mkdir()
            m = make_validation(val)  # pasta bundles/ inexistente = ilegível
            self.assertEqual(publicar.freeze(val, out), m['id'])
            for p in PREFIXES:
                content = (out / m['files'][p]['path']).read_bytes()
                self.assertEqual(hashlib.sha256(content).hexdigest(), m['files'][p]['sha256'])
            self.assertEqual(json.loads((out / 'active-bundle.json').read_text(encoding='utf-8')), m)

    def test_refuses_altered_export(self):
        with tempfile.TemporaryDirectory() as d:
            val, out = Path(d) / 'validacao', Path(d) / 'publicado'
            val.mkdir()
            make_validation(val)
            (val / f'emendas-2026-11-19-{SNAP[:8]}.json').write_text('{"kind": "VALIDACAO", "alterado": true}', encoding='utf-8')
            with self.assertRaises(ValueError):
                publicar.freeze(val, out)
            self.assertFalse(out.exists())


if __name__ == '__main__':
    unittest.main()
