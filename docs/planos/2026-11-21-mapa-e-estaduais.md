# Plano — emendas estaduais e nova aba Mapa (21/11/2026)

Situação: **pesquisa e plano, nada implementado no site** (exceto a frase da página Dados, abaixo). Nada publicado, nada commitado.

Feito hoje: `/dados` → "O que falta conferir" não cita mais revisão editorial (ADR-015). Registrado no CHANGELOG 0.8.0.

---

## 1. Emendas estaduais do Ceará

### O que a pesquisa achou

**Não precisa de LAI para começar.** O Ceará Transparente (CGE-CE) tem uma página própria, com arquivos para baixar:

- Página: https://cearatransparente.ce.gov.br/portal-da-transparencia/despesas/emendas-parlamentares
- CSV por ano (ISO-8859-1, separador `;`): `https://cearatransparente.ce.gov.br/files/downloads/integration/expenses/parliamentary_amendments/{ANO}/emendas_parlamentares_{ANO}.csv` (também `.xlsx`). Existem **2023, 2024, 2025 e 2026**; 2016–2022 dão 404. Última atualização exibida: 02/10/2026.
- Dicionário de dados (PDF): https://cearatransparente.ce.gov.br/files/downloads/transparency/dicionario/dicionario_de_dados_emendas.pdf
- Linhas por arquivo: 2023 = 25, 2024 = 83, 2025 = 51, 2026 = 37 (2026: R$ 19,47 mi segundo o painel).

**Colunas do CSV (lado do orçamento):** Exercício, Código da emenda, Parlamentar, Executivo, Caráter (ex.: `PCF`), Tipo (`INDIVIDUAL`…), Órgão, Unidade orçamentária, Esfera, Função, Subfunção, Programa, Ação (ex.: "Apoio financeiro para ações de saúde no Município de Apuiarés"), Tipo da ação, Região, Despesa, Grupo de despesa, Fonte, Fonte de detalhamento, ID de uso, Resultado primário, Valor emenda, Valor lei, Valor lei créditos.

**O CSV não traz a execução.** A tabela da página e a ficha de cada emenda trazem: **Beneficiário** (ex.: "PREF MUNIC DE TAMBORIL"), **Nº SACC**, **Objeto**, **Valor empenhado**, **Valor pago**, **Início da execução**. A ficha fica em `/portal-da-transparencia/despesas/emendas-parlamentares/{id}` (id interno sequencial, ex.: 656 = emenda 0507/2026). Ela é montada por JavaScript: buscar o HTML direto devolveu erro; no navegador abre normalmente.

**Contexto (reportagens, não fonte primária):**
- O Ceará é um dos 4 estados **sem emenda impositiva** estadual: o deputado indica, o Executivo decide se executa ([Diário do Nordeste](https://diariodonordeste.verdesmares.com.br/pontopoder/controle-do-orcamento-ceara-e-um-dos-4-estados-que-nao-possuem-emendas-impositivas-para-deputados-1.3692205)).
- O canal principal é o **Programa de Cooperação Federativa (PCF)**, criado em 2007. Desde 2021, por "transferência especial" fundo a fundo para as prefeituras (LC estadual 234/2021, alterada pela LC 243/2021; Decreto 34.096/2021). O valor citado é de cerca de R$ 1,65 mi por deputado e R$ 76 mi no total ([Diário do Nordeste](https://diariodonordeste.verdesmares.com.br/pontopoder/r-76-milhoes-ha-10-anos-deputados-brigam-para-tornar-obrigatoria-execucao-de-emendas-no-ceara-1.3692203)).
- O TCE-CE (Ofício Circular nº 17/2026, de 16/03/2026) passou a exigir, antes de qualquer gasto, o link público com autor, valor, objeto e localidade da emenda ([Diário do Nordeste](https://diariodonordeste.verdesmares.com.br/pontopoder/tce-ce-cria-aparato-de-monitoramento-de-emendas-parlamentares-lacunas-podem-gerar-bloqueios-em-2026-1.3751144)). Não achei painel público do TCE.
- dados.ce.gov.br respondeu 403. O PDF do Decreto 34.096 no site da CGE deu erro de certificado. Não foram lidos.

**Ponto de atenção.** 25 a 83 linhas por ano parece pouco perto de "R$ 76 mi para 46 deputados". Antes de publicar qualquer total, é preciso entender o que o arquivo cobre: só as emendas com execução? só o PCF? Hoje o projeto não sabe responder.

### Caminho recomendado

1. **Ingestão do CSV (lado do orçamento):** novo adaptador `pipelines/rastro/ce_estaduais.py`, com cópia bruta datada e SHA-256, como na CGU. A ingestão é reproduzível e simples.
2. **Execução (empenhado/pago/beneficiário):**
   - **A (preferido):** perguntar à CGE-CE, pelo Ceará Transparente (Acesso à Informação), se existe arquivo aberto com a execução e qual a cobertura. Pode ser só um pedido de esclarecimento.
   - **B:** coletar as fichas `/emendas-parlamentares/{id}` com navegador automatizado (Playwright, que o projeto já usa no `verify_web.py`). Seriam poucas centenas de páginas, com intervalo entre acessos e cópia guardada. É frágil (depende do layout) e precisa estar declarado na metodologia.
   - **C (plano B do B):** pedido LAI formal com o arquivo completo de execução.
3. **No site:** começar com uma página ou seção "Emendas estaduais" separada das federais. **Nunca somar** estaduais com federais. O ano e a etapa ficam separados. O beneficiário é a prefeitura, e ligar ao município IBGE pelo nome exige regra exata e revisão, como no SPEC 01.
4. **A cobertura vem primeiro:** só publicar totais depois de conferir com outra fonte (LOA/quadro de emendas, ou a resposta da CGE).

### Pedido pronto (Ceará Transparente → Acesso à Informação; prazo legal: 20 dias, prorrogáveis por mais 10)

> Assunto: Dados abertos de execução das emendas parlamentares estaduais (2023–2026)
>
> Com base na Lei nº 12.527/2011, solicito:
> 1. Arquivo em formato aberto (CSV ou XLSX) com a execução das emendas parlamentares estaduais de 2023 a 2026, uma linha por emenda, contendo: exercício, código/número da emenda, parlamentar, caráter (PCF ou outro), beneficiário (nome e CNPJ), município beneficiado (código IBGE, se houver), nº SACC, objeto, valor da emenda, valor empenhado, valor liquidado, valor pago e data da última atualização.
> 2. Os números das notas de empenho e das ordens bancárias vinculadas a cada emenda, se disponíveis.
> 3. Esclarecimento sobre a cobertura dos arquivos publicados em `cearatransparente.ce.gov.br/files/downloads/integration/expenses/parliamentary_amendments/{ano}/`: se incluem todas as emendas aprovadas na LOA de cada ano ou apenas parte delas (por exemplo, apenas as do PCF ou apenas as que já tiveram execução), e por que não há arquivos anteriores a 2023.
>
> Peço que, se algum item não estiver disponível, os demais sejam enviados no formato em que existirem.

*(Não foi enviado. Envie pelo seu perfil no Ceará Transparente.)*

### Spec (PLAN/TASKS)

Nova **SPEC 07 — Emendas estaduais do Ceará** (ou incremento da SPEC 01). Requisito novo: precisa entrar na spec antes de ter código.
- T07.01 Inventário: CSV 2023–2026, dicionário de dados, cobertura (com resposta da CGE).
- T07.02 Adaptador `ce_estaduais.py` (raw versionado, cp1252/iso-8859-1, centavos, testes de idempotência).
- T07.03 Execução: caminho A, B ou C, conforme a resposta da CGE.
- T07.04 Ligação beneficiário → município IBGE por nome exato normalizado, com revisão humana; sem ligação → `NULL`.
- T07.05 Ligação parlamentar → os 54 deputados da Alece já ingeridos (`pipelines/rastro/alece.py`), por nome exato e com revisão.
- T07.06 Página/seção pública + aviso "emenda estadual não é impositiva no Ceará".
- Aceites: nunca somar estadual com federal; ausência não vira zero; cobertura declarada na página.

---

## 2. Nova aba Mapa (`/mapa`)

### Problemas de hoje
1. Abre com "empenhado / liquidado / pago" sem dizer o que a pessoa ganha com isso.
2. A tabela por destinação lista todas as 184 cidades + "fora da contagem", sem resumo.
3. A busca fica dentro de um "explorador" com rótulos técnicos ("Explorador territorial", "Ficha municipal / emendas de …").
4. O mapa é um aviso "em preparação".

### Achado que muda o desenho
Pelo critério **localidade da emenda** (o atual), só **38 cidades** têm registro em 2025 (67 em 2024). A maior parte do dinheiro vem como "vários municípios" ou "estado". Pelo critério **aplicação do pagamento** (documentos de despesa), são **183 de 184** em 2025 (184 em 2024). Um mapa pela localidade ficaria quase em branco e passaria a impressão errada de que não chegou nada. **Proposta: o mapa usa "pago por aplicação"** e diz isso com todas as letras. A localidade da emenda segue na ficha e na tabela. Os dois critérios nunca se somam (regra que já existe).

### Estrutura proposta (de cima para baixo)
1. **Pergunta como título:** "Quanto dinheiro de emendas chegou à sua cidade?" + busca grande ("Digite sua cidade"), sem jargão.
2. **Mapa do Ceará** (SVG estático, verde-mata `--mata` em 5 tons, hachura para "sem registro", que não é zero). Clicar ou buscar uma cidade destaca e abre o resumo ao lado. Seletor de ano.
3. **Resumo da cidade em frases**, não em colunas:
   - "Em 2025, R$ X em emendas federais foram **pagos** em Tamboril, em N pagamentos."
   - "Quem indicou: [autores com ficha]. Para quê: [funções principais]."
   - "Ainda não pago: R$ Y empenhados (reservados) que não viraram pagamento." Com link "o que é empenho?" para o glossário.
   - Botão "Ver a ficha completa de Tamboril".
4. **Quadro "Fora do mapa":** "R$ Z foram para o estado inteiro ou para vários municípios sem divisão. Não dá para dizer em qual cidade foram usados." Um card, não linhas na tabela.
5. **Tabela completa recolhida:** `<details>` "Ver todos os 184 municípios em tabela", fechada por padrão, com ordenação por nome ou valor e o CSV. Ela continua no HTML (é a alternativa acessível do mapa, AC04), só fica recolhida.

### Mapa — como fazer
- Malha: **API de malhas do IBGE v3**, testada hoje. `https://servicodados.ibge.gov.br/api/v3/malhas/estados/23?formato=application/vnd.geo+json&intrarregiao=municipio&qualidade=minima` devolve 184 feições (propriedade `codarea` = código IBGE), 103 KB e cerca de 4 mil pontos.
- Gerar o SVG **no pipeline** (cópia da malha versionada + SHA-256), projetado e simplificado, e embutir os caminhos no build. Sem biblioteca de mapa e sem chamada externa: o site é estático e a CSP bloqueia conexões externas.
- Acessibilidade: cada município como `<path>` focável (teclado), com `aria-label` "Tamboril: R$ X pagos em 2025"; a busca e a tabela recolhida cobrem leitores de tela.
- **Protótipo pronto:** `docs/planos/prototipo-mapa-ceara.html` (abre direto no navegador). Usa dados reais de 2025 (pago por aplicação), tons de verde-mata e hachura para sem registro. Não é a página real.

### Spec (PLAN/TASKS) — SPEC 04
- T04.03 (mapa) passa a usar "pago por aplicação" como camada padrão; a localidade fica como opção ou na tabela. Requisito novo: atualizar a spec e registrar em ADR.
- T04.08 Malha IBGE no pipeline (`pipelines/rastro/malha.py`): download, hash e SVG simplificado.
- T04.09 Componente `MapaCeara` (SVG, foco por teclado, seletor de ano, legenda em quintis com "sem registro").
- T04.10 Resumo da cidade em linguagem simples (textos revisados contra o glossário).
- T04.11 Tabela recolhida + card "Fora do mapa".
- T04.12 Nova busca (combobox acessível, sem acento, por nome ou IBGE — reaproveitar a normalização do T04.02).
- Aceites novos: o mapa nunca pinta estado ou "vários municípios" sobre uma cidade; "sem registro" ≠ zero (hachura); a legenda diz o critério e o ano; teclado navega cidade a cidade; 360 px sem estouro.

---

## Decisões que dependem de você
1. **Mapa:** usar "pago por aplicação" como camada padrão? (recomendado: sim)
2. **Estaduais:** enviar o pedido à CGE-CE agora (caminho A) ou ir direto para a coleta das fichas (caminho B)?
3. **Ordem:** fazer primeiro o Mapa (só depende do que já temos) e depois as estaduais? (recomendado: sim)
