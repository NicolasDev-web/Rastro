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

## ADR-011 — Pacotes de validação e seleção de documentos

Documentos históricos permanecem no staging; `cgu_documentos_selecao` identifica uma versão por fonte e `cgu_documentos_ativos` filtra todas as consultas financeiras. A carga troca a seleção em transação somente ao concluir todos os arquivos. Reprocessar documentos é obrigatório em staging legado.

Exports financeiros declaram os hashes ativos. `python pipelines/run.py bundle` reúne os quatro exports do mesmo snapshot principal, verifica as versões dos documentos e gera diretório imutável identificado pelo hash do conteúdo. O ponteiro `active-bundle.json` muda por substituição atômica. Next valida hashes, modo, estrutura, valores e referências antes de servir qualquer parte do pacote; mantém uma versão por processo (reiniciar/rebuild para trocar). Falha não usa arquivos avulsos nem dados demo silenciosamente.

Qualquer parcela financeira ausente torna a soma indisponível. Fichas e conciliação usam esse contrato; zero continua sendo um valor explícito. Isso pode reduzir o número de conciliações classificadas como iguais e exige revisão do novo resultado antes de publicação.

## ADR-012 — Conciliação por código inteiro e cobertura por fase

A seleção CE escolhe códigos com linha no recorte; não restringe as parcelas usadas na comparação com documentos, que estão na granularidade do código oficial inteiro. A auditoria distingue esse universo do conjunto maior de fichas dos autores eleitos pelo CE. `conciliacao.payment` define os mesmos status nas fichas e no relatório, com centavos exatos e soma estrita. Só empenho não comprova pagamento; a conciliação de empenho possui denominador próprio e não depende do resultado de pagamento.

Igualdade apenas com Pago permanece divergência de Pago + RAP. Padrões abaixo/acima/igual só a Pago são descrições numéricas, sem causa automática. O comando de auditoria gera referências às linhas dos snapshots sem identidades de favorecidos. Pago total permanece uma convenção operacional dos campos da fonte; a evidência numérica não confirma universalmente sua divisão temporal. Os 73 casos divergentes e as 11 lacunas com total positivo sem pagamento documental do snapshot atual exigem revisão antes de uma publicação que os inclua.

## ADR-013 — Prioridade operacional de lacunas

A fila de investigação é derivada da mesma auditoria de conciliação, com o staging em leitura somente e identidade de snapshot/fontes conferida contra o pacote ativo. Primeiro vêm incompletudes que impedem mensurar o caso, se existirem; depois totais positivos sem pagamento documental; em seguida diferenças calculáveis por faixas absolutas de R$ 1 milhão, R$ 100 mil e abaixo. A ordem é decrescente por valor, com código como desempate. As faixas são escolhas operacionais, não limites de materialidade oficial ou tolerância contábil.

Total positivo sem documento é um valor informado pela fonte, não uma diferença calculada. Os dois tipos não recebem soma conjunta. Todos os casos selecionados permanecem pendentes de revisão humana; priorizar não aprova os demais casos para publicação. Relatório versionado e matriz JSON/CSV local não contêm identidades de favorecidos; nenhum novo endpoint ou ranking de pessoas é criado.

## Pendências remanescentes

- Escolha final de provedor SQL/objeto e custo.
- Estratégia de CMS editorial.
- Forma de autenticação do backoffice.
- Política de dados pessoais e retenção de evidências privadas.
