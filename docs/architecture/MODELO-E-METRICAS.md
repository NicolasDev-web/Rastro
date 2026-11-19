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

## Conservação de valores

Para cada `source_id,ano,etapa`: agregado publicado deve reconciliar com total oficial (após filtros) ou registrar diferença explicada. Não somar arquivo detalhado com seu próprio total.

## Cobertura

`records_eligible`, `records_linked`, `records_unlocated`, `amount_eligible`, `amount_located`, `data_as_of`. Publicar cobertura de quantidade e valor para evitar viés de não localização.

## Regras de identificação

Match exato por ID público/documental. Correspondência por documento secundário revisado. Fuzzy match só para fila privada de revisão, nunca em grafo público.
