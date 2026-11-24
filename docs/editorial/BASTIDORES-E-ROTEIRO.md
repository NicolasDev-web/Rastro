# RASTRO: bastidores e roteiro do vídeo

> Documento do criador do projeto. Versão de 20/11/2026, snapshot `ed93842c` (arquivo da CGU extraído em 19/11/2026).
> O RASTRO é uma **investigação cidadã independente**. Não é um veículo de imprensa e não passa por aprovação editorial externa. Os números vêm de fontes oficiais e podem conter erros de extração ou de interpretação. Correções: página `/correcoes` do site ou nicolasxavier445@gmail.com.

---

## 1. Para que serve este documento

O RASTRO organiza os dados públicos das **emendas parlamentares federais destinadas ao Ceará, de 2020 a 2026**, e mostra a qualquer pessoa o caminho registrado do dinheiro: quanto foi reservado (empenhado), quanto teve a entrega atestada (liquidado) e quanto saiu do caixa federal (pago), município por município, emenda por emenda.

Este documento tem duas funções:

1. **Registro de bastidores.** Conta como o projeto foi construído, quais decisões foram tomadas sobre os dados e quais problemas apareceram no caminho. Serve para quem quiser auditar, refazer ou continuar o trabalho.
2. **Roteiro de vídeo.** A seção 9 traz um texto pronto para gravar: um vídeo explicativo de 8 a 12 minutos, em primeira pessoa, sobre o que o RASTRO faz e sobre a investigação das 84 emendas cujos números não fechavam entre duas fontes oficiais.

Uma regra atravessa tudo o que está escrito aqui: **diferença entre fontes não é prova de irregularidade, e ausência de documento não é prova de mau uso.** O RASTRO não acusa ninguém, não classifica políticos e não soma valores de etapas diferentes do gasto.

---

## 2. Linha do tempo

O projeto nasceu como um kit de implementação com um protótipo navegável alimentado por **dados fictícios declarados** (todos marcados como demonstração). Parte desse trabalho inicial foi feita com outro assistente de IA (ChatGPT/Codex). Depois, uma sessão com o Claude revisou o que existia, corrigiu problemas de integridade e levou o projeto até a publicação. Todo o trabalho seguiu o método de **desenvolvimento orientado por especificação (SDD)**: cada mudança começa por uma especificação ou por um registro de decisão (ADR), só depois vira código, e só é aceita com testes e evidências.

| Etapa | O que aconteceu | Versão |
|---|---|---|
| Protótipo | Identidade visual "Papel e tinta", com ilustrações desenhadas em código no lugar de fotos geradas por IA. Site inteiro em modo demonstração. | 0.2.x |
| Primeiros dados reais (19/11/2026) | Pipeline próprio baixa o "arquivo único" de emendas da CGU, guarda uma cópia imutável com impressão digital (SHA-256), confere o arquivo contra um contrato e carrega tudo em centavos. Site ganha um modo local "em validação", com aviso de "não publicar". | 0.3.0 |
| Autores (19/11/2026) | Listas oficiais da Câmara e do Senado; ligação dos autores da CGU aos parlamentares por nome exato, sempre com revisão humana. Lista dos 54 deputados estaduais da Alece, sem valores (não há fonte estruturada). | 0.3.1 |
| Documentos de despesa (19/11/2026) | Leitura de 3.610.312 documentos de despesa de 2020 a 2026 para conferir os totais de cada emenda. Conferência manual de uma amostra: 60 de 60 valores iguais ao Portal da Transparência. | 0.4.0 |
| Integridade | Revisão técnica: ausência deixa de virar zero, versões de arquivos não se somam duas vezes, os dados do site passam a ser um pacote fechado com hashes conferidos. A conciliação é refeita com regras mais rígidas. | 0.5.0–0.5.2 |
| Fila de investigação | Das emendas cujos números não fecham, sai uma fila de **84 casos** em ordem de trabalho. | 0.5.3 |
| Revisão dos autores | Os 43 vínculos de autores estão revisados por humano ("revisor do projeto"). | 0.5.4 |
| Decisão de natureza (20/11/2026) | O criador define o RASTRO como investigação cidadã independente. A Constituição do projeto e a ADR-015 são atualizadas. O site passa a avisar em todas as páginas que os dados podem conter erros e aponta o canal de correções. | 0.6.0 |
| Publicação (20/11/2026) | Site estático no ar: https://rastro-ruby.vercel.app, com 2.149 páginas. | 0.6.0 |
| Auditoria SENTINEL | Revisão de segurança e privacidade do repositório, do site e do próprio criador. | 0.6.1 |
| Investigação das 84 (20/11/2026) | Cada caso ganha registro com achado, causa (quando documentada), fontes e data. Resultado: 49 explicados, 35 sem causa documentada. Cada ficha mostra o bloco "O que a investigação encontrou". | 0.7.0 |

---

## 3. Como os dados foram obtidos

### A ideia central: guardar a cópia original

Dados públicos mudam. O Portal da Transparência atualiza seus arquivos todos os dias, e um número consultado hoje pode não ser o mesmo amanhã. Por isso o RASTRO não trabalha "ao vivo". Ele baixa o arquivo oficial, guarda uma **cópia exata e imutável** (um *snapshot*) e calcula a impressão digital desse arquivo, o SHA-256. Se um único caractere mudar, a impressão digital muda.

Assim, qualquer número do site pode ser refeito do zero a partir da mesma cópia. O snapshot usado no site publicado começa com `ed93842c` e foi extraído em **19/11/2026**. Toda linha tratada guarda a referência ao snapshot e à linha de origem.

### Quadro de fontes

| Fonte | O que traz | Como foi usada |
|---|---|---|
| CGU, Portal da Transparência: "arquivo único" de emendas | 94.948 linhas, de 2014 a 2026: código da emenda, autor, localidade, valores empenhado, liquidado, pago e restos a pagar | Base de todos os totais. Arquivo de 47,2 MB, snapshot `ed93842c` |
| CGU: documentos de despesa por emenda, um arquivo por ano (2020 a 2026) | 3.610.312 documentos (empenhos, liquidações, pagamentos), com data e valor | Conferir os totais de cada emenda e localizar onde os pagamentos foram aplicados. 64.250 documentos ligados ao recorte foram guardados |
| Portal da Transparência: API de dados | Consulta documento a documento | Investigação dos 84 casos, em 20/11/2026, com chave gratuita registrada pelo criador |
| Câmara dos Deputados e Senado Federal | Listas oficiais de parlamentares (56ª e 57ª legislaturas) e retratos oficiais | Ligar o autor da emenda ao parlamentar |
| Assembleia Legislativa do Ceará (Alece) | 54 deputados estaduais em exercício | Aba de autores, sem valores (não há fonte estruturada aberta das emendas estaduais) |
| IBGE | Códigos dos 184 municípios do Ceará | Decidir o que é Ceará pelo código, nunca pelo nome |

### O arquivo não é igual ao manual

O dicionário oficial da CGU não descreve exatamente o arquivo real. Uma coluna tem nome diferente, outra tem um espaço sobrando no fim do nome, e três dos seis arquivos do pacote nem constam do dicionário. O RASTRO escreveu um **contrato** que segue o arquivo real e registra cada divergência. Se um dia aparecer uma coluna nova, a carga para e nada é publicado até alguém entender o que mudou.

---

## 4. Como os dados foram tratados

Estas são as decisões que mais pesam no resultado. Cada uma está escrita na Constituição do projeto ou em uma ADR.

**Dinheiro em centavos inteiros.** Computadores erram em contas com casas decimais quando usam números "de ponto flutuante". Todo valor é guardado em centavos inteiros, e as comparações são exatas, sem tolerância.

**Ausência não é zero.** Quando a fonte não traz um valor, ele fica vazio (`null`) e aparece como "Sem registro". Zero só aparece quando a fonte diz zero. Uma soma com qualquer parcela ausente fica indisponível em vez de mostrar um total inventado. Os marcadores "Sem informação", "S/I" e "-99" também viram vazio.

**Etapas não se somam.** Empenhado, liquidado e pago são etapas diferentes do mesmo dinheiro. Somar as três seria contar o mesmo real três vezes. O site mostra cada etapa separada.

**Pago total = Pago + Restos a pagar pagos.** Isto parece uma exceção, mas não é. "Pago" e "RAP pagos" são a **mesma etapa (pagamento)** em momentos diferentes: o que foi pago no próprio ano e o que foi pago nos anos seguintes, como restos a pagar. A conferência com os documentos mostrou que essa soma bate ao centavo em 1.744 de 1.817 emendas comparáveis (96,0%). Mesmo assim, o RASTRO trata isso como uma convenção de trabalho, e não como regra comprovada para todos os casos.

**Ceará pelo código, não pelo nome.** O recorte usa o código IBGE da UF e dos municípios. Existe, por exemplo, um município chamado Ceará-Mirim, no Rio Grande do Norte. Pelo nome, ele entraria por engano.

**"Estado" não é Fortaleza.** Recursos registrados para o Ceará como um todo ("aplicação estadual") e recursos para "vários municípios" ficam em grupos próprios. Nunca são atribuídos à capital nem a qualquer cidade por conveniência. Isso pesa muito: entre 2020 e 2026, só algo entre cerca de 5% e 18% do valor pago por ano nas emendas com localidade no Ceará tem município identificado no arquivo por emenda.

**Dois critérios territoriais que não se somam.** O site oferece duas leituras:

- *Localidade da emenda*: o lugar registrado no arquivo principal.
- *Localidade de aplicação*: o município onde cada pagamento foi aplicado, segundo os documentos de despesa.

O segundo critério ajuda a localizar dinheiro de emendas registradas como "vários municípios". Nos dados de 19/11, 610 emendas desse tipo têm cerca de R$ 4,65 bilhões em documentos de pagamento com município de aplicação no Ceará. São duas leituras do mesmo dinheiro. Elas nunca são somadas, e a localidade de aplicação não prova onde a obra foi entregue.

**Autoria formal não é autoria coletiva.** Emendas individuais têm um autor formal. Emendas de bancada, de comissão e de relator são coletivas e não têm seus valores repartidos entre pessoas. Apoiador, autor e beneficiário são papéis diferentes.

**Vínculo de autores.** A CGU identifica o autor por um código do SIAFI e um nome. Câmara e Senado usam identificadores próprios. Não existe uma chave comum. A solução foi ligar por **nome normalizado exato** (sem acento, sem diferença de maiúsculas) e, depois, submeter cada ligação a revisão humana. Os **43 de 43 vínculos** foram revisados. Ligação por aproximação ("parece o mesmo nome") nunca é publicada sem revisão.

**Conferência amostral.** Antes de confiar no pipeline, 10 emendas sorteadas tiveram 6 medidas cada uma conferidas manualmente no Portal da Transparência: empenhado, liquidado, pago, restos a pagar inscritos, cancelados e pagos. Resultado: **60 de 60 valores iguais**. A planilha assinada é protegida: o programa nunca a sobrescreve.

**Conservação.** Os totais por ano, recorte e etapa foram calculados por dois caminhos independentes, direto do arquivo bruto e pelo banco de trabalho. As 38 combinações deram resultados idênticos ao centavo.

---

## 5. Os desafios

### 5.1 O mistério dos documentos que não fechavam (o coração da história)

**O problema.** A CGU publica dois tipos de arquivo. Um diz, para cada emenda, quanto foi pago no total. O outro lista os documentos de pagamento, um por um. Em tese, a soma dos documentos deveria dar o total. Na maioria das vezes dá: **1.744 de 1.817** emendas comparáveis fecham ao centavo. Mas sobraram exceções:

- **73 emendas** em que a soma dos documentos é diferente do total;
- **11 emendas** em que a fonte informa pagamento positivo, mas não existe **nenhum** documento de pagamento ligado a elas nos arquivos anuais.

Outras 82 emendas também não têm documento de pagamento, mas o total informado é zero, então não há o que conciliar.

**Por que importa.** Uma diferença entre duas fontes oficiais pode ter muitas explicações técnicas. Sem investigar, qualquer leitura seria especulação, e especular sobre dinheiro público é exatamente o que o RASTRO não quer fazer.

**O que fizemos.** As 84 emendas viraram uma fila de trabalho, em quatro grupos:

| Grupo | O que é | Casos |
|---|---|---:|
| 1 | Total positivo, mas nenhum documento de pagamento | 11 |
| 2 | Diferença de R$ 1 milhão ou mais | 4 |
| 3 | Diferença entre R$ 100 mil e R$ 1 milhão | 25 |
| 4 | Diferença menor que R$ 100 mil | 44 |

As faixas servem só para organizar o trabalho. Não são limite oficial de nada. E uma regra foi mantida do começo ao fim: **os valores de casos sem documento e os valores de diferenças calculadas nunca foram somados**, porque são coisas diferentes (um é um total informado pela fonte, o outro é uma diferença entre duas fontes).

Cada caso foi investigado nos arquivos brutos e, depois, na API de dados do Portal, documento por documento. Dois agentes de análise trabalharam em paralelo nos 73 casos de divergência, e as conclusões novas foram conferidas por amostragem diretamente na API antes da publicação. O resultado está na seção 6.

### 5.2 O site oficial bloqueia robôs

**O problema.** O site do Portal da Transparência exige verificação humana e bloqueia consultas automáticas.
**Por que importa.** Conferir 84 casos à mão, documento por documento, seria lento e sujeito a erro.
**O que fizemos.** Usamos o caminho oficial para máquinas: a **API de dados do Portal**, com uma chave gratuita registrada pelo criador. A chave fica só no computador local e nunca foi para o repositório.

### 5.3 Pastas que o próprio dono não conseguia abrir

**O problema.** Algumas pastas criadas pelo ambiente isolado do outro assistente de IA ficaram com permissões que a conta do próprio criador, no Windows, não conseguia ler.
**Por que importa.** O site precisa ler os dados para ser gerado.
**O que fizemos.** O site publicado lê uma **cópia congelada** dos dados (`data/publicado/`), gerada por um comando próprio e conferida pelo SHA-256 contra o pacote original. Se a cópia não bater, a publicação para.

### 5.4 A ferramenta de build tentava vasculhar essas pastas

**O problema.** A ferramenta que monta o site varria pastas do projeto e travava nas pastas ilegíveis.
**O que fizemos.** O caminho dos dados passou a ser informado no momento do build, e a ferramenta só olha onde precisa.

### 5.5 O limite de 5.000 arquivos por dia

**O problema.** O site tem 2.149 páginas, e cada página gera vários arquivos. O plano gratuito da Vercel limita a 5.000 o número de arquivos enviados por dia.
**O que fizemos.** O deploy passou a ser feito como **um único arquivo compactado**, que a Vercel descompacta do outro lado.

### 5.6 Revisão técnica: quando o "confere" estava otimista

**O problema.** Uma primeira versão da conciliação tratava algumas ausências como zero, comparava emendas que só tinham empenho como se fossem divergência de pagamento e, em pelo menos um caso, comparava só parte das linhas de uma emenda que atravessava mais de uma localidade.
**O que fizemos.** As regras foram reescritas (ADR-011 e ADR-012): ausência fica ausente, versões antigas de arquivos não se somam duas vezes, cada emenda é comparada pelo código inteiro, e só empenho não é divergência de pagamento. Os percentuais antigos foram substituídos pelos novos, e a mudança ficou registrada.

### 5.7 Privacidade do criador (auditoria SENTINEL)

Ver seção 7.

---

## 6. O que a investigação encontrou

### Os números

| | Casos |
|---|---:|
| Investigados | 84 |
| Com causa documentada ("explicados") | 49 |
| Sem causa documentada | 35 |

Por grupo:

| Grupo | Casos | Explicados | Sem causa documentada |
|---|---:|---:|---:|
| 1. Sem nenhum documento de pagamento | 11 | 10 | 1 |
| 2. Diferença ≥ R$ 1 milhão | 4 | 4 | 0 |
| 3. Diferença de R$ 100 mil a R$ 1 milhão | 25 | 14 | 11 |
| 4. Diferença < R$ 100 mil | 44 | 21 | 23 |

**Nenhum caso foi explicado por atualização do Portal depois de 19/11.** Ou seja: não era só questão de esperar o arquivo atualizar.

### As causas encontradas

| Causa | Casos | Em palavras simples |
|---|---:|---|
| Saldo do empenho transferido para outra unidade gestora (UG) | 36 | O dinheiro reservado "mudou de endereço" dentro do governo. Os pagamentos posteriores saíram pela unidade nova e não ficaram ligados ao código da emenda nos arquivos da CGU. |
| Documento de retenção com valor em dobro ou triplo | 6 | No arquivo por documento da CGU, algumas retenções de impostos aparecem com o valor multiplicado. Na API do Portal, o mesmo documento tem o valor correto. |
| Ordem bancária de 2026 sem vínculo com o empenho | 5 | O pagamento existe, mas foi emitido sem a ligação ao empenho e à emenda. Foi identificado pelo valor exato e pela descrição. |
| Devolução registrada como nota de sistema | 1 | Um pagamento foi devolvido e refeito. A soma dos documentos contou as duas ordens e não descontou a devolução. |
| Transferência de saldo entre unidades do Exército | 1 | Mesmo mecanismo da primeira linha, em outra estrutura. |

**A principal explicação: a reestruturação dos ministérios em 2023.** Em 2023, o governo federal reorganizou vários ministérios. Saldos de empenhos antigos foram transferidos para unidades novas: migração para o Ministério das Cidades, sub-rogação de empenhos, fusão e cisão de órgãos, a Portaria MAPA nº 609/2023 e empenhos de tarifa de serviço da Caixa. Cada transferência ficou registrada em uma **nota de sistema** oficial. Depois disso, o pagamento sai por um empenho novo, numa unidade nova, e não carrega mais o código da emenda original. Para quem soma os documentos pelo código da emenda, o pagamento "some". Ele não sumiu: mudou de endereço.

Esse mecanismo explica **10 dos 11 casos** do grupo 1, aqueles em que não havia nenhum documento de pagamento.

Uma ressalva honesta: nesses casos, a investigação documentou a transferência do saldo, mas **o valor pago pela unidade nova não foi conferido documento a documento**. A explicação é a transferência; a confirmação de cada ordem bancária no destino é um próximo passo.

**O erro de multiplicação no arquivo.** Em 6 casos, a diferença era de documentos de retenção de impostos (DF/DR) registrados com o dobro ou o triplo do valor no arquivo por documento da CGU. Exemplo verificado: um documento aparece com R$ 64.397,80 no arquivo e com R$ 32.198,90 na API do Portal. Descontado o excesso, a conta fecha ao centavo. É uma inconsistência do arquivo, não um pagamento a mais.

**Pagamentos de 2026 sem ligação.** Em 5 casos, ordens bancárias de março de 2026 pagam parcelas ligadas às emendas, com valor exato e descrição compatíveis, mas foram emitidas sem vínculo com o empenho. A explicação é **muito provável, mas não foi comprovada documento a documento**, e o site diz isso.

### O que ainda não sabemos

**28 casos continuam sem causa documentada** (eram 35; a reabertura de 24/11/2026 explicou 7). Isso não significa que exista problema. Significa que os documentos consultados até agora não explicam a diferença. Cada ficha mostra o que foi verificado e qual é o próximo passo: em geral, consultar o Transferegov ou pedir esclarecimento ao órgão responsável, inclusive pela Lei de Acesso à Informação.

O único caso do grupo 1 que segue sem explicação é curioso: o próprio Portal informa R$ 500 mil pagos como restos a pagar, sem documento de pagamento ligado à emenda ou ao empenho, e R$ 1 milhão de restos a pagar inscritos para um empenho de R$ 500 mil. Não há nota de transferência de saldo. O próximo passo é perguntar ao órgão.

### Como isso aparece no site

Cada uma das 84 fichas de emenda tem o bloco **"O que a investigação encontrou"**, com o achado (o que os dados mostram), a causa (só quando documentada), as fontes, a data da análise e o próximo passo. Um caso sem causa aparece como "Ainda sem explicação documentada", sem adjetivos.

---

## 7. Privacidade e segurança

### Privacidade de terceiros

- Favorecidos que são **pessoa física** ou **empresário individual (MEI)** aparecem como "[pessoa física — omitido]". Código e nome são mascarados em tudo o que é gerado a partir dos dados brutos: banco de trabalho, relatórios e site.
- **Nenhum CPF é publicado.** Os arquivos brutos ficam fora do repositório.
- Relatórios e registros de investigação não contêm nomes de favorecidos.

### Privacidade e segurança do próprio projeto (SENTINEL)

A auditoria de segurança e privacidade encontrou:

- **Nenhum segredo vazado.** A chave da API do Portal nunca foi para o repositório.
- **O e-mail pessoal do criador estava nos metadados dos commits** de um repositório público, e o nome dele aparecia em arquivos do projeto. O nome foi trocado por "revisor do projeto", e o histórico do Git foi reescrito para usar um e-mail neutro (noreply). O único contato público é o e-mail do projeto.
- **Cabeçalhos de segurança** no site: política de conteúdo (CSP), proteção contra o site ser embutido em outra página (anti-clickjacking) e outras proteções padrão.
- **Trava de publicação.** Antes de cada deploy, um verificador varre o site gerado e **recusa a publicação** se encontrar CPF (completo ou parcial), nome de MEI, e-mails além do contato oficial, caminhos de pastas locais, chaves de API ou mapas de código-fonte. Essa trava tem testes automáticos.

---

## 8. Limites e próximos passos

### Limites

- Os dados são de **um snapshot** (19/11/2026). O site não é atualizado em tempo real.
- **Pagamento comprova que o dinheiro saiu do caixa federal. Não comprova que a obra ou o serviço chegou à população.** O RASTRO não faz verificação de campo.
- Boa parte do valor está registrada como "vários municípios" ou "aplicação estadual" e não pode ser atribuída a uma cidade sem documento.
- O mapa do site é uma **ilustração esquemática**, não a malha oficial do IBGE.
- Não há fonte aberta e estruturada das emendas estaduais (Alece).
- "Pago total" é uma convenção de trabalho apoiada pelos dados, não uma regra oficial publicada.
- O registro de investigação tem um campo para revisão humana caso a caso que ainda está vazio nos 84 casos. A conferência foi feita por amostragem na API.
- Por ser uma iniciativa independente, sem redação por trás, **os dados podem conter erros**. Por isso existe o canal de correções.

### Próximos passos

1. Os **28 casos sem causa**: pedir esclarecimento aos órgãos e, quando necessário, usar a Lei de Acesso à Informação.
2. Conferir, nas unidades novas, as ordens bancárias dos casos explicados por transferência de saldo.
3. Reportar à CGU os documentos de retenção com valor multiplicado.
4. Camada de mapa com a malha oficial do IBGE.
5. Adaptador do **Transferegov** (convênios e transferências especiais).
6. Domínio próprio (o nome RASTRO ainda é provisório).

---

## 9. Roteiro do vídeo

**Formato:** explicativo investigativo, narrado em primeira pessoa pelo criador do projeto.
**Duração estimada:** cerca de 10 minutos (entre 9 e 11, conforme o ritmo de leitura).
**Imagens:** só capturas reais do site publicado (https://rastro-ruby.vercel.app) e das ilustrações do próprio site. Nada de imagem encenada, foto de político ou "documento" fabricado.
**Ritmo:** frases curtas. Pausa nos números. Nenhuma trilha de suspense exagerada.

### Cena 1. O dinheiro público tem um caminho (0:00–0:40)

**FALA**
> Todo ano, deputados e senadores indicam para onde vai uma parte do orçamento federal. São as emendas parlamentares.
> Esse dinheiro não chega de uma vez. Ele percorre um caminho. E esse caminho deixa rastros em documentos oficiais.
> Eu quis seguir esses rastros no Ceará, de 2020 a 2026.
> Em quase todos os casos, as contas fecham. Mas oitenta e quatro emendas tinham números que não batiam entre duas fontes oficiais.
> Este vídeo é sobre como eu investiguei essas oitenta e quatro. E sobre o que eu descobri.

**Tela:** home do site (`/`), com a manchete e a ilustração. Em seguida, a faixa de aviso no topo da página.
**Cuidado:** "não batiam" é sobre números entre fontes. Não usar "suspeitas", "irregulares" ou "desaparecidas".

### Cena 2. O que é o RASTRO (0:40–1:25)

**FALA**
> Eu sou o criador do RASTRO. É uma investigação cidadã independente.
> Não é um jornal. Não tem redação por trás. Sou eu, com dados públicos e um método.
> O RASTRO junta os dados oficiais das emendas federais destinadas ao Ceará e mostra isso de um jeito que qualquer pessoa consegue consultar. Por município, por emenda, por autor.
> Uma coisa precisa ficar clara desde o começo: os números vêm de fontes oficiais, mas podem ter erros de extração ou de interpretação. Se você encontrar um, existe um canal de correção. Eu mostro no final.

**Tela:** página `/sobre`; depois, rodapé com os links "Correções" e "Contato".
**Cuidado:** não chamar o projeto de "reportagem" nem de "veículo".

### Cena 3. Destinar não é pagar (1:25–2:30)

**FALA**
> Antes de qualquer número, três palavras.
> Primeiro, o empenho. É quando o governo reserva o dinheiro para uma despesa. É uma promessa de pagar.
> Depois, a liquidação. É quando alguém confere que o serviço foi feito ou que o bem foi entregue, e que existe o direito de receber.
> Por último, o pagamento. É quando o dinheiro sai, de fato, do caixa federal.
> Essas três etapas são momentos diferentes do mesmo dinheiro. Por isso, o RASTRO nunca soma empenhado, liquidado e pago. Seria contar o mesmo real três vezes.
> E tem mais um detalhe: o que não é pago no ano vira "resto a pagar" e pode ser pago nos anos seguintes.
> Uma frase resume tudo: destinar não é pagar. E pagar não é entregar.

**Tela:** `/investigacao`, trecho "Destinar não é pagar. Pagar não é entregar.", com a ilustração da escada de etapas. Em seguida, `/glossario`, abrindo os termos Empenho, Liquidação e Pagamento.
**Cuidado:** frisar que o pagamento comprova a saída do dinheiro, não a entrega da obra.

### Cena 4. De onde vêm os dados (2:30–3:30)

**FALA**
> Os dados vêm do Portal da Transparência, mantido pela Controladoria-Geral da União.
> Eu baixei o arquivo oficial de emendas e guardei uma cópia exata, do jeito que veio. A gente chama isso de snapshot.
> Essa cópia tem uma espécie de impressão digital. Se um único número mudar, a impressão digital muda. Assim, qualquer pessoa pode refazer as minhas contas a partir do mesmo arquivo.
> A cópia que está no site foi extraída no dia dezenove de novembro de dois mil e vinte e seis.
> Além do arquivo das emendas, eu usei mais de três milhões e seiscentos mil documentos de despesa, de 2020 a 2026, as listas oficiais da Câmara e do Senado e os códigos dos municípios do IBGE.
> E antes de confiar no meu programa, eu conferi à mão: sorteei dez emendas e comparei seis valores de cada uma com o Portal. Sessenta de sessenta bateram.

**Tela:** `/dados`, mostrando fonte, data de extração e identificação do snapshot (`ed93842c`).
**Cuidado:** manter a data do snapshot visível na tela durante a cena.

### Cena 5. O Ceará não é só Fortaleza (3:30–4:20)

**FALA**
> Uma armadilha comum é olhar para um valor "do Ceará" e achar que ele foi para a capital.
> Muito dinheiro é registrado para o estado inteiro, ou para vários municípios ao mesmo tempo, sem dizer quanto foi para cada um.
> No RASTRO, esses valores ficam separados. Eu não distribuo nada por estimativa. Atribuir esse dinheiro a uma cidade, por conveniência, seria desenhar um mapa falso.
> Mais um cuidado: eu decido o que é Ceará pelo código oficial do IBGE, não pelo nome. Existe um Ceará-Mirim no Rio Grande do Norte, e ele não entra na conta.

**Tela:** `/mapa`, mostrando o explorador e depois a tabela abaixo do mapa, com as colunas separadas. Alternar os botões "localidade da emenda" e "localidade de aplicação" sem mudar o ano.
**Cuidado:** dizer que o desenho do mapa é esquemático. Não somar os dois critérios na fala.

### Cena 6. Como ler uma ficha de emenda (4:20–5:10)

**FALA**
> Cada emenda tem uma ficha. Lá estão o código, o ano, a modalidade e os valores de cada etapa.
> Tem também o "pago total": o que foi pago no próprio ano somado ao que foi pago depois, como resto a pagar. É a mesma etapa, o pagamento, em anos diferentes.
> E aqui está o ponto central: a ficha compara esse total com a soma dos documentos de pagamento, um por um.
> Em mil setecentas e quarenta e quatro emendas comparáveis, as duas contas fecham no centavo. É noventa e seis por cento.
> O problema estava no resto.

**Tela:** uma ficha de emenda que confere (escolher qualquer emenda com selo de conferência), enquadrando a faixa de valores e a frase "Empenhado, liquidado e pago são etapas diferentes e não se somam".
**Cuidado:** enquadrar os valores, não o cabeçalho com o nome do autor. Não mostrar a tabela "Quem recebeu os pagamentos".

### Cena 7. O mistério: pagamentos sem documento (5:10–6:10)

**FALA**
> Em setenta e três emendas, a soma dos documentos era diferente do total informado.
> E em onze emendas acontecia algo mais estranho: o Portal dizia que houve pagamento, mas não existia nenhum documento de pagamento ligado a elas. Nenhum.
> Eu organizei tudo numa fila de oitenta e quatro casos. Primeiro, os onze sem documento. Depois, as diferenças maiores. Por fim, as menores.
> E aqui eu preciso ser claro: uma diferença entre duas fontes não é prova de nada errado. Pode ser atraso, pode ser erro de arquivo, pode ser uma regra de registro que a gente não conhece.
> A única forma honesta de saber é investigar caso por caso.

**Tela:** ficha de uma emenda do grupo 1 explicada, por exemplo `/emendas/202127000002`, enquadrando a frase "a fonte informa pagamento, mas os arquivos de documentos da CGU de 2020 a 2026 não trazem a ordem bancária desta emenda".
**Cuidado:** usar "mistério" só no sentido de pergunta sem resposta. Não dizer que o dinheiro "sumiu", foi "desviado" ou "evaporou".

### Cena 8. A investigação (6:10–7:00)

**FALA**
> Primeiro obstáculo: o site do Portal bloqueia robôs. Ele pede verificação humana.
> Então eu usei o caminho oficial para isso: a API de dados do próprio Portal, com uma chave gratuita.
> Com ela, dá para abrir cada empenho e ver todos os documentos relacionados, inclusive as notas de sistema, que são registros internos de ajustes.
> Eu usei inteligência artificial para analisar os casos em paralelo. Mas toda conclusão nova foi conferida por amostragem, direto na API, antes de ir para o site.

**Tela:** ficha `/emendas/202127000002`, rolando até o bloco "O que a investigação encontrou" e as fontes listadas.
**Cuidado:** não mostrar chave de API, terminal ou pastas do computador.

### Cena 9. A resposta: o dinheiro mudou de endereço (7:00–8:15)

**FALA**
> E a resposta para a maioria dos casos estava em 2023.
> Naquele ano, o governo federal reorganizou vários ministérios. E quando um ministério muda, o dinheiro que estava reservado para uma despesa também muda de lugar.
> O saldo do empenho antigo foi transferido para uma unidade nova. Por exemplo, para o Ministério das Cidades. Cada transferência ficou registrada numa nota de sistema oficial.
> Depois disso, o pagamento saiu pela unidade nova, com um empenho novo. E esse empenho novo não carrega mais o código da emenda original.
> Para quem procura pelo código da emenda, o pagamento parece não existir. Mas ele não sumiu. Ele mudou de endereço.
> Essa transferência de saldo explicou trinta e seis casos. Inclusive dez dos onze casos sem nenhum documento de pagamento.

**Tela:** o bloco "O que a investigação encontrou" de `/emendas/202127000002`, com o trecho "notas de sistema oficiais registram migração do saldo para o Ministério das Cidades". Opcional: ilustração de fluxo do site (`/fluxos`).
**Cuidado:** dizer em voz alta que, nesses casos, o pagamento feito pela unidade nova ainda não foi conferido documento a documento.

### Cena 10. As outras causas (8:15–9:00)

**FALA**
> Outras explicações apareceram.
> Em seis casos, o erro estava no próprio arquivo de documentos. Retenções de impostos apareciam com o valor em dobro ou em triplo. Um documento aparece com sessenta e quatro mil reais no arquivo, e com trinta e dois mil na API do Portal. Corrigido isso, a conta fecha no centavo.
> Em cinco casos, encontrei ordens bancárias de 2026 que pagam essas emendas, mas foram emitidas sem a ligação com o empenho. Achei pelo valor exato e pela descrição. É uma explicação muito provável, mas não está comprovada documento a documento. E o site diz isso.
> Teve ainda uma devolução que não foi descontada, e uma transferência de saldo entre unidades do Exército.
> No total, quarenta e nove dos oitenta e quatro casos têm causa documentada.

**Tela:** ficha `/emendas/202543730005` (retenção em dobro), bloco "O que a investigação encontrou"; depois a ficha `/emendas/202327000001` (ordem bancária de 2026), no mesmo bloco.
**Cuidado:** "erro no arquivo" refere-se a inconsistência de registro, não a pagamento a mais. Não mostrar o cabeçalho com autor nem a lista de favorecidos.

### Cena 11. O que eu ainda não sei (9:00–9:45)

**FALA**
> Trinta e cinco casos continuam sem causa documentada.
> Isso não quer dizer que exista problema. Quer dizer que os documentos que eu consultei até agora não explicam a diferença.
> Cada um desses casos está no site, com o que eu verifiquei e qual é o próximo passo. Na maioria, é perguntar ao órgão responsável, inclusive pela Lei de Acesso à Informação.
> E tem uma coisa importante: nenhum caso se resolveu só porque o Portal atualizou os dados depois. Não era questão de esperar.

**Tela:** ficha `/emendas/202137330004` (grupo 1, sem causa), bloco com "Ainda sem explicação documentada." e o próximo passo.
**Cuidado:** não especular sobre causas. Não nomear o autor nem o órgão na fala.

### Cena 12. Consulte, confira, corrija (9:45–10:30)

**FALA**
> Agora é com você.
> Entre no RASTRO, procure o seu município e veja quais emendas estão registradas para ele, em que etapa elas estão e de onde vem cada número.
> Se você encontrar um erro, me avise. A página de correções explica como. O contato é nicolasxavier445 arroba gmail ponto com.
> Os dados são públicos. O caminho do dinheiro também deveria ser.

**Tela:** `/mapa`, buscando um município pelo nome; abrir a ficha do município (por exemplo, `/municipios/2304400`, Fortaleza). Fechar em `/correcoes`, com o endereço do site na tela: rastro-ruby.vercel.app.
**Cuidado:** não convidar o público a enviar denúncias ou documentos sigilosos. O canal é para correções de dados.

### Checklist de gravação

- [ ] A data do snapshot (19/11/2026) e o código `ed93842c` aparecem na tela ao menos na cena 4 e na descrição do vídeo.
- [ ] O aviso "investigação cidadã independente, os dados podem conter erros" aparece falado (cena 2) e escrito (faixa do site ou legenda).
- [ ] Nenhum nome de pessoa física, favorecido ou MEI aparece na tela. Não gravar a tabela "Quem recebeu os pagamentos".
- [ ] Nas fichas dos 84 casos, enquadrar valores e o bloco da investigação, não o nome do autor.
- [ ] Nenhuma fala com "desvio", "corrupção", "fraude" ou "suspeito", e nenhuma afirmação de que dinheiro "sumiu" (a única ocorrência permitida é a negação da cena 9: "ele não sumiu, mudou de endereço").
- [ ] Nenhuma soma de empenhado, liquidado e pago na fala ou em legenda.
- [ ] Nenhum ranking de parlamentares. Se a página `/parlamentares` aparecer, mostrar só a busca, sem destacar ninguém.
- [ ] Sem terminal, chave de API, e-mail pessoal ou caminho de pasta do computador na tela.
- [ ] Todas as imagens são capturas reais do site publicado. Conferir antes que as fichas citadas ainda mostram o mesmo texto.
- [ ] Na descrição do vídeo: link do site, link de `/correcoes` e link de `/dados`.

---

## 10. Glossário curto

**Empenho.** Reserva de parte do orçamento para uma despesa específica. Cria a obrigação de pagar, se as condições forem cumpridas. Empenhado não significa pago.

**Liquidação.** Verificação, com documentos, de que quem vai receber tem direito: por exemplo, que o serviço foi prestado ou o bem foi entregue.

**Pagamento.** Saída efetiva do dinheiro do caixa federal. Comprova que o recurso saiu, mas não comprova, sozinho, que a obra chegou à população.

**Restos a pagar (RAP).** Despesas empenhadas e não pagas até 31 de dezembro, que passam para os anos seguintes. Por isso o pagamento de uma emenda pode aparecer em outro ano.

**Pago total.** No RASTRO, a soma de "Pago" (no próprio ano) com "Restos a pagar pagos" (nos anos seguintes). É a mesma etapa em anos diferentes.

**Unidade gestora (UG).** O "endereço" administrativo dentro do governo que executa a despesa: um ministério, uma secretaria, um fundo. Quando o saldo muda de UG, os pagamentos passam a sair pela unidade nova.

**Nota de sistema.** Registro interno do sistema financeiro federal (SIAFI) usado para ajustes, como transferir um saldo de empenho para outra unidade ou registrar uma devolução.

**Ordem bancária.** O documento que efetiva o pagamento: é a ordem para o dinheiro sair da conta do governo e ir para quem vai receber.

**Snapshot.** Cópia exata de um arquivo oficial no dia em que foi baixado, guardada sem alterações e identificada por uma impressão digital (SHA-256). Permite refazer qualquer número do zero.
