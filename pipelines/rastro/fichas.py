"""Frente B — dados das fichas de emenda e de município (modo validação).

Emendas: código oficial, 2020–2026, no recorte CE ou de autor eleito pelo CE (os documentos dessas
emendas estão completos no staging). Favorecidos chegam já mascarados (pessoa física/empresário individual).
"""
from __future__ import annotations

import glob
import json
import sqlite3
from collections import defaultdict
from pathlib import Path

from . import STAGING_DB, VALIDATION_DIR
from . import cgu
from .documentos import relevant_codes, selected_sources
from .money import total, sql_total
from .snapshot import latest

FASE_ORDEM = {'Empenho': 0, 'Liquidação': 1, 'Pagamento': 2}
CE_SCOPES = ('municipio', 'estado', 'multiplo')


def _iso(d: str | None) -> str | None:
    if not d or len(d) != 10 or d[2] != '/':
        return None
    return f'{d[6:]}-{d[3:5]}-{d[:2]}'


def _authors_with_page(entry) -> dict[str, str]:
    tag = f"{entry['downloaded_at'][:10]}-{entry['raw_sha256'][:8]}"
    files = sorted(glob.glob(str(VALIDATION_DIR / f'autores-{tag}.json')))
    if not files:
        raise ValueError('Export de autores do mesmo snapshot ausente; execute autores antes de fichas')
    return {a['siafi_code']: a['display_name'] for a in json.loads(Path(files[-1]).read_text(encoding='utf-8'))['authors']}


def build(con: sqlite3.Connection, entry: dict) -> tuple[dict, dict]:
    con.row_factory = sqlite3.Row
    sid = con.execute('SELECT id FROM snapshots WHERE raw_sha256 = ?', (entry['raw_sha256'],)).fetchone()[0]
    codes = relevant_codes(con, sid)
    authors = _authors_with_page(entry)
    ce_names = {r['ibge_code']: r['name'] for r in con.execute('SELECT ibge_code, name FROM municipalities')}

    lines = defaultdict(list)
    for r in con.execute('SELECT * FROM cgu_emenda_lines WHERE snapshot_id = ? AND emenda_code IS NOT NULL AND ano BETWEEN 2020 AND 2026', (sid,)):
        if r['emenda_code'] in codes:
            lines[r['emenda_code']].append(dict(r))
    docs = defaultdict(list)
    for r in con.execute('SELECT * FROM cgu_documentos_ativos WHERE emenda_code IS NOT NULL'):
        if r['emenda_code'] in lines:
            docs[r['emenda_code']].append(dict(r))
    conv = defaultdict(list)
    for r in con.execute('SELECT * FROM cgu_convenios_ce WHERE snapshot_id = ?', (sid,)):
        conv[r['emenda_code']].append({'numero': r['numero'], 'data_publicacao': _iso(r['data_publicacao']), 'convenente': r['convenente'],
                                       'objeto': r['objeto'], 'valor': r['valor_cents']})

    emendas = {}
    for code, ls in lines.items():
        sums = {m: total(l[f'{m}_cents'] for l in ls) for m in cgu.METRICS}
        pago_total = total([sums['pago'], sums['rap_pagos']])
        ds = docs.get(code, [])
        doc_pago = total(d['valor_pago_cents'] for d in ds if d['fase'].startswith('Pagamento'))
        status = ('sem_documentos' if not any(d['fase'].startswith('Pagamento') for d in ds) else
                  'indisponivel' if doc_pago is None or pago_total is None else
                  'confere' if doc_pago == pago_total else 'diverge')
        recebeu = defaultdict(lambda: {'parcelas': [], 'documentos': 0})
        for d in ds:
            if d['fase'].startswith('Pagamento'):
                k = (d['favorecido_nome'] or 'Sem informação', d['tipo_favorecido'], d['municipio_aplicacao'], d['uf_aplicacao'])
                recebeu[k]['parcelas'].append(d['valor_pago_cents'])
                recebeu[k]['documentos'] += 1
        a = ls[0]
        emendas[code] = {
            'code': code, 'ano': a['ano'], 'tipo': a['tipo'], 'autor_codigo': a['autor_codigo'], 'autor_nome': a['autor_nome'],
            'autor_ficha': f"siafi-{a['autor_codigo']}" if a['autor_codigo'] in authors else None,
            'coletiva': not (a['tipo'].startswith('Emenda Individual') and a['autor_codigo']),
            'localidades': sorted({(l['localidade'], l['territorial_scope'], l['municipio_ibge']) for l in ls}),
            'funcao': a['funcao'], 'acao': a['acao'],
            **sums, 'pago_total': pago_total,
            'conciliacao': {'status': status, 'documentos_pago': doc_pago},
            'documentos': sorted(({'data': _iso(d['data_documento']), 'fase': d['fase'], 'documento': d['codigo_documento'],
                                   'valor': d['valor_pago_cents'] if d['fase'].startswith('Pagamento') else d['valor_empenhado_cents'] if d['fase'].startswith('Empenho') else None,
                                   'municipio_aplicacao': d['municipio_aplicacao'], 'uf_aplicacao': d['uf_aplicacao'], 'ibge_aplicacao': d['ibge_aplicacao'],
                                   'favorecido': d['favorecido_nome'], 'modalidade': d['modalidade_aplicacao']} for d in ds),
                                 key=lambda x: (x['data'] or '', FASE_ORDEM.get(x['fase'], 9), x['documento'])),
            'quem_recebeu': sorted(({'favorecido': k[0], 'tipo': k[1], 'municipio': k[2], 'uf': k[3], 'valor': total(v['parcelas']), 'documentos': v['documentos']} for k, v in recebeu.items()),
                                   key=lambda x: -(x['valor'] or 0)),
            'convenios': conv.get(code, []),
        }
    for e in emendas.values():
        e['localidades'] = [{'localidade': l, 'escopo': s, 'ibge': i} for l, s, i in e['localidades']]

    # municípios
    autor_por_code = {c: (e['autor_codigo'], e['autor_nome'], e['tipo']) for c, e in emendas.items()}
    extra = {r['emenda_code']: (r['autor_codigo'], r['autor_nome'], r['tipo']) for r in con.execute(
        'SELECT emenda_code, autor_codigo, autor_nome, tipo FROM cgu_emenda_lines WHERE snapshot_id = ? AND emenda_code IS NOT NULL GROUP BY emenda_code', (sid,))}
    munis = {}
    for ibge, name in ce_names.items():
        loc = [{'code': c, 'ano': e['ano'], 'tipo': e['tipo'], 'autor': e['autor_nome'], 'pago_total': e['pago_total'], 'ficha': True}
               for c, e in emendas.items() if any(l['ibge'] == ibge for l in e['localidades'])]
        apl = []
        for code, ano, pago, n in con.execute(f"SELECT emenda_code, ano_emenda, {sql_total('valor_pago_cents')}, COUNT(*) FROM cgu_documentos_ativos WHERE fase LIKE 'Pagamento%' "
                                              "AND ibge_aplicacao = ? AND ano_emenda BETWEEN 2020 AND 2026 AND emenda_code IS NOT NULL GROUP BY 1, 2", (ibge,)):
            ac, an, tp = autor_por_code.get(code) or extra.get(code) or (None, None, None)
            apl.append({'code': code, 'ano': ano, 'pago': pago, 'documentos': n, 'autor': an, 'tipo': tp, 'ficha': code in emendas})
        autores = sorted({(f'siafi-{ac}', authors[ac]) for c in [x['code'] for x in loc + apl]
                          for ac in [(autor_por_code.get(c) or extra.get(c) or (None,))[0]] if ac in authors}, key=lambda t: cgu.normalize_name(t[1]))
        fav = [{'favorecido': n, 'natureza': nat, 'valor': v, 'lancamentos': q} for n, nat, v, q in con.execute(
            f"SELECT favorecido_nome, natureza_juridica, {sql_total('valor_cents')}, COUNT(*) FROM cgu_favorecidos_ce WHERE snapshot_id = ? AND municipio_ibge = ? "
            "AND ano_mes >= '202001' GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 40", (sid, ibge))]
        munis[ibge] = {'ibge': ibge, 'name': name,
                       'emendas_localidade': sorted(loc, key=lambda x: (-x['ano'], x['code'])),
                       'emendas_aplicacao': sorted(apl, key=lambda x: (-x['ano'], -(x['pago'] or 0))),
                       'autores': [{'id': i, 'name': n} for i, n in autores],
                       'favorecidos': fav}
    meta = {'kind': 'VALIDACAO', 'document_sources': selected_sources(con), 'snapshot': {'raw_sha256': entry['raw_sha256'], 'downloaded_at': entry['downloaded_at']}}
    return {**meta, 'emendas': emendas}, {**meta, 'municipios': munis}


def run(db_path: Path = STAGING_DB) -> None:
    entry = latest('cgu_emendas')
    con = sqlite3.connect(db_path)
    try:
        em, mu = build(con, entry)
    finally:
        con.close()
    tag = f"{entry['downloaded_at'][:10]}-{entry['raw_sha256'][:8]}"
    VALIDATION_DIR.mkdir(parents=True, exist_ok=True)
    for name, payload in (('emendas', em), ('municipios', mu)):
        (VALIDATION_DIR / f'{name}-{tag}.json').write_text(json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(',', ':')) + '\n', encoding='utf-8')
    st = defaultdict(int)
    for e in em['emendas'].values():
        st[e['conciliacao']['status']] += 1
    print(f"[fichas] {len(em['emendas'])} emendas ({dict(st)}) · {len(mu['municipios'])} municípios · emendas-{tag}.json · municipios-{tag}.json")
