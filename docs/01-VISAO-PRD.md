# PRD — RASTRO

## Problema

Registros orçamentários e de transferência são publicados em sistemas separados e linguagem técnica. A existência de uma emenda não prova pagamento, transferência, contrato nem entrega. Usuários não especializados confundem essas etapas; jornalistas enfrentam obstáculos de reconciliação.

## Proposta de valor

**Entender → explorar → verificar → acompanhar.** Uma reportagem inicial explica o sistema, e as fichas interativas permitem explorar os dados federais identificáveis do Ceará. Cada afirmação reproduzível leva à fonte.

## Segmentos

1. Cidadão: encontrar município e entender valores efetivamente pagos.
2. Jornalista/pesquisador: filtros, exportação, metodologia e documentos.
3. Educador: percurso didático com exemplos e glossário.

## MVP obrigatório

- Página inicial editorial com disclaimer, busca e capítulos.
- Consulta por município com valores segmentados por ano/etapa e com regra territorial publicada.
- Consulta por autor formal ou coletivo, sem inventar autoria individual de emendas coletivas.
- Cards de evidência, fonte, data e modalidade.
- Conteúdo educacional sobre RP6/RP7/RP8/RP9 histórico e transferências especiais.
- Laboratório de dados com snapshots, dicionário, cobertura, exportação e changelog.
- Página de metodologia + política de correções.

## Fora do MVP

- Identificação conclusiva de execução física de todas as emendas.
- Investigação automatizada de crime, corrupção ou conduta política.
- Emendas estaduais/municipais misturadas em métricas federais.
- Previsões eleitorais, inferência de motivação e classificações de mérito de parlamentares.
- Dependência exclusiva de LLM para valores financeiros.

## Produto de lançamento

Headline: **O caminho do dinheiro**. Subtítulo: *Quem destina, quem recebe e o que é possível rastrear das emendas parlamentares no Ceará*. O cidadão seleciona a cidade na narrativa e abre sua ficha.

## Métricas de sucesso

- 100% dos números publicados com fonte, escopo, data de extração e definição explícita.
- 0 duplicidades que produzam contagem dupla nos agregados publicados.
- Taxa de busca por município concluída sem erro (instrumentação respeitando privacidade).
- Tempo e taxa de acerto no teste de compreensão leiga.
- Cobertura por ano/modalidade/beneficiário explicitada; nunca esconder percentual de registros sem geocódigo.
- Acessibilidade alvo WCAG 2.2 AA e performance móvel adequada.

## Riscos e mitigação

- Mudança no esquema das APIs → versionar adaptadores e testes de contrato.
- Chave imprecisa → relações com nível de evidência e revisão.
- Confusão de autorização, empenho, liquidação, pagamento → métricas independentes.
- Dados pessoais → minimização e avaliação de necessidade de publicação.
- Cobertura municipal incompleta → distinguir Estado/município/indeterminado.
- Fotografia manipulada → substituir assets conceituais por fotos verificadas e creditadas antes da publicação.
