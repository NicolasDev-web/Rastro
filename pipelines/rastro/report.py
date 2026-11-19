"""Cobertura, conservação e amostra para conferência humana (SPEC 01: T01.08, T01.09; Gate A/B).

Conservação: os totais do Ceará por ano × escopo × etapa são calculados por DOIS caminhos
independentes — (A) direto do CSV bruto, com filtro próprio; (B) SQL sobre o staging — e
precisam bater ao centavo. Qualquer divergência faz o comando falhar.
"""
from __future__ import annotations

import csv
import io
import random
import sqlite3
import zipfile
from collections import defaultdict
from pathlib import Path

from . import REPORTS_DIR, STAGING_DB
from . import cgu
from .fmt import brl, num, table
from .snapshot import latest, verify

YEARS = range(2020, 2027)
PORTAL_DETAIL = 'https://portaldatransparencia.gov.br/emendas/detalhe?codigoEmenda={code}'


def totals_from_raw(zip_path: Path) -> dict[tuple[int, str], list[int]]:
    """Caminho A: leitura crua, sem o código de carga. Filtro: Código UF IBGE = 2300000."""
    acc: dict[tuple[int, str], list[int]] = defaultdict(lambda: [0] * 7)
    with zipfile.ZipFile(zip_path) as zf, zf.open(cgu.MAIN) as fh:
        reader = csv.DictReader(io.TextIOWrapper(fh, encoding='cp1252', newline=''), delimiter=';')
        for d in reader:
            if d['Código UF IBGE'] != cgu.UF_CE_CODE:
                continue
            loc = d['Localidade de aplicação do recurso']
            scope = 'multiplo' if loc == 'MÚLTIPLO' else 'estado' if loc == 'CEARÁ (UF)' else 'municipio'
            a = acc[(int(d['Ano da Emenda']), scope)]
            a[0] += 1
            for i, col in enumerate(cgu.MONEY_COLUMNS.values(), start=1):
                a[i] += cgu.cents(d[col]) or 0
    return acc


def totals_from_staging(con: sqlite3.Connection, sid: int) -> dict[tuple[int, str], list[int]]:
    cols = ', '.join(f'COALESCE(SUM({m}_cents), 0)' for m in cgu.METRICS)
    return {(ano, scope): [n, *vals] for ano, scope, n, *vals in con.execute(
        f"SELECT ano, territorial_scope, COUNT(*), {cols} FROM cgu_emenda_lines WHERE snapshot_id = ? AND territorial_scope IN ('municipio', 'estado', 'multiplo') GROUP BY 1, 2", (sid,))}


def conservation(a: dict, b: dict) -> list[tuple[tuple[int, str], str, int, int]]:
    diffs = []
    names = ['linhas', *cgu.METRICS]
    for key in sorted(set(a) | set(b)):
        va, vb = a.get(key, [0] * 7), b.get(key, [0] * 7)
        for name, x, y in zip(names, va, vb):
            if x != y:
                diffs.append((key, name, x, y))
    return diffs


def build(entry: dict, con: sqlite3.Connection) -> tuple[str, str, list]:
    sid = con.execute('SELECT id FROM snapshots WHERE raw_sha256 = ?', (entry['raw_sha256'],)).fetchone()
    if not sid:
        raise SystemExit('Snapshot ainda não carregado. Rode: python pipelines/run.py load')
    sid = sid[0]
    raw_tot, stg_tot = totals_from_raw(verify(entry)), totals_from_staging(con, sid)
    diffs = conservation(raw_tot, stg_tot)
    tag = f"{entry['downloaded_at'][:10]}-{entry['raw_sha256'][:8]}"

    L = [f"# Cobertura e conservação — CGU emendas, recorte Ceará (snapshot {entry['raw_sha256'][:8]})", '',
         '> Gerado por `python pipelines/run.py report`. Dados oficiais **em validação**: não publicar.', '',
         f"- Snapshot: `raw_data/{entry['raw_path']}` · baixado em {entry['downloaded_at']} · fonte atualizada em {entry.get('last_modified')}",
         '- Recorte: linhas com `Código UF IBGE = 2300000` (SPEC 01 → Escopo territorial).', '']

    L += ['## 1. Conservação (Gate A)', '',
          'Totais por ano × escopo × etapa calculados direto do CSV bruto (caminho A) e pelo staging SQLite (caminho B).', '']
    if diffs:
        L += ['**DIVERGÊNCIA — corrigir antes de qualquer uso.**', '',
              table(['Ano', 'Escopo', 'Medida', 'Bruto', 'Staging'], [[k[0], k[1], n, x, y] for k, n, x, y in diffs[:50]], 'lllrr'), '']
    else:
        L += [f'**OK** — {len(raw_tot)} combinações ano × escopo, 7 medidas cada (linhas + 6 valores), idênticas ao centavo.', '']

    L += ['## 2. Cobertura do recorte por ano (2020–2026)', '',
          'Valores em reais. "Pago" e "RAP pagos" são medidas distintas e **não são somadas**.', '']
    rows = []
    for y in YEARS:
        for scope in ('municipio', 'estado', 'multiplo'):
            v = stg_tot.get((y, scope))
            if v:
                rows.append([y, scope, num(v[0]), brl(v[1]), brl(v[2]), brl(v[3]), brl(v[6])])
    L += [table(['Ano', 'Escopo', 'Linhas', 'Empenhado', 'Liquidado', 'Pago', 'RAP pagos'], rows, 'llrrrrr'), '']

    L += ['### Parcela localizada em município', '',
          '`records_linked / records_eligible` e `amount_located / amount_eligible` (MODELO-E-METRICAS).', '']
    rows = []
    for y in YEARS:
        tot = [sum(stg_tot.get((y, s), [0] * 7)[i] for s in ('municipio', 'estado', 'multiplo')) for i in range(7)]
        mun = stg_tot.get((y, 'municipio'), [0] * 7)
        pct = lambda a, b: f'{a / b * 100:.1f}%'.replace('.', ',') if b else '—'
        rows.append([y, f'{num(mun[0])} de {num(tot[0])}', pct(mun[0], tot[0]), pct(mun[1], tot[1]), pct(mun[3], tot[3])])
    L += [table(['Ano', 'Linhas no município', '% linhas', '% empenhado', '% pago'], rows, 'lrrrr'), '']

    out = con.execute('SELECT ano, outside_kind, rows, pago_cents FROM cgu_outside_summary WHERE snapshot_id = ? AND outside_kind != ? AND ano >= 2020 ORDER BY 1, 2', (sid, 'outra_uf')).fetchall()
    L += ['### Fora do recorte, mas sem UF (pode incluir aplicação no Ceará)', '',
          'Emendas com localidade nacional, regional ou exterior não podem ser atribuídas ao Ceará com este arquivo. O incremento 2 (documentos de despesa) traz a localidade de aplicação de cada pagamento.', '',
          table(['Ano', 'Localidade', 'Linhas', 'Pago'], [[a, k, num(n), brl(p)] for a, k, n, p in out], 'llrr'), '']

    exc = con.execute('SELECT kind, COUNT(*) FROM load_exceptions WHERE snapshot_id = ? GROUP BY 1', (sid,)).fetchall()
    fav = con.execute('SELECT COUNT(*), SUM(masked), SUM(municipio_nome IS NOT NULL AND municipio_ibge IS NULL) FROM cgu_favorecidos_ce WHERE snapshot_id = ?', (sid,)).fetchone()
    tipos = con.execute("SELECT tipo, COUNT(*), COUNT(DISTINCT technical_id) FROM cgu_emenda_lines WHERE snapshot_id = ? AND ano >= 2020 AND territorial_scope IN ('municipio', 'estado', 'multiplo') GROUP BY 1 ORDER BY 2 DESC", (sid,)).fetchall()
    L += ['## 3. Exceções e qualidade', '',
          '- Exceções de carga: ' + (', '.join(f'{k}: {num(n)}' for k, n in exc) if exc else 'nenhuma') + '.',
          f'- Favorecidos com UF CE: {num(fav[0])} linhas · {num(fav[1] or 0)} mascaradas (PF/empresário individual) · {num(fav[2] or 0)} com município sem casamento no IBGE.',
          '', '### Tipos de emenda no recorte (2020–2026)', '',
          table(['Tipo', 'Linhas', 'Emendas'], [[t, num(n), num(e)] for t, n, e in tipos], 'lrr'), '']

    # Amostra estável por snapshot (semente = SHA)
    cands = con.execute("SELECT DISTINCT emenda_code FROM cgu_emenda_lines WHERE snapshot_id = ? AND is_official_code = 1 AND ano >= 2020 AND territorial_scope IN ('municipio', 'estado', 'multiplo') ORDER BY 1", (sid,)).fetchall()
    rnd = random.Random(int(entry['raw_sha256'][:16], 16))
    sample = sorted(c for (c,) in rnd.sample(cands, min(10, len(cands))))
    srows = []
    for code in sample:
        r = con.execute(f'SELECT ano, tipo, autor_nome, GROUP_CONCAT(DISTINCT localidade), {", ".join(f"SUM({m}_cents)" for m in cgu.METRICS)} FROM cgu_emenda_lines WHERE snapshot_id = ? AND emenda_code = ? GROUP BY ano, tipo, autor_nome', (sid, code)).fetchone()
        srows.append((code, r))
    S = [f"# Conferência amostral — CGU emendas, Ceará (snapshot {entry['raw_sha256'][:8]})", '',
         '> SPEC 01, T01.09. Gerado por `python pipelines/run.py report`; **preenchido à mão pelo revisor**.', '',
         'Para cada emenda: abra o link, compare os seis valores do Portal com os valores abaixo e marque. Anote qualquer diferença.',
         f"Amostra sorteada com semente fixa (SHA do snapshot) entre {num(len(cands))} emendas com código oficial, 2020–2026.", '']
    for code, r in srows:
        ano, tipo, autor, loc, *vals = r
        S += [f'## {code} · {ano}', '',
              f'- {tipo} · autor: {autor or "sem informação"} · localidade: {loc}',
              f'- Portal: {PORTAL_DETAIL.format(code=code)}', '',
              table(['Medida', 'Staging', 'Portal confere?'], [[m, brl(v), '[ ] sim  [ ] não'] for m, v in zip(cgu.METRICS, vals)], 'lrl'), '',
              'Observação: ______________________________', '']
    S += ['## Perguntas para o revisor', '',
          '- O Portal soma "Pago" e "RAP Pagos" em algum total? Se sim, com que rótulo?',
          '- "RAP Inscritos" é o valor inscrito no ano ou o saldo atual?', '',
          'Revisor: ____________________  Data: ____/____/______  Assinatura: ____________________', '']
    return '\n'.join(L), '\n'.join(S), diffs, tag


def write_once(path: Path, text: str) -> bool:
    """Planilhas preenchidas à mão pelo revisor NUNCA são sobrescritas. Retorna True se escreveu."""
    if path.exists():
        return False
    path.write_text(text, encoding='utf-8')
    return True


def run(db_path: Path = STAGING_DB, out_dir: Path = REPORTS_DIR) -> int:
    entry = latest('cgu_emendas')
    con = sqlite3.connect(db_path)
    try:
        cov, sample, diffs, tag = build(entry, con)
    finally:
        con.close()
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / f'cobertura-cgu-{tag}.md').write_text(cov, encoding='utf-8')
    sample_path = out_dir / f'conferencia-amostral-{tag}.md'
    if not write_once(sample_path, sample):
        print(f'[report] {sample_path.name} já existe (pode estar preenchida pelo revisor) — mantida intacta')
    print(f"[report] conservação {'DIVERGENTE' if diffs else 'OK'} · reports/cobertura-cgu-{tag}.md · reports/conferencia-amostral-{tag}.md")
    return 1 if diffs else 0
