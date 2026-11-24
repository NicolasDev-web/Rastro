# SPEC 06 — Publicação e operação

## Pré-requisitos
Snapshot oficial validado e revisão jurídica/editorial, testes de ponta a ponta, política de correção, backup e monitoramento. Não publicar demo sem banner e sem roteamento de indexação adequada.

## Frente C/D — contrato de fechamento

`/dados` deve distinguir explicitamente demo e validação, explicar critérios territoriais, etapas, proveniência e limitações. `/sobre`, `/correcoes` e `/contato` reutilizam o design existente e aparecem no rodapé. Contato traz o e-mail público do projeto (ADR-015); não inventar responsáveis nem formulário funcional. Correções apresenta a política, sem alegar histórico inexistente. `/privacidade` (incremento P1) fecha o AC06.

Git e primeiro commit já concluídos (`6ea3bc8`, `NicolasDev-web/Rastro`). Checklist operacional em `../operations/CHECKLIST-PUBLICACAO.md`. O site publicado usa o modo `publicado` (ADR-015). PDF do vídeo é material interno de validação e não é autorização de lançamento.

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
Situação conferida em 23/11/2026:

- [ ] T06.01 CI lint, typecheck, testes unitários, E2E, acessibilidade — **quase completo (24/11/2026)**: o CI roda testes do pipeline e da API, typecheck, testes Node do pacote e da trava, build, `verify_web.py` (navegação, 3 larguras, teclado, CSV, 404) e `verify_a11y.py` (axe) no build de demonstração. Falta só lint (não há script `lint` em `apps/web`).
- [x] T06.02 Proteção de ambiente + segredos — chave da API só no `.env` local, `.gitignore` ampliado, CI com `contents: read`, cabeçalhos de segurança e trava contra chave de API no build (0.6.1); produção muda só pela CLI (ADR-020).
- [x] T06.03 Auditoria de fontes e links quebrados — rotas internas no `verify_web.py`; links externos com `scripts/audit_links.py` (24/11/2026): 4.320 links únicos em 15 domínios, 120 conferidos por amostra, nenhum quebrado. Portal e Planalto recusam acesso automatizado e foram conferidos à mão no navegador (`reports/links-externos-2026-11-24.md`).
- [ ] T06.04 Teste de responsividade e performance — **parcial**: 1440, 768 e 360 px no CI e a cada deploy (24/11/2026); performance não medida.
- [x] T06.05 Revisão de conteúdo e contraditório — revisão externa dispensada (ADR-015); revisão humana dos 84 casos investigados registrada em 23/11/2026 (campo `revisor`). Contraditório só é exigido em apuração sobre pessoa, e nenhuma foi publicada.
- [x] T06.06 Política de correções e fluxo de contato — `/correcoes`, `/contato` com e-mail público (0.5.0, 0.6.0, ADR-015).
- [ ] T06.07 Deploy com feature flags e rollback — **parcial**: rollback documentado (`vercel promote`), nunca testado; sem feature flags.
- [ ] T06.08 Revisão pós-lançamento das métricas e observabilidade — sem monitoramento; o site não mede audiência por decisão de privacidade (`/privacidade`), então a observabilidade fica nos registros da hospedagem.

## Incremento P1 — fechamento (22/11/2026)

Itens que não dependem de novos dados, levantados na análise de lacunas de 22/11/2026.

- [x] T06.09 Push no GitHub não publica: `vercel.json` na raiz com `git.deploymentEnabled: false` (ADR-020).
- [x] T06.10 Página `/privacidade`: o que o site coleta (nada além dos registros técnicos da hospedagem), dados pessoais de terceiros nos arquivos oficiais (PF e MEI omitidos), mensagens recebidas por e-mail, direitos do titular (LGPD, art. 18) e canal de pedido. Link no rodapé e em Contato.
- [x] T06.11 Página 404 própria, em português, com arte e caminhos de volta (`app/not-found.tsx`).
- [x] T06.12 Arte própria em Sobre, Contato, Correções, Reportagens, Privacidade e 404 (regra "toda aba tem arte", ADR-016).
- [x] T06.13 `/reportagens` com `<h1>`, título da aba e arte de abertura.
- [x] T06.14 Textos desatualizados: `/dados` (malha do IBGE e Transferegov já integrados), README e `operations/TESTES-E-DEPLOY.md`.
- [x] T06.15 Rotina de atualização dos dados documentada em `operations/ATUALIZACAO-DADOS.md`: cadência, passos, conferências e o que fazer com o registro de investigação quando o snapshot muda.

**Critérios de aceite do incremento:** um push na `main` não cria deploy; `/privacidade` e a 404 passam no `verify_web.py` em 1440 e 360 px; toda rota do menu e do rodapé tem ilustração com `aria-label`; nenhuma página publicada diz que a malha ou o Transferegov estão pendentes.

## Incremento de fechamento — CI de navegação, acessibilidade e links (24/11/2026)

Prazo de fechamento: 30/11/2026. Cobre T06.01, T06.03 e T06.04 (P1.7 do backlog, T02.07 da SPEC 02).

**PLAN.** Sem mudança de contrato de dados, rota ou componente. `data/publicado/` não vai para o Git, então o CI testa o build de **demonstração**; o site publicado continua verificado à mão depois de cada deploy, com os mesmos scripts apontados para a URL de produção.

- `scripts/verify_web.py` passa a medir também 768 px (T02.07, T06.04).
- Novo `scripts/verify_a11y.py`: roda o axe-core (dependência de desenvolvimento em `apps/web`, sem CDN) nas rotas principais em 1440 e 360 px, com as regras WCAG 2.1 A e AA. Falha com violação de impacto `serious` ou `critical`; as demais ficam no relatório `output/qa/<modo>/a11y.json`. Contra produção usa `bypass_csp` só no navegador de teste.
- CI: depois do build, sobe `next start`, instala o Chromium do Playwright e roda `verify_web.py --mode demo` e `verify_a11y.py --mode demo`.
- Novo `scripts/audit_links.py` (T06.03): lê o HTML gerado (`dist/rastro` ou o build de demonstração), junta os links externos por domínio e confere cada um com GET, um acesso por vez por domínio, intervalo de 1 s, User-Agent genérico do projeto, sem cookies e sem contornar bloqueio. Domínios com muitos links (as fichas do Portal) são conferidos por amostra determinística, com o tamanho da amostra no relatório. Resultado: `ok`, `quebrado` (404/410), `bloqueado` (401/403/429 — não verificável, não é quebrado) e `erro` (rede). Relatório em `reports/links-externos-<data>.md`. Não roda no CI, para o resultado não depender de sites de terceiros.

**Riscos:** o axe pode apontar problemas reais de contraste ou rótulo que precisem de correção visual; correções seguem Papel e tinta e entram no CHANGELOG. O Portal da Transparência bloqueia acesso automatizado, então os links dele tendem a sair como `bloqueado`.

**Aceites:** CI verde com os três passos novos; nenhuma violação `serious`/`critical` nas rotas testadas; relatório de links com zero `quebrado` ou com cada quebrado corrigido ou explicado.
