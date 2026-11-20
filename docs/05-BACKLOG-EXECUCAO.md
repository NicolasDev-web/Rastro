# Backlog prático — da ideia ao lançamento

A coluna `Etapa` é sequencial; não confundir protótipo com publicação jornalística apurada.

| Etapa | Issue | Entrega | Bloqueios | Teste de aceite |
|---|---|---|---|---|
| 0 | RAS-001 | Repo, Constitution, CI e governança | nenhum | docs e checks ativos |
| 1 | RAS-010 | Inventário CGU por exercício | fonte disponível | schema e cobertura registrados |
| 1 | RAS-011 | Inventário Transferegov | documentação API | módulos e endpoints verificados |
| 1 | RAS-012 | Ingestão raw versionada | inventário | mesmo snapshot = mesmo hash |
| 1 | RAS-013 | Parser e normalização | dicionário por fonte | dados preservam origem e valores |
| 1 | RAS-014 | Conciliação e cobertura | parsers | totais e diferenças explicadas |
| 2 | RAS-020 | Design tokens e galeria | Constituição | A11y, 360px, estados demo |
| 2 | RAS-021 | Navegação + layout editorial | tokens | navegação por teclado |
| 2 | RAS-022 | Busca municipal com fixtures | layout | acentos, filtro e vazio |
| 3 | RAS-030 | Investigação educativa | roteiro validado | fontes de conceitos e revisão |
| 3 | RAS-031 | Integração de dados auditados | RAS-014 | sem números demo em produção |
| 4 | RAS-040 | Mapa IBGE real + tabela | municipal + geo | sem atribuição indevida |
| 4 | RAS-041 | Perfis autor formal/coletivo | autoria revisada | papel de autor correto |
| 4 | RAS-042 | Fluxo de evidências | chaves/documentos | relações sempre documentadas |
| 5 | RAS-050 | Dossiê de investigação | fluxo + editorial | contraditório e revisão |
| 6 | RAS-060 | Lançamento, revisão e rollback | todas | checklist SPEC 06 integral |

## Gates obrigatórios

### Prioridades após fechamento do protótipo

- [x] P0.1 Isolar snapshots de documentos ativos sem somar versões históricas.
- [x] P0.2 Preservar valores ausentes nas fichas, conciliações e agregados territoriais.
- [x] P0.3 Validar e servir exports como pacote imutável consistente (ADR-011).
- [x] P0.4 Revisão técnica das divergências e interpretação financeira com cobertura/denominadores explícitos (ADR-012).
- [ ] Gate de publicação: concluir a investigação documental das 73 diferenças e das 11 lacunas com total positivo sem pagamento documental (ou excluir explicitamente esses casos de um recorte aprovado), com registro de revisão humana. A auditoria técnica não aprova os casos.
- [ ] P1.5 Definir publicação com snapshot aprovado e atualização controlada.
- [ ] P1.6 Completar fontes, acesso aos documentos e paginação das fichas.
- [ ] P1.7 Automatizar navegação/mobile no CI (testes de pacote já no CI).
- [ ] P1.8 Preparar atendimento, privacidade, monitoramento e recuperação.
- [ ] P2.9 Malha IBGE, exploração documental e integração Transferegov.
- [ ] P2.10 Publicação editorial e fluxo baseados em evidência real.
- [ ] P3.11 Ferramentas privadas de apuração.
- [ ] P3.12 Finalizar vídeo e divulgação após validação.

Evidências e migração do primeiro incremento: `operations/INTEGRIDADE-P0.md`.

### Ordem de investigação das lacunas — snapshot ed93842c

Fila operacional criada; investigação e revisão humana continuam pendentes. A ausência integral de pagamento documental vem primeiro; as diferenças calculáveis seguem por magnitude, sem tolerância ou dispensa de revisão dos casos menores.

| Ordem | Frente | Casos | Próxima ação |
|---|---|---:|---|
| 1 | Total positivo sem documento de pagamento | 11 | Localizar os pagamentos e conferir cobertura por ano documental |
| 2 | Diferença absoluta de R$ 1 milhão ou mais | 4 | Reabrir documentos, ajustes e datas das maiores diferenças |
| 3 | Diferença de R$ 100 mil a menos de R$ 1 milhão | 25 | Repetir a revisão documental, em valor decrescente |
| 4 | Diferença menor que R$ 100 mil | 44 | Revisar todos os casos remanescentes, inclusive diferenças de centavos |

Lista das 84 emendas, com valores e links locais: [prioridades de conciliação](../reports/prioridades-conciliacao-2026-11-19-ed93842c.md). Inclui 76 casos do recorte CE e 8 adicionais do universo das fichas. Gerar novamente: `python pipelines/run.py prioridades`. Totais da fonte sem documento e diferenças calculáveis são medidas separadas; não somar.

- **Gate A**: parser pode ser repetido e auditado sem alterar resultado.
- **Gate B**: cada total publicado é reconciliado e tem fonte/denominador.
- **Gate C**: usuário leigo entende o indicador testado e visualiza a cobertura.
- ~~**Gate D**: revisão editorial independente~~ — removido em 20/11/2026 (investigação cidadã; ver Constituição e ADR-015). Apurações sobre indivíduos continuam exigindo contraditório (regra 7).

## Entregas semanais sugeridas (sem cronograma fixo)

Iteração 1: validar fontes e schema. Iteração 2: criar pipeline e checks. Iteração 3: integrar design editorial. Iteração 4: mapear municípios. Iteração 5: rastreamento documental. Cada iteração termina com revisão da spec, não apenas uma demo visual.
