# Imagens e créditos — uso responsável

## Política atual (v0.2): ilustração, não fotografia

O RASTRO usa **ilustração editorial desenhada** como linguagem visual principal (ver `DESIGN-SYSTEM.md` → Ilustração editorial e ADR-006). Motivos:

- Fotos genéricas de cidades ou de prédios públicos tendem a sugerir uma relação factual que o texto não sustenta ("esta foto registra este gasto").
- Ilustração permite explicar **mecanismos** (etapas, documentos, rastros) em vez de apenas ambientar.
- Evita imagens geradas por IA com aparência documental.

## Recursos incluídos

- `apps/web/components/Illustrations.tsx`: cenas `CaminhoArt`, `SertaoArt`, `CongressoArt`, `DocumentosArt` e spots dos pilares. **Vetores originais do projeto**, metáforas esquemáticas — não retratam lugares, pessoas ou fatos específicos.
- `apps/web/public/images/*-conceito.jpg`: imagens geradas por IA da v0.1. **Não são mais usadas na interface**; podem ser apagadas. Não devem ser reintroduzidas como prova visual.

## Exceção: retratos oficiais de parlamentares (aba Autores)

- Fonte: `urlFoto` da API de dados abertos da Câmara e `UrlFotoParlamentar` da API do Senado. Crédito: "Foto: Câmara dos Deputados" / "Foto: Senado Federal".
- Baixadas no pipeline para `raw_data/fotos/` com SHA-256 em `data/manifests/fotos.jsonl`; copiadas para `apps/web/public/fotos/` (fora do Git). O site não carrega imagens direto dos servidores oficiais.
- Mesmo tratamento para todos: preto e branco, recorte quadrado, sem filtros que alterem expressão. Nunca usar retrato em chamada de reportagem.

## Se uma reportagem precisar de fotografia documental

Fotografia entra apenas quando **documenta** algo da apuração (obra visitada, documento fotografado, local verificado), nunca como ambientação genérica. Nesse caso:

- [ ] Verificar autoria, licença, data e contexto original.
- [ ] Registrar URL do arquivo, URL da licença, alterações/corte e legenda factual.
- [ ] Crédito visível no formato `Foto: Autor / Veículo (licença)`.
- [ ] Alt text descreve elementos visuais, não presume pessoas ou fatos.
- [ ] Não escolher imagem de pessoa/órgão para sugerir irregularidade sem relação factual.

Fotos de arquivo com licença identificada (Wikimedia Commons, CC BY 2.0), mantidas como referência caso sejam necessárias:

1. **Skyline de Fortaleza**, Ricardo, 20/12/2008 — https://commons.wikimedia.org/wiki/File:Skyline_de_Fortaleza.jpg
2. **Sertão do Ceará (3154082820)**, Otávio Nogueira, 31/12/2008 — https://commons.wikimedia.org/wiki/File:Sert%C3%A3o_do_Cear%C3%A1_(3154082820).jpg
3. **Imagens de Brasília — Congresso Nacional (50060213016)**, Roque de Sá / Agência Senado, 04/02/2016 — https://commons.wikimedia.org/wiki/File:Imagens_de_Bras%C3%ADlia_-_Congresso_Nacional_(50060213016).jpg

## Checklist para novas ilustrações

- [ ] Usa só a paleta e as peças da biblioteca (`Doc`, `Lupa`, `Coin`, `Tag`, `Congresso`).
- [ ] Não desenha rosto/caricatura de pessoa real, logotipo, brasão ou símbolo partidário.
- [ ] Não sugere irregularidade (dinheiro sumindo, algemas, sacos de dinheiro) sem base factual publicada.
- [ ] `aria-label` descritivo e legenda com selo `ILUSTRAÇÃO`.
- [ ] Funciona recortada em 1:1, 4:3 e 16:10.
- [ ] Ilustradores externos: registrar autoria, contrato/licença e crédito `Ilustração: Nome`.
