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
- [ ] T03.01 Validar conceitos com fontes oficiais.
- [ ] T03.02 Escrever roteiro, revisão factual e glossário — **roteiro e glossário em rascunho** (`app/investigacao`, `lib/glossary.ts`); revisão factual pendente.
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
| AC05 | **Parcial** | Links para Planalto (Lei 4.320/1964, Constituição). Falta registrar data de consulta após validação (T03.01). |
| AC06 | Atende | Capítulo 5: "Pagamento comprova que o dinheiro saiu. Não comprova que a obra chegou." e etapa 07 "Entrega" fora dos registros federais. |
