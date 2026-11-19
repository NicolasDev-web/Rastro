# Testes, governança e deploy

## Verificação do kit demonstrativo

```bash
python pipelines/validate/check_fixture.py
python -m unittest discover -s pipelines/tests -v
python -m unittest discover -s services/api/tests -v
cd apps/web && npm install && npm run build
```

`npm install` exige conexão e versões compatíveis com Node.js 20+. Nesta entrega, a interface não foi compilada via npm devido à indisponibilidade de rede no ambiente de geração.

## Pré-publicação com dados reais

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
