# SPEC 02 — Design system editorial

## História
Como leitor com pouco conhecimento sobre orçamento público, quero compreender conceitos sem ser sobrecarregado por filtros, tabelas ou cores ambíguas.

## Direção
v0.2 "Papel e tinta" (ADR-006): fundo papel `#F4EFE6`, tinta `#151515`, cobalto `#2E3BD6` como única cor de interação, sol `#F2B33D` como marca-texto e aviso demo, barro `#C2461E` como acento editorial. Manchetes em Archivo condensada (eixo `wdth`), leitura em Source Serif 4, dados e metadados em IBM Plex Mono com números tabulares. Imagens: **ilustração editorial vetorial** (colagem + risografia), não fotografia. Referências: Intercept Brasil e O Joio e O Trigo / Prato Cheio. Sem logo oficial de órgão público sugerindo endosso.

## Componentes mínimos
`EditorialHero`, `DemoBanner`, `EvidenceCard`, `MoneyStage`, `MoneyFlow`, `DataLens`, `MunicipalitySearch`, `FilterTabs`, `DefinitionTooltip`, `Figure` (ilustração com legenda), `StoryRow`, `StoryCard`, `CtaBar`, `SourceTrail`, `MethodologyNote`, `MetricBar`, `ArticleCard`, `EmptyState`, `CoverageFlag`.

## Estados
Todas as versões: loading, vazio, erro, demo, parcial, auditado. Esconder controles quando não há resultado explicável. Não usar verde/vermelho como classificação de comportamento político.

## Critérios de aceite
- **AC01** Um leitor consegue acessar fontes sem depender de hover.
- **AC02** Valores usam `font-variant-numeric: tabular-nums` e separam etapa/ano.
- **AC03** Navegação funciona com teclado e foco visível.
- **AC04** 360px não tem scroll horizontal indesejado.
- **AC05** Modo demo exibe aviso persistente antes do primeiro valor.
- **AC06** Gráficos têm rótulos ou alternativa de tabela.
- **AC07** Toda ilustração tem `aria-label` descritivo e legenda com selo `ILUSTRAÇÃO` deixando claro que é cena esquemática; nenhuma imagem gerada por IA na interface; foto só quando documental, com autor, licença e legenda factual.
- **AC08** Ilustrações não retratam pessoas reais, logotipos, brasões ou símbolos partidários, nem sugerem irregularidade sem base factual.
- **AC09** Exceção de fotografia: retrato **oficial** de parlamentar só na aba de autores, com o mesmo tratamento para todos (preto e branco, mesmo recorte, mesmo tamanho) e crédito institucional visível; sem foto oficial → iniciais. Nenhuma foto em reportagem ou chamada sem relação documental.

## Tasks
- [x] T02.01 Tokens e reset acessível (`app/globals.css`, `:root`).
- [x] T02.02 Cabeçalho e navegação mobile (menu quebra em linhas, `aria-current`, link "pular para o conteúdo").
- [x] T02.03 Hero editorial, cards e chamadas (`PageHero`, `StoryRow`, `StoryCard`, `CtaBar`).
- [x] T02.04 Fonte, crédito e definição de metodologia — `GlossaryTip` (details/summary, sem hover) e legenda obrigatória em `Figure`.
- [x] T02.05 Estados vazios, loading e erro — `DataState` com os 7 estados + `CoverageFlag` (`components/States.tsx`).
- [x] T02.06 Galeria de componentes (`/componentes`).
- [ ] T02.07 Testes visuais 360/768/1440 e acessibilidade — **parcial**, ver evidências.
- [x] T02.08 Biblioteca de ilustrações editoriais (`components/Illustrations.tsx`) substituindo fotos IA.

## Evidências de verificação (19/11/2026, modo demonstração)

- **Testado:** `tsc --noEmit` e `next build` sem erros (11 rotas estáticas). Script em iframe de 360px nas 9 páginas: largura de rolagem = largura da janela (sem estouro horizontal). Inspeção visual em 1568px e 375px.
- **Testado:** sem erro de hidratação no `next dev` (o formatador compacto de moeda foi trocado por função própria, já que `Intl` dava resultados diferentes no Node e no navegador).
- **Não testado:** largura de 768px especificamente; auditoria automatizada (axe/Lighthouse); leitor de tela real; zoom de texto a 200%.
