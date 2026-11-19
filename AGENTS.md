# Instruções para agentes de programação — RASTRO

> **Leia antes de editar código**: `docs/specs/00-CONSTITUICAO.md`, `docs/04-PLANO-SDD.md`, spec da feature e `docs/architecture/ADRs.md`.

## Modo de trabalho obrigatório: Spec Driven Development

1. Localize a feature alvo em `docs/specs/NN-*.md`.
2. Antes de codar, apresente um `PLAN` resumindo contratos, tabelas, endpoints, componentes, riscos e testes.
3. Converta a spec em `TASKS` pequenas e rastreáveis; prefira um PR por incremento verificável.
4. Implemente **somente** o que a spec autoriza; se requisito for novo, atualize a spec antes.
5. Execute verificação e mostre evidência: teste, consulta e resultado, sem alegar testes que não rodaram.
6. Documente decisões arquiteturais em `docs/architecture/ADRs.md` e atualize fontes/métricas se necessário.
7. Não marque como concluído sem checar todos os critérios de aceite.

## Guardrails

- `DEMO_DATA=true` por padrão. Nunca remova avisos de dados fictícios para parecer real.
- Não invente dados governamentais, políticos reais, fatos, crimes, contratos ou provas.
- Não gere rankings de valor moral, corrupção, bons/ruins entre figuras políticas.
- Não agregue dinheiro de etapas diferentes nem duplique documentos financeiros.
- Não converta valores ausentes em zero; não geolocalize um ente estadual em Fortaleza por conveniência.
- Não associe atores por mesmo nome, valor ou município sem documentação suficiente.
- Não publique snippets de documentos privados ou dados pessoais desnecessários.
- Se API oficial não estiver acessível, escreva adaptador por contrato e testes fake, e declare o bloqueio.

## Arquivos principais

- Next.js: `apps/web/app`, `apps/web/components`, `apps/web/lib/demo.ts`.
- API demo: `services/api/app`.
- Validações: `pipelines/validate` e `pipelines/tests`.
- Schema: `db/migrations/001_initial.sql`.
- Fontes e regras: `docs/sources`, `docs/architecture/MODELO-E-METRICAS.md`.

## Prompts úteis

**Agente de dados:** "Leia Constituição + SPEC 01. Faça inventário das fontes, verifique o schema real e proponha ingestão reproduzível. Antes de tocar em produção, entregue testes de idempotência, cobertura e conciliação."

**Agente UX/UI:** "Leia Constituição + SPEC 02 + DESIGN-SYSTEM. Faça auditoria de hierarquia, contraste, responsividade e acessibilidade; proponha alterações com justificativa e teste visual. Mantenha aviso de demo."

**Agente editorial:** "Leia MANUAL-EDITORIAL e SPEC 03/05. Reescreva o capítulo em linguagem pública, sustente cada afirmação em fonte e separe certeza, hipótese, lacuna e contraditório."

**Agente QA:** "Leia aceites da SPEC atual. Transforme cada AC em cenário de teste. Gere relatório distinguindo testado / não testado / bloqueado / reprovado."
