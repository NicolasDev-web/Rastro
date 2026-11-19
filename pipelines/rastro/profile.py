"""Inventário do snapshot CGU e checagem de contrato (SPEC 01: T01.01, AC05)."""
from __future__ import annotations

import json
import zipfile
from collections import Counter
from pathlib import Path

from . import RAW_DIR, REPORTS_DIR
from . import cgu
from .fmt import num, table
from .snapshot import latest, verify


def ce_codes_from_ibge(raw_dir: Path = RAW_DIR) -> set[str]:
    entry = latest('ibge_municipios_ce')
    if not entry:
        raise SystemExit('Sem snapshot do IBGE. Rode: python pipelines/run.py snapshot')
    return {str(m['id']) for m in json.loads(verify(entry, raw_dir).read_text(encoding='utf-8'))}


def profile(zip_path: Path, contract: dict, ce_codes: set[str]) -> tuple[list[str], dict]:
    errors: list[str] = []
    info: dict = {'members': {}}
    with zipfile.ZipFile(zip_path) as zf:
        errors += cgu.check_members(zf, contract)
        for member, spec in contract['members'].items():
            if member not in zf.namelist():
                continue
            m = {'role': spec['role'], 'rows': 0, 'ce_rows': None}
            try:
                if member == cgu.MAIN:
                    anos, tipos, scopes, apoio = Counter(), Counter(), Counter(), Counter()
                    codes, no_code = Counter(), Counter()
                    for _, _, d in cgu.iter_rows(zf, member, contract):
                        m['rows'] += 1
                        anos[d['Ano da Emenda']] += 1
                        tipos[d['Tipo de Emenda']] += 1
                        apoio[d['Possui Apoiador/Solicitante? ']] += 1
                        scopes[cgu.classify(d, ce_codes)[0]] += 1
                        code = cgu.clean(d['Código da Emenda'])
                        if code:
                            codes[code] += 1
                        else:
                            no_code[d['Ano da Emenda']] += 1
                    m.update(anos=dict(sorted(anos.items())), tipos=tipos.most_common(), scopes=scopes.most_common(),
                             apoio=apoio.most_common(), codes_multi=sum(1 for v in codes.values() if v > 1),
                             max_rows_per_code=max(codes.values()), no_code=dict(sorted(no_code.items())))
                    m['ce_rows'] = sum(v for k, v in scopes.items() if not k.startswith('fora'))
                elif member == cgu.FAVORECIDO:
                    tipo_ce = Counter()
                    for _, _, d in cgu.iter_rows(zf, member, contract):
                        m['rows'] += 1
                        if d['UF Favorecido'].strip() == 'CE':
                            masked = cgu.mask_favorecido(d['Tipo Favorecido'], d['Natureza Jurídica'], 'x', 'x')[2]
                            tipo_ce['mascarados (PF ou empresário individual)' if masked else d['Tipo Favorecido']] += 1
                    m['ce_rows'] = sum(tipo_ce.values())
                    m['tipos_ce'] = tipo_ce.most_common()
                else:
                    uf_col = next((c for c in ('UF', 'UF do Beneficiário') if c in spec['columns']), None)
                    ce = 0
                    for _, _, d in cgu.iter_rows(zf, member, contract):
                        m['rows'] += 1
                        if uf_col and d[uf_col].strip() == 'CE':
                            ce += 1
                    m['ce_rows'] = ce if uf_col else None
            except (cgu.ContractError, UnicodeDecodeError) as exc:
                errors.append(str(exc))
            info['members'][member] = m
    return errors, info


def write_report(entry: dict, contract: dict, errors: list[str], info: dict, out_dir: Path = REPORTS_DIR) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"inventario-cgu-{entry['downloaded_at'][:10]}-{entry['raw_sha256'][:8]}.md"
    main = info['members'].get(cgu.MAIN, {})
    lines = [
        f"# Inventário — CGU emendas parlamentares (snapshot {entry['raw_sha256'][:8]})",
        '',
        '> Gerado por `python pipelines/run.py profile`. Não editar à mão.',
        '',
        f"- **Arquivo:** `raw_data/{entry['raw_path']}` · {num(entry['bytes'])} bytes · SHA-256 `{entry['raw_sha256']}`",
        f"- **Origem:** {entry['source_url']} → {entry['final_url']}",
        f"- **Baixado em:** {entry['downloaded_at']} · Last-Modified da fonte: {entry.get('last_modified')}",
        f"- **Contrato:** `pipelines/contracts/cgu_emendas.json` versão {contract['contract_version']} · encoding {contract['encoding']} · separador `{contract['delimiter']}`",
        f"- **Resultado do contrato:** {'**FALHOU — carga bloqueada**' if errors else 'OK'}",
        '',
    ]
    if errors:
        lines += ['## Falhas de contrato', ''] + [f'- {e}' for e in errors] + ['']
    lines += ['## Arquivos do ZIP', '', table(['Arquivo', 'Papel', 'Linhas', 'Linhas CE'],
              [[k, v['role'], num(v['rows']), '—' if v['ce_rows'] is None else num(v['ce_rows'])] for k, v in info['members'].items()], 'llrr'), '']
    lines += ['### Divergências conhecidas em relação ao dicionário oficial', ''] + [f'- {d}' for d in contract['dictionary_divergences']] + ['']
    if main:
        lines += ['## EmendasParlamentares.csv', '',
                  '### Linhas por ano da emenda', '', table(['Ano', 'Linhas'], [[a, num(n)] for a, n in main['anos'].items()], 'lr'), '',
                  '### Tipos de emenda', '', table(['Tipo', 'Linhas'], [[t, num(n)] for t, n in main['tipos']], 'lr'), '',
                  '### Escopo territorial (regra da SPEC 01)', '', table(['Escopo', 'Linhas'], [[s, num(n)] for s, n in main['scopes']], 'lr'), '',
                  '### Granularidade', '',
                  f"- Códigos com mais de uma linha: {num(main['codes_multi'])} (máximo de {main['max_rows_per_code']} linhas por código).",
                  '- Linhas sem código oficial de emenda, por ano: ' + ', '.join(f'{a}: {num(n)}' for a, n in main['no_code'].items()) + '.',
                  '- "Possui Apoiador/Solicitante?": ' + ', '.join(f'{k or "(vazio)"}: {num(v)}' for k, v in main['apoio']) + '.', '']
    fav = info['members'].get(cgu.FAVORECIDO)
    if fav:
        lines += ['## Favorecidos com UF CE', '', table(['Tipo', 'Linhas'], [[t, num(n)] for t, n in fav['tipos_ce']], 'lr'), '',
                  'Pessoas físicas e empresários individuais são mascarados em todos os artefatos derivados (SPEC 01, AC09).', '']
    lines += ['## Perguntas em aberto para a conferência amostral', '',
              '- Relação entre "Valor Pago" e "Valor Restos A Pagar Pagos": métricas exibidas separadamente, sem soma, até confirmação.',
              '- "Valor Restos A Pagar Inscritos" menor que "RAP Pagos" em alguns anos: entender se é saldo atual ou valor inscrito no ano.', '']
    path.write_text('\n'.join(lines), encoding='utf-8')
    return path


def run() -> int:
    entry = latest('cgu_emendas')
    if not entry:
        raise SystemExit('Sem snapshot da CGU. Rode: python pipelines/run.py snapshot')
    contract = cgu.load_contract()
    errors, info = profile(verify(entry), contract, ce_codes_from_ibge())
    path = write_report(entry, contract, errors, info)
    print(f"[profile] contrato {'FALHOU' if errors else 'OK'} · relatório: {path.relative_to(path.parents[1])}")
    for e in errors:
        print('  ERRO:', e)
    return 1 if errors else 0
