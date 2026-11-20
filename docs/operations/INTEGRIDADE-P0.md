# Integridade P0 — itens 1 a 4

## Entregue

1. Seleção transacional por fonte de documentos, com histórico preservado e consultas pela view ativa em conciliação, aplicação e fichas. Rollback testado após exclusão de uma versão ativa seguida de arquivo inválido.
2. Totais incompletos nas fichas e agregados territoriais ficam null. Nenhum documento de pagamento é distinto de pagamento zero explícito. Novo estado `indisponivel` quando há documento mas faltam valores para comparar. Dados de empenho não autorizam conferência de pagamentos.
3. Pacote imutável dos quatro exports com snapshot principal comum, hashes de documentos e hashes dos arquivos. Estruturas, dinheiro e referências de fichas validados antes de ativar o ponteiro e novamente ao ler no Next. Um pacote inválido não usa exports avulsos ou demo silenciosamente.

## Migração / atualização

Com staging e raw já existentes, a partir de RASTRO:

```
python pipelines/run.py documentos
python pipelines/run.py export
python pipelines/run.py fichas
python pipelines/run.py bundle
```

`autores` precisa existir para o mesmo snapshot principal; caso contrário, executar esse passo antes das fichas. `all` agora termina em `bundle`. Arquivos avulsos continuam disponíveis para auditoria, mas o site de validação só carrega o pacote ativo. Reiniciar o Next/rebuild após ativar uma versão. Demo permanece padrão; não ativar validação em produção.

Nesta execução foi criada cópia de segurança em `tmp/p0-backup/rastro.sqlite` antes de reprocessar os sete ZIPs locais. Nenhum raw foi alterado. Staging, pacote e backup continuam fora do Git.

## Evidências dos itens 1 a 3

- 47 testes de pipeline + 4 de API passaram.
- 7 testes Node passaram: pacote válido, snapshot divergente, modo errado, documentos incompatíveis, estrutura inválida, valor inválido, arquivo alterado/ausente.
- Typecheck, build demo e regeneração de prévia passaram; prévia com 21 páginas e 455 links/assets locais válidos.
- `verify_web.py` em validação passou em 12 rotas × 1440/360px, teclado, navegação, export CSV e 404. Capturas/JSON em output/qa/validacao.
- Os 3.610.312 documentos foram relidos localmente; 64.250 documentos selecionados. Pacote real aceito pelo mesmo carregador usado no Next, com 1.910 fichas e 184 municípios.

Classificação atual das fichas: 1.744 conferem, 73 divergem e 93 não têm documento de pagamento. O relatório do recorte CE tem universo próprio de 1.796 emendas e não deve ser comparado diretamente a essas contagens. A ausência de pagamento não deve ser interpretada como irregularidade. Percentual fixo antigo removido da interface.

## Item 4 — revisão técnica da conciliação

A comparação pura de pagamento agora é compartilhada entre fichas e auditoria (ADR-012). O relatório anterior classificava 85 emendas só com empenho como divergências de pagamento. A emenda 202337100002 também era comparada com apenas parte das linhas, embora os documentos se refiram ao código inteiro: considerando as localidades MÚLTIPLO e outra UF, o total de R$ 10.551.497,99 confere. Essa mudança não transfere valores de outra UF para agregados territoriais do CE.

- Todas as fichas: 1.744 iguais de 1.817 comparáveis (96,0%); 73 diferenças (57 abaixo, 12 acima e 4 iguais apenas a Pago); 93 sem documento de pagamento.
- Recorte CE: 1.645 iguais de 1.711 comparáveis (96,1%); 66 diferenças; 85 sem pagamento documental. Total do universo: 1.796 códigos.
- Das 93 sem pagamento documental, 11 têm total positivo na emenda e 82 têm total zero. As 11 lacunas com valor positivo estão listadas separadamente; nenhuma ausência recebe selo de conferência.
- Empenho possui denominador próprio: 1.773/1.910 nas fichas e 1.675/1.796 no CE. A falta ou incompletude de pagamento não impede sua comparação.

Relatório versionado: `reports/revisao-conciliacao-2026-11-19-ed93842c.md`, com cobertura por ano/modalidade e lista completa de diferenças e lacunas positivas. A matriz local JSON/CSV em `data/validacao/conciliacao-2026-11-19-ed93842c.*` preserva hashes e referências às linhas sem identidades de favorecidos. Os valores das fichas foram confrontados 1.910/1.910 com a matriz; hashes e fontes do pacote ativo conferem. Pacote: `ea6ce34de045f5bbbb0468a3dea2196428b34995b09c1172ec8892fefa6155a5`.

Para refazer a revisão sem reler os ZIPs:

```
python pipelines/run.py conciliacao
```

`documentos` e `all` também geram essa auditoria. Não foi atribuída causa às 73 diferenças ou às 11 lacunas positivas. O relatório contém as referências para reabrir cada caso e o procedimento de revisão. Pago total continua uma convenção operacional dos campos da fonte; os textos deixaram de afirmar uma divisão temporal universalmente confirmada. A amostra manual assinada foi preservada.

### Verificação deste incremento

- `python -m unittest discover -s pipelines/tests -q`: 53 testes; regressões de escopo, empenho sem pagamento, incompletude, diferenças de um centavo, parcelas negativas e ausência versus zero no CSV.
- Sete testes Node do pacote e typecheck passaram. Build demo e prévia estática passaram; 21 páginas e 455 referências locais válidas.
- `python scripts/verify_web.py --url http://localhost:3012`: 28 telas (14 rotas em 1440/360px), sem overflow ou erro de página; CSV, teclado, links e 404 passaram. Fichas divergentes e sem pagamento têm verificações específicas. O snapshot real não contém status indisponivel, portanto esse estado permanece coberto por testes sintéticos.
- Capturas reais em `output/qa/validacao`; inspeção visual da ficha em 360px e do rótulo “Sem documento de pagamento”. Layout e tipografia preservados. Revisão React: alterações textuais, sem novos hooks, dependências ou fronteiras cliente/servidor.

## Próxima prioridade: P1.5

Definir o modo de publicação com aprovação explícita de snapshots/recortes e bloqueio de conteúdo não aprovado. Investigar as 73 diferenças e as 11 lacunas positivas, ou excluí-las explicitamente de um recorte revisado. A revisão técnica não substitui aprovação editorial nem libera os dados oficiais para publicação.

## Fechamento da retomada — 19/11/2026

- Reconferência somente leitura do staging: as 1.910 fichas coincidem com a matriz local em status, Pago, RAP pagos, pago total e total documental. Os dois universos reproduzem as contagens desta revisão; JSON, CSV e relatório detalhado foram regenerados em diretório temporário e são idênticos aos artefatos atuais.
- Os quatro arquivos do pacote ativo conferem com seus hashes. Os oito snapshots brutos utilizados conferem com o manifesto; banco, manifesto, ponteiro, exports do pacote e amostra assinada tiveram seus hashes preservados (16 arquivos protegidos).
- SHA-256 da amostra assinada: `1490893971282af5696cac2275866eee76d34c13463ed35ffec828bf8be84238`. Evidências locais em `output/qa/fechamento/{inputs-before,integridade}.json`.
- Verificações executadas na retomada: 53 testes de pipeline, 4 de API, 7 de pacote Node, fixture demo e TypeScript aprovados. Nenhuma alteração funcional foi feita depois desses testes.
- `DATA_MODE=demo npm run preview:static` executou o build de produção e regenerou a prévia. `python scripts/verify_preview.py`: 21 páginas demonstrativas e 455 referências locais válidas.
- `python scripts/verify_web.py --url http://127.0.0.1:3012 --mode validacao`: 28 telas, em 1440/360px, sem overflow ou erros de página; busca por teclado, CSV dos dois critérios, navegação e 404 aprovados. Resultado em `output/qa/validacao/resultados.json`. Capturas móveis dos estados divergente e sem pagamento foram inspecionadas.
- Corrigido o prefixo indevido no título do relatório resumido; documentação inicial passou a distinguir dados demo da integração local em validação, e evidências anteriores foram identificadas como históricas.

O fechamento técnico preserva o snapshot e o design. Não houve nova aquisição de dados, merge ou deploy; as diferenças e lacunas continuam sem causa confirmada ou aprovação editorial.

### Fila de prioridades da investigação

`python pipelines/run.py prioridades` gerou 84 casos únicos: 11 de cobertura ausente, 4 diferenças de pelo menos R$ 1 milhão, 25 de R$ 100 mil a menos de R$ 1 milhão e 44 menores. Destes, 76 são do recorte CE. A soma de R$ 5.765.287,31 informada pela fonte nos casos sem pagamento documental permanece separada dos R$ 15.794.204,97 de diferenças absolutas calculáveis.

Os 59 testes do pipeline passaram, incluindo seis regressões novas da triagem. A comparação independente com a matriz original confirmou seleção completa, grupos, posições, sinais, somas e preservação de null. Os 16 arquivos protegidos da reconferência anterior continuam com os mesmos hashes. Evidências locais em `output/qa/prioridades/resultados.json`.

Aplicação iniciada localmente em `http://localhost:3012`, com `DATA_MODE=validacao` e `NEXT_DIST_DIR=.next-validacao`. Home e as 84 fichas da fila responderam HTTP 200 com o aviso de validação; resultado dos links em `output/qa/prioridades/links.json`. Um erro transitório de compilação inicial da ficha foi reconferido com sucesso antes da verificação integral dos links. O servidor permanece ativo para consulta local; logs em `tmp/local-server/`.

### Documento-base complementar do vídeo

`python scripts/generate_base_doc.py` gerou o documento-base de 8 páginas com as capturas da verificação atual. O texto identifica o snapshot `ed93842c`, os grupos de testes e a convenção de Pago + RAP, mantendo pendentes as causas das diferenças e a revisão editorial. A evolução de infraestrutura é apresentada como futura; o checklist de gravação preserva o snapshot revisado.

As 8 páginas foram inspecionadas visualmente; extração de texto, limites de página, termos financeiros e presença das capturas passaram. PDF em `output/pdf/rastro-documento-base.pdf`, renders em `tmp/pdfs/base/` e resultado/checksum em `output/qa/fechamento/pdf.json`. Esses artefatos continuam fora do Git; o gerador e as instruções de reprodução estão versionados. O roteiro complementar de 15 cenas foi preservado.
