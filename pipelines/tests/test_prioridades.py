"""Triagem financeira de casos DEMO_: ordem, ausência, reprodução e compatibilidade."""
import csv
import hashlib
import json
import sqlite3
import tempfile
import unittest
from contextlib import closing
from pathlib import Path
from unittest.mock import patch

from test_documentos import db
from rastro import prioridades, audit_conciliacao
from rastro.conciliacao import payment


def record(code, pago, rap, values):
    return {'code': code, 'ano': 2024, 'tipo': 'DEMO', 'recorte_ce': True, 'pago': pago, 'rap_pagos': rap,
            **payment(pago, rap, values), 'documentos_empenho': 1, 'linhas_emenda': ['DEMO:1'],
            'linhas_documentos_divergentes': [{'raw_sha256': 'DEMO_HASH', 'source_row_id': 'DEMO:2'}],
            'favorecido_nome': 'DEMO_PRIVATE_NAME'}


class PriorityTests(unittest.TestCase):
    def test_selection_absence_zero_and_incomplete(self):
        rows = prioridades.rank([
            record('DEMO_confere', 10, 0, [10]), record('DEMO_zero', 0, 0, []),
            record('DEMO_negative', -10, 0, []), record('DEMO_missing', 10, 0, []),
            record('DEMO_incomplete', None, 0, [10]), record('DEMO_unknown', None, 0, []),
        ])
        self.assertEqual([r['code'] for r in rows], ['DEMO_incomplete', 'DEMO_unknown', 'DEMO_missing'])
        self.assertEqual([r['grupo'] for r in rows], [0, 0, 1])
        self.assertTrue(all(r['diferenca'] is None for r in rows))
        self.assertIsNone(rows[-1]['documentos_pago'])
        self.assertIsNone(rows[-1]['diferenca_absoluta'])
        self.assertIsNone(rows[0]['valor_ordenacao'])

    def test_thresholds_exact_cents_and_signed_difference(self):
        rows = prioridades.rank([record(f'DEMO_{i}', amount, 0, [0]) for i, amount in enumerate(
            [1, 9_999_999, 10_000_000, 99_999_999, 100_000_000])])
        self.assertEqual([r['grupo'] for r in rows], [2, 3, 3, 4, 4])
        self.assertEqual([r['diferenca'] for r in rows], [-100_000_000, -99_999_999, -10_000_000, -9_999_999, -1])
        self.assertEqual(prioridades.rank([record('DEMO_above', 0, 0, [100_000_000])])[0]['grupo'], 2)

    def test_deterministic_order_ties_and_duplicate_rejection(self):
        original = [record('DEMO_B', 100, 0, []), record('DEMO_A', 100, 0, []), record('DEMO_C', 100_000_000, 0, [0])]
        ranked = prioridades.rank(original)
        self.assertEqual(ranked, prioridades.rank(reversed(original)))
        self.assertEqual([r['code'] for r in ranked], ['DEMO_A', 'DEMO_B', 'DEMO_C'])
        self.assertEqual([r['ordem'] for r in ranked], [1, 2, 3])
        with self.assertRaisesRegex(ValueError, 'repetido'):
            prioridades.rank(original + [original[0]])

    def test_groups_do_not_combine_coverage_with_calculated_differences(self):
        rows = prioridades.rank([record('DEMO_missing', 100, 0, []), record('DEMO_below', 100, 0, [50]),
                                 record('DEMO_above', 100, 0, [150])])
        groups = prioridades.summaries(rows)
        self.assertEqual(groups[0]['total_fonte_sem_pagamento'], 100)
        self.assertIsNone(groups[0]['diferenca_absoluta'])
        self.assertIsNone(groups[1]['total_fonte_sem_pagamento'])
        self.assertEqual(groups[1]['diferenca_absoluta'], 100)

    def test_exports_preserve_null_evidence_and_are_reproducible(self):
        rows = prioridades.rank([record('DEMO_missing', 100, 0, []), record('DEMO_diff', 100, 0, [50])])
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            entry = {'downloaded_at': '2026-11-19', 'raw_sha256': 'DEMO_HASH'}
            report = prioridades.write(entry, {'DEMO_DOCS': 'DEMO_HASH'}, rows, folder, folder)
            before = {p.name: p.read_bytes() for p in folder.iterdir()}
            prioridades.write(entry, {'DEMO_DOCS': 'DEMO_HASH'}, rows, folder, folder)
            self.assertEqual(before, {p.name: p.read_bytes() for p in folder.iterdir()})
            payload = json.loads(next(folder.glob('*.json')).read_text(encoding='utf-8'))
            self.assertNotIn('DEMO_PRIVATE_NAME', json.dumps(payload))
            self.assertEqual(payload['casos'][1]['linhas_documentos_divergentes'][0]['raw_sha256'], 'DEMO_HASH')
            with next(folder.glob('*.csv')).open(encoding='utf-8-sig', newline='') as handle:
                csv_rows = list(csv.DictReader(handle))
            self.assertEqual(csv_rows[0]['diferenca_cents'], '')
            self.assertEqual(csv_rows[0]['documentos_pago_cents'], '')
            self.assertEqual(csv_rows[1]['diferenca_cents'], '-50')
            self.assertIn('/emendas/DEMO_missing', report.read_text(encoding='utf-8'))

    def test_run_checks_package_against_read_only_staging(self):
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            database = folder / 'staging.sqlite'
            source = db()
            source.commit()
            with closing(sqlite3.connect(database)) as target:
                source.backup(target)
            records = audit_conciliacao.build(source, 1)
            source.close()
            entry = {'downloaded_at': '2026-11-19', 'raw_sha256': 'x'}
            payload = {'kind': 'VALIDACAO', 'snapshot': entry, 'document_sources': {'DEMO_DOCS': 's'},
                       'emendas': {r['code']: {k: r[k] for k in ('pago', 'rap_pagos', 'pago_total')} |
                                   {'conciliacao': {k: r[k] for k in ('status', 'documentos_pago')}} for r in records}}
            content = json.dumps(payload).encode()
            (folder / 'emendas.json').write_bytes(content)
            manifest = {'snapshot': 'x', 'document_sources': {'DEMO_DOCS': 's'},
                        'files': {'emendas': {'path': 'emendas.json', 'sha256': hashlib.sha256(content).hexdigest()}}}
            pointer = folder / 'active-bundle.json'
            pointer.write_text(json.dumps(manifest), encoding='utf-8')
            original_hash = hashlib.sha256(database.read_bytes()).hexdigest()
            with patch.object(prioridades, 'latest', return_value=entry):
                self.assertEqual(prioridades.run(database, folder, folder / 'reports'), 0)
                self.assertEqual(hashlib.sha256(database.read_bytes()).hexdigest(), original_hash)
                manifest['document_sources'] = {'DEMO_DOCS': 'other'}
                pointer.write_text(json.dumps(manifest), encoding='utf-8')
                with self.assertRaisesRegex(ValueError, 'Seleção documental'):
                    prioridades.run(database, folder, folder / 'reports')
                manifest['snapshot'] = 'other'
                pointer.write_text(json.dumps(manifest), encoding='utf-8')
                with self.assertRaisesRegex(ValueError, 'Snapshot do pacote'):
                    prioridades.run(database, folder, folder / 'reports')
                manifest['snapshot'] = 'x'
                pointer.write_text(json.dumps(manifest), encoding='utf-8')
                (folder / 'emendas.json').write_bytes(b'{}')
                with self.assertRaisesRegex(ValueError, 'alterado'):
                    prioridades.run(database, folder, folder / 'reports')


if __name__ == '__main__':
    unittest.main()
