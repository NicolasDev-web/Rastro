import csv
import json
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch
import test_fichas
from test_documentos import db
from rastro import documentos, fichas, bundle


class IntegrityTests(unittest.TestCase):
    def setUp(self):
        mocked = patch.object(fichas, '_authors_with_page', return_value={'DEMO_A':'DEMO_AUTOR'})
        mocked.start()
        self.addCleanup(mocked.stop)

    def test_historical_documents_are_excluded_everywhere(self):
        t = test_fichas.FichasTests(); t.setUp(); self.addCleanup(t.doCleanups)
        before = documentos.aplicacao_por_municipio(t.con)
        t.con.execute("INSERT INTO cgu_documentos SELECT 'DEMO_OLD',source_row_id,emenda_code,ano_emenda,fase,data_documento,codigo_documento,valor_empenhado_cents,valor_pago_cents,uf_aplicacao,municipio_aplicacao,ibge_aplicacao,localidade_aplicacao,favorecido_codigo,favorecido_nome,tipo_favorecido,modalidade_aplicacao FROM cgu_documentos")
        em, mu = fichas.build(t.con, {'raw_sha256': 'x', 'downloaded_at': '2026-11-19'})
        self.assertEqual(documentos.aplicacao_por_municipio(t.con), before)
        self.assertEqual(em['emendas']['A']['conciliacao']['documentos_pago'], 150)
        self.assertEqual(next(e for e in mu['municipios']['2304400']['emendas_aplicacao'] if e['code'] == 'B')['pago'], 80)
        self.assertEqual(documentos.reconcile(t.con, 1)['h1_igual'], 2)

    def test_incomplete_and_zero_are_distinct(self):
        t = test_fichas.FichasTests(); t.setUp(); self.addCleanup(t.doCleanups)
        t.con.execute("UPDATE cgu_emenda_lines SET pago_cents=NULL WHERE emenda_code='A'")
        em, _ = fichas.build(t.con, {'raw_sha256':'x','downloaded_at':'2026-11-19'})
        self.assertIsNone(em['emendas']['A']['pago_total'])
        self.assertEqual(em['emendas']['A']['conciliacao']['status'], 'indisponivel')
        self.assertEqual(documentos.reconcile(t.con, 1)['indisponivel'], 1)
        t.con.execute("UPDATE cgu_emenda_lines SET pago_cents=0,rap_pagos_cents=0 WHERE emenda_code='A'")
        t.con.execute("UPDATE cgu_documentos SET valor_pago_cents=0 WHERE emenda_code='A' AND fase='Pagamento'")
        em, _ = fichas.build(t.con, {'raw_sha256':'x','downloaded_at':'2026-11-19'})
        self.assertEqual(em['emendas']['A']['conciliacao'], {'status':'confere','documentos_pago':0})

    def test_partial_document_amount_cannot_reconcile(self):
        t = test_fichas.FichasTests(); t.setUp(); self.addCleanup(t.doCleanups)
        t.con.execute("UPDATE cgu_documentos SET valor_pago_cents=NULL WHERE source_row_id='d1'")
        em, _ = fichas.build(t.con, {'raw_sha256':'x','downloaded_at':'2026-11-19'})
        self.assertIsNone(em['emendas']['A']['conciliacao']['documentos_pago'])
        self.assertEqual(em['emendas']['A']['conciliacao']['status'], 'indisponivel')
        self.assertIsNone(documentos.aplicacao_por_municipio(t.con)['2304400']['2024']['pago'])

    def test_commitment_without_payment_is_not_payment_evidence(self):
        t = test_fichas.FichasTests(); t.setUp(); self.addCleanup(t.doCleanups)
        t.con.execute("DELETE FROM cgu_documentos WHERE emenda_code='A' AND fase='Pagamento'")
        t.con.execute("UPDATE cgu_emenda_lines SET pago_cents=0,rap_pagos_cents=0 WHERE emenda_code='A'")
        em, _ = fichas.build(t.con, {'raw_sha256':'x','downloaded_at':'2026-11-19'})
        self.assertEqual(em['emendas']['A']['conciliacao']['status'], 'sem_documentos')
        self.assertIsNone(em['emendas']['A']['conciliacao']['documentos_pago'])

    def test_failed_load_keeps_selection_and_rows(self):
        con = db(); self.addCleanup(con.close); con.commit()
        contract = documentos.load_contract()
        with tempfile.TemporaryDirectory() as folder:
            good, bad = Path(folder)/'good.zip', Path(folder)/'bad.zip'
            name = 'DEMO_EmendasParlamentares_PorDocumento.csv'
            import io
            text = io.StringIO(); csv.writer(text, delimiter=';').writerow(contract['columns'])
            for file, content in [(good,text.getvalue()),(bad,'INVALID\n')]:
                with zipfile.ZipFile(file,'w') as z: z.writestr(name,content.encode('cp1252'))
            entries = [{'source_id':'DEMO_2024','raw_sha256':'s','file':good}, {'source_id':'DEMO_2025','raw_sha256':'bad','file':bad}]
            with patch.object(documentos,'verify',side_effect=lambda e:e['file']):
                with self.assertRaises(documentos.ContractError): documentos.load(con, entries, set(), contract)
            self.assertEqual(documentos.selected_sources(con), {'DEMO_DOCS':'s'})
            self.assertEqual(con.execute('SELECT COUNT(*) FROM cgu_documentos_ativos').fetchone()[0],6)

    def test_bundle_failure_does_not_replace_pointer(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder); entry={'raw_sha256':'x','downloaded_at':'2026-11-19'}
            fields = {'ce-municipios':{'municipalities':[], 'non_municipal':[], 'years':[2025]}, 'autores':{'authors':[], 'collective':[], 'years':[2025]}, 'emendas':{'emendas':{}}, 'municipios':{'municipios':{}}}
            for prefix in bundle.PREFIXES:
                (root/f'{prefix}-2026-11-19-x.json').write_text(json.dumps({'kind':'VALIDACAO','snapshot':entry,'document_sources':{'DEMO':'hash'}, **fields[prefix]}))
            ident=bundle.publish(entry,root)
            original=(root/'active-bundle.json').read_bytes()
            self.assertEqual(bundle.publish(entry,root),ident)
            file=root/'emendas-2026-11-19-x.json'
            bad=json.loads(file.read_text()); bad['document_sources']={'DEMO':'other'}; file.write_text(json.dumps(bad))
            with self.assertRaises(ValueError): bundle.publish(entry,root)
            self.assertEqual((root/'active-bundle.json').read_bytes(),original)
            bad['document_sources']={'DEMO':'hash'}; bad['emendas']=[]; file.write_text(json.dumps(bad))
            with self.assertRaises(ValueError): bundle.publish(entry,root)
            self.assertEqual((root/'active-bundle.json').read_bytes(),original)
