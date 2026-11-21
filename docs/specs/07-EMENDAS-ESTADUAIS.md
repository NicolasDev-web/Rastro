# SPEC 07 — Emendas parlamentares estaduais do Ceará (lado do orçamento)

**Status:** incremento 1 implementado (orçamento 2023–2026: ingestão, ligações exatas, export próprio e página `/estaduais`). Execução **não** implementada: aguarda a resposta da CGE-CE ao pedido de acesso à informação (prazo esperado até 25/11/2026). Nada publicado nem commitado.

Base: plano `docs/planos/2026-11-21-mapa-e-estaduais.md`, seção 1. Decisão de arquitetura: ADR-019.

## Problema / ator / resultado

Como morador do Ceará, quero ver as emendas que os deputados estaduais indicaram ao orçamento do Estado, por ano, com fonte, data e cobertura, para entender o que foi indicado sem confundir indicação com pagamento e sem misturar com as emendas federais.

## Não objetivos

- Não coletar as fichas de detalhe `/portal-da-transparencia/despesas/emendas-parlamentares/{id}` neste incremento (caminho B, abaixo, fica só planejado).
- Não mostrar empenho, liquidação, pagamento, beneficiário nem Nº SACC (o CSV não os traz).
- Não somar estaduais com federais em nenhum total, mapa, ficha de município ou ficha de autor.
- Não ranquear deputados nem calcular total por deputado.
- Não ligar município ou deputado por nome aproximado.
- Não alterar o pacote federal (`bundle`, `publicar`, `active-bundle.json`).

## Vocabulário e fontes

| Termo | Definição usada | Fonte |
| --- | --- | --- |
| Emenda estadual | Indicação de deputado estadual ao orçamento do Ceará. No Ceará **não é impositiva**: o Executivo decide se executa. | Diário do Nordeste (contexto, não é fonte primária) |
| PCF | Programa de Cooperação Federativa, canal das emendas individuais desde 2007; desde 2021 por transferência especial fundo a fundo (LC estadual 234/2021, alterada pela LC 243/2021; Decreto 34.096/2021). | Plano, seção 1 |
| Valor emenda / Valor lei / Valor lei créditos | Colunas do CSV, com o nome da fonte. **O dicionário de dados não as define.** Tratadas como colunas diferentes, que não se somam. | CSV |
| Município citado | Município cujo nome IBGE exato aparece no texto da coluna "Ação" segundo a regra abaixo. Não é o beneficiário e não prova o local da entrega. | Regra deste projeto |

Fontes:

- CSV por ano (ISO-8859-1, `;`): `https://cearatransparente.ce.gov.br/files/downloads/integration/expenses/parliamentary_amendments/{ANO}/emendas_parlamentares_{ANO}.csv`, anos 2023–2026 (2016–2022 dão 404). Last-Modified de todos: 02/10/2026. Extraídos em 21/11/2026.
- Dicionário: `https://cearatransparente.ce.gov.br/files/downloads/transparency/dicionario/dicionario_de_dados_emendas.pdf` (1 página, guardado com SHA-256).
- Referências já no projeto: IBGE municípios (snapshot `a7863c87`, 19/11/2026) e Alece deputados (snapshot `243d05a6`, 19/11/2026).

### Contrato verificado (21/11/2026)

24 colunas, nesta ordem: Exercício, Código da emenda, Parlamentar, Executivo, Caráter, Tipo, Órgão, Unidade orçamentária, Esfera, Função, Subfunção, Programa, Ação, Tipo da ação, Região, Despesa, Grupo de despesa, Fonte, Fonte de detalhamento, ID de uso, Resultado primário, Valor emenda, Valor lei, Valor lei créditos.

- Valores: inteiros em reais, sem separador (`300000`). O contrato aceita também `300000,00` e `300.000,00`; outro formato bloqueia.
- Nenhuma sentinela de ausência apareceu; o contrato trata `""`, `Sem informação`, `S/I` e `-` como `null`.
- Sem BOM, sem bytes 0x80–0x9F, quebra de linha `\n`.
- **Divergência do dicionário:** o PDF descreve outra tabela ("Autor Emenda", "Órgão Orçamento", "Micro-Região", "Dotação Inicial", "Dotação Atualizada", "Despesas Empenhadas/Liquidadas/Pagas"). Só "Programa" e "Ação" coincidem. Detalhes em `pipelines/contracts/ce_emendas_estaduais.json`.

## Regras / invariantes

1. Estadual nunca se soma com federal (ADR-019, Constituição 12).
2. As três colunas de valor não se somam entre si. Total por ano soma uma coluna por vez, com soma estrita: uma linha `null` torna o total `null`.
3. Ausente é `null`; `0` só quando o arquivo traz `0`.
4. Raw imutável: cópia datada `raw_data/ce_transparente/emendas/<data>_<sha8>_<arquivo>`, somente leitura, com URL, data, Last-Modified, ETag e SHA-256 no manifesto `data/manifests/snapshots.jsonl` (append-only; mesmo SHA = reaproveita).
5. Cabeçalho, codificação, Exercício diferente do ano do arquivo, código repetido, formato de valor desconhecido ou padrão de CPF em qualquer coluna de texto **bloqueiam o arquivo inteiro**.
6. Pessoas: o CSV não tem beneficiário, CPF ou CNPJ. Nenhum artefato contém dado de pessoa física. Deputados aparecem só como autores da indicação, na ordem do código da emenda.
7. Ligação ao município (só no texto da "Ação", após tirar acentos, passar a maiúsculas e tratar barra e hífen como separador):
   - `ancora_municipio`: a palavra "município" seguida, com "de/do/da" ou barra opcionais, de um nome IBGE completo, sem outro município citado no texto;
   - `nome_no_fim`: sem a palavra "município", o único nome IBGE citado fecha o texto (pode vir "/CE" depois) e vem logo após "em", "de", "do", "da", "no", "na", barra ou hífen;
   - nome menor contido em nome maior não conta ("Russas" dentro de "Nova Russas", "Acaraú" dentro de "Santana do Acaraú");
   - fora disso: `ambigua` (mais de um município), `nao_resolvida` (nome inexato, como "Tabuleiro") ou `sem_municipio`. Todas ficam `null` e entram no relatório.
8. Ligação ao deputado: nome normalizado (sem acento, maiúsculas, pontuação vira espaço) igual a **um único** nome da lista atual da Alece. Homônimo = `ambigua`; sem igual = `nao_encontrado`. Abreviação ou nome parecido não liga.
9. Demo (`DATA_MODE=demo`) não lê dados reais: a página mostra estado "demonstração" sem valores.

## Contratos

**Entrada:** contrato executável `pipelines/contracts/ce_emendas_estaduais.json`.

**Saída:** `data/estaduais/ce-estaduais-<data>-<hash8>.json` (o hash cobre os SHA-256 dos quatro CSVs, do IBGE e da Alece) e ponteiro `data/estaduais/ativo.json` `{versao, kind, arquivo, sha256}`, gravados de forma atômica. Campos principais do export: `kind = CE_ESTADUAIS_ORCAMENTO`, `esfera = estadual`, `aviso`, `fonte`, `dicionario` (URL, snapshot, divergências), `snapshots` por ano, `referencias` (IBGE, Alece), `anos`, `unidade` (centavos), `colunas_valor`, `regras`, `regras_municipio`, `cobertura` por ano, `referencias_externas`, `limitacoes` e `emendas` (uma por linha, com `id` técnico `<ano>-<código>`, número da linha, SHA da linha, campos da fonte, `municipio` e `deputado` com `situacao` e `motivo`).

**Relatório:** `reports/ce-estaduais-<tag>.md` com arquivos, cobertura, limitações, linhas sem município e nomes sem ligação.

**Site:** `apps/web/lib/estaduais.ts` confere o SHA-256 do ponteiro, o `kind`, a esfera e se todo valor é inteiro seguro ou `null`. Erro vira `DataState` de erro, sem valor estimado.

## Gherkin

**AC01** Dado o CSV oficial de um ano, quando `python pipelines/run.py estaduais` roda, então há cópia bruta datada com SHA-256 no manifesto, e uma segunda execução com o mesmo conteúdo não acrescenta linha ao manifesto e gera o export com os mesmos bytes.

**AC02** Dado um arquivo em UTF-8, com BOM, com bytes 0x80–0x9F, com coluna nova ou ordem trocada, quando a carga roda, então ela é bloqueada e nenhum export ou ponteiro novo é gravado.

**AC03** Dado um valor `"300000"`, quando convertido, então vira `30000000` centavos; dado `"Sem informação"` ou vazio, então vira `null`; dado `"12.5"`, então a carga é bloqueada.

**AC04** Dada uma coluna de valor com uma linha `null` no ano, quando o total é calculado, então o total do ano é `null` (exibido "Sem registro"), nunca zero.

**AC05** Dado "município de Tabuleiro" ou "Município de Santana de Acaraú", quando a ligação roda, então a linha fica sem município e aparece no relatório.

**AC06** Dado "APÓSTOLO LUIZ HENRIQUE" na fonte e "Ap Luiz Henrique" na Alece, quando a ligação roda, então não há ligação.

**AC07** Dada a página `/estaduais`, então ela mostra o aviso de que a emenda estadual não é impositiva e de que o arquivo traz só o orçamento, a cobertura declarada com número de linhas por ano, fonte, data de extração e SHA, e uma tabela por ano com as três colunas separadas.

**AC08** Dado qualquer artefato desta spec, então não há CPF, soma de estadual com federal, soma entre colunas de valor, total por deputado nem ordenação por valor.

**AC09** Dado `DATA_MODE=demo`, então a página não lê `data/estaduais/` e não mostra valores.

**AC10** Dado que o Ceará Transparente bloqueie o download, então o comando para com código 1 e registra o bloqueio, sem tentar contornar.

## Plano

- **Camadas:** pipeline (`ce_estaduais.py`, passo `estaduais` em `run.py`), contrato JSON, export próprio em `data/estaduais/`, loader de servidor `lib/estaduais.ts`, página `app/estaduais/page.tsx`, link em `/dados`.
- **Decisões:** export separado do pacote federal para não mexer em hash, manifesto nem validação do `bundle` (ADR-019). Ligações por regra textual exata porque o CSV não tem código IBGE nem beneficiário. Reuso de `snapshot.acquire`, `cgu.normalize_name`, `money.total`, `alece.parse` (lendo o snapshot existente, sem novo download) e dos componentes `SectionHeader`, `InfoNote`, `DataState`, `CoverageFlag`, classes `data-table`, `table-wrap`, `mapa-tabela`, `data-method`, `credits-block`.
- **Trade-offs:** a regra de município deixa 19 linhas sem ligação, das quais 2 com nome quase certo ("Tabuleiro", "Santana de Acaraú"); preferimos lacuna declarada a ligação errada. A lista da Alece é a atual; ex-deputados ficam sem ligação.
- **Riscos:** cobertura desconhecida (o arquivo parece cobrir só parte das emendas PCF); semântica das colunas de valor não documentada; layout do CSV pode mudar (bloqueio pelo contrato).
- **Testes:** `pipelines/tests/test_ce_estaduais.py`, sem rede, com CSV sintético `DEMO_`: codificação, contrato, centavos, nulos, ano, código repetido, CPF, regras de município, deputado, idempotência, totais estritos, bloqueio de rede e de contrato. `npm run typecheck` no site.
- **Rollback:** apagar `data/estaduais/ativo.json` faz a página mostrar erro declarado; remover a rota e o link em `/dados` desfaz o site. Snapshots brutos ficam (append-only).

## Tarefas

- [x] T07.01 Inventário: colunas reais dos 4 CSVs, dicionário (divergente), cobertura medida. Falta a resposta da CGE-CE sobre o recorte.
- [x] T07.02 `pipelines/rastro/ce_estaduais.py` + `pipelines/contracts/ce_emendas_estaduais.json`: raw versionado, ISO-8859-1 estrito, centavos, nulos. Testes de idempotência e de codificação.
- [x] T07.03 Ligação ao município IBGE pelas regras `ancora_municipio` e `nome_no_fim`; pendências no relatório.
- [x] T07.04 Ligação ao deputado da Alece por nome exato único; pendências no relatório.
- [x] T07.05 Export próprio `data/estaduais/` com ponteiro e SHA-256; relatório `reports/ce-estaduais-*.md`.
- [x] T07.06 Página `/estaduais` com aviso, cobertura, fonte, tabela por ano e lista por ano; link em `/dados`.
- [ ] T07.07 Revisão humana das 19 linhas sem município e dos 8 nomes sem ligação (registro versionado no padrão de `autores_vinculo.json`, com revisor identificado). Nada liga sem esse registro.
- [ ] T07.08 Execução: caminho A (resposta da CGE-CE) ou, se ela não vier até 25/11/2026, caminho B. Atualizar esta spec antes de codar.
- [ ] T07.09 Conferir cobertura com outra fonte (quadro de emendas da LOA no Diário Oficial ou resposta da CGE-CE) antes de chamar qualquer total de "total das emendas estaduais".
- [ ] T07.10 Navegação principal: decidir se `/estaduais` entra no menu (proposta no relatório da tarefa) e atualizar o aviso da seção "Deputados estaduais" em `/parlamentares`, que ainda diz "sem fonte estruturada".

## Caminho B — coleta das fichas com navegador automatizado (planejado, NÃO executar antes de 25/11/2026)

Só começa se a CGE-CE não responder até 25/11/2026 ou responder sem arquivo aberto, e depois de atualizar esta spec.

- **Escopo:** fichas `/portal-da-transparencia/despesas/emendas-parlamentares/{id}` (id interno sequencial; ex.: 656 = emenda 0507/2026). Campos: Beneficiário, Nº SACC, Objeto, Valor empenhado, Valor pago, Início da execução, mais exercício e código da emenda para ligar ao CSV.
- **Ferramenta:** Playwright, já usado em `verify_web.py`, com User-Agent genérico do projeto, sem login, sem cookies além dos estritamente necessários e sem contornar bloqueio, CAPTCHA ou limite. Bloqueio = parar e registrar.
- **Ritmo:** um acesso por vez, intervalo mínimo de 3 s, poucas centenas de páginas, em horário de baixa carga. Interromper com erro HTTP 403/429.
- **Proveniência:** guardar o HTML renderizado de cada ficha como snapshot imutável (`raw_data/ce_transparente/fichas/<data>_<sha8>_<id>.html`) no manifesto, com URL e data. O parser roda sobre a cópia guardada, nunca sobre a página viva.
- **Contrato:** rótulos esperados da ficha versionados; rótulo ausente ou novo bloqueia o lote (o layout é frágil). Valores no formato `R$ 1.234,56` → centavos; vazio → `null`.
- **Ligação ao CSV:** só por `(exercício, código da emenda)` exatos. Ficha sem par no CSV entra como linha própria da ficha, sem somar ao orçamento.
- **Pessoas:** beneficiário pessoa física ou MEI é mascarado no parser (`[pessoa física — omitido]`, `[empresário individual — omitido]`), nunca sai do raw com nome ou documento. CNPJ de ente público pode ser mantido.
- **Etapas:** empenhado e pago em colunas próprias; nunca somar com "Valor emenda"/"Valor lei" nem com valores federais.
- **Metodologia:** a página declara que a execução veio de coleta automatizada das fichas, com data, número de fichas e falhas.
- **Testes:** HTML sintético `DEMO_` para cada rótulo, mudança de layout, mascaramento, ligação exata e idempotência.

## Evidência de conclusão (21/11/2026)

- `python pipelines/run.py estaduais` (duas vezes): 1ª execução gravou 4 CSVs + dicionário no manifesto (`4f0231a7`, `c7590490`, `637b8bb9`, `1167d6a7`, dicionário `66a3197f`); 2ª execução reaproveitou todos, manifesto ficou com 21 linhas antes e depois, export `ce-estaduais-2026-11-21-f679f3bb.json` com o mesmo SHA-256 `65296263d7bd…` nas duas.
- Cobertura medida:

| Ano | Linhas | Parlamentares | Ligados à Alece | Linhas c/ município | Valor emenda | Valor lei | Valor lei créditos |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2023 | 25 | 12 | 11 | 24 | R$ 10.050.000,00 | R$ 10.050.000,00 | R$ 6.110.000,00 |
| 2024 | 83 | 35 | 31 | 73 | R$ 17.775.000,00 | R$ 17.775.000,00 | R$ 22.725.000,00 |
| 2025 | 50 | 27 | 23 | 43 | R$ 17.121.700,00 | R$ 17.121.700,00 | R$ 21.671.700,00 |
| 2026 | 37 | 23 | 23 | 36 | R$ 19.470.000,00 | R$ 19.470.000,00 | R$ 19.370.000,00 |

  Todas as 195 linhas são PCF, INDIVIDUAL. O plano contou 51 linhas em 2025; o arquivo baixado tem 50. O "Valor lei" de 2026 (R$ 19,47 mi) bate com o valor do painel da página citado no plano. Beneficiários: o CSV não tem a coluna.
- `python -m unittest discover -s pipelines/tests -v`: 90 testes, OK (28 novos em `test_ce_estaduais.py`).
- `npm run typecheck` em `apps/web`: sem erros.
- Não rodado: `next build` (feito pelo responsável no fim). A página não foi vista no navegador.
