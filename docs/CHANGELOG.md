# Changelog

## 0.12.0 — fechamento do P1: privacidade, 404, artes e rotina de dados

- Deploy só pela CLI: o `vercel.json` da raiz desliga a publicação automática a cada push no GitHub, que derrubava o site com 404 (ADR-020).
- Nova página `/privacidade`: o que o site registra (nada além dos registros técnicos da hospedagem; sem cookies próprios, medição de audiência ou serviços de terceiros no navegador), o uso das mensagens enviadas por e-mail, as pessoas nos arquivos oficiais (PF e MEI omitidos, sem CPF) e os direitos da LGPD. Link no rodapé, em Sobre e em Contato.
- Página 404 própria, em português, com arte e caminhos de volta.
- Seis ilustrações novas na mesma linha de colagem: Sobre (caderno de campo), Contato (envelope e avião de papel), Correções (valor riscado e reescrito, registro anterior guardado), Reportagens (máquina de escrever), Privacidade (tarjas e cadeado) e 404 (mapa rasgado). Toda aba e página institucional tem arte (ADR-016).
- `/reportagens` ganha título principal, título da aba e arte de abertura.
- Glossário conferido com o texto oficial no Planalto em 22/11/2026: cada termo cita o artigo (Lei 4.320/1964, Constituição arts. 166 e 166-A, LDO 2025 para os RP) e sai do selo "Rascunho editorial" (SPEC 03, T03.01–T03.02). O RP 9 passa a ser descrito como modelo que não consta da LDO 2025.
- `/dados`: a malha do IBGE e o Transferegov deixam de aparecer como pendentes.
- Rotina de atualização dos dados em `docs/operations/ATUALIZACAO-DADOS.md` (mensal, com passos e conferências). O build publicado recusa gerar o site se o registro de investigação for de outro snapshot.
- README e `TESTES-E-DEPLOY.md` descrevem o site publicado, não mais só a demonstração. `verify_web.py` cobre `/privacidade` e confere o título da 404.

## 0.11.0 — deputados estaduais ligados e artes nas abas que faltavam

- Emendas estaduais: cada deputado estadual com emenda ligada à lista da Alece pelo nome exato (41 deputados, 167 das 195 linhas) ganhou a página `/estaduais/[slug]`. Ela traz as emendas por ano, com as três colunas de valor separadas, o aviso de que a emenda estadual não é impositiva e só mostra o orçamento, a cobertura parcial, a fonte com data e SHA-256 e o link para o perfil oficial. Em Autores, o card desses deputados mostra os anos e a contagem de linhas e leva à página; nas tabelas de `/estaduais`, o nome ligado virou link. Sem ranking, sem total por deputado e sem soma com as federais (SPEC 07, incremento 2).
- Ilustrações: toda aba passa a ter arte própria. `EstaduaisArt` (contorno do Ceará em papel recortado e planilha do orçamento estadual com linhas preenchidas e em branco, carimbo "PCF") abre `/estaduais`; `DadosArt` (gaveta de arquivo com pastas por fonte, cadeado SHA-256 e carimbo "cópia datada") abre `/dados`; `MapaMiniArt` fica ao lado do título de `/mapa` e, no celular, vira um selo no canto sem empurrar o mapa. Sem legenda visível (ADR-016).

## 0.10.0 — Transferegov no fluxo e emendas estaduais

- **Transferegov no fluxo do dinheiro (SPEC 01 T01.04, SPEC 04 T04.05, ADR-018).** Novo adaptador `pipelines/rastro/transferegov.py` para a API pública do Transferegov.br, com cópia bruta datada e SHA-256 no manifesto, contrato de esquema verificado e valores em centavos. A ligação com a emenda é só por identificador oficial: o número da emenda no plano de ação da transferência especial, ou o número do convênio do arquivo da CGU, que leva à meta do cronograma e à proposta. Das 1.910 fichas, 603 ganharam plano de ação (259) ou convênio com proposta (344), e 107 passaram a ter a etapa "contrato ou obra" documentada pela execução que o ente declarou no relatório de gestão. As outras 1.803 continuam "não identificado", cada uma com o motivo. Para convênios, a API pública não publica contratos nem pagamentos. A ficha ganha a seção "No Transferegov" e `/fluxos` ganha o exemplo "Execução declarada". Pessoa física e MEI ficam mascarados. Os valores do Transferegov não se somam aos da CGU, e relatório de gestão é declaração do ente, não prova de entrega.
- **Emendas estaduais (SPEC 07, ADR-019).** Nova página `/estaduais` com o orçamento das emendas dos deputados estaduais do Ceará de 2023 a 2026, a partir dos CSVs do Ceará Transparente (CGE-CE), com cópia bruta datada e SHA-256 e export próprio, separado do pacote federal. Nada se soma às emendas federais. A página avisa que a emenda estadual no Ceará não é impositiva e que o arquivo traz só o orçamento, sem empenho, pagamento ou beneficiário. A cobertura é declarada parcial (25, 83, 50 e 37 linhas, todas PCF individuais). O município citado é ligado só pelo nome IBGE exato (176 de 195 linhas) e o deputado só pelo nome exato na lista da Alece (167 de 195); as linhas sem ligação ficam em `reports/ce-estaduais-*.md`. Novo passo: `python pipelines/run.py estaduais`.
- Menu ganha "Estaduais"; a seção da Alece em `/parlamentares` e `/dados` apontam para a nova página.

## 0.9.1 — textos de pendências atualizados

- `/dados`: "O que falta conferir" deixa de dizer que o mapa é esquemático e explica o que fica fora da cor das cidades.
- Docs: T04.03 e a malha do IBGE marcadas como feitas; checklist registra os 84 casos (0.7.0) e o risco do push na `main` com a Vercel ligada ao GitHub.

## 0.9.0 — nova aba Mapa

- `/mapa` abre com a pergunta "Quanto dinheiro de emendas chegou à sua cidade?": busca, mapa dos 184 municípios (malha do IBGE, SVG estático em tons de verde-mata) e resumo da cidade em frases, com link para a ficha. URL `?municipio=<IBGE>&ano=<ano>`.
- O mapa usa o valor pago com aplicação na cidade, segundo os documentos de pagamento (ADR-017). Pela localidade da emenda, só 38 cidades teriam cor em 2025; pela aplicação, 183. "Sem registro" tem hachura e não é zero.
- Card "O que o mapa não mostra" (estado inteiro e vários municípios) e tabela completa recolhida em "Ver todos os municípios", com o CSV. O explorador antigo sai de `/mapa` e fica no capítulo `/investigacao`.
- `apps/web/scripts/gerar-malha-ce.mjs` baixa a malha (API de malhas v3) e guarda a cópia bruta com SHA-256 em `data/malha/`.

## 0.8.0 — fluxo real por emenda

- `/fluxos` deixa de ser só um diagrama genérico: mostra três emendas reais, uma para cada tipo de ligação (documentada, em verificação, não identificada), e uma busca por código. Cada ficha de emenda ganha a seção "Fluxo do dinheiro".
- Cadeia: autor formal → emenda → pagamentos → quem recebeu → contrato ou obra, com o convênio como ramo da emenda. Cada ligação mostra `evidence_id`, método e link para o Portal. Regras na SPEC 04 (T04.05).
- Sobre as 1.910 fichas: 1.783 ligações emenda → pagamentos documentadas, 34 em verificação (soma diferente sem causa registrada) e 93 não identificadas (sem documento de pagamento). A etapa "contrato ou obra" é sempre lacuna: os contratos e fornecedores dependem do Transferegov.
- Convênio e pagamento não são ligados entre si, nem por nome nem por valor: os arquivos não têm identificador comum.
- `/dados`: "revisão editorial" sai de "O que falta conferir" (investigação cidadã sem revisão editorial externa, ADR-015).

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
