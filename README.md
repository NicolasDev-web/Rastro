# RASTRO — o dinheiro público tem um caminho

**Investigação cidadã independente, com dados abertos, sobre emendas parlamentares federais destinadas ao Ceará.**

> Status: **publicado em https://rastro-ruby.vercel.app** (modo `publicado`, ADR-015), com os dados oficiais do snapshot `ed93842c` (extração de 19/11/2026). O site declara que é uma investigação cidadã e que pode conter erros; o modo demonstração continua existindo para desenvolvimento, sempre com aviso de dados fictícios.
>
> O nome **RASTRO** é provisório: verificar disponibilidade de marca e domínio antes de divulgação ampla.

## Comece aqui (ordem sugerida)

1. Leia [`docs/00-COMECE-AQUI.md`](docs/00-COMECE-AQUI.md), a visão do produto e o fluxo de trabalho SDD.
2. Confira [`docs/specs/00-CONSTITUICAO.md`](docs/specs/00-CONSTITUICAO.md): regras editoriais e técnicas que **não podem ser violadas**.
3. Abra [`preview/index.html`](preview/index.html) no navegador — prévia estática de todas as páginas, gerada a partir do site (`npm run preview:static` em `apps/web`).
4. Se tiver Node.js 20+ e acesso ao npm, execute:
   ```bash
   cd apps/web
   npm install
   npm run dev
   ```
   Acesse `http://localhost:3000`. Sem `DATA_MODE`, o site usa apenas **dados fictícios declarados** (modo demo).
5. **Dados reais (em validação):** `python pipelines/run.py all` baixa a CGU, o IBGE e as listas da Câmara/Senado, gera relatórios em `reports/` (cobertura, conferência amostral, vínculo de autores, conciliação com documentos de despesa) e os exports em `data/validacao/`. A planilha de conferência amostral, uma vez gerada, nunca é sobrescrita. Depois, `cd apps/web` e rode `DATA_MODE=validacao npm run dev` (no PowerShell: `$env:DATA_MODE="validacao"; npm run dev`). Nunca publique esse modo. Para revisar o staging ativo sem reler os ZIPs: `python pipelines/run.py conciliacao`; gera relatório completo em `reports/revisao-conciliacao-*.md` e matriz local JSON/CSV com diferenças e lacunas de cobertura.
6. Para explorar API demonstrativa: `cd services/api && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000`.
7. Para validar contrato mínimo do pipeline: `python pipelines/validate/check_fixture.py` a partir da raiz do repositório.
8. Siga a sequência de specs SDD: `01-dados` → `02-design` → `03-reportagem` → `04-exploradores` → `05-apuracao` → `06-publicacao`.

## Conteúdo do repositório

- `apps/web/`: site Next.js + TypeScript: home, investigação, mapa dos municípios, fichas de emenda e de município, autores, emendas estaduais, fluxos, reportagens, fontes, glossário, páginas institucionais e galeria de componentes (só em demo).
- `preview/`: HTML/CSS/JS independente de dependências externas para apresentar o conceito visual.
- `apps/web/components/Illustrations.tsx`: ilustrações editoriais vetoriais originais (colagem/risografia). `apps/web/public/images/` guarda as imagens IA da v0.1, **não mais usadas**.
- `docs/design/`: tokens, diretrizes UX, componentes, créditos e referências para substituir por fotografias reais.
- `docs/specs/`: Constituição SDD, features, tasks, critérios de aceite, testes e Definition of Done.
- `docs/editorial/`: manual editorial, plano de estreia, pauta investigativa, checklist de direito de resposta.
- `docs/sources/`: lista de fontes oficiais verificadas, plano de aquisição e limitações.
- `docs/architecture/`: arquitetura, modelo e contratos, segurança e decisões.
- `db/migrations/001_initial.sql`: base relacional e proveniência.
- `data/fixtures/`: registros artificiais, não evidência factual.
- `services/api/`, `pipelines/`: esqueleto técnico demonstrável e validação inicial.

## Decisões fechadas

- Marca de trabalho: **RASTRO**.
- Recorte de lançamento: **emendas federais com destinação identificável ao Ceará**.
- Período inicial desejado: **2020–2026**, condicionado a validação efetiva da cobertura por ano, modalidade e fonte.
- Abertura: **grande reportagem visual + pesquisa por município integrada**.
- Regionalização do dado: **não contar automaticamente como Fortaleza qualquer recurso destinado ao governo estadual**.
- Dados reais: publicados a partir de snapshot conferido e conciliado (ADR-014 e ADR-015); a atualização segue `docs/operations/ATUALIZACAO-DADOS.md`.

## Limitações honestas do pacote

- O site publicado não passou por revisão editorial independente (SPEC 03, T03.05). As diferenças entre fontes aparecem nas fichas e não são prova de irregularidade.
- Os dados do modo demonstração e da prévia offline são inteiramente fabricados; os dados oficiais em validação ficam separados e fora do Git.
- O mapa de `/mapa` usa a malha oficial do IBGE (ADR-017). As ilustrações de mapa nas aberturas são esquemáticas.
- As ilustrações são metáforas esquemáticas desenhadas em código e não devem ser lidas como prova visual de locais ou fatos políticos.
- Build demonstrativo, testes e navegação foram verificados; comandos, resultados e limites estão em [`docs/operations/INTEGRIDADE-P0.md`](docs/operations/INTEGRIDADE-P0.md).
- Não inclua os dados simulados no deploy publicado: o build publicado recusa páginas com aviso de demo ou validação.

## Licenciamento e autoria

Documentação e código de exemplo: MIT (ver `LICENSE`). Ilustrações: vetores originais do protótipo, sem vinculação com pessoas ou fatos. Para fotografia documental, utilize imagens verificadas com licença adequada e crédito (referências em `docs/design/IMAGENS-E-CREDITOS.md`).

## Segurança editorial

Não publique acusações automatizadas, etiquetas de culpa, rankings de conduta política nem comparações sem denominadores claros. Toda afirmação verificável deve ter `source_id`, `source_url`, carimbo de extração, metodologia e acesso ao documento original. Evidência ausente não é evidência de irregularidade.

## Site publicado

Investigação cidadã independente com os dados oficiais do snapshot aprovado (ADR-015). Para gerar e publicar:

```bash
python pipelines/run.py publicar          # cópia congelada e conferida do pacote ativo
cd apps/web && node scripts/build-publicado.mjs
vercel deploy ../../dist/rastro --prod --archive=tgz   # um só envio: o plano gratuito limita 5.000 arquivos/dia
```

O deploy é só pela CLI: o `vercel.json` da raiz desliga a publicação automática a cada push no GitHub (ADR-020). Para trocar os dados, siga [`docs/operations/ATUALIZACAO-DADOS.md`](docs/operations/ATUALIZACAO-DADOS.md).

## Fila local de investigação

Com o staging e o pacote ativo compatíveis, `python pipelines/run.py prioridades` gera o ranking de trabalho em `reports/prioridades-conciliacao-*.md`, com links às fichas locais, e matrizes JSON/CSV em `data/validacao/`. A fila prioriza cobertura ausente e diferenças por magnitude, sem alterar os dados ou aprovar publicação. Ver [ordem no backlog](docs/05-BACKLOG-EXECUCAO.md#ordem-de-investigação-das-lacunas--snapshot-ed93842c).

## Materiais internos para vídeo

- Roteiro de 15 cenas: [`docs/editorial/ROTEIRO-VIDEO.md`](docs/editorial/ROTEIRO-VIDEO.md), com PDF local em `output/pdf/rastro-roteiro-video.pdf`.
- Documento-base complementar: `python scripts/generate_base_doc.py` gera `output/pdf/rastro-documento-base.pdf` e renders para revisão em `tmp/pdfs/base/`. Usa ReportLab, PyMuPDF e FontTools com Brotli, além das fontes locais e capturas em `output/qa/validacao/`.
- Para atualizar as capturas, iniciar o site local em validação e executar `python scripts/verify_web.py --url http://127.0.0.1:3012 --mode validacao`. O documento usa os números do snapshot `ed93842c`; trocar os dados exige reconferir os textos e números antes de regerar.

Os PDFs, capturas e renders são artefatos locais ignorados pelo Git. Os materiais mantêm o aviso de validação e não representam aprovação de publicação.
