# Conciliação com documentos de despesa — recorte Ceará (snapshot ed93842c)

> Incremento 2. Gerado por `python pipelines/run.py documentos`. Dados oficiais **em validação**: não publicar.

- Arquivos: 2020 (`ad936e50`), 2021 (`0a47c8db`), 2022 (`21c2e715`), 2023 (`e1cf8ae4`), 2024 (`d0c50e90`), 2025 (`f2aa6f6f`), 2026 (`6a8f401d`).
- Documentos lidos: 3.610.312; guardados (ligados ao recorte ou com aplicação no CE): 64.250; favorecidos mascarados: 1.496.

## 1. Pago: documentos × arquivo por emenda (hipótese H1)

Para cada emenda com código oficial, de 2020 a 2026, no recorte CE: soma dos documentos na fase **Pagamento** (todos os anos de documento) comparada com o arquivo por emenda.

| Resultado | Emendas | % das que têm documento |
| --- | ---: | ---: |
| Documentos = Pago + RAP pagos (H1) | 1.644 | 91,5% |
| Documentos = só Pago | 4 | 0,2% |
| Nenhum dos dois | 148 | 8,2% |
| Conciliação indisponível (valores incompletos) | 0 | — |
| Sem documento de empenho ou pagamento | 0 | — |

Quando "RAP pagos" é zero, as duas linhas coincidem; a emenda conta em H1.

| Ano da emenda | Emendas | H1 | Só pago | Nenhum | Sem docs |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2020 | 344 | 314 | 0 | 30 | 0 |
| 2021 | 266 | 232 | 2 | 32 | 0 |
| 2022 | 263 | 247 | 0 | 16 | 0 |
| 2023 | 259 | 251 | 0 | 8 | 0 |
| 2024 | 278 | 267 | 0 | 11 | 0 |
| 2025 | 208 | 188 | 2 | 18 | 0 |
| 2026 | 178 | 145 | 0 | 33 | 0 |

### Exemplos sem conciliação (para investigar)

| Emenda | Ano | Pago | RAP pagos | Documentos (pago) |
| --- | --- | ---: | ---: | ---: |
| 202020250010 | 2020 | R$ 0,00 | R$ 0,00 | R$ 0,00 |
| 202020250017 | 2020 | R$ 0,00 | R$ 0,00 | R$ 0,00 |
| 202020830007 | 2020 | R$ 1.257.428,00 | R$ 656.451,54 | R$ 1.824.701,56 |
| 202024410017 | 2020 | R$ 0,00 | R$ 0,00 | R$ 0,00 |
| 202024410020 | 2020 | R$ 0,00 | R$ 336.461,86 | R$ 67.292,37 |
| 202024410024 | 2020 | R$ 0,00 | R$ 0,00 | R$ 0,00 |
| 202024420014 | 2020 | R$ 0,00 | R$ 0,00 | R$ 0,00 |
| 202024420015 | 2020 | R$ 0,00 | R$ 0,00 | R$ 0,00 |
| 202033400020 | 2020 | R$ 0,00 | R$ 0,00 | R$ 0,00 |
| 202037100003 | 2020 | R$ 0,00 | R$ 0,00 | R$ 0,00 |
| 202037100019 | 2020 | R$ 0,00 | R$ 0,00 | R$ 0,00 |
| 202037100020 | 2020 | R$ 0,00 | R$ 0,00 | R$ 0,00 |

## 2. Empenho: documentos × arquivo por emenda

1.675 de 1.796 emendas com documentos (93,3%) têm soma de empenhos igual ao "Valor Empenhado". O dicionário avisa que, a partir de 2021, a data do empenho é a da última alteração — o valor pode refletir reforços e anulações.

## 3. Contagem única (AC03)

Cada emenda conta uma vez: os totais vêm do arquivo por emenda; documentos só conciliam. Maior número de documentos numa emenda: 369.

## 4. Ganho de rastreabilidade

Emendas sem município no arquivo por emenda ("aplicação estadual", "vários municípios", "Nacional") que têm documento de **pagamento** com município de aplicação no Ceará:

| Escopo no arquivo por emenda | Emendas | Pago com município de aplicação no CE |
| --- | ---: | ---: |
| multiplo | 610 | R$ 4.645.908.046,41 |

A localidade de aplicação segue a regra oficial (localidade do favorecido para transferências a municípios/estados; senão, regionalização do gasto). Não prova o local da entrega.
