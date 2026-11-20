# Modelo e dicionário de métricas

## Granularidade

- `emenda`: uma chave canônica por registro formal de emenda e exercício; preservar ID de origem.
- `autoria`: relação N:N com atributo `natureza_vinculo` (autor formal, bancada, comissão, apoiador, outro documentado).
- `evento_financeiro`: uma ocorrência documental identificada de um estágio (empenho/liquidação/pagamento etc.); IDs externos são prioritários.
- `transferencia`: instrumento ou evento de transferência, não sinônimo de emenda.
- `beneficiario`: ente/órgão/favorecido conforme fonte; não confundir com fornecedor de contrato.
- `municipio`: código IBGE e UF; um evento estadual pode não pertencer a um município identificável.
- `documento`: versão/URL/arquivo, data de extração e hash.

## Medidas

- `valor_autorizado`: somente quando definição oficial permite atribuir ao recorte/ano.
- `valor_empenhado`: eventos classificados como empenhos segundo fonte/contrato.
- `valor_liquidado`: eventos de liquidação quando disponíveis.
- `valor_pago`: pagamentos registrados conforme fonte, descontando anulações/estornos conforme contrato validado.
- `valor_transferido`: transferências específicas, NÃO somar com pagamento sem reconciliação.
- `per_capita`: valor de uma medida / população do município, com ano da população declarado.

**Importante**: não usar fórmula universal `pago/autorizado` para modalidades que não possuem ambos os campos comparáveis no mesmo escopo sem validar.

## Pago total e conciliação (P0.4)

`pago_total = pago + rap_pagos` soma campos da CGU para a comparação operacional com documentos de Pagamento; ambas as parcelas são obrigatórias. Não se somam empenho ou liquidação. A igualdade aritmética não confirma por si a interpretação temporal dos campos.

A diferença assinada é `documentos_pago - pago_total`. Sem documento de Pagamento: `sem_documentos`, valor documental null. Com parcela ausente: `indisponivel`. Comparação exata: `confere` ou `diverge`. Igualdade só com Pago continua divergente do total. Nenhuma tolerância, compensação entre emendas ou deduplicação por valor é aplicada.

A seleção territorial escolhe códigos; a comparação por código considera todas as suas localidades. Os documentos não possuem o mesmo detalhamento das linhas por localidade/classificação. O recorte CE e o universo das fichas não se somam. Porcentagens de igualdade usam o denominador de códigos comparáveis da respectiva fase, com o número de códigos sem documentos e incompletos apresentado separadamente (ADR-012).

## Conservação de valores

Para cada `source_id,ano,etapa`: agregado publicado deve reconciliar com total oficial (após filtros) ou registrar diferença explicada. Não somar arquivo detalhado com seu próprio total.

## Cobertura

`records_eligible`, `records_linked`, `records_unlocated`, `amount_eligible`, `amount_located`, `data_as_of`. Publicar cobertura de quantidade e valor para evitar viés de não localização.

## Regras de identificação

Match exato por ID público/documental. Correspondência por documento secundário revisado. Fuzzy match só para fila privada de revisão, nunca em grafo público.
