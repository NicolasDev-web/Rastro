# Inventário — CGU emendas parlamentares (snapshot ed93842c)

> Gerado por `python pipelines/run.py profile`. Não editar à mão.

- **Arquivo:** `raw_data/cgu/emendas/2026-11-19_ed93842c_EmendasParlamentares.zip` · 47.219.552 bytes · SHA-256 `ed93842cb8663ad074b23162e6355f5358c450971b8d85b4bec106a778056917`
- **Origem:** https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares/UNICO → https://dadosabertos-download.cgu.gov.br/PortalDaTransparencia/saida/emendas-parlamentares/EmendasParlamentares.zip
- **Baixado em:** 2026-11-19T18:37:39+00:00 · Last-Modified da fonte: Thu, 19 Nov 2026 00:51:30 GMT
- **Contrato:** `pipelines/contracts/cgu_emendas.json` versão 2026-11-19 · encoding cp1252 · separador `;`
- **Resultado do contrato:** OK

## Arquivos do ZIP

| Arquivo | Papel | Linhas | Linhas CE |
| --- | --- | ---: | ---: |
| EmendasParlamentares.csv | load | 94.948 | 3.526 |
| EmendasParlamentares_Convenios.csv | load | 85.865 | — |
| EmendasParlamentares_Parcerias.csv | profile_only | 86.463 | 2.918 |
| EmendasParlamentares_PlanodeTrabalhoParcerias.csv | profile_only | 355.006 | 21.237 |
| EmendasParlamentares_PlanodeTrabalhoTransferenciasEspeciais.csv | profile_only | 58.990 | 1.484 |
| EmendasParlamentares_PorFavorecido.csv | load | 836.221 | 22.051 |

### Divergências conhecidas em relação ao dicionário oficial

- EmendasParlamentares.csv: coluna "Possui Apoiador/Solicitante? " (com espaço final) não consta do dicionário.
- EmendasParlamentares.csv: "Localidade do Gasto" do dicionário aparece como "Localidade de aplicação do recurso".
- EmendasParlamentares_Parcerias.csv, _PlanodeTrabalhoParcerias.csv e _PlanodeTrabalhoTransferenciasEspeciais.csv não constam do dicionário: apenas inventariados.

## EmendasParlamentares.csv

### Linhas por ano da emenda

| Ano | Linhas |
| --- | ---: |
| 2014 | 11.155 |
| 2015 | 3.714 |
| 2016 | 8.051 |
| 2017 | 9.633 |
| 2018 | 7.230 |
| 2019 | 8.476 |
| 2020 | 8.621 |
| 2021 | 6.595 |
| 2022 | 6.108 |
| 2023 | 6.110 |
| 2024 | 6.990 |
| 2025 | 6.310 |
| 2026 | 5.955 |

### Tipos de emenda

| Tipo | Linhas |
| --- | ---: |
| Emenda Individual - Transferências com Finalidade Definida | 80.169 |
| Emenda Individual - Transferências Especiais | 5.108 |
| Emenda de Relator | 3.892 |
| Emenda de Bancada | 3.589 |
| Emenda de Comissão | 2.190 |

### Escopo territorial (regra da SPEC 01)

| Escopo | Linhas |
| --- | ---: |
| fora_do_recorte:outra_uf | 85.694 |
| fora_do_recorte:nacional | 5.399 |
| municipio | 1.852 |
| multiplo | 1.033 |
| estado | 641 |
| fora_do_recorte:regional | 258 |
| fora_do_recorte:exterior | 71 |

### Granularidade

- Códigos com mais de uma linha: 58 (máximo de 2 linhas por código).
- Linhas sem código oficial de emenda, por ano: 2014: 11.155, 2015: 3, 2016: 1.938, 2017: 4.074, 2018: 66, 2019: 333, 2020: 241.
- "Possui Apoiador/Solicitante?": Não se aplica: 88.866, Não: 5.780, Sim: 302.

## Favorecidos com UF CE

| Tipo | Linhas |
| --- | ---: |
| Pessoa Jurídica | 15.293 |
| mascarados (PF ou empresário individual) | 6.691 |
| Unidade Gestora | 67 |

Pessoas físicas e empresários individuais são mascarados em todos os artefatos derivados (SPEC 01, AC09).

## Perguntas em aberto para a conferência amostral

- Relação entre "Valor Pago" e "Valor Restos A Pagar Pagos": métricas exibidas separadamente, sem soma, até confirmação.
- "Valor Restos A Pagar Inscritos" menor que "RAP Pagos" em alguns anos: entender se é saldo atual ou valor inscrito no ano.
