# Evidências de fechamento — 19/11/2026

## Resultado

Frente B coberta por testes de contrato e navegação representativa; Frente C implementada no design Papel e tinta; Git já iniciado/publicado anteriormente; checklist de lançamento, specs, changelog, prévia e roteiro atualizados. Não representa aprovação editorial para publicação de dados oficiais.

## Verificações executadas

| Verificação | Resultado |
| --- | --- |
| `python -m unittest discover -s pipelines/tests -q` | 41 testes passaram (7 novos das fichas/export) |
| `python -m unittest discover -s services/api/tests -q` | 4 testes passaram |
| `python pipelines/validate/check_fixture.py` | 5 fixtures marcadas DEMO_ONLY |
| `npm run typecheck` em apps/web | Passou |
| `npm run preview:static` em apps/web | Build, tipos e geração das 21 páginas offline em demo passaram |
| `python scripts/verify_preview.py` | 455 links/assets locais existentes; 21 páginas com aviso demo |
| `python scripts/verify_web.py --url http://localhost:3012` | Validação: 12 rotas × 2 larguras (1440/360), HTTP 200, sem overflow da página ou erro JavaScript não tratado |
| `python scripts/verify_web.py --url http://localhost:3014 --mode demo` | Demo: mesmas 24 combinações passaram |
| Busca sem acento + Enter, navegação à ficha municipal, código inexistente | Passou nos dois modos; código inexistente retorna 404 |
| Download CSV dos dois critérios | Cabeçalhos corretos; aplicação sem escopos não municipais ou RAP duplicado; Fortaleza confere com o export |
| `git diff --check` | Sem erros de whitespace |
| `python scripts/generate_video_guide.py` | 15 páginas; texto extraível, fontes incorporadas, renders inspecionados |

Capturas e JSONs em `output/qa/{demo,validacao}/`. Revisão visual: novas páginas, fichas municipal/emenda, seletor de aplicação e versão móvel. Tabelas extensas rolam no próprio contêiner. PDF em `output/pdf/rastro-roteiro-video.pdf`; roteiro editável em `docs/editorial/ROTEIRO-VIDEO.md`. Artefatos internos são ignorados pelo Git.

## Reconferência do snapshot ed93842c

**Registro histórico, anterior à revisão P0.4.** As contagens de conciliação e a consulta abaixo não representam a seleção documental ativa atual. Os resultados vigentes são 1.744 fichas iguais, 73 divergentes e 93 sem pagamento documental; consultar `INTEGRIDADE-P0.md` e `reports/revisao-conciliacao-2026-11-19-ed93842c.md`. Consultas financeiras atuais usam `cgu_documentos_ativos`.

- 1.910 emendas com ficha, 1.826 com pagamento igual aos documentos e 84 divergentes.
- 184 fichas municipais.
- Aplicação em municípios do CE: 808.529.080.867 centavos (R$ 8.085.290.808,67).
- Localidade da emenda, pago + RAP: 86.304.150.158 centavos (R$ 863.041.501,58).
- Fortaleza, ano da emenda 2025, aplicação: 15.526.057.136 centavos (R$ 155.260.571,36). Consulta somente leitura ao staging igual ao export.

Consulta usada: `SELECT SUM(valor_pago_cents) FROM cgu_documentos WHERE ibge_aplicacao = '2304400' AND ano_emenda = 2025 AND fase LIKE 'Pagamento%'`.

Os dois critérios nunca se somam. O universo de fichas inclui emendas de autores eleitos pelo CE além do recorte territorial CE; não confundir seus percentuais de conciliação com os do relatório territorial anterior.

## Limites e pendências de lançamento

- Testes de navegador são amostrais: não percorrem todas as 1.910 fichas. Não equivalem a auditoria integral WCAG ou teste em aparelho físico/leitor de tela.
- Canal editorial, responsáveis e política de privacidade ainda não definidos. Contato informa isso explicitamente; Correções descreve o fluxo previsto, sem inventar histórico.
- Mapa ainda esquemático; narrativas e fluxo demonstrativos não são investigação concluída.
- Validação de cobertura, divergências e revisão editorial permanecem necessárias. Ver checklist de publicação.
- PDF é roteiro-base interno de 6min35s, com 15 cenas e capturas reais, não vídeo renderizado.

## Reprodução

Python de QA precisa de Playwright/Chromium, ReportLab, PyMuPDF, Pillow e FontTools com Brotli. Os testes do pipeline usam biblioteca padrão. Inicie Next a partir de apps/web; para validação use `DATA_MODE=validacao` e `NEXT_DIST_DIR=.next-validacao`, em porta separada de demo. Nunca use o modo validação em deploy público. Rode o gerador do PDF depois das capturas do `verify_web.py`.
