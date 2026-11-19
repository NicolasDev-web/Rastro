"""Testes da conciliação com documentos de despesa (incremento 2). Dados sintéticos DEMO_."""
import sqlite3
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from rastro import documentos, load  # noqa: E402


def db():
    con = sqlite3.connect(':memory:')
    con.executescript(load.SCHEMA.read_text(encoding='utf-8'))
    con.executescript(documentos.SCHEMA)
    con.execute("INSERT INTO cgu_documentos_selecao VALUES ('DEMO_DOCS', 's')")
    con.execute("INSERT INTO snapshots (id, source_id, raw_sha256, raw_path, downloaded_at) VALUES (1, 'cgu_emendas', 'x', 'x', '2026-11-19')")
    cols = [r[1] for r in con.execute('PRAGMA table_info(cgu_emenda_lines)')]

    def line(code, scope, pago, rap, emp, n):
        row = {c: None for c in cols}
        row.update(snapshot_id=1, source_row_id=f'DEMO:{n}', row_sha256='0' * 64, emenda_code=code, technical_id=code, is_official_code=1,
                   ano=2024, tipo='DEMO', localidade='X', territorial_scope=scope, pago_cents=pago, rap_pagos_cents=rap, empenhado_cents=emp)
        con.execute(f'INSERT INTO cgu_emenda_lines ({",".join(cols)}) VALUES ({",".join("?" * len(cols))})', [row[c] for c in cols])

    def doc(code, fase, pago=None, emp=None, n=0, uf='CE', ibge='2304400'):
        con.execute('INSERT INTO cgu_documentos VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                    ('s', f'd{n}', code, 2024, fase, None, f'DOC{n}', emp, pago, uf, 'DEMO', ibge, 'DEMO', None, None, None, None))

    line('A', 'municipio', 100, 50, 150, 1)     # H1: documentos = pago + RAP
    doc('A', 'Pagamento', pago=100, n=1); doc('A', 'Pagamento', pago=50, n=2); doc('A', 'Empenho', emp=150, n=3)
    line('B', 'multiplo', 80, 0, 80, 2)         # sem RAP: conta em H1; pagamento aplicado em município do CE = ganho
    doc('B', 'Pagamento', pago=80, n=4); doc('B', 'Empenho', emp=80, n=5)
    line('C', 'estado', 0, 70, 70, 3)           # documentos cobrem só parte do RAP
    doc('C', 'Pagamento', pago=40, n=6, ibge=None)
    line('D', 'municipio', 10, 0, 10, 4)        # sem nenhum documento
    return con


class ReconcileTests(unittest.TestCase):
    def setUp(self):
        con = db()
        self.addCleanup(con.close)
        self.rec = documentos.reconcile(con, 1)

    def test_h1_counts(self):
        self.assertEqual(self.rec['emendas'], 4)
        self.assertEqual(self.rec['h1_igual'], 2)
        self.assertEqual(self.rec['nenhum'], 1)
        self.assertEqual(self.rec['sem_documentos'], 1)

    def test_each_amendment_counted_once_ac03(self):
        # A tem 3 documentos, mas conta como 1 emenda
        self.assertEqual(self.rec['docs_por_emenda_max'], 3)
        self.assertEqual(self.rec['por_ano'][2024]['emendas'], 4)

    def test_traceability_gain_only_with_ce_municipality(self):
        self.assertEqual([tuple(r) for r in self.rec['ganho']], [('multiplo', 1, 80)])

    def test_individual_entrepreneur_name_pattern(self):
        self.assertTrue(documentos._MEI.match('11.854.334 DEMO PESSOA'))
        self.assertFalse(documentos._MEI.match('MUNICIPIO DE DEMO'))


if __name__ == '__main__':
    unittest.main()
