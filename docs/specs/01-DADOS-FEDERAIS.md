# SPEC 01 — Aquisição e integridade dos dados federais

**Status**: incremento 1 em implementação (CGU arquivo único + IBGE → staging SQLite → modo validação). Nada publicado.

## User story
Como pesquisador, quero importar dados oficiais de emendas federais, preservar os arquivos e medir a cobertura para que toda visualização seja reproduzível.

## Escopo
CGU (emendas e documentos), Transferegov (instrumentos e transferências especiais), IBGE (códigos geográficos) e, para conferência, TCU e CaptaCeará. Período de estudo 2020–2026, publicar somente anos/recortes validados.

## Contratos de entrada
`source_id`, `source_url`, `downloaded_at`, `raw_sha256`, `raw_filename`, `format`, `dictionary_version`, `license_or_terms`, `record_count`.

## Regras de transformação

### Incremento P0 — snapshots e ausência

PLAN: selecionar hashes ativos dos documentos em tabela própria e consultar uma view filtrada; preservar histórico. Trocar a seleção em transação após todos os arquivos serem validados. Somas incompletas retornam null e conciliação indisponível. Exports devem formar um pacote imutável com hashes e ponteiro atômico; Next lê um pacote por processo. Sem alteração de endpoints ou design.

TASKS: P0.1 view/seleção e regressões de reingestão; P0.2 somas estritas e estado indisponível; P0.3 pacote validado no pipeline e carregamento conjunto no servidor.

Aceites: snapshot antigo não dobra somas; erro na carga preserva seleção anterior; null não vira zero nem selo confere; arquivos ausentes/corrompidos/incompatíveis bloqueiam todo o pacote, sem fallback demo. Migração local exige reexecutar documentos e exports antes de ativar o pacote.

### Incremento P0.4 — revisão de conciliação

PLAN: compartilhar a comparação exata de pagamento entre fichas e auditoria. Selecionar emendas pelo recorte CE, mas comparar todas as linhas do código oficial com todos os seus documentos ativos: um código pode atravessar localidades. Separar falta de pagamento, soma incompleta, igualdade e diferença. Conciliação de empenho tem denominador próprio e independe do resultado de pagamento. Sem novos endpoints ou mudança de layout; ajustar o texto financeiro para descrever os campos da fonte sem afirmar divisão temporal não comprovada.

TASKS: comparação pura e regressões; auditoria determinística JSON/CSV sem favorecidos; relatório com os dois universos (recorte CE e todas as fichas), denominadores, diferenças assinadas e hipóteses pendentes; reprocessamento e documentação.

Aceites: emenda só com empenho não é divergência de pagamento; nenhuma parcela ausente vira zero; igualdade apenas com Pago continua divergente de Pago + RAP; os status da auditoria e das fichas coincidem; categorias particionam cada universo; relatório não conclui causa ou irregularidade a partir de diferença. Artefatos identificam snapshot principal, fontes documentais e linhas de origem, sem nomes de favorecidos. Relatórios anteriores são históricos; a revisão atual substitui conclusões numéricas de conciliação, sem alterar a conferência manual assinada.

### Fila de prioridade da investigação

PLAN: derivar uma fila local da auditoria do staging ativo, em leitura somente, sem novos endpoints, tabelas ou componentes públicos. Priorizar lacunas com total positivo sem pagamento documental; depois diferenças absolutas de pelo menos R$ 1 milhão, de R$ 100 mil até menos de R$ 1 milhão e menores que R$ 100 mil. Dentro de cada grupo, valor decrescente e código como desempate. As faixas são uma convenção operacional de triagem, sem tolerância financeira, indicação de irregularidade ou aprovação editorial. Os grupos posteriores continuam bloqueando publicação dos casos que incluam.

TASKS: ordenar casos com chave determinística; gerar relatório e matriz local JSON/CSV com posição, motivo, valores em centavos, ação de investigação, fontes e link de ficha; vincular a fila ao backlog e testar seleção, limites, empates, valores ausentes e reprodução.

Aceites: uma entrada por código; comparar apenas diferenças calculáveis e incluir a ausência de pagamento apenas quando o total da fonte for positivo; null permanece null e diferença de uma ausência nunca é calculada como zero. Valores ausentes/incompletos novos ficam em grupo próprio inicial de diagnóstico, sem estimativa monetária. Não somar valores de cobertura com diferenças entre fontes; distinguir recorte CE de todas as fichas. Exigir seleção documental compatível com o pacote ativo, sem alterar snapshots, planilha assinada ou os quatro exports. A fila não inclui nomes ou identificadores de favorecidos e não é servida pela aplicação pública.

### Registro de investigação e recorte aprovado

PLAN: cada caso da fila recebe um registro versionado em `pipelines/contracts/investigacao_casos.json`, no mesmo padrão de `autores_vinculo.json`. Campos por código de emenda: `status` (`explicado` | `sem_causa` | `excluido`), `achado` (o que os dados provam), `causa` (somente quando documentada), `fontes` (arquivo e linha, ou URL oficial), `analista`, `revisor` e `data`. O passo `python pipelines/run.py recorte` lê o registro e classifica cada ficha como `aprovado` ou `lacuna_declarada`. Sem novas tabelas no staging nem endpoint.

TASKS: contrato e validação do registro; passo `recorte` em leitura somente; marcação no pacote e nota de lacuna na ficha; testes de casos sem registro, sem revisor e com valores ausentes.

Aceites: só entra no recorte aprovado um caso da fila com status `explicado` **e** revisor humano identificado. Casos sem registro, `sem_causa` ou `excluido` viram `lacuna_declarada` e não entram em somas publicadas. A nota pública descreve a lacuna sem sugerir causa ou irregularidade. `analista` pode ser automatizado, `revisor` não. O registro não contém nomes ou identificadores de favorecidos.

- Preservar arquivo bruto e tipo original; nunca sobrescrever snapshots.
- Mapear ID de emenda, exercício, modalidade, autor, favorecido, natureza/etapa de valor.
- Guardar `source_row_id`; gerar ID técnico se não houver chave, nunca fingir que é oficial.
- Falha de schema/paginação invalida snapshot completo até revisão.
- Geografia: diferenciar beneficiário com código municipal do Estado sem município; indeterminados em grupo próprio.
- Valores monetários com `NUMERIC(18,2)` e moeda BRL; nunca usar float para somas oficiais.
- Aplicar dedupe por chave composta revisada para cada fonte; nunca por valor/nome apenas.
- Expor métricas independentes: autorizado/indicado, empenhado, liquidado, pago e transferido quando suportado.
- Publicação somente após reconciliação por etapa, fonte, exercício, modalidade e cobertura.

## Contrato verificado — CGU "arquivo único" (inventário de 19/11/2026)

Fonte: `https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares/UNICO` → ZIP (47,2 MB, atualização diária). Contrato executável em `pipelines/contracts/cgu_emendas.json`.

- **Formato:** CSV `cp1252`, separador `;`, campos entre aspas, decimal com vírgula e sem separador de milhar (`408000,00`).
- **Arquivos no ZIP (6):** `EmendasParlamentares.csv` (94.948 linhas, 2014–2026), `_PorFavorecido.csv`, `_Convenios.csv`, `_Parcerias.csv`, `_PlanodeTrabalhoParcerias.csv`, `_PlanodeTrabalhoTransferenciasEspeciais.csv`. Os três últimos **não constam do dicionário oficial**: só são inventariados neste incremento.
- **Divergências arquivo × dicionário:** coluna extra `Possui Apoiador/Solicitante? ` (com espaço final); `Localidade do Gasto` chama-se `Localidade de aplicação do recurso`. O contrato segue o arquivo real e registra cada divergência; qualquer mudança nova de cabeçalho bloqueia a carga (AC05).
- **Sentinelas (viram `NULL`, nunca nome ou zero):** `Sem informação`, `S/I`, `-99`; e `-1` em `Código UF IBGE` das localidades Nacional, regionais e Exterior. Código da emenda ausente em 17.810 linhas (2014–2020); essas linhas recebem ID técnico, marcado como não oficial.
- **Granularidade:** uma linha por emenda × classificação (função…plano orçamentário) × localidade; 58 códigos aparecem em 2 linhas; nenhuma duplicata exata. Linhas diferentes do mesmo código são partes distintas da emenda.
- **Etapas disponíveis:** Empenhado, Liquidado, Pago, Restos a Pagar Inscritos, Cancelados e Pagos. **Não há "Autorizado".** "Pago" e "RAP Pagos" são métricas separadas e **não são somadas** até a conferência amostral (T01.09) confirmar a semântica.

### Escopo territorial (Ceará)

Decidido **pelo código IBGE da UF (`2300000`) e do município**, nunca por texto — o arquivo tem `CEARÁ-MIRIM - RN` (município potiguar).

| `territorial_scope` | Regra | Linhas CE no inventário |
|---|---|---|
| `municipio` | código de município com 7 dígitos presente na lista IBGE do CE | 1.852 |
| `estado` | localidade `CEARÁ (UF)`: aplicação estadual, **não** "governo do estado" | 641 |
| `multiplo` | localidade `MÚLTIPLO`: vários municípios, sem atribuição possível | 1.033 |
| `fora_do_recorte` | outra UF, região ou `Nacional` (5.399 linhas nacionais contadas na cobertura) | — |

### Armazenamento e privacidade

- Dinheiro em **centavos inteiros** (SQLite não tem decimal exato); vazio → `NULL`.
- Favorecido pessoa física ou `Empresário (Individual)`: código e nome mascarados fora do raw (LGPD). Raw fica fora do Git.
- Município do favorecido vem por nome: casamento exato normalizado contra o IBGE dentro da UF; sem casamento → `NULL` (sem fuzzy).

## Cenários de aceite (Gherkin)

**AC01** Dado download oficial concluído, quando ingerido, então arquivo bruto e SHA-256 são preservados e toda linha tratada possui referência ao snapshot.

**AC02** Dado o mesmo snapshot reaplicado, quando o pipeline executa duas vezes, então contagens e valores reconciliados não mudam (idempotência).

**AC03** Dada uma emenda com 3 documentos financeiros, quando consulto o total da emenda, então ela é contada uma única vez no denominador das emendas e os documentos não multiplicam sua autorização.

**AC04** Dado beneficiário estadual sem município, quando agrego a cidade de Fortaleza, então o valor não aparece como automaticamente destinado à capital.

**AC05** Dado campo desconhecido em novo schema, quando o parser processa o arquivo, então ele registra falha e bloqueia publicação sem inventar o significado do campo.

**AC06** Dado um arquivo sem valor financeiro identificável, quando consulto sua métrica, então o resultado é nulo ou indisponível, jamais zero fabricado.

**AC07** Dado um campo com `Sem informação`, `S/I` ou `-99`, quando a linha é carregada, então o valor vira `NULL` e nunca aparece como nome de autor, município ou código.

**AC08** Dada uma localidade cujo texto contém "CEARÁ" mas cuja UF é outra (ex.: `CEARÁ-MIRIM - RN`), quando filtro o recorte do Ceará, então a linha fica fora.

**AC09** Dado um favorecido pessoa física ou empresário individual, quando qualquer artefato derivado é gerado (staging, relatório, export), então código e nome não aparecem.

## Tasks
- [x] T01.01 Catalogar endpoints, arquivos, filtros, dicionários e cobertura por ano — CGU arquivo único e IBGE (`reports/inventario-cgu-*.md`); documentos e Transferegov catalogados em `docs/sources/FONTES-OFICIAIS.md`.
- [x] T01.02 Criar manifest de snapshots e armazenamento imutável (`pipelines/rastro/snapshot.py`, `data/manifests/snapshots.jsonl`).
- [x] T01.03 Implementar adaptador CGU usando arquivos oficiais — arquivo único (por emenda, favorecido, convênios). Documentos de despesa: incremento 2.
- [ ] T01.04 Implementar adaptador Transferegov verificando esquema real.
- [x] T01.05 Importar IBGE municípios/UF, com geocódigo único — 184 municípios do CE. Malha geográfica: pendente (SPEC 04, T04.03).
- [x] T01.06 Implementar staging e validações de unicidade/valor/data (`pipelines/rastro/load.py`, `db/staging/001_staging.sql`).
- [x] T01.07 Definir relacionamentos documentados e conciliação — documentos de despesa 2020–2026 × arquivo por emenda (`pipelines/rastro/documentos.py`, `reports/conciliacao-documentos-*.md`).
- [x] T01.08 Produzir cobertura, exceções e export auditável (`reports/cobertura-cgu-*.md`, `data/validacao/*.json`).
- [x] T01.09 Teste manual amostral contra interface original e revisão — 10 emendas × 6 medidas conferidas no Portal pelo revisor do projeto em 19/11/2026 (`reports/conferencia-amostral-2026-11-19-ed93842c.md`, assinado).

## Evidências necessárias
Logs de ingestão, checksums, reporte de cobertura, testes automáticos e registro de conferência amostral assinado pelo revisor.

## Evidências do incremento 1 (19/11/2026)

Registro histórico: percentuais de conciliação e a interpretação financeira desta execução foram substituídos pela revisão P0.4 e pela ADR-012. O resultado vigente está em `reports/revisao-conciliacao-2026-11-19-ed93842c.md`; a aprovação editorial de publicação continua pendente.

Execução: `python pipelines/run.py all` sobre o snapshot `ed93842c` (CGU, 47,2 MB) e `a7863c87` (IBGE).

| AC | Situação | Evidência |
|---|---|---|
| AC01 | Atende | Raw somente leitura em `raw_data/` + SHA-256 no manifesto; toda linha do staging tem `snapshot_id`, `source_row_id` e `row_sha256`. Teste `test_snapshot_preserved_and_reused`, `test_every_line_references_snapshot`. |
| AC02 | Atende | Duas cargas seguidas do snapshot real: hash do staging `a34dadc7…` e do export `2d2b2325…` idênticos. Teste `test_idempotent`. |
| AC03 | Atende | Totais vêm do arquivo por emenda; documentos só conciliam (até 369 documentos numa emenda, contada uma vez). Teste `test_each_amendment_counted_once_ac03`. |
| AC04 | Atende | 641 linhas `CEARÁ (UF)` e 1.033 `MÚLTIPLO` ficam fora dos municípios. Teste `test_state_never_counted_in_fortaleza`. |
| AC05 | Atende | Contrato executável bloqueia coluna/arquivo novo antes de gravar. Teste `test_unknown_column_blocks_load`. |
| AC06 | Atende | Vazio → `NULL`; ano sem linhas → `null` no export. Testes `test_missing_is_none_not_zero` e AC04. |
| AC07 | Atende | Sentinelas → `NULL`; 17.810 linhas sem código recebem `TEC-…` não oficial. Teste `test_code_less_line_gets_technical_id`. |
| AC08 | Atende | `CEARÁ-MIRIM - RN` (11 linhas) fora do recorte. Teste `test_classify_by_code_not_text`. |
| AC09 | Atende | 6.691 favorecidos CE mascarados; nomes e códigos ausentes do staging. Teste `test_private_persons_masked`. |
| Gate A | Atende | Conservação bruto × staging: 38 combinações ano × escopo × 7 medidas idênticas ao centavo. |
| Gate B | Atende (em validação) | Conferência amostral 60/60; conciliação com documentos: pagamentos batem em 95,7% das emendas e empenhos em 93,3%; exceções listadas para investigação. Publicação ainda depende de revisão editorial (Gate D). |

**Achado para a pauta:** em 2020–2026, só 5% a 18% do valor pago por ano nas emendas com localidade no Ceará tem município identificado no arquivo da CGU; o restante está como `MÚLTIPLO` ou `CEARÁ (UF)`. Há ainda emendas com localidade `Nacional` (R$ 3,2 bi pagos só nas emendas de 2020, todas as UFs) que podem ter aplicação no Ceará. Isso orienta o incremento 2.

## Resultado da conferência amostral (T01.09)

- **Revisor:** revisor do projeto · 19/11/2026 · snapshot `ed93842c`.
- **Resultado:** 60 de 60 valores conferem com o Portal da Transparência (10 emendas × empenhado, liquidado, pago, RAP inscritos, RAP cancelados, RAP pagos). Uma marcação (RAP pagos da emenda 202241380014) foi feita fora da caixa, com "s"; registrada como "confere".
- **Perguntas semânticas:** o revisor respondeu "não sei" às duas. Não há definição oficial publicada no dicionário da CGU.
- **O que a amostra indica (hipótese H1, ainda não confirmada):** "Pago" é o pagamento feito no próprio ano da emenda e "RAP pagos" é o pago depois, como restos a pagar — fluxos que não se sobrepõem. Evidências: 202033400010 (empenhado R$ 300 mil; pago 0; RAP pagos R$ 300 mil), 202241380014 (RAP inscritos R$ 150.000 = cancelados R$ 13.220 + pagos R$ 136.780), 202541380016 (pago R$ 800 mil + RAP pagos R$ 800 mil = empenhado R$ 1,6 mi). Nenhum caso da amostra tem pago + RAP pagos maior que o empenhado. Contra-indício: 202541380016 tem RAP inscritos = 0 apesar de RAP pagos > 0, então "RAP inscritos" não é sempre o valor inscrito.
- **Decisão:** até a confirmação, o site continua mostrando "Pago" e "RAP pagos" separados, sem soma. A confirmação vem do incremento 2: os documentos de pagamento, com data, permitem somar o pago por emenda e comparar com pago + RAP pagos.

## Incremento 2 — documentos de despesa (19/11/2026)

Os números e a conclusão abaixo registram a execução anterior. A seleção ativa de snapshots, a distinção entre ausência e zero e a comparação de todas as localidades foram corrigidas em P0.1–P0.4. Para o resultado atual, consultar `reports/revisao-conciliacao-2026-11-19-ed93842c.md`. A igualdade é evidência numérica por código, não confirmação universal da interpretação temporal dos campos.

Fonte: `emendas-parlamentares-documentos/{ANO}` (2020–2026, 7 ZIPs, 3.610.312 documentos). **O ano do arquivo é o ano do documento**, não da emenda. Contrato congelado em `pipelines/contracts/cgu_documentos.json` (49 colunas, iguais nos 7 anos). Guardados 64.250 documentos ligados ao recorte (emendas com linha no CE ou de autores eleitos pelo CE) ou com aplicação no CE; 1.496 favorecidos mascarados (pessoa física ou nome de empresário individual).

**Resultado histórico, substituído pela revisão P0.4:** para cada emenda de 2020–2026 do recorte, a soma dos documentos na fase Pagamento é exatamente **Pago + RAP pagos** em 1.719 de 1.796 emendas (95,7%); entre as 706 com restos a pagar pagos, em 635 (89,9%), e os documentos cobrem 97,1% do valor de RAP pagos. Só 13 emendas batem com "só Pago". Conclusão: "RAP pagos" são pagamentos feitos nos anos seguintes ao da emenda; **pago total = Pago + RAP pagos** (mesma etapa, anos diferentes — não fere a regra 3 da Constituição). As 64 exceções (quase todas com documentos abaixo do RAP pago) ficam listadas no relatório para investigação.

**Empenho:** soma dos documentos de empenho = "Valor Empenhado" em 1.675 de 1.796 emendas (93,3%).

**Ganho de rastreabilidade (achado para o próximo incremento):** 610 emendas registradas como `MÚLTIPLO` (vários municípios) têm R$ 4,65 bi em documentos de pagamento com **município de aplicação no Ceará**. Nenhuma emenda `Nacional` tem pagamento aplicado em município do CE. Próximo passo: medida separada "pago por município de aplicação (documentos)" no explorador — nunca somada à medida por emenda.
