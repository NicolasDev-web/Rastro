# Constituição do RASTRO — regras não negociáveis

## Natureza do projeto (decisão de 20/11/2026)

O RASTRO é uma **investigação cidadã independente**: organiza e mostra à população números públicos oficiais sobre emendas destinadas ao Ceará. Não é um veículo de imprensa e não depende de aprovação de redação, investigador ou veículo externo para publicar. A revisão é do próprio autor do projeto, registrada nos arquivos de revisão. Em troca, o site declara em todas as páginas que é uma iniciativa cidadã, que os números vêm de fontes oficiais e podem conter erros de extração ou interpretação, e oferece canal público de correção. As regras abaixo continuam valendo integralmente.

## Editorial

1. A existência de uma emenda **não** comprova pagamento, aplicação final ou irregularidade.
2. Exibir `ano`, `modalidade`, `origem`, `data`, `estágio financeiro`, `escopo geográfico`, `fonte` e `cobertura` de toda métrica.
3. Não somar valores de etapas diferentes como se fossem dinheiro adicional.
4. Autor formal, apoiador, bancada, comissão e beneficiário são papéis distintos.
5. Ausência de documento não é prova de desvio; diferença de valores exige contextualização.
6. Proibir rotulagem automática de pessoas como suspeitas, honestas, corruptas ou equivalentes.
7. Em apurações com identificação individual, oferecer contraditório, corrigir erros e registrar metodologia.
8. Nunca extrapolar contratos ou entregas físicas que a documentação não sustenta.

## Dados

9. Raw imutável + `sha256`, URL, versão do dicionário e data de extração para cada dataset.
10. Usar IDs oficiais ou vínculo verificável; fuzzy matching jamais publica relação sem revisão.
11. Não atribuir todos os recursos estaduais à capital do Ceará.
12. Estados federais, estaduais e municipais têm orçamentos separados e **não** se misturam em um agregado sem regra definida.
13. Valores ausentes são `null`, não zero; `0` exige ocorrência verificável.
14. Diferenciar data de referência da atualização e data do evento financeiro.
15. Todo CSV demo ou fixture deve conter prefixo `DEMO_` e aviso visível de ficção.

## Engenharia e UX

16. `DEMO_DATA=true` por padrão, sem conexão silenciosa a bases reais.
17. Gráficos sempre com alternativa de tabela textual acessível.
18. Em mobile, comportamento essencial funcional sem efeitos de scroll.
19. Carregamento parcial e erros apresentam aviso claro, jamais total inventado.
20. Aceite de spec requer teste, evidência e revisão. Nada de implementar por intuição sem atualização do contrato.
