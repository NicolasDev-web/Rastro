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

## ADR-014 — Registro de investigação define o recorte aprovado

A investigação dos casos da fila (ADR-013) é registrada caso a caso em `pipelines/contracts/investigacao_casos.json`. O recorte publicado inclui as emendas sem pendência e, entre as pendentes, só as `explicado` com revisor humano. As demais ficam como `lacuna_declarada`, visíveis com nota e fora de somas. Decisão de 20/11/2026: investigar os grupos 1 e 2 e o grupo 3 até onde houver tempo; o que não tiver causa documentada sai do recorte em vez de atrasar a publicação.

Achados técnicos, como a ausência de documento de pagamento nos arquivos anuais, são registrados como `achado`, não como `causa`. A causa exige fonte que a explique (Portal, Transferegov, resposta do órgão).

**Atualização (20/11/2026, ADR-015):** no site publicado, todos os casos continuam visíveis. A ficha da emenda mostra o bloco "O que a investigação encontrou" com o achado, a causa (se documentada), as fontes e a data. O campo `revisor` registra a confirmação humana, mas não condiciona a exibição. Grupo 1: 10 de 11 casos explicados por transferência de saldo a outra unidade na reestruturação dos ministérios de 2023 (notas de sistema consultadas pela API de dados do Portal); 1 segue sem causa.

## ADR-015 — Modo `publicado`: investigação cidadã em site estático

**Decisão:** `DATA_MODE=publicado` lê o mesmo pacote ativo validado (ADR-011) do snapshot `ed93842c` e gera um site 100% estático (`output: 'export'`), publicado no Vercel. Só o HTML renderizado sobe; staging, ZIPs brutos e exports ficam locais. O aviso global deixa de dizer "validação/não publicar" e passa a dizer que é uma investigação cidadã independente, com dados oficiais da CGU, data de extração e possibilidade de erro, com link para Correções. O contato público é `nicolasxavier445@gmail.com`. Os modos `demo` (fictício, avisos mantidos) e `validacao` (local) continuam existindo.

**Por quê:** a Constituição foi atualizada em 20/11/2026: o projeto não depende de revisão editorial externa (Gate D deixa de existir). Os casos da fila de conciliação continuam visíveis nas fichas com a divergência descrita, sem conclusão de causa ou irregularidade (ADR-012/014).

**Consequências:** ADR-008 deixa de proibir deploy de dados reais; o deploy só usa `publicado` ou `demo`, nunca `validacao`. A página de Componentes sai do menu no modo publicado. Atualizar dados exige novo snapshot, `bundle` e novo deploy.

## ADR-016 — Ilustrações sem legenda explicativa

**Decisão (21/11/2026):** as ilustrações deixam de exibir o selo `ILUSTRAÇÃO` e frases como "cena esquemática", "mapa imaginário", "não retrata um município específico" ou "sem pessoas reais". Sai também a frase do rodapé sobre ilustrações não serem registros documentais. `Figure` e `PageHero` mostram só a moldura com a arte.

**Por quê:** pedido do revisor do projeto. As cenas são desenhos de colagem evidentes; as explicações repetidas pesavam a leitura sem informar nada. O mesmo vale para o vídeo de apresentação.

**Consequências:** AC07 da SPEC 02 muda. Continuam valendo o `aria-label` descritivo, a proibição de retratar pessoas reais, logotipos, brasões ou símbolos partidários e de sugerir irregularidade sem base factual (AC08). Fotografia documental, se um dia entrar, segue exigindo crédito e legenda factual (AC09).

## Pendências remanescentes

- Escolha final de provedor SQL/objeto e custo.
- Estratégia de CMS editorial.
- Forma de autenticação do backoffice.
- Política de dados pessoais e retenção de evidências privadas.

## ADR-017 — Mapa municipal pelo local de aplicação do pagamento

**Decisão (21/11/2026):** o mapa de `/mapa` colore cada município pelo valor **pago por aplicação** (documentos de pagamento da CGU, inclui restos a pagar pagos), por ano da emenda. A localidade registrada na emenda continua no resumo da cidade e na tabela.

**Por quê:** pela localidade da emenda só 38 dos 184 municípios têm registro em 2025 (67 em 2024), porque a maior parte do dinheiro vem como "vários municípios" ou "estado". Um mapa assim sugeriria, errado, que quase nada chegou. Pela aplicação, 183 municípios têm pagamento em 2025.

**Consequências:** a legenda e o resumo nomeiam o critério. Os dois critérios nunca se somam. Município de aplicação não prova o local da entrega. Malha do IBGE (API v3, qualidade mínima) guardada com SHA-256 e convertida em SVG estático no build.

## ADR-018 — Transferegov ligado à emenda só por identificador oficial

**Decisão (21/11/2026):** o Transferegov.br entra pela API pública (`api-publica.transferegov.gestao.gov.br`) com duas regras de ligação, e nenhuma outra:
1. **Transferência especial:** o plano de ação liga à emenda quando `numero_emenda_parlamentar_plano_acao` é igual, dígito a dígito, ao código de 12 dígitos da CGU. Executores, metas, plano de trabalho, relatórios de gestão e documentos de liquidação ligam ao plano pelos ids da própria API (`id_plano_acao`, `id_executor`, `id_relatorio_gestao_novo`).
2. **Convênio e contrato de repasse:** o arquivo de convênios da CGU dá o número do convênio de cada emenda; no Transferegov, `meta-crono-fisico.nr_convenio` igual a esse número dá o `id_proposta`, e `propostas.id_proposta` dá objeto, situação e valores. Se o número não tiver meta, ou tiver mais de uma proposta, não há ligação.

Nunca se liga por nome do beneficiário, valor, município ou data, nem se completa código fora do padrão. Planos de ação, beneficiários e relatórios de gestão são copiados inteiros (o filtro por número de emenda da API devolve erro 500); executores, planos de trabalho, metas, documentos de liquidação e as tabelas do módulo de discricionárias vêm por consulta filtrada pelos ids da própria fonte, porque a paginação da tabela completa não tem ordem estável. O arquivo `transferegov-<tag>.json` é parte opcional do pacote ativo (ADR-011): validado quando presente, sem alterar os quatro exports existentes.

**Por quê:** Constituição, regra 10, e ADR-004. Os dois campos são identificadores oficiais publicados pela própria fonte. Valores iguais entre o convênio da CGU e o repasse do Transferegov aparecem com frequência, mas são só coincidência verificável, não chave.

**Consequências:** a aresta "Emenda → Convênio/Plano de ação" do fluxo passa a citar o registro do Transferegov; "Quem recebeu → Contrato ou obra" fica documentada só quando o ente declarou execução no relatório de gestão de um plano ligado (documento de liquidação ou valor executado positivo), sempre descrita como declaração do ente, não como entrega. Para convênios, a API pública não traz contratos, licitações nem pagamentos do convenente: a etapa continua "não identificado", com o motivo. Recebedores pessoa física, MEI ou sem natureza de pessoa jurídica confirmada saem mascarados. A ADR-019 trata das emendas estaduais.

## ADR-019 — Emendas estaduais do Ceará separadas das federais, nunca somadas

**Decisão (21/11/2026):** as emendas dos deputados estaduais do Ceará (Ceará Transparente, CGE-CE, CSV de 2023 a 2026) entram por um adaptador próprio (`pipelines/rastro/ce_estaduais.py`), com contrato próprio (`pipelines/contracts/ce_emendas_estaduais.json`), export próprio (`data/estaduais/ce-estaduais-<data>-<hash>.json` com ponteiro `ativo.json` e SHA-256) e página própria (`/estaduais`). Nenhum total, gráfico, mapa, ficha de município ou ficha de autor soma valores estaduais com federais. O pacote federal (ADR-011) e seu manifesto não mudam.

**Por quê:** são orçamentos diferentes (Constituição, regra 12). A emenda estadual no Ceará não é impositiva, e o arquivo aberto traz só o orçamento ("Valor emenda", "Valor lei", "Valor lei créditos"), sem empenho nem pagamento. Somar com o pago federal juntaria esfera e etapa diferentes. Um export separado também evita mexer no hash e na validação do pacote federal.

**Consequências:** a página declara a cobertura parcial (195 linhas em quatro anos, todas PCF individuais) e que não há execução. Ligação ao município só pelo nome IBGE exato citado no texto da ação, em duas posições documentadas; ao deputado, só pelo nome exato e único na lista da Alece. O resto fica sem ligação e entra no relatório `reports/ce-estaduais-*.md`. A execução (empenho, pago, Nº SACC, beneficiário) depende da resposta da CGE-CE ao pedido de acesso à informação ou do caminho B da SPEC 07, que não foi implementado. A ADR-018 está reservada para outra frente. Incremento 2 (21/11/2026): cada deputado com linha ligada tem página própria `/estaduais/[slug]` (slug da Alece gravado pelo pipeline) e o card dele em Autores leva a ela; a página lista as emendas por ano, sem total por deputado e sem ordenação por valor, e o perfil oficial da Alece continua linkado.
