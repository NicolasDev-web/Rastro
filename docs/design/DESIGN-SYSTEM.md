# RASTRO Design System v0.2 — "Papel e tinta"

**Filosofia:** jornalismo investigativo primeiro, ferramenta analítica depois. Alto contraste de impresso (papel + tinta preta), manchetes condensadas e pesadas, metadados em mono, e **ilustração editorial desenhada no lugar de fotografia**.

Referências de linguagem (estudo, não cópia de UI): **Intercept Brasil** (contraste preto/branco, manchete condensada, datas em mono, linha fina em serif, faixa de chamada de largura total, listas "arte | manchete | linha fina") e **O Joio e O Trigo / Prato Cheio** (ilustração em colagem com textura de papel, cores chapadas saturadas, rótulo da manchete em caixa escura sobre a arte, cartões em grade). Ver `REFERENCIAS-DE-EXPERIENCIA.md`.

> v0.1 (petróleo/cobre, Georgia, fotos geradas por IA) foi substituída por esta versão. Decisão em `architecture/ADRs.md` (ADR-006).

## Paleta

| Token | Hex | Uso |
|---|---|---|
| `--paper` | `#F4EFE6` | Fundo principal (papel jornal) |
| `--paper-2` | `#E8DFCC` | Seções alternadas, trilhos de gráfico |
| `--card` | `#FFFDF8` | Cartões e painéis |
| `--ink` | `#151515` | Texto, bordas de 2px, cabeçalho, seções escuras |
| `--muted` | `#5C564E` | Linha fina e metadados (≥ 6:1 sobre papel) |
| `--cobalt` | `#2E3BD6` | **Única cor de interação**: links, botões, estado selecionado, barras |
| `--sol` | `#F2B33D` | Marca-texto (`<mark>`), aviso demo, acentos sobre fundo escuro |
| `--sol-soft` | `#F8E6BC` | Fundo de notas metodológicas |
| `--barro` | `#C2461E` | Acento editorial e ilustração; avisos "sem fonte" |
| `--mata` / `--rosa` | `#2F6B4F` / `#EE8FA6` | **Somente ilustração** |

Regras: cor não carrega julgamento. Barro não significa suspeita, cobalto não significa aprovação, nenhuma cor remete a partido. Vermelho/verde nunca classificam conduta. Foco: contorno cobalto em fundo claro e sol em fundo escuro.

## Tipografia (Google Fonts via `next/font`)

- **Manchete e UI:** Archivo (variável, eixo `wdth`). Manchetes em peso 800–900 com `font-variation-settings: 'wdth' 70` (condensada). Rótulos, botões e navegação em caixa-alta, `wdth` 85, espaçamento .05em.
- **Leitura:** Source Serif 4 — corpo de reportagem (19px/1.8), linhas finas e leads.
- **Dados e metadados:** IBM Plex Mono — eyebrows, datas, códigos IBGE, legendas, valores das barras. Números com `tabular-nums`.
- H1 `clamp(3.4rem, 8.4vw, 7.6rem)` com entrelinha .92; H2 `clamp(2.3rem, 4.6vw, 4.4rem)`.

## Forma

Cantos retos. Bordas de 2px em tinta para cartões, painéis, molduras de ilustração e grades (sem sombras, sem raio). Pílulas arredondadas só para filtros/chips (`city-pill`, `demo-label`). Container visual 1200px, texto de leitura até 760px, ritmo 4/8/12/16/24/32/48/64/96px.

## Ilustração editorial

Todas as imagens do protótipo são **vetores originais desenhados em código** (`apps/web/components/Illustrations.tsx`). Não há fotografia nem imagem gerada por IA.

- **Técnica:** colagem de papel recortado + risografia: cores chapadas da paleta, retícula de meio-tom (`pattern` de pontos), grão de papel (`feTurbulence`) e borda levemente irregular (`feDisplacementMap`). Contornos em tinta 2.5px e "sombra" deslocada de papel.
- **Vocabulário de metáforas:** documento, carimbo, lupa, moeda, rastro pontilhado, edifício legislativo esquemático, estrada, mandacaru, carnaúba, cidade pequena com igreja e caixa d'água.
- **Proibido desenhar:** rostos ou caricaturas de pessoas reais; logotipos, brasões ou símbolos de órgãos e partidos; dinheiro "sumindo", algemas, sacos de dinheiro ou qualquer imagem que sugira irregularidade sem relação factual.
- **Legenda obrigatória:** componente `Figure` sempre mostra o selo `ILUSTRAÇÃO` + frase que deixa claro que é cena esquemática. SVG com `role="img"` e `aria-label` descritivo.
- **Peças atuais:** `CaminhoArt` (percurso indicação → empenho → pagamento), `SertaoArt` (interior), `CongressoArt` (documentos saindo do Legislativo), `DocumentosArt` (mesa de apuração), `MapaArt` (município / Estado / indeterminado), `FluxoArt` (fios documentado / em verificação / não identificado), `AutoresArt` (plenário com cadeiras vazias: individual, bancada, comissão) e spots `entender`, `explorar`, `verificar`, `acompanhar`.
- **Nova ilustração:** reutilizar `Doc`, `Lupa`, `Coin`, `Tag`, `Pin`, `Card`, `Congresso` e `Frame`; manter ≤ 5 cores da paleta por cena; testar em recorte 1:1, 4:3 e 16:10 (as molduras usam `preserveAspectRatio="xMidYMid slice"`).

## Componentes

1. **EditorialHero**: eyebrow mono, manchete condensada com trecho em `<mark>` amarelo, linha fina serif, CTAs, ilustração com moldura.
2. **DemoBanner**: faixa sol persistente `PROTÓTIPO CONCEITUAL — todos os valores exibidos são fictícios`.
3. **EvidenceCard**: ícone em caixa sol, título condensado, fonte oficial; versão `sem fonte` em mono barro bloqueia publicação.
4. **MoneyStage**: seletor segmentado com borda 2px; estado ativo cobalto. Nunca somar estágios. Ausente ≠ zero.
5. **MunicipalitySearch**: campo com borda 2px e chips em pílula; teclado; sem geolocalização presumida.
6. **MetricBar**: trilho papel-2 com contorno, preenchimento cobalto, valor em mono.
7. **MoneyFlow**: nós retos com borda; ativo em tinta com contador sol. Nó indeterminado visível.
8. **Figure / Art / SpotArt**: moldura de ilustração com legenda obrigatória.
9. **StoryRow** (home): arte 16:10 | editoria cobalto + manchete + meta mono | linha fina serif.
10. **StoryCard** (reportagens): arte 1:1 com rótulo em caixa preta (manchete caixa-alta + editoria em mono sol).
11. **CtaBar**: faixa cobalto de largura total com seta; hover sol.
12. **MethodologyNote / InfoNote**: fundo sol-soft com filete de tinta à esquerda.
13. **CoverageFlag**: `Completa no recorte`, `Parcial`, `Não verificada`, `Demonstração` — cobertura, não qualidade moral.
14. **SourceTrail**: ordem evento/documento/origem, cada etapa clicável e verificada.
15. **PageHero**: abertura de página interna — eyebrow, H1, linha fina e ilustração com legenda.
16. **DataState**: `loading`, `empty`, `error`, `partial_coverage`, `unverified`, `verified`, `demo`. Ícone + título + texto; vazio e erro nunca viram zero ou estimativa.
17. **GlossaryTip / GlossaryList**: `details/summary` com definição curta, norma de referência e link para `/glossario#termo`.
18. **DataTable**: tabela com `caption`, grupos (municípios / fora da contagem municipal), números em mono alinhados à direita, "Sem registro" em itálico.
19. **EdgeChip**: ligação do fluxo — linha contínua (documentado), tracejada (em verificação), pontilhada (não identificado) + ícone.
20. **StageLadder**: escada vertical de etapas; etapa fora dos registros federais (entrega) em hachura e marcador tracejado.

## Acessibilidade

WCAG 2.2 AA; HTML semântico; `prefers-reduced-motion`; foco 3px visível; texto a 200%; teclado; tabelas com cabeçalho; mapas com lista equivalente; estados em texto e ícone. Ilustrações em links de cartões ficam `aria-hidden` (o título já é o link). Sem rolagem horizontal em 360px.

## Direção visual de páginas

- **Home:** hero em tinta com manchete gigante e `CaminhoArt`; pilares com spots; explorador; faixa papel-2 com `SertaoArt`; evidências; lista de pautas; seção escura com `CongressoArt` + `CtaBar`.
- **Investigação:** manchete com marca-texto, ilustração de abertura 16:10, sumário lateral, corpo em serif, `DocumentosArt` no capítulo de rastreabilidade.
- **Reportagens:** grade de cartões quadrados com rótulo sobre a arte.
- **Mapa / Fluxos / Autores / Glossário:** `PageHero` com ilustração própria; mapa com explorador, tabela acessível e destinos não municipais separados; fluxo com status nas ligações.
- **Dados:** cartões de borda 2px, notas metodológicas em sol-soft.
