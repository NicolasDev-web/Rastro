# Plano SDD — Spec Driven Development

Cada implementação é dirigida por especificação e só fecha quando a evidência dos critérios de aceite está registrada.

| Ordem | Spec | Artefato verificável | Dependência |
|---|---|---|---|
| 0 | 00 Constituição | Regras e definições imutáveis | Nenhuma |
| 1 | 01 Dados federais | Pipeline reproduzível + reconciliação | 0 |
| 2 | 02 Design system | Biblioteca de componentes e estados | 0 |
| 3 | 03 Reportagem | Narrativa didática e fontes | 1,2 para publicação real |
| 4 | 04 Exploradores | Busca, mapas, perfis e fluxos | 1,2 |
| 5 | 05 Apuração | Dossiês, contraditório e proveniência | 1,4 |
| 6 | 06 Lançamento | Acessibilidade, segurança, observabilidade e editorial | Todas |

## Protocolos por feature

- **Entrada:** abrir spec; escrever ou revisar `PLAN`, `TASKS`, testes e alterações necessárias.
- **Desenvolvimento:** aplicar tarefa única; abrir PR com mudanças de código + teste + changelog.
- **Verificação:** CI, inspeção visual mobile/desktop, reconciliação numérica, revisão editorial quando envolver publicação.
- **Saída:** marcar aceites e registrar evidência do teste (comando + resultado, screenshot, documento, checksum de dataset).

## Backlog macro (issues / epics)

- E01 Auditoria: descobrir dados e dicionários, mapear cobertura temporal.
- E02 ETL: raw snapshot, parser CGU, adaptação Transferegov, dedupe.
- E03 Modelo: esquema, correspondências, fontes, datas, estados.
- E04 Métricas: valores por etapa, geografia, autoria, per capita.
- E05 UX: tokens, componentes, narrativas, ícones, responsividade.
- E06 Exploração: busca municipal, filtros, autores coletivos, fluxos.
- E07 Editorial: reportagem, glossário, revisão, direitos de resposta.
- E08 Operação: publicação auditada, monitoramento, correções, segurança.

## Regra de mudança

Qualquer alteração na definição de métrica pede: atualização da spec, migration se necessário, fixtures, testes, aviso no changelog e reprocessamento de snapshots afetados.

## Critério de pronto (geral)

- [ ] Critérios de aceite aprovados e testados.
- [ ] Sem números fictícios em interface classificada como dados oficiais.
- [ ] Documento de fonte, escopo, data e método para cada indicador.
- [ ] Zero duplicidade crítica e conciliação aprovada.
- [ ] Layout testado com teclado e mobile.
- [ ] Monitoramento/logs adequados e plano de rollback.
- [ ] Revisão editorial e legal quando aplicável.
