# Emendas estaduais do Ceará — cobertura e ligações (2026-11-21-f679f3bb)

Gerado por `python pipelines/run.py estaduais` (SPEC 07). Só o lado do orçamento; sem execução.

## Arquivos

| Ano | SHA-256 | Baixado em | Last-Modified | Bytes |
| --- | --- | --- | --- | --- |
| 2023 | `4f0231a7cc69fe81…` | 2026-11-21T19:03:23+00:00 | Fri, 02 Oct 2026 12:33:14 GMT | 15.203 |
| 2024 | `c759049043f99452…` | 2026-11-21T19:03:23+00:00 | Fri, 02 Oct 2026 12:33:15 GMT | 52.068 |
| 2025 | `637b8bb91867b0d0…` | 2026-11-21T19:03:24+00:00 | Fri, 02 Oct 2026 12:33:16 GMT | 31.125 |
| 2026 | `1167d6a760d8995e…` | 2026-11-21T19:03:25+00:00 | Fri, 02 Oct 2026 12:33:16 GMT | 23.301 |

## Cobertura por ano

| Ano | Linhas | Parlamentares | Ligados à Alece | Linhas c/ município | Ambíguas | Não resolvidas | Sem município | Valor emenda | Valor lei | Valor lei créditos |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2023 | 25 | 12 | 11 | 24 | 0 | 0 | 1 | R$ 10.050.000,00 | R$ 10.050.000,00 | R$ 6.110.000,00 |
| 2024 | 83 | 35 | 31 | 73 | 0 | 0 | 10 | R$ 17.775.000,00 | R$ 17.775.000,00 | R$ 22.725.000,00 |
| 2025 | 50 | 27 | 23 | 43 | 0 | 1 | 6 | R$ 17.121.700,00 | R$ 17.121.700,00 | R$ 21.671.700,00 |
| 2026 | 37 | 23 | 23 | 36 | 0 | 1 | 0 | R$ 19.470.000,00 | R$ 19.470.000,00 | R$ 19.370.000,00 |

As três colunas de valor são diferentes entre si e não se somam. Beneficiários: o CSV não tem essa coluna.

## Limitações

- Poucas linhas por ano (2023: 25, 2024: 83, 2025: 50, 2026: 37). Todas têm caráter PCF e tipo INDIVIDUAL. A imprensa cita cerca de R$ 76 milhões por ano no PCF, e a LOA 2026 acolheu 521 emendas de deputados. O arquivo não cobre todas as emendas estaduais, e a CGE-CE ainda não explicou o recorte.
- O CSV mostra só o orçamento. Empenho, pagamento, beneficiário e Nº SACC ficam fora, porque só aparecem nas fichas da página (montadas por JavaScript).
- O dicionário de dados publicado não descreve as colunas do CSV. O sentido de "Valor emenda", "Valor lei" e "Valor lei créditos" vem só do nome da coluna.
- Há linhas com "Valor emenda" e "Valor lei" iguais a 0 e "Valor lei créditos" positivo. O arquivo não explica por quê.
- A lista de deputados é a da Alece baixada em 19/11/2026. Ex-deputados e nomes grafados de outro jeito ficam sem ligação.
- Não há arquivos anteriores a 2023 (2016–2022 dão erro 404).

## Linhas sem ligação a município (revisão humana)

| Ano | Código | Situação | Ação (texto da fonte) | Motivo |
| --- | --- | --- | --- | --- |
| 2023 | 176 | sem_municipio | Custeio de ações e serviços na área de saúde para Associação Beneficente Médica de Pajuçara - ABEMP | nenhum nome de município IBGE no texto |
| 2024 | 1037 | sem_municipio | Contribuição para melhoria da assistência hospitalar e ambulatorial. | nenhum nome de município IBGE no texto |
| 2024 | 1038 | sem_municipio | Contribuição para melhoria da assistência hospitalar e ambulatorial. | nenhum nome de município IBGE no texto |
| 2024 | 1039 | sem_municipio | Contribuição para melhoria na atenção básica | nenhum nome de município IBGE no texto |
| 2024 | 1041 | sem_municipio | Contribuição para melhoria na atenção básica | nenhum nome de município IBGE no texto |
| 2024 | 1042 | sem_municipio | Contribuição para melhoria da assistência hospitalar e ambulatorial. | nenhum nome de município IBGE no texto |
| 2024 | 1043 | sem_municipio | Contribuição para melhoria da assistência hospitalar e ambulatorial. | nenhum nome de município IBGE no texto |
| 2024 | 1044 | sem_municipio | Contribuição para melhoria da assistência hospitalar e ambulatorial. | nenhum nome de município IBGE no texto |
| 2024 | 1045 | sem_municipio | Contribuição para melhoria da assistência hospitalar e ambulatorial. | nenhum nome de município IBGE no texto |
| 2024 | 1046 | sem_municipio | Contribuição para melhoria da assistência hospitalar e ambulatorial. | nenhum nome de município IBGE no texto |
| 2024 | 1047 | sem_municipio | Contribuição para melhoria da assistência hospitalar e ambulatorial. | nenhum nome de município IBGE no texto |
| 2025 | 347 | nao_resolvida | Aquisição de 01 ambulância para o município de Tabuleiro | o texto cita "município", mas o que vem depois não é um nome IBGE exato |
| 2025 | 784 | sem_municipio | Contribuição para melhoria da assistência hospitalar e ambulatorial. | nenhum nome de município IBGE no texto |
| 2025 | 785 | sem_municipio | Contribuição para melhoria da assistência hospitalar e ambulatorial. | nenhum nome de município IBGE no texto |
| 2025 | 787 | sem_municipio | Contribuição para melhoria da assistência hospitalar e ambulatorial. | nenhum nome de município IBGE no texto |
| 2025 | 788 | sem_municipio | Contribuição para melhoria da assistência hospitalar e ambulatorial. | nenhum nome de município IBGE no texto |
| 2025 | 789 | sem_municipio | Contribuição para melhoria da assistência hospitalar e ambulatorial. | nenhum nome de município IBGE no texto |
| 2025 | 790 | sem_municipio | Contribuição para melhoria da assistência hospitalar e ambulatorial. | nenhum nome de município IBGE no texto |
| 2026 | 200 | nao_resolvida | Aquisição de Ambulância Para Atender a Demanda do Município de Santana de Acaraú | o texto cita "município", mas o que vem depois não é um nome IBGE exato |

## Parlamentares sem ligação à lista da Alece

| Nome na fonte | Anos | Motivo |
| --- | --- | --- |
| APÓSTOLO LUIZ HENRIQUE | 2025 | nome sem correspondência exata na lista atual da Alece (pode ser ex-deputado ou grafia diferente) |
| EVANDRO LEITÃO | 2024, 2025 | nome sem correspondência exata na lista atual da Alece (pode ser ex-deputado ou grafia diferente) |
| FELIPE AGUIAR | 2024 | nome sem correspondência exata na lista atual da Alece (pode ser ex-deputado ou grafia diferente) |
| GABRIELLA AGUIAR | 2024 | nome sem correspondência exata na lista atual da Alece (pode ser ex-deputado ou grafia diferente) |
| GEORGE LIMA | 2023 | nome sem correspondência exata na lista atual da Alece (pode ser ex-deputado ou grafia diferente) |
| MARTINHA BRANDÃO | 2025 | nome sem correspondência exata na lista atual da Alece (pode ser ex-deputado ou grafia diferente) |
| NIZO COSTA | 2024 | nome sem correspondência exata na lista atual da Alece (pode ser ex-deputado ou grafia diferente) |
| PEDRO LOBO | 2025 | nome sem correspondência exata na lista atual da Alece (pode ser ex-deputado ou grafia diferente) |

Nenhuma ligação foi feita por nome aproximado. Grafias parecidas (por exemplo, abreviações) ficam aqui para revisão.
