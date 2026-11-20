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
- [ ] T04.03 Mapa real IBGE / camadas e tabela alternativa — **tabela feita**; malha IBGE pendente.
- [ ] T04.04 Fichas de autores individuais e coletivos — **feito em modo validação** (`/parlamentares`, `/parlamentares/[id]`, `pipelines/rastro/autores.py`); falta revisão humana dos vínculos (`reports/autores-vinculo-*.md`) e histórico de partido.
- [ ] T04.05 Grafo de evidências documentais — **parcial**: arestas com `status`, `evidence_id` e método (demo).
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
| AC11 | Atende | 41 vínculos `em_revisao` com selo tracejado; 2 `pendente` (Bosco Costa: código com dois nomes; Dayany Bittencourt: sem candidato) sem foto nem partido. Testes de vínculo e revisão. |

Resultado do snapshot: 43 autores (38 eleitos pelo CE, 5 de outros estados com emendas no CE), 41 retratos oficiais, 6 autorias coletivas. Listagem e fichas sem estouro a 360px.

