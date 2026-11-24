# Checklist de publicação

## Repositório e build

- [x] Git iniciado e primeiro commit publicado: `6ea3bc8` em `NicolasDev-web/Rastro`, branch main.
- [x] Excluir .env, dependências, builds, dados brutos, staging, exports de validação, retratos baixados e arquivos temporários.
### Rotina a cada push ou deploy (repetir sempre; não se marca)

- Revisar `git diff --cached` e confirmar que não há segredos ou dados pessoais.
- `python -m unittest discover -s pipelines/tests -v` e `python -m unittest discover -s services/api/tests -v`.
- Em `apps/web`: `npm run typecheck`; para o site publicado, `node scripts/build-publicado.mjs` (a trava do build precisa passar).
- Depois do deploy: `python scripts/verify_web.py --url https://rastro-ruby.vercel.app --mode publicado` (1440, 768 e 360 px) e `python scripts/verify_a11y.py --url https://rastro-ruby.vercel.app --mode publicado`, com registro na seção "Deploy do site publicado".
- Quando mudarem fontes ou textos com links: `python scripts/audit_links.py`.
- Só ao mexer na demonstração: `npm run preview:static`, `scripts/verify_web.py --mode demo` e revisão da prévia offline.

## Demonstração pública — substituída pelo site publicado

Desde 20/11/2026 o endereço público serve o modo `publicado` (ADR-015); a demonstração não tem deploy público. As exigências desta seção que continuam valendo estão cobertas pelo site publicado:

- [x] Não enviar `data/validacao`, staging, dados brutos ou PDF interno ao deploy — o build publicado lê só `data/publicado/` e a trava recusa aviso de validação, caminho local e source map (0.6.0, 0.6.1).
- [x] Conferir links internos, teclado, 360 px e páginas institucionais — `verify_web.py --mode publicado` a cada deploy. Contraste e links externos seguem em SPEC 02 (T02.07) e SPEC 06 (T06.03).
- [x] Registrar URL, commit, data, responsável e resultado do smoke test — seção "Deploy do site publicado".
- ~~Confirmar `DATA_MODE=demo` e aviso persistente~~ e ~~indexação de protótipo~~ — não se aplicam ao site publicado; continuam valendo para qualquer deploy futuro da demonstração.

## Dados oficiais

- [x] Definir modo publicado e pipeline de produção — modo `publicado`, site estático a partir de `data/publicado/` com SHA-256 conferido (0.6.0, ADR-015, que substitui a proibição da ADR-008).
- [x] Validar snapshot, cobertura temporal, vínculos e totais; documentar e tratar divergências — conciliação (0.5.2, ADR-012) e investigação dos 84 casos (0.7.0). Os casos sem causa documentada (28 desde a reabertura de 24/11/2026) ficam visíveis nas fichas.
- [x] Revisar os universos CE versus todas as emendas dos autores eleitos pelo CE — os dois universos têm contagens próprias e não se comparam (`INTEGRIDADE-P0.md`, `VERIFICACAO-FECHAMENTO.md`, SPEC 01).
- [x] Registro de revisão humana dos 84 casos investigados — revisão confirmada pelo revisor do projeto e registrada em 23/11/2026 no campo `revisor` de `pipelines/contracts/investigacao_casos.json`.
- ~~Revisão editorial externa e aprovação da reportagem~~ — dispensada desde 20/11/2026 (investigação cidadã, Gate D retirado, ADR-015). Contraditório continua obrigatório em apuração sobre pessoa (Constituição, regra 7); nenhuma foi publicada até aqui.
- [x] Configurar canal de contato real, responsáveis e política de privacidade/retenção — e-mail público (ADR-015) e `/privacidade` (22/11/2026).
- [x] Validar exclusão de CPF e identificação de PF/empresários individuais em todas as saídas — trava do build varre HTML, RSC, JS, JSON e CSS atrás de CPF e nome de MEI (0.6.1, 9 testes no CI); Transferegov mascara PF e MEI (0.10.0). Pendente como reforço: cruzar a natureza jurídica no mascaramento de MEI.
- [ ] Definir monitoramento, backups e plano de recuperação com responsáveis — há rollback documentado (`vercel promote`, seção "Rollback"), snapshots append-only e backup do histórico Git, mas nenhum monitoramento e nenhum teste de rollback.

## Deploy do site publicado (ADR-015)

- [x] 20/11/2026 — https://rastro-ruby.vercel.app (projeto Vercel `rastro`, deploy estático de `dist/rastro`), código no commit `09388e6`, snapshot `ed93842c`, pacote `ea6ce34de045`. Responsável: mantenedor do projeto.
- [x] Smoke test em produção: `scripts/verify_web.py --url https://rastro-ruby.vercel.app --mode publicado` — 28 telas (1440 e 360 px) sem overflow, busca, CSV, rodapé institucional e 404 aprovados; `/componentes` responde 404.
- [x] Varredura do build: nenhum aviso de demo/validação nem padrão de CPF em 2.149 páginas.
- [x] 20/11/2026 — redeploy com o bloco "O que a investigação encontrou" (commit `3730c9a`), via `--archive=tgz`; mesma verificação de 28 telas aprovada em produção.
- [x] 21/11/2026 — redeploy 0.8.0: fluxo real por emenda em `/fluxos` e nas fichas (SPEC 04, T04.05) e ilustrações sem legenda (ADR-016), a partir da cópia de trabalho ainda sem commit; trava em 2.149 páginas e verificação de 28 telas aprovadas em produção.
- [x] 21/11/2026 — redeploy 0.9.0: nova aba Mapa (SPEC 04 T04.03, ADR-017) e `/dados` sem "revisão editorial", ainda sem commit. `verify_web.py` atualizado para a nova busca, o valor do card e o CSV da tabela recolhida; 28 telas aprovadas em produção. Lição: não usar `--skip-build` depois de mudar código, porque ele reempacota o `.next-publicado` antigo.
- [x] 21/11/2026 — redeploy 0.9.1 (texto de `/dados` sobre o mapa), build completo; trava em 2.149 páginas e verificação de 28 telas aprovadas em produção.
- [x] 21/11/2026 — redeploy 0.10.0: Transferegov no fluxo (ADR-018) e página `/estaduais` (SPEC 07, ADR-019), pacote `dbcbf99a`; trava em 2.150 páginas e verificação de 32 telas (com `/estaduais` e a ficha `202537330007`) aprovadas em produção.
- [x] 21/11/2026 — redeploy 0.11.0: páginas `/estaduais/[slug]` (41 deputados) e artes em Estaduais, Mapa e Dados; trava em 2.191 páginas e 34 telas aprovadas em produção.
- [x] 22/11/2026 — redeploy 0.12.0: `/privacidade`, 404 própria, artes em Sobre, Contato, Correções e Reportagens, glossário conferido; trava em 2.192 páginas e 36 telas aprovadas em produção.
- [x] 23/11/2026 — redeploy 0.13.0: reportagens 02 e 03; trava em 2.194 páginas.
- [x] 23/11/2026 — 0.13.1 em produção (cartões da reportagem 03 com "A trilha para…" conferidos no site; filtros dos deputados estaduais); `dist/rastro` local com 2.194 páginas. Smoke test em produção com `verify_web.py --mode publicado`: 42 telas sem overflow; navegação, teclado, CSV e 404 aprovados.
- [x] 24/11/2026 — redeploy 0.14.0 (commit `d66b173`): menu em tablet e foco nas tabelas com rolagem. Trava em 2.194 páginas. Em produção: `verify_web.py` com 63 telas (1440, 768 e 360 px) sem overflow, navegação, teclado, CSV e 404 aprovados; `verify_a11y.py` com 38 telas e 0 violações. CI verde no GitHub (job web fixado em `ubuntu-24.04`).
- [ ] Domínio próprio e verificação de marca (nome RASTRO provisório) — **backlog, fora do fechamento de 30/11/2026**. Pesquisa de 23/11/2026: rastro.com, .org, .com.br, .net.br, .jor.br e .app ocupados. Livres: rastro.ong.br (R$ 40/ano, aceita CPF, mas o titular aparece na consulta pública do Registro.br), rastro.org.br (R$ 40/ano, exige CNPJ de entidade sem fins lucrativos), rastro.page (US$ 11,99/ano pela Vercel) e rastroemendas.com.br. Preços e disponibilidade mudam: refazer a consulta antes de comprar.
- [x] Investigação dos 84 casos da fila (registro em `pipelines/contracts/investigacao_casos.json`), com atualização das fichas e novo deploy — 0.7.0: 49 explicados, 35 sem causa documentada.
- [x] O projeto Vercel está ligado ao GitHub, e um push na `main` publicava o repositório cru (404 em 21/11/2026). Desde 22/11/2026 o `vercel.json` da raiz desliga os deploys por push (ADR-020); a produção só muda pela CLI.
- [x] Rotina de atualização dos dados: `ATUALIZACAO-DADOS.md`.

## Rollback

Guardar o commit e snapshot da versão anterior. Em falha de build ou interface, republicar o último artefato aprovado. Em falha de dados, retirar os números afetados, sinalizar indisponibilidade e restaurar somente snapshot validado; nunca usar demo silenciosamente em página oficial. Em correção relevante, registrar antes/depois, fonte e data na página afetada. Testar o procedimento antes do lançamento oficial.
