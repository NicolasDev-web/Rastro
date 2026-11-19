# Cobertura e conservação — CGU emendas, recorte Ceará (snapshot ed93842c)

> Gerado por `python pipelines/run.py report`. Dados oficiais **em validação**: não publicar.

- Snapshot: `raw_data/cgu/emendas/2026-11-19_ed93842c_EmendasParlamentares.zip` · baixado em 2026-11-19T18:37:39+00:00 · fonte atualizada em Thu, 19 Nov 2026 00:51:30 GMT
- Recorte: linhas com `Código UF IBGE = 2300000` (SPEC 01 → Escopo territorial).

## 1. Conservação (Gate A)

Totais por ano × escopo × etapa calculados direto do CSV bruto (caminho A) e pelo staging SQLite (caminho B).

**OK** — 38 combinações ano × escopo, 7 medidas cada (linhas + 6 valores), idênticas ao centavo.

## 2. Cobertura do recorte por ano (2020–2026)

Valores em reais. "Pago" e "RAP pagos" são medidas distintas e **não são somadas**.

| Ano | Escopo | Linhas | Empenhado | Liquidado | Pago | RAP pagos |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 2020 | municipio | 191 | R$ 135.596.410,57 | R$ 92.321.714,90 | R$ 92.149.003,12 | R$ 34.190.702,47 |
| 2020 | estado | 83 | R$ 235.477.649,09 | R$ 141.731.753,59 | R$ 107.956.654,46 | R$ 115.461.902,88 |
| 2020 | multiplo | 80 | R$ 433.262.982,62 | R$ 380.287.142,97 | R$ 380.287.142,97 | R$ 45.868.203,59 |
| 2021 | municipio | 108 | R$ 80.155.826,62 | R$ 63.723.626,09 | R$ 63.204.897,91 | R$ 13.636.868,72 |
| 2021 | estado | 60 | R$ 33.531.242,02 | R$ 5.595.925,99 | R$ 5.110.255,73 | R$ 26.409.061,89 |
| 2021 | multiplo | 98 | R$ 545.444.441,73 | R$ 489.620.273,60 | R$ 489.616.773,60 | R$ 49.154.116,04 |
| 2022 | municipio | 126 | R$ 98.133.368,60 | R$ 67.411.907,50 | R$ 67.411.907,50 | R$ 26.812.634,39 |
| 2022 | estado | 52 | R$ 31.655.255,94 | R$ 12.389.519,37 | R$ 10.268.739,86 | R$ 18.431.865,78 |
| 2022 | multiplo | 85 | R$ 541.852.527,72 | R$ 451.661.946,34 | R$ 451.661.946,34 | R$ 86.764.653,12 |
| 2023 | municipio | 94 | R$ 192.594.154,20 | R$ 186.091.830,22 | R$ 186.091.830,22 | R$ 6.330.218,06 |
| 2023 | estado | 50 | R$ 32.933.729,16 | R$ 14.005.514,22 | R$ 13.410.805,44 | R$ 17.009.077,80 |
| 2023 | multiplo | 115 | R$ 894.647.088,70 | R$ 820.378.429,53 | R$ 820.378.429,53 | R$ 56.934.694,81 |
| 2024 | municipio | 117 | R$ 205.901.967,51 | R$ 198.470.735,22 | R$ 198.469.259,18 | R$ 4.516.337,50 |
| 2024 | estado | 73 | R$ 116.059.612,29 | R$ 69.476.028,36 | R$ 70.118.491,55 | R$ 29.481.050,44 |
| 2024 | multiplo | 88 | R$ 970.983.545,50 | R$ 899.052.577,00 | R$ 899.052.577,00 | R$ 60.108.925,89 |
| 2025 | municipio | 53 | R$ 112.685.943,86 | R$ 111.442.371,12 | R$ 111.442.371,12 | R$ 453.106,39 |
| 2025 | estado | 64 | R$ 109.985.639,67 | R$ 54.437.822,71 | R$ 53.933.458,83 | R$ 44.872.965,45 |
| 2025 | multiplo | 91 | R$ 1.209.247.234,71 | R$ 1.103.217.589,40 | R$ 1.102.396.367,41 | R$ 69.736.403,47 |
| 2026 | municipio | 30 | R$ 65.601.372,00 | R$ 58.332.365,00 | R$ 58.332.365,00 | R$ 0,00 |
| 2026 | estado | 61 | R$ 117.783.034,31 | R$ 64.462.759,65 | R$ 60.886.307,91 | R$ 0,00 |
| 2026 | multiplo | 87 | R$ 1.234.667.608,12 | R$ 1.104.727.722,93 | R$ 1.104.154.992,65 | R$ 0,00 |

### Parcela localizada em município

`records_linked / records_eligible` e `amount_located / amount_eligible` (MODELO-E-METRICAS).

| Ano | Linhas no município | % linhas | % empenhado | % pago |
| --- | ---: | ---: | ---: | ---: |
| 2020 | 191 de 354 | 54,0% | 16,9% | 15,9% |
| 2021 | 108 de 266 | 40,6% | 12,2% | 11,3% |
| 2022 | 126 de 263 | 47,9% | 14,6% | 12,7% |
| 2023 | 94 de 259 | 36,3% | 17,2% | 18,2% |
| 2024 | 117 de 278 | 42,1% | 15,9% | 17,0% |
| 2025 | 53 de 208 | 25,5% | 7,9% | 8,8% |
| 2026 | 30 de 178 | 16,9% | 4,6% | 4,8% |

### Fora do recorte, mas sem UF (pode incluir aplicação no Ceará)

Emendas com localidade nacional, regional ou exterior não podem ser atribuídas ao Ceará com este arquivo. O incremento 2 (documentos de despesa) traz a localidade de aplicação de cada pagamento.

| Ano | Localidade | Linhas | Pago |
| --- | --- | ---: | ---: |
| 2020 | exterior | 5 | R$ 2.277.497,26 |
| 2020 | nacional | 677 | R$ 3.224.400.654,40 |
| 2020 | regional | 32 | R$ 23.737.483,60 |
| 2021 | exterior | 19 | R$ 3.617.965,67 |
| 2021 | nacional | 372 | R$ 382.683.833,59 |
| 2021 | regional | 29 | R$ 3.941.434,30 |
| 2022 | exterior | 12 | R$ 2.084.632,07 |
| 2022 | nacional | 415 | R$ 141.235.776,19 |
| 2022 | regional | 28 | R$ 14.181.865,20 |
| 2023 | exterior | 7 | R$ 9.750.724,96 |
| 2023 | nacional | 510 | R$ 222.444.854,44 |
| 2023 | regional | 22 | R$ 27.977.106,26 |
| 2024 | exterior | 9 | R$ 3.010.984,81 |
| 2024 | nacional | 703 | R$ 197.784.545,09 |
| 2024 | regional | 30 | R$ 2.038.957,15 |
| 2025 | exterior | 7 | R$ 1.248.030,55 |
| 2025 | nacional | 692 | R$ 176.476.883,91 |
| 2025 | regional | 15 | R$ 12.328.082,71 |
| 2026 | exterior | 5 | R$ 1.899.336,86 |
| 2026 | nacional | 587 | R$ 220.782.288,58 |
| 2026 | regional | 25 | R$ 26.281.483,77 |

## 3. Exceções e qualidade

- Exceções de carga: nenhuma.
- Favorecidos com UF CE: 22.051 linhas · 6.691 mascaradas (PF/empresário individual) · 0 com município sem casamento no IBGE.

### Tipos de emenda no recorte (2020–2026)

| Tipo | Linhas | Emendas |
| --- | ---: | ---: |
| Emenda Individual - Transferências com Finalidade Definida | 1.461 | 1.461 |
| Emenda Individual - Transferências Especiais | 259 | 259 |
| Emenda de Bancada | 80 | 80 |
| Emenda de Relator | 4 | 4 |
| Emenda de Comissão | 2 | 2 |
