# Rotina de atualização dos dados

O site publicado mostra cópias datadas das fontes oficiais. Esta rotina define quando e como trocar essas cópias por outras mais novas, sem perder a conferência que sustenta cada número (SPEC 06, T06.15).

## Quando atualizar

- **Uma vez por mês**, na primeira semana, para os arquivos da CGU (emendas e documentos de despesa) e do Transferegov.
- **Fora do ciclo**, quando a CGU avisar que corrigiu o arquivo, quando um órgão responder sobre um dos casos sem causa documentada ou quando chegar a resposta da CGE-CE sobre as emendas estaduais (SPEC 07).
- **Câmara, Senado e Alece**: junto com a atualização mensal. Mudança de partido ou de mandato entra por aqui.
- **Emendas estaduais**: quando o Ceará Transparente publicar um novo arquivo anual.

Se o mês passar sem atualização, o site continua correto para a data que mostra: o topo de cada página traz a data da extração em uso. Não há dado "em tempo real".

## Passo a passo

Todos os comandos rodam a partir da pasta `RASTRO/`. A chave `PORTAL_API_KEY` fica só no `.env` local.

1. **Baixar e carregar.** `python pipelines/run.py all` baixa as fontes, guarda as cópias brutas com SHA-256, recarrega o staging e gera os relatórios em `reports/`. Se a cópia da CGU for idêntica à anterior (mesmo SHA-256), o snapshot não muda e a atualização acaba aqui.
2. **Ler os relatórios.** Conferir `reports/cobertura-cgu-*`, `conferencia-amostral-*` e `conciliacao-documentos-*` do novo snapshot. Comparar com o anterior: número de emendas, anos cobertos, totais por etapa. Queda grande de cobertura ou mudança de esquema para a rotina até ser explicada.
3. **Conferir a amostra.** A planilha de conferência amostral do novo snapshot é gerada uma vez e não é sobrescrita. Conferir as linhas no Portal da Transparência e registrar o resultado.
4. **Revisar a fila.** `python pipelines/run.py prioridades` gera a nova fila de diferenças e lacunas. Comparar com a fila anterior: casos que sumiram, casos novos e casos que mudaram de valor.
5. **Atualizar o registro de investigação.** Em `pipelines/contracts/investigacao_casos.json`, trocar o campo `snapshot` pelo novo e revisar cada caso: manter o achado se ele continua igual, reescrever se o valor mudou, marcar `excluido` se a diferença sumiu, incluir os casos novos. O build publicado recusa gerar o site enquanto o `snapshot` do registro for diferente do pacote ativo.
6. **Ativar e congelar.** `python pipelines/run.py bundle` e depois `python pipelines/run.py publicar`. Emendas estaduais, quando houver arquivo novo: `python pipelines/run.py estaduais`.
7. **Testar.** `python -m unittest discover -s pipelines/tests`, `python -m unittest discover -s services/api/tests` e, em `apps/web`, `npm run typecheck` e `node --test scripts/*.test.mjs`.
8. **Gerar e publicar.** Em `apps/web`: `node scripts/build-publicado.mjs` (build completo, nunca `--skip-build` depois de mudar dados ou código). Recriar `dist/rastro/.vercel/project.json` e rodar `vercel deploy ../../dist/rastro --prod --archive=tgz --yes`.
9. **Smoke test em produção.** `python scripts/verify_web.py --url https://rastro-ruby.vercel.app --mode publicado`. Se falhar, voltar ao deploy anterior com `vercel promote <url do deploy anterior> --yes`.
10. **Registrar.** Nova linha em `CHECKLIST-PUBLICACAO.md` (data, snapshot, pacote, páginas, telas aprovadas) e entrada no `docs/CHANGELOG.md` com o que mudou nos números.

## O que nunca fazer numa atualização

- Publicar um snapshot novo com o registro de investigação do antigo.
- Somar ou comparar valores de snapshots diferentes como se fossem um só.
- Apagar a cópia bruta anterior: ela é a prova do que o site mostrou antes.
- Transformar em zero um dado que sumiu da fonte. Se um campo deixou de vir, a ficha mostra "Sem registro" e o motivo vai para o changelog.

## Lembrete

A rotina é manual. Um lembrete mensal pode ser agendado como tarefa local; ele só avisa, não roda o pipeline nem publica.
