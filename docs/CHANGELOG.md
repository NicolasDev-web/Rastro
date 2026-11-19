# Changelog

## 0.5.0 — fechamento A/B, institucional e roteiro

- Critérios de localidade da emenda e aplicação dos pagamentos separados no explorador, mapa e fichas. Corrigido CSV para respeitar o critério ativo, sem duplicar RAP.
- Fichas de emendas e municípios, cronologia, conciliação, favorecidos e convênios; links entre as fichas e cinco termos de glossário adicionados na implementação A/B.
- Sete testes novos do contrato das fichas e export territorial; verificação de navegador reproduzível com desktop, 360px, teclado, CSV e rota inexistente.
- `/dados` reescrita por modo; Sobre, Correções e Contato no rodapé, seguindo Papel e tinta. Canal editorial ainda não configurado, explicitado na interface.
- Prévia offline ampliada às fichas demo e páginas institucionais; geração força modo demo.
- Tipografia original autohospedada com as licenças OFL; removida dependência do Google Fonts no build, preservando famílias, pesos e eixo de largura. Raiz do monorepo explícita no Next.js.
- Git já iniciado e publicado em `NicolasDev-web/Rastro`; checklist de lançamento e roteiro interno de vídeo com capturas reais. Resultados de execução no relatório de fechamento.

## 0.4.0 — 19/11/2026 (pendências de dados — em validação)

- **Conferência amostral (T01.09):** 60/60 valores conferem com o Portal (revisor: revisor do projeto). O gerador agora nunca sobrescreve a planilha preenchida (`report.write_once`, com teste) — a planilha assinada chegou a ser sobrescrita por uma execução e foi restaurada integralmente.
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
