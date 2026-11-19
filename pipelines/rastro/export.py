"""Export para o modo validação do site (ADR-008). Saída determinística (AC02).

Um registro por município (184) com valores por ano 2020–2026. Município sem linhas no ano = null
(o site mostra "Sem registro"), nunca zero. Valores em centavos inteiros.
"""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from . import STAGING_DB, VALIDATION_DIR
from . import cgu
from .snapshot import latest
from .documentos import aplicacao_por_municipio

YEARS = list(range(2020, 2027))
WARNING = ('DADOS OFICIAIS EM VALIDAÇÃO — extraídos do Portal da Transparência (CGU), ainda sem conferência amostral '
           'nem revisão editorial. Não publicar nem citar como resultado apurado.')
NON_MUNICIPAL = {
    'estado': ('Ceará — aplicação estadual', 'Localidade "CEARÁ (UF)": aplicação em âmbito estadual. Não identifica quem recebeu nem atribui a nenhum município.'),
    'multiplo': ('Ceará — vários municípios', 'Localidade "MÚLTIPLO": a despesa cobre mais de um município e o arquivo não permite repartir.'),
}


def _year_values(rows) -> dict[str, dict | None]:
    by_year = {str(y): None for y in YEARS}
    for ano, n, *vals in rows:
        by_year[str(ano)] = {'lines': n, **dict(zip(cgu.METRICS, vals))}
    return by_year


def build(con: sqlite3.Connection, entry: dict) -> dict:
    sid = con.execute('SELECT id FROM snapshots WHERE raw_sha256 = ?', (entry['raw_sha256'],)).fetchone()[0]
    sums = ', '.join(f'SUM({m}_cents)' for m in cgu.METRICS)
    q = f'SELECT ano, COUNT(*), {sums} FROM cgu_emenda_lines WHERE snapshot_id = ? AND ano BETWEEN 2020 AND 2026 AND {{cond}} GROUP BY ano ORDER BY ano'
    municipalities = []
    aplic = aplicacao_por_municipio(con)
    for code, name in con.execute('SELECT ibge_code, name FROM municipalities ORDER BY name COLLATE NOCASE'):
        rows = con.execute(q.format(cond="territorial_scope = 'municipio' AND municipio_ibge = ?"), (sid, code)).fetchall()
        # Frente A: critério "município de aplicação do pagamento" (documentos), separado do critério por emenda
        ap = {str(y): aplic.get(code, {}).get(str(y)) for y in YEARS}
        municipalities.append({'ibge_code': code, 'name': name, 'years': _year_values(rows), 'aplicacao': ap})
    non_municipal = []
    for scope, (label, note) in NON_MUNICIPAL.items():
        rows = con.execute(q.format(cond='territorial_scope = ?'), (sid, scope)).fetchall()
        non_municipal.append({'id': scope, 'label': label, 'note': note, 'years': _year_values(rows)})
    return {
        'kind': 'VALIDACAO',
        'warning': WARNING,
        'coverage': 'unverified',
        'source': 'CGU — Portal da Transparência, Emendas Parlamentares (arquivo único)',
        'source_url': entry['source_url'],
        'snapshot': {'raw_sha256': entry['raw_sha256'], 'downloaded_at': entry['downloaded_at'], 'source_last_modified': entry.get('last_modified')},
        'years': YEARS,
        'metrics': list(cgu.METRICS),
        'unit': 'centavos de real (BRL)',
        'rules': [
            'Empenhado, liquidado e pago não se somam. "pago" (no ano da emenda) + "rap_pagos" (anos seguintes) = pago total — confirmado pelos documentos de pagamento (SPEC 01, H1).',
            'Escopo territorial pelo código IBGE da UF e do município, nunca por texto.',
            'Ano sem linhas = null (sem registro), não zero.',
        ],
        'municipalities': municipalities,
        'non_municipal': non_municipal,
    }


def run(db_path: Path = STAGING_DB, out_dir: Path = VALIDATION_DIR) -> Path:
    entry = latest('cgu_emendas')
    con = sqlite3.connect(db_path)
    try:
        payload = build(con, entry)
    finally:
        con.close()
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"ce-municipios-{entry['downloaded_at'][:10]}-{entry['raw_sha256'][:8]}.json"
    path.write_text(json.dumps(payload, ensure_ascii=False, sort_keys=True, indent=1) + '\n', encoding='utf-8')
    with_data = sum(1 for m in payload['municipalities'] if any(v for v in m['years'].values()))
    print(f'[export] {path.name} · {len(payload["municipalities"])} municípios ({with_data} com registro em 2020–2026)')
    return path
