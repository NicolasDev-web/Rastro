# Checklist de publicação

## Repositório e build

- [x] Git iniciado e primeiro commit publicado: `6ea3bc8` em `NicolasDev-web/Rastro`, branch main.
- [x] Excluir .env, dependências, builds, dados brutos, staging, exports de validação, retratos baixados e arquivos temporários.
- [ ] Antes de cada push, revisar `git diff --cached` e confirmar que não há segredos ou dados pessoais.
- [ ] Executar `python -m unittest discover -s pipelines/tests -v` e `python -m unittest discover -s services/api/tests -v`.
- [ ] Em apps/web: `npm run typecheck` e `npm run preview:static` (build em demo).
- [ ] Executar `scripts/verify_web.py --mode demo` contra servidor demo e inspecionar capturas.
- [ ] Revisar a prévia offline e seus links locais.

## Demonstração pública

- [ ] Confirmar `DATA_MODE=demo` e aviso persistente em todas as páginas.
- [ ] Não enviar `data/validacao`, staging, dados brutos ou PDF interno ao deploy.
- [ ] Configurar indexação e metadados adequados a protótipo.
- [ ] Conferir links, teclado, contraste, 360px, créditos e páginas institucionais.
- [ ] Registrar URL, commit, data, responsável e resultado do smoke test do deploy.

## Dados oficiais: lançamento ainda bloqueado

- [ ] Definir modo publicado e pipeline/API de produção (ADR-008).
- [ ] Validar snapshot, cobertura temporal, vínculos e totais; documentar e tratar divergências.
- [ ] Revisar os universos CE versus todas as emendas dos autores eleitos pelo CE.
- [ ] Revisão editorial, contraditório quando aplicável e aprovação da reportagem.
- [x] Configurar canal de contato real, responsáveis e política de privacidade/retenção — e-mail público (ADR-015) e `/privacidade` (22/11/2026).
- [ ] Validar exclusão de CPF e identificação de PF/empresários individuais em todas as saídas.
- [ ] Definir monitoramento, backups e plano de recuperação com responsáveis.

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
- [ ] Domínio próprio e verificação de marca (nome RASTRO provisório).
- [x] Investigação dos 84 casos da fila (registro em `pipelines/contracts/investigacao_casos.json`), com atualização das fichas e novo deploy — 0.7.0: 49 explicados, 35 sem causa documentada.
- [x] O projeto Vercel está ligado ao GitHub, e um push na `main` publicava o repositório cru (404 em 21/11/2026). Desde 22/11/2026 o `vercel.json` da raiz desliga os deploys por push (ADR-020); a produção só muda pela CLI.
- [x] Rotina de atualização dos dados: `ATUALIZACAO-DADOS.md`.

## Rollback

Guardar o commit e snapshot da versão anterior. Em falha de build ou interface, republicar o último artefato aprovado. Em falha de dados, retirar os números afetados, sinalizar indisponibilidade e restaurar somente snapshot validado; nunca usar demo silenciosamente em página oficial. Em correção relevante, registrar antes/depois, fonte e data na página afetada. Testar o procedimento antes do lançamento oficial.
