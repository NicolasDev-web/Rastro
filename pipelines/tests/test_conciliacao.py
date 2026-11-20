"""Regressões sintéticas DEMO_: cobertura, escopo e evidências financeiras."""
import csv
import json
import tempfile
import unittest
from pathlib import Path

from test_documentos import db
from rastro import audit_conciliacao as audit, documentos
from rastro.conciliacao import payment


class PaymentTests(unittest.TestCase):
    def test_exclusive_patterns_and_exact_cents(self):
        for pago, rap, values, status, pattern, diff in [
            (100, 50, [100, 50], 'confere', 'confere', 0),
            (100, 50, [100], 'diverge', 'igual_so_pago', -50),
            (100, 50, [149], 'diverge', 'abaixo', -1),
            (100, 50, [151], 'diverge', 'acima', 1),
            (0, 0, [0], 'confere', 'confere', 0),
            (0, 0, [], 'sem_documentos', 'sem_documentos', None),
            (None, 50, [100], 'indisponivel', 'indisponivel', None),
            (100, 50, [100, None], 'indisponivel', 'indisponivel', None),
            (100, 50, [160, -10], 'confere', 'confere', 0),
        ]:
            with self.subTest(pago=pago, rap=rap, values=values):
                r = payment(pago, rap, values)
                self.assertEqual((r['status'], r['padrao'], r['diferenca']), (status, pattern, diff))
        self.assertIsNone(payment(0, 0, [])['documentos_pago'])


class AuditTests(unittest.TestCase):
    def setUp(self):
        self.con = db()
        self.addCleanup(self.con.close)

    def test_commitment_only_is_missing_payment_and_keeps_commitment_denominator(self):
        self.con.execute("DELETE FROM cgu_documentos WHERE emenda_code='A' AND fase='Pagamento'")
        self.con.execute("UPDATE cgu_emenda_lines SET pago_cents=0,rap_pagos_cents=0 WHERE emenda_code='A'")
        rec = documentos.reconcile(self.con, 1)
        self.assertEqual(rec['sem_documentos'], 2)  # A e D
        self.assertEqual(rec['nenhum'], 1)  # apenas C
        self.assertEqual((rec['empenho_igual'], rec['empenho_comparavel']), (2, 2))
        self.assertEqual(rec['comparaveis'], 2)
        s = audit.summarize(audit.build(self.con, 1))
        self.assertEqual((s['sem_documentos_total_zero'], s['sem_documentos_total_positivo']), (1, 1))

    def test_incomplete_payment_does_not_skip_commitment(self):
        self.con.execute("UPDATE cgu_emenda_lines SET pago_cents=NULL WHERE emenda_code='A'")
        rec = documentos.reconcile(self.con, 1)
        self.assertEqual(rec['indisponivel'], 1)
        self.assertEqual((rec['empenho_igual'], rec['empenho_comparavel']), (2, 2))

    def test_select_ce_code_but_compare_all_localities(self):
        cols = [r[1] for r in self.con.execute('PRAGMA table_info(cgu_emenda_lines)')]
        row = dict(zip(cols, self.con.execute("SELECT * FROM cgu_emenda_lines WHERE emenda_code='A'").fetchone()))
        row.update(source_row_id='DEMO:outside', territorial_scope='outra_uf', pago_cents=20, rap_pagos_cents=0)
        self.con.execute(f'INSERT INTO cgu_emenda_lines ({",".join(cols)}) VALUES ({",".join("?" * len(cols))})', list(row.values()))
        r = next(r for r in audit.build(self.con, 1) if r['code'] == 'A')
        self.assertTrue(r['recorte_ce'])
        self.assertEqual((r['pago_total'], r['documentos_pago'], r['diferenca']), (170, 150, -20))
        self.assertEqual(len(r['linhas_emenda']), 2)
        self.assertEqual(documentos.reconcile(self.con, 1)['h1_igual'], 1)

    def test_partition_and_traceable_private_safe_exports(self):
        records = audit.build(self.con, 1)
        s = audit.summarize(records)
        self.assertEqual(sum(s['padroes'].values()), s['emendas'])
        self.assertEqual(s['comparaveis'] + s['padroes']['sem_documentos'] + s['padroes']['indisponivel'], s['emendas'])
        c = next(r for r in records if r['code'] == 'C')
        self.assertEqual(c['linhas_documentos_divergentes'], [{'raw_sha256':'s', 'source_row_id':'d6'}])
        entry = {'raw_sha256':'DEMO_HASH', 'downloaded_at':'2026-11-19'}
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            audit.write(entry, {'DEMO_DOCS':'s'}, records, root, root)
            first = {p.name:p.read_bytes() for p in root.iterdir()}
            audit.write(entry, {'DEMO_DOCS':'s'}, audit.build(self.con, 1), root, root)
            self.assertEqual(first, {p.name:p.read_bytes() for p in root.iterdir()})
            payload = json.loads((root/'conciliacao-2026-11-19-DEMO_HAS.json').read_text(encoding='utf-8'))
            self.assertEqual(payload['document_sources'], {'DEMO_DOCS':'s'})
            for groups in payload['grupos']['fichas'].values():
                self.assertEqual(sum(g['emendas'] for g in groups.values()), len(records))
            text = json.dumps(payload)
            self.assertNotIn('favorecido', text)
            missing = next(r for r in payload['emendas'] if r['code'] == 'D')
            self.assertIsNone(missing['documentos_pago'])
            self.assertIsNone(missing['diferenca'])
            with (root/'conciliacao-2026-11-19-DEMO_HAS.csv').open(encoding='utf-8', newline='') as f:
                rows = {r['code']: r for r in csv.DictReader(f)}
            self.assertEqual(rows['D']['documentos_pago_cents'], '')
            self.assertEqual(rows['C']['pago_cents'], '0')


if __name__ == '__main__':
    unittest.main()
