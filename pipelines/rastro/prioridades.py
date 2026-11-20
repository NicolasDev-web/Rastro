"""Fila local de investigação da conciliação; valores em centavos, sem juízo de conduta."""
import csv
import hashlib
import json
import sqlite3
from contextlib import closing
from pathlib import Path

from . import REPORTS_DIR, STAGING_DB, VALIDATION_DIR
from .audit_conciliacao import build as audit_build
from .documentos import selected_sources
from .fmt import brl, num, table
from .snapshot import latest

GROUPS = {
    0: 'Diagnosticar valores incompletos',
    1: 'Investigar cobertura ausente',
    2: 'Conferir diferenças de R$ 1 milhão ou mais',
    3: 'Conferir diferenças de R$ 100 mil a menos de R$ 1 milhão',
    4: 'Conferir diferenças menores que R$ 100 mil',
}
METHOD = ('Primeiro diagnosticar valores incompletos, se houver; depois investigar totais positivos sem documento '
          'de pagamento; em seguida revisar diferenças calculáveis por faixas absolutas de R$ 1 milhão, R$ 100 mil '
          'e abaixo. Dentro de cada grupo: valor decrescente e código crescente para desempate. '
          'Faixas escolhidas para organizar o trabalho, sem tolerância financeira ou limiar oficial.')


def rank(records):
    ranked, seen = [], set()
    for record in records:
        code = record['code']
        if code in seen:
            raise ValueError(f'Código repetido na auditoria: {code}')
        seen.add(code)
        status = record['status']
        if status == 'indisponivel' or (status == 'sem_documentos' and record['pago_total'] is None):
            group, amount = 0, None
            reason = 'Valores incompletos impedem dimensionar o caso.'
            action = 'Reabrir as linhas da fonte e diagnosticar parcelas ausentes antes de comparar valores.'
        elif status == 'sem_documentos' and record['pago_total'] > 0:
            group, amount = 1, record['pago_total']
            reason = 'Total positivo na fonte sem nenhum documento de pagamento na seleção ativa.'
            action = ('Conferir o código no Portal e a cobertura dos arquivos por ano do documento; '
                      'localizar os pagamentos ou registrar documentalmente a lacuna.')
        elif status == 'diverge':
            difference = record['diferenca']
            if type(difference) is not int or difference == 0:
                raise ValueError(f'Diferença inválida: {code}')
            amount = abs(difference)
            group = 2 if amount >= 100_000_000 else 3 if amount >= 10_000_000 else 4
            reason = 'Diferença calculável entre documentos de pagamento e os campos Pago + RAP pagos.'
            action = ('Reabrir as linhas identificadas por hash; conferir fases, anulações/ajustes e datas '
                      'no Portal e registrar a explicação sustentada por documentos.')
        else:
            continue
        fields = ('code', 'ano', 'tipo', 'recorte_ce', 'padrao', 'pago', 'rap_pagos', 'pago_total',
                  'documentos_pago', 'diferenca', 'documentos_pagamento', 'documentos_empenho',
                  'linhas_emenda', 'linhas_documentos_divergentes')
        row = {key: record[key] for key in fields}
        row.update(grupo=group, prioridade=GROUPS[group], status=status, status_revisao='pendente',
                   valor_ordenacao=amount, diferenca_absoluta=abs(record['diferenca']) if status == 'diverge' else None,
                   motivo=reason, proxima_acao=action, caminho_ficha=f'/emendas/{code}')
        ranked.append(row)
    ranked.sort(key=lambda row: (row['grupo'], -row['valor_ordenacao'] if row['valor_ordenacao'] is not None else 0, row['code']))
    return [dict(ordem=index, **row) for index, row in enumerate(ranked, start=1)]


def summaries(rows):
    result = []
    for group, label in GROUPS.items():
        selected = [row for row in rows if row['grupo'] == group]
        if not selected:
            continue
        result.append({'grupo': group, 'prioridade': label, 'casos': len(selected),
                       'casos_recorte_ce': sum(row['recorte_ce'] for row in selected),
                       'total_fonte_sem_pagamento': sum(row['pago_total'] for row in selected) if group == 1 else None,
                       'diferenca_absoluta': sum(row['diferenca_absoluta'] for row in selected) if group >= 2 else None})
    return result


def write(entry, sources, rows, report_dir=REPORTS_DIR, data_dir=VALIDATION_DIR):
    tag = f"{entry['downloaded_at'][:10]}-{entry['raw_sha256'][:8]}"
    report_dir, data_dir = Path(report_dir), Path(data_dir)
    report_dir.mkdir(parents=True, exist_ok=True)
    data_dir.mkdir(parents=True, exist_ok=True)
    groups = summaries(rows)
    payload = {'kind': 'VALIDACAO', 'snapshot': entry, 'document_sources': sources,
               'unidade_monetaria': 'centavos BRL', 'metodo': METHOD, 'grupos': groups, 'casos': rows}
    (data_dir / f'prioridades-conciliacao-{tag}.json').write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    fields = ('ordem', 'grupo', 'prioridade', 'code', 'ano', 'tipo', 'recorte_ce', 'status', 'status_revisao',
              'pago_total', 'documentos_pago', 'diferenca', 'diferenca_absoluta', 'valor_ordenacao',
              'documentos_pagamento', 'documentos_empenho', 'motivo', 'proxima_acao', 'caminho_ficha')
    money = {'pago_total', 'documentos_pago', 'diferenca', 'diferenca_absoluta', 'valor_ordenacao'}
    with (data_dir / f'prioridades-conciliacao-{tag}.csv').open('w', encoding='utf-8-sig', newline='') as handle:
        writer = csv.writer(handle)
        writer.writerow([f'{field}_cents' if field in money else field for field in fields])
        writer.writerows([row[field] for field in fields] for row in rows)
    lines = [f'# Prioridades de investigação da conciliação — {tag}', '',
             '> Dados oficiais em validação — fila interna de trabalho, sem aprovação editorial de publicação.', '',
             f'Snapshot: `{entry["raw_sha256"]}`; extração: {entry["downloaded_at"]}.', '',
             f'{num(len(rows))} casos com revisão pendente no universo de todas as fichas. '
             f'{num(sum(row["recorte_ce"] for row in rows))} pertencem ao recorte CE; esses universos se sobrepõem e não se somam.', '',
             '## Ordem de trabalho', '', METHOD, '',
             'Todos os casos da fila exigem investigação documental ou exclusão explícita de um recorte aprovado '
             'antes de uma publicação que os inclua. Ordem menor indica atendimento primeiro, sem conclusão sobre causa ou conduta.', '',
             table(['Grupo', 'Trabalho', 'Casos', 'No recorte CE', 'Total da fonte sem pagamento documental', 'Soma absoluta das diferenças'],
                   [[g['grupo'], g['prioridade'], g['casos'], g['casos_recorte_ce'],
                     brl(g['total_fonte_sem_pagamento']) if g['grupo'] == 1 else '—',
                     brl(g['diferenca_absoluta']) if g['grupo'] >= 2 else '—'] for g in groups], 'llrrrr'), '',
             'A soma absoluta preserva a magnitude de cada diferença, sem compensar direções. O total da fonte '
             'nos casos sem pagamento documental não é uma diferença: ausência permanece null. As duas colunas financeiras não se somam.', '',
             '## Fila completa', '',
             table(['Ordem', 'Grupo', 'Emenda', 'Ano', 'CE', 'Pago + RAP na fonte', 'Pagamento documental', 'Diferença documental − fonte'],
                   [[r['ordem'], r['grupo'], f'[{r["code"]}](http://localhost:3012{r["caminho_ficha"]})',
                     r['ano'], 'sim' if r['recorte_ce'] else 'não', brl(r['pago_total']), brl(r['documentos_pago']),
                     brl(r['diferenca']) if r['diferenca'] is not None else 'não calculável'] for r in rows], 'rrlllrrr'), '',
             '## Ação por grupo', '']
    for group in groups:
        sample = next(row for row in rows if row['grupo'] == group['grupo'])
        lines += [f'**Grupo {group["grupo"]}:** {sample["motivo"]} {sample["proxima_acao"]}', '']
    lines += ['## Fontes e reprodução', '',
              'Fontes documentais ativas: ' + '; '.join(f'`{key}`: `{value}`' for key, value in sorted(sources.items())) + '.', '',
              f'Revisão detalhada: [relatório da conciliação](revisao-conciliacao-{tag}.md). '
              'Reproduzir com `python pipelines/run.py prioridades`, usando o staging e pacote ativo compatíveis, sem baixar novas fontes.', '',
              f'Matrizes locais em `data/validacao/prioridades-conciliacao-{tag}.json` e `.csv`, fora do Git. '
              'O JSON preserva as referências de linhas e hashes da auditoria, sem identidades de favorecidos. '
              'Links das fichas usam a aplicação local em http://localhost:3012.', '']
    report = report_dir / f'prioridades-conciliacao-{tag}.md'
    report.write_text('\n'.join(lines), encoding='utf-8')
    return report


def run(db_path=STAGING_DB, data_dir=VALIDATION_DIR, report_dir=REPORTS_DIR):
    directory = Path(data_dir)
    entry = latest('cgu_emendas')
    manifest = json.loads((directory / 'active-bundle.json').read_text(encoding='utf-8'))
    if not entry or manifest.get('snapshot') != entry['raw_sha256']:
        raise ValueError('Snapshot do pacote ativo incompatível com o staging atual')
    info = manifest['files']['emendas']
    content = (directory / info['path']).read_bytes()
    if hashlib.sha256(content).hexdigest() != info['sha256']:
        raise ValueError('Export de fichas alterado no pacote ativo')
    fichas = json.loads(content)
    with closing(sqlite3.connect(Path(db_path).resolve().as_uri() + '?mode=ro', uri=True)) as con:
        con.execute('BEGIN')
        sources = selected_sources(con)
        if not sources or sources != manifest.get('document_sources'):
            raise ValueError('Seleção documental diferente do pacote ativo')
        sid = con.execute('SELECT id FROM snapshots WHERE raw_sha256=?', (entry['raw_sha256'],)).fetchone()
        if not sid:
            raise ValueError('Snapshot ausente no staging')
        records = audit_build(con, sid[0])
    if (fichas.get('kind') != 'VALIDACAO' or fichas.get('snapshot', {}).get('raw_sha256') != entry['raw_sha256']
            or fichas.get('document_sources') != sources or len(fichas['emendas']) != len(records)):
        raise ValueError('Fichas incompatíveis com a auditoria atual')
    for record in records:
        ficha = fichas['emendas'].get(record['code'], {})
        if (ficha.get('conciliacao') != {key: record[key] for key in ('status', 'documentos_pago')}
                or any(ficha.get(key) != record[key] for key in ('pago', 'rap_pagos', 'pago_total'))):
            raise ValueError(f'Ficha divergente da auditoria: {record["code"]}')
    rows = rank(records)
    report = write(entry, sources, rows, report_dir, data_dir)
    print(f'[prioridades] {len(rows)} casos pendentes; grupos ' +
          ', '.join(f'{g["grupo"]}: {g["casos"]}' for g in summaries(rows)) + f'; {report.name}')
    return 0
