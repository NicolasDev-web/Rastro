"""Emendas parlamentares ESTADUAIS do Ceará — lado do orçamento (SPEC 07, ADR-019).

Fonte: Ceará Transparente (CGE-CE), um CSV por ano (2023–2026), ISO-8859-1, separador `;`.
O CSV traz só o orçamento (valor da emenda e da lei). Não traz empenho, pagamento nem beneficiário.

Regras:
- cópia bruta datada + SHA-256 no manifesto (snapshot.acquire), nunca sobrescrita;
- contrato em pipelines/contracts/ce_emendas_estaduais.json: cabeçalho, codificação e formato de valor
  divergentes bloqueiam a carga inteira;
- valores em centavos inteiros; sentinela de ausência vira None (nunca zero);
- município: só por nome IBGE exato e normalizado, nas posições da regra (link_municipio);
- deputado: só por nome exato normalizado e único na lista da Alece (link_deputado);
- export próprio em data/estaduais/, separado do pacote federal; nada aqui se soma às federais.
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
import os
import re
import tempfile
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

from . import CONTRACTS_DIR, MANIFEST, RAW_DIR, REPORTS_DIR, ROOT
from .cgu import normalize_name
from .fmt import brl, num, table
from .money import total
from .snapshot import Response, Source, acquire, http_fetch, latest, verify

ESTADUAIS_DIR = ROOT / 'data' / 'estaduais'
POINTER = 'ativo.json'
KIND = 'CE_ESTADUAIS_ORCAMENTO'
TERMS = 'Dados abertos do Ceará Transparente (Controladoria e Ouvidoria Geral do Estado do Ceará, CGE-CE).'
PAGE_URL = 'https://cearatransparente.ce.gov.br/portal-da-transparencia/despesas/emendas-parlamentares'
VALUE_KEYS = ('valor_emenda', 'valor_lei', 'valor_lei_creditos')
VALUE_LABELS = {'valor_emenda': 'Valor emenda', 'valor_lei': 'Valor lei', 'valor_lei_creditos': 'Valor lei créditos'}

WARNING = ('Emendas ESTADUAIS do Ceará: orçamento do Estado, separado das emendas federais. No Ceará a emenda estadual '
           'não é impositiva: o deputado indica e o Executivo decide se executa. O arquivo mostra só o orçamento '
           '(valor da emenda e da lei), sem empenho, pagamento ou beneficiário. Não somar com valores federais.')

# Referências de contexto. Não são fonte primária e não entram em nenhuma conta.
EXTERNAL_REFERENCES = [
    {'id': 'pcf_imprensa', 'texto': 'Cerca de R$ 1,65 milhão por deputado e R$ 76 milhões no total por ano no Programa de Cooperação Federativa (PCF).',
     'fonte': 'Diário do Nordeste (reportagem, não é fonte primária)',
     'url': 'https://diariodonordeste.verdesmares.com.br/pontopoder/r-76-milhoes-ha-10-anos-deputados-brigam-para-tornar-obrigatoria-execucao-de-emendas-no-ceara-1.3692203'},
    {'id': 'loa_2026_acolhidas', 'texto': '521 emendas de deputados acolhidas na LOA 2026 (Lei nº 19.642).',
     'fonte': 'Pista registrada em docs/sources/FONTES-OFICIAIS.md (6d), consultada em 19/11/2026; quadro da LOA ainda não extraído',
     'url': None},
]


class ContractError(Exception):
    """Arquivo diverge do contrato: a carga inteira é bloqueada."""


def load_contract(path: Path | None = None) -> dict:
    return json.loads((path or CONTRACTS_DIR / 'ce_emendas_estaduais.json').read_text(encoding='utf-8'))


def source(year: int, contract: dict) -> Source:
    return Source(
        source_id=f'ce_estaduais_{year}', url=contract['url_template'].format(ano=year), subdir='ce_transparente/emendas',
        filename=f'emendas_parlamentares_{year}.csv',
        dictionary_version=f"{contract['dictionary_url']} (não descreve as colunas do CSV; contrato {contract['contract_version']})",
        license_or_terms=TERMS)


def dictionary_source(contract: dict) -> Source:
    return Source(source_id='ce_estaduais_dicionario', url=contract['dictionary_url'], subdir='ce_transparente/emendas',
                  filename='dicionario_de_dados_emendas.pdf', dictionary_version='PDF do dicionário (1 página)', license_or_terms=TERMS)


# ---------- leitura conforme o contrato ----------

def decode(raw: bytes, contract: dict) -> str:
    """ISO-8859-1 estrito. Recusa sinais de que a codificação mudou, em vez de adivinhar."""
    if raw.startswith(b'\xef\xbb\xbf'):
        raise ContractError('Arquivo com BOM UTF-8: a codificação deixou de ser ISO-8859-1')
    if any(b >= 0x80 for b in raw):
        try:
            raw.decode('utf-8')
        except UnicodeDecodeError:
            pass
        else:
            raise ContractError('Arquivo é UTF-8 válido com acentos: a codificação mudou (contrato: ISO-8859-1)')
    if re.search(rb'[\x80-\x9f]', raw):
        raise ContractError('Bytes 0x80–0x9F (controle em ISO-8859-1): provável Windows-1252, fora do contrato')
    return raw.decode(contract['encoding'], errors='strict')


def header_errors(header: list[str], expected: list[str]) -> list[str]:
    if header == expected:
        return []
    errs = [f'coluna ausente "{c}"' for c in expected if c not in header]
    errs += [f'coluna desconhecida "{c}"' for c in header if c not in expected]
    return errs or ['ordem das colunas mudou']


def clean(value: str | None, sentinels: list[str]) -> str | None:
    if value is None:
        return None
    v = value.strip()
    return None if v.casefold() in {s.casefold() for s in sentinels} else v


_INT = re.compile(r'^\d+$')
_DEC = re.compile(r'^\d+,\d{1,2}$')
_THOUSANDS = re.compile(r'^\d{1,3}(\.\d{3})+,\d{2}$')


def cents(value: str | None, sentinels: list[str]) -> int | None:
    """'300000' (reais) → 30000000. '300.000,00' e '300000,5' também. Ausente → None. Outro formato → erro."""
    v = clean(value, sentinels)
    if v is None:
        return None
    neg = v.startswith('-')
    body = v[1:] if neg else v
    if _INT.match(body):
        c = int(body) * 100
    elif _DEC.match(body) or _THOUSANDS.match(body):
        whole, frac = body.replace('.', '').split(',')
        c = int(whole) * 100 + int((frac + '0')[:2])
    else:
        raise ContractError(f'Valor fora do formato do contrato: {value!r}')
    return -c if neg else c


_CPF = re.compile(r'\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b|\*{3}\.\d{3}\.\d{3}-\*{2}')


def row_sha256(values: list[str]) -> str:
    return hashlib.sha256('\x1f'.join(values).encode('utf-8')).hexdigest()


def parse(raw: bytes, year: int, contract: dict) -> list[dict]:
    """Linhas normalizadas de um arquivo anual. Qualquer divergência bloqueia o arquivo inteiro."""
    text = decode(raw, contract)
    reader = csv.reader(io.StringIO(text, newline=''), delimiter=contract['delimiter'])
    header = next(reader, None)
    if not header:
        raise ContractError(f'{year}: arquivo vazio')
    errs = header_errors(header, contract['columns'])
    if errs:
        raise ContractError(f'{year}: ' + '; '.join(errs))
    sentinels, money, fields = contract['null_sentinels'], set(contract['money_columns']), contract['fields']
    rows, seen = [], set()
    for values in reader:
        if not values:
            continue
        if len(values) != len(header):
            raise ContractError(f'{year}: linha {reader.line_num} com {len(values)} campos (esperado {len(header)})')
        d = dict(zip(header, values))
        rec: dict = {}
        for col, key in fields.items():
            if col in money:
                rec[key] = cents(d[col], sentinels)
            else:
                rec[key] = clean(d[col], sentinels)
                if rec[key] and _CPF.search(rec[key]):
                    raise ContractError(f'{year}: linha {reader.line_num}, coluna "{col}" contém padrão de CPF; nada é carregado')
        if rec['ano'] != str(year):
            raise ContractError(f'{year}: linha {reader.line_num} com Exercício {rec["ano"]!r}')
        if not (rec['codigo'] and rec['codigo'].isdigit()):
            raise ContractError(f'{year}: linha {reader.line_num} com código fora do padrão {rec["codigo"]!r}')
        if rec['codigo'] in seen:
            raise ContractError(f'{year}: código {rec["codigo"]} repetido')
        seen.add(rec['codigo'])
        rec['ano'] = year
        rec['id'] = f'{year}-{int(rec["codigo"]):04d}'  # chave técnica (ano + código da fonte), não é número oficial
        rec['linha'] = reader.line_num
        rec['linha_sha256'] = row_sha256(values)
        rows.append(rec)
    if not rows:
        raise ContractError(f'{year}: arquivo sem linhas de dados')
    return rows


# ---------- ligação a município IBGE (regra exata) ----------

ANCHORS = {'MUNICIPIO', 'MUNICIPIOS'}
CONNECTORS = {'DE', 'DO', 'DA'}
PRECEDERS = {'EM', 'DE', 'DO', 'DA', 'NO', 'NA', '/'}
RULE_ANCHOR = 'ancora_municipio'
RULE_FINAL = 'nome_no_fim'


def tokens(text: str) -> list[str]:
    """Sem acento, maiúsculas; barra e hífen viram o token '/'; o resto que não é letra ou dígito separa palavras."""
    t = re.sub(r'[/\-–—]', ' / ', text)
    t = unicodedata.normalize('NFD', t).encode('ascii', 'ignore').decode('ascii').upper()
    return re.findall(r'[A-Z0-9]+|/', t)


def municipio_index(municipios: list[dict]) -> dict[tuple[str, ...], tuple[str, str]]:
    """{tokens do nome IBGE: (código, nome)}. Dois municípios com o mesmo nome normalizado bloqueiam a regra."""
    idx: dict[tuple[str, ...], tuple[str, str]] = {}
    for m in municipios:
        key = tuple(tokens(m['nome']))
        if key in idx:
            raise ContractError(f'Nome normalizado repetido no IBGE: {m["nome"]}')
        idx[key] = (str(m['id']), m['nome'])
    return idx


def _spans(toks: list[str], idx: dict) -> list[tuple[int, int, tuple[str, str]]]:
    longest = max((len(k) for k in idx), default=0)
    spans = []
    for i in range(len(toks)):
        for size in range(min(longest, len(toks) - i), 0, -1):
            hit = idx.get(tuple(toks[i:i + size]))
            if hit:
                spans.append((i, i + size, hit))
                break
    # "Nova Russas" contém "Russas", "Bela Cruz" contém "Cruz": o nome menor dentro do maior não conta
    return [s for s in spans if not any(o[0] <= s[0] and s[1] <= o[1] and o[1] - o[0] > s[1] - s[0] for o in spans)]


def link_municipio(acao: str | None, idx: dict) -> dict:
    """Município citado no texto da Ação. Não é o beneficiário nem prova o local da entrega.

    Regra 1 (ancora_municipio): o texto tem a palavra "município" e, logo depois (com "de/do/da" ou barra opcionais),
    vem um nome IBGE completo; nenhum outro município é citado.
    Regra 2 (nome_no_fim): o texto não tem "município"; o único nome IBGE citado fecha o texto (pode vir "/CE" depois)
    e vem logo após "em", "de", "do", "da", "no", "na", barra ou hífen.
    Fora disso: sem ligação, com o motivo.
    """
    none = {'ibge': None, 'nome': None, 'regra': None}
    if not acao:
        return {**none, 'situacao': 'sem_municipio', 'motivo': 'Ação sem texto'}
    toks = tokens(acao)
    spans = _spans(toks, idx)
    found = sorted({s[2] for s in spans})
    if any(t in ANCHORS for t in toks):
        anchored = set()
        for i, t in enumerate(toks):
            if t not in ANCHORS:
                continue
            j = i + 1
            while j < len(toks) and toks[j] == '/':
                j += 1
            if j < len(toks) and toks[j] in CONNECTORS:
                j += 1
            while j < len(toks) and toks[j] == '/':
                j += 1
            anchored |= {s[2] for s in spans if s[0] == j}
        if len(anchored) == 1 and set(found) == anchored:
            code, name = next(iter(anchored))
            return {'ibge': code, 'nome': name, 'regra': RULE_ANCHOR, 'situacao': 'ligada', 'motivo': None}
        if len(found) > 1:
            return {**none, 'situacao': 'ambigua', 'motivo': 'mais de um município citado: ' + ', '.join(n for _, n in found)}
        return {**none, 'situacao': 'nao_resolvida', 'motivo': 'o texto cita "município", mas o que vem depois não é um nome IBGE exato'}
    if len(found) > 1:
        return {**none, 'situacao': 'ambigua', 'motivo': 'mais de um município citado: ' + ', '.join(n for _, n in found)}
    if not found:
        return {**none, 'situacao': 'sem_municipio', 'motivo': 'nenhum nome de município IBGE no texto'}
    start, end, (code, name) = next(s for s in spans if s[2] == found[0])
    if toks[end:] in ([], ['CE'], ['/', 'CE']) and start > 0 and toks[start - 1] in PRECEDERS:
        return {'ibge': code, 'nome': name, 'regra': RULE_FINAL, 'situacao': 'ligada', 'motivo': None}
    return {**none, 'situacao': 'nao_resolvida', 'motivo': f'"{name}" aparece fora da posição prevista na regra'}


# ---------- ligação a deputado estadual (Alece, regra exata) ----------

def deputado_index(deputies: list[dict]) -> dict[str, list[dict]]:
    idx: dict[str, list[dict]] = defaultdict(list)
    for d in deputies:
        idx[normalize_name(d['nome'])].append(d)
    return idx


def link_deputado(nome: str | None, idx: dict[str, list[dict]]) -> dict:
    """Nome exato após normalização (sem acento, maiúsculas, pontuação vira espaço) e único na lista da Alece."""
    if not nome:
        return {'slug': None, 'nome_alece': None, 'url_perfil': None, 'situacao': 'sem_nome', 'motivo': 'linha sem parlamentar'}
    cands = idx.get(normalize_name(nome), [])
    if len(cands) == 1:
        d = cands[0]
        return {'slug': d['slug'], 'nome_alece': d['nome'], 'url_perfil': d.get('url_perfil'), 'situacao': 'ligada', 'motivo': None}
    if cands:
        return {'slug': None, 'nome_alece': None, 'url_perfil': None, 'situacao': 'ambigua', 'motivo': 'mais de um deputado com o mesmo nome'}
    return {'slug': None, 'nome_alece': None, 'url_perfil': None, 'situacao': 'nao_encontrado',
            'motivo': 'nome sem correspondência exata na lista atual da Alece (pode ser ex-deputado ou grafia diferente)'}


# ---------- cobertura e export ----------

def _value_stats(rows: list[dict], key: str) -> dict:
    vals = [r[key] for r in rows]
    return {'total': total(vals), 'linhas_com_valor': sum(v is not None for v in vals), 'linhas_nulas': sum(v is None for v in vals),
            'linhas_zero': sum(v == 0 for v in vals)}


def coverage(rows: list[dict]) -> dict:
    """Contagens e totais de UMA coluna por vez, dentro do ano. Sem totais por deputado (nenhum ranking)."""
    mun = Counter(r['municipio']['situacao'] for r in rows)
    dep_names = {r['parlamentar'] for r in rows if r['parlamentar']}
    dep_linked = {r['parlamentar'] for r in rows if r['deputado']['situacao'] == 'ligada'}
    return {
        'linhas': len(rows),
        'parlamentares_distintos': len(dep_names),
        'parlamentares_ligados': len(dep_linked),
        'linhas_deputado_ligado': sum(r['deputado']['situacao'] == 'ligada' for r in rows),
        'linhas_municipio_ligado': mun.get('ligada', 0),
        'linhas_municipio_ambiguo': mun.get('ambigua', 0),
        'linhas_municipio_nao_resolvido': mun.get('nao_resolvida', 0),
        'linhas_sem_municipio': mun.get('sem_municipio', 0),
        'municipios_distintos': len({r['municipio']['ibge'] for r in rows if r['municipio']['ibge']}),
        'beneficiarios': None,
        'carater': dict(sorted(Counter(r['carater'] or 'sem informação' for r in rows).items())),
        'tipo': dict(sorted(Counter(r['tipo'] or 'sem informação' for r in rows).items())),
        'valores': {k: _value_stats(rows, k) for k in VALUE_KEYS},
    }


def _snapshot_info(e: dict) -> dict:
    return {k: e.get(k) for k in ('source_url', 'raw_sha256', 'downloaded_at', 'last_modified', 'bytes', 'raw_path')}


def build(rows_by_year: dict[int, list[dict]], entries: dict[int, dict], contract: dict, *, dictionary_entry: dict | None,
          ibge_entry: dict, alece_entry: dict, municipios: list[dict], deputies: list[dict]) -> dict:
    idx_m, idx_d = municipio_index(municipios), deputado_index(deputies)
    years = sorted(rows_by_year)
    emendas = []
    for y in years:
        for r in sorted(rows_by_year[y], key=lambda r: int(r['codigo'])):
            emendas.append({**r, 'municipio': link_municipio(r['acao'], idx_m), 'deputado': link_deputado(r['parlamentar'], idx_d)})
    by_year = {y: [e for e in emendas if e['ano'] == y] for y in years}
    return {
        'kind': KIND,
        'versao': 1,
        'esfera': 'estadual',
        'aviso': WARNING,
        'fonte': 'Ceará Transparente (CGE-CE) — Emendas parlamentares, arquivo CSV por exercício',
        'fonte_pagina': PAGE_URL,
        'contrato': contract['contract_version'],
        'dicionario': {'url': contract['dictionary_url'], 'snapshot': _snapshot_info(dictionary_entry) if dictionary_entry else None,
                       'divergencias': contract['dictionary_divergences']},
        'snapshots': {str(y): _snapshot_info(entries[y]) for y in years},
        'referencias': {'ibge': _snapshot_info(ibge_entry), 'alece': _snapshot_info(alece_entry)},
        'anos': years,
        'unidade': 'centavos de real (BRL)',
        'colunas_valor': VALUE_LABELS,
        'regras': [
            'Estaduais nunca se somam com federais (ADR-019). Este arquivo é separado do pacote federal.',
            '"Valor emenda", "Valor lei" e "Valor lei créditos" são colunas diferentes da fonte e não se somam entre si.',
            'Totais por ano somam uma coluna por vez; se uma linha não tiver valor, o total fica indisponível (null), nunca vira zero.',
            'Zero só aparece quando o arquivo traz 0.',
            'Município = citado no texto da Ação, por nome IBGE exato (regras ancora_municipio e nome_no_fim). Não é o beneficiário nem prova o local da entrega.',
            'Deputado = nome exato normalizado e único na lista atual da Alece. Sem nome aproximado.',
            'O CSV não traz beneficiário, CPF ou CNPJ. Nenhum dado de pessoa física entra neste arquivo.',
        ],
        'regras_municipio': {
            RULE_ANCHOR: 'A palavra "município" seguida (com "de/do/da" ou barra opcionais) de um nome IBGE completo, sem outro município no texto.',
            RULE_FINAL: 'Sem a palavra "município": o único nome IBGE do texto fecha a frase e vem após "em/de/do/da/no/na", barra ou hífen.',
        },
        'cobertura': {str(y): coverage(by_year[y]) for y in years},
        'referencias_externas': EXTERNAL_REFERENCES,
        'limitacoes': limitations(by_year, alece_entry['downloaded_at'][:10]),
        'emendas': emendas,
    }


def limitations(by_year: dict[int, list[dict]], alece_date: str) -> list[str]:
    counts = ', '.join(f'{y}: {num(len(rows))}' for y, rows in by_year.items())
    carater = sorted({r['carater'] for rows in by_year.values() for r in rows if r['carater']})
    tipos = sorted({r['tipo'] for rows in by_year.values() for r in rows if r['tipo']})
    return [
        f'Poucas linhas por ano ({counts}). Todas têm caráter {", ".join(carater) or "—"} e tipo {", ".join(tipos) or "—"}. '
        'A imprensa cita cerca de R$ 76 milhões por ano no PCF, e a LOA 2026 acolheu 521 emendas de deputados. '
        'O arquivo não cobre todas as emendas estaduais, e a CGE-CE ainda não explicou o recorte.',
        'O CSV mostra só o orçamento. Empenho, pagamento, beneficiário e Nº SACC ficam fora, porque só aparecem nas fichas da página (montadas por JavaScript).',
        'O dicionário de dados publicado não descreve as colunas do CSV. O sentido de "Valor emenda", "Valor lei" e "Valor lei créditos" vem só do nome da coluna.',
        'Há linhas com "Valor emenda" e "Valor lei" iguais a 0 e "Valor lei créditos" positivo. O arquivo não explica por quê.',
        f'A lista de deputados é a da Alece baixada em {"/".join(reversed(alece_date.split("-")))}. Ex-deputados e nomes grafados de outro jeito ficam sem ligação.',
        'Não há arquivos anteriores a 2023 (2016–2022 dão erro 404).',
    ]


def dumps(payload: dict) -> bytes:
    return (json.dumps(payload, ensure_ascii=False, sort_keys=True, indent=1) + '\n').encode('utf-8')


def tag(payload: dict) -> str:
    shas = sorted(s['raw_sha256'] for s in payload['snapshots'].values())
    shas += [payload['referencias']['ibge']['raw_sha256'], payload['referencias']['alece']['raw_sha256']]
    date = max(s['downloaded_at'] for s in payload['snapshots'].values())[:10]
    return f"{date}-{hashlib.sha256(':'.join(shas).encode()).hexdigest()[:8]}"


def _atomic_write(path: Path, content: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=path.parent, delete=False, suffix='.tmp') as fh:
        fh.write(content)
        temp = fh.name
    try:
        os.replace(temp, path)
    finally:
        Path(temp).unlink(missing_ok=True)


def write(payload: dict, out_dir: Path = ESTADUAIS_DIR) -> tuple[Path, str]:
    """Export determinístico + ponteiro com SHA-256. Mesmo raw → mesmos bytes."""
    content = dumps(payload)
    digest = hashlib.sha256(content).hexdigest()
    path = Path(out_dir) / f'ce-estaduais-{tag(payload)}.json'
    _atomic_write(path, content)
    pointer = {'versao': 1, 'kind': KIND, 'arquivo': path.name, 'sha256': digest}
    _atomic_write(Path(out_dir) / POINTER, (json.dumps(pointer, sort_keys=True, indent=1) + '\n').encode('utf-8'))
    return path, digest


def report(payload: dict) -> str:
    years = payload['anos']
    cov = payload['cobertura']
    lines = [f'# Emendas estaduais do Ceará — cobertura e ligações ({tag(payload)})', '',
             'Gerado por `python pipelines/run.py estaduais` (SPEC 07). Só o lado do orçamento; sem execução.', '',
             '## Arquivos', '',
             table(['Ano', 'SHA-256', 'Baixado em', 'Last-Modified', 'Bytes'],
                   [[y, f"`{payload['snapshots'][str(y)]['raw_sha256'][:16]}…`", payload['snapshots'][str(y)]['downloaded_at'],
                     payload['snapshots'][str(y)]['last_modified'] or '—', num(payload['snapshots'][str(y)]['bytes'])] for y in years], 'lllll'),
             '', '## Cobertura por ano', '',
             table(['Ano', 'Linhas', 'Parlamentares', 'Ligados à Alece', 'Linhas c/ município', 'Ambíguas', 'Não resolvidas', 'Sem município',
                    'Valor emenda', 'Valor lei', 'Valor lei créditos'],
                   [[y, c['linhas'], c['parlamentares_distintos'], c['parlamentares_ligados'], c['linhas_municipio_ligado'], c['linhas_municipio_ambiguo'],
                     c['linhas_municipio_nao_resolvido'], c['linhas_sem_municipio'],
                     *[brl(c['valores'][k]['total']) for k in VALUE_KEYS]] for y in years for c in [cov[str(y)]]], 'rrrrrrrrrrr'),
             '', 'As três colunas de valor são diferentes entre si e não se somam. Beneficiários: o CSV não tem essa coluna.', '',
             '## Limitações', '', *[f'- {t}' for t in payload['limitacoes']], '',
             '## Linhas sem ligação a município (revisão humana)', '']
    pend = [e for e in payload['emendas'] if e['municipio']['situacao'] != 'ligada']
    lines += [table(['Ano', 'Código', 'Situação', 'Ação (texto da fonte)', 'Motivo'],
                    [[e['ano'], e['codigo'], e['municipio']['situacao'], (e['acao'] or '—').replace('|', '/'), e['municipio']['motivo']] for e in pend], 'lllll')
              if pend else 'Nenhuma.', '', '## Parlamentares sem ligação à lista da Alece', '']
    miss: dict[str, set[int]] = defaultdict(set)
    reasons: dict[str, str] = {}
    for e in payload['emendas']:
        if e['deputado']['situacao'] != 'ligada':
            key = e['parlamentar'] or '(sem nome)'
            miss[key].add(e['ano'])
            reasons[key] = e['deputado']['motivo']
    lines += [table(['Nome na fonte', 'Anos', 'Motivo'], [[n, ', '.join(map(str, sorted(ys))), reasons[n]] for n, ys in sorted(miss.items())], 'lll')
              if miss else 'Nenhum.', '',
              'Nenhuma ligação foi feita por nome aproximado. Grafias parecidas (por exemplo, abreviações) ficam aqui para revisão.', '']
    return '\n'.join(lines)


# ---------- execução ----------

def _load_references(raw_dir: Path, manifest: Path) -> tuple[dict, list[dict], dict, list[dict]]:
    from .alece import parse as parse_alece
    ibge_entry, alece_entry = latest('ibge_municipios_ce', manifest), latest('alece_deputados', manifest)
    if not ibge_entry or not alece_entry:
        raise FileNotFoundError('Faltam os snapshots do IBGE ou da Alece. Rode antes: python pipelines/run.py snapshot e autores')
    municipios = json.loads(verify(ibge_entry, raw_dir).read_text(encoding='utf-8'))
    deputies = parse_alece(verify(alece_entry, raw_dir).read_text(encoding='utf-8', errors='replace'))
    return ibge_entry, municipios, alece_entry, deputies


def execute(*, raw_dir: Path = RAW_DIR, manifest: Path = MANIFEST, out_dir: Path = ESTADUAIS_DIR, reports_dir: Path = REPORTS_DIR,
            fetch: Callable[[str], Response] = http_fetch, references: tuple | None = None,
            now: Callable[[], datetime] = lambda: datetime.now(timezone.utc)) -> dict:
    contract = load_contract()
    entries = {y: acquire(source(y, contract), raw_dir=raw_dir, manifest=manifest, fetch=fetch, now=now) for y in contract['years']}
    try:
        dict_entry = acquire(dictionary_source(contract), raw_dir=raw_dir, manifest=manifest, fetch=fetch, now=now)
    except RuntimeError as exc:  # o dicionário é referência; sua falta não bloqueia, mas fica registrada
        print(f'[estaduais] dicionário não baixado: {exc}')
        dict_entry = None
    ibge_entry, municipios, alece_entry, deputies = references or _load_references(raw_dir, manifest)
    rows = {y: parse(verify(e, raw_dir).read_bytes(), y, contract) for y, e in entries.items()}
    payload = build(rows, entries, contract, dictionary_entry=dict_entry, ibge_entry=ibge_entry, alece_entry=alece_entry,
                    municipios=municipios, deputies=deputies)
    path, digest = write(payload, out_dir)
    reports_dir.mkdir(parents=True, exist_ok=True)
    rep = reports_dir / f'ce-estaduais-{tag(payload)}.md'
    rep.write_text(report(payload), encoding='utf-8')
    return {'payload': payload, 'path': path, 'sha256': digest, 'report': rep, 'entries': entries}


def run() -> int:
    try:
        res = execute()
    except RuntimeError as exc:  # bloqueio de rede: registra e para, sem tentar contornar
        print(f'[estaduais] download bloqueado ou indisponível: {exc}')
        return 1
    except ContractError as exc:
        print(f'[estaduais] arquivo fora do contrato, carga bloqueada: {exc}')
        return 1
    p = res['payload']
    for y in p['anos']:
        c, e = p['cobertura'][str(y)], res['entries'][y]
        print(f"[estaduais] {y}: {'reaproveitado' if e['reused'] else 'novo'} · sha256 {e['raw_sha256'][:12]}… · {c['linhas']} linhas · "
              f"{c['parlamentares_distintos']} parlamentares ({c['parlamentares_ligados']} ligados) · {c['linhas_municipio_ligado']} com município")
    print(f"[estaduais] export {res['path'].name} · sha256 {res['sha256'][:12]}… · relatório {res['report'].name}")
    return 0
