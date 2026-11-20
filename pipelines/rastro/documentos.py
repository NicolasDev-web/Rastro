"""Incremento 2 — documentos de despesa (SPEC 01: AC03, Gate B; hipótese H1 sobre restos a pagar).

Um arquivo por ANO DO DOCUMENTO (não da emenda): observamos a janela 2020–2026,
sem presumir cobertura integral. Guardamos documentos ligados ao recorte (emenda com linha no CE ou
de autor eleito pelo CE) ou com aplicação no CE. Favorecido pessoa física/empresário individual mascarado.
"""
from __future__ import annotations

import json
import re
import sqlite3
import zipfile
from collections import defaultdict
from pathlib import Path

from . import CONTRACTS_DIR, RAW_DIR, REPORTS_DIR, STAGING_DB
from . import cgu
from .fmt import brl, num, table
from .snapshot import latest, verify
from .money import sql_total

YEARS = range(2020, 2027)
CONTRACT_PATH = CONTRACTS_DIR / 'cgu_documentos.json'
_MEI = re.compile(r'^\d{2}\.\d{3}\.\d{3}\s')  # "11.854.334 NOME" = empresário individual (nome de pessoa)

SCHEMA = """
CREATE TABLE IF NOT EXISTS cgu_documentos (
  raw_sha256 TEXT NOT NULL,
  source_row_id TEXT NOT NULL,
  emenda_code TEXT,
  ano_emenda INTEGER,
  fase TEXT NOT NULL,
  data_documento TEXT,
  codigo_documento TEXT NOT NULL,
  valor_empenhado_cents INTEGER,
  valor_pago_cents INTEGER,
  uf_aplicacao TEXT,
  municipio_aplicacao TEXT,
  ibge_aplicacao TEXT,
  localidade_aplicacao TEXT,
  favorecido_codigo TEXT,
  favorecido_nome TEXT,
  tipo_favorecido TEXT,
  modalidade_aplicacao TEXT,
  PRIMARY KEY (raw_sha256, source_row_id)
);
CREATE INDEX IF NOT EXISTS idx_docs_emenda ON cgu_documentos (emenda_code, fase);
CREATE TABLE IF NOT EXISTS cgu_documentos_selecao (
  source_id TEXT PRIMARY KEY,
  raw_sha256 TEXT NOT NULL UNIQUE
);
CREATE VIEW IF NOT EXISTS cgu_documentos_ativos AS
 SELECT d.* FROM cgu_documentos d JOIN cgu_documentos_selecao s ON s.raw_sha256 = d.raw_sha256;
"""


class ContractError(cgu.ContractError):
    pass


def member_name(zf: zipfile.ZipFile) -> str:
    names = zf.namelist()
    if len(names) != 1 or not names[0].endswith('_EmendasParlamentares_PorDocumento.csv'):
        raise ContractError(f'ZIP de documentos fora do padrão: {names}')
    return names[0]


def header(zf: zipfile.ZipFile, member: str) -> list[str]:
    import csv
    import io
    with zf.open(member) as fh:
        return next(csv.reader(io.TextIOWrapper(fh, encoding='cp1252', newline=''), delimiter=';'))


def freeze_contract(entries: list[dict]) -> dict:
    """Congela o cabeçalho real (igual nos 7 anos) como contrato. Divergência entre anos = erro."""
    heads = {}
    for e in entries:
        with zipfile.ZipFile(verify(e)) as zf:
            heads[e['source_id']] = header(zf, member_name(zf))
    first = next(iter(heads.values()))
    diff = [k for k, h in heads.items() if h != first]
    if diff:
        raise ContractError(f'Cabeçalho difere entre anos: {diff}')
    return {'source_id': 'cgu_documentos', 'contract_version': '2026-11-19', 'encoding': 'cp1252', 'delimiter': ';',
            'derived_from': {e['source_id']: e['raw_sha256'] for e in entries}, 'columns': first,
            'notes': ['Ano do arquivo = ano do documento (não da emenda).',
                      '"Valor Empenhado" só vale para documento de empenho; "Valor Pago" só para pagamento (dicionário oficial).',
                      'Dicionário oficial não lista "Possui Apoiador/Solicitante?", presente no arquivo.']}


def load_contract() -> dict:
    return json.loads(CONTRACT_PATH.read_text(encoding='utf-8'))


def relevant_codes(con: sqlite3.Connection, sid: int) -> set[str]:
    """Emendas com linha no recorte CE + todas as emendas de autores ligados a parlamentar eleito pelo CE."""
    ce = {c for (c,) in con.execute("SELECT DISTINCT emenda_code FROM cgu_emenda_lines WHERE snapshot_id = ? AND emenda_code IS NOT NULL "
                                    "AND territorial_scope IN ('municipio','estado','multiplo')", (sid,))}
    review = json.loads((CONTRACTS_DIR / 'autores_vinculo.json').read_text(encoding='utf-8')).get('vinculos', {})
    eleitos = {(c, i) for c, i in con.execute('SELECT casa, id FROM parlamentares WHERE eleito_ce = 1')} if con.execute(
        "SELECT 1 FROM sqlite_master WHERE name = 'parlamentares'").fetchone() else set()
    autores_ce = [code for code, r in review.items() if r.get('status') == 'revisado' and (r['casa'], str(r['id'])) in eleitos]
    if autores_ce:
        q = f"SELECT DISTINCT emenda_code FROM cgu_emenda_lines WHERE snapshot_id = ? AND emenda_code IS NOT NULL AND autor_codigo IN ({','.join('?' * len(autores_ce))})"
        ce |= {c for (c,) in con.execute(q, (sid, *autores_ce))}
    return ce


def selected_sources(con):
    if not con.execute("SELECT 1 FROM sqlite_master WHERE name='cgu_documentos_selecao'").fetchone():
        return {}
    return dict(con.execute('SELECT source_id, raw_sha256 FROM cgu_documentos_selecao ORDER BY source_id'))


def load(con: sqlite3.Connection, entries: list[dict], codes: set[str], contract: dict) -> dict:
    import csv
    import io
    con.executescript(SCHEMA)
    stats: dict = defaultdict(int)
    if not entries or len({e['source_id'] for e in entries}) != len(entries):
        raise ContractError('Seleção de documentos vazia ou com fontes repetidas')
    with con:
        for e in entries:
            con.execute('DELETE FROM cgu_documentos WHERE raw_sha256 = ?', (e['raw_sha256'],))
            rows = []
            with zipfile.ZipFile(verify(e)) as zf:
                member = member_name(zf)
                with zf.open(member) as fh:
                    reader = csv.reader(io.TextIOWrapper(fh, encoding='cp1252', errors='strict', newline=''), delimiter=';')
                    head = next(reader)
                    if head != contract['columns']:
                        raise ContractError(f'{e["source_id"]}: cabeçalho diverge do contrato')
                    ix = {c: i for i, c in enumerate(head)}
                    for row in reader:
                        stats['docs_lidos'] += 1
                        code = cgu.clean(row[ix['Código da Emenda']])
                        uf = cgu.clean(row[ix['UF de aplicação do recurso']])
                        if code not in codes and uf != 'CE':
                            continue
                        tipo = cgu.clean(row[ix['Tipo Favorecido']])
                        fcod, fnome = cgu.clean(row[ix['Código favorecido']]), cgu.clean(row[ix['Favorecido']])
                        fcod, fnome, masked = cgu.mask_favorecido(tipo, None, fcod, fnome)
                        if not masked and fnome and _MEI.match(fnome):
                            fcod, fnome, masked = None, cgu.MASKED_EI, True
                        stats['favorecidos_mascarados'] += masked
                        ano = cgu.clean(row[ix['Ano da Emenda']])
                        rows.append((e['raw_sha256'], f'{member}:{reader.line_num}', code, int(ano) if ano and ano.isdigit() else None,
                                     row[ix['Fase da despesa']].strip(), cgu.clean(row[ix['Data Documento']]), row[ix['Código Documento']].strip(),
                                     cgu.cents(row[ix['Valor Empenhado']]), cgu.cents(row[ix['Valor Pago']]),
                                     uf, cgu.clean(row[ix['Município de aplicação do recurso']]), cgu.clean(row[ix['Código IBGE do município de aplicação do recurso']]),
                                     cgu.clean(row[ix['Localidade de aplicação do recurso']]), fcod, fnome, tipo,
                                     cgu.clean(row[ix['Modalidade Aplicação Despesa']])))
            con.executemany(f'INSERT INTO cgu_documentos VALUES ({",".join("?" * 17)})', rows)
            stats[f'docs_guardados_{e["source_id"][-4:]}'] = len(rows)
        con.execute('DELETE FROM cgu_documentos_selecao')
        con.executemany('INSERT INTO cgu_documentos_selecao VALUES (?,?)', [(e['source_id'], e['raw_sha256']) for e in entries])
    return dict(stats)


def reconcile(con: sqlite3.Connection, sid: int) -> dict:
    """Seleciona códigos no CE; compara a emenda inteira, sem confundir fases."""
    from .audit_conciliacao import build, summarize
    records = [r for r in build(con, sid) if r['recorte_ce']]
    summary = summarize(records)
    p = summary['padroes']
    out = {'emendas': len(records), 'sem_documentos': p['sem_documentos'],
           'h1_igual': p['confere'], 'so_pago_igual': p['igual_so_pago'],
           'nenhum': p['abaixo'] + p['acima'], 'indisponivel': p['indisponivel'],
           'comparaveis': summary['comparaveis'],
           'empenho_igual': summary['empenho_confere'], 'empenho_comparavel': summary['empenho_comparavel'],
           'com_empenho': summary['com_empenho'],
           'diff_examples': [(r['code'], r['ano'], r['pago'], r['rap_pagos'], r['documentos_pago'])
                             for r in records if r['status'] == 'diverge'][:12],
           'por_ano': defaultdict(lambda: defaultdict(int)),
           'docs_por_emenda_max': max((r['documentos_total'] for r in records), default=0)}
    for r in records:
        pa = out['por_ano'][r['ano']]
        pa['emendas'] += 1
        key = {'confere': 'h1_igual', 'igual_so_pago': 'so_pago_igual', 'abaixo': 'nenhum', 'acima': 'nenhum'}.get(r['padrao'], r['padrao'])
        pa[key] += 1
    # Rastreabilidade é uma medida territorial separada da conciliação da emenda inteira.
    out['ganho'] = con.execute(
        f"SELECT l.territorial_scope, COUNT(DISTINCT d.emenda_code), {sql_total('d.valor_pago_cents')} FROM cgu_documentos_ativos d "
        "JOIN (SELECT DISTINCT emenda_code, territorial_scope FROM cgu_emenda_lines WHERE snapshot_id = ? AND ano BETWEEN 2020 AND 2026 "
        "AND territorial_scope IN ('estado','multiplo','nacional')) l ON l.emenda_code = d.emenda_code "
        "WHERE d.fase LIKE 'Pagamento%' AND d.uf_aplicacao = 'CE' AND d.ibge_aplicacao IS NOT NULL GROUP BY 1", (sid,)).fetchall()
    return out


def aplicacao_por_municipio(con: sqlite3.Connection) -> dict[str, dict[str, dict]]:
    """Frente A: pago por município de APLICAÇÃO (documentos de pagamento), por ano da emenda 2020–2026.

    Medida separada da "localidade da emenda" — as duas nunca se somam. Documento sem código IBGE de
    aplicação não entra. Retorna {ibge: {ano: {pago, emendas, documentos}}}.
    """
    if not con.execute("SELECT 1 FROM sqlite_master WHERE name = 'cgu_documentos'").fetchone():
        return {}
    out: dict[str, dict[str, dict]] = defaultdict(dict)
    for ibge, ano, pago, n_em, n_doc in con.execute(
            f"SELECT ibge_aplicacao, ano_emenda, {sql_total('valor_pago_cents')}, COUNT(DISTINCT emenda_code), COUNT(*) FROM cgu_documentos_ativos "
            "WHERE fase LIKE 'Pagamento%' AND uf_aplicacao = 'CE' AND ibge_aplicacao IS NOT NULL AND ano_emenda BETWEEN 2020 AND 2026 "
            "GROUP BY 1, 2"):
        out[ibge][str(ano)] = {'pago': pago, 'emendas': n_em, 'documentos': n_doc}
    return out


def write_report(entry: dict, entries: list[dict], stats: dict, rec: dict, out_dir: Path = REPORTS_DIR) -> Path:
    tag = f"{entry['downloaded_at'][:10]}-{entry['raw_sha256'][:8]}"
    com_docs = rec['comparaveis']
    pct = lambda a, b: f'{a / b * 100:.1f}%'.replace('.', ',') if b else '—'
    L = [f'# Conciliação com documentos de despesa — recorte Ceará (snapshot {entry["raw_sha256"][:8]})', '',
         '> Incremento 2. Gerado por `python pipelines/run.py documentos`. Dados oficiais **em validação**: não publicar.', '',
         '- Arquivos: ' + ', '.join(f'{e["source_id"][-4:]} (`{e["raw_sha256"][:8]}`)' for e in entries) + '.',
         f'- Documentos lidos: {num(stats["docs_lidos"])}; guardados (ligados ao recorte ou com aplicação no CE): '
         f'{num(sum(v for k, v in stats.items() if k.startswith("docs_guardados")))}; favorecidos mascarados: {num(stats["favorecidos_mascarados"])}.', '',
         '## 1. Pago: documentos × arquivo por emenda (hipótese H1)', '',
         'Para cada emenda com código oficial, de 2020 a 2026, no recorte CE: soma dos documentos na fase **Pagamento** (todos os anos de documento) '
         'comparada com todas as linhas desse código no arquivo por emenda, inclusive localidades fora do CE. A seleção territorial não recorta os valores de uma emenda na comparação documental.', '',
         table(['Resultado', 'Emendas', '% das comparáveis'], [
             ['Documentos = Pago + RAP pagos (H1)', num(rec['h1_igual']), pct(rec['h1_igual'], com_docs)],
             ['Documentos = só Pago', num(rec['so_pago_igual']), pct(rec['so_pago_igual'], com_docs)],
             ['Nenhum dos dois', num(rec['nenhum']), pct(rec['nenhum'], com_docs)],
             ['Conciliação indisponível (valores incompletos)', num(rec['indisponivel']), '—'],
             ['Sem documento de pagamento', num(rec['sem_documentos']), '—'],
         ], 'lrr'), '',
         'Quando "RAP pagos" é zero, as duas linhas coincidem; a emenda conta em H1. Igualdade apenas com Pago continua divergente do total. Sem pagamento documentado não é zero nem divergência.', '']
    rows = []
    for ano in sorted(rec['por_ano']):
        p = rec['por_ano'][ano]
        rows.append([ano, num(p['emendas']), num(p['h1_igual']), num(p['so_pago_igual']), num(p['nenhum']), num(p['sem_documentos']), num(p['indisponivel'])])
    L += [table(['Ano da emenda', 'Emendas', 'H1', 'Só pago', 'Nenhum', 'Sem pagamento', 'Incompletas'], rows, 'lrrrrrr'), '']
    if rec['diff_examples']:
        L += ['### Exemplos sem conciliação (para investigar)', '',
              table(['Emenda', 'Ano', 'Pago', 'RAP pagos', 'Documentos (pago)'], [[c, a, brl(p), brl(r), brl(d)] for c, a, p, r, d in rec['diff_examples']], 'llrrr'), '']
    L += ['## 2. Empenho: documentos × arquivo por emenda', '',
          f'{num(rec["empenho_igual"])} de {num(rec["empenho_comparavel"])} emendas comparáveis de empenho ({pct(rec["empenho_igual"], rec["empenho_comparavel"])}) têm soma de empenhos igual ao "Valor Empenhado". Há {num(rec["com_empenho"])} emendas com documento de empenho. '
          'O dicionário avisa que, a partir de 2021, a data do empenho é a da última alteração — o valor pode refletir reforços e anulações.', '',
          '## 3. Contagem única (AC03)', '',
          f'Cada emenda conta uma vez: os totais vêm do arquivo por emenda; documentos só conciliam. Maior número de documentos numa emenda: {num(rec["docs_por_emenda_max"])}.', '',
          '## 4. Ganho de rastreabilidade', '',
          'Emendas sem município no arquivo por emenda ("aplicação estadual", "vários municípios", "Nacional") que têm documento de **pagamento** com município de aplicação no Ceará:', '',
          table(['Escopo no arquivo por emenda', 'Emendas', 'Pago com município de aplicação no CE'], [[s, num(n), brl(v)] for s, n, v in rec['ganho']], 'lrr'), '',
          'A localidade de aplicação segue a regra oficial (localidade do favorecido para transferências a municípios/estados; senão, regionalização do gasto). Não prova o local da entrega.', '']
    path = out_dir / f'conciliacao-documentos-{tag}.md'
    path.write_text('\n'.join(L), encoding='utf-8')
    return path


def run(db_path: Path = STAGING_DB) -> int:
    entry = latest('cgu_emendas')
    entries = [latest(f'cgu_documentos_{a}') for a in YEARS]
    if not all(entries):
        raise SystemExit('Sem snapshots dos documentos. Rode: python pipelines/run.py snapshot')
    if not CONTRACT_PATH.exists():
        CONTRACT_PATH.write_text(json.dumps(freeze_contract(entries), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(f'[documentos] contrato congelado em {CONTRACT_PATH.name}')
    contract = load_contract()
    con = sqlite3.connect(db_path)
    try:
        sid = con.execute('SELECT id FROM snapshots WHERE raw_sha256 = ?', (entry['raw_sha256'],)).fetchone()[0]
        codes = relevant_codes(con, sid)
        with con:
            stats = load(con, entries, codes, contract)
        rec = reconcile(con, sid)
    finally:
        con.close()
    path = write_report(entry, entries, stats, rec)
    com = rec['comparaveis']
    print(f"[documentos] {num(stats['docs_lidos'])} lidos · {rec['emendas']} emendas CE 2020–2026 · H1 {rec['h1_igual']}/{com} · "
          f"só pago {rec['so_pago_igual']} · nenhum {rec['nenhum']} · sem docs {rec['sem_documentos']} · {path.name}")
    from .audit_conciliacao import run as audit
    return audit(db_path)
