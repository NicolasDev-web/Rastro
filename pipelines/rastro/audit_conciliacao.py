"""Auditoria local reproduzível de pagamentos, sem identidades de favorecidos.

Os padrões descrevem números observados. Nenhum padrão resolve automaticamente
a causa de uma divergência ou aprova a publicação dos dados.
"""
import csv
import json
import sqlite3
from collections import Counter, defaultdict

from . import REPORTS_DIR, STAGING_DB, VALIDATION_DIR
from .conciliacao import payment
from .documentos import relevant_codes, selected_sources
from .fmt import brl, num, table
from .money import total
from .snapshot import latest

CE_SCOPES = {'municipio', 'estado', 'multiplo'}
PATTERNS = ('confere', 'igual_so_pago', 'abaixo', 'acima', 'sem_documentos', 'indisponivel')
LABELS = {'confere': 'Confere com Pago + RAP pagos', 'igual_so_pago': 'Igual apenas a Pago (diverge do total)',
          'abaixo': 'Documentos abaixo do total', 'acima': 'Documentos acima do total',
          'sem_documentos': 'Sem documento de pagamento', 'indisponivel': 'Valores incompletos'}


def _rows(con, query, args=()):
    cur = con.execute(query, args)
    names = [c[0] for c in cur.description]
    return (dict(zip(names, row)) for row in cur)


def build(con, sid):
    """Uma comparação por código; todas as localidades e anos documentais ativos."""
    codes = relevant_codes(con, sid)
    lines, documents = defaultdict(list), defaultdict(list)
    for row in _rows(con, 'SELECT * FROM cgu_emenda_lines WHERE snapshot_id=? AND ano BETWEEN 2020 AND 2026 '
                          'AND emenda_code IS NOT NULL ORDER BY emenda_code,source_row_id', (sid,)):
        if row['emenda_code'] in codes:
            lines[row['emenda_code']].append(row)
    for row in _rows(con, 'SELECT * FROM cgu_documentos_ativos ORDER BY emenda_code,raw_sha256,source_row_id'):
        if row['emenda_code'] in lines:
            documents[row['emenda_code']].append(row)
    records = []
    for code, ls in lines.items():
        ds = documents[code]
        pay = [d for d in ds if d['fase'].startswith('Pagamento')]
        emp = [d for d in ds if d['fase'].startswith('Empenho')]
        pago, rap = (total(l[f'{m}_cents'] for l in ls) for m in ('pago', 'rap_pagos'))
        comparison = payment(pago, rap, (d['valor_pago_cents'] for d in pay))
        committed = total(l['empenhado_cents'] for l in ls)
        doc_committed = total(d['valor_empenhado_cents'] for d in emp)
        by_year = defaultdict(list)
        for d in pay:
            date = d['data_documento'] or ''
            year = date[-4:] if len(date) == 10 and date[-4:].isdigit() else 'sem_data'
            by_year[year].append(d['valor_pago_cents'])
        records.append({'code': code, 'ano': ls[0]['ano'], 'tipo': ls[0]['tipo'],
                        'recorte_ce': any(l['territorial_scope'] in CE_SCOPES for l in ls),
                        'escopos': sorted({l['territorial_scope'] for l in ls}),
                        'pago': pago, 'rap_pagos': rap, **comparison,
                        'documentos_empenho': len(emp), 'documentos_total': len(ds),
                        'empenho_comparavel': bool(emp) and committed is not None and doc_committed is not None,
                        'empenho_confere': bool(emp) and committed is not None and doc_committed == committed,
                        'pagamentos_por_ano_documento': {y: {'documentos': len(v), 'pago': total(v)} for y, v in sorted(by_year.items())},
                        'linhas_emenda': [l['source_row_id'] for l in ls],
                        # Evidências mínimas para reabrir o raw; nenhum nome/código de favorecido.
                        'linhas_documentos_divergentes': [{'raw_sha256': d['raw_sha256'], 'source_row_id': d['source_row_id']}
                                                         for d in ds] if comparison['status'] == 'diverge' else []})
    return records


def summarize(records):
    patterns = Counter(r['padrao'] for r in records)
    statuses = Counter(r['status'] for r in records)
    comparable = [r for r in records if r['status'] in ('confere', 'diverge')]
    differences = [r for r in records if r['status'] == 'diverge']
    missing = [r for r in records if r['status'] == 'sem_documentos']
    return {'emendas': len(records), 'status': dict(statuses),
            'padroes': {p: patterns[p] for p in PATTERNS}, 'comparaveis': len(comparable),
            'com_pagamento': sum(r['documentos_pagamento'] > 0 for r in records),
            'com_empenho': sum(r['documentos_empenho'] > 0 for r in records),
            'empenho_comparavel': sum(r['empenho_comparavel'] for r in records),
            'empenho_confere': sum(r['empenho_confere'] for r in records),
            'sem_documentos_total_positivo': sum(r['pago_total'] is not None and r['pago_total'] > 0 for r in missing),
            'sem_documentos_total_zero': sum(r['pago_total'] == 0 for r in missing),
            'sem_documentos_total_negativo': sum(r['pago_total'] is not None and r['pago_total'] < 0 for r in missing),
            'sem_documentos_total_ausente': sum(r['pago_total'] is None for r in missing),
            'diferencas_abaixo': sum(-r['diferenca'] for r in differences if r['diferenca'] < 0),
            'diferencas_acima': sum(r['diferenca'] for r in differences if r['diferenca'] > 0)}


def write(entry, sources, records, out_dir=REPORTS_DIR, data_dir=VALIDATION_DIR):
    tag = f"{entry['downloaded_at'][:10]}-{entry['raw_sha256'][:8]}"
    out_dir.mkdir(parents=True, exist_ok=True)
    data_dir.mkdir(parents=True, exist_ok=True)
    ce = [r for r in records if r['recorte_ce']]
    summaries = {'recorte_ce': summarize(ce), 'fichas': summarize(records)}
    groups = {}
    for universe, values in [('recorte_ce', ce), ('fichas', records)]:
        groups[universe] = {}
        for field in ('ano', 'tipo'):
            buckets = defaultdict(list)
            for r in values:
                buckets[str(r[field])].append(r)
            groups[universe][field] = {k: summarize(v) for k, v in sorted(buckets.items())}
    payload = {'kind': 'VALIDACAO', 'snapshot': entry, 'document_sources': sources,
               'unidade_monetaria': 'centavos BRL', 'regra': 'documentos de Pagamento - (Pago + RAP pagos)',
               'resumos': summaries, 'grupos': groups, 'emendas': records}
    path = data_dir / f'conciliacao-{tag}.json'
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    fields = ['code', 'ano', 'tipo', 'recorte_ce', 'status', 'padrao', 'pago', 'rap_pagos', 'pago_total',
              'documentos_pago', 'diferenca', 'documentos_pagamento', 'documentos_empenho']
    with (data_dir / f'conciliacao-{tag}.csv').open('w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([k + '_cents' if k in ('pago', 'rap_pagos', 'pago_total', 'documentos_pago', 'diferenca') else k for k in fields])
        writer.writerows([r[k] for k in fields] for r in records)
    pct = lambda a, b: f'{a / b * 100:.1f}%'.replace('.', ',') if b else '—'
    md = [f'# Revisão da conciliação — {tag}', '', '> Dados oficiais em validação — não publicar.', '',
          f'Snapshot principal: `{entry["raw_sha256"]}`; extração: {entry["downloaded_at"]}.', '',
          'Fontes documentais ativas: ' + '; '.join(f'`{s}`: `{h}`' for s, h in sorted(sources.items())) + '.', '',
          '## Universo e regra', '',
          'O recorte CE seleciona códigos com ao menos uma linha municipal, estadual ou MÚLTIPLO. A comparação usa **todas as linhas do código**, '
          'inclusive localidades fora do CE, contra todos os documentos ativos desse código. O universo das fichas inclui também emendas de autores eleitos pelo CE. '
          'Esses universos se sobrepõem e não se somam. Cada código conta uma vez.', '',
          '**Diferença = documentos de Pagamento − (Pago + RAP pagos)**, em centavos inteiros, sem tolerância. '
          'Falta de documento de pagamento não é zero nem divergência. Qualquer parcela ausente impede a comparação. '
          'Igualdade apenas com Pago continua sendo divergência do total. Empenho é conferido à parte.', '',
          table(['Padrão numérico (exclusivo)', 'Recorte CE', 'Todas as fichas'],
                [[LABELS[p], num(summaries['recorte_ce']['padroes'][p]), num(summaries['fichas']['padroes'][p])] for p in PATTERNS], 'lrr'), '']
    for name, label in [('recorte_ce', 'Recorte CE'), ('fichas', 'Todas as fichas')]:
        s = summaries[name]
        md += [f'**{label}:** {num(s["emendas"])} códigos; {num(s["com_pagamento"])} com documento de pagamento; '
               f'{num(s["comparaveis"])} comparáveis; {num(s["padroes"]["confere"])} iguais '
               f'({pct(s["padroes"]["confere"], s["comparaveis"])} dos comparáveis). '
               f'Empenho: {num(s["empenho_confere"])} iguais de {num(s["empenho_comparavel"])} comparáveis '
               f'({num(s["com_empenho"])} com documento de empenho).', '',
               f'Diferenças abaixo, em magnitude: {brl(s["diferencas_abaixo"])}. Acima: {brl(s["diferencas_acima"])}. '
               'As direções não são compensadas entre emendas.', '',
               f'Sem pagamento documental: {num(s["sem_documentos_total_positivo"])} com total positivo na emenda; '
               f'{num(s["sem_documentos_total_zero"])} com total zero; {num(s["sem_documentos_total_negativo"])} com total negativo; '
               f'{num(s["sem_documentos_total_ausente"])} com total ausente. Nenhum desses casos recebe selo de conferência.', '']
    md += ['## Cobertura por ano e modalidade — todas as fichas', '',
           'Cada tabela particiona os mesmos códigos das fichas; não somar as duas tabelas. O JSON também contém os grupos do recorte CE.', '']
    for field, label in [('ano', 'Ano da emenda'), ('tipo', 'Modalidade')]:
        md += [table([label, 'Códigos', 'Comparáveis', 'Conferem', 'Divergem', 'Sem pagamento', 'Incompletos'],
                     [[k, num(s['emendas']), num(s['comparaveis']), num(s['padroes']['confere']),
                       num(s['status'].get('diverge', 0)), num(s['padroes']['sem_documentos']), num(s['padroes']['indisponivel'])]
                      for k, s in groups['fichas'][field].items()], 'lrrrrrr'), '']
    md += ['## Todas as diferenças comparáveis', '',
           'Padrões descrevem a aritmética, **não uma causa confirmada**. Cada caso permanece pendente de revisão documental. '
           'Os arquivos não demonstram, por si, atraso de atualização, falha de cobertura, entrega física ou irregularidade.', '',
           table(['Emenda', 'Ano', 'CE', 'Padrão', 'Pago + RAP', 'Documentos pagos', 'Diferença'],
                 [[r['code'], r['ano'], 'sim' if r['recorte_ce'] else 'não', r['padrao'], brl(r['pago_total']), brl(r['documentos_pago']), brl(r['diferenca'])]
                  for r in records if r['status'] == 'diverge'], 'lll lrrr'.replace(' ', '')), '',
           '## Sem pagamento documental, com total positivo na emenda', '',
           'Lacunas de cobertura a investigar separadamente das diferenças calculáveis. Não há valor documental para subtrair do total; ausência não é zero.', '',
           table(['Emenda', 'Ano', 'CE', 'Pago + RAP'], [[r['code'], r['ano'], 'sim' if r['recorte_ce'] else 'não', brl(r['pago_total'])]
                 for r in records if r['status'] == 'sem_documentos' and r['pago_total'] is not None and r['pago_total'] > 0], 'lllr'), '',
           '## Evidências e limites', '',
           f'`data/validacao/conciliacao-{tag}.json` contém todas as comparações, hashes ativos, linhas de origem e pagamentos por ano documental. '
           f'`data/validacao/conciliacao-{tag}.csv` contém a matriz financeira completa; campo vazio indica valor indisponível. '
           'Ambos são artefatos locais ignorados pelo Git. Nenhum deles contém identidades de favorecidos.', '',
           'Para investigar: reabrir as linhas exatas dos snapshots, verificar fase, anulações/ajustes e datas de atualização, '
           'conferir o código na interface oficial e registrar uma conclusão apoiada por fonte. Nenhuma diferença é corrigida por aproximação ou exclusão automática de linhas.', '',
           'A soma Pago + RAP pagos é a convenção operacional de comparação. Igualdade numérica sustenta a convenção para os casos iguais; '
           'não comprova universalmente a divisão temporal dos campos nem a cobertura de todos os pagamentos. '
           'O ano do arquivo documental é o ano do documento, e não o ano da emenda. Datas de extração distintas podem exigir revisão, sem constituir causa comprovada.', '']
    report = out_dir / f'revisao-conciliacao-{tag}.md'
    report.write_text('\n'.join(md), encoding='utf-8')
    return report


def run(db_path=STAGING_DB):
    entry = latest('cgu_emendas')
    with sqlite3.connect(db_path) as con:
        sid = con.execute('SELECT id FROM snapshots WHERE raw_sha256=?', (entry['raw_sha256'],)).fetchone()[0]
        sources = selected_sources(con)
        if not sources:
            raise ValueError('Seleção documental ausente; execute documentos antes da auditoria')
        records = build(con, sid)
    report = write(entry, sources, records)
    print(f'[conciliacao] {len(records)} fichas · {summarize(records)["status"]} · {report.name}')
    return 0
