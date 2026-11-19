"""Carga no staging SQLite (SPEC 01: T01.03, T01.05, T01.06; AC01, AC02, AC04–AC09).

Idempotente por snapshot: a carga apaga e recarrega o mesmo snapshot numa única transação.
"""
from __future__ import annotations

import json
import sqlite3
import zipfile
from collections import defaultdict
from pathlib import Path

from . import RAW_DIR, ROOT, STAGING_DB
from . import cgu
from .snapshot import latest, verify

SCHEMA = ROOT / 'db' / 'staging' / '001_staging.sql'
SCHEMA_VERSION = 2  # 2: staging guarda todas as linhas do arquivo (aba de autores)
CE_SCOPES = ('municipio', 'estado', 'multiplo')
DATA_TABLES = ('cgu_emenda_lines', 'cgu_outside_summary', 'cgu_favorecidos_ce', 'cgu_convenios_ce', 'load_exceptions')


def connect(db_path: Path = STAGING_DB) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(db_path)
    if con.execute('PRAGMA user_version').fetchone()[0] != SCHEMA_VERSION:
        # staging é derivado do raw: recriar é seguro e evita migrações manuais
        for (name,) in con.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").fetchall():
            con.execute(f'DROP TABLE IF EXISTS {name}')
        con.execute(f'PRAGMA user_version = {SCHEMA_VERSION}')
    con.execute('PRAGMA foreign_keys = ON')
    con.executescript(SCHEMA.read_text(encoding='utf-8'))
    return con


def _insert(con: sqlite3.Connection, table: str, rows: list[tuple]) -> None:
    if rows:
        con.executemany(f'INSERT INTO {table} VALUES ({",".join("?" * len(rows[0]))})', rows)


def _upsert_snapshot(con: sqlite3.Connection, entry: dict, contract_version: str | None) -> int:
    row = con.execute('SELECT id FROM snapshots WHERE raw_sha256 = ?', (entry['raw_sha256'],)).fetchone()
    if row:
        return row[0]
    cur = con.execute(
        'INSERT INTO snapshots (source_id, raw_sha256, raw_path, downloaded_at, last_modified, contract_version) VALUES (?,?,?,?,?,?)',
        (entry['source_id'], entry['raw_sha256'], entry['raw_path'], entry['downloaded_at'], entry.get('last_modified'), contract_version))
    return cur.lastrowid


def load_ibge(con: sqlite3.Connection, entry: dict, raw_dir: Path = RAW_DIR, expected: int = 184) -> set[str]:
    path = verify(entry, raw_dir)
    data = json.loads(path.read_text(encoding='utf-8'))
    if len(data) != expected:
        raise ValueError(f'IBGE: esperados {expected} municípios do CE, recebidos {len(data)}')
    sid = _upsert_snapshot(con, entry, None)
    # upsert (idempotente): apagar quebraria as chaves estrangeiras de cargas anteriores
    con.executemany('INSERT INTO municipalities (ibge_code, name, name_norm, uf, snapshot_id) VALUES (?,?,?,?,?) '
                    'ON CONFLICT(ibge_code) DO UPDATE SET name = excluded.name, name_norm = excluded.name_norm, snapshot_id = excluded.snapshot_id',
                    [(str(m['id']), m['nome'], cgu.normalize_name(m['nome']), 'CE', sid) for m in data])
    codes = {str(m['id']) for m in data}
    stale = [c for (c,) in con.execute('SELECT ibge_code FROM municipalities') if c not in codes]
    if stale:  # município que sumiu do IBGE: falha explícita (se referenciado, a FK também barra)
        con.executemany('DELETE FROM municipalities WHERE ibge_code = ?', [(c,) for c in stale])
    return {str(m['id']) for m in data}


def load_cgu(con: sqlite3.Connection, entry: dict, ce_codes: set[str], *, raw_dir: Path = RAW_DIR,
             contract: dict | None = None) -> dict:
    contract = contract or cgu.load_contract()
    path = verify(entry, raw_dir)
    sid = _upsert_snapshot(con, entry, contract.get('contract_version'))
    stats: dict = defaultdict(int)
    name_to_code = {n: c for c, n in con.execute('SELECT ibge_code, name_norm FROM municipalities')}
    # apelidos explícitos e revisados (ex.: grafia antiga), declarados no contrato — nunca fuzzy
    for alias, info in contract.get('municipality_name_aliases', {}).items():
        if info['ibge_code'] in name_to_code.values():
            name_to_code.setdefault(alias, info['ibge_code'])

    with zipfile.ZipFile(path) as zf:
        errs = cgu.check_members(zf, contract)
        if errs:
            raise cgu.ContractError('; '.join(errs))

        for table in DATA_TABLES:
            con.execute(f'DELETE FROM {table} WHERE snapshot_id = ?', (sid,))

        outside: dict[tuple[int, str], list[int]] = defaultdict(lambda: [0, 0, 0, 0])
        lines, exceptions, ce_codes_seen = [], [], set()
        for line_no, raw, d in cgu.iter_rows(zf, cgu.MAIN, contract):
            stats['main_rows'] += 1
            srid = f'{cgu.MAIN}:{line_no}'
            scope, mun = cgu.classify(d, ce_codes)
            ano = int(d['Ano da Emenda'])
            money = {k: cgu.cents(d[col]) for k, col in cgu.MONEY_COLUMNS.items()}
            outside_row = scope.startswith('fora_do_recorte')
            if outside_row:
                scope = scope.split(':', 1)[1]
                acc = outside[(ano, scope)]
                acc[0] += 1
                for i, k in enumerate(('empenhado', 'liquidado', 'pago'), start=1):
                    acc[i] += money[k] or 0
            elif scope == 'ce_nao_classificado':
                exceptions.append((sid, srid, 'ce_nao_classificado', f"localidade={d['Localidade de aplicação do recurso']!r} municipio={mun!r}"))
                stats['ce_unclassified'] += 1
                continue
            sha = cgu.row_sha256(raw)
            code, problem = cgu.official_code(d['Código da Emenda'], d['Ano da Emenda'])
            if problem and not outside_row:
                exceptions.append((sid, srid, 'codigo_emenda', problem))
            is_official = 1 if code and not problem else 0
            technical_id = code if is_official else f'TEC-{sha[:12]}'
            if is_official and not outside_row:
                ce_codes_seen.add(code)
            for k, v in money.items():
                if v is not None and v < 0 and not outside_row:
                    exceptions.append((sid, srid, 'valor_negativo', f'{k}={v}'))
            c = cgu.clean
            lines.append((sid, srid, sha, code if is_official else None, technical_id, is_official, ano,
                          d['Tipo de Emenda'], c(d['Código do Autor da Emenda']), c(d['Nome do Autor da Emenda']),
                          c(d['Número da emenda']), c(d['Possui Apoiador/Solicitante? ']),
                          d['Localidade de aplicação do recurso'], mun if scope == 'municipio' else None, scope,
                          c(d['Código Função']), c(d['Nome Função']), c(d['Código Subfunção']), c(d['Nome Subfunção']),
                          c(d['Código Programa']), c(d['Nome Programa']), c(d['Código Ação']), c(d['Nome Ação']),
                          c(d['Código Plano Orçamentário']), c(d['Nome Plano Orçamentário']),
                          *(money[k] for k in cgu.METRICS),
                          c(d['UF']), c(d['Município']), c(d['Código Município IBGE'])))
            stats[f'fora_{scope}' if outside_row else f'ce_{scope}'] += 1
        _insert(con, 'cgu_emenda_lines', lines)
        con.executemany('INSERT INTO cgu_outside_summary VALUES (?,?,?,?,?,?,?)',
                        [(sid, ano, kind, *v) for (ano, kind), v in sorted(outside.items())])

        fav = []
        for line_no, raw, d in cgu.iter_rows(zf, cgu.FAVORECIDO, contract):
            stats['favorecido_rows'] += 1
            if (d['UF Favorecido'] or '').strip() != 'CE':
                continue
            codigo, nome, masked = cgu.mask_favorecido(d['Tipo Favorecido'], d['Natureza Jurídica'],
                                                       cgu.clean(d['Código do Favorecido']), cgu.clean(d['Favorecido']))
            mun_nome = cgu.clean(d['Município Favorecido'])
            mun_code = name_to_code.get(cgu.normalize_name(mun_nome)) if mun_nome else None
            if mun_nome and not mun_code:
                stats['favorecido_municipio_sem_casamento'] += 1
            stats['favorecido_ce_masked'] += masked
            # o hash da linha é calculado sobre o bruto, mas o bruto nunca é gravado
            fav.append((sid, f'{cgu.FAVORECIDO}:{line_no}', cgu.row_sha256(raw), cgu.official_code(d['Código da Emenda'], None)[0],
                        d['Tipo de Emenda'], cgu.clean(d['Ano/Mês']), codigo, nome, int(masked),
                        cgu.clean(d['Natureza Jurídica']), cgu.clean(d['Tipo Favorecido']), mun_nome, mun_code,
                        cgu.cents(d['Valor Recebido'])))
        _insert(con, 'cgu_favorecidos_ce', fav)
        stats['favorecido_ce_rows'] = len(fav)

        conv = []
        for line_no, raw, d in cgu.iter_rows(zf, cgu.CONVENIOS, contract):
            stats['convenio_rows'] += 1
            code = cgu.clean(d['Código da Emenda'])
            if code not in ce_codes_seen:
                continue
            conv.append((sid, f'{cgu.CONVENIOS}:{line_no}', cgu.row_sha256(raw), code, cgu.clean(d['Localidade do gasto']),
                         d['Tipo de Emenda'], cgu.clean(d['Data Publicação Convênio']), cgu.clean(d['Convenente']),
                         cgu.clean(d['Objeto Convênio']), cgu.clean(d['Número Convênio']), cgu.cents(d['Valor Convênio'])))
        _insert(con, 'cgu_convenios_ce', conv)
        stats['convenio_ce_rows'] = len(conv)

        con.executemany('INSERT INTO load_exceptions VALUES (?,?,?,?)', exceptions)
        stats['exceptions'] = len(exceptions)
    stats['snapshot_id'] = sid
    return dict(stats)


def run(db_path: Path = STAGING_DB) -> dict:
    ibge, emendas = latest('ibge_municipios_ce'), latest('cgu_emendas')
    if not ibge or not emendas:
        raise SystemExit('Sem snapshot no manifesto. Rode: python pipelines/run.py snapshot')
    con = connect(db_path)
    try:
        with con:  # transação única: ou carrega tudo, ou nada
            ce_codes = load_ibge(con, ibge)
            stats = load_cgu(con, emendas, ce_codes)
    finally:
        con.close()
    print('[load] ' + ' · '.join(f'{k}={v:,}' if isinstance(v, int) else f'{k}={v}' for k, v in sorted(stats.items())))
    return stats
