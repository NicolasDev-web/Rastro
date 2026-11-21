"""Testes das emendas estaduais do Ceará (SPEC 07). Sem rede: CSV sintético com prefixo DEMO_ (Constituição, regra 15).

Os nomes de municípios são do IBGE (referência pública). Parlamentares e ações são fictícios (DEMO_).
"""
import csv
import hashlib
import io
import json
import re
import sys
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from rastro import ce_estaduais as ce  # noqa: E402
from rastro import snapshot  # noqa: E402

CONTRACT = ce.load_contract()
SENT = CONTRACT['null_sentinels']

MUNICIPIOS = [
    {'id': 2313302, 'nome': 'Tamboril'}, {'id': 2304285, 'nome': 'Eusébio'}, {'id': 2310506, 'nome': 'Pentecoste'},
    {'id': 2304707, 'nome': 'Granja'}, {'id': 2304806, 'nome': 'Granjeiro'}, {'id': 2300101, 'nome': 'Abaiara'},
    {'id': 2300150, 'nome': 'Acarape'}, {'id': 2300200, 'nome': 'Acaraú'}, {'id': 2312106, 'nome': 'Santana do Acaraú'},
    {'id': 2313203, 'nome': 'Tabuleiro do Norte'}, {'id': 2311801, 'nome': 'Russas'}, {'id': 2309300, 'nome': 'Nova Russas'},
    {'id': 2302107, 'nome': 'Bela Cruz'}, {'id': 2304236, 'nome': 'Cruz'}, {'id': 2311306, 'nome': 'Quixadá'},
    {'id': 2311405, 'nome': 'Quixelô'}, {'id': 2304400, 'nome': 'Fortaleza'}, {'id': 2307650, 'nome': 'Maracanaú'},
]
IDX = ce.municipio_index(MUNICIPIOS)
DEPUTIES = [
    {'slug': 'demo-ana', 'nome': 'DEMO_Ána Souza', 'url_perfil': 'https://example.invalid/demo-ana'},
    {'slug': 'demo-ap', 'nome': 'DEMO_Ap Luiz', 'url_perfil': None},
    {'slug': 'demo-x1', 'nome': 'DEMO_Repetido', 'url_perfil': None},
    {'slug': 'demo-x2', 'nome': 'DEMO_REPETIDO', 'url_perfil': None},
]


def row(**over):
    base = {c: 'DEMO' for c in CONTRACT['columns']}
    base.update({'Exercício': '2025', 'Código da emenda': '8', 'Parlamentar': 'DEMO_ANA SOUZA', 'Executivo': 'NÃO', 'Caráter': 'PCF',
                 'Tipo': 'INDIVIDUAL', 'Função': 'SAÚDE', 'Ação': 'DEMO_Apoio financeiro para ações de saúde no Município de Tamboril',
                 'Região': 'SERTÃO DOS CRATEÚS', 'Valor emenda': '350000', 'Valor lei': '350000', 'Valor lei créditos': '350000'})
    base.update(over)
    return base


def build_csv(rows, columns=None, encoding='iso-8859-1') -> bytes:
    cols = columns or CONTRACT['columns']
    s = io.StringIO()
    w = csv.writer(s, delimiter=';', quoting=csv.QUOTE_NONNUMERIC, lineterminator='\n')
    w.writerow(cols)
    for r in rows:
        w.writerow([r.get(c, '') for c in cols])
    return s.getvalue().encode(encoding)


def year_rows(year):
    return [row(**{'Exercício': str(year), 'Código da emenda': '8'}),
            row(**{'Exercício': str(year), 'Código da emenda': '11', 'Parlamentar': 'DEMO_DESCONHECIDO',
                   'Ação': 'DEMO_Contribuição para melhoria da atenção básica', 'Valor emenda': '0', 'Valor lei': '0', 'Valor lei créditos': '1000000'})]


class Parsing(unittest.TestCase):
    def test_iso_8859_1_e_acentos(self):
        rows = ce.parse(build_csv([row()]), 2025, CONTRACT)
        self.assertEqual(rows[0]['acao'], 'DEMO_Apoio financeiro para ações de saúde no Município de Tamboril')
        self.assertEqual(rows[0]['regiao'], 'SERTÃO DOS CRATEÚS')
        self.assertEqual(rows[0]['ano'], 2025)
        self.assertEqual(rows[0]['id'], '2025-0008')

    def test_utf8_bloqueia(self):
        with self.assertRaisesRegex(ce.ContractError, 'UTF-8'):
            ce.parse(build_csv([row()], encoding='utf-8'), 2025, CONTRACT)

    def test_bom_bloqueia(self):
        with self.assertRaisesRegex(ce.ContractError, 'BOM'):
            ce.parse(b'\xef\xbb\xbf' + build_csv([row()]), 2025, CONTRACT)

    def test_bytes_windows_1252_bloqueiam(self):
        raw = build_csv([row(**{'Ação': 'DEMO_aspas'})]).replace(b'DEMO_aspas', b'DEMO_\x93aspas\x94')
        with self.assertRaisesRegex(ce.ContractError, '0x80'):
            ce.parse(raw, 2025, CONTRACT)

    def test_coluna_nova_bloqueia(self):
        with self.assertRaisesRegex(ce.ContractError, 'desconhecida'):
            ce.parse(build_csv([row()], columns=CONTRACT['columns'] + ['DEMO_NOVA']), 2025, CONTRACT)

    def test_ordem_trocada_bloqueia(self):
        cols = list(CONTRACT['columns'])
        cols[0], cols[1] = cols[1], cols[0]
        with self.assertRaisesRegex(ce.ContractError, 'ordem'):
            ce.parse(build_csv([row()], columns=cols), 2025, CONTRACT)

    def test_exercicio_diferente_do_arquivo_bloqueia(self):
        with self.assertRaisesRegex(ce.ContractError, 'Exercício'):
            ce.parse(build_csv([row(**{'Exercício': '2024'})]), 2025, CONTRACT)

    def test_codigo_repetido_bloqueia(self):
        with self.assertRaisesRegex(ce.ContractError, 'repetido'):
            ce.parse(build_csv([row(), row()]), 2025, CONTRACT)

    def test_cpf_bloqueia(self):
        with self.assertRaisesRegex(ce.ContractError, 'CPF'):
            ce.parse(build_csv([row(**{'Ação': 'DEMO_repasse a 123.456.789-09'})]), 2025, CONTRACT)

    def test_centavos(self):
        self.assertEqual(ce.cents('300000', SENT), 30_000_000)
        self.assertEqual(ce.cents('300.000,00', SENT), 30_000_000)
        self.assertEqual(ce.cents('1234,5', SENT), 123_450)
        self.assertEqual(ce.cents('0', SENT), 0)
        self.assertEqual(ce.cents('-10', SENT), -1000)
        for bad in ('12.5', '1,234', 'R$ 10', '10,000'):
            with self.assertRaises(ce.ContractError):
                ce.cents(bad, SENT)

    def test_sem_informacao_vira_null(self):
        for s in ('', '  ', 'Sem informação', 'SEM INFORMAÇÃO', 'S/I', '-'):
            self.assertIsNone(ce.cents(s, SENT))
            self.assertIsNone(ce.clean(s, SENT))
        rows = ce.parse(build_csv([row(**{'Parlamentar': 'Sem informação', 'Valor lei': 'Sem informação'})]), 2025, CONTRACT)
        self.assertIsNone(rows[0]['parlamentar'])
        self.assertIsNone(rows[0]['valor_lei'])
        self.assertEqual(rows[0]['valor_emenda'], 35_000_000)


class Municipio(unittest.TestCase):
    def link(self, text):
        return ce.link_municipio(text, IDX)

    def test_ancora_municipio(self):
        for text, code in [('Apoio à saúde no Município de Tamboril', '2313302'), ('ações para o município do Eusébio', '2304285'),
                           ('Ambulância para o município / Pentecoste', '2310506'), ('Saúde do Município de Granja/CE.', '2304707'),
                           ('Livros escolares - Municipio de Quixelo', '2311405'), ('municipio Abaiara', '2300101')]:
            m = self.link(text)
            self.assertEqual((m['situacao'], m['ibge'], m['regra']), ('ligada', code, ce.RULE_ANCHOR), text)

    def test_nome_no_fim(self):
        for text, code in [('Pavimentação em pedra tosca em Quixadá', '2311306'), ('Cirurgias oftalmológicas/Quixadá', '2311306'),
                           ('Custeio da Saúde / Tamboril', '2313302'), ('Grupo de estudos - GEEON - Fortaleza', '2304400'),
                           ('Hospital municipal de Tamboril', '2313302')]:
            m = self.link(text)
            self.assertEqual((m['situacao'], m['ibge'], m['regra']), ('ligada', code, ce.RULE_FINAL), text)

    def test_nome_maior_prevalece(self):
        self.assertEqual(self.link('Saúde no município de Nova Russas')['ibge'], '2309300')
        self.assertEqual(self.link('Saúde em Bela Cruz')['ibge'], '2302107')
        self.assertEqual(self.link('Ambulância no município de Granjeiro')['ibge'], '2304806')

    def test_nome_parcial_nao_liga(self):
        m = self.link('Ambulância para o município de Tabuleiro')
        self.assertEqual((m['situacao'], m['ibge']), ('nao_resolvida', None))
        m = self.link('Ambulância para o Município de Santana de Acaraú')  # IBGE: "Santana do Acaraú"; não pode virar "Acaraú"
        self.assertEqual((m['situacao'], m['ibge']), ('nao_resolvida', None))

    def test_dois_municipios_ambiguo(self):
        m = self.link('Estrada entre o município de Russas e o município de Tamboril')
        self.assertEqual((m['situacao'], m['ibge']), ('ambigua', None))
        m = self.link('Estrada de Russas a Tamboril')
        self.assertEqual((m['situacao'], m['ibge']), ('ambigua', None))

    def test_sem_municipio(self):
        for text in ('Contribuição para melhoria da atenção básica', 'Associação Médica de Pajuçara - ABEMP', None, ''):
            m = self.link(text)
            self.assertEqual((m['situacao'], m['ibge']), ('sem_municipio', None))

    def test_nome_fora_da_posicao_nao_liga(self):
        m = self.link('Quixadá: reforma de praças')
        self.assertEqual((m['situacao'], m['ibge']), ('nao_resolvida', None))

    def test_nome_repetido_no_ibge_bloqueia(self):
        with self.assertRaises(ce.ContractError):
            ce.municipio_index([{'id': 1, 'nome': 'Cruz'}, {'id': 2, 'nome': 'CRUZ'}])


class Deputado(unittest.TestCase):
    idx = ce.deputado_index(DEPUTIES)

    def test_nome_exato_normalizado(self):
        d = ce.link_deputado('DEMO_ANA SOUZA', self.idx)
        self.assertEqual((d['situacao'], d['slug']), ('ligada', 'demo-ana'))

    def test_nome_aproximado_nao_liga(self):
        for nome in ('DEMO_APÓSTOLO LUIZ', 'DEMO_ANA SOUZA FILHA', 'DEMO_ANA'):
            d = ce.link_deputado(nome, self.idx)
            self.assertEqual((d['situacao'], d['slug']), ('nao_encontrado', None), nome)

    def test_homonimo_ambiguo(self):
        d = ce.link_deputado('DEMO_Repetido', self.idx)
        self.assertEqual((d['situacao'], d['slug']), ('ambigua', None))

    def test_sem_nome(self):
        self.assertEqual(ce.link_deputado(None, self.idx)['situacao'], 'sem_nome')


class Fetch:
    def __init__(self, files):
        self.files, self.calls = files, 0

    def __call__(self, url):
        self.calls += 1
        return snapshot.Response(io.BytesIO(self.files[url]), url, {'last-modified': 'Fri, 02 Oct 2026 12:33:14 GMT'})


def references():
    entry = {'source_url': 'DEMO', 'raw_sha256': 'a' * 64, 'downloaded_at': '2026-11-19T00:00:00+00:00', 'last_modified': None, 'bytes': 1, 'raw_path': 'DEMO'}
    return entry, MUNICIPIOS, {**entry, 'raw_sha256': 'b' * 64}, DEPUTIES


class Pipeline(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        base = Path(self.tmp.name)
        self.dirs = dict(raw_dir=base / 'raw', manifest=base / 'manifest.jsonl', out_dir=base / 'estaduais', reports_dir=base / 'reports')
        files = {ce.source(y, CONTRACT).url: build_csv(year_rows(y)) for y in CONTRACT['years']}
        files[CONTRACT['dictionary_url']] = b'%PDF-1.7 DEMO'
        self.fetch = Fetch(files)
        self.now = lambda: datetime(2026, 11, 21, tzinfo=timezone.utc)

    def tearDown(self):
        for p in Path(self.tmp.name).rglob('*'):
            if p.is_file():
                p.chmod(0o666)
        self.tmp.cleanup()

    def run_once(self):
        return ce.execute(**self.dirs, fetch=self.fetch, references=references(), now=self.now)

    def test_idempotencia(self):
        a = self.run_once()
        bytes_a = a['path'].read_bytes()
        b = self.run_once()
        self.assertEqual(a['path'], b['path'])
        self.assertEqual(bytes_a, b['path'].read_bytes())
        self.assertEqual(a['sha256'], b['sha256'])
        manifest = snapshot.read_manifest(self.dirs['manifest'])
        self.assertEqual(len(manifest), len(CONTRACT['years']) + 1)  # 4 CSVs + dicionário, sem duplicar
        self.assertTrue(all(e['reused'] for e in b['entries'].values()))
        pointer = json.loads((self.dirs['out_dir'] / ce.POINTER).read_text(encoding='utf-8'))
        self.assertEqual(pointer['arquivo'], a['path'].name)
        self.assertEqual(pointer['sha256'], hashlib.sha256(bytes_a).hexdigest())
        raws = list((self.dirs['raw_dir'] / 'ce_transparente' / 'emendas').glob('2026-11-21_*_emendas_parlamentares_*.csv'))
        self.assertEqual(len(raws), len(CONTRACT['years']))

    def test_conteudo_do_export(self):
        p = self.run_once()['payload']
        self.assertEqual((p['kind'], p['esfera']), (ce.KIND, 'estadual'))
        c = p['cobertura']['2025']
        self.assertEqual((c['linhas'], c['parlamentares_distintos'], c['parlamentares_ligados']), (2, 2, 1))
        self.assertEqual((c['linhas_municipio_ligado'], c['linhas_sem_municipio']), (1, 1))
        self.assertIsNone(c['beneficiarios'])
        # cada coluna somada separadamente; zero do arquivo continua zero
        self.assertEqual(c['valores']['valor_emenda'], {'total': 35_000_000, 'linhas_com_valor': 2, 'linhas_nulas': 0, 'linhas_zero': 1})
        self.assertEqual(c['valores']['valor_lei_creditos']['total'], 135_000_000)
        text = ce.dumps(p).decode('utf-8')
        self.assertNotRegex(text, r'\d{3}\.\d{3}\.\d{3}-\d{2}')
        for forbidden in ('pago', 'empenhado', 'liquidado', 'ranking'):
            self.assertNotIn(f'"{forbidden}"', text)
        self.assertTrue(all(isinstance(e[k], int) or e[k] is None for e in p['emendas'] for k in ce.VALUE_KEYS))
        report = self.run_once()['report'].read_text(encoding='utf-8')
        self.assertIn('DEMO_DESCONHECIDO', report)
        self.assertIn('sem_municipio', report)

    def test_total_com_ausencia_fica_indisponivel(self):
        rows = [{'valor_emenda': 100, 'valor_lei': None, 'valor_lei_creditos': 0}, {'valor_emenda': 200, 'valor_lei': 5, 'valor_lei_creditos': 0}]
        self.assertEqual(ce._value_stats(rows, 'valor_emenda')['total'], 300)
        self.assertIsNone(ce._value_stats(rows, 'valor_lei')['total'])
        self.assertEqual(ce._value_stats(rows, 'valor_lei_creditos')['total'], 0)

    def test_bloqueio_de_rede_para_sem_contornar(self):
        def blocked(url):
            raise snapshot.urllib.error.URLError('403 Forbidden')
        snapshot_sleep = snapshot.time.sleep
        snapshot.time.sleep = lambda s: None
        try:
            with self.assertRaises(RuntimeError):
                ce.execute(**self.dirs, fetch=blocked, references=references(), now=self.now)
        finally:
            snapshot.time.sleep = snapshot_sleep
        self.assertFalse((self.dirs['out_dir'] / ce.POINTER).exists())

    def test_arquivo_fora_do_contrato_nao_gera_export(self):
        bad = build_csv(year_rows(2024), columns=CONTRACT['columns'] + ['DEMO_NOVA'])
        self.fetch.files[ce.source(2024, CONTRACT).url] = bad
        with self.assertRaises(ce.ContractError):
            self.run_once()
        self.assertFalse((self.dirs['out_dir'] / ce.POINTER).exists())


if __name__ == '__main__':
    unittest.main()
