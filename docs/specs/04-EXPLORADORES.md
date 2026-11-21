# SPEC 04 — Exploradores municipal, autoria e fluxo

## Histórias
Como cidadão, quero consultar município, período e etapa financeira; como pesquisador, quero filtros reprodutíveis, tabela exportável e documentação das relações.

## Frentes A/B — contrato de fechamento

P0.4: fichas e auditoria usam a mesma comparação exata. Rótulos usam os campos Pago e RAP pagos, sem afirmar que a igualdade comprova a divisão temporal dos campos. Ausência de pagamento documental não é divergência.

P0: `conciliacao.status` inclui `indisponivel` para valores incompletos. Os campos monetários das fichas aceitam null, inclusive o total dos documentos; a interface usa “Sem registro”. A existência de um documento sem valor não autoriza selo de conferência. A carga de validação exige pacote integral validado (ADR-011).

- Critério `emenda`: localidade da própria emenda, preservando os escopos não municipais.
- Critério `aplicacao`: documentos de pagamento agrupados por município de aplicação e ano da emenda; inclui RAP pagos. Os critérios são separados na tela, URL e CSV e nunca se somam. CSV por aplicação exclui agregados estaduais e não acrescenta RAP novamente.
- `/emendas/[codigo]`: valores, autoria formal, conciliação (`confere`, `diverge`, `sem_documentos`), cronologia por fase, favorecidos e convênios. Liquidação sem valor permanece ausente. Sem inferência de entrega ou irregularidade.
- `/municipios/[ibge]`: dois critérios por ano, listas de emendas, autores com ficha e favorecidos. Emenda fora da cobertura de fichas aponta ao Portal.
- Favorecidos chegam mascarados da ingestão; as fichas não exportam identificadores pessoais.
- AC12: valores do CSV reproduzem o critério ativo e o ano.
- AC13: documentos de empenho não entram no total pago; divergências e ausência de documentos permanecem explícitas.
- AC14: fichas e páginas institucionais navegáveis em desktop e 360px, sem overflow da página; tabelas podem rolar no próprio contêiner.
- AC15: prévia offline em demo inclui fichas municipais, emenda fictícia e páginas institucionais, sem links locais quebrados.

Testes: `pipelines/tests/test_fichas.py` e `scripts/verify_web.py`. Evidências no relatório de fechamento. O conjunto de fichas é maior que o recorte exclusivo CE porque inclui emendas dos autores eleitos pelo CE; percentuais de conciliação desses universos não são intercambiáveis.

## Filtros
Ano, modalidade, etapa (indicada/autorizada/empenhada/liquidada/paga/transferida se disponível), função, beneficiário, tipo de autoria, município/Estado/indeterminado, cobertura.

## Etapas e escopos (revisão de 19/11/2026, após inventário da fonte)

- A fonte CGU não traz valor "autorizado". Etapas do explorador: **Empenhado, Liquidado, Pago**. "RAP pagos" aparece à parte e, somado ao "Pago", forma o **pago total** (convenção operacional comparada por emenda com documentos — SPEC 01, P0.4). Empenhado, liquidado e pago continuam sem soma entre si.
- Fora da contagem municipal: **"Ceará — aplicação estadual"** (localidade `CEARÁ (UF)`) e **"Ceará — vários municípios"** (localidade `MÚLTIPLO`). O rótulo "Governo do Estado" deixa de ser usado: a localidade estadual não identifica quem recebeu.
- Modo `validacao` (ADR-008): dados reais em validação, só local, com aviso e `coverage: unverified`.

## Fichas de autores (T04.04, revisão de 19/11/2026)

**Quem entra:** deputados federais e senadores eleitos pelo Ceará (56ª e 57ª legislaturas, 2019–2027), com **todas** as emendas de que são autores formais; e parlamentares de outros estados que destinaram emendas ao Ceará, com **só** essas emendas. Deputados estaduais: pendência de fonte (emendas estaduais do CE não são impositivas e não há base aberta verificada).

**Regras:**
- Autor formal = código e nome do autor no SIAFI (arquivo CGU). Bancada, comissão, relator-geral e autor "sem informação" são **autoria coletiva ou não identificada**: aparecem só como valor, nunca rateados entre pessoas.
- Ordem **alfabética**, sem ranking por valor. Filtros por casa, origem (eleito pelo CE / outro estado) e partido.
- Vínculo autor CGU → parlamentar (Câmara/Senado) por nome exato normalizado; status `em_revisao` até confirmação humana em `pipelines/contracts/autores_vinculo.json` (ADR-009). Sem vínculo: ficha sem foto e sem partido.
- Partido exibido como **partido atual, segundo a Câmara/Senado, na data do snapshot** — não é o partido da época da emenda.
- Destinos com município identificado: lista com valores. Destinos **sem rastreio no arquivo** (vários municípios, aplicação estadual, Nacional, regional, exterior): só o valor.
- Aviso fixo: "Autor formal segundo o SIAFI. Indicar não é pagar; pagar não é entregar. Sem juízo de conduta."

**Critérios de aceite adicionais**
- **AC09** Emenda de bancada, comissão ou relator nunca entra no total de um parlamentar.
- **AC10** Soma por autor = soma das linhas desse autor no staging, por ano e etapa.
- **AC11** Vínculo sem revisão humana é exibido com o selo "vínculo por nome — em revisão".

## Regras
- Município de beneficiário ≠ necessariamente local da obra ou impacto. Descrever explicitamente.
- Ficha parlamentar não inventa autoria individual em emenda coletiva.
- Emendas sem município identificável ficam em `destinação indeterminada` ou `Estado`.
- Comparação per capita exige referência populacional e mesma dimensão temporal.
- Nenhuma soma entre etapas de execução.
- Cada aresta de grafo tem `evidence_id`, `source_url`, `method` e `status`.
- URL deve serializar filtros para compartilhar.

## Critérios de aceite
- **AC01** Busca municipal funciona por nome e normalização de acentos, com teclado.
- **AC02** Filtro de ano não exibe registros de outro período.
- **AC03** Agregado municipal exclui registros estaduais sem vínculo municipal comprovado.
- **AC04** Mapa tem tabela alternativa e texto sobre a cobertura.
- **AC05** Fluxo não conecta fornecedor por apenas coincidência de nomes ou montantes.
- **AC06** Mudança de etapa não soma valores de etapas distintas.
- **AC07** Arquivo CSV exportado reproduz filtros e metadados da consulta.
- **AC08** Falhas da fonte produzem erro/indisponibilidade, nunca valor inferido.

## Tasks
- [ ] T04.01 Endpoint municipal com filtro e cursor/paginação.
- [x] T04.02 Normalização de busca e parâmetros de URL (`?municipio=<IBGE>&etapa=<authorized|committed|paid>`).
- [x] T04.03 Mapa real IBGE / camadas e tabela alternativa — feito em 0.9.0 (21/11/2026), ver "Incremento — nova aba Mapa" (ADR-017).
- [ ] T04.04 Fichas de autores individuais e coletivos — **feito em modo validação** (`/parlamentares`, `/parlamentares/[id]`, `pipelines/rastro/autores.py`); vínculos revisados por humano: 43 de 43 (`pipelines/contracts/autores_vinculo.json`, pelo revisor do projeto em 19/11/2026; relatório `reports/autores-vinculo-*.md` com a coluna de revisor preenchida). Falta o histórico de partido.
- [x] T04.05 Grafo de evidências documentais — fluxo real por emenda em `/fluxos` e em cada ficha (`lib/fluxo.ts`), com `status`, `evidence_id`, `source_url` e método por aresta. Ver "Incremento — fluxo real por emenda" e "Incremento — Transferegov no fluxo do dinheiro" (plano de ação, convênio e execução declarada pelo ente, ligados por identificador; contratos de convênio seguem como lacuna).
- [ ] T04.06 Exportações com provenance — **parcial**: CSV demo com metadados e regras; proveniência real depende de RAS-012.
- [ ] T04.07 E2E para busca, filtros e acessibilidade.

## Status dos aceites (19/11/2026, modo demonstração)

| AC | Situação | Evidência |
|---|---|---|
| AC01 | Atende | Busca sem acento ("crateus" → Crateús), por código IBGE, Enter seleciona; estado vazio com `DataState`. Testado no navegador. |
| AC02 | Não se aplica ainda | Fixture tem um único exercício (2025 fictício); filtro de ano entra com dados reais. |
| AC03 | Atende (demo) | Estado e "destinação indeterminada" em bloco separado, fora das barras e da soma municipal. |
| AC04 | Atende | `/mapa`: tabela com `caption`, cabeçalhos e grupos; `DataState` explica a ausência da malha IBGE. |
| AC05 | Atende (demo) | Aresta "não identificado" mantém a lacuna; nenhuma ligação por nome ou valor. |
| AC06 | Atende | Seletor troca a etapa; colunas da tabela avisam que não se somam. |
| AC07 | Atende (demo) | CSV com etapa, exercício, fonte, regras e `gerado_em`; ausente = campo vazio. Verificado por script Node. |
| AC08 | Componente pronto | `DataState kind="error"`; sem fonte real para testar a falha. |

## Evidências — aba de autores (19/11/2026, modo validação)

| AC | Situação | Evidência |
|---|---|---|
| AC09 | Atende | Bancada, comissões, relator-geral e "autor não identificado" só no bloco de autorias coletivas. Teste `test_collective_never_attributed_to_people`. |
| AC10 | Atende | André Figueiredo (SIAFI 2083): 107 emendas, pago R$ 136.728.811,49 e RAP pagos R$ 39.384.024,72 na ficha = consulta direta ao staging. Teste `test_elected_in_ce_shows_everything`. |
| AC11 | Atende | 41 vínculos `em_revisao` com selo tracejado; 2 `pendente` (Bosco Costa: código com dois nomes; Dayany Bittencourt: sem candidato) sem foto nem partido. Testes de vínculo e revisão. Em 19/11/2026 os 43 vínculos passaram a `revisado` por revisão humana registrada no JSON, incluindo os 2 pendentes. |

Resultado do snapshot: 43 autores (38 eleitos pelo CE, 5 de outros estados com emendas no CE), 41 retratos oficiais, 6 autorias coletivas. Listagem e fichas sem estouro a 360px.

## Incremento — fluxo real por emenda (T04.05, 21/11/2026)

**PLAN.** O diagrama de `/fluxos` deixa de ser só ilustrativo e passa a ser montado com os dados da ficha de cada emenda, sem fonte nova. Função pura `lib/fluxo.ts` (servidor, build) transforma uma `Emenda` + registro de investigação em nós e arestas; o componente `MoneyFlow` só desenha. `/fluxos` mostra três emendas reais de exemplo (uma por status da ligação emenda → pagamentos) e uma busca por código; cada ficha de emenda ganha a seção "Fluxo do dinheiro" (`#fluxo`). O exemplo genérico continua em `/investigacao` e na galeria, marcado como ilustrativo.

**Cadeia.** Autor formal → Emenda → Pagamentos → Quem recebeu → Contrato ou obra; ramo paralelo Emenda → Convênio.

| Aresta | Documentado | Em verificação | Não identificado |
|---|---|---|---|
| Autor → Emenda | código SIAFI do autor no arquivo da CGU | — | fonte sem autor |
| Emenda → Pagamentos | código da emenda nos documentos de pagamento e soma igual ao pago total; ou diferença com causa registrada (`explicado`) | soma diferente do pago total sem causa registrada, ou valores incompletos | nenhum documento de pagamento com o código da emenda |
| Pagamentos → Quem recebeu | favorecido no próprio documento de pagamento | — | sem documento de pagamento |
| Quem recebeu → Contrato ou obra | — | — | sempre: contratos e fornecedores não estão nos arquivos usados (substituído pelo incremento Transferegov abaixo) |
| Emenda → Convênio | código da emenda no arquivo de convênios da CGU | — | (ramo omitido quando não há convênio) |

Convênio e pagamento não têm identificador comum nos arquivos: o convênio **não** é ligado a um pagamento ou favorecido, nem por nome nem por valor (AC05). `evidence_id` = código SIAFI, número do primeiro documento de pagamento (mais N) ou número do convênio; `source_url` = página da emenda no Portal (nula no modo demo).

**TASKS.** T04.05a função `fluxo.ts` com as regras da tabela · T04.05b `MoneyFlow` recebe o fluxo por propriedade (nós com link, ramo, fonte) · T04.05c `/fluxos` com exemplos reais e busca · T04.05d seção na ficha · T04.05e verificação (typecheck, build publicado, checagem das regras sobre as 1.910 fichas, navegador a 360px).

**Riscos (fluxo).** Nome de pessoa física: só `quem_recebeu`, já mascarado na origem (AC09 da SPEC 01). Página estática: a busca leva à ficha (`/emendas/<código>#fluxo`), não monta fluxo no cliente.


## Incremento — Transferegov no fluxo do dinheiro (T04.05, segunda parte, 21/11/2026)

**Por quê.** A etapa "contrato ou obra" era sempre "não identificado" e o ramo de convênio vinha só do arquivo da CGU. O adaptador Transferegov (SPEC 01 → T01.04, ADR-018) traz o instrumento de cada emenda por identificador oficial; o fluxo passa a usá-lo.

**PLAN.** `bundle` inclui `transferegov.json` como parte opcional do pacote; `lib/dataset.ts` anexa o registro à ficha (`Emenda.transferegov`: ausente quando o pacote não tem a parte, `null` quando não há registro ligado). `lib/fluxo.ts` muda só o ramo e a última aresta; `MoneyFlow` nomeia a fonte do link (Portal ou Transferegov). A ficha ganha a seção "No Transferegov" (`#transferegov`). `/fluxos` ganha o exemplo "Execução declarada". Só classes CSS existentes; sem endpoint novo.

| Aresta | Documentado | Não identificado (com o motivo) |
|---|---|---|
| Emenda → Plano de ação (ramo) | `numero_emenda_parlamentar_plano_acao` igual ao código da emenda. `evidence_id` = código do plano; `source_url` = registro na API pública | — (ramo omitido sem plano; com convênio, vale a linha abaixo) |
| Emenda → Convênio (ramo) | código da emenda no arquivo de convênios da CGU; se o número do convênio tiver meta no Transferegov, o nó mostra proposta, situação, valores e metas planejadas, e o `evidence_id` cita a proposta | — (ramo omitido sem convênio) |
| Quem recebeu → Contrato ou obra | plano de ação ligado com execução declarada pelo ente: documento de liquidação ou valor executado positivo no último relatório de gestão entregue. Nó com recebedores (PF/MEI mascarados), metas e valor executado declarado; `evidence_id` = plano + relatório; `source_url` = relatórios do plano na API | plano sem execução declarada; convênio achado, mas a API pública não publica contratos nem pagamentos do convenente; especial sem plano; convênio sem meta no Transferegov; emenda sem instrumento ligado; pacote sem Transferegov; modo demo |

Em verificação não é usado nesta aresta: ou há registro ligado por identificador, ou há lacuna. O texto do nó diz sempre que relatório de gestão é declaração do ente e não prova entrega. Valores do plano, do convênio e do relatório não se somam com os da CGU nem entre si.

**TASKS.** T04.05f tipos e carga opcional · T04.05g regras do ramo e da última aresta em `fluxo.ts` · T04.05h seção "No Transferegov" na ficha · T04.05i exemplo em `/fluxos` · T04.05j verificação (typecheck, testes do pacote, contagem sobre as 1.910 fichas).

**Aceites.**
- **AC17** Emenda sem registro ligado por identificador mantém "Contrato ou obra" como não identificado e mostra o motivo.
- **AC18** Nenhum fornecedor aparece ligado por nome ou valor; o recebedor vem do documento de liquidação do relatório de um plano ligado pelo número da emenda.
- **AC19** Pessoa física e MEI não aparecem pelo nome em nenhum nó, tabela ou export.
- **AC20** Pacote sem a parte Transferegov continua carregando; o fluxo diz que o pacote não a inclui.

**Evidências (21/11/2026).** `buildFluxo` aplicado às 1.910 fichas do pacote `dbcbf99a…`: ramo documentado com registro do Transferegov em 603 fichas (259 planos de ação + 344 convênios com proposta; 1 convênio só com a CGU); "Contrato ou obra" documentado em 107 e não identificado em 1.803, todas com motivo (1.306 sem instrumento ligado, 344 convênios sem contratos na API, 152 planos sem execução declarada, 1 convênio sem meta). Nenhuma aresta documentada sem `evidence_id`, `source_url` e `method`. `npm run typecheck` sem erros; `node --test scripts/*.test.mjs` 20 de 20 (inclui pacote sem a parte, parte válida, referência a ficha inexistente e dinheiro fracionado). Build e navegador: não executados neste incremento (o build é feito pelo revisor).

## Incremento — nova aba Mapa (T04.03, 21/11/2026)

**Por quê.** O explorador mostrava "empenhado / liquidado / pago" sem dizer o que isso significa para quem mora na cidade, a tabela das 184 cidades ocupava a página e o mapa era um aviso. Plano completo em `docs/planos/2026-11-21-mapa-e-estaduais.md`.

**PLAN.** `/mapa` passa a ter, nesta ordem:
1. Título-pergunta "Quanto dinheiro de emendas chegou à sua cidade?".
2. Componente `MapaCeara` (cliente): busca de cidade + mapa SVG dos 184 municípios + resumo da cidade em frases + seletor de ano. URL `?municipio=<IBGE>&ano=<ano>`.
3. Card "O que o mapa não mostra" (estado inteiro e vários municípios, pela localidade da emenda; pagamentos sem município de aplicação).
4. Tabela completa recolhida em `<details>` ("Ver todos os municípios em tabela"), com o CSV.
O explorador antigo sai de `/mapa` e continua no capítulo `/investigacao`.

**Camada do mapa = pago por aplicação (ADR-017).** Pela localidade da emenda, só 38 cidades têm registro em 2025; pela aplicação do pagamento, 183. O mapa diz o critério na legenda e no resumo. A localidade da emenda aparece no resumo como segunda frase e na tabela. Os critérios não se somam.

**Malha.** API de malhas do IBGE v3 (`/api/v3/malhas/estados/23?intrarregiao=municipio&qualidade=minima`). `apps/web/scripts/gerar-malha-ce.mjs` baixa, guarda a cópia bruta com SHA-256 em `data/malha/` e grava os caminhos SVG projetados em `apps/web/lib/malha-ce.json`. Sem biblioteca de mapa e sem chamada externa no site.

**Aceites novos.**
- **AC12** O mapa nunca pinta estado ou "vários municípios" sobre uma cidade.
- **AC13** "Sem registro" tem hachura própria e nunca a cor de zero.
- **AC14** Legenda e resumo dizem o critério (onde o pagamento foi aplicado) e o ano.
- **AC15** Busca por nome sem acento ou código IBGE escolhe a cidade pelo teclado (Enter); a tabela recolhida continua no HTML como alternativa acessível (AC04).
- **AC16** 360 px sem estouro horizontal.

**TASKS.** T04.03a malha · T04.03b `MapaCeara` · T04.03c página · T04.03d verificação (typecheck, build publicado, trava, navegador desktop/360 px).
