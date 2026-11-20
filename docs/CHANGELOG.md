# Changelog

## 0.7.0 — investigação das 84 emendas da fila

- Todos os 84 casos têm registro com achado, fontes e data em `pipelines/contracts/investigacao_casos.json`, e a ficha de cada emenda mostra o bloco "O que a investigação encontrou". Resultado: **49 explicados e 35 sem causa documentada.** Nenhum caso foi explicado por atualização do Portal depois do snapshot de 19/11.
- Causas encontradas, com evidência da API de dados do Portal:
  - **Saldo de empenho transferido para outra unidade gestora** na reestruturação dos ministérios de 2023 e em mudanças posteriores (migração para o Ministério das Cidades, sub-rogação, fusão/cisão, Portaria MAPA 609/2023, tarifas da Caixa): o pagamento não fica ligado ao código da emenda. **36 casos.**
  - **Ordem bancária de 2026 sem vínculo com o empenho**, identificada pelo valor exato e pela observação; explicação muito provável, não comprovada documento a documento. **5 casos.**
  - **Documento de retenção (DF/DR) com valor em dobro ou triplo** no arquivo por documento da CGU, conferido contra a API. **6 casos.**
  - **Devolução de pagamento registrada como nota de sistema** e não descontada. **1 caso.**
  - **Transferência de saldo no Exército** (Portaria SEF/C Ex 269/2024). **1 caso.**
- Os 35 casos sem causa ficam visíveis com o que foi verificado e o próximo passo. A investigação foi feita com dois agentes de análise em paralelo, e as conclusões novas foram conferidas por amostragem direta na API antes da publicação.

## 0.6.1 — auditoria de segurança e privacidade (SENTINEL)

- Sem segredo vazado e sem achado crítico ou alto. A chave da API do Portal fica só no `.env` local e nunca foi commitada.
- Privacidade do mantenedor: o nome dele foi trocado por "revisor do projeto" em contratos, relatórios e docs, e o histórico do Git foi reescrito para usar o e-mail noreply do GitHub como autor. O site publicado só traz o e-mail de contato intencional.
- Site: cabeçalhos de segurança no `vercel.json` gerado (CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy). A trava de publicação passa a varrer HTML, RSC, JS, JSON e CSS atrás de CPF (completo ou parcial), nome de MEI, e-mails além do contato, caminhos locais, chaves de API e source maps, com 9 testes no CI.
- `.gitignore` cobre variantes de `.env`, bancos SQLite e credenciais. CI com `permissions: contents: read` e `npm ci`. O build publicado falha se o registro de investigação não puder ser lido.
- Fica para depois do lançamento: next 16 (postcss com alerta só no build), cruzamento de natureza jurídica no mascaramento de MEI e actions fixadas por SHA.

## 0.6.0 — modo publicado (investigação cidadã)

- Constituição: o RASTRO passa a ser declarado investigação cidadã independente, sem exigência de revisão editorial externa (Gate D retirado). Aviso permanente de possíveis erros e canal público de correção (`nicolasxavier445@gmail.com`). ADR-015.
- `DATA_MODE=publicado`: site 100% estático lido da cópia congelada `data/publicado/` (`python pipelines/run.py publicar`, com SHA-256 conferido contra o pacote ativo). Faixa global, metadados, rodapé, explorador, CSV, fichas, Sobre, Contato e Correções reescritos para o site público; galeria de componentes fora do site publicado. Modo demo mantém todos os avisos de ficção.
- `node scripts/build-publicado.mjs` gera `dist/rastro` e recusa a publicação se houver aviso de demo/validação ou padrão de CPF no HTML. `scripts/verify_web.py --mode publicado`: 28 telas (1440 e 360 px) sem overflow, CSV, busca e 404 aprovados.
- Fichas sem documento de pagamento explicam a lacuna encontrada nos arquivos da CGU; fichas divergentes deixam explícito que diferença não indica irregularidade.

## 0.5.4 — revisão dos vínculos de autores

- Os 43 vínculos autor CGU → parlamentar estão revisados por humano (`autores_vinculo.json`). O relatório `reports/autores-vinculo-*.md` passa a mostrar o revisor e a data registrados, em vez de uma caixa fixa `[ ] confere`. Linhas sem revisor identificado continuam abertas. T04.04 fica pendente só pelo histórico de partido.
- Novo teste de regressão da coluna de revisor. O relatório foi regerado com o staging em leitura somente, sem nova aquisição.

## 0.5.3 — fila local de investigação

- Novo comando `python pipelines/run.py prioridades`, com staging em leitura somente e verificação de compatibilidade com o pacote ativo. Relatório versionado com as 84 emendas em ordem de trabalho, links às fichas e ações por grupo; matrizes JSON/CSV locais preservam valores ausentes e referências de origem.
- Prioridade para os 11 totais positivos sem pagamento documental; depois 4 diferenças de pelo menos R$ 1 milhão, 25 de pelo menos R$ 100 mil e 44 menores. As faixas organizam trabalho e não dispensam investigação ou aprovam publicação. Valores de cobertura ausente não são somados às diferenças calculáveis.
- Seis testes novos de seleção, limites em centavos, ordem determinística, ausência versus zero, reprodução e compatibilidade dos pacotes. Os 59 testes do pipeline passaram.

## 0.5.2 — revisão da conciliação P0.4

- Documento-base interno do vídeo: gerador versionado, PDF complementar de 8 páginas e capturas reais atualizadas. Definição de Pago/RAP alinhada à ADR-012; testes de pipeline/API/pacote identificados separadamente, infraestrutura futura como evolução e gravação vinculada ao snapshot revisado.
- Fichas e auditoria compartilham comparação exata de Pago + RAP pagos. Só empenho não é divergência de pagamento; ausência e zero continuam distintos.
- Recorte CE seleciona códigos, enquanto a comparação documental considera todas as localidades de cada código. Denominadores de pagamento e empenho são independentes.
- Novo comando `python pipelines/run.py conciliacao`: matriz local JSON/CSV, linhas de origem sem favorecidos e relatório completo das diferenças. O comando `documentos` também gera a auditoria.
- Resultado atual: 1.744 fichas iguais, 73 divergentes, 93 sem pagamento documental. Onze das 93 ausências têm total positivo e integram fila separada de cobertura. Causas das diferenças e lacunas seguem pendentes de revisão; não há aprovação de publicação.
- Texto financeiro usa os campos da fonte e deixa de apresentar a divisão temporal como comprovada universalmente. Layout preservado. A revisão substitui os percentuais/conclusões de conciliação anteriores, inclusive os registrados historicamente em 0.4.0.

## 0.5.1 — integridade P0

- Documentos financeiros consultados por seleção ativa de snapshots; histórico preservado sem duplicar somas. Troca transacional após carga completa.
- Somas incompletas das fichas, documentos e export territorial preservam null. Novo estado de conciliação indisponível e apresentação compatível.
- Pacote imutável com os quatro exports, hashes e ponteiro atômico; carregamento conjunto no Next, com validação e sem fallback para arquivos avulsos.
- Testes de regressão de snapshots, falha de carga, ausência/zero, corrupção e incompatibilidade de pacote. Testes Node adicionados ao CI.

## 0.5.0 — fechamento A/B, institucional e roteiro

- Critérios de localidade da emenda e aplicação dos pagamentos separados no explorador, mapa e fichas. Corrigido CSV para respeitar o critério ativo, sem duplicar RAP.
- Fichas de emendas e municípios, cronologia, conciliação, favorecidos e convênios; links entre as fichas e cinco termos de glossário adicionados na implementação A/B.
- Sete testes novos do contrato das fichas e export territorial; verificação de navegador reproduzível com desktop, 360px, teclado, CSV e rota inexistente.
- `/dados` reescrita por modo; Sobre, Correções e Contato no rodapé, seguindo Papel e tinta. Canal editorial ainda não configurado, explicitado na interface.
- Prévia offline ampliada às fichas demo e páginas institucionais; geração força modo demo.
- Tipografia original autohospedada com as licenças OFL; removida dependência do Google Fonts no build, preservando famílias, pesos e eixo de largura. Raiz do monorepo explícita no Next.js.
- Git já iniciado e publicado em `NicolasDev-web/Rastro`; checklist de lançamento e roteiro interno de vídeo com capturas reais. Resultados de execução no relatório de fechamento.

## 0.4.0 — 19/11/2026 (pendências de dados — em validação)

- **Conferência amostral (T01.09):** 60/60 valores conferem com o Portal (pelo revisor do projeto). O gerador agora nunca sobrescreve a planilha preenchida (`report.write_once`, com teste) — a planilha assinada chegou a ser sobrescrita por uma execução e foi restaurada integralmente.
- **Vínculos de autores:** os 43 confirmados pelo revisor em `pipelines/contracts/autores_vinculo.json`; pendentes resolvidos com a API da Câmara (Dayany Bittencourt = 220659, nome anterior "Dayany do Capitão"; Bosco Costa = 74052, nome civil "João Bosco da Costa").
- **Alece:** `pipelines/rastro/alece.py` ingere os 54 deputados estaduais em exercício (foto, partido, situação); a aba de autores mostra os estaduais sem valores e explica a falta de fonte estruturada (quadro da LOA só em PDF; relatório da Seplag exigido pela Lei 19.851 inacessível).
- **Incremento 2 — documentos de despesa:** 3,6 milhões de documentos (2020–2026) conciliados com o arquivo por emenda. H1 confirmada: pago total = Pago + RAP pagos (95,7% das emendas; 97,1% do valor de RAP). O site passa a mostrar "pago total". Achado: R$ 4,65 bi de emendas "vários municípios" têm município de aplicação no CE nos documentos.
- **Testes:** 34.

## 0.3.1 — 19/11/2026 (aba de autores — em validação)

- **Pipeline:** `python pipelines/run.py autores` baixa as listas da Câmara (56ª/57ª legislaturas, paginadas) e do Senado, vincula autores da CGU por nome exato (status `em_revisao`/`pendente`; revisão humana em `pipelines/contracts/autores_vinculo.json`, ADR-009), baixa retratos oficiais só de quem aparece na aba e gera `reports/autores-vinculo-*.md` e `data/validacao/autores-*.json`.
- **Staging:** passa a guardar todas as 94.948 linhas da CGU (schema v2), para mostrar emendas da bancada cearense fora do CE; totais e export do recorte CE inalterados (mesmo hash).
- **Site:** `/parlamentares` com busca, filtros (origem, casa, partido atual), ordem alfabética sem ranking, retratos em P&B com crédito e selo de vínculo; `/parlamentares/[id]` com valores por ano, destinos rastreáveis, "sem rastreio no arquivo" só com valor, lista de emendas com link ao Portal; bloco de autorias coletivas; aviso de que não há fonte aberta para deputados estaduais.
- **Specs/docs:** SPEC 04 (regras da aba, AC09–AC11), SPEC 02 (exceção para retrato oficial), fontes Câmara/Senado verificadas, ADR-009.
- **Testes:** 10 novos (vínculo, revisão, escopo por origem, autoria coletiva, somas, parsers); 27 no total.

## 0.3.0 — 19/11/2026 (dados reais, incremento 1 — em validação)

- **Pipeline** `pipelines/rastro/` (só biblioteca padrão): snapshot imutável com SHA-256 e manifesto, inventário com contrato executável, staging SQLite em centavos, relatório de cobertura e conservação, amostra para conferência humana e export para o site. CLI: `python pipelines/run.py all`.
- **Fontes verificadas:** CGU arquivo único (6 CSVs, cp1252, diverge do dicionário em 2 colunas e 3 arquivos), IBGE (184 municípios). Documentos de despesa e Transferegov catalogados para os próximos incrementos.
- **Specs:** SPEC 01 com contrato verificado, escopos territoriais (`municipio`, `estado`, `multiplo`) e AC07–AC09; SPEC 04 sem etapa "Autorizado" (a fonte não traz); ADR-007 (SQLite) e ADR-008 (modos `demo`/`validacao`).
- **Site:** `DATA_MODE=validacao` mostra os dados reais com aviso "não publicar"; explorador com ano 2020–2026, etapas Empenhado/Liquidado/Pago, restos a pagar à parte, 184 municípios e CSV com metadados. Padrão continua `demo`.
- **Texto:** "Governo do Estado" trocado por "aplicação estadual" e "indeterminado" por "vários municípios", conforme a fonte.
- **Testes:** 14 novos testes do pipeline (sem rede), cobrindo AC01–AC09 e conservação.

## 0.2.1 — 19/11/2026 (modo demonstração)

- **Spec 02:** `DataState` (7 estados), `CoverageFlag`, `GlossaryTip`, `PageHero`; link "pular para o conteúdo"; menu marca a página ativa; menu mobile quebra em linhas.
- **Spec 03:** reportagem reorganizada nos 5 capítulos do storyboard (escada de 7 etapas, recorte Ceará com 3 destinos, "o que os registros mostram / não mostram", explorador embutido). Glossário em rascunho com normas de referência (`/glossario`).
- **Spec 04:** filtros na URL (`municipio`, `etapa`), busca com Enter e estado vazio, link compartilhável, CSV com metadados; Estado e destinação indeterminada separados da soma municipal; valor ausente = "Sem registro"; tabela acessível em `/mapa`; fluxo com status/evidence_id/método por ligação.
- **Ilustrações:** `MapaArt`, `FluxoArt`, `AutoresArt`.
- **Prévia:** `preview/` passa a ser gerada do build real (`npm run preview:static`), com todas as páginas.
- **Correção:** erro de hidratação no explorador (formatação compacta de moeda diferia entre Node e navegador).

## 0.2.0 — 19/11/2026

- Identidade "Papel e tinta" e ilustração editorial no lugar de fotos geradas por IA (ADR-006).
