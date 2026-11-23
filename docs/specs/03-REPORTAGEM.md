# SPEC 03 — Reportagem de abertura

## História
Como cidadão, quero entender o sistema de emendas antes de olhar um gráfico para interpretar corretamente os números.

## Storyboard — 5 capítulos
1. O que é uma emenda e por que existe (representação orçamentária).
2. Tipos: RP6 individual, RP7 bancada, RP8 comissão, RP9 histórico, transferências especiais.
3. Etapas: autoria/indicação, autorização, empenho, liquidação, pagamento, transferência e entrega. Nem todas se aplicam do mesmo modo.
4. O recorte Ceará: distribuição e cobertura, com a pergunta `onde o município aparece?`.
5. O que podemos e não podemos saber com os documentos públicos; convite para buscar a cidade.

## Critérios de aceite
- **AC01** Nenhum valor não auditado aparece como dado factual do Ceará.
- **AC02** Termos técnicos têm definição curta e metodologia.
- **AC03** Pelo menos dois pontos de entrada para busca municipal.
- **AC04** Transcrições/alternativas estáticas para animações e gráficos.
- **AC05** Referências legais citadas por links oficiais e data de consulta.
- **AC06** Capítulo final diferencia pagamento de entrega de obra/serviço.

## Tasks
- [x] T03.01 Validar conceitos com fontes oficiais — 22/11/2026: cada termo do glossário conferido com o texto do Planalto (Lei 4.320/1964, arts. 36, 58, 62, 63 e 64; Constituição, arts. 166 e 166-A; LDO 2025, Lei 15.080/2024, para os RP). Data de consulta registrada em `lib/glossary.ts` e na página.
- [x] T03.02 Escrever roteiro, revisão factual e glossário — glossário revisado com as normas em 22/11/2026 e publicado sem o selo de rascunho. A revisão independente segue em T03.05.
- [x] T03.03 Criar capítulos e transições sem scroll-jacking (5 capítulos do storyboard, sumário com âncoras).
- [ ] T03.04 Incorporar componentes reais depois da auditoria — bloqueado por RAS-014.
- [ ] T03.05 Revisão editorial independente.
- [ ] T03.06 Publicar explicação e arquivo de referências.

## Status dos aceites (19/11/2026, modo demonstração)

| AC | Situação | Evidência |
|---|---|---|
| AC01 | Atende | Capítulo 4 usa `DataState` "Distribuição real ainda não publicada"; nenhum total do Ceará. |
| AC02 | Atende (rascunho) | `GlossaryTip` em todos os capítulos + página `/glossario`. |
| AC03 | Atende | Explorador compacto dentro do capítulo 5 + botão para `/mapa`. |
| AC04 | Atende | Ilustrações com `aria-label`; escada de etapas em lista HTML; sem animação. |
| AC05 | Atende (22/11/2026) | Glossário cita artigo, link do Planalto e data de consulta de cada norma. |
| AC06 | Atende | Capítulo 5: "Pagamento comprova que o dinheiro saiu. Não comprova que a obra chegou." e etapa 07 "Entrega" fora dos registros federais. |

## Incremento 2 — reportagens 02 e 03 (23/11/2026)

Duas reportagens com os dados já publicados, no formato do explicador (`/investigacao`): capítulos com sumário, arte de abertura própria e números calculados no build a partir do pacote ativo, nunca digitados à mão.

- **03 — Onde termina o registro público?** (`/reportagens/onde-termina-o-registro`). Pergunta: até onde um cidadão consegue seguir uma emenda. Conteúdo: uma emenda real seguida etapa por etapa (fluxo da SPEC 04); o funil de rastreabilidade das fichas (autor, documento de pagamento, favorecido, plano de ação ou convênio, execução declarada, prova pública de entrega); os três caminhos por modalidade (transferência especial, convênio, demais transferências) e onde cada um para; os casos sem causa documentada (ADR-014), listados como pergunta aberta, com link para a ficha; guia para continuar a trilha (Transferegov, LAI, Fundo Nacional de Saúde, TCE-CE).
- **02 — A geografia das emendas** (`/reportagens/geografia-das-emendas`). Pergunta: para onde o dinheiro diz que vai e onde aparece. Conteúdo: os dois critérios territoriais por ano (localidade da emenda × aplicação do pagamento, nunca somados); a parcela do pago total registrada como "vários municípios" e "estado"; valor pago por aplicação por habitante (população do Censo 2022, IBGE, cópia bruta com SHA-256 em `data/populacao/`, gerada por `scripts/gerar-populacao-ce.mjs`), por faixa de população e por ano, com mediana; o caso da capital; municípios sem registro.

**Regras:** nenhuma soma entre anos, etapas, fontes ou critérios; valores por ano e pela mesma etapa (pago total da fonte ou pago por aplicação). Contagens de emendas podem cruzar anos. Sem ranking de autores nem de municípios: comparações por faixa de população, com denominador explícito. Hipóteses aparecem marcadas como hipótese. Nada é apresentado como irregularidade.

- [x] T03.07 População do Censo 2022 com proveniência (`lib/populacao-ce.json`).
- [x] T03.08 Cálculos das reportagens em `lib/reportagens.ts`, conferidos contra cálculo independente em Python sobre o mesmo pacote.
- [x] T03.09 Página da reportagem 03.
- [x] T03.10 Página da reportagem 02.
- [x] T03.11 Artes de abertura próprias (funil de documentos e dois mapas).
- [x] T03.12 Cards em `/reportagens` e na home apontam para as reportagens; `verify_web.py` cobre as duas rotas.

**Critérios de aceite do incremento:** AC07 — todo número das duas páginas vem de função sobre o pacote ativo e muda se o pacote mudar; AC08 — em modo demo as páginas não mostram números (estado de demonstração); AC09 — cada capítulo cita a fonte e o critério; AC10 — as duas rotas passam no `verify_web.py` em 1440 e 360 px.
