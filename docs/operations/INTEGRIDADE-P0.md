# Integridade P0 — itens 1 a 3

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

## Evidências

- 47 testes de pipeline + 4 de API passaram.
- 7 testes Node passaram: pacote válido, snapshot divergente, modo errado, documentos incompatíveis, estrutura inválida, valor inválido, arquivo alterado/ausente.
- Typecheck, build demo e regeneração de prévia passaram; prévia com 21 páginas e 455 links/assets locais válidos.
- `verify_web.py` em validação passou em 12 rotas × 1440/360px, teclado, navegação, export CSV e 404. Capturas/JSON em output/qa/validacao.
- Os 3.610.312 documentos foram relidos localmente; 64.250 documentos selecionados. Pacote real aceito pelo mesmo carregador usado no Next, com 1.910 fichas e 184 municípios.

Classificação atual das fichas: 1.744 conferem, 73 divergem e 93 não têm documento de pagamento. O relatório do recorte CE tem universo próprio de 1.796 emendas e não deve ser comparado diretamente a essas contagens. A ausência de pagamento não deve ser interpretada como irregularidade. Percentual fixo antigo removido da interface.

## Próxima prioridade: item 4

Revisar e explicar as divergências por snapshot, ano, modalidade e cobertura. A correção técnica não certifica a interpretação editorial de Pago/RAP nem aprova uma publicação oficial. O relatório regenerado registra a nova classificação; os registros históricos da amostra assinada foram preservados.
