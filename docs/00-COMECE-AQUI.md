# Guia de execução — Spec Driven Development

RASTRO não começa pelo código. Começa pela **definição verificável do que o produto precisa provar e do que jamais deve afirmar**.

## 1. Ordem de leitura

1. `specs/00-CONSTITUICAO.md` — princípios editoriais e invariantes de engenharia.
2. `01-VISAO-PRD.md` — objetivos, usuários, escopo e métricas.
3. `02-JORNADAS-E-UX.md` — fluxos e telas.
4. `03-ARQUITETURA.md` — componentes técnicos e decisões.
5. `04-PLANO-SDD.md` — como percorrer spec, plan, tasks, implement e verify.
6. `specs/01-DADOS-FEDERAIS.md` — primeiro bloco que depende de evidência real.
7. `specs/02-DESIGN-SYSTEM.md` e `design/DESIGN-SYSTEM.md` — componentes.
8. `specs/03-REPORTAGEM.md` e `specs/04-EXPLORADORES.md` — experiência.
9. `specs/05-APURACAO.md` e `specs/06-LANCAMENTO.md` — revisão e publicação.

## 2. Como implementar cada feature

**SPEC**: problema e atores, casos de uso, regras, cenários de erro, fonte/contrato, critérios em Gherkin.

**PLAN**: arquitetura afetada, tabelas, endpoints, componentes, trade-offs, segurança, observabilidade.

**TASKS**: tarefas de duração pequena, nome de arquivo, dependências, testes, Definition of Done.

**IMPLEMENT**: uma tarefa por alteração, sem alterar silenciosamente a spec; implementar UI com dados de demonstração somente em ambiente demo.

**VERIFY**: executar testes, reconciliar dados e revisar acessibilidade, ética editorial, performance e evidências. Se uma afirmação não puder ser verificada, não publicar.

**DECIDE**: registrar em `architecture/ADRs.md` qualquer mudança de abordagem relevante.

## 3. Fluxo sugerido de Git

`main` protegido → `feat/01-ingestao` → PR com checklist de fontes/validações → revisão → merge. Tags `dataset-YYYY-MM-DD` para snapshots de dados, sem expor dados pessoais desnecessários.

## 4. Primeiros 10 passos práticos

- [ ] Criar repositório privado inicialmente e proteger main.
- [ ] Verificar marca/domínio RASTRO e selecionar responsável editorial.
- [ ] Ler e aprovar Constituição do projeto.
- [ ] Auditar downloads CGU 2020–2026 e seus dicionários, por ano.
- [ ] Verificar cobertura dos instrumentos Transferegov e eventuais quebras históricas.
- [ ] Definir identificadores e regra de atribuição territorial/autor.
- [ ] Persistir cópias dos arquivos originais, fonte, hash e data de extração.
- [ ] Rodar validações: unicidade, reconciliação, cobertura, valores e nulos.
- [ ] Validar 5–10 registros manualmente contra suas páginas originais.
- [ ] Integrar **somente** totais reconciliados à publicação.

## 5. Como passar a um agente de programação

Entregue `docs/specs/00-CONSTITUICAO.md` + `docs/specs/NN-*.md` + `docs/04-PLANO-SDD.md` ao agente. Dê a instrução:

> Implemente apenas a spec NN em SDD: revise contrato e aceites, crie plano e lista de tarefas, implemente uma tarefa por vez, valide cada critério e registre qualquer decisão nova em ADR. Mantenha DEMO_DATA=true até os dados reais passarem pela auditoria. Não invente APIs, registros de despesa, referências legais, vínculos ou fontes.
