"""Testes da aba de autores (SPEC 04 T04.04, AC09–AC11; ADR-009). Sem rede, dados sintéticos DEMO_."""
import sqlite3
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from rastro import alece, autores, cgu, load, parlamentares  # noqa: E402

SHA = 'd' * 64
ENTRY = {'raw_sha256': SHA, 'downloaded_at': '2026-11-19T00:00:00+00:00'}


def make_db() -> sqlite3.Connection:
    con = sqlite3.connect(':memory:')
    con.executescript(load.SCHEMA.read_text(encoding='utf-8'))
    con.executescript(parlamentares.SCHEMA)
    con.execute("INSERT INTO snapshots (id, source_id, raw_sha256, raw_path, downloaded_at) VALUES (1, 'cgu_emendas', ?, 'x', '2026-11-19')", (SHA,))
    con.execute("INSERT INTO municipalities VALUES ('2304400', 'Fortaleza', 'FORTALEZA', 'CE', 1)")
    cols = [r[1] for r in con.execute('PRAGMA table_info(cgu_emenda_lines)')]
    n = [0]

    def line(autor, nome, scope, pago, tipo='Emenda Individual - Transferências Especiais', ano=2025, mun=None, mun_outro=None, uf='CEARÁ', loc='X'):
        n[0] += 1
        row = {c: None for c in cols}
        row.update(snapshot_id=1, source_row_id=f'DEMO:{n[0]}', row_sha256='0' * 64, technical_id=f'TEC-DEMO{n[0]}', is_official_code=0,
                   ano=ano, tipo=tipo, autor_codigo=autor, autor_nome=nome, localidade=loc, territorial_scope=scope,
                   municipio_ibge=mun, municipio_codigo=mun or mun_outro, uf=uf, pago_cents=pago, empenhado_cents=pago, liquidado_cents=pago, rap_pagos_cents=0)
        con.execute(f'INSERT INTO cgu_emenda_lines ({",".join(cols)}) VALUES ({",".join("?" * len(cols))})', [row[c] for c in cols])

    # A: eleito pelo CE — todas as emendas, inclusive fora do CE
    line('D001', 'DEMO_DEP A', 'municipio', 100, mun='2304400')
    line('D001', 'DEMO_DEP A', 'nacional', 50, uf=None, loc='Nacional')
    line('D001', 'DEMO_DEP A', 'outra_uf', 30, mun_outro='3550308', uf='SÃO PAULO')
    # B: de outro estado — só o que foi para o CE
    line('D002', 'DEMO_DEP B', 'estado', 70, ano=2024, loc='CEARÁ (UF)')
    line('D002', 'DEMO_DEP B', 'outra_uf', 999, mun_outro='3550308', uf='SÃO PAULO')
    # C: homônimo na Câmara e no Senado
    line('D003', 'DEMO_DEP C', 'municipio', 10, mun='2304400')
    # E: de outro estado, sem nada no CE → fora da aba
    line('D005', 'DEMO_DEP E', 'outra_uf', 40, mun_outro='3550308', uf='SÃO PAULO')
    # autoria coletiva e sem autor: nunca em pessoa (AC09)
    line('B001', 'DEMO_BANCADA', 'multiplo', 500, tipo='Emenda de Bancada', loc='MÚLTIPLO')
    line(None, None, 'multiplo', 300, tipo='Emenda de Relator', loc='MÚLTIPLO')
    people = [('camara', '1', 'DEMO_DEP A', 'CE', 1), ('camara', '2', 'DEMO_DEP B', 'SP', 0),
              ('camara', '3', 'DEMO_DEP C', 'CE', 1), ('senado', '9', 'DEMO_DEP C', 'CE', 1), ('camara', '5', 'DEMO_DEP E', 'SP', 0)]
    con.executemany('INSERT INTO parlamentares VALUES (?,?,?,?,?,?,?,?,?,?,?)',
                    [(c, i, n_, cgu.normalize_name(n_), 'DEMO', uf, e, '57', None, None, '2026-11-19') for c, i, n_, uf, e in people])
    return con


class AutoresTests(unittest.TestCase):
    def setUp(self):
        self.con = make_db()
        self.links = autores.link_authors(self.con, 1, {})

    def tearDown(self):
        self.con.close()

    def payload(self, links=None):
        keep = autores.relevant_codes(self.con, 1, links or self.links)
        return autores.build(self.con, ENTRY, {c: l for c, l in (links or self.links).items() if c in keep}, {})

    def author(self, payload, code):
        return next((a for a in payload['authors'] if a['siafi_code'] == code), None)

    def test_exact_unique_name_is_only_under_review(self):  # AC11
        self.assertEqual(self.links['D001']['status'], 'em_revisao')
        self.assertEqual((self.links['D001']['casa'], self.links['D001']['id']), ('camara', '1'))

    def test_homonyms_stay_pending(self):
        self.assertEqual(self.links['D003']['status'], 'pendente')
        self.assertIsNone(self.links['D003']['casa'])

    def test_human_review_prevails(self):
        links = autores.link_authors(self.con, 1, {'D001': {'status': 'rejeitado'}, 'D003': {'status': 'revisado', 'casa': 'senado', 'id': '9'}})
        self.assertEqual(links['D001']['status'], 'rejeitado')
        self.assertIsNone(links['D001']['casa'])
        self.assertEqual((links['D003']['status'], links['D003']['casa'], links['D003']['id']), ('revisado', 'senado', '9'))

    def test_report_marks_only_signed_reviews(self):
        links = autores.link_authors(self.con, 1, {
            'D001': {'status': 'revisado', 'casa': 'camara', 'id': '1', 'revisor': 'Revisor DEMO', 'data': '2026-11-19'},
            'D003': {'status': 'revisado', 'casa': 'senado', 'id': '9'},  # sem revisor: continua aberta
        })
        self.assertEqual(autores.reviewer_cell(links['D001']), '[x] confere — Revisor DEMO (2026-11-19)')
        self.assertEqual(autores.reviewer_cell(links['D003']), '[ ] confere')
        self.assertEqual(autores.reviewer_cell(links['D002']), '[ ] confere')  # em_revisao nunca é marcado

    def test_elected_in_ce_shows_everything(self):
        a = self.author(self.payload(), 'D001')
        self.assertTrue(a['eleito_ce'])
        self.assertEqual(a['scope'], 'todas')
        self.assertEqual(a['total']['pago'], 180)  # AC10: soma = 100 + 50 + 30
        self.assertEqual({t['ibge'] for t in a['traceable']}, {'2304400', '3550308'})
        self.assertEqual([u['label'] for u in a['untraceable']], ['Nacional'])
        self.assertEqual(a['untraceable'][0]['pago'], 50)  # sem rastreio: só o valor

    def test_other_state_shows_only_ce(self):
        a = self.author(self.payload(), 'D002')
        self.assertFalse(a['eleito_ce'])
        self.assertEqual(a['scope'], 'somente_ce')
        self.assertEqual(a['total']['pago'], 70)
        self.assertEqual(a['traceable'], [])
        self.assertEqual(a['untraceable'][0]['label'], 'Aplicação estadual — Ceará')

    def test_author_without_ce_link_is_left_out(self):
        self.assertIsNone(self.author(self.payload(), 'D005'))

    def test_collective_never_attributed_to_people(self):  # AC09
        p = self.payload()
        self.assertFalse(any(a['siafi_code'] == 'B001' for a in p['authors']))
        coll = {c['label']: c['total']['pago'] for c in p['collective']}
        self.assertEqual(coll, {'DEMO_BANCADA': 500, 'Autor não identificado na fonte': 300})
        self.assertEqual(sum(a['total']['pago'] for a in p['authors']), 180 + 70 + 10)

    def test_year_without_lines_is_null(self):
        a = self.author(self.payload(), 'D001')
        self.assertIsNone(a['years']['2020'])
        self.assertEqual(a['years']['2025']['emendas'], 3)


class ParserTests(unittest.TestCase):
    def test_senado_uf_comes_from_mandate(self):
        payload = {'ListaParlamentarLegislatura': {'Parlamentares': {'Parlamentar': [
            {'IdentificacaoParlamentar': {'CodigoParlamentar': '9', 'NomeParlamentar': 'DEMO Senador', 'SiglaPartidoParlamentar': 'X',
                                          'UrlFotoParlamentar': 'http://www.senado.leg.br/x.jpg'},
             'Mandatos': {'Mandato': [{'UfParlamentar': 'CE', 'PrimeiraLegislaturaDoMandato': {'NumeroLegislatura': '56'}}]}}]}}}
        p = parlamentares.parse_senado(payload)[('senado', '9')]
        self.assertTrue(p['eleito_ce'])
        self.assertTrue(p['url_foto'].startswith('https://'))

    def test_camara_latest_legislature_wins(self):
        out = parlamentares.parse_camara([
            (57, {'dados': [{'id': 1, 'nome': 'DEMO Dep', 'siglaPartido': 'NOVO', 'siglaUf': 'CE', 'urlFoto': None}]}),
            (56, {'dados': [{'id': 1, 'nome': 'DEMO Dep', 'siglaPartido': 'VELHO', 'siglaUf': 'CE', 'urlFoto': None}]}),
        ])
        self.assertEqual(out[('camara', '1')]['partido_atual'], 'NOVO')
        self.assertEqual(out[('camara', '1')]['legislaturas'], {56, 57})


class AleceTests(unittest.TestCase):
    CARD = '<div class="deputado_card "><img width="100%" src="https://www.al.ce.gov.br/image/{i}" alt="Foto de {n}"><p class="deputado_card--nome s-font-1"><a href="https://www.al.ce.gov.br/deputados/{slug}"> {n} </a></p><p class="deputado_card--partido s-font-1"> {p} </p></div>'

    def page(self, titulares, suplentes):
        c = lambda k, n: self.CARD.format(i=k, n=n, slug=n.lower().replace(' ', '-'), p='DEMO')
        return ''.join(c(k, f'DEMO Dep {k}') for k in range(titulares)) + '<h2>Suplentes em Exercício</h2>' + ''.join(c(100 + k, f'DEMO Sup {k}') for k in range(suplentes))

    def test_parse_cards_and_situation(self):
        out = alece.parse(self.page(46, 2))
        self.assertEqual(len(out), 48)
        self.assertEqual(sum(d['situacao'] == 'suplente_em_exercicio' for d in out), 2)
        self.assertTrue(out[0]['url_perfil'].startswith('https://www.al.ce.gov.br/deputados/'))

    def test_layout_change_fails_loudly(self):
        with self.assertRaises(alece.LayoutError):
            alece.parse('<html>página nova sem cards</html>')


if __name__ == '__main__':
    unittest.main()
