# RASTRO — o dinheiro público tem um caminho

**Projeto híbrido de jornalismo investigativo e inteligência de dados sobre emendas parlamentares federais destinadas ao Ceará.**

> Status: **kit de implementação e protótipo funcional em modo DEMONSTRAÇÃO**. Não é uma investigação concluída, não contém números oficiais consolidados e não deve ser publicado como se fosse informação apurada.
>
> Pacote preparado em 19/11/2026. Nome **RASTRO** é provisório: verificar disponibilidade de marca e domínio antes de divulgação.

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
   Acesse `http://localhost:3000`. O site usa apenas **dados fictícios declarados**.
5. **Dados reais (em validação):** `python pipelines/run.py all` baixa a CGU, o IBGE e as listas da Câmara/Senado, gera relatórios em `reports/` (cobertura, conferência amostral, vínculo de autores, conciliação com documentos de despesa) e os exports em `data/validacao/`. A planilha de conferência amostral, uma vez gerada, nunca é sobrescrita. Depois, `cd apps/web` e rode `DATA_MODE=validacao npm run dev` (no PowerShell: `$env:DATA_MODE="validacao"; npm run dev`). Nunca publique esse modo. Para revisar o staging ativo sem reler os ZIPs: `python pipelines/run.py conciliacao`; gera relatório completo em `reports/revisao-conciliacao-*.md` e matriz local JSON/CSV com diferenças e lacunas de cobertura.
6. Para explorar API demonstrativa: `cd services/api && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000`.
7. Para validar contrato mínimo do pipeline: `python pipelines/validate/check_fixture.py` a partir da raiz do repositório.
8. Siga a sequência de specs SDD: `01-dados` → `02-design` → `03-reportagem` → `04-exploradores` → `05-apuracao` → `06-publicacao`.

## Conteúdo do ZIP

- `apps/web/`: exemplo Next.js + TypeScript, homepage editorial, investigação, mapa demonstrativo, perfis, fluxos, reportagens, fontes, galeria de componentes.
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
- Dados reais: somente após auditoria, conciliação e revisão editorial.

## Limitações honestas do pacote

- O front-end possui integração local com os dados da CGU em **modo validação**, ainda sem publicação oficial ou revisão editorial independente.
- Os dados do modo demonstração e da prévia offline são inteiramente fabricados; os dados oficiais em validação ficam separados e fora do Git.
- O arquivo de mapa é uma **ilustração vetorial esquemática** e **não substitui a malha oficial IBGE**.
- As ilustrações são metáforas esquemáticas desenhadas em código e não devem ser lidas como prova visual de locais ou fatos políticos.
- Build demonstrativo, testes e navegação foram verificados; comandos, resultados e limites estão em [`docs/operations/INTEGRIDADE-P0.md`](docs/operations/INTEGRIDADE-P0.md).
- Não inclua os dados simulados em um deploy que possa ser confundido com uma publicação jornalística oficial.

## Licenciamento e autoria

Documentação e código de exemplo: MIT (ver `LICENSE`). Ilustrações: vetores originais do protótipo, sem vinculação com pessoas ou fatos. Para fotografia documental, utilize imagens verificadas com licença adequada e crédito (referências em `docs/design/IMAGENS-E-CREDITOS.md`).

## Segurança editorial

Não publique acusações automatizadas, etiquetas de culpa, rankings de conduta política nem comparações sem denominadores claros. Toda afirmação verificável deve ter `source_id`, `source_url`, carimbo de extração, metodologia e acesso ao documento original. Evidência ausente não é evidência de irregularidade.

## Materiais internos para vídeo

- Roteiro de 15 cenas: [`docs/editorial/ROTEIRO-VIDEO.md`](docs/editorial/ROTEIRO-VIDEO.md), com PDF local em `output/pdf/rastro-roteiro-video.pdf`.
- Documento-base complementar: `python scripts/generate_base_doc.py` gera `output/pdf/rastro-documento-base.pdf` e renders para revisão em `tmp/pdfs/base/`. Usa ReportLab, PyMuPDF e FontTools com Brotli, além das fontes locais e capturas em `output/qa/validacao/`.
- Para atualizar as capturas, iniciar o site local em validação e executar `python scripts/verify_web.py --url http://127.0.0.1:3012 --mode validacao`. O documento usa os números do snapshot `ed93842c`; trocar os dados exige reconferir os textos e números antes de regerar.

Os PDFs, capturas e renders são artefatos locais ignorados pelo Git. Os materiais mantêm o aviso de validação e não representam aprovação de publicação.
