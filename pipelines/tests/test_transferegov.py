"""SPEC 01 → T01.04 / ADR-018: adaptador Transferegov. Sem rede; dados DEMO_ fictícios."""
import json
import re
import sys
import tempfile
import unittest
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from rastro import bundle, publicar  # noqa: E402
from rastro import transferegov as tg  # noqa: E402
from rastro.snapshot import read_manifest, sha256_file  # noqa: E402

CONTRACT = tg.load_contract()
COLS = {ep: spec['columns'] for ep, spec in CONTRACT['endpoints'].items()}
CPF_DEMO = '12345678901'
DOC_DEMO = '**.345.678/0001-**'


def rec(endpoint: str, **values) -> dict:
    """Registro com todas as colunas do contrato; as não informadas ficam None."""
    r = {c: None for c in COLS[endpoint]}
    unknown = set(values) - set(r)
    assert not unknown, unknown
    r.update(values)
    return r


def raw_file(directory: Path, endpoint: str, records: list[dict], name: str | None = None) -> Path:
    # Decimal sai como número JSON literal, como na API (ex.: 500000.00000000).
    text = json.dumps({'data': records, 'total_pages': 1, 'total_items': len(records), 'page_number': 1, 'page_size': 200},
                      ensure_ascii=False, separators=(',', ':'), default=lambda o: f'@@{o}@@')
    body = re.sub(r'"@@([-0-9.]+)@@"', lambda m: m.group(1), text).encode('utf-8')
    path = directory / (name or endpoint.replace('/', '_') + '.tsv')
    path.write_bytes(tg._line(tg._page_url(endpoint, 1), body))
    return path


def fake_api(pages: dict[int, list[dict]], total: int | None = None, totals: dict[int, int] | None = None):
    calls = []

    def get(url: str) -> bytes:
        calls.append(url)
        if url.endswith('/data-atualizacao'):
            return b'{"data_ultima_atualizacao":"2026-11-21T00:00:00"}'
        page = int(url.rsplit('pagina=', 1)[1])
        n = (totals or {}).get(page, total if total is not None else sum(len(v) for v in pages.values()))
        return json.dumps({'data': pages[page], 'total_pages': len(pages), 'total_items': n, 'page_number': page, 'page_size': 200}).encode()
    return get, calls


class MoneyAndPrivacyTest(unittest.TestCase):
    def test_cents_exact(self):
        self.assertEqual(tg.cents(Decimal('500000.00000000')), 50_000_000)
        self.assertEqual(tg.cents('481104.0'), 48_110_400)
        self.assertEqual(tg.cents(Decimal('527127.95')), 52_712_795)
        self.assertEqual(tg.cents(0), 0)
        self.assertEqual(tg.cents(Decimal('18969.600000000002')), 1_896_960)  # resíduo de ponto flutuante da fonte

    def test_missing_is_none_not_zero(self):
        self.assertIsNone(tg.cents(None))
        self.assertIsNone(tg.cents(''))

    def test_float_and_extra_decimals_block(self):
        with self.assertRaises(tg.ContractError):
            tg.cents(0.1)
        with self.assertRaises(tg.ContractError):
            tg.cents(Decimal('10.005'))

    def test_recebedor_masking_ac09(self):
        self.assertEqual(tg.recebedor_publico('CPF', 'DEMO_FULANO DE TAL'), (tg.MASKED_PF, True))
        self.assertTrue(tg.recebedor_publico('CNPJ', f'DEMO_FULANO DE TAL {CPF_DEMO}')[1])   # padrão de nome de MEI
        self.assertTrue(tg.recebedor_publico('CNPJ', 'DEMO_JOSE DE SA')[1])                  # sem marca de pessoa jurídica
        self.assertTrue(tg.recebedor_publico('CNPJ', 'DEMO_JOSE DA SILVA SERVICOS ME')[1])   # ME/EPP não basta
        self.assertEqual(tg.recebedor_publico('CNPJ', 'DEMO_CONSTRUTORA EXEMPLO LTDA'), ('DEMO_CONSTRUTORA EXEMPLO LTDA', False))
        self.assertFalse(tg.recebedor_publico('CNPJ', 'DEMO_ASSOCIAÇÃO BENEFICENTE')[1])

    def test_free_text_drops_email_and_cpf(self):
        self.assertEqual(tg._text(' DEMO_contato demo@exemplo.gov.br, CPF 123.456.789-01, código 23137502447 '),
                         'DEMO_contato [e-mail omitido], CPF [CPF omitido], código 23137502447')

    def test_emenda_code_only_12_digits(self):
        self.assertEqual(tg.emenda_code({'numero_emenda_parlamentar_plano_acao': 202039590014}), '202039590014')
        self.assertIsNone(tg.emenda_code({'numero_emenda_parlamentar_plano_acao': 20203959}))
        self.assertIsNone(tg.emenda_code({'numero_emenda_parlamentar_plano_acao': None}))


class RawCopyTest(unittest.TestCase):
    EP = tg.ESPECIAIS['beneficiarios']

    def records(self, *ids):
        return [rec(self.EP, id_beneficiario=i, uf_beneficiario='CE', nome_beneficiario=f'DEMO_MUNICIPIO {i}') for i in ids]

    def test_snapshot_with_sha_and_reuse_ac01(self):
        get, _ = fake_api({1: self.records(1, 2), 2: self.records(3)})
        with tempfile.TemporaryDirectory() as d:
            raw, man = Path(d) / 'raw', Path(d) / 'manifest.jsonl'
            e1 = tg.acquire_table('beneficiarios', get=get, raw_dir=raw, manifest=man)
            e2 = tg.acquire_table('beneficiarios', get=get, raw_dir=raw, manifest=man)
            self.assertFalse(e1['reused'])
            self.assertTrue(e2['reused'])
            self.assertEqual(len(read_manifest(man)), 1)
            self.assertEqual(e1['last_modified'], '2026-11-21T00:00:00')
            path = raw / e1['raw_path']
            self.assertEqual(sha256_file(path), e1['raw_sha256'])
            got = [r['id_beneficiario'] for r in tg.iter_records(path, self.EP, CONTRACT)]
            self.assertEqual(got, [1, 2, 3])

    def test_duplicate_id_between_pages_blocks(self):
        get, _ = fake_api({1: self.records(1, 2), 2: self.records(2)}, total=3)
        with self.assertRaises(ConnectionError):
            list(tg.table_lines(self.EP, 'id_beneficiario', get))

    def test_total_change_blocks(self):
        get, _ = fake_api({1: self.records(1), 2: self.records(2)}, totals={1: 2, 2: 3})
        with self.assertRaises(ConnectionError):
            list(tg.table_lines(self.EP, 'id_beneficiario', get))

    def test_short_count_blocks(self):
        get, _ = fake_api({1: self.records(1)}, total=2)
        with self.assertRaises(ConnectionError):
            list(tg.table_lines(self.EP, 'id_beneficiario', get))

    def test_keyed_query_checks_filter(self):
        ep = tg.ESPECIAIS['executores']
        good = rec(ep, id_executor=5, id_plano_acao=10)
        get = lambda url: json.dumps({'data': [good], 'total_pages': 1, 'total_items': 1}).encode()
        self.assertEqual(len(list(tg.keyed_lines(ep, 'id_plano_acao', ['10'], get))), 1)
        with self.assertRaises(ConnectionError):  # a API ignorou o filtro
            list(tg.keyed_lines(ep, 'id_plano_acao', ['11'], get))

    def test_unknown_column_blocks_ac05(self):
        r = self.records(1)[0]
        r['campo_novo'] = 'x'
        with tempfile.TemporaryDirectory() as d:
            path = raw_file(Path(d), self.EP, [r])
            with self.assertRaises(tg.ContractError):
                list(tg.iter_records(path, self.EP, CONTRACT))


class BuildTest(unittest.TestCase):
    """Duas emendas com ficha: uma especial (plano de ação) e uma com convênio da CGU."""
    CODE_ESP, CODE_CONV, CODE_OUTRA = '202599990001', '202599990002', '202599990003'

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        d = Path(self.tmp.name)
        E = tg.ESPECIAIS
        planos = [
            rec(E['planos_acao'], id_plano_acao=10, codigo_plano_acao='DEMO-0010', ano_plano_acao=2025, situacao_plano_acao='CIENTE',
                numero_emenda_parlamentar_plano_acao=int(self.CODE_ESP), valor_custeio_plano_acao=Decimal('0.0'),
                valor_investimento_plano_acao=Decimal('400000.00'), id_beneficiario=1, categoria_despesa_plano_acao='INVESTIMENTO'),
            # Mesmo beneficiário e mesmo valor, outro código sem ficha: não pode ligar (AC05 da SPEC 04).
            rec(E['planos_acao'], id_plano_acao=11, codigo_plano_acao='DEMO-0011', numero_emenda_parlamentar_plano_acao=int(self.CODE_OUTRA),
                valor_investimento_plano_acao=Decimal('400000.00'), id_beneficiario=1),
        ]
        liq = E['liquidacoes']
        self.files = {
            'planos_acao': raw_file(d, E['planos_acao'], planos),
            'beneficiarios': raw_file(d, E['beneficiarios'], [rec(E['beneficiarios'], id_beneficiario=1, uf_beneficiario='CE', nome_beneficiario='DEMO_MUNICIPIO A')]),
            'executores': raw_file(d, E['executores'], [rec(E['executores'], id_executor=100, id_plano_acao=10, nome_executor='DEMO_MUNICIPIO A',
                                                            objeto_executor='DEMO_Pavimentação', vl_custeio_executor=Decimal('0'), vl_investimento_executor=Decimal('400000'))]),
            'metas': raw_file(d, E['metas'], [rec(E['metas'], id_executor=100, id_meta=1000, sequencial_meta=1, nome_meta='DEMO_Pavimentar',
                                                  un_medida_meta='m²', qt_unidade_meta=Decimal('1500.00'))]),
            'planos_trabalho': raw_file(d, E['planos_trabalho'], [rec(E['planos_trabalho'], id_plano_trabalho=7, id_plano_acao=10, situacao_plano_trabalho='DEMO_Em execução')]),
            'relatorios_gestao': raw_file(d, E['relatorios_gestao'], [
                rec(E['relatorios_gestao'], id_relatorio_gestao_novo=50, id_plano_acao=10, data_e_hora_relatorio_gestao_novo='2025-06-30T10:00:00',
                    tipo_relatorio_gestao_novo='Parcial', valor_executado_relatorio_gestao_novo=Decimal('100000.0'), valor_pendente_relatorio_gestao_novo=None),
                rec(E['relatorios_gestao'], id_relatorio_gestao_novo=51, id_plano_acao=10, data_e_hora_relatorio_gestao_novo='2026-06-30T10:00:00',
                    tipo_relatorio_gestao_novo='Final', valor_executado_relatorio_gestao_novo=Decimal('400000.0'), valor_pendente_relatorio_gestao_novo=Decimal('0'))]),
            'liquidacoes': raw_file(d, liq, [
                rec(liq, id_relatorio_gestao_dl=1, id_relatorio_gestao_novo=50, tp_doc_recebedor_relatorio_gestao_dl='CNPJ',
                    tx_identificacao_recebedor_mascarado_relatorio_gestao_dl=DOC_DEMO, tx_nome_recebedor_relatorio_gestao_dl='DEMO_CONSTRUTORA EXEMPLO LTDA',
                    vl_pagamento_relatorio_gestao_dl=Decimal('100000.0')),
                rec(liq, id_relatorio_gestao_dl=2, id_relatorio_gestao_novo=51, tp_doc_recebedor_relatorio_gestao_dl='CNPJ',
                    tx_identificacao_recebedor_mascarado_relatorio_gestao_dl=DOC_DEMO, tx_nome_recebedor_relatorio_gestao_dl='DEMO_CONSTRUTORA EXEMPLO LTDA',
                    vl_pagamento_relatorio_gestao_dl=Decimal('300000.0')),
                rec(liq, id_relatorio_gestao_dl=3, id_relatorio_gestao_novo=51, tp_doc_recebedor_relatorio_gestao_dl='CPF',
                    tx_identificacao_recebedor_mascarado_relatorio_gestao_dl=CPF_DEMO, tx_nome_recebedor_relatorio_gestao_dl='DEMO_FULANO DE TAL',
                    vl_pagamento_relatorio_gestao_dl=None)]),
        }
        M, P = tg.DISCRICIONARIAS['metas_convenio'][0], tg.DISCRICIONARIAS['propostas'][0]
        self.files['metas_convenio'] = raw_file(d, M, [
            rec(M, id_meta=1, id_proposta=900, nr_meta=1, nr_convenio='900001', desc_meta='DEMO_Construção de praça', qtd_meta=Decimal('1.0'),
                und_fornecimento_meta='UN', vl_meta=Decimal('250000.50')),
            rec(M, id_meta=2, id_proposta=901, nr_meta=1, nr_convenio='900999', desc_meta='DEMO_outro convênio sem ficha')])
        self.files['propostas'] = raw_file(d, P, [rec(P, id_proposta=900, nr_proposta='DEMO-1/2025', modalidade='CONVENIO',
                                                     sit_proposta='DEMO_Proposta/Plano de Trabalho Aprovados', objeto_proposta='DEMO_Praça',
                                                     nm_proponente='DEMO_MUNICIPIO B', natureza_juridica='Administração Pública Municipal',
                                                     vl_global_prop='250000.5', vl_repasse_prop='240000.0', vl_contrapartida_prop='10000.5')])
        self.emendas = {
            self.CODE_ESP: {'code': self.CODE_ESP, 'tipo': 'Emenda Individual - Transferências Especiais', 'convenios': []},
            self.CODE_CONV: {'code': self.CODE_CONV, 'tipo': 'Emenda Individual - Transferências com Finalidade Definida',
                             'convenios': [{'numero': '900001'}, {'numero': '900002'}]},
        }
        entry = {'raw_sha256': 'e' * 64, 'downloaded_at': '2026-11-19T00:00:00+00:00'}
        self.payload = tg.build(self.emendas, self.files, CONTRACT, entry, {})

    def tearDown(self):
        self.tmp.cleanup()

    def test_links_only_by_official_code(self):
        em = self.payload['emendas']
        self.assertEqual(set(em), {self.CODE_ESP, self.CODE_CONV})
        self.assertEqual([p['id'] for p in em[self.CODE_ESP]['planos_acao']], [10])
        self.assertEqual(em[self.CODE_CONV]['planos_acao'], [])

    def test_plan_values_in_cents_and_stages_apart(self):
        p = self.payload['emendas'][self.CODE_ESP]['planos_acao'][0]
        self.assertEqual((p['valor_custeio'], p['valor_investimento']), (0, 40_000_000))
        self.assertEqual(p['relatorio']['id'], 51)  # último relatório, sem somar relatórios
        self.assertEqual(p['relatorio']['valor_executado'], 40_000_000)
        self.assertEqual(p['relatorio']['relatorios'], 2)
        self.assertEqual(p['executores'][0]['metas'][0]['quantidade'], '1500')
        self.assertTrue(tg.execucao_declarada(p))

    def test_suppliers_masked_and_missing_stays_null(self):
        p = self.payload['emendas'][self.CODE_ESP]['planos_acao'][0]
        self.assertEqual(p['documentos_liquidacao'], 3)
        pj, masked = p['fornecedores']
        self.assertEqual((pj['recebedor'], pj['valor'], pj['documentos']), ('DEMO_CONSTRUTORA EXEMPLO LTDA', 40_000_000, 2))
        self.assertTrue(masked['mascarado'])
        self.assertIsNone(masked['valor'])  # valor ausente não vira zero

    def test_no_personal_identifiers_in_export(self):
        text = json.dumps(self.payload, ensure_ascii=False)
        for forbidden in (CPF_DEMO, DOC_DEMO, 'DEMO_FULANO'):
            self.assertNotIn(forbidden, text)

    def test_convenio_chain(self):
        cs = self.payload['emendas'][self.CODE_CONV]['convenios']
        self.assertEqual([c['numero'] for c in cs], ['900001'])
        c = cs[0]
        self.assertEqual((c['id_proposta'], c['valor_global'], c['valor_repasse'], c['valor_contrapartida']), (900, 25_000_050, 24_000_000, 1_000_050))
        self.assertEqual(c['metas'][0]['valor'], 25_000_050)
        self.assertEqual(self.payload['cobertura']['convenios'], {'ligados': 1, 'sem_meta_no_transferegov': 1})

    def test_coverage(self):
        c = self.payload['cobertura']
        self.assertEqual((c['fichas'], c['fichas_transferencia_especial'], c['fichas_com_plano_acao'], c['fichas_com_execucao_declarada'],
                          c['fichas_com_convenio_cgu'], c['fichas_com_convenio_transferegov']), (2, 1, 1, 1, 1, 1))

    def test_draft_report_is_not_declared_execution(self):
        E = tg.ESPECIAIS
        self.files['relatorios_gestao'] = raw_file(Path(self.tmp.name), E['relatorios_gestao'], [
            rec(E['relatorios_gestao'], id_relatorio_gestao_novo=50, id_plano_acao=10, data_e_hora_relatorio_gestao_novo='2025-06-30T10:00:00',
                situacao_relatorio_gestao_novo='Disponibilizado', valor_executado_relatorio_gestao_novo=Decimal('100000.0')),
            rec(E['relatorios_gestao'], id_relatorio_gestao_novo=51, id_plano_acao=10, data_e_hora_relatorio_gestao_novo='2026-06-30T10:00:00',
                situacao_relatorio_gestao_novo='Em elaboração', valor_executado_relatorio_gestao_novo=Decimal('400000.0'))], name='rel_draft.tsv')
        p = tg.build(self.emendas, self.files, CONTRACT, {'raw_sha256': 'e' * 64, 'downloaded_at': 'x'}, {})['emendas'][self.CODE_ESP]['planos_acao'][0]
        self.assertEqual((p['relatorio']['id'], p['relatorio']['valor_executado'], p['relatorio']['em_elaboracao']), (50, 10_000_000, 1))
        self.assertEqual(p['documentos_liquidacao'], 1)

    def test_deterministic_ac02(self):
        again = tg.build(self.emendas, self.files, CONTRACT, {'raw_sha256': 'e' * 64, 'downloaded_at': '2026-11-19T00:00:00+00:00'}, {})
        self.assertEqual(json.dumps(again, sort_keys=True), json.dumps(self.payload, sort_keys=True))


class BundleOptionalTest(unittest.TestCase):
    """ADR-018: o export do Transferegov é parte opcional do pacote, validada quando presente."""
    def write_exports(self, root: Path, entry: dict):
        fields = {'ce-municipios': {'municipalities': [], 'non_municipal': [], 'years': [2025]}, 'autores': {'authors': [], 'collective': [], 'years': [2025]},
                  'emendas': {'emendas': {'DEMO_1': {'code': 'DEMO_1', 'documentos': [], 'quem_recebeu': [], 'convenios': [], 'conciliacao': {'status': 'confere'}}}},
                  'municipios': {'municipios': {}}}
        for prefix in bundle.PREFIXES:
            (root / f'{prefix}-2026-11-19-x.json').write_text(json.dumps({'kind': 'VALIDACAO', 'snapshot': entry, 'document_sources': {'DEMO': 'h'}, **fields[prefix]}))

    def test_without_part_keeps_identity_and_with_part_validates(self):
        with tempfile.TemporaryDirectory() as d:
            root, entry = Path(d), {'raw_sha256': 'x', 'downloaded_at': '2026-11-19'}
            self.write_exports(root, entry)
            base = bundle.publish(entry, root)
            self.assertNotIn('transferegov', json.loads((root / 'active-bundle.json').read_text())['files'])
            tgf = root / 'transferegov-2026-11-19-x.json'
            tgf.write_text(json.dumps({'kind': 'VALIDACAO', 'snapshot': entry, 'emendas': {'DEMO_1': {'planos_acao': [{'valor_investimento': 100}], 'convenios': []}}}))
            with_part = bundle.publish(entry, root)
            self.assertNotEqual(base, with_part)
            self.assertIn('transferegov', json.loads((root / 'active-bundle.json').read_text())['files'])
            pointer = (root / 'active-bundle.json').read_bytes()
            for bad in ({'DEMO_2': {'planos_acao': [], 'convenios': []}}, {'DEMO_1': {'planos_acao': [{'valor_investimento': 1.5}], 'convenios': []}}):
                tgf.write_text(json.dumps({'kind': 'VALIDACAO', 'snapshot': entry, 'emendas': bad}))
                with self.assertRaises(ValueError):
                    bundle.publish(entry, root)
                self.assertEqual((root / 'active-bundle.json').read_bytes(), pointer)

    def test_freeze_copies_optional_part(self):
        with tempfile.TemporaryDirectory() as d:
            root, entry = Path(d) / 'val', {'raw_sha256': 'x', 'downloaded_at': '2026-11-19'}
            root.mkdir()
            self.write_exports(root, entry)
            (root / 'transferegov-2026-11-19-x.json').write_text(json.dumps({'kind': 'VALIDACAO', 'snapshot': entry, 'emendas': {}}))
            ident = bundle.publish(entry, root)
            self.assertEqual(publicar.freeze(root, Path(d) / 'pub'), ident)
            self.assertTrue((Path(d) / 'pub' / 'bundles' / ident / 'transferegov.json').exists())


if __name__ == '__main__':
    unittest.main()
