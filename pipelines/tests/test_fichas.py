"""Contratos das fichas: fixtures sintéticas, sem rede ou dados pessoais reais."""
import json
import unittest
from unittest.mock import patch

from test_documentos import db
from rastro import fichas, export


class FichasTests(unittest.TestCase):
    def setUp(self):
        self.con = db()
        self.addCleanup(self.con.close)
        self.con.executemany('INSERT INTO municipalities VALUES (?,?,?,?,?)', [
            ('2304400', 'DEMO_CAPITAL', 'demo_capital', 'CE', 1),
            ('2312908', 'DEMO_INTERIOR', 'demo_interior', 'CE', 1)])
        self.con.execute("UPDATE cgu_emenda_lines SET municipio_ibge='2304400', autor_codigo='DEMO_A', autor_nome='DEMO_AUTOR' WHERE emenda_code='A'")
        self.con.execute("UPDATE cgu_documentos SET favorecido_nome='Pessoa física — omitido', tipo_favorecido='Pessoa Física', data_documento='20/06/2024'")
        self.con.execute("UPDATE cgu_documentos SET data_documento='10/03/2024' WHERE fase='Empenho'")
        self.con.execute("INSERT INTO cgu_convenios_ce (snapshot_id,source_row_id,row_sha256,emenda_code,numero,data_publicacao,convenente,objeto,valor_cents) VALUES (1,'DEMO_C','x','A','DEMO_CONVENIO','01/02/2024','DEMO_ENTIDADE','DEMO_OBJETO',150)")
        with patch.object(fichas, '_authors_with_page', return_value={'DEMO_A': 'DEMO_AUTOR'}):
            self.em, self.mu = fichas.build(self.con, {'raw_sha256': 'x', 'downloaded_at': '2026-11-19'})

    def test_reconciliation_includes_rap_without_counting_commitment(self):
        a = self.em['emendas']['A']
        self.assertEqual(a['pago_total'], 150)
        self.assertEqual(a['conciliacao'], {'status': 'confere', 'documentos_pago': 150})
        self.assertEqual(a['quem_recebeu'][0]['documentos'], 2)
        self.assertEqual(a['quem_recebeu'][0]['valor'], 150)

    def test_missing_documents_and_divergence_remain_explicit(self):
        self.assertEqual(self.em['emendas']['C']['conciliacao']['status'], 'diverge')
        self.assertEqual(self.em['emendas']['D']['conciliacao']['status'], 'sem_documentos')

    def test_timeline_iso_sorted_and_convenio(self):
        a = self.em['emendas']['A']
        self.assertEqual(a['documentos'][0]['data'], '2024-03-10')
        self.assertEqual(a['documentos'][0]['fase'], 'Empenho')
        self.assertEqual(a['convenios'][0]['data_publicacao'], '2024-02-01')

    def test_author_link_is_only_for_exported_authors(self):
        self.assertEqual(self.em['emendas']['A']['autor_ficha'], 'siafi-DEMO_A')
        self.assertIsNone(self.em['emendas']['B']['autor_ficha'])

    def test_municipality_criteria_stay_separate_and_empty_city_exists(self):
        city = self.mu['municipios']['2304400']
        self.assertEqual([e['code'] for e in city['emendas_localidade']], ['A'])
        self.assertEqual({e['code'] for e in city['emendas_aplicacao']}, {'A', 'B'})
        self.assertEqual(self.mu['municipios']['2312908']['emendas_aplicacao'], [])
        self.assertEqual(city['autores'], [{'id': 'siafi-DEMO_A', 'name': 'DEMO_AUTOR'}])

    def test_privacy_contract_does_not_export_identifiers(self):
        payload = json.dumps([self.em, self.mu], ensure_ascii=False)
        self.assertNotIn('favorecido_codigo', payload)
        self.assertIn('Pessoa física — omitido', payload)

    def test_application_export_does_not_change_original_locality(self):
        data = export.build(self.con, {'raw_sha256': 'x', 'downloaded_at': '2026-11-19', 'source_url': 'https://example.invalid/DEMO'})
        capital = next(m for m in data['municipalities'] if m['ibge_code'] == '2304400')
        self.assertEqual(capital['years']['2024']['pago'], 100)
        self.assertEqual(capital['aplicacao']['2024']['pago'], 230)


if __name__ == '__main__':
    unittest.main()
