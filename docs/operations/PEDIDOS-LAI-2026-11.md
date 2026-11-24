# Pedidos de acesso à informação — casos sem causa (novembro de 2026)

Rascunhos dos pedidos para os 28 casos sem causa documentada que restaram depois da reabertura de 24/11/2026 (CHANGELOG 0.14.1). Cada pedido está pronto para colar no Fala.BR. Os valores e códigos vêm de `pipelines/contracts/investigacao_casos.json` e da API do Portal (consultas de 20 e 24/11/2026).

## Como enviar

1. Entrar em https://falabr.cgu.gov.br com a conta gov.br e escolher **Acesso à Informação**.
2. Escolher o órgão indicado em cada pedido, colar o assunto e o texto, e enviar.
3. Anotar o número do protocolo e a data na tabela de acompanhamento abaixo. Os dados de quem pede ficam só no Fala.BR, nunca neste repositório.
4. Prazo legal (Lei 12.527/2011, art. 11): 20 dias corridos, prorrogáveis por mais 10 com justificativa. Sem resposta no prazo, cabe recurso no próprio Fala.BR.
5. Quando a resposta chegar, ela entra no registro do caso (achado, causa e fonte), passa por revisão humana e vai ao ar no deploy seguinte (`operations/ATUALIZACAO-DADOS.md`, fora do ciclo).

Ordem sugerida: CGU primeiro (pedidos 1 e 2). A CGU publica os totais do Portal, então a resposta dela pode fechar sozinha 22 casos. Os pedidos 3 a 8 vão aos órgãos que executaram a despesa e cobrem as maiores quantias. Sem resposta da CGU, eles fecham os mesmos casos por outro caminho.

Fora dos pedidos: **202644130007** (IPHAN, emenda de 2026 em execução). As faturas de passagens ainda não têm ordem bancária ligada; o caso volta a ser conferido na próxima atualização dos dados.

## Acompanhamento

| Pedido | Órgão no Fala.BR | Casos | Enviado em | Protocolo | Prazo | Resposta |
|---|---|---:|---|---|---|---|
| 1 | Controladoria-Geral da União (CGU) | 7 | | | | |
| 2 | Controladoria-Geral da União (CGU) | 15 | | | | |
| 3 | Ministério da Saúde (Fundo Nacional de Saúde) | 4 | | | | |
| 4 | Comando do Exército | 2 | | | | |
| 5 | Ministério do Desenvolvimento e Assistência Social, Família e Combate à Fome (Fundo Nacional de Assistência Social) | 1 | | | | |
| 6 | Ministério da Pesca e Aquicultura | 1 | | | | |
| 7 | Ministério do Turismo | 3 | | | | |
| 8 | Ministério da Cultura | 1 | | | | |

Casos que aparecem em dois pedidos (CGU e órgão executor): 202120830016, 202171070011, 202227010001, 202141380014, 202140550003, 202141470003 e 202020830007.

---

## Pedido 1 — CGU: empenhos contados na emenda sem documento

**Órgão:** Controladoria-Geral da União (CGU)

**Assunto:** Emendas parlamentares — empenhos que compõem o valor empenhado publicado no Portal da Transparência

**Texto:**

> Com base na Lei nº 12.527/2011, solicito informações sobre a composição dos valores publicados no Portal da Transparência (página de emendas parlamentares e API de dados, endpoint /emendas) para as sete emendas abaixo.
>
> Em cada uma, o valor empenhado publicado é maior que a soma das notas de empenho listadas nos "documentos relacionados" da emenda e no arquivo "Emendas Parlamentares por Documento" disponível para download. A diferença também aparece como valor pago ou restos a pagar pagos sem documento de pagamento correspondente.
>
> | Código da emenda | Empenhado publicado | Soma dos empenhos listados | Diferença |
> |---|---:|---:|---:|
> | 202120830016 | R$ 1.139.301,00 | R$ 889.717,00 | R$ 249.584,00 |
> | 202171070011 | R$ 94.243.547,00 | R$ 93.841.723,00 | R$ 401.824,00 |
> | 202227010001 | R$ 269.896,00 | R$ 133.400,00 | R$ 136.496,00 |
> | 202141380014 | R$ 1.250.000,00 | R$ 1.199.269,00 | R$ 50.731,00 |
> | 202140550003 | R$ 679.986,00 | R$ 655.509,00 | R$ 24.477,00 |
> | 202141470003 | R$ 250.000,00 | R$ 240.161,00 | R$ 9.839,00 |
> | 202120830003 | R$ 100.000,00 | R$ 96.261,00 | R$ 3.739,00 |
>
> Solicito, para cada emenda:
>
> 1. o número completo da(s) nota(s) de empenho (unidade gestora, gestão, ano e número) que compõe(m) a diferença;
> 2. os documentos de pagamento (ordem bancária, DF, DR ou GP) que quitaram esses empenhos, com data e valor;
> 3. o motivo de esses documentos não aparecerem entre os documentos relacionados da emenda nem no arquivo por documento.
>
> Peço a resposta em formato eletrônico (planilha ou texto).

---

## Pedido 2 — CGU: composição do valor pago por empenho

**Órgão:** Controladoria-Geral da União (CGU)

**Assunto:** Emendas parlamentares — valor pago e restos a pagar pagos por nota de empenho

**Texto:**

> Com base na Lei nº 12.527/2011, solicito informações sobre a composição dos valores "pago" e "restos a pagar pagos" publicados no Portal da Transparência (página de emendas parlamentares e API de dados, endpoint /emendas) para as quinze emendas abaixo.
>
> Em cada uma, a soma dos documentos de pagamento (ordens bancárias, DF, DR e GP) listados nos "documentos relacionados" da emenda e no arquivo "Emendas Parlamentares por Documento" difere do total publicado. Em alguns casos, o arquivo atribui à emenda só uma parcela de ordens bancárias que pagam vários empenhos.
>
> | Código da emenda | Pago publicado | Restos a pagar pagos publicados | Soma dos documentos de pagamento | Diferença (documentos − publicado) |
> |---|---:|---:|---:|---:|
> | 202041470012 | R$ 233.466,14 | R$ 0,00 | R$ 236.724,03 | R$ 3.257,89 |
> | 202220830004 | R$ 90.309,54 | R$ 8.357,74 | R$ 101.896,12 | R$ 3.228,84 |
> | 202424410006 | R$ 224.447,88 | R$ 3.453,04 | R$ 232.260,91 | R$ 4.359,99 |
> | 202671070006 | R$ 36.598,25 | R$ 0,00 | R$ 36.698,19 | R$ 99,94 |
> | 202424410010 | R$ 27.381,31 | R$ 727.995,23 | R$ 755.151,08 | −R$ 225,46 |
> | 202471070014 | R$ 0,00 | R$ 2.423.398,20 | R$ 2.415.538,56 | −R$ 7.859,64 |
> | 202471070009 | R$ 1.380.809,18 | R$ 2.306.648,14 | R$ 3.627.574,74 | −R$ 59.882,58 |
> | 202471070016 | R$ 377.679,75 | R$ 3.713.550,35 | R$ 4.083.526,70 | −R$ 7.703,40 |
> | 202020830007 | R$ 1.257.428,00 | R$ 656.451,54 | R$ 1.824.701,56 | −R$ 89.177,98 |
> | 202371070006 | R$ 1.798.908,09 | R$ 678.235,98 | R$ 2.488.430,87 | R$ 11.286,80 |
> | 202071070007 | R$ 0,00 | R$ 1.834.213,34 | R$ 1.828.506,19 | −R$ 5.707,15 |
> | 202571070007 | R$ 1.826,12 | R$ 7.344.851,05 | R$ 7.327.181,31 | −R$ 19.495,86 |
> | 202140550002 | R$ 46.239,63 | R$ 52.201,11 | R$ 98.436,06 | −R$ 4,68 |
> | 202141380016 | R$ 58.915,35 | R$ 191.056,42 | R$ 246.430,18 | −R$ 3.541,59 |
> | 202571070006 | R$ 0,00 | R$ 2.802.920,34 | R$ 2.798.909,34 | −R$ 4.011,00 |
>
> Solicito, para cada emenda:
>
> 1. o valor pago e o valor de restos a pagar pagos de cada nota de empenho que compõe os totais publicados, por exercício;
> 2. o critério usado para atribuir à emenda a parcela de uma ordem bancária que paga mais de um empenho ou mais de uma emenda;
> 3. se houve devolução ou cancelamento de ordens bancárias que reduziu o valor pago publicado e não aparece entre os documentos relacionados (por exemplo, nas emendas 202041470012, 202220830004 e 202424410006, em que os documentos somam mais que o publicado).
>
> Peço a resposta em formato eletrônico (planilha ou texto).

---

## Pedido 3 — Fundo Nacional de Saúde

**Órgão:** Ministério da Saúde

**Assunto:** Fundo Nacional de Saúde — empenhos e pagamentos de quatro emendas parlamentares

**Texto:**

> Com base na Lei nº 12.527/2011, solicito ao Fundo Nacional de Saúde (UG 257001) informações sobre a execução de quatro emendas parlamentares. Em cada caso, o Portal da Transparência publica um valor pago ou de restos a pagar pagos que não corresponde aos documentos de pagamento ligados à emenda.
>
> 1. **Emenda 202120830016.** O empenhado publicado é de R$ 1.139.301,00, mas as sete notas de empenho ligadas à emenda somam R$ 889.717,00. Solicito o número da nota de empenho de R$ 249.584,00 que completa esse valor e a(s) ordem(ns) bancária(s) que a pagaram, com data e valor.
> 2. **Emenda 202171070011.** O empenhado publicado é de R$ 94.243.547,00, mas as 140 notas de empenho ligadas à emenda somam R$ 93.841.723,00. Solicito o número da nota de empenho de R$ 401.824,00 inscrita em restos a pagar e a(s) ordem(ns) bancária(s) que a pagaram, com data e valor.
> 3. **Emenda 202171070001.** Os restos a pagar pagos publicados somam R$ 7.454.455,88, e as ordens bancárias ligadas à emenda, R$ 7.254.480,88. Solicito os restos a pagar pagos por nota de empenho desta emenda, para localizar os R$ 199.975,00 restantes.
> 4. **Emenda 202020830007.** Solicito (a) se o empenho 257001000012020NE820540 (R$ 100.000,00) foi pago, com o número, a data e o valor das ordens bancárias; e (b) como as ordens bancárias 257001000012021OB815806 (R$ 131.740,00) e 257001000012022OB804049 (R$ 2.859,56) se dividem entre os empenhos 2020NE814011 e 2020NE814012.
>
> Peço a resposta em formato eletrônico (planilha ou texto).

---

## Pedido 4 — Comando do Exército

**Órgão:** Comando do Exército

**Assunto:** Pagamentos de duas emendas parlamentares (Colégio Militar de Fortaleza e Centro de Obtenções do Exército)

**Texto:**

> Com base na Lei nº 12.527/2011, solicito informações sobre a execução de duas emendas parlamentares.
>
> 1. **Emenda 202227010001.** O Portal da Transparência publica empenhado e restos a pagar pagos de R$ 269.896,00. A única nota de empenho ligada à emenda é a 160046000012022NE000282 (Colégio Militar de Fortaleza, R$ 133.400,00). Solicito o número da nota de empenho de R$ 136.496,00 que completa esse valor (possivelmente em outra unidade que recebeu crédito da emenda) e os documentos de pagamento correspondentes, com data e valor.
> 2. **Emenda 202127010004.** O empenho 160069000012021NE000438 (Centro de Obtenções do Exército, aquisição de viatura tipo ambulância, R$ 191.000,00) foi liquidado pela nota 160069000012021NS008756 (14/12/2021, NF 283475, contrato 065/2021) e inscrito em restos a pagar processados. Solicito o número, a data e o valor da ordem bancária que pagou a NF 283475.
>
> Peço a resposta em formato eletrônico (planilha ou texto).

---

## Pedido 5 — Fundo Nacional de Assistência Social

**Órgão:** Ministério do Desenvolvimento e Assistência Social, Família e Combate à Fome

**Assunto:** Fundo Nacional de Assistência Social — pagamento de seis programações SIGTV de 2021 (emenda 202141380007)

**Texto:**

> Com base na Lei nº 12.527/2011, solicito ao Fundo Nacional de Assistência Social (UG 330013) informações sobre o pagamento de seis empenhos de 2021 da emenda parlamentar 202141380007, de R$ 100.000,00 cada, inscritos em restos a pagar.
>
> Os empenhos são 330013000012021NE402747, NE403218, NE403332, NE404370, NE404392 e NE405769. Cada um tem nota de sistema de 17/02/2022 (2022NS001701 a NS001706) de "pagamento da programação SIGTV", referente às programações 230765020210001, 230440020210003, 230830220210001, 230410320210001, 230523320210001 e 230440020210004. O Portal da Transparência conta esses valores como restos a pagar pagos, mas não há ordem bancária ligada a eles.
>
> Solicito, para cada programação: o número, a data e o valor da ordem bancária que efetuou o repasse ao fundo municipal de assistência social; ou, se o repasse não foi feito, a situação atual do empenho.
>
> Peço a resposta em formato eletrônico (planilha ou texto).

---

## Pedido 6 — Ministério da Pesca e Aquicultura

**Órgão:** Ministério da Pesca e Aquicultura. Em 2021 a Secretaria de Aquicultura e Pesca (UG 130145) era unidade do Ministério da Agricultura; se o Fala.BR indicar, enviar ao Ministério da Agricultura e Pecuária.

**Assunto:** Pagamento do empenho 130145000012021NE000004 (emenda 202137330004)

**Texto:**

> Com base na Lei nº 12.527/2011, solicito informações sobre a execução do empenho 130145000012021NE000004 (Secretaria de Aquicultura e Pesca, R$ 500.000,00, realização do censo da carcinicultura da região leste do Ceará), da emenda parlamentar 202137330004.
>
> O Portal da Transparência publica R$ 500.000,00 de restos a pagar pagos para a emenda, mas os únicos documentos ligados ao empenho são as notas 130145000012021NS000613 (inscrição em restos a pagar) e 130145000012022NS000024 (04/02/2022); não há ordem bancária.
>
> Solicito:
>
> 1. o número do instrumento de repasse (termo de fomento, convênio ou outro) firmado com a entidade beneficiária;
> 2. o número, a data e o valor da(s) ordem(ns) bancária(s) que pagaram o empenho;
> 3. a situação atual do instrumento (execução e prestação de contas).
>
> Peço a resposta em formato eletrônico (planilha ou texto).

---

## Pedido 7 — Ministério do Turismo

**Órgão:** Ministério do Turismo

**Assunto:** Empenhos de três emendas parlamentares de 2021 sem nota de empenho ligada (UG 540007)

**Texto:**

> Com base na Lei nº 12.527/2011, solicito informações sobre três emendas parlamentares de 2021 executadas pelo Ministério do Turismo por contrato de repasse. Em cada uma, o valor empenhado publicado no Portal da Transparência é maior que a soma das notas de empenho de transferência ligadas à emenda (UG 540007):
>
> | Emenda | Empenhado publicado | Empenhos de transferência ligados | Diferença |
> |---|---:|---:|---:|
> | 202141380014 | R$ 1.250.000,00 | R$ 1.199.269,00 (2021NE000082 e 2021NE000116) | R$ 50.731,00 |
> | 202140550003 | R$ 679.986,00 | R$ 655.509,00 (2021NE000044) | R$ 24.477,00 |
> | 202141470003 | R$ 250.000,00 | R$ 240.161,00 (2021NE000109) | R$ 9.839,00 |
>
> Solicito, para cada emenda:
>
> 1. o número da nota de empenho que compõe a diferença e a unidade gestora que a emitiu;
> 2. a natureza da despesa (por exemplo, tarifa de serviço da mandatária do contrato de repasse);
> 3. o número, a data e o valor das ordens bancárias que a pagaram.
>
> Peço a resposta em formato eletrônico (planilha ou texto).

---

## Pedido 8 — Ministério da Cultura

**Órgão:** Ministério da Cultura

**Assunto:** Rateio da ordem bancária de tarifas 420044000012026OB000007 (emenda 202541380021)

**Texto:**

> Com base na Lei nº 12.527/2011, solicito informações sobre a ordem bancária 420044000012026OB000007 (19/03/2026, R$ 55.423,74), referente a tarifas de dezembro de 2025 do contrato com a Caixa Econômica Federal, emitida sem empenho relacionado no Portal da Transparência.
>
> Solicito o rateio dessa ordem bancária por nota de empenho, em especial o valor pago para o empenho 420044000012025NE000013. O Portal publica R$ 1.559,46 de restos a pagar pagos para a emenda 202541380021 sem documento de pagamento ligado.
>
> Peço a resposta em formato eletrônico (planilha ou texto).
