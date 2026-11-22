# Testes, governança e deploy

## Verificação do kit demonstrativo

```bash
python pipelines/validate/check_fixture.py
python -m unittest discover -s pipelines/tests -v
python -m unittest discover -s services/api/tests -v
cd apps/web && npm install && npm run build
```

`npm install` exige conexão e Node.js 20+. O CI (`.github/workflows/ci.yml`) roda os testes do pipeline e da API, o typecheck, os testes node e o build demo a cada push.

## Site publicado

Build e deploy pela CLI, nunca por push (ADR-020): `node scripts/build-publicado.mjs` em `apps/web`, depois `vercel deploy ../../dist/rastro --prod --archive=tgz`. O build recusa publicar se encontrar aviso de demo ou validação, dado pessoal, caminho local, chave de API ou source map, ou se o registro de investigação for de outro snapshot. Depois do deploy, `python scripts/verify_web.py --url https://rastro-ruby.vercel.app --mode publicado`. Rollback: `vercel promote <deploy anterior>`. Troca de dados: [`ATUALIZACAO-DADOS.md`](ATUALIZACAO-DADOS.md).

## Pré-publicação com dados reais (histórico de 19/11/2026; o modo publicado segue a ADR-015)

- `DEMO_DATA=false` somente depois de fonte oficial, reconciliação e revisão.
- Dados oficiais em `raw` fora da árvore Git com hashes manifestados.
- API read-only com queries parametrizadas, filtros estritos, limites e logs.
- CI: pipeline de schema / contagem / duplicidade / consistência / datas; build TS; testes de acessibilidade e navegação.
- Auditoria manual de 5-10 amostras de cada fonte principal.
- Checagem de links, crédito de fotos, política de correções e contato.
- Backups testados e rollback de snapshot com ID.

## Observabilidade

Logs estruturados com `run_id`, `source_id`, `snapshot_hash`, status, linhas e duração; alertas para quebra de schema, anomalias de duplicidade, totais divergentes e mudança súbita de cobertura. Alertas geram **tarefas editoriais**, não publicação automática de acusação.

## Privacidade

Retenção mínima de informações pessoais; separar backoffice de dados públicos. Gestão de dados conforme LGPD, com controle de acesso por perfil editorial e registro de alterações.
