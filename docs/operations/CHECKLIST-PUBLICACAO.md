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
- [ ] Configurar canal de contato real, responsáveis e política de privacidade/retenção.
- [ ] Validar exclusão de CPF e identificação de PF/empresários individuais em todas as saídas.
- [ ] Definir monitoramento, backups e plano de recuperação com responsáveis.

## Deploy do site publicado (ADR-015)

- [x] 20/11/2026 — https://rastro-ruby.vercel.app (projeto Vercel `rastro`, deploy estático de `dist/rastro`), código no commit `09388e6`, snapshot `ed93842c`, pacote `ea6ce34de045`. Responsável: revisor do projeto.
- [x] Smoke test em produção: `scripts/verify_web.py --url https://rastro-ruby.vercel.app --mode publicado` — 28 telas (1440 e 360 px) sem overflow, busca, CSV, rodapé institucional e 404 aprovados; `/componentes` responde 404.
- [x] Varredura do build: nenhum aviso de demo/validação nem padrão de CPF em 2.149 páginas.
- [ ] Domínio próprio e verificação de marca (nome RASTRO provisório).
- [ ] Investigação dos 84 casos da fila (registro em `pipelines/contracts/investigacao_casos.json`), com atualização das fichas e novo deploy.

## Rollback

Guardar o commit e snapshot da versão anterior. Em falha de build ou interface, republicar o último artefato aprovado. Em falha de dados, retirar os números afetados, sinalizar indisponibilidade e restaurar somente snapshot validado; nunca usar demo silenciosamente em página oficial. Em correção relevante, registrar antes/depois, fonte e data na página afetada. Testar o procedimento antes do lançamento oficial.
