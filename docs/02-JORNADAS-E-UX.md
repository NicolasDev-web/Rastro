# Jornadas e experiência

## Cidadão — 3 passos

1. Chega pela reportagem: `O caminho do dinheiro` e aprende a distinção entre destinação e pagamento.
2. Digita ou escolhe município em busca acessível e vê ano, modalidade e estágio financeiro.
3. Abre documento de origem ou explicador: `O que significa pago?`.

**Sucesso:** encontrar o município e responder `quanto foi pago e quando`, sem que o layout confunda destinação local com recurso estadual.

## Jornalista

1. Abre `/dados`, lê a cobertura e baixa snapshot de dados auditados.
2. Define filtros com URL compartilhável; compara indicadores absolutos e por habitante.
3. Reconstitui um valor até evento/documento de origem; exporta evidências.

## Educador

1. Começa pelo glossário e diagrama; navega por capítulos de leitura simples.
2. Abre o simulador **explicitamente fictício** para comparar etapas financeiras.
3. Usa módulo `o que sabemos / o que não sabemos`.

## Taxonomia

- Principal: Início, Investigação, Mapa, Autores, Fluxos, Reportagens, Dados.
- Secundária: Sobre, Fontes, Metodologia, Correções, Contato.
- Modos: `Demonstração`, `Dados oficiais em validação`, `Publicação auditada`.

## Telas

- `home`: hero editorial + busca + narrativa + destaques de exploração.
- `investigacao`: capítulos curtos, fontes e explicadores, progressão por scroll.
- `mapa`: filtro por ano/métrica, busca municipal, tabela alternativa acessível ao mapa.
- `parlamentares`: autores individuais/coletivos, sem juízo político.
- `fluxos`: grafo com arestas fundamentadas; sem inferência de causalidade.
- `reportagens`: cards editoriais e espaço para contraditório/correções.
- `dados`: fonte, método, cobertura, arquivos, logs, dicionário e changelog.
- `componentes`: galeria visual dev only.

## Estados

Todos os componentes de dados devem prever `loading`, `empty`, `error`, `partial_coverage`, `unverified`, `verified`, `demo`. Tooltip nunca deve ser a única forma de apresentar informação. Cores não devem ser o único sinal semântico.

## Responsividade

Mobile first, 360px a 1440px. Tipografia mínima 15–16px para leitura, botões acionáveis 44px, navegação por teclado, foco visível e gráficos com tabela equivalente.
