# SPEC 06 — Publicação e operação

## Pré-requisitos
Snapshot oficial validado e revisão jurídica/editorial, testes de ponta a ponta, política de correção, backup e monitoramento. Não publicar demo sem banner e sem roteamento de indexação adequada.

## Frente C/D — contrato de fechamento

`/dados` deve distinguir explicitamente demo e validação, explicar critérios territoriais, etapas, proveniência e limitações. `/sobre`, `/correcoes` e `/contato` reutilizam o design existente e aparecem no rodapé. Sem canal editorial confirmado, Contato informa a indisponibilidade de recebimento; não inventar e-mail, responsáveis ou formulário funcional. Correções apresenta política prevista, sem alegar histórico inexistente. AC06 permanece parcial até canal real e política de privacidade definidos.

Git e primeiro commit já concluídos (`6ea3bc8`, `NicolasDev-web/Rastro`). Checklist operacional em `../operations/CHECKLIST-PUBLICACAO.md`. Prévia e build públicos permanecem em demo. PDF do vídeo é material interno de validação e não é autorização de lançamento.

## Critérios de aceite
- **AC01** Produção não inicia em modo misto `DEMO_DATA=true` com números não identificados como demo.
- **AC02** Teste de reconciliação de totais críticos passa.
- **AC03** Páginas públicas exibem fonte, metodologia, data de extração e cobertura.
- **AC04** Erros de API geram estado indisponível sem placeholder numérico.
- **AC05** Rotas críticas passam revisão de teclado, contraste e 360px.
- **AC06** Política de privacidade, correções e contato disponíveis.
- **AC07** Existe plano de rollback de web, API e snapshot.
- **AC08** Links e créditos das fotografias verificadas estão corretos.

## Tasks
- [ ] T06.01 CI lint, typecheck, testes unitários, E2E, acessibilidade.
- [ ] T06.02 Proteção de ambiente + segredos.
- [ ] T06.03 Auditoria de fontes e links quebrados.
- [ ] T06.04 Teste de responsividade e performance.
- [ ] T06.05 Revisão de conteúdo e contraditório.
- [ ] T06.06 Política de correções e fluxo de contato.
- [ ] T06.07 Deploy com feature flags e rollback.
- [ ] T06.08 Revisão pós-lançamento das métricas e observabilidade.
