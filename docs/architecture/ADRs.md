# Architectural Decision Records (ADRs)

## ADR-001 — Monorepo modular
**Decisão:** Next.js, FastAPI, PostgreSQL/PostGIS, pipeline Python em monorepo. **Por quê:** facilita desenvolvimento incremental e testes sem distribuir serviços prematuramente.

## ADR-002 — Raw imutável
**Decisão:** preservar snapshots originais com hash e metadata. **Por quê:** auditoria de alterações e reprodutibilidade editorial.

## ADR-003 — Modo demo separado
**Decisão:** dados fictícios em módulo isolado, banner global. **Por quê:** evitar publicação acidental de fatos inexistentes.

## ADR-004 — Chave documental antes de correspondência heurística
**Decisão:** não publicar relações apenas por fuzzy matching. **Por quê:** evitar atribuições falsas a atores/contratos.

## ADR-005 — Site editorial primeiro
**Decisão:** primeira interação em formato de reportagem; exploração a um clique. **Por quê:** permitir compreensão de público não especializado.

## ADR-006 — Identidade "Papel e tinta" e ilustração no lugar de foto
**Decisão:** substituir a identidade v0.1 (petróleo/cobre, Georgia, fotos geradas por IA) por alto contraste papel/tinta, manchete condensada (Archivo `wdth`), serif de leitura, mono para metadados, cobalto como única cor de interação, e ilustração editorial vetorial (colagem + risografia) desenhada em código. Referências: Intercept Brasil e O Joio e O Trigo / Prato Cheio. **Por quê:** a seriedade do tema pede linguagem de jornalismo investigativo; fotos genéricas sugeriam relação factual inexistente e imagens IA com cara de foto conflitam com a Constituição editorial; ilustração explica mecanismos (etapas, documentos, rastro) sem retratar pessoas ou lugares específicos. **Consequências:** nova ilustração segue o checklist de `design/IMAGENS-E-CREDITOS.md`; fotografia só entra quando documental; fontes carregadas do Google Fonts no build (`next/font`).

## ADR-007 — Staging local em SQLite com Python da biblioteca padrão
**Decisão:** o pipeline do incremento 1 (`pipelines/rastro/`) usa só a biblioteca padrão do Python (zipfile, csv, hashlib, sqlite3, urllib) e grava o staging em `data/staging/rastro.sqlite` (fora do Git). Dinheiro em centavos inteiros. PostgreSQL/PostGIS (ADR-001) entra na etapa de publicação, a partir do mesmo staging. **Por quê:** zero instalação para auditar e conciliar (Gates A e B); reprodutível no CI. **Consequências:** o schema `db/staging/001_staging.sql` é intermediário; a migração para Postgres precisa preservar `snapshot_id`, `source_row_id` e `row_sha256`.

## ADR-008 — Modos de dados do site: `demo` e `validacao`
**Decisão:** `DATA_MODE` (padrão `demo`). Em `validacao`, o site lê o export mais recente de `data/validacao/` e troca o aviso global por "DADOS OFICIAIS EM VALIDAÇÃO — não publicar", com `coverage: unverified`. Sem o arquivo, mostra erro — nunca cai para dados demo em silêncio. `validacao` é só local: o CI e qualquer deploy usam `demo`. **Por quê:** permitir que a equipe veja os números reais na interface durante a auditoria sem risco de publicação. **Consequências:** o modo `publicado` (dados auditados) será definido junto com a API real.

## ADR-009 — Vínculo autor CGU → parlamentar por nome exato com revisão humana
**Decisão:** o arquivo da CGU identifica o autor por código SIAFI e nome; Câmara e Senado usam IDs próprios e não há chave comum. O pipeline casa por nome normalizado exato contra as listas da 56ª e 57ª legislaturas; candidato único → `em_revisao`, nenhum ou vários → `pendente`. Só o arquivo versionado `pipelines/contracts/autores_vinculo.json` promove um vínculo a `revisado` (ou o rejeita). Fotos oficiais entram por snapshot local. **Por quê:** Constituição, regra 10 — relação sem ID oficial não é publicada sem revisão. **Consequências:** o site mostra o selo "vínculo por nome — em revisão" até a confirmação; publicação exige 100% dos vínculos exibidos como `revisado`.

## ADR-010 — Mesmas fontes, servidas localmente

**Decisão:** usar `next/font/local` com os mesmos WOFF2 latinos já presentes no build: Archivo variável (peso/largura), Source Serif 4 normal/itálico e IBM Plex Mono 400/500/700. Licenças OFL acompanhando os arquivos em `apps/web/fonts`. **Motivo:** o ambiente de validação bloqueia Google Fonts e usava fontes substitutas, alterando o design. Autohospedagem preserva a identidade e remove a dependência de rede no build. `outputFileTracingRoot` aponta à raiz do monorepo, evitando inferência por lockfile externo.

## Pendências de arquitetura

- Escolha final de provedor SQL/objeto e custo.
- Estratégia de CMS editorial.
- Forma de autenticação do backoffice.
- Política de dados pessoais e retenção de evidências privadas.
