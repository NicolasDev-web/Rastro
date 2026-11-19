"""Aba de autores: vínculo CGU → parlamentar (ADR-009), agregados por autor e export (SPEC 04, T04.04).

Regras (SPEC 04 → Fichas de autores):
- autor individual = emenda individual com código SIAFI de autor; bancada, comissão, relator e
  "sem informação" são autoria coletiva/não identificada e nunca entram em pessoa (AC09);
- eleitos pelo CE: todas as emendas; demais autores: só as com localidade no CE;
- vínculo por nome exato normalizado fica 'em_revisao' até o arquivo de revisão confirmar (AC11);
- destino com município → rastreável; demais → só valor.
"""
from __future__ import annotations

import json
import sqlite3
from collections import defaultdict
from pathlib import Path

from . import CONTRACTS_DIR, REPORTS_DIR, STAGING_DB, VALIDATION_DIR
from . import cgu
from .fmt import brl, num, table
from .snapshot import latest

YEARS = list(range(2020, 2027))
CE_SCOPES = ('municipio', 'estado', 'multiplo')
REVIEW_FILE = CONTRACTS_DIR / 'autores_vinculo.json'
METRICS = ('empenhado', 'liquidado', 'pago', 'rap_pagos')
WARNING = ('DADOS OFICIAIS EM VALIDAÇÃO — autoria formal segundo o SIAFI (CGU) e vínculo com Câmara/Senado por nome, '
           'ainda sem revisão humana completa. Não publicar.')
UNTRACEABLE_LABEL = {
    'multiplo': 'Vários municípios', 'estado': 'Aplicação estadual', 'nacional': 'Nacional',
    'regional': 'Regional', 'exterior': 'Exterior', 'sem_uf': 'Sem localidade',
}


def is_individual(tipo: str, autor_codigo: str | None) -> bool:
    return tipo.startswith('Emenda Individual') and autor_codigo is not None


def load_review(path: Path = REVIEW_FILE) -> dict[str, dict]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding='utf-8')).get('vinculos', {})


def link_authors(con: sqlite3.Connection, sid: int, review: dict[str, dict]) -> dict[str, dict]:
    """Retorna {autor_codigo: {nomes, casa, id, metodo, status, candidatos}} para autores individuais 2020–2026."""
    names: dict[str, set[str]] = defaultdict(set)
    for code, name in con.execute("SELECT DISTINCT autor_codigo, autor_nome FROM cgu_emenda_lines WHERE snapshot_id = ? AND ano BETWEEN 2020 AND 2026 "
                                  "AND tipo LIKE 'Emenda Individual%' AND autor_codigo IS NOT NULL", (sid,)):
        if name:
            names[code].add(name)
    by_norm: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for casa, pid, norm in con.execute('SELECT casa, id, nome_norm FROM parlamentares'):
        by_norm[norm].append((casa, pid))
    out = {}
    for code, ns in sorted(names.items()):
        cands = sorted({c for n in ns for c in by_norm.get(cgu.normalize_name(n), [])})
        link = {'nomes': sorted(ns), 'casa': None, 'id': None, 'metodo': None, 'status': 'pendente', 'candidatos': cands, 'nota': None}
        if len(ns) > 1:
            link['nota'] = 'mesmo código SIAFI com nomes diferentes na fonte'
        elif len(cands) == 1:
            link.update(casa=cands[0][0], id=cands[0][1], metodo='nome_exato', status='em_revisao')
        elif len(cands) > 1:
            link['nota'] = 'mais de um parlamentar com o mesmo nome'
        r = review.get(code)
        if r:  # revisão humana prevalece
            if r.get('status') == 'revisado':
                link.update(casa=r['casa'], id=str(r['id']), metodo='revisao_humana', status='revisado', nota=r.get('nota'))
            elif r.get('status') == 'rejeitado':
                link.update(casa=None, id=None, metodo='revisao_humana', status='rejeitado', nota=r.get('nota'))
        out[code] = link
    return out


def _sum(rows) -> dict:
    acc = {'emendas': set(), **{m: None for m in METRICS}}
    for r in rows:
        acc['emendas'].add(r['technical_id'])
        for m in METRICS:
            v = r[f'{m}_cents']
            if v is not None:
                acc[m] = (acc[m] or 0) + v
    return {**acc, 'emendas': len(acc['emendas'])}


def _title(name: str) -> str:
    small = {'DE', 'DA', 'DO', 'DAS', 'DOS', 'E'}
    return ' '.join(w.capitalize() if w not in small else w.lower() for w in name.split())


def build(con: sqlite3.Connection, entry: dict, links: dict[str, dict], photos: dict[tuple[str, str], str]) -> dict:
    con.row_factory = sqlite3.Row
    sid = con.execute('SELECT id FROM snapshots WHERE raw_sha256 = ?', (entry['raw_sha256'],)).fetchone()[0]
    parl = {(r['casa'], r['id']): dict(r) for r in con.execute('SELECT * FROM parlamentares')}
    ce_names = {r['ibge_code']: r['name'] for r in con.execute('SELECT ibge_code, name FROM municipalities')}
    lines = [dict(r) for r in con.execute('SELECT * FROM cgu_emenda_lines WHERE snapshot_id = ? AND ano BETWEEN 2020 AND 2026', (sid,))]
    snap_date = next(iter(parl.values()))['snapshot_date'] if parl else None

    by_author: dict[str, list[dict]] = defaultdict(list)
    collective: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for r in lines:
        if is_individual(r['tipo'], r['autor_codigo']):
            by_author[r['autor_codigo']].append(r)
        elif r['territorial_scope'] in CE_SCOPES:
            collective[(r['autor_nome'] or 'Autor não identificado na fonte', r['tipo'])].append(r)

    authors = []
    for code, rows in by_author.items():
        link = links.get(code, {'status': 'pendente', 'casa': None, 'id': None, 'metodo': None, 'nomes': [rows[0]['autor_nome']]})
        p = parl.get((link['casa'], link['id'])) if link.get('casa') and link['status'] != 'rejeitado' else None
        eleito_ce = bool(p and p['eleito_ce'])
        scope_rows = rows if eleito_ce else [r for r in rows if r['territorial_scope'] in CE_SCOPES]
        if not scope_rows:
            continue
        years = {str(y): None for y in YEARS}
        for y in YEARS:
            yr = [r for r in scope_rows if r['ano'] == y]
            if yr:
                years[str(y)] = _sum(yr)
        traceable: dict[str, list[dict]] = defaultdict(list)
        untraceable: dict[str, list[dict]] = defaultdict(list)
        for r in scope_rows:
            mcode = r['municipio_ibge'] or (r['municipio_codigo'] if (r['municipio_codigo'] or '').isdigit() and len(r['municipio_codigo']) == 7 else None)
            if mcode:
                traceable[mcode].append(r)
            else:
                label = UNTRACEABLE_LABEL.get(r['territorial_scope'], 'Outra localidade')
                if r['territorial_scope'] in ('multiplo', 'estado'):
                    label += ' — Ceará'
                elif r['territorial_scope'] == 'outra_uf':
                    label = f"{'Vários municípios' if 'MÚLTIPLO' in r['localidade'].upper() else 'Aplicação estadual'} — {_title(r['uf'] or '')}".strip(' —')
                untraceable[label].append(r)
        emendas = defaultdict(list)
        for r in scope_rows:
            emendas[r['technical_id']].append(r)
        name_src = sorted(link.get('nomes') or [rows[0]['autor_nome']])[0]
        authors.append({
            'id': f'siafi-{code}',
            'siafi_code': code,
            'cgu_name': name_src,
            'display_name': p['nome'] if p else _title(name_src),
            'casa': p['casa'] if p else None,
            'parl_id': p['id'] if p else None,
            'partido_atual': p['partido_atual'] if p else None,
            'uf': p['uf'] if p else None,
            'eleito_ce': eleito_ce,
            'scope': 'todas' if eleito_ce else 'somente_ce',
            'link': {'status': link['status'], 'metodo': link.get('metodo'), 'nota': link.get('nota')},
            'photo': photos.get((p['casa'], p['id'])) if p else None,
            'photo_credit': ('Foto: Câmara dos Deputados' if p['casa'] == 'camara' else 'Foto: Senado Federal') if p and photos.get((p['casa'], p['id'])) else None,
            'profile_url': p['url_perfil'] if p else None,
            'years': years,
            'total': _sum(scope_rows),
            'traceable': sorted(({'ibge': m, 'name': ce_names.get(m) or _title(rs[0]['municipio_nome'] or m), 'uf': 'CE' if m in ce_names else _title(rs[0]['uf'] or ''), **_sum(rs)} for m, rs in traceable.items()), key=lambda d: (d['uf'] != 'CE', d['name'])),
            'untraceable': sorted(({'label': k, **_sum(rs)} for k, rs in untraceable.items()), key=lambda d: d['label']),
            'emendas': sorted(({'code': rs[0]['emenda_code'], 'technical_id': t, 'ano': rs[0]['ano'], 'tipo': rs[0]['tipo'],
                                'localidades': sorted({r['localidade'] for r in rs}), **{m: _sum(rs)[m] for m in METRICS}}
                               for t, rs in emendas.items()), key=lambda d: (-d['ano'], d['technical_id'])),
        })
    authors.sort(key=lambda a: cgu.normalize_name(a['display_name']))

    coll = []
    for (label, tipo), rs in sorted(collective.items()):
        years = {str(y): (_sum([r for r in rs if r['ano'] == y]) if any(r['ano'] == y for r in rs) else None) for y in YEARS}
        coll.append({'label': label, 'tipo': tipo, 'years': years, 'total': _sum(rs)})  # rótulo exatamente como na fonte

    return {
        'kind': 'VALIDACAO', 'warning': WARNING, 'coverage': 'unverified',
        'source': 'CGU — Portal da Transparência, Emendas Parlamentares (arquivo único); Câmara dos Deputados e Senado Federal (dados abertos)',
        'snapshot': {'raw_sha256': entry['raw_sha256'], 'downloaded_at': entry['downloaded_at']},
        'parlamentares_as_of': snap_date, 'years': YEARS, 'unit': 'centavos de real (BRL)',
        'authors': authors, 'collective': coll,
    }


def relevant_codes(con: sqlite3.Connection, sid: int, links: dict[str, dict]) -> set[str]:
    """Autores que entram na aba: com emenda localizada no CE ou vinculados a parlamentar eleito pelo CE."""
    ce = {c for (c,) in con.execute("SELECT DISTINCT autor_codigo FROM cgu_emenda_lines WHERE snapshot_id = ? AND ano BETWEEN 2020 AND 2026 "
                                    "AND territorial_scope IN ('municipio', 'estado', 'multiplo') AND autor_codigo IS NOT NULL", (sid,))}
    eleitos = {(c, i) for c, i in con.execute('SELECT casa, id FROM parlamentares WHERE eleito_ce = 1')}
    return {code for code, l in links.items() if code in ce or any(cand in eleitos for cand in l['candidatos'])}


def write_link_report(links: dict[str, dict], con: sqlite3.Connection, entry: dict, out_dir: Path = REPORTS_DIR) -> Path:
    parl = {(c, i): (n, p, u) for c, i, n, p, u in con.execute('SELECT casa, id, nome, partido_atual, uf FROM parlamentares')}
    rows = []
    for code, l in sorted(links.items(), key=lambda kv: kv[1]['nomes'][0]):
        cand = '; '.join(f'{c} {i} ({parl[(c, i)][0]}, {parl[(c, i)][1]}-{parl[(c, i)][2]})' for c, i in l['candidatos'] if (c, i) in parl) or '—'
        rows.append([code, ' / '.join(l['nomes']), cand, l['status'], l.get('nota') or '', '[ ] confere'])
    counts = defaultdict(int)
    for l in links.values():
        counts[l['status']] += 1
    path = out_dir / f"autores-vinculo-{entry['downloaded_at'][:10]}-{entry['raw_sha256'][:8]}.md"
    path.write_text('\n'.join([
        f"# Vínculo autor CGU → parlamentar (snapshot {entry['raw_sha256'][:8]})", '',
        '> ADR-009. Gerado por `python pipelines/run.py autores`. O revisor confere cada linha e registra a decisão em `pipelines/contracts/autores_vinculo.json`.', '',
        '- Situação: ' + ', '.join(f'{k}: {num(v)}' for k, v in sorted(counts.items())) + '.',
        '- `em_revisao` = um único parlamentar com o mesmo nome (normalizado) nas listas da 56ª/57ª legislatura. **Não é vínculo confirmado.**',
        '- `pendente` = nenhum ou vários candidatos, ou código SIAFI com nomes diferentes.', '',
        'Para confirmar, adicione ao JSON: `"<código SIAFI>": {"casa": "camara|senado", "id": "<id>", "status": "revisado", "revisor": "<nome>", "data": "AAAA-MM-DD"}`.', '',
        table(['SIAFI', 'Nome na CGU', 'Candidato(s)', 'Status', 'Nota', 'Revisor'], rows),
    ]) + '\n', encoding='utf-8')
    return path


def run(db_path: Path = STAGING_DB) -> Path:
    from . import parlamentares
    entry = latest('cgu_emendas')
    print('[autores] baixando listas da Câmara e do Senado…')
    for e in parlamentares.acquire_lists():
        if not e['reused']:
            print(f"  novo snapshot: {e['source_id']} ({num(e['bytes'])} bytes)")
    con = sqlite3.connect(db_path)
    try:
        with con:
            stats = parlamentares.load(con)
        sid = con.execute('SELECT id FROM snapshots WHERE raw_sha256 = ?', (entry['raw_sha256'],)).fetchone()[0]
        all_links = link_authors(con, sid, load_review())
        keep = relevant_codes(con, sid, all_links)
        links = {c: l for c, l in all_links.items() if c in keep}
        keys = sorted({(l['casa'], l['id']) for l in links.values() if l['casa'] and l['status'] != 'rejeitado'})
        photos = parlamentares.fetch_photos(con, keys)  # só retratos de quem aparece na aba
        payload = build(con, entry, links, photos)
        report = write_link_report(links, con, entry)
    finally:
        con.close()
    from . import alece
    deputies, alece_date = alece.run()
    payload['state_deputies'] = [{k: d[k] for k in ('slug', 'nome', 'partido_atual', 'situacao', 'photo', 'url_perfil')}
                                 | {'photo_credit': 'Foto: Assembleia Legislativa do Ceará' if d['photo'] else None} for d in deputies]
    payload['state_deputies_as_of'] = alece_date
    payload['state_amendments_note'] = ('Emendas estaduais do Ceará não são impositivas e não têm fonte estruturada verificada: '
                                        'o quadro das emendas aprovadas sai em PDF na LOA (DOE) e o relatório da Seplag exigido '
                                        'pela Lei estadual nº 19.851 não estava acessível em 19/11/2026.')
    VALIDATION_DIR.mkdir(parents=True, exist_ok=True)
    path = VALIDATION_DIR / f"autores-{entry['downloaded_at'][:10]}-{entry['raw_sha256'][:8]}.json"
    path.write_text(json.dumps(payload, ensure_ascii=False, sort_keys=True, indent=1) + '\n', encoding='utf-8')
    st = defaultdict(int)
    for l in links.values():
        st[l['status']] += 1
    print(f"[autores] {stats['parlamentares']} parlamentares ({stats['eleitos_ce']} eleitos pelo CE) · vínculos: {dict(st)} · "
          f"{len(photos)} fotos · {len(payload['authors'])} autores no export · {len(payload['state_deputies'])} deputados estaduais (Alece) · {path.name} · {report.name}")
    return path
