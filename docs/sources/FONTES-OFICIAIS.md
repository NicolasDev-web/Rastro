# Catálogo de fontes (pesquisa em 19/11/2026)

**Atenção:** páginas e documentação foram consultadas em pesquisa pública; integração e schemas ainda não foram testados contra dados reais. Links podem mudar.

## União

1. **CGU / Portal da Transparência — emendas parlamentares** — verificado em 19/11/2026
   - https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares/UNICO → ZIP único (47,2 MB) em `dadosabertos-download.cgu.gov.br`, atualizado diariamente, 6 CSVs, cp1252.
   - Dicionário: https://portaldatransparencia.gov.br/dicionario-de-dados/emendas-parlamentares (diverge do arquivo; ver SPEC 01 → Contrato verificado).
   - Em uso no incremento 1 (`pipelines/rastro`).
2. **CGU — documentos de despesa de emendas** — URL verificada em 19/11/2026
   - https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares-documentos/{ANO} → `{ANO}_EmendasParlamentaresPorDocumento.zip` (15–38 MB por ano).
   - Dicionário: https://portaldatransparencia.gov.br/dicionario-de-dados/emendas-parlamentares-por-documento — um documento SIAFI por linha, com fase e regra explícita de localidade de aplicação. Incremento 2.
   - Atenção: documentação financeira não é automaticamente uma linha de emenda. Em uso no incremento 2 (`pipelines/rastro/documentos.py`): o ano do arquivo é o ano do documento.
3. **Portal da Transparência — API REST**
   - https://api.portaldatransparencia.gov.br/
   - Confirmar autenticação, limites, parâmetros e comportamento de paginação.
4. **Transferegov — APIs públicas**
   - https://api-publica.transferegov.gestao.gov.br/
   - https://www.gov.br/transferegov/pt-br/ferramentas-gestao/dados-abertos
   - Verificado em 19/11/2026: transferências especiais em https://api-publica.transferegov.gestao.gov.br/especiais/ (OpenAPI em `/especiais/openapi.json`, 24 endpoints, paginação `pagina`/`tamanho_da_pagina`). Outros módulos: `/parcerias`, `/discricionarias`, `/fundoafundo`, `/ted`. Há campos com CPF de responsáveis — não importar.
   - **Em uso desde 21/11/2026 (SPEC 01 → T01.04, ADR-018, `pipelines/rastro/transferegov.py`):** esquema real conferido e congelado em `pipelines/contracts/transferegov.json`. Especiais: `planos-acao-especiais` (chave `numero_emenda_parlamentar_plano_acao` = código de 12 dígitos da CGU), `beneficiarios-especiais`, `executores-especiais`, `meta-especiais`, `planos-trabalho-especiais`, `relatorios-gestao-novos-especiais`, `relatorios-gestao-documento-liquidacao-especiais`. Discricionárias (13 endpoints, sem convênio, contrato ou pagamento): `meta-crono-fisico` (filtro `nr_convenio`, número do arquivo de convênios da CGU) e `propostas` (filtro `id_proposta`). Atualização diária (`/data-atualizacao`). O OpenAPI não declara licença; tamanho máximo de página 200; filtro por número de emenda devolve erro 500; paginação sem ordem estável (por isso consultas por chave).
   - A API antiga `api.transferegov.gestao.gov.br/transferenciasespeciais/` (PostgREST) ainda responde, mas a página oficial diz que os serviços migraram. Os downloads em lote do Siconv (`repositorio.dados.gov.br/seges/detru/siconv_*.csv.zip`) davam 404 em 21/11/2026.
5. **TCU — execução de emendas / painéis**
   - https://sites.tcu.gov.br/painel-de-acompanhamento-da-execucao-de-emendas/
   - Fonte de conferência, sujeita a escopo próprio.
6. **Câmara dos Deputados — dados abertos** — verificado em 19/11/2026
   - `https://dadosabertos.camara.leg.br/api/v2/deputados?idLegislatura=57&itens=1000` (877 registros na 57ª, inclui suplentes): id, nome parlamentar, partido, UF, `urlFoto`.
   - Partido da listagem é o atual; histórico em `/deputados/{id}/historico` (próximo incremento).
6b. **Senado Federal — dados abertos** — verificado em 19/11/2026
   - `https://legis.senado.leg.br/dadosabertos/senador/lista/legislatura/56/57.json` (318 registros): código, nome, partido, `UrlFotoParlamentar`. **UF incompleta** em parte dos registros: vínculo de senadores exige revisão manual.
6c. **Assembleia Legislativa do Ceará — deputados** — verificado em 19/11/2026
   - https://www.al.ce.gov.br/deputados (HTML com cards `deputado_card`: foto, nome, partido, link do perfil). 54 em exercício (46 titulares/licenciados + 8 suplentes). Em uso: `pipelines/rastro/alece.py`. Não há API nem dado de emendas no perfil.
6d. **Emendas de deputados estaduais (CE)** — pendência de fonte
   - Emendas estaduais do Ceará não são impositivas (≈R$ 1,65 mi por deputado; execução a critério do Executivo — Diário do Nordeste, 22/03/2026). O TCE-CE exige publicação de autor, valor, objeto e localidade, mas não foi encontrada base aberta consolidada. Próximos passos: Alece, Ceará Transparente, TCE-CE e pedido via LAI.
   - Pistas verificadas em 19/11/2026: o **quadro demonstrativo consolidado das emendas parlamentares aprovadas** da LOA 2026 (Lei nº 19.642) está no Diário Oficial de 30/12/2025 (pág. 571 da LOA, PDF de 20 cadernos, anexos com texto mal extraível); a **Lei estadual nº 19.851** obriga a Seplag a publicar no site o relatório das emendas aprovadas, mas a busca do site da Seplag retornava erro; na LOA 2026 foram acolhidas 521 emendas de deputados (Alece). Execução por deputado: pedir via LAI à Seplag/Sefaz.

## Ceará

7. **CaptaCeará / Seplag — painéis de recursos e emendas federais**
   - https://www.ce.gov.br/captaceara/captacao-de-recursos/paineis-gerenciais/
   - Referência de comparação. Verificar se a unidade é Estado, município, órgão ou instrumento.
8. **TCE-CE**
   - https://www.tce.ce.gov.br/
   - Fiscalização e orientações sobre transparência estadual e municipal.
9. **Assembleia Legislativa do Ceará — transparência**
   - https://transparencia.al.ce.gov.br/
   - Para módulo **futuro** de emendas estaduais, fora do MVP federal.
10. **IBGE — Localidades (API)** — verificado em 19/11/2026
    - https://servicodados.ibge.gov.br/api/v1/localidades/estados/23/municipios → 184 municípios do CE. Em uso no incremento 1.
11. **IBGE — Malha Municipal Digital**
    - https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/15774-malhas.html
    - Baixar shapefile/geo e documentar ano, escala, simplificação e licença.

## Auditoria obrigatória antes da primeira reportagem

- [ ] Registrar cobertura efetiva por exercício, modalidade e fonte.
- [ ] Capturar dicionários e versão dos endpoints.
- [ ] Testar identificação do autor formal vs apoiador.
- [ ] Comparar 3-5 agregados contra portal oficial e explicar divergências.
- [ ] Separar beneficiário estadual sem município identificado.
- [ ] Medir registros sem geocódigo, ID ou estágio financeiro.
- [ ] Publicar data/hora de extração e taxa de cobertura.
- [ ] Não chamar uma transferência de contrato/obra concluída.
