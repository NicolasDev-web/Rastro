# Conciliação com documentos de despesa — recorte Ceará (snapshot ed93842c)

> Incremento 2. Gerado por `python pipelines/run.py documentos`. Dados oficiais **em validação**: não publicar.

- Arquivos: 2020 (`ad936e50`), 2021 (`0a47c8db`), 2022 (`21c2e715`), 2023 (`e1cf8ae4`), 2024 (`d0c50e90`), 2025 (`f2aa6f6f`), 2026 (`6a8f401d`).
- Documentos lidos: 3.610.312; guardados (ligados ao recorte ou com aplicação no CE): 64.250; favorecidos mascarados: 1.496.

## 1. Pago: documentos × arquivo por emenda (hipótese H1)

Para cada emenda com código oficial, de 2020 a 2026, no recorte CE: soma dos documentos na fase **Pagamento** (todos os anos de documento) comparada com todas as linhas desse código no arquivo por emenda, inclusive localidades fora do CE. A seleção territorial não recorta os valores de uma emenda na comparação documental.

| Resultado | Emendas | % das comparáveis |
| --- | ---: | ---: |
| Documentos = Pago + RAP pagos (H1) | 1.645 | 96,1% |
| Documentos = só Pago | 4 | 0,2% |
| Nenhum dos dois | 62 | 3,6% |
| Conciliação indisponível (valores incompletos) | 0 | — |
| Sem documento de pagamento | 85 | — |

Quando "RAP pagos" é zero, as duas linhas coincidem; a emenda conta em H1. Igualdade apenas com Pago continua divergente do total. Sem pagamento documentado não é zero nem divergência.

| Ano da emenda | Emendas | H1 | Só pago | Nenhum | Sem pagamento | Incompletas |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 2020 | 344 | 314 | 0 | 10 | 20 | 0 |
| 2021 | 266 | 232 | 2 | 22 | 10 | 0 |
| 2022 | 263 | 247 | 0 | 8 | 8 | 0 |
| 2023 | 259 | 252 | 0 | 3 | 4 | 0 |
| 2024 | 278 | 267 | 0 | 5 | 6 | 0 |
| 2025 | 208 | 188 | 2 | 12 | 6 | 0 |
| 2026 | 178 | 145 | 0 | 2 | 31 | 0 |

### Exemplos sem conciliação (para investigar)

| Emenda | Ano | Pago | RAP pagos | Documentos (pago) |
| --- | --- | ---: | ---: | ---: |
| 202020830007 | 2020 | R$ 1.257.428,00 | R$ 656.451,54 | R$ 1.824.701,56 |
| 202024410020 | 2020 | R$ 0,00 | R$ 336.461,86 | R$ 67.292,37 |
| 202039610011 | 2020 | R$ 0,00 | R$ 2.000.000,00 | R$ 1.235.057,60 |
| 202040460007 | 2020 | R$ 0,00 | R$ 1.232.227,00 | R$ 1.182.584,00 |
| 202040460010 | 2020 | R$ 0,00 | R$ 545.115,16 | R$ 529.554,00 |
| 202040550003 | 2020 | R$ 0,00 | R$ 2.999.013,00 | R$ 2.517.909,00 |
| 202041380007 | 2020 | R$ 0,00 | R$ 969.960,00 | R$ 731.104,00 |
| 202041470012 | 2020 | R$ 233.466,14 | R$ 0,00 | R$ 236.724,03 |
| 202071070007 | 2020 | R$ 0,00 | R$ 1.834.213,34 | R$ 1.828.506,19 |
| 202071070014 | 2020 | R$ 181.066.340,00 | R$ 0,00 | R$ 181.166.340,00 |
| 202120250002 | 2021 | R$ 0,00 | R$ 600.000,00 | R$ 578.003,00 |
| 202120830003 | 2021 | R$ 14.000,00 | R$ 86.000,00 | R$ 96.261,00 |

## 2. Empenho: documentos × arquivo por emenda

1.675 de 1.796 emendas comparáveis de empenho (93,3%) têm soma de empenhos igual ao "Valor Empenhado". Há 1.796 emendas com documento de empenho. O dicionário avisa que, a partir de 2021, a data do empenho é a da última alteração — o valor pode refletir reforços e anulações.

## 3. Contagem única (AC03)

Cada emenda conta uma vez: os totais vêm do arquivo por emenda; documentos só conciliam. Maior número de documentos numa emenda: 612.

## 4. Ganho de rastreabilidade

Emendas sem município no arquivo por emenda ("aplicação estadual", "vários municípios", "Nacional") que têm documento de **pagamento** com município de aplicação no Ceará:

| Escopo no arquivo por emenda | Emendas | Pago com município de aplicação no CE |
| --- | ---: | ---: |
| multiplo | 610 | R$ 4.645.908.046,41 |

A localidade de aplicação segue a regra oficial (localidade do favorecido para transferências a municípios/estados; senão, regionalização do gasto). Não prova o local da entrega.
