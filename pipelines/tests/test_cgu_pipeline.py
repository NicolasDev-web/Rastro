"""Testes do pipeline de dados reais (SPEC 01). Sem rede: ZIP sintético com prefixo DEMO_ (Constituição, regra 15)."""
import csv
import io
import json
import sqlite3
import sys
import tempfile
import unittest
import zipfile
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from rastro import cgu, export, load, report, snapshot  # noqa: E402

CONTRACT = cgu.load_contract()
FORTALEZA, SOBRAL, ITAPAJE = '2304400', '2312908', '2306306'


def main_row(**over):
    base = {c: '' for c in CONTRACT['members'][cgu.MAIN]['columns']}
    base.update({'Código da Emenda': '202500010001', 'Ano da Emenda': '2025', 'Tipo de Emenda': 'Emenda Individual - Transferências Especiais',
                 'Código do Autor da Emenda': '0001', 'Nome do Autor da Emenda': 'DEMO_AUTOR A', 'Número da emenda': '0001',
                 'Possui Apoiador/Solicitante? ': 'Não', 'Localidade de aplicação do recurso': 'FORTALEZA - CE',
                 'Código Município IBGE': FORTALEZA, 'Município': 'FORTALEZA', 'Código UF IBGE': '2300000', 'UF': 'CEARÁ',
                 'Região': 'Nordeste', 'Valor Empenhado': '1000,50', 'Valor Liquidado': '800,00', 'Valor Pago': '700,00',
                 'Valor Restos A Pagar Inscritos': '0,00', 'Valor Restos A Pagar Cancelados': '0,00', 'Valor Restos A Pagar Pagos': '50,00'})
    base.update(over)
    return base


MAIN_ROWS = [
    main_row(),
    main_row(**{'Código da Emenda': '202500010002', 'Localidade de aplicação do recurso': 'CEARÁ (UF)', 'Código Município IBGE': 'Sem informação',
                'Município': 'Sem informação', 'Valor Empenhado': '5000,00', 'Valor Pago': '4000,00', 'Valor Liquidado': ''}),
    main_row(**{'Código da Emenda': '202500010003', 'Localidade de aplicação do recurso': 'MÚLTIPLO', 'Código Município IBGE': 'Sem informação', 'Município': 'Múltiplo'}),
    main_row(**{'Código da Emenda': '202500010004', 'Localidade de aplicação do recurso': 'CEARÁ-MIRIM - RN', 'Código Município IBGE': '2402600',
                'Município': 'CEARÁ-MIRIM', 'Código UF IBGE': '2400000', 'UF': 'RIO GRANDE DO NORTE'}),
    main_row(**{'Código da Emenda': '202500010005', 'Localidade de aplicação do recurso': 'Nacional', 'Código Município IBGE': 'Sem informação',
                'Município': 'Sem informação', 'Código UF IBGE': '-1', 'UF': 'Sem informação', 'Região': 'Sem informação'}),
    main_row(**{'Código da Emenda': 'Sem informação', 'Ano da Emenda': '2020', 'Código do Autor da Emenda': '-99', 'Nome do Autor da Emenda': 'Sem informação',
                'Localidade de aplicação do recurso': 'SOBRAL - CE', 'Código Município IBGE': SOBRAL, 'Município': 'SOBRAL'}),
]

FAV_ROWS = [
    {'Código do Favorecido': '***.123.456-**', 'Favorecido': 'DEMO_PESSOA FISICA', 'Tipo Favorecido': 'Pessoa Fisica', 'Natureza Jurídica': 'Sem informação', 'Município Favorecido': 'FORTALEZA'},
    {'Código do Favorecido': '11854334000149', 'Favorecido': '11.854.334 DEMO_EMPRESARIO', 'Tipo Favorecido': 'Pessoa Jurídica', 'Natureza Jurídica': 'Empresário (Individual)', 'Município Favorecido': 'SOBRAL'},
    {'Código do Favorecido': '00000000000191', 'Favorecido': 'DEMO_PREFEITURA', 'Tipo Favorecido': 'Pessoa Jurídica', 'Natureza Jurídica': 'Município', 'Município Favorecido': 'ITAPAGÉ'},
]


def fav_row(over):
    base = {c: '' for c in CONTRACT['members'][cgu.FAVORECIDO]['columns']}
    base.update({'Código da Emenda': '202500010001', 'Tipo de Emenda': 'DEMO', 'Ano/Mês': '202511', 'UF Favorecido': 'CE', 'Valor Recebido': '10,00'})
    base.update(over)
    return base


def build_zip(extra_column: bool = False) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w') as zf:
        for member, spec in CONTRACT['members'].items():
            cols = list(spec['columns'])
            rows = MAIN_ROWS if member == cgu.MAIN else [fav_row(r) for r in FAV_ROWS] if member == cgu.FAVORECIDO else []
            if member == cgu.MAIN and extra_column:
                cols.append('DEMO_COLUNA_NOVA')
            s = io.StringIO()
            w = csv.writer(s, delimiter=';', quoting=csv.QUOTE_ALL, lineterminator='\r\n')
            w.writerow(cols)
            for r in rows:
                w.writerow([r.get(c, '') for c in cols])
            zf.writestr(member, s.getvalue().encode('cp1252'))
    return buf.getvalue()


IBGE = json.dumps([{'id': int(FORTALEZA), 'nome': 'Fortaleza'}, {'id': int(SOBRAL), 'nome': 'Sobral'}, {'id': int(ITAPAJE), 'nome': 'Itapajé'}]).encode('utf-8')


class Env:
    """Ambiente isolado: raw, manifesto e banco em pasta temporária."""

    def __init__(self, zip_bytes: bytes):
        self.tmp = tempfile.TemporaryDirectory()
        base = Path(self.tmp.name)
        self.raw, self.manifest, self.db = base / 'raw', base / 'snapshots.jsonl', base / 'staging.sqlite'
        fixed = lambda: datetime(2026, 11, 19, tzinfo=timezone.utc)
        fake = lambda data: (lambda url: snapshot.Response(io.BytesIO(data), url, {'last-modified': 'DEMO'}))
        self.cgu_entry = snapshot.acquire(snapshot.SOURCES['cgu_emendas'], raw_dir=self.raw, manifest=self.manifest, fetch=fake(zip_bytes), now=fixed)
        self.ibge_entry = snapshot.acquire(snapshot.SOURCES['ibge_municipios_ce'], raw_dir=self.raw, manifest=self.manifest, fetch=fake(IBGE), now=fixed)

    def load(self):
        con = load.connect(self.db)
        try:
            with con:
                codes = load.load_ibge(con, self.ibge_entry, self.raw, expected=3)
                return load.load_cgu(con, self.cgu_entry, codes, raw_dir=self.raw)
        finally:
            con.close()

    def dump(self) -> list:
        con = sqlite3.connect(self.db)
        try:
            return [r for t in ('municipalities', *load.DATA_TABLES) for r in con.execute(f'SELECT * FROM {t} ORDER BY 1, 2')]
        finally:
            con.close()

    def close(self):
        self.tmp.cleanup()


class ParsingTests(unittest.TestCase):
    def test_cents_pt_br(self):
        self.assertEqual(cgu.cents('408000,00'), 40800000)
        self.assertEqual(cgu.cents('-12,5'), -1250)
        self.assertEqual(cgu.cents('7'), 700)

    def test_missing_is_none_not_zero(self):  # AC06
        self.assertIsNone(cgu.cents(''))
        self.assertIsNone(cgu.cents('Sem informação'))

    def test_unexpected_money_format_fails(self):
        with self.assertRaises(cgu.ContractError):
            cgu.cents('1.000,00')

    def test_sentinels(self):  # AC07
        for s in ('Sem informação', 'S/I', '-99', '  '):
            self.assertIsNone(cgu.clean(s))

    def test_classify_by_code_not_text(self):  # AC08
        ce = {FORTALEZA, SOBRAL}
        self.assertEqual(cgu.classify(MAIN_ROWS[3], ce), ('fora_do_recorte:outra_uf', None))
        self.assertEqual(cgu.classify(MAIN_ROWS[4], ce), ('fora_do_recorte:nacional', None))
        self.assertEqual(cgu.classify(MAIN_ROWS[1], ce), ('estado', None))
        self.assertEqual(cgu.classify(MAIN_ROWS[2], ce), ('multiplo', None))
        self.assertEqual(cgu.classify(MAIN_ROWS[0], ce), ('municipio', FORTALEZA))


class PipelineTests(unittest.TestCase):
    def setUp(self):
        self.env = Env(build_zip())

    def tearDown(self):
        self.env.close()

    def test_snapshot_preserved_and_reused(self):  # AC01
        e = self.env.cgu_entry
        path = self.env.raw / e['raw_path']
        self.assertEqual(snapshot.sha256_file(path), e['raw_sha256'])
        self.assertTrue(path.name.startswith('2026-11-19_' + e['raw_sha256'][:8]))
        again = snapshot.acquire(snapshot.SOURCES['cgu_emendas'], raw_dir=self.env.raw, manifest=self.env.manifest,
                                 fetch=lambda url: snapshot.Response(io.BytesIO(build_zip()), url, {}))
        self.assertTrue(again['reused'])
        self.assertEqual(len([x for x in snapshot.read_manifest(self.env.manifest) if x['source_id'] == 'cgu_emendas']), 1)

    def test_every_line_references_snapshot(self):  # AC01
        self.env.load()
        con = sqlite3.connect(self.env.db)
        rows = con.execute('SELECT snapshot_id, source_row_id, row_sha256 FROM cgu_emenda_lines').fetchall()
        ce = con.execute("SELECT COUNT(*) FROM cgu_emenda_lines WHERE territorial_scope IN ('municipio', 'estado', 'multiplo')").fetchone()[0]
        con.close()
        self.assertEqual(len(rows), 6)  # o staging guarda todas as linhas (aba de autores)
        self.assertEqual(ce, 4)         # recorte CE: Fortaleza, estado, múltiplo, Sobral sem código
        self.assertTrue(all(s and r.startswith(cgu.MAIN + ':') and len(h) == 64 for s, r, h in rows))

    def test_idempotent(self):  # AC02
        self.env.load()
        first = self.env.dump()
        self.env.load()
        self.assertEqual(first, self.env.dump())

    def test_unknown_column_blocks_load(self):  # AC05
        env = Env(build_zip(extra_column=True))
        try:
            with self.assertRaises(cgu.ContractError):
                env.load()
            con = sqlite3.connect(env.db)
            self.assertEqual(con.execute('SELECT COUNT(*) FROM cgu_emenda_lines').fetchone()[0], 0)
            con.close()
        finally:
            env.close()

    def test_state_never_counted_in_fortaleza(self):  # AC04
        self.env.load()
        con = sqlite3.connect(self.env.db)
        payload = export.build(con, self.env.cgu_entry)
        con.close()
        fortaleza = next(m for m in payload['municipalities'] if m['ibge_code'] == FORTALEZA)
        self.assertEqual(fortaleza['years']['2025']['pago'], 70000)
        estado = next(n for n in payload['non_municipal'] if n['id'] == 'estado')
        self.assertEqual(estado['years']['2025']['pago'], 400000)
        self.assertIsNone(estado['years']['2025']['liquidado'])  # AC06: vazio na fonte = null
        self.assertIsNone(fortaleza['years']['2021'])            # ano sem linhas = null, não zero

    def test_code_less_line_gets_technical_id(self):  # AC07
        self.env.load()
        con = sqlite3.connect(self.env.db)
        code, tid, official, autor = con.execute("SELECT emenda_code, technical_id, is_official_code, autor_codigo FROM cgu_emenda_lines WHERE ano = 2020").fetchone()
        con.close()
        self.assertIsNone(code)
        self.assertTrue(tid.startswith('TEC-'))
        self.assertEqual(official, 0)
        self.assertIsNone(autor)  # '-99' nunca vira código de autor

    def test_private_persons_masked(self):  # AC09
        self.env.load()
        flat = repr(self.env.dump())
        self.assertNotIn('DEMO_PESSOA FISICA', flat)
        self.assertNotIn('123.456', flat)
        self.assertNotIn('DEMO_EMPRESARIO', flat)
        self.assertIn('DEMO_PREFEITURA', flat)

    def test_explicit_alias_matches_old_spelling(self):
        self.env.load()
        con = sqlite3.connect(self.env.db)
        code = con.execute("SELECT municipio_ibge FROM cgu_favorecidos_ce WHERE municipio_nome = 'ITAPAGÉ'").fetchone()[0]
        con.close()
        self.assertEqual(code, ITAPAJE)

    def test_conservation_raw_vs_staging(self):  # Gate A
        self.env.load()
        con = sqlite3.connect(self.env.db)
        sid = con.execute('SELECT id FROM snapshots WHERE source_id = ?', ('cgu_emendas',)).fetchone()[0]
        b = report.totals_from_staging(con, sid)
        con.close()
        a = report.totals_from_raw(self.env.raw / self.env.cgu_entry['raw_path'])
        self.assertEqual(report.conservation(a, b), [])


class ReviewSheetTests(unittest.TestCase):
    def test_signed_review_sheet_is_never_overwritten(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / 'conferencia.md'
            self.assertTrue(report.write_once(p, 'gerado'))
            p.write_text('preenchido e assinado pelo revisor', encoding='utf-8')
            self.assertFalse(report.write_once(p, 'gerado de novo'))
            self.assertEqual(p.read_text(encoding='utf-8'), 'preenchido e assinado pelo revisor')


if __name__ == '__main__':
    unittest.main()
