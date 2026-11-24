# Backlog prático — da ideia ao lançamento

A coluna `Etapa` é sequencial; não confundir protótipo com publicação jornalística apurada. A coluna `Situação` foi conferida em 23/11/2026 contra o CHANGELOG, as specs e o site publicado.

| Etapa | Issue | Entrega | Bloqueios | Teste de aceite | Situação (23/11/2026) |
|---|---|---|---|---|---|
| 0 | RAS-001 | Repo, Constitution, CI e governança | nenhum | docs e checks ativos | Feito. CI roda testes do pipeline, da API, typecheck e build. |
| 1 | RAS-010 | Inventário CGU por exercício | fonte disponível | schema e cobertura registrados | Feito (`reports/inventario-cgu-*`, `cobertura-cgu-*`). |
| 1 | RAS-011 | Inventário Transferegov | documentação API | módulos e endpoints verificados | Feito em 0.10.0 (ADR-018). |
| 1 | RAS-012 | Ingestão raw versionada | inventário | mesmo snapshot = mesmo hash | Feito (manifesto SHA-256, append-only). |
| 1 | RAS-013 | Parser e normalização | dicionário por fonte | dados preservam origem e valores | Feito. |
| 1 | RAS-014 | Conciliação e cobertura | parsers | totais e diferenças explicadas | Feito em 0.5.2 e 0.7.0: 84 casos investigados; depois da reabertura de 24/11/2026, 56 explicados e 28 sem causa documentada, todos visíveis. |
| 2 | RAS-020 | Design tokens e galeria | Constituição | A11y, 360px, estados demo | Parcial: testes visuais 768 px e acessibilidade automatizada em aberto (SPEC 02, T02.07). |
| 2 | RAS-021 | Navegação + layout editorial | tokens | navegação por teclado | Feito. |
| 2 | RAS-022 | Busca municipal com fixtures | layout | acentos, filtro e vazio | Feito (busca real no `/mapa` desde 0.9.0). |
| 3 | RAS-030 | Investigação educativa | roteiro validado | fontes de conceitos e revisão | Feito: glossário conferido com as normas em 22/11/2026; revisão externa dispensada (ADR-015). |
| 3 | RAS-031 | Integração de dados auditados | RAS-014 | sem números demo em produção | Feito: modo publicado (0.6.0, ADR-015) e trava do build. |
| 4 | RAS-040 | Mapa IBGE real + tabela | municipal + geo | sem atribuição indevida | Feito em 0.9.0 (ADR-017). |
| 4 | RAS-041 | Perfis autor formal/coletivo | autoria revisada | papel de autor correto | Parcial: 43 de 43 vínculos revisados; falta o histórico de partido (SPEC 04, T04.04). |
| 4 | RAS-042 | Fluxo de evidências | chaves/documentos | relações sempre documentadas | Feito em 0.8.0 e 0.10.0; contrato ou obra de convênio segue como lacuna da fonte. |
| 5 | RAS-050 | Dossiê de investigação | fluxo + editorial | contraditório e revisão | Parcial: reportagens 02 e 03 publicadas (0.13.0); ferramentas de apuração da SPEC 05 não começaram. |
| 6 | RAS-060 | Lançamento, revisão e rollback | todas | checklist SPEC 06 integral | Parcial: site no ar desde 20/11/2026; SPEC 06 com tarefas abertas (CI E2E, links, performance, monitoramento, rollback testado). |

## Gates obrigatórios

### Prioridades após fechamento do protótipo

- [x] P0.1 Isolar snapshots de documentos ativos sem somar versões históricas.
- [x] P0.2 Preservar valores ausentes nas fichas, conciliações e agregados territoriais.
- [x] P0.3 Validar e servir exports como pacote imutável consistente (ADR-011).
- [x] P0.4 Revisão técnica das divergências e interpretação financeira com cobertura/denominadores explícitos (ADR-012).
- [x] Gate de publicação — investigação documental: as 73 diferenças e as 11 lacunas (84 casos) foram investigadas em 20/11/2026, com achado, fontes e data em `pipelines/contracts/investigacao_casos.json` e exibição na ficha de cada emenda (0.7.0). Resultado: 49 explicados, 35 sem causa documentada.
- [x] Gate de publicação — registro de revisão humana: o revisor do projeto confirmou a revisão dos 84 casos, registrada em 23/11/2026 no campo `revisor` de cada registro (49 explicados e 35 sem causa).
- [x] Reabertura dos 35 casos sem causa com a API do Portal e o Transferegov (24/11/2026): 7 passaram a explicados (pagamentos que existem no registro de convênios do Portal, no Transferegov ou em ordens bancárias sem vínculo com o empenho) e 3 ganharam conferência parcial. Resultado: 56 explicados e 28 sem causa.
- [x] Revisão humana dos 10 registros alterados em 24/11/2026: o revisor do projeto aprovou os textos no mesmo dia (campo `revisor`).
- [ ] Os 28 casos sem causa documentada: oito pedidos LAI redigidos em `operations/PEDIDOS-LAI-2026-11.md` (24/11/2026), dois à CGU e seis aos órgãos executores; falta enviar pelo Fala.BR e anotar os protocolos. O 202644130007 (IPHAN, 2026) espera a próxima atualização dos dados.
- [x] P1.5 Definir publicação com snapshot aprovado e atualização controlada — modo publicado com cópia congelada e SHA-256 (0.6.0, ADR-015), deploy só pela CLI (ADR-020), rotina em `operations/ATUALIZACAO-DADOS.md` e build que recusa registro de investigação de outro snapshot (0.12.0).
- [ ] P1.6 Completar fontes, acesso aos documentos e paginação das fichas — fontes e links ao Portal nas fichas desde 0.5.0 e 0.8.0; paginação das fichas não conferida.
- [x] P1.7 Automatizar navegação/mobile no CI — desde 24/11/2026 o CI roda `verify_web.py` (1440, 768 e 360 px, teclado, CSV, 404) e `verify_a11y.py` (axe) no build de demonstração.
- [ ] P1.8 Preparar atendimento, privacidade, monitoramento e recuperação — atendimento (e-mail público, ADR-015) e `/privacidade` (0.12.0) feitos; rollback documentado (`vercel promote`), mas nunca testado; sem monitoramento.
- [x] P2.9 Malha IBGE, exploração documental e integração Transferegov — malha e mapa em 0.9.0, Transferegov no fluxo em 0.10.0.
- [x] P2.10 Publicação editorial e fluxo baseados em evidência real — fluxo real por emenda (0.8.0) e reportagens 02 e 03 (0.13.0).
- [ ] P3.11 Ferramentas privadas de apuração (SPEC 05, nenhuma tarefa iniciada).
- [ ] P3.12 Finalizar vídeo e divulgação após validação.

Evidências e migração do primeiro incremento: `operations/INTEGRIDADE-P0.md`.

### Ordem de investigação das lacunas — snapshot ed93842c

Investigação concluída em 20/11/2026: 49 casos explicados e 35 sem causa documentada, todos com registro público na ficha da emenda (ver CHANGELOG 0.7.0). A ausência integral de pagamento documental vem primeiro; as diferenças calculáveis seguem por magnitude, sem tolerância ou dispensa de revisão dos casos menores.

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
