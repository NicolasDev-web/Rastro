"""Adaptador Transferegov.br (SPEC 01 → T01.04; ADR-018). Somente biblioteca padrão.

Fonte: API pública https://api-publica.transferegov.gestao.gov.br (inventário de 21/11/2026).

- Transferências especiais ("emendas Pix"): tabelas completas, paginadas, guardadas como cópia bruta.
  Ligação com a emenda: `numero_emenda_parlamentar_plano_acao` = código de 12 dígitos da CGU.
- Convênios e contratos de repasse (módulo discricionárias): consulta por chave. A chave vem do arquivo
  de convênios da CGU (código da emenda → número do convênio); `meta-crono-fisico?nr_convenio=` dá o
  `id_proposta`, e `propostas?id_proposta=` dá objeto, situação e valores.

Cópia bruta: um arquivo por endpoint, uma linha por resposta HTTP no formato `<URL>\\t<corpo JSON recebido>`,
com SHA-256 no manifesto (snapshot.acquire). Dinheiro em centavos inteiros; ausente é None. Nada é ligado
por nome, valor ou data. Pessoa física e recebedor sem natureza de pessoa jurídica confirmada saem mascarados.
"""
from __future__ import annotations

import json
import re
import time
import urllib.error
import urllib.request
from collections import defaultdict
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Callable, Iterable, Iterator

from . import CONTRACTS_DIR, VALIDATION_DIR
from .cgu import MASKED_PF, normalize_name
from .money import total
from .snapshot import USER_AGENT, Response, Source, acquire, latest, verify

API = 'https://api-publica.transferegov.gestao.gov.br'
PAGE_SIZE = 200
LICENSE = ('Dados abertos do Transferegov.br (Ministério da Gestão e da Inovação em Serviços Públicos), API pública. '
           'O OpenAPI não declara licença (consultado 2026-11-21).')

# Endpoints do módulo de transferências especiais (nome curto → endpoint).
ESPECIAIS = {
    'planos_acao': 'especiais/planos-acao-especiais',
    'beneficiarios': 'especiais/beneficiarios-especiais',
    'executores': 'especiais/executores-especiais',
    'metas': 'especiais/meta-especiais',
    'planos_trabalho': 'especiais/planos-trabalho-especiais',
    'relatorios_gestao': 'especiais/relatorios-gestao-novos-especiais',
    'liquidacoes': 'especiais/relatorios-gestao-documento-liquidacao-especiais',
}
# Copiadas inteiras. As demais vêm por chave: a paginação da API não tem ordem estável (em 21/11/2026 um
# mesmo id_executor apareceu em duas páginas da tabela completa), e a consulta filtrada cabe numa página.
TABELAS_COMPLETAS = ('planos_acao', 'beneficiarios', 'relatorios_gestao')
POR_CHAVE_ESPECIAIS = {'executores': 'id_plano_acao', 'planos_trabalho': 'id_plano_acao', 'metas': 'id_executor',
                       'liquidacoes': 'id_relatorio_gestao_novo'}
# Consultas por chave do módulo de discricionárias (nome curto → endpoint, parâmetro).
DISCRICIONARIAS = {
    'metas_convenio': ('discricionarias/meta-crono-fisico', 'nr_convenio'),
    'propostas': ('discricionarias/propostas', 'id_proposta'),
}
OPENAPI = {'especiais': f'{API}/especiais/openapi.json', 'discricionarias': f'{API}/discricionarias/openapi.json'}

MASKED_RECEBEDOR = '[recebedor não exibido — pessoa física, MEI ou natureza jurídica não confirmada]'
# Marcas de pessoa jurídica que um empresário individual ou MEI não usa. Lista fechada e conservadora:
# o que não tiver uma delas fica mascarado (AC09 da SPEC 01). Não é ligação entre registros.
_PJ_MARKERS = re.compile(r'\b(LTDA|EIRELI|SLU|COOPERATIVA|ASSOCIACAO|FUNDACAO|INSTITUTO|CONSORCIO|MUNICIPIO|PREFEITURA|'
                         r'FUNDO MUNICIPAL|FUNDO ESTADUAL|SECRETARIA|CAMARA MUNICIPAL|ESTADO DO|UNIVERSIDADE|SINDICATO|'
                         r'FEDERACAO|CONFEDERACAO|IGREJA|SOCIEDADE|COMPANHIA|CIA|BANCO|CAIXA ECONOMICA|EMPRESA BRASILEIRA)\b')
_CPF_LIKE = re.compile(r'\d{3}\.?\d{3}\.?\d{3}-?\d{2}')


class ContractError(Exception):
    """Resposta diverge do contrato verificado: a carga é bloqueada (AC05)."""


# ---------------------------------------------------------------- rede e cópia bruta

def http_get(url: str, retries: int = 4, pause: float = 0.05) -> bytes:
    """GET com novas tentativas por requisição. Falha persistente vira ConnectionError (acquire refaz tudo)."""
    last: Exception | None = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT, 'Accept': 'application/json'})
            with urllib.request.urlopen(req, timeout=120) as resp:
                body = resp.read()
            time.sleep(pause)
            return body
        except (urllib.error.URLError, TimeoutError, ConnectionError) as exc:
            last = exc
            time.sleep(2 ** attempt)
    raise ConnectionError(f'Falha ao consultar {url}: {last}')


class _Stream:
    """Fluxo de bytes montado sob demanda a partir de um gerador (interface usada por snapshot.acquire)."""
    def __init__(self, chunks: Iterable[bytes]):
        self._it, self._buf = iter(chunks), b''

    def read(self, n: int = -1) -> bytes:
        while n < 0 or len(self._buf) < n:
            try:
                self._buf += next(self._it)
            except StopIteration:
                break
        if n < 0:
            out, self._buf = self._buf, b''
        else:
            out, self._buf = self._buf[:n], self._buf[n:]
        return out


def _line(url: str, body: bytes) -> bytes:
    if b'\n' in body or b'\r' in body:
        raise ConnectionError(f'Resposta com quebra de linha não prevista: {url}')
    return url.encode('ascii') + b'\t' + body + b'\n'


def _page_url(endpoint: str, page: int, extra: str = '') -> str:
    return f'{API}/{endpoint}?{extra}tamanho_da_pagina={PAGE_SIZE}&pagina={page}'


def table_lines(endpoint: str, key: str, get: Callable[[str], bytes] = http_get) -> Iterator[bytes]:
    """Todas as páginas de uma tabela. Paginação inconsistente (total muda, id repetido, contagem diferente) aborta."""
    first = get(_page_url(endpoint, 1))
    d = json.loads(first)
    pages, items = d['total_pages'], d['total_items']
    seen: set = set()
    for page in range(1, pages + 1):
        url = _page_url(endpoint, page)
        body = first if page == 1 else get(url)
        d = json.loads(body)
        if d['total_items'] != items:
            raise ConnectionError(f'{endpoint}: total mudou durante a paginação ({items} → {d["total_items"]})')
        for r in d['data']:
            if r[key] in seen:
                raise ConnectionError(f'{endpoint}: {key}={r[key]} repetido entre páginas')
            seen.add(r[key])
        yield _line(url, body)
    if len(seen) != items:
        raise ConnectionError(f'{endpoint}: {len(seen)} registros lidos, a API informa {items}')


def keyed_lines(endpoint: str, param: str, keys: Iterable[str], get: Callable[[str], bytes] = http_get) -> Iterator[bytes]:
    """Uma consulta por chave (ordem fixa), com todas as páginas de cada uma."""
    for k in keys:
        page, pages = 1, 1
        while page <= pages:
            url = _page_url(endpoint, page, f'{param}={k}&')
            body = get(url)
            d = json.loads(body)
            if any(str(r.get(param)) != str(k) for r in d['data']):
                raise ConnectionError(f'{endpoint}: filtro {param}={k} devolveu registro de outra chave')
            pages = d['total_pages'] or 1
            yield _line(url, body)
            page += 1


def _source(name: str, endpoint: str, filename: str) -> Source:
    module = endpoint.split('/')[0]
    return Source(source_id=f'transferegov_{name}', url=f'{API}/{endpoint}', subdir=f'transferegov/{module}',
                  filename=filename, dictionary_version=f'{OPENAPI[module]} (contrato pipelines/contracts/transferegov.json, verificado 2026-11-21)',
                  license_or_terms=LICENSE)


def _updated_at(module: str, get: Callable[[str], bytes]) -> str | None:
    try:
        return json.loads(get(f'{API}/{module}/data-atualizacao')).get('data_ultima_atualizacao')
    except (ConnectionError, ValueError):
        return None


def acquire_table(name: str, *, get: Callable[[str], bytes] = http_get, **kw) -> dict:
    endpoint = ESPECIAIS[name]
    key = load_contract()['endpoints'][endpoint]['key']
    updated = _updated_at(endpoint.split('/')[0], get)
    return acquire(_source(name, endpoint, f'{endpoint.split("/")[1]}.tsv'),
                   fetch=lambda url: Response(_Stream(table_lines(endpoint, key, get)), url, {'last-modified': updated}), **kw)


def keyed_endpoint(name: str) -> tuple[str, str]:
    return (ESPECIAIS[name], POR_CHAVE_ESPECIAIS[name]) if name in POR_CHAVE_ESPECIAIS else DISCRICIONARIAS[name]


def acquire_keyed(name: str, keys: list[str], *, get: Callable[[str], bytes] = http_get, **kw) -> dict:
    endpoint, param = keyed_endpoint(name)
    updated = _updated_at(endpoint.split('/')[0], get)
    return acquire(_source(name, endpoint, f'{endpoint.split("/")[1]}_por_{param}.tsv'),
                   fetch=lambda url: Response(_Stream(keyed_lines(endpoint, param, keys, get)), url, {'last-modified': updated}), **kw)


def acquire_openapi(module: str, **kw) -> dict:
    src = Source(source_id=f'transferegov_openapi_{module}', url=OPENAPI[module], subdir=f'transferegov/{module}',
                 filename='openapi.json', dictionary_version='OpenAPI 3.1 do próprio módulo', license_or_terms=LICENSE)
    return acquire(src, **kw)


# ---------------------------------------------------------------- leitura validada

def load_contract(path: Path | None = None) -> dict:
    return json.loads((path or CONTRACTS_DIR / 'transferegov.json').read_text(encoding='utf-8'))


def iter_records(path: Path, endpoint: str, contract: dict) -> Iterator[dict]:
    """Registros da cópia bruta, conferidos contra o contrato. Decimais exatos (Decimal), nunca float."""
    expected = set(contract['endpoints'][endpoint]['columns'])
    with path.open('rb') as fh:
        for n, raw in enumerate(fh, 1):
            url, sep, body = raw.rstrip(b'\n').partition(b'\t')
            if not sep or not url.startswith(f'{API}/{endpoint}?'.encode()):
                raise ContractError(f'{path.name}: linha {n} fora do formato <URL>\\t<JSON> do endpoint {endpoint}')
            d = json.loads(body, parse_float=Decimal)
            if not isinstance(d.get('data'), list):
                raise ContractError(f'{path.name}: linha {n} sem lista "data"')
            for r in d['data']:
                keys = set(r)
                if keys != expected:
                    raise ContractError(f'{endpoint}: colunas desconhecidas {sorted(keys - expected)} / ausentes {sorted(expected - keys)}')
                yield r


def cents(value) -> int | None:
    """500000.0 / '481104.0' / 527127.95 → centavos. None → None (ausente não é zero).

    A API serializa alguns valores com resíduo de ponto flutuante (ex.: 18969.600000000002). Só esse resíduo,
    menor que um milionésimo de real, é arredondado ao centavo; qualquer fração maior bloqueia (nada é adivinhado).
    """
    if value is None or value == '':
        return None
    if isinstance(value, float):
        raise ContractError('Valor monetário lido como float: use Decimal')
    try:
        d = Decimal(str(value)) * 100
    except InvalidOperation as exc:
        raise ContractError(f'Valor monetário fora do formato: {value!r}') from exc
    r = d.to_integral_value()
    if abs(d - r) >= Decimal('0.0001'):
        raise ContractError(f'Valor monetário com fração de centavo: {value!r}')
    return int(r)


def quantity(value) -> str | None:
    if value is None:
        return None
    d = Decimal(str(value))
    return format(d.normalize(), 'f') if d == d.to_integral_value() else format(d, 'f').rstrip('0')


_EMAIL = re.compile(r'[\w.+-]+@[\w-]+(\.[\w-]+)+')
_CPF_FORMATADO = re.compile(r'\b\d{3}\.\d{3}\.\d{3}-\d{2}\b')


def _text(v) -> str | None:
    """Texto livre da fonte. E-mail e número com formato de CPF citados no texto saem omitidos."""
    if v is None:
        return None
    v = _CPF_FORMATADO.sub('[CPF omitido]', _EMAIL.sub('[e-mail omitido]', str(v))).strip()
    return v or None


def recebedor_publico(tp_doc: str | None, nome: str | None) -> tuple[str, bool]:
    """(nome a exibir, mascarado?). Só CNPJ com marca de pessoa jurídica fechada aparece pelo nome."""
    nome = _text(nome)
    if not nome or (tp_doc or '').upper() != 'CNPJ':
        return (MASKED_PF if (tp_doc or '').upper() == 'CPF' else MASKED_RECEBEDOR), True
    if _CPF_LIKE.search(nome) or not _PJ_MARKERS.search(normalize_name(nome)):
        return MASKED_RECEBEDOR, True
    return nome, False


def emenda_code(r: dict) -> str | None:
    """Código oficial de 12 dígitos do plano de ação; outro formato não liga (nada é completado)."""
    n = r.get('numero_emenda_parlamentar_plano_acao')
    s = str(n) if n is not None else ''
    return s if s.isdigit() and len(s) == 12 else None


# ---------------------------------------------------------------- ligação e export

def _url(endpoint: str, param: str, value) -> str:
    return f'{API}/{endpoint}?{param}={value}'


def _latest_by(rows: list[dict], *keys: str) -> dict | None:
    return max(rows, key=lambda r: tuple(str(r.get(k) or '') for k in keys)) if rows else None


def build_especiais(codes: set[str], files: dict[str, Path], contract: dict) -> tuple[dict[str, list], dict]:
    """Planos de ação cujo número de emenda é um código com ficha. Demais tabelas, pelos ids da própria API."""
    def rec(name: str) -> Iterator[dict]:
        return iter_records(files[name], ESPECIAIS[name], contract)

    planos = [r for r in rec('planos_acao') if emenda_code(r) in codes]
    pids = {r['id_plano_acao'] for r in planos}
    bids = {r['id_beneficiario'] for r in planos}
    benef = {r['id_beneficiario']: r for r in rec('beneficiarios') if r['id_beneficiario'] in bids}
    execs, pts, rels = defaultdict(list), defaultdict(list), defaultdict(list)
    for r in rec('executores'):
        if r['id_plano_acao'] in pids:
            execs[r['id_plano_acao']].append(r)
    eids = {e['id_executor'] for es in execs.values() for e in es}
    metas = defaultdict(list)
    for r in rec('metas'):
        if r['id_executor'] in eids:
            metas[r['id_executor']].append(r)
    for r in rec('planos_trabalho'):
        if r['id_plano_acao'] in pids:
            pts[r['id_plano_acao']].append(r)
    for r in rec('relatorios_gestao'):
        if r['id_plano_acao'] in pids:
            rels[r['id_plano_acao']].append(r)
    rids = {r['id_relatorio_gestao_novo'] for rs in rels.values() for r in rs}
    liqs = defaultdict(list)
    for r in rec('liquidacoes'):
        if r['id_relatorio_gestao_novo'] in rids:
            liqs[r['id_relatorio_gestao_novo']].append(r)

    out: dict[str, list] = defaultdict(list)
    stats: dict = defaultdict(int)
    for p in sorted(planos, key=lambda r: (emenda_code(r), r['id_plano_acao'])):
        pid = p['id_plano_acao']
        b = benef.get(p['id_beneficiario']) or {}
        pt = _latest_by(pts.get(pid, []), 'dt_hora_situacao_plano_trabalho', 'id_plano_trabalho')
        executores = []
        for e in sorted(execs.get(pid, []), key=lambda r: r['id_executor']):
            executores.append({
                'nome': recebedor_publico('CNPJ', e['nome_executor'])[0], 'objeto': _text(e['objeto_executor']),
                'valor_custeio': cents(e['vl_custeio_executor']), 'valor_investimento': cents(e['vl_investimento_executor']),
                'metas': [{'nome': _text(m['nome_meta']), 'descricao': _text(m['desc_meta']), 'unidade': _text(m['un_medida_meta']),
                           'quantidade': quantity(m['qt_unidade_meta'])}
                          for m in sorted(metas.get(e['id_executor'], []), key=lambda r: (r['sequencial_meta'] or 0, r['id_meta']))],
            })
        todos = rels.get(pid, [])
        # Relatório "Em elaboração" ainda não foi entregue pelo ente: não conta como execução declarada.
        rs = [r for r in todos if normalize_name(r['situacao_relatorio_gestao_novo'] or '') != 'EM ELABORACAO']
        ultimo = _latest_by(rs, 'data_e_hora_relatorio_gestao_novo', 'id_relatorio_gestao_novo')
        fornecedores, docs = fornecedores_do_plano([d for r in rs for d in liqs.get(r['id_relatorio_gestao_novo'], [])])
        out[emenda_code(p)].append({
            'id': pid, 'codigo': p['codigo_plano_acao'], 'ano': p['ano_plano_acao'], 'situacao': _text(p['situacao_plano_acao']),
            'beneficiario': _text(b.get('nome_beneficiario')), 'uf': _text(b.get('uf_beneficiario')),
            'objeto': _text(p['nome_objeto']), 'detalhamento': _text(p['detalhamento_objeto']), 'categoria': _text(p['categoria_despesa_plano_acao']),
            'valor_custeio': cents(p['valor_custeio_plano_acao']), 'valor_investimento': cents(p['valor_investimento_plano_acao']),
            'source_url': _url(ESPECIAIS['planos_acao'], 'id_plano_acao', pid),
            'plano_trabalho': None if pt is None else {'situacao': _text(pt['situacao_plano_trabalho']), 'inicio': pt['data_inicio_execucao_plano_trabalho'],
                                                       'fim': pt['data_fim_execucao_plano_trabalho']},
            'executores': executores,
            'relatorio': None if ultimo is None else {
                'id': ultimo['id_relatorio_gestao_novo'], 'tipo': _text(ultimo['tipo_relatorio_gestao_novo']), 'data': ultimo['data_relatorio_gestao_novo'],
                'situacao': _text(ultimo['situacao_relatorio_gestao_novo']), 'valor_executado': cents(ultimo['valor_executado_relatorio_gestao_novo']),
                'valor_pendente': cents(ultimo['valor_pendente_relatorio_gestao_novo']), 'relatorios': len(rs), 'em_elaboracao': len(todos) - len(rs),
                'source_url': _url(ESPECIAIS['relatorios_gestao'], 'id_plano_acao', pid)},
            'fornecedores': fornecedores, 'documentos_liquidacao': docs,
        })
        stats['planos'] += 1
        stats['planos_com_relatorio'] += bool(rs)
        stats['planos_so_com_relatorio_em_elaboracao'] += bool(todos) and not rs
        stats['planos_com_fornecedor'] += bool(docs)
    return dict(out), dict(stats)


def fornecedores_do_plano(docs: list[dict]) -> tuple[list[dict], int]:
    """Pagamentos do ente a recebedores, declarados nos documentos de liquidação do relatório de gestão.

    Um documento conta uma vez (id da própria API). Agrupa pelo documento do recebedor informado pela fonte,
    que nunca é exportado. Recebedor sem natureza de pessoa jurídica confirmada entra num grupo mascarado.
    """
    unique = {d['id_relatorio_gestao_dl']: d for d in docs}
    groups: dict = defaultdict(lambda: {'nome': None, 'mascarado': False, 'parcelas': [], 'documentos': 0})
    for d in unique.values():
        nome, masked = recebedor_publico(d['tp_doc_recebedor_relatorio_gestao_dl'], d['tx_nome_recebedor_relatorio_gestao_dl'])
        key = ('mascarado',) if masked else ('pj', d['tx_identificacao_recebedor_mascarado_relatorio_gestao_dl'] or nome)
        g = groups[key]
        g['nome'], g['mascarado'] = (MASKED_RECEBEDOR if masked else nome), masked
        g['parcelas'].append(cents(d['vl_pagamento_relatorio_gestao_dl']))
        g['documentos'] += 1
    rows = [{'recebedor': g['nome'], 'mascarado': g['mascarado'], 'valor': total(g['parcelas']), 'documentos': g['documentos']} for g in groups.values()]
    rows.sort(key=lambda r: (r['mascarado'], -(r['valor'] or 0), r['recebedor']))
    return rows, len(unique)


def _proponente(p: dict) -> str | None:
    natureza = p.get('natureza_juridica') or ''
    if 'Pessoa' in natureza or 'Empres' in natureza:
        return recebedor_publico('CNPJ', p['nm_proponente'])[0]
    return _text(p['nm_proponente'])


def build_convenios(numeros: set[str], metas_path: Path, propostas_path: Path | None, contract: dict) -> tuple[dict[str, dict], dict]:
    """nº do convênio (arquivo da CGU) → metas do cronograma (Transferegov) → id_proposta → proposta."""
    metas = defaultdict(list)
    for r in iter_records(metas_path, DISCRICIONARIAS['metas_convenio'][0], contract):
        if r['nr_convenio'] in numeros:
            metas[r['nr_convenio']].append(r)
    props = {}
    if propostas_path is not None:
        props = {r['id_proposta']: r for r in iter_records(propostas_path, DISCRICIONARIAS['propostas'][0], contract)}
    out: dict[str, dict] = {}
    stats: dict = defaultdict(int)
    for n in sorted(numeros):
        ms = metas.get(n, [])
        ids = sorted({m['id_proposta'] for m in ms})
        if len(ids) != 1:
            stats['sem_meta_no_transferegov' if not ids else 'mais_de_uma_proposta'] += 1
            continue
        p = props.get(ids[0])
        if p is None:
            stats['proposta_ausente'] += 1
            continue
        out[n] = {
            'numero': n, 'id_proposta': ids[0], 'nr_proposta': _text(p['nr_proposta']), 'modalidade': _text(p['modalidade']),
            'situacao': _text(p['sit_proposta']), 'objeto': _text(p['objeto_proposta']), 'orgao': _text(p['desc_orgao']),
            'proponente': _proponente(p), 'municipio': _text(p['munic_proponente']), 'uf': _text(p['uf_proponente']),
            'valor_global': cents(p['vl_global_prop']), 'valor_repasse': cents(p['vl_repasse_prop']), 'valor_contrapartida': cents(p['vl_contrapartida_prop']),
            'vigencia_inicio': p['dia_inic_vigencia_proposta'], 'vigencia_fim': p['dia_fim_vigencia_proposta'],
            'ordem_servico': _text(p['tem_ordem_de_servico']),
            'metas': [{'numero': m['nr_meta'], 'descricao': _text(m['desc_meta']), 'unidade': _text(m['und_fornecimento_meta']),
                       'quantidade': quantity(m['qtd_meta']), 'valor': cents(m['vl_meta']), 'inicio': m['data_inicio_meta'], 'fim': m['data_fim_meta']}
                      for m in sorted(ms, key=lambda r: (r['nr_meta'] or 0, r['id_meta']))],
            'source_url': _url(DISCRICIONARIAS['metas_convenio'][0], 'nr_convenio', n),
            'proposta_url': _url(DISCRICIONARIAS['propostas'][0], 'id_proposta', ids[0]),
        }
        stats['ligados'] += 1
    return out, dict(stats)


RULES = [
    'Ligação só por identificador oficial: número da emenda no plano de ação (transferência especial) e número do convênio do arquivo da CGU (convênio e contrato de repasse). Nunca por nome, valor ou data (ADR-018).',
    'Valores em centavos; ausente = null. Valores do plano de ação, do convênio, do relatório de gestão e dos pagamentos a fornecedores são etapas diferentes e não se somam entre si nem com os valores da CGU.',
    'Metas são o planejado. Relatório de gestão e documentos de liquidação são declarações do ente beneficiário; não são vistoria e não provam entrega da obra ou do serviço.',
    'Recebedor pessoa física, MEI ou sem natureza de pessoa jurídica confirmada aparece mascarado; documentos de identificação, contas bancárias e contatos não saem da cópia bruta.',
]


def build(emendas: dict, files: dict[str, Path], contract: dict, entry: dict, sources: dict[str, dict]) -> dict:
    codes = set(emendas)
    planos, st_esp = build_especiais(codes, files, contract)
    numeros = {c['numero'] for e in emendas.values() for c in e['convenios'] if c['numero']}
    convs, st_conv = build_convenios(numeros, files['metas_convenio'], files.get('propostas'), contract)
    out = {}
    for code in sorted(codes):
        cs = [convs[c['numero']] for c in emendas[code]['convenios'] if c['numero'] in convs]
        if planos.get(code) or cs:
            out[code] = {'planos_acao': planos.get(code, []), 'convenios': cs}
    cobertura = {
        'fichas': len(codes),
        'fichas_transferencia_especial': sum(1 for e in emendas.values() if 'Especiais' in (e['tipo'] or '')),
        'fichas_com_plano_acao': sum(1 for c in out.values() if c['planos_acao']),
        'fichas_com_execucao_declarada': sum(1 for c in out.values() if any(execucao_declarada(p) for p in c['planos_acao'])),
        'fichas_com_convenio_cgu': sum(1 for e in emendas.values() if e['convenios']),
        'fichas_com_convenio_transferegov': sum(1 for c in out.values() if c['convenios']),
        'convenios_cgu': len(numeros), 'convenios': st_conv, 'planos': st_esp,
    }
    return {
        'kind': 'VALIDACAO', 'snapshot': {'raw_sha256': entry['raw_sha256'], 'downloaded_at': entry['downloaded_at']},
        'source': 'Transferegov.br — API pública de dados abertos (módulos especiais e discricionárias)', 'source_url': API,
        'transferegov_sources': {k: {'raw_sha256': v['raw_sha256'], 'downloaded_at': v['downloaded_at'], 'source_last_modified': v.get('last_modified'),
                                     'source_url': v['source_url']} for k, v in sorted(sources.items())},
        'unit': 'centavos de real (BRL)', 'rules': RULES, 'cobertura': cobertura, 'emendas': out,
    }


def execucao_declarada(p: dict) -> bool:
    """Há registro de execução do ente: documento de liquidação ou relatório com valor executado positivo."""
    return bool(p['documentos_liquidacao']) or ((p['relatorio'] or {}).get('valor_executado') or 0) > 0


def _tag(entry: dict) -> str:
    return f"{entry['downloaded_at'][:10]}-{entry['raw_sha256'][:8]}"


def _keys(values: Iterable) -> list[str]:
    return sorted({str(v) for v in values if v is not None}, key=lambda v: (len(v), v))


def run(download: bool = True) -> Path:
    """Baixa (ou reaproveita, com download=False) as cópias brutas e grava transferegov-<tag CGU>.json.

    As chaves de cada consulta saem da cópia anterior: fichas → planos de ação → executores/planos de trabalho
    → metas; relatórios → documentos de liquidação; convênios da CGU → metas do cronograma → propostas.
    """
    entry = latest('cgu_emendas')
    emendas = json.loads((VALIDATION_DIR / f'emendas-{_tag(entry)}.json').read_text(encoding='utf-8'))['emendas']
    contract = load_contract()
    sources: dict[str, dict] = {}
    files: dict[str, Path] = {}

    def snap(name: str, keys: list[str] | None = None) -> None:
        if download:
            acquire_table(name) if keys is None else acquire_keyed(name, keys)
        e = latest(f'transferegov_{name}')
        if e is None:
            raise FileNotFoundError(f'Snapshot ausente: transferegov_{name}; rode python pipelines/run.py transferegov')
        sources[f'transferegov_{name}'], files[name] = e, verify(e)

    def rec(name: str) -> Iterator[dict]:
        return iter_records(files[name], ESPECIAIS[name] if name in ESPECIAIS else DISCRICIONARIAS[name][0], contract)

    if download:
        for m in OPENAPI:
            acquire_openapi(m)
    for name in TABELAS_COMPLETAS:
        snap(name)
    pids = _keys(r['id_plano_acao'] for r in rec('planos_acao') if emenda_code(r) in emendas)
    snap('executores', pids)
    snap('planos_trabalho', pids)
    snap('metas', _keys(r['id_executor'] for r in rec('executores')))
    wanted_p = set(pids)
    snap('liquidacoes', _keys(r['id_relatorio_gestao_novo'] for r in rec('relatorios_gestao') if str(r['id_plano_acao']) in wanted_p))
    numeros = _keys(c['numero'] for e in emendas.values() for c in e['convenios'])
    snap('metas_convenio', numeros)
    wanted_c = set(numeros)
    snap('propostas', _keys(r['id_proposta'] for r in rec('metas_convenio') if r['nr_convenio'] in wanted_c))

    payload = build(emendas, files, contract, entry, sources)
    path = VALIDATION_DIR / f'transferegov-{_tag(entry)}.json'
    path.write_text(json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(',', ':')) + '\n', encoding='utf-8')
    c = payload['cobertura']
    print(f"[transferegov] {path.name} · {c['fichas_com_plano_acao']} fichas com plano de ação "
          f"({c['fichas_com_execucao_declarada']} com execução declarada) · {c['fichas_com_convenio_transferegov']} de "
          f"{c['fichas_com_convenio_cgu']} fichas com convênio encontradas no Transferegov")
    return path
