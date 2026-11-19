# Arquitetura — visão

```
Download oficial → raw imutável + hash → staging validado → modelo relacional →
metricas de publicação → API FastAPI → web Next.js + conteúdo editorial
```

## Estratégia

Monorepo leve, deploy separado de web e API, PostgreSQL/PostGIS e armazenamento de objetos para snapshots. Sem scraping se houver export oficial/API. Use paginação, retries respeitosos, logs, limite de requisições e identificação clara dos termos de uso de cada órgão.

## Fronteiras

- `pipelines/`: único componente que conhece estrutura bruta de cada fonte.
- `db/`: chaves canônicas, histórico, proveniência.
- `services/api/`: consultas somente em métricas reconciliadas, paginação, erros.
- `apps/web/`: narrativa, acessibilidade, estados de produto e zero cálculo financeiro complexo no client.
- `content/` (planejado): textos revisados e conteúdos editoriais, com CMS em fase posterior.

## Modelo lógico

Emenda ↔ autor por vínculo documentado; emenda ↔ evento financeiro por documento de origem; transferência ↔ beneficiário; transferência ↔ município por identificador territorial **quando suportado**; contrato ↔ despesa só mediante documento ou chave pública verificada. Não presumir relação 1:1.

## Segurança

Consulta pública read-only, API rate limited, credenciais por variável de ambiente, chaves fora do Git, logs sem dados sensíveis, backup e recuperação. Administração editorial com autenticação forte e revisão antes de publicação. Não usar LLM para SQL arbitrário sem camada de autorização e validação.

## Publicação

`is_published = true` somente se os documentos e reconciliações satisfizerem a checklist editorial. Separar tecnicamente `DEMO_DATA=true` de produção; produção deve falhar fechado se a base de dados não estiver auditada.
